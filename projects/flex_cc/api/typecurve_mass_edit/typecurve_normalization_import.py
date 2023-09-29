import collections
import re
from typing import TYPE_CHECKING, Any, Optional, Union
import numpy as np
from bson import ObjectId
from api.typecurve_mass_edit.well_headers_abbreviated import normalization_bases, orginal_custom_header_dict, well_p
from combocurve.services.type_curve.type_curve_service import TypeCurveService
from combocurve.services.type_curve.tc_normalization_data_models import (
    BaseDocument,
    StepsDocument,
    TypeCurveNormalizationDocument,
    TypeCurveNormalizationWellDocument,
)
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.shared.feature_toggles.forecast_toggles import use_normalization_v2
from combocurve.shared.constants import PHASES

if TYPE_CHECKING:
    from apps.flex_cc.api.context import Context

PPL = 'perf_lateral_length'
FPW = 'first_prop_weight'
FFV = 'first_fluid_volume'
NORMALIZATION_TYPE = 'normalization_type'

OP_CHAIN_BASE_DISPATCH = {
    (
        'perf_lateral_length',
        'eur',
    ):
    'eur_pll',
    (
        'first_prop_weight/perf_lateral_length',
        'eur/perf_lateral_length',
    ):
    'prop/pll_eur/pll',
    (
        'first_fluid_volume/perf_lateral_length',
        'eur/perf_lateral_length',
    ):
    'fluid/pll_eur/pll',
    (
        'first_prop_weight/perf_lateral_length/hz_well_spacing_same_zone',
        'eur/perf_lateral_length/hz_well_spacing_same_zone',
    ):
    'prop/pll/hz',
    (
        'first_fluid_volume/perf_lateral_length/hz_well_spacing_same_zone',
        'eur/perf_lateral_length/hz_well_spacing_same_zone',
    ):
    'fluid/pll/hz',
    (
        'first_prop_weight/acre_spacing',
        'eur/acre_spacing',
    ):
    'prop/acre',
    (
        'first_fluid_volume/acre_spacing',
        'eur/acre_spacing',
    ):
    'fluid/acre',
    ('perf_lateral_length', 'peak_rate'):
    "peak_pll"
}


def get_number(input_dict, key, error_list, row_index):
    if key != 'eur':
        error_dict = {'error_message': f'{key} is not a number', 'row_index': row_index}
        num = input_dict.get(key)
        if num is None:
            error_list.append(error_dict)
            return None
        else:
            try:
                ret_float = float(num)
                if np.isnan(ret_float):
                    error_list.append(error_dict)
                    return None
                else:
                    return True
            except Exception:
                error_list.append(error_dict)
                return None
    return True


class TypeCurveNormalization:
    def __init__(self, context):
        self.context: Context = context

    def check_normaliztion_header(self, typecurve_df, required_header, normalization_header):
        if NORMALIZATION_TYPE in typecurve_df.columns:
            required_header += normalization_header

    def interpret_label(self, label: str) -> Optional[dict[str, Union[str, list[dict[str, str]]]]]:
        '''Forms dict in the format of opChainDocument from label.
        Args:
            label: A string of the form <header><op><header><op><header>... always beginning and ending w/ header.
        Returns:
            A dictionary in the format of an opChainDocument, or None.
        '''
        if not label:
            return None
        ops = re.split(r'(\W)', label)
        start_feature = ops[0]
        op_chain = []
        i = 1
        while i < len(ops) - 1:
            op_chain.append({'op': ops[i], 'opFeature': ops[i + 1]})
            i += 2
        return {'startFeature': start_feature, 'opChain': op_chain}

    def get_base_key(self, x_label: str, y_label) -> str:
        '''Interprets a x_ and y_chain labels into the proper key from the db.'''
        if not x_label or not y_label:
            return None
        base_key = OP_CHAIN_BASE_DISPATCH.get((x_label, y_label))
        if base_key is None:
            # The only way this happens is if the norm is coming from a custom header.
            base_key = 'eur_vs_numerical'
        return base_key

    def check_normalization_bases(self, x_label, y_label, n_type):
        if n_type == 'no_normalization':
            return True

        legal = False
        if y_label == 'eur' and x_label in normalization_bases[y_label]:
            legal = True
        else:
            if x_label in normalization_bases and y_label in normalization_bases[x_label]:
                legal = True
        return legal

    def get_target_header_names(self, x_chain: Optional[dict[str, Any]], y_chain: Optional[dict[str, Any]]):
        target_header_names = set()
        for chain in (x_chain, y_chain):
            if chain is None:
                continue
            target_header_names.add(chain['startFeature'])
            for item in chain['opChain']:
                target_header_names.add(item['opFeature'])
        target_header_names.discard('eur')
        return target_header_names

    def check_tc_n_phase(self, df_phase_fit, customerized_headers, error_message):
        flag = True
        has_normalization = False
        x_chain = y_chain = base_key = None
        if NORMALIZATION_TYPE in df_phase_fit.columns:
            n_type = df_phase_fit[NORMALIZATION_TYPE].dropna().unique().tolist()
            n_type = [nt for nt in n_type if nt]
            if len(n_type) > 1:
                error_message.append({
                    'error_message': 'Normalization type must be unique for each phase',
                    'row_index': 0
                })
                flag = False
            elif len(n_type) == 1:
                this_type = n_type[0]
                if this_type not in ['no_normalization', 'linear', '1_to_1', 'power_law_fit']:
                    error_message.append({
                        'error_message': f'{this_type} normalization type is not supported.',
                        'row_index': 0
                    })
                    flag = False

                normalization_first_row = df_phase_fit[df_phase_fit[NORMALIZATION_TYPE] == this_type].iloc[0]

                x_label = y_label = x_label_original = y_label_original = None
                if type(normalization_first_row['x_label']) == str:
                    x_label = normalization_first_row['x_label'].lower().strip()
                    x_label_original = normalization_first_row['x_label'].strip()
                if type(normalization_first_row['y_label']) == str:
                    y_label = normalization_first_row['y_label'].lower().strip()
                    y_label_original = normalization_first_row['y_label'].strip()

                x_label = self.custom_header_to_db_header(x_label, x_label_original, customerized_headers)
                y_label = self.custom_header_to_db_header(y_label, y_label_original, customerized_headers)

                legal_bases = self.check_normalization_bases(x_label, y_label, this_type)

                if not legal_bases:
                    flag = False
                    error_message.append({
                        'error_message': 'The format of x_label and/or y_label is not legal.',
                        'row_index': 0
                    })
                else:
                    x_chain = self.interpret_label(x_label)
                    y_chain = self.interpret_label(y_label)
                    base_key = self.get_base_key(x_label, y_label)

                    if this_type == 'linear':
                        for key in ['slope', 'intercept']:
                            if not get_number(normalization_first_row, key, error_message, 0):
                                flag = False

                        target_header_names = self.get_target_header_names(x_chain, y_chain)
                        for key in target_header_names:
                            if not get_number(normalization_first_row, key, error_message, 0):
                                flag = False

                    flag = self.check_power_law_fit(this_type, normalization_first_row, error_message, x_chain, y_chain,
                                                    flag)

                    if flag:
                        has_normalization = True

        return flag, has_normalization, x_chain, y_chain, base_key

    def check_power_law_fit(self, this_type, normalization_first_row, error_message, x_chain, y_chain, prev_flag):
        flag = prev_flag
        if this_type == 'power_law_fit':
            slope_flag = get_number(normalization_first_row, 'slope', error_message, 0)
            intercept_flag = get_number(normalization_first_row, 'intercept', error_message, 0)
            coefficient_flag = get_number(normalization_first_row, 'coefficient', error_message, 0)
            exponent_flag = get_number(normalization_first_row, 'exponent', error_message, 0)

            if not ((coefficient_flag and exponent_flag) or (slope_flag and intercept_flag)):
                flag = False
            else:
                count = 0
                for f in [slope_flag, intercept_flag, coefficient_flag, exponent_flag]:
                    if not f:
                        count += 1
                for _ in range(count):
                    error_message.pop()

            target_header_names = self.get_target_header_names(x_chain, y_chain)
            for key in target_header_names:
                if not get_number(normalization_first_row, key, error_message, 0):
                    flag = False

        return flag

    #check if target phase has a normalization first, if so, update the related fit.
    # If not, create a new normalization collection
    def update_normalization_collection(self, has_normalization, df_phase_fit, phase, tc_id, x_chain, y_chain, base_key,
                                        update_tc_normalizations):
        if has_normalization:

            n_type = df_phase_fit[NORMALIZATION_TYPE].dropna().unique().tolist()
            n_type = [nt for nt in n_type if nt][0]
            normalization_first_row = df_phase_fit[df_phase_fit[NORMALIZATION_TYPE] == n_type].iloc[0]
            base = {'key': base_key, 'x': x_chain, 'y': y_chain}
            target_header_names = self.get_target_header_names(x_chain, y_chain)
            targets = {
                name: float(normalization_first_row[name])
                for name in target_header_names if name in normalization_first_row
            }

            if n_type == 'linear':
                a_value = float(normalization_first_row['slope'])
                b_value = float(normalization_first_row['intercept'])

            elif n_type == 'power_law_fit':
                if normalization_first_row.get('coefficient') and normalization_first_row.get('exponent'):
                    a_value = float(normalization_first_row['coefficient'])
                    b_value = float(normalization_first_row['exponent'])
                else:
                    a_value = float(normalization_first_row['slope'])
                    b_value = float(normalization_first_row['intercept'])

            elif n_type == '1_to_1':
                a_value = b_value = None

            elif n_type == 'no_normalization':
                a_value = b_value = None
                targets = {}
                base = BaseDocument().dict()

            else:
                raise Exception('Normalization type must be linear, power_law_fit, 1_to_1, or no_normalization.')

            if use_normalization_v2():
                document_input = {
                    'typeCurve': ObjectId(tc_id),
                    'phase': phase,
                    'steps': {
                        'eur': {
                            'aValue': a_value,
                            'bValue': b_value,
                            'target': targets,
                            'type': n_type,
                            'base': base
                        }
                    }
                }

            else:
                document_input = {
                    'typeCurve': ObjectId(tc_id),
                    'phase': phase,
                    'steps': [{
                        'aValue': a_value,
                        'bValue': b_value,
                        'target': targets,
                        'type': n_type,
                        'base': base
                    }]
                }

            norm_document = TypeCurveNormalizationDocument.parse_obj(document_input)
            update_tc_normalizations.append(norm_document)

    def update_df_custom_headers(self, typecurve_df):
        customerized_headers = {}
        custom_headers = self.context.custom_header_configurations_collection.find_one({})

        if custom_headers:
            for key in orginal_custom_header_dict:
                if custom_headers.get(key) and orginal_custom_header_dict[key] != custom_headers[key]['label']:
                    customerized_headers[custom_headers[key]['label']] = key

        if customerized_headers:
            typecurve_df.rename(columns=customerized_headers, inplace=True)

        return customerized_headers

    def custom_header_to_db_header(self, label, label_original, customerized_headers):
        if label_original in customerized_headers:
            label = customerized_headers[label_original]
        return label

    def get_new_normalization_multipliers(self, get_new_normalizations):
        tc_ids = list(map(ObjectId, get_new_normalizations))
        match = {'_id': {'$in': tc_ids}}
        sort = {'_id': 1}
        project = {'_id': 1, 'normalizations': 1, 'wells': 1}

        tc_pipeline = [{'$match': match}, {'$sort': sort}, {'$project': project}]
        tc_collections = list(self.context.type_curves_collection.aggregate(tc_pipeline))

        tc_normalizations = []
        tc_normalizations_dict = {}
        tc_normalizations_wells = {}

        type_curve_service = TypeCurveService(self.context)
        tc_well_eur = {}
        self.get_tc_well_eur(type_curve_service, tc_well_eur, get_new_normalizations)

        for tc in tc_collections:
            for normalization_fit in tc['normalizations']:
                tc_normalizations_dict[str(normalization_fit)] = str(tc['_id'])
                tc_normalizations.append(normalization_fit)
                tc_normalizations_wells[str(normalization_fit)] = tc['wells']

        all_wells = []
        wells_tc_id = collections.defaultdict(set)

        for tc in tc_collections:
            if tc['wells']:
                all_wells += tc['wells']
                for well in tc['wells']:
                    wells_tc_id[str(well)].add(str(tc['_id']))

        match_well = {'_id': {'$in': all_wells}}
        well_pipeline = [{'$match': match_well}, {'$project': well_p}]
        tc_well_collections = list(self.context.wells_collection.aggregate(well_pipeline))

        #key tc_id, values: well_headers in this tc
        tc_normalization_well_headers = collections.defaultdict(list)

        for wells_collection in tc_well_collections:
            for tc_id in wells_tc_id[str(wells_collection['_id'])]:
                wells_collection.update(tc_well_eur[tc_id].get(str(wells_collection['_id'])))
                tc_normalization_well_headers[tc_id].append(wells_collection)

        tc_normalization_steps = self.context.tc_normalization_service.get_normalization_steps(
            list(get_new_normalizations.keys()), PHASES)
        self.update_normalization_wells_collection(tc_normalization_steps, get_new_normalizations,
                                                   tc_normalization_well_headers)

    def get_tc_well_eur(self, type_curve_service, tc_well_eur, get_new_normalizations):
        for tc_id in get_new_normalizations:
            tc_document = self.context.type_curves_collection.find_one({'_id': ObjectId(tc_id)})
            if tc_document:
                tc_rep_res = type_curve_service.tc_rep_init({'tc_id': tc_id, 'items': ['eur']})
                for tc_well in tc_rep_res:
                    if str(tc_id) not in tc_well_eur:
                        tc_well_eur[str(tc_id)] = {}
                    this_eur = tc_well.get('eur')
                    for phase in this_eur:
                        this_eur[phase + '_eur'] = this_eur.pop(phase)
                    if this_eur:
                        tc_well_eur[str(tc_id)][tc_well['well_id']] = this_eur

    def update_normalization_wells_collection(self, tc_normalization_steps: dict[str, dict[str, StepsDocument]],
                                              get_new_normalizations, tc_normalization_well_headers):
        #TODO: Need to implement 2-factor. This should be done simultaneously with exporter improvement.
        updates = []
        for tc_id, phase_steps in tc_normalization_steps.items():
            headers = tc_normalization_well_headers[tc_id]
            for phase, steps in phase_steps.items():
                if phase not in get_new_normalizations[tc_id]:
                    continue
                else:
                    if steps.eur.base.y.startFeature == 'eur':
                        steps.eur.base.y.startFeature = phase + '_eur'
                    headers = tc_normalization_well_headers[tc_id]
                    multipliers = TypeCurveNormalizationService.calculate_norm_multipliers(steps, headers=headers)
                    for i, header in enumerate(headers):
                        well_id = header['_id']
                        well_mults = {'eur': multipliers['eur'][i], 'qPeak': 1}
                        updates.append(
                            TypeCurveNormalizationWellDocument(phase=phase,
                                                               typeCurve=ObjectId(tc_id),
                                                               well=ObjectId(well_id),
                                                               multipliers=well_mults,
                                                               nominalMultipliers=well_mults))
        if len(updates) > 0:
            self.context.tc_normalization_service.bulk_normalization_wells_update(updates, upsert=True)
