## apply typecurve
from collections import defaultdict
from typing import TYPE_CHECKING, Any, Dict, Iterable, List, Optional, Union
import numpy as np
import pandas as pd
from bson import ObjectId
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.type_curve.TC_helper import calc_tc_eur
from combocurve.services.type_curve.tc_normalization_data_models import StepsDocument
from combocurve.services.type_curve.tc_normalization_service import TypeCurveNormalizationService
from combocurve.services.type_curve.tc_apply_helper import (get_eur, lookup_table_get_tc_phase_combinations,
                                                            get_TC_reapply_dict, get_reapply_pipeline,
                                                            tc_reapply_edge_case_checking_and_update,
                                                            find_segments_peak)
from combocurve.shared.mongo_utils import put_items_together
from combocurve.shared.constants import PROBABILISTIC_STR, DETERMINISTIC_STR
from combocurve.science.type_curve.normalization_two_factors import apply_normalization_to_segments
if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext

multi_seg = MultipleSegments()
PHASES = ['oil', 'gas', 'water']


class MissingParamsError(Exception):
    expected = True


# TODO: This service has grown out of scope. Needs a refactoring so that it can support:
# (i) Saving to the db.
# (ii) Returning segments (for manual edit page).
# (iii) The econ use case.
# (iv) Apply and reapply in a more sane way.


class TypeCurveApplyService(object):
    def __init__(self, context):
        self.context: APIContext = context

    def generte_tc_application_info(self, params):
        ## scan through all TC and all scheduling in the project
        ## well_ids -> {
        # well_FPDs: {header1, header2, header3},
        # scheduling_FPDs: {sche1:, sche2, sche3},
        # TCs: {TC1: multipliers: {oil: , gas:, water:}}
        # }
        well_ids = list(map(ObjectId, params['well_ids']))
        project_id = ObjectId(params['project_id'])

        headers = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': well_ids
                    }
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }]))

        scheduling_outputs = list(
            self.context.schedule_well_outputs_collection.aggregate([{
                '$match': {
                    'well': {
                        '$in': well_ids
                    },
                    'project': project_id
                }
            }, {
                '$lookup': {
                    'from': 'schedules',
                    'localField': 'schedule',
                    'foreignField': '_id',
                    'as': 'schedule_info'
                }
            }, {
                '$project': {
                    'well': 1,
                    'schedule': 1,
                    'FPD': {
                        '$ifNull': ['$output.FPD', None]
                    },
                    'schedule_info': {
                        '$arrayElemAt': ['$schedule_info', 0]
                    }
                }
            }, {
                '$group': {
                    '_id': '$well',
                    'schedule': {
                        '$push': '$schedule'
                    },
                    'FPD': {
                        '$push': '$FPD'
                    },
                    'name': {
                        '$push': '$schedule_info.name'
                    }
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }]))

        tc_ids = list(
            self.context.type_curves_collection.aggregate([{
                '$match': {
                    'project': project_id
                }
            }, {
                '$project': {
                    '_id': 1
                }
            }]))
        tc_ids = [x['_id'] for x in tc_ids]

        fit_data = {}
        norm_data = {}
        for _id in tc_ids:
            fit_data[_id], norm_data[_id] = self._get_norm_and_fit_data(str(_id), PHASES)

        sorted_header_scheduling = put_items_together({
            'headers': headers,
            'scheduling': scheduling_outputs
        }, {
            'headers': '_id',
            'scheduling': '_id'
        }, well_ids)

        tc_multipliers = [{str(tc_id): {phase: 1
                                        for phase in PHASES}
                           for tc_id in tc_ids} for _ in range(len(well_ids))]

        for tc_id in tc_ids:
            for phase in PHASES:
                fit_doc = fit_data[tc_id].get(phase, {})
                apply_normalization = fit_doc.get('normalize')
                P_dict = fit_doc.get('P_dict')
                if apply_normalization:
                    steps = norm_data[tc_id].get('phase', StepsDocument())
                    target_eur = calc_tc_eur(P_dict)['best']
                    steps.eur.target[steps.eur.base.y.startFeature] = target_eur
                    multipliers = TypeCurveNormalizationService.calculate_norm_multipliers(steps, headers, 'inverse')
                    eur_mults = multipliers['eur']
                    q_peak_mults = multipliers['qPeak']
                    for i in range(len(well_ids)):
                        eur_mult = None if eur_mults is None else eur_mults[i]
                        q_peak_mult = None if q_peak_mults is None else q_peak_mults[i]
                        tc_multipliers[i][str(tc_id)][phase] = {'eur': eur_mult, 'qPeak': q_peak_mult}

        ret = {}
        for i, well_id in enumerate(well_ids):
            this_header_scheduling = sorted_header_scheduling[i]
            this_header = this_header_scheduling['headers']
            for k, v in this_header.items():
                if type(v) is ObjectId:
                    this_header[k] = str(this_header)

            this_scheduling = this_header_scheduling.get('scheduling')
            if this_scheduling:
                this_scheduling = [{
                    'schedule_id': str(schedule_id),
                    'name': this_scheduling['name'][i],
                    'FPD': this_scheduling['FPD'][i]
                } for i, schedule_id in enumerate(this_scheduling['schedule'])]
            else:
                this_scheduling = []

            this_multiplier = tc_multipliers[i]
            this_well = {'header': this_header, 'scheduling': this_scheduling, 'multiplier': this_multiplier}

            ret[str(well_id)] = this_well
        return ret

    def apply_tc(self, apply_params):
        notification_status = 'complete'
        notification_description = 'Complete'
        notification_id = apply_params.get('notification_id')
        is_manual_editing = apply_params.get('is_manual_editing', False)
        try:
            if apply_params.get('lookup_table_id_str') is not None:
                headers = self._get_project_headers(apply_params.get('project_id'), apply_params.get('well_ids'))
                update_list, applied_forecast_parent_type = self._apply_tc_using_lookup_table(apply_params, headers)
            else:
                update_list, applied_forecast_parent_type, manual_segments = self._apply_tc_without_lookup_table(
                    apply_params)

            if applied_forecast_parent_type is not None and not is_manual_editing:
                {
                    PROBABILISTIC_STR: self.context.forecast_service,
                    DETERMINISTIC_STR: self.context.deterministic_forecast_service
                }[applied_forecast_parent_type].write_forecast_data_to_db(update_list)

        except Exception as e:
            notification_status = 'failed'
            notification_description = 'Failed'
            manual_segments = {}
            raise e
        finally:
            if notification_id is not None:
                self.context.notification_service.update_notification_with_notifying_target(
                    notification_id, {
                        'status': notification_status,
                        'description': notification_description
                    })
            if is_manual_editing:
                return manual_segments
            return 'complete'

    def reapply_tc(self, reapply_params):
        # {
        #     'forecast_id_str': None,
        #     'tc_id_str': None,
        #     'well_ids_str': None,
        #     'update_typecurve_only': True
        # }
        forecast_id_str = reapply_params.get('forecast_id_str')
        tc_id_str = reapply_params.get('tc_id_str')
        well_ids_str = reapply_params.get('well_ids_str')
        update_typecurve_only = reapply_params.get('update_typecurve_only')
        if not (forecast_id_str is not None and tc_id_str is None):
            return 'success'

        notification_status = 'complete'
        notification_description = 'Complete'
        notification_id = reapply_params.get('notification_id')
        try:
            forecast_id = ObjectId(forecast_id_str)
            forecast_document = self.context.forecasts_collection.find_one({'_id': forecast_id}, {'type': 1})
            forecast_collection = forecast_document.get('type', PROBABILISTIC_STR)

            pipeline = get_reapply_pipeline(forecast_id_str, forecast_collection, tc_id_str, well_ids_str,
                                            update_typecurve_only)
            phase_datas = list({
                PROBABILISTIC_STR: self.context.forecast_datas_collection,
                DETERMINISTIC_STR: self.context.deterministic_forecast_datas_collection
            }.get(forecast_collection).aggregate(pipeline))

            ### clean up phase_datas
            for i, phase_data in enumerate(phase_datas):
                phase_tc_apply_setting = phase_data.get('typeCurveApplySetting')
                phase_datas[i] = tc_reapply_edge_case_checking_and_update(phase_tc_apply_setting, phase_data['well'],
                                                                          phase_data['forecast'], phase_data['phase'],
                                                                          phase_data['typeCurve'])

            clean_phase_datas = [v for v in phase_datas if v]
            if len(clean_phase_datas) == 0:
                return 'success'
            clean_phase_datas_df = pd.DataFrame(clean_phase_datas)
            groups = list(clean_phase_datas_df.groupby(['forecast', 'tc_id', 'apply_normalization', 'series']))

            probabilistic_updates = []
            deterministic_updates = []
            for (forecast_id, tc_id, apply_normalization, series), group_df in groups:
                phases = group_df['phase'].unique()
                forecasts, cums_and_last_prods = self._get_eur_data(str(forecast_id), group_df['well'], phases)
                fit_data, norm_data = self._get_norm_and_fit_data(str(tc_id), phases)
                fit_doc: dict[str, Any] = fit_data['fits']
                rate_phases, ratio_phases = _get_rate_ratio_phases(phases, fit_doc)
                for phase in rate_phases + ratio_phases:
                    phase_group = group_df[group_df['phase'] == phase]
                    group_fpds = pd.DataFrame(columns=['well', 'FPD', 'risk_factor'])
                    unique_fpd_sources = phase_group['fpd_source'].unique()
                    for this_fpd_source in unique_fpd_sources:
                        filter_mask = phase_group['fpd_source'] == this_fpd_source
                        this_well_ids = phase_group.loc[filter_mask, 'well'].tolist()
                        if this_fpd_source == 'fixed':
                            this_fixed_dates = phase_group.loc[filter_mask, 'fixed_date'].astype(int).tolist()
                        else:
                            this_fixed_dates = None

                        this_scheduling_ids = phase_group.loc[filter_mask, 'scheduling_id'].tolist()
                        this_fpd = self._get_fpd(this_fpd_source, this_well_ids, this_fixed_dates, this_scheduling_ids)
                        group_fpds = pd.concat([group_fpds, this_fpd['valid']], axis=0)
                        group_fpds = pd.concat([group_fpds, this_fpd['invalid']], axis=0)

                    ## sort group_df and group_fpds and merge
                    sorted_group_df = phase_group.sort_values('well')
                    sorted_group_fpds = group_fpds.sort_values('well')
                    if (np.array(sorted_group_df['well']) == np.array(sorted_group_fpds['well'])).all():
                        sorted_group_df['FPD'] = np.array(sorted_group_fpds['FPD'])

                    sorted_group_df = sorted_group_df.reset_index()
                    invalid_mask = np.isnan(np.array(sorted_group_df['FPD'], dtype=float))
                    valid_fpds = sorted_group_df.loc[~invalid_mask, :]
                    invalid_fpds = sorted_group_df.loc[invalid_mask, :]

                    phase_fit_doc = fit_data['fits'][phase]
                    tc_fit_type = phase_fit_doc['fitType']
                    tc_P_dict = phase_fit_doc.get('P_dict')
                    tc_ratio_P_dict = phase_fit_doc.get('ratio_P_dict')
                    steps = norm_data.get(phase, StepsDocument())
                    normalize_warning = (fit_doc.get(phase, {}).get('normalize', False) is
                                         False) and (apply_normalization is True)
                    apply_normalization = (fit_doc.get(phase, {}).get('normalize', False) and apply_normalization
                                           and (steps is not None))

                    forecast_document = self.context.forecasts_collection.find_one({'_id': forecast_id})
                    applied_forecast_parent_type = forecast_document['type']
                    risk_factor_map = {
                        str(x['well']): x['risk_factor'] if type(x['risk_factor']) in [int, float] else 1
                        for _, x in phase_group.iterrows()
                    }
                    (group_valid_bulk_list, group_invalid_bulk_list, applied_forecast_parent_type,
                     _) = self._generate_bulk_lists(forecast_id, phase, tc_fit_type, tc_P_dict, tc_ratio_P_dict,
                                                    valid_fpds, invalid_fpds, None, applied_forecast_parent_type,
                                                    series, risk_factor_map, forecasts, cums_and_last_prods, True,
                                                    steps, apply_normalization, normalize_warning)

                    {
                        PROBABILISTIC_STR: probabilistic_updates,
                        DETERMINISTIC_STR: deterministic_updates
                    }[applied_forecast_parent_type] += group_valid_bulk_list + group_invalid_bulk_list

            if len(probabilistic_updates):
                self.context.forecast_service.write_forecast_data_to_db(probabilistic_updates)

            if len(deterministic_updates):
                self.context.deterministic_forecast_service.write_forecast_data_to_db(deterministic_updates)

        except Exception as e:
            notification_status = 'failed'
            notification_description = 'Failed'
            raise e
        finally:
            if notification_id is not None:
                self.context.notification_service.update_notification_with_notifying_target(
                    notification_id, {
                        'status': notification_status,
                        'description': notification_description
                    })
            return 'success'

    def _apply_tc_without_lookup_table(self, params):
        update_list = []
        applied_forecast_parent_type = None
        forecasts, cums_and_last_prods = self._get_eur_data(**params)
        fit_data, norm_data = self._get_norm_and_fit_data(**params)
        fit_doc: dict[str, Any] = fit_data['fits']
        rate_phases, ratio_phases = _get_rate_ratio_phases(**params, fit_doc=fit_doc)

        for p in rate_phases + ratio_phases:
            # No need to group manual segments since only one phase is applied at a time in the editing page
            phase_update_list, applied_forecast_parent_type, manual_segments = self._apply_tc_for_phase({
                **params, 'phase':
                p,
                'risk_factor':
                params.get('phase_risk_factors', {}).get(p, 1),
                'forecasts':
                forecasts,
                'cums_and_last_prods':
                cums_and_last_prods,
                'fit_data':
                fit_doc[p],
                'steps':
                norm_data.get(p)
            })
            update_list += phase_update_list
        return update_list, applied_forecast_parent_type, manual_segments

    def _apply_tc_using_lookup_table(self, params, project_headers_data, econ=False, update_eur=True):
        lookup_table_id_str = params['lookup_table_id_str']
        phase = params['phase']
        lookup_table = self.context.forecast_lookup_tables_collection.find_one({'_id': ObjectId(lookup_table_id_str)})

        well_id_s = list(map(ObjectId, params['well_ids']))
        well_headers = self._lookup_table_get_well_headers(well_id_s, lookup_table)
        if project_headers_data:
            for header in well_headers:
                header.update(project_headers_data.get(header['_id'], {}))
        ################################
        for well in well_headers:
            well.update({'assigned': False})

        tc_phase_combinations = lookup_table_get_tc_phase_combinations(lookup_table, well_headers, phase, params)
        ################
        write_list = []
        applied_forecast_parent_type = None
        for this_tc_phase in tc_phase_combinations:
            phase_independent_doc = next(iter(this_tc_phase.values()))
            if update_eur:
                forecasts, cums_and_last_prods = self._get_eur_data(**(phase_independent_doc | {'phase': phase}))
            else:
                forecasts = cums_and_last_prods = None
            fit_data, norm_data = self._get_norm_and_fit_data(**(phase_independent_doc | {'phase': phase}))
            fit_doc: dict[str, Any] = fit_data['fits']
            rate_phases, ratio_phases = _get_rate_ratio_phases(**params, fit_doc=fit_doc)
            for p in rate_phases + ratio_phases:
                tc_phase_params = this_tc_phase[p]
                tc_phase_params.update({
                    'forecasts': forecasts,
                    'cums_and_last_prods': cums_and_last_prods,
                    'fit_data': fit_doc[p],
                    'steps': norm_data.get(p)
                })

                update_list, applied_forecast_parent_type, _ = self._apply_tc_for_phase(
                    tc_phase_params, econ, update_eur)
                write_list += update_list
        return write_list, applied_forecast_parent_type

    def _lookup_table_get_well_headers(self, well_id_s, lookup_table):
        header_items = []
        for rule in lookup_table.get('rules', []):
            for cond in rule['filter'].get('conditions', []):
                if cond['value'] != '':
                    header_items += [cond['key']]
        unique_header_items = set(header_items)
        header_project = {header: 1 for header in unique_header_items}
        header_project['_id'] = 1

        well_headers = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': well_id_s
                    }
                }
            }, {
                '$project': header_project
            }, {
                '$sort': {
                    '_id': 1
                }
            }]))
        return well_headers

    def _apply_tc_for_phase(self, params, econ=False, update_eur=True):
        if params is None:
            raise MissingParamsError
        try:
            forecast_id = ObjectId(params['forecast_id'])
            phase = params['phase']
            well_ids = list(map(ObjectId, params['well_ids']))
            apply_normalization = params['apply_normalization']
            fpd_source = params['fpd_source']
            scheduling_id = ObjectId(params['scheduling_id'])
            fixed_date = params['fixed_date']
            applySeries = params['series']
            risk_factor = params['risk_factor']
            forecasts = params['forecasts']
            cums_and_last_prods = params['cums_and_last_prods']
            fit_data = params['fit_data']
            steps = params['steps']
            fit_type = fit_data['fitType']
            P_dict = fit_data.get('P_dict')
            ratio_P_dict = fit_data.get('ratio_P_dict')

            if fpd_source not in [
                    'first_prod_date', 'first_prod_date_daily_calc', 'first_prod_date_monthly_calc', 'schedule', 'fixed'
            ]:
                raise Exception('FPD source is not valid')

            if fpd_source == 'fixed' and type(fixed_date) is not int:
                raise Exception('The fixed date is not valid')

            if fpd_source == 'schedule' and (params['scheduling_id'] is None):
                raise Exception('The scheduling_id is not valid')

        except Exception:
            raise MissingParamsError

        if (fit_type is None) or (fit_type == 'rate' and P_dict is None) or (fit_type == 'ratio'
                                                                             and ratio_P_dict is None):
            if econ:
                return [], DETERMINISTIC_STR

            forecast_document = self.context.forecasts_collection.find_one({'_id': ObjectId(forecast_id)})
            applied_forecast_parent_type = forecast_document['type']  ## use to determine the collection
            return [], applied_forecast_parent_type

        normalize_warning = (fit_data.get('normalize', False) is False) and (apply_normalization is True)
        apply_normalization = fit_data.get('normalize', False) and apply_normalization and (steps is not None)

        fpds = self._get_fpd(fpd_source, well_ids, fixed_date, scheduling_id)
        valid_fpds = fpds['valid']
        invalid_fpds = fpds['invalid']

        if econ:
            applied_forecast_parent_type = DETERMINISTIC_STR
        else:
            forecast_document = self.context.forecasts_collection.find_one({'_id': forecast_id})
            applied_forecast_parent_type = forecast_document['type']  ## use to determine the collection

        risk_factor_map = {str(_id): risk_factor for _id in well_ids}
        valid_bulk_list, invalid_bulk_list, applied_forecast_parent_type, manual_segments = self._generate_bulk_lists(
            forecast_id, phase, fit_type, P_dict, ratio_P_dict, valid_fpds, invalid_fpds, params,
            applied_forecast_parent_type, applySeries, risk_factor_map, forecasts, cums_and_last_prods, update_eur,
            steps, apply_normalization, normalize_warning)

        return valid_bulk_list + invalid_bulk_list, applied_forecast_parent_type, manual_segments

    def _get_fpd(self, fpd_source, well_ids, fixed_date, scheduling_id):
        if fpd_source in ['first_prod_date', 'first_prod_date_daily_calc', 'first_prod_date_monthly_calc']:
            fpd_pipeline = [{
                '$match': {
                    '_id': {
                        '$in': well_ids
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'well': '$_id',
                    'FPD': '$' + fpd_source
                }
            }]
            fpds = pd.DataFrame(list(self.context.wells_collection.aggregate(fpd_pipeline)))
            missing_wells = np.setdiff1d(np.array(well_ids), np.array(fpds['well'])).tolist()
            if 'FPD' in fpds.columns:
                valid_fpds = fpds.loc[~fpds['FPD'].isna(), :].copy()
                valid_fpds.loc[:, 'FPD'] = (np.array(valid_fpds['FPD']).astype('datetime64[D]')
                                            - np.datetime64('1900-01-01')).astype(int)
                invalid_wells = np.array(fpds.loc[fpds['FPD'].isna(), 'well']).tolist() + missing_wells
            else:
                valid_fpds = pd.DataFrame(columns=['well', 'FPD'])
                invalid_wells = well_ids
        elif fpd_source == 'fixed':
            if type(fixed_date) is int:
                fpd_dict = {'well': well_ids, 'FPD': [fixed_date] * len(well_ids)}
            elif type(fixed_date) is list:  ## for batch fixed fpd
                fpd_dict = {'well': well_ids, 'FPD': fixed_date}
            fpds = pd.DataFrame(fpd_dict)
            valid_fpds = fpds
            invalid_wells = []
        elif fpd_source == 'schedule':
            if type(scheduling_id) == ObjectId:
                match = {'schedule': scheduling_id, 'well': {'$in': well_ids}}
            elif type(scheduling_id) == list:
                match = {'$or': [{'well': well_ids[i], 'schedule': scheduling_id[i]} for i in range(len(well_ids))]}
            fpd_pipeline = [{'$match': match}, {'$project': {'well': 1, 'FPD': '$output.FPD'}}]
            fpds = pd.DataFrame(list(self.context.schedule_well_outputs_collection.aggregate(fpd_pipeline)))
            if 'well' in fpds.columns:
                missing_wells = np.setdiff1d(np.array(well_ids), np.array(fpds['well'])).tolist()
            else:
                missing_wells = np.array(well_ids).tolist()

            if 'FPD' in fpds.columns:
                valid_fpds = fpds.loc[~fpds['FPD'].isna(), :].copy()
                invalid_wells = np.array(fpds.loc[fpds['FPD'].isna(), 'well']).tolist() + missing_wells
            else:
                valid_fpds = pd.DataFrame(columns=['well', 'FPD'])
                invalid_wells = well_ids

        invalid_fpds = pd.DataFrame({'FPD': [None] * len(invalid_wells), 'well': invalid_wells})
        return {'valid': valid_fpds, 'invalid': invalid_fpds}

    def _get_headers(self, well_ids, header_names):
        project_mask = {header_name: 1 for header_name in header_names}
        project_mask['_id'] = 1
        header_pipelines = [{'$match': {'_id': {'$in': well_ids}}}, {'$project': project_mask}]
        headers = list(self.context.wells_collection.aggregate(header_pipelines))
        return headers

    def _valid_update(
            self,
            x,  # x[0] is well_id, x[1] is P_dict, x[2] is ratio
            forecast_id,
            phase,
            eur_ratio,
            applied_forecast_parent_type,
            tcFitType,
            tc_phase_param,
            calc_eur=False,
            cum=None,
            last_prod_idx=None,
            base_segs=None,
            warning={
                'status': False,
                'message': ''
            }):
        [well_id, P_dict, ratio] = x
        update_dict = {
            'well_id': well_id,
            'forecast_id': forecast_id,
            'phase': phase,
            'forecasted': True,
            'warning': warning,
            'data_freq': None
        }
        if tc_phase_param is not None:
            update_dict.update(get_TC_reapply_dict(tc_phase_param))

        if applied_forecast_parent_type == PROBABILISTIC_STR:
            get_update_body = self.context.forecast_service.get_update_body
            update_dict.update({'P_dict': P_dict, 'forecastType': 'typecurve', 'p_extra': {'eur_ratio': eur_ratio}})
        elif applied_forecast_parent_type == DETERMINISTIC_STR:
            get_update_body = self.context.deterministic_forecast_service.get_update_body
            if tcFitType == 'rate':
                update_dict.update({'P_dict': P_dict, 'forecastType': 'rate', 'forecastSubType': 'typecurve'})
            elif tcFitType == 'ratio':
                update_dict.update({'ratio': ratio, 'forecastType': 'ratio', 'forecastSubType': 'typecurve'})

        eur_info = {'calc_eur': calc_eur, 'cum': cum, 'last_prod_idx': last_prod_idx, 'base_segs': base_segs}
        update_dict.update(eur_info)

        ret = get_update_body(**update_dict)
        return ret

    def _invalid_update(self, well_id, forecast_id, phase, warning_message, applied_forecast_parent_type,
                        tc_phase_param):
        if applied_forecast_parent_type == PROBABILISTIC_STR:
            get_update_body = self.context.forecast_service.get_update_body
        elif applied_forecast_parent_type == DETERMINISTIC_STR:
            get_update_body = self.context.deterministic_forecast_service.get_update_body

        update_dict = {
            'well_id': well_id,
            'forecast_id': forecast_id,
            'phase': phase,
            'warning': {
                'status': True,
                'message': warning_message
            }
        }
        if tc_phase_param is not None:
            update_dict.update(get_TC_reapply_dict(tc_phase_param))

        ret = get_update_body(**update_dict)
        return ret

    # Keep this because we might need to use in the future
    # def _get_tc_well_multipliers(self, headers, tc, multipliers):

    #     tc_id = tc['tc_id']
    #     phase = tc['phase']

    #     target_well_ids = {}
    #     for i in range(len(headers)):
    #         target_well_ids[str(headers[i]['_id'])] = i

    #     match = {'typeCurve': ObjectId(tc_id), 'phase': phase}
    #     well_normalizations = list(self.context.type_curve_normalization_wells_collection.aggregate([{
    #         '$match': match
    #     }]))

    #     tc_well_multipilers = {}

    #     for well in well_normalizations:
    #         this_multiplier = well.get('multipliers', [])
    #         if len(this_multiplier) == 1 and this_multiplier[0]:
    #             tc_well_multipilers[str(well['well'])] = this_multiplier[0]

    #     replace_idx = []
    #     replace_multipliers = []

    #     for well_id in tc_well_multipilers:
    #         if well_id in target_well_ids:
    #             replace_idx.append(target_well_ids[well_id])
    #             replace_multipliers.append(tc_well_multipilers[well_id])

    #     if replace_idx:
    #         multipliers[replace_idx] = replace_multipliers

    #     return multipliers

    def _get_normalization_result(self, valid_fpds, target_eur, target_q_peak, steps: StepsDocument,
                                  apply_normalization: bool, normalize_warning: bool):
        warning = {'status': False, 'message': ''}

        if apply_normalization:
            header_names = steps.get_all_headers()
            headers = self._get_headers(valid_fpds['well'].tolist(), header_names)
            valid_ids = pd.DataFrame(headers)['_id'].tolist()
            normalization_factors = steps.normalizationType
            if 'eur' in normalization_factors and steps.eur.type != 'no_normalization':
                steps.eur.target[steps.eur.base.y.startFeature] = target_eur
            # TODO: We really need to move to qPeak. Leaving now so we don't have to change utils.
            if 'q_peak' in steps.normalizationType and steps.qPeak.type != 'no_normalization':
                steps.qPeak.target[steps.qPeak.base.y.startFeature] = target_q_peak
            multipliers = TypeCurveNormalizationService.calculate_norm_multipliers(steps, headers, 'inverse')
        else:
            multipliers = {
                'eur': np.ones(valid_fpds.shape[0], dtype=float),
                'qPeak': np.ones(valid_fpds.shape[0], dtype=float)
            }

            if normalize_warning:
                warning = {
                    'status':
                    True,
                    'message':
                    'The applied type curve did not use normalization when being generated, '
                    'so normalization is not applied on the well.'
                }
            valid_ids = valid_fpds['well'].to_list()
        return valid_ids, multipliers, warning

    def _generate_bulk_lists(self,
                             forecast_id,
                             phase,
                             tc_fit_type,
                             tc_P_dict,
                             tc_ratio_P_dict,
                             valid_fpds,
                             invalid_fpds,
                             tc_phase_param,
                             applied_forecast_parent_type,
                             TC_series='best',
                             risk_factor_map=None,
                             forecasts=None,
                             cums_and_last_prods=None,
                             update_eur=True,
                             steps=None,
                             apply_normalization=False,
                             normalize_warning=False):
        all_ids = valid_fpds['well'].tolist() + invalid_fpds['well'].tolist()
        if tc_fit_type == 'ratio' and applied_forecast_parent_type == PROBABILISTIC_STR:
            ratio_to_prob_message = 'Try to apply ratio TC fit to probabilistic forecast'
            bulk_list = list(
                map(
                    lambda x: self._invalid_update(x, forecast_id, phase, ratio_to_prob_message,
                                                   applied_forecast_parent_type, tc_phase_param), all_ids))
            return [], bulk_list, applied_forecast_parent_type

        if tc_fit_type is None:
            missing_tc_message = 'The previously applied TC has been deleted, no updates applied'
            bulk_list = list(
                map(
                    lambda x: self._invalid_update(x, forecast_id, phase, missing_tc_message,
                                                   applied_forecast_parent_type, tc_phase_param), all_ids))
            return [], bulk_list, applied_forecast_parent_type

        if applied_forecast_parent_type == PROBABILISTIC_STR:
            p_series_list = ['P10', 'P50', 'P90', 'best']
        else:
            p_series_list = [TC_series]

        def add_segments_diagonistics(x):
            for k, v in x.items():
                x[k] = {'segments': v, 'diagnostics': {}}
            return x

        if valid_fpds.shape[0] > 0:
            if tc_fit_type == 'rate':
                use_P_dict = tc_P_dict
                _apply_normalization = apply_normalization
            else:
                use_P_dict = tc_ratio_P_dict
                _apply_normalization = False
            eur_ratio, eur_dict = get_eur(use_P_dict)

            selected_series = TC_series
            selected_segments = use_P_dict.get(selected_series, {}).get('segments')
            if not selected_segments:
                selected_series = 'best'

            target_q_peak, _ = find_segments_peak(use_P_dict.get(selected_series, {}).get('segments', None))
            valid_ids, multipliers, warning = self._get_normalization_result(valid_fpds, eur_dict[selected_series],
                                                                             target_q_peak, steps, _apply_normalization,
                                                                             normalize_warning)

            if tc_fit_type == 'rate':
                base_phase = None
                if risk_factor_map is not None:
                    risk_factors = np.array([risk_factor_map.get(str(_id), 1) for _id in valid_ids])
                    _apply_risk_factors(risk_factors, multipliers)
                P_collection = {}
                for p in p_series_list:
                    this_segments = tc_P_dict[p]['segments']
                    delta_index = np.array(
                        valid_fpds['FPD']) - this_segments[0]['start_idx'] if len(this_segments) else 0
                    segments_list, warnings_two_factor = _get_segments_list(this_segments, delta_index, multipliers,
                                                                            steps, eur_dict[selected_series],
                                                                            target_q_peak, _apply_normalization)
                    if applied_forecast_parent_type == PROBABILISTIC_STR:
                        if segments_list:
                            P_collection[p] = segments_list
                        else:
                            P_collection[p] = [[] for _ in range(valid_fpds.shape[0])]
                    else:
                        P_collection['best'] = segments_list

                P_dict_update_s = list(map(add_segments_diagonistics, pd.DataFrame(P_collection).to_dict('records')))
                # HACK: There is only one item in p_series list at a time in manual editing, and segments_list always
                # comes out as a list of length 1 if there are segments.
                if len(segments_list) > 0:
                    manual_segments = {p: segments_list[0]}
                else:
                    manual_segments = {}
                ratio_update_s = [None for i in range(valid_fpds.shape[0])]
            elif tc_fit_type == 'ratio':
                valid_ids = valid_fpds['well'].tolist()
                this_segments = tc_ratio_P_dict[TC_series]['segments']
                delta_index = np.array(valid_fpds['FPD']) - this_segments[0]['start_idx']
                segments_list, warnings_two_factor = _get_segments_list(this_segments, delta_index, multipliers, steps,
                                                                        eur_dict[selected_series], target_q_peak,
                                                                        _apply_normalization)
                base_phase = tc_ratio_P_dict[TC_series]['basePhase']
                P_dict_update_s = [None for i in range(valid_fpds.shape[0])]
                ratio_update_s = list(
                    map(lambda x: {
                        'segments': x,
                        'diagnostics': {},
                        'basePhase': base_phase,
                        'x': 'time'
                    }, segments_list))

                if len(segments_list) > 0:
                    segs = segments_list[0]
                else:
                    segs = []
                manual_segments = {'segments': segs, 'diagnostics': {}, 'basePhase': base_phase, 'x': 'time'}

            valid_bulk_list = []
            for i, (*x, cum, last_prod_idx, base_segs) in enumerate(
                    _data_for_valid_updates(valid_ids, phase, update_eur, tc_fit_type, forecasts, cums_and_last_prods,
                                            P_dict_update_s, ratio_update_s, base_phase)):
                combined_warning = self._combine_warnings(warning, warnings_two_factor[i])
                valid_update = self._valid_update(x, forecast_id, phase, eur_ratio, applied_forecast_parent_type,
                                                  tc_fit_type, tc_phase_param, update_eur, cum, last_prod_idx,
                                                  base_segs, combined_warning)

                valid_bulk_list.append(valid_update)
        else:
            valid_bulk_list = []
            manual_segments = {}

        if invalid_fpds.shape[0] > 0:
            invalid_ids = invalid_fpds['well'].tolist()
            warning_message = 'Applying Type-Curve: No valid first production date found.'
            invalid_bulk_list = list(
                map(
                    lambda x: self._invalid_update(x, forecast_id, phase, warning_message, applied_forecast_parent_type,
                                                   tc_phase_param), invalid_ids))
        else:
            invalid_bulk_list = []

        return valid_bulk_list, invalid_bulk_list, applied_forecast_parent_type, manual_segments

    def _combine_warnings(self, warning1, warning2):
        if not warning2:
            return warning1
        else:
            warning2_message = 'The applied 2-factor normalization can not reach the target values.'

        new_warning = {'status': False, 'message': ''}
        if not warning1.get('status', False) and not warning2:
            return new_warning
        else:
            new_warning['status'] = True
            new_warning['message'] = warning1['message'] + ' ' + warning2_message
        return new_warning

    def _get_eur_data(self, forecast_id: str, well_ids: Iterable[str], phase: Union[str, Iterable], **_):
        '''Fetch data from DB required to save EUR/RUR after applying type curve.'''
        forecast_type_query = [{'$match': {'_id': ObjectId(forecast_id)}}, {'$project': {'_id': 0, 'type': 1}}]
        for doc in self.context.forecasts_collection.aggregate(forecast_type_query):
            forecast_type = doc['type']
        if forecast_type == 'probabilistic':
            datas_collection = self.context.forecast_datas_collection
        elif forecast_type == 'deterministic':
            datas_collection = self.context.deterministic_forecast_datas_collection
        else:
            raise MissingParamsError
        phases = _parse_phase_input(phase)
        data_freq_pipeline = [{
            '$match': {
                'forecast': ObjectId(forecast_id),
                'well': {
                    '$in': list(map(ObjectId, well_ids))
                },
                'phase': {
                    '$in': phases
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'data_freq': 1,
                'P_dict': 1,
                'phase': 1,
                'well': 1
            }
        }]
        daily_wells = set()
        monthly_wells = set()
        forecasts = defaultdict(dict)
        for datas_doc in datas_collection.aggregate(data_freq_pipeline):
            well_id = str(datas_doc['well'])
            phase = datas_doc['phase']
            P_dict = datas_doc['P_dict']
            data_freq = datas_doc['data_freq']
            if data_freq == 'daily':
                daily_wells.add(well_id)
            else:
                monthly_wells.add(well_id)
            if P_dict is None:
                base_segs = []
            else:
                base_segs = P_dict.get('best', {}).get('segments', [])
            segs_and_freq = {'base_segs': base_segs, 'data_freq': data_freq}
            forecasts[well_id][phase] = segs_and_freq

        cums_and_last_prods = self.context.production_service.get_cums_and_last_prods(
            daily_wells, monthly_wells, phases)
        return forecasts, cums_and_last_prods

    def _get_norm_and_fit_data(self, tc_id: str, phase: Union[str, Iterable], **_):
        fit_data = self.context.production_service.get_tc_fits(tc_id)[tc_id]
        phases = _parse_phase_input(phase)
        norm_data = self.context.tc_normalization_service.get_normalization_steps([tc_id], phases)[tc_id]
        return fit_data, norm_data

    def _get_project_headers(self, project_id, well_ids):
        if not project_id or not well_ids:
            return None

        project_headers_data = {}
        if project_id:
            project_oid = ObjectId(project_id)
            well_id_s = list(map(ObjectId, well_ids))
            project_headers = self.context.project_custom_headers_service.get_custom_headers_in_project(project_oid)
            project_headers_data = self.context.project_custom_headers_service.get_custom_headers_data(
                project_oid, well_id_s, project_headers)

        return project_headers_data


def _parse_phase_input(phase_input: Union[str, Iterable]):
    if isinstance(phase_input, Iterable) and not isinstance(phase_input, str):
        phases = list(phase_input)
    elif phase_input == 'all':
        phases = PHASES
    else:
        phases = [phase_input]
    return phases


def _get_rate_ratio_phases(phase: Union[str, Iterable], fit_doc: Dict[str, Any], **_):
    phases = _parse_phase_input(phase)
    rate_phases = []
    ratio_phases = []
    for phase in phases:
        if fit_doc.get(phase):
            if fit_doc[phase]['fitType'] == 'rate':
                rate_phases.append(phase)
            else:
                ratio_phases.append(phase)
    return rate_phases, ratio_phases


def _data_for_valid_updates(valid_ids: List[ObjectId],
                            phase: str,
                            update_eur: bool,
                            tc_fit_type: str,
                            forecasts: Dict[str, Dict[str, Dict[str, Any]]],
                            cums_and_last_prods: Dict[str, Any],
                            P_dict_update_s: List[Dict[str, Any]],
                            ratio_update_s: List[Dict[str, Any]],
                            base_phase: Optional[str] = None):
    for well_id, P_dict, ratio in zip(valid_ids, P_dict_update_s, ratio_update_s):
        if not update_eur:
            yield well_id, P_dict, ratio, None, None, None
        else:
            formatted_id = str(well_id)
            data_freq = forecasts[formatted_id][phase]['data_freq']
            if tc_fit_type == 'ratio':
                base_segs = forecasts[formatted_id].get(base_phase, {}).get('base_segs', [])
            else:
                base_segs = None
                forecasts[formatted_id][phase]['base_segs'] = P_dict['best']['segments']
            cum_prod_data = cums_and_last_prods[data_freq][formatted_id]

            yield well_id, P_dict, ratio, cum_prod_data[phase], cum_prod_data['last_prod'], base_segs


def _get_segments_list(segments: List[Dict[str, Any]],
                       delta_index: np.ndarray,
                       multipliers: dict[str, np.ndarray],
                       steps: StepsDocument = None,
                       target_eur: float = None,
                       target_q_peak: float = None,
                       apply_normalization: bool = False):
    '''Applies normalization and idx shift to segment.'''
    segments_list = []
    raw_segments = MultipleSegments(segments)
    norm_type = steps.normalizationType if steps and steps.normalizationType else 'eur'
    warnings_two_factor = [False] * len(multipliers['eur'])

    # TODO: Need to change to qPeak, requires a change in utils.
    if norm_type == 'eur_and_q_peak':
        rate_scaled_fields = []
        for this_seg in raw_segments.segments:
            forecast_segs = pd.DataFrame([this_seg.segment] * delta_index.shape[0])
            mult_fields = this_seg.get_rate_scaled_fields()
            rate_scaled_fields.append(mult_fields)

            shift_fields = this_seg.get_idx_shift_fields()
            forecast_segs[shift_fields] += delta_index.reshape(-1, 1)

            segments_list += [forecast_segs.to_dict('records')]

        segments_for_wells = list(map(list, zip(*segments_list)))
        if apply_normalization:
            segments_for_wells, warnings_two_factor = apply_normalization_to_segments(
                segments_for_wells, multipliers, target_eur, target_q_peak, rate_scaled_fields)
    elif norm_type == 'eur' or norm_type == 'q_peak':
        for this_seg in raw_segments.segments:
            forecast_segs = pd.DataFrame([this_seg.segment] * delta_index.shape[0])
            mult_fields = this_seg.get_rate_scaled_fields()
            mults = multipliers[norm_type]
            forecast_segs[mult_fields] *= mults.reshape(-1, 1)

            shift_fields = this_seg.get_idx_shift_fields()
            forecast_segs[shift_fields] += delta_index.reshape(-1, 1)

            segments_list += [forecast_segs.to_dict('records')]

        segments_for_wells = list(map(list, zip(*segments_list)))
    else:
        raise TypeError('Available normalization factors are "eur", "q_peak", or "eur_and_q_peak".')
    return segments_for_wells, warnings_two_factor


def _apply_risk_factors(risk_factors: np.ndarray, multipliers: dict[str, np.ndarray]):
    '''For now we only risk the eur.'''
    if multipliers['eur'] is None:
        return multipliers
    else:
        multipliers['eur'] *= risk_factors
