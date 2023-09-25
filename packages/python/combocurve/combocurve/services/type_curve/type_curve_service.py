from collections import defaultdict
from copy import copy
from bson import ObjectId
import numpy as np

from combocurve.science.type_curve.TC_helper import (
    DEFAULT_BACKGROUND_DATA_RESULT,
    DEFAULT_DAILY_RANGE,
    get_align_daily_resolution,
    get_align_monthly_resolution,
    get_noalign_daily_resolution,
    get_noalign_monthly_resolution,
)
from combocurve.science.type_curve.tc_fit_init import tc_init
from combocurve.science.type_curve.tc_rep_init import rep_init
from combocurve.shared.constants import PROBABILISTIC_STR, DETERMINISTIC_STR

#######
from typing import Any, AnyStr, Dict, Iterable, List, Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from apps.python_apis.api.context import APIContext


class TypeCurveService(object):
    def __init__(self, context):
        self.context: APIContext = context
        self.production_service = self.context.production_service
        self.tc_normalization_service = self.context.tc_normalization_service
        self.projects = {
            'deterministic': ['forecast', 'forecastType', 'phase', 'data_freq', 'P_dict', 'ratio'],
            'probabilistic': ['forecast', 'forecastType', 'phase', 'data_freq', 'P_dict']
        }
        self.items_from_data = {
            'deterministic': ['P_dict', 'forecastType', 'ratio', 'phase'],
            'probabilistic': ['P_dict', 'forecastType', 'phase']
        }

    def tc_fit_init(self, req: Dict[AnyStr, Dict]):
        '''
        Service for preparing data required for entry into the Type Curve Fit Page.

        Input: `Dict[str, Dict]`, Inner dictionary fields follow
        -------------------------------------
        - `'tc_id': str`, ID for type curve

        - `'phase': str`, `'oil' | 'gas' | 'water'`

        - `'wells': List[str]`, list of background well IDs

        - `'resolved_resolution': Dict[str, Dict[str, str]]`, keys are background well IDs fields follow
            - `'oil' | 'gas' | 'water': str`, fields `'daily' | 'monthly'`, resolution used to create forecasts
            for background wells.

        - `'init_para_dict': Dict[str, str | int]`, fields follow
            - `'TC_life': int`, life in years of the type curve
            - `'forecast_series': str`, fields `'P10' | 'P50' | 'P90' | 'best'`,
            forecast series used to generate type curve.
            - `'TC_target_data_freq': str`, fields `'daily' | 'monthly'`, data frequency displayed by type curve.


        Output: `Dict[str, Dict]`, fields of inner dict listed below
        -------------------------------------
        {
            'cum_dict': cum_dict,
            'eur': eur,
            'monthly_prod': monthly_prod,
            'align': align,
            'noalign': noalign,
            'monthly_target': monthly_target,
            'target_phase': target_phase
        }
        '''

        tc_id = req['tc_id']
        wells = req['wells']
        init_para_dict = req['init_para_dict']
        phase = req['phase']

        tc_input_data = self._get_tc_fit_init_data(tc_id, phase, wells, req['wells_valid_info'])
        tc_input_data.update({'init_para_dict': init_para_dict})
        # I will finalize this using the above pipeline
        obj = tc_init()
        raw_background_data = obj.body(tc_input_data)

        valid_phase_rep_wells = [
            w for w, valid_dict in req['wells_valid_info']['wellsValidInfo'].items() if valid_dict[phase]
        ]

        calculated_background_data = self.calculate_background_data(
            raw_background_data,
            DEFAULT_DAILY_RANGE,
            tc_input_data['phaseType'],
            phase,
            init_para_dict['TC_target_data_freq'],
            tc_id,
            valid_phase_rep_wells,
        )

        return calculated_background_data

    def tc_rep_init(self, req):  ## will at least return ['well_id', 'rep']
        tc_id = req['tc_id']
        items = req['items']  ## ['header', 'forecast_info', 'data_info', 'production', 'eur']
        header_items = req.get('header_items')
        if header_items is None:
            header_items = [
                'first_fluid_volume', 'first_prop_weight', 'perf_lateral_length', 'refrac_fluid_volume',
                'refrac_prop_weight', 'total_fluid_volume', 'total_prop_weight', 'first_fluid_per_perforated_interval',
                'refrac_fluid_per_perforated_interval', 'total_fluid_per_perforated_interval',
                'first_proppant_per_fluid', 'first_proppant_per_perforated_interval', 'refrac_proppant_per_fluid',
                'refrac_proppant_per_perforated_interval', 'total_proppant_per_fluid',
                'total_proppant_per_perforated_interval', 'acre_spacing', 'stage_spacing', 'hz_well_spacing_any_zone',
                'hz_well_spacing_same_zone', 'vt_well_spacing_any_zone', 'vt_well_spacing_same_zone'
            ]

        tc_init_input_data = self._get_tc_rep_data(tc_id, header_items)
        return rep_init(tc_init_input_data, items, header_items)

    def _get_tc_fit_init_data(self, tc_id, phase, well_strs, wells_valid_info):

        db = self.context.db
        well_ids = list(map(ObjectId, well_strs))

        resolved_resolution, data_info, forecast_info = wells_valid_info['wellsResolvedResolution'], wells_valid_info[
            'wellsDataInfo'], wells_valid_info['wellsForecastInfo']

        tc_document = db['type-curves'].find_one({'_id': ObjectId(tc_id)})
        forecast_id = tc_document.get('forecast')  ## TODO: forecast_id can be None, this is possible

        forecast_parent_document = db['forecasts'].find_one({'_id': forecast_id})
        if forecast_parent_document is not None:
            TC_forecast_parent_type = forecast_parent_document.get('type', PROBABILISTIC_STR)
        else:
            TC_forecast_parent_type = None
        forecast_collection = {
            DETERMINISTIC_STR: self.context.db['deterministic-forecast-datas'],
            PROBABILISTIC_STR: self.context.db['forecast-datas'],
        }.get(TC_forecast_parent_type)

        ##### get forecast
        if forecast_collection is not None:
            forecast_data_docs = list(
                forecast_collection.aggregate([
                    {
                        '$match': {
                            'well': {
                                '$in': well_ids
                            },
                            'forecast': forecast_id
                        }
                    },
                ]))
        else:
            forecast_data_docs = None

        ## indexed by well_id, {'oil', 'gas', 'water'}
        forecast_map = generate_forecast_map(forecast_data_docs)

        ###### get production
        def _check_has_data_of_certain_resolution(_resolution, _well_str):
            return resolved_resolution.get(well_str, {}).get(phase) == _resolution and data_info.get(_well_str, {}).get(
                phase, {}).get('has_data', False)

        production_maps = {'daily': {}, 'monthly': {}}
        for resolution in ['daily', 'monthly']:
            data_well_strs = []
            for well_str in well_strs:
                if _check_has_data_of_certain_resolution(resolution, well_str):
                    data_well_strs += [well_str]

            productions = self.context.production_service.get_production(data_well_strs, resolution == 'daily')

            production_maps[resolution] = {
                str(x['_id']): {key: x[key]
                                for key in ['index', 'oil', 'gas', 'water']}
                for x in productions
            }

        well_list = [{
            'well': well_str,
            'daily': production_maps['daily'].get(well_str),
            'monthly': production_maps['monthly'].get(well_str),
            'forecast': forecast_map.get(well_str)
        } for well_str in well_strs]

        return {
            'well_list': well_list,
            'phaseType': tc_document.get('phaseType', {}).get(phase, 'rate'),
            'target_phase': phase,
            'base_phase': tc_document.get('basePhase', None),
            'forecast_series': tc_document.get('forecastSeries', 'best'),
            'resolved_resolution': resolved_resolution,
            'data_info': data_info,
            'forecast_info': forecast_info,
            'eur_info': wells_valid_info['wellsEurInfo'],
            'forecast_parent_type': TC_forecast_parent_type
        }

    def _get_tc_rep_data(self, tc_id_str, header_items) -> Dict:  # noqa: C901
        db = self.context.db
        tc_id = ObjectId(tc_id_str)
        tc_document = db['type-curves'].find_one({'_id': tc_id})
        well_id_s = tc_document['wells']
        forecast_id = tc_document.get('forecast')
        if tc_document.get('forecastSeries') is None:
            forecast_series = 'best'
        else:
            forecast_series = tc_document.get('forecastSeries')

        if len(well_id_s) == 0 or forecast_id is None:
            return {
                'TC': tc_document,
                'forecast_series': forecast_series,
                'TC_forecast_parent_type': None,
                'well_data_s': [],
                'forecast_data_map': {}
            }

        (TC_forecast_parent_type, well_headers, well_productions, well_forecast_data_s,
         forecast_data_map) = self._get_well_data(forecast_id, well_id_s, header_items, tc_id)

        ret = {
            'TC':
            tc_document,
            'forecast_series':
            forecast_series,
            'TC_forecast_parent_type':
            TC_forecast_parent_type,
            'forecast_data_map':
            forecast_data_map,
            'well_data_s': [{
                'header': well_headers[i],
                'production': well_productions[i],
                'forecast': well_forecast_data_s[i]
            } for i in range(len(well_id_s))]
        }
        return ret

    def _get_well_data(self,
                       forecast_id: ObjectId,
                       well_id_s: List[ObjectId],
                       header_items: List[AnyStr],
                       tc_id: Optional[ObjectId] = None):
        db = self.context.db
        forecast_document = db['forecasts'].find_one({'_id': forecast_id})
        TC_forecast_parent_type = forecast_document.get('type')
        if TC_forecast_parent_type is None:
            TC_forecast_parent_type = 'probabilistic'

        ### well_header
        if 'has_daily' not in header_items:
            header_items += ['has_daily']

        if 'has_monthly' not in header_items:
            header_items += ['has_monthly']
        well_header_pipeline = [{
            '$match': {
                '_id': {
                    '$in': well_id_s
                }
            }
        }, {
            '$project': {item: 1
                         for item in header_items}
        }, {
            '$sort': {
                '_id': 1
            }
        }]
        well_headers = list(db['wells'].aggregate(well_header_pipeline))

        def set_default_well_header(header):
            for item in ['has_daily', 'has_monthly']:
                this_val = header.get(item)
                if this_val is None:
                    header[item] = False
                else:
                    header[item] = this_val

            for item in ['perf_lateral_length']:
                header[item] = header.get(item)

        for well_header in well_headers:
            set_default_well_header(well_header)

        has_daily_wells = [header['_id'] for header in well_headers if header['has_daily']]
        has_monthly_wells = [header['_id'] for header in well_headers if header['has_monthly']]

        productions = {
            'daily': list(self.context.production_service.get_production(has_daily_wells, True)),
            'monthly': list(self.context.production_service.get_production(has_monthly_wells, False)),
        }

        well_productions = []
        cur_idx = {'daily': 0, 'monthly': 0}
        for i, well_header in enumerate(well_headers):
            well_id = well_header['_id']
            this_production = {'_id': well_id}
            for data_freq in ['daily', 'monthly']:
                data_freq_cur_idx = cur_idx[data_freq]
                if data_freq_cur_idx < len(productions[data_freq]):
                    if well_id == productions[data_freq][data_freq_cur_idx]['_id']:
                        this_production['has_' + data_freq] = True
                        this_production[data_freq] = productions[data_freq][data_freq_cur_idx]
                        cur_idx[data_freq] += 1
                    else:
                        this_production['has_' + data_freq] = False
                        this_production[data_freq] = {'index': [], 'oil': [], 'gas': [], 'water': []}
                else:
                    this_production['has_' + data_freq] = False
                    this_production[data_freq] = {'index': [], 'oil': [], 'gas': [], 'water': []}
            well_productions += [this_production]

        #############
        ## well_headers != well_productions != well_forecasts
        ### forecasts
        if TC_forecast_parent_type == 'probabilistic':
            phase_forecast_pipeline = [{
                '$match': {
                    'forecast': forecast_id,
                    'well': {
                        '$in': well_id_s
                    }
                }
            }, {
                '$project': {
                    '_id': '$well',
                    'data_freq': 1,
                    'phase': 1,
                    'forecastType': 1,
                    'P_dict': 1
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }]
            phase_forecast_data_s = list(db['forecast-datas'].aggregate(phase_forecast_pipeline))
        else:
            phase_forecast_pipeline = [{
                '$match': {
                    'forecast': forecast_id,
                    'well': {
                        '$in': well_id_s
                    }
                }
            }, {
                '$project': {
                    '_id': '$well',
                    'data_freq': 1,
                    'phase': 1,
                    'forecastType': 1,
                    'forecastSubType': 1,
                    'P_dict': 1,
                    'ratio': 1
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }]
            phase_forecast_data_s = list(db['deterministic-forecast-datas'].aggregate(phase_forecast_pipeline))

        well_forecast_data_s = []
        for i in range(len(well_id_s)):
            well_forecast_data_s += [phase_forecast_data_s[(3 * i):(3 * (i + 1))]]

        forecast_data_map = {}
        for phase_forecast in phase_forecast_data_s:
            well_str = str(phase_forecast['_id'])
            phase = phase_forecast['phase']
            if well_str in forecast_data_map:
                forecast_data_map[well_str][phase] = phase_forecast
            else:
                forecast_data_map[well_str] = {phase: phase_forecast}

        return (TC_forecast_parent_type, well_headers, well_productions, well_forecast_data_s, forecast_data_map)

    def calculate_background_data(self,
                                  raw_background_data: Dict[str, Any],
                                  daily_range,
                                  phase_type: str,
                                  phase: str,
                                  resolution: str,
                                  tc_id: str,
                                  valid_phase_wells: Iterable[str],
                                  apply_normalization: bool = False,
                                  default_multiplier=None):
        '''
        raw_background_data is the output of the tc_init.body method in tc_init. That input is copied here for
        convenience.

        raw_background_data:
        --------------------
        - `'eur': List[float]`, list of eurs ordered in the same order as the wells in `well_information_s`

        - `'data_freq': str`, fields `'daily' | 'monthly'`

        - `'cum_dict': Dict[str, List[int] | List[List[int]]]`, fields follow
            - `'idx': List[int]`, the indices of the first day of every month. The beginning index is that of the first
            well to come online, and the end index is that of the last well to come online plus the life of the type
            curve.
            - `'cum_subind': List[List[int]]`, a list of tuples with each entry corresponding to the well in
            `well_information_s` with the same index. The entries give the indices in `cum_dict.idx` of the
            corresponding well's first production date followed by the index a `TC_life` duration later. E.g., an
            entry of `[66, 786]` means the fpd of the well has index `cum_dict['idx'][66]`, and `786` is the standard
            60 year (720 month) type curve life after that index.

        - `'well_information_s': List[Dict[str, Any]]`, fields for each dict follow
            - `'data', List[float] | None,` Only populated when data_freq is daily. Gives all daily production data,
            plus daily forecast data for at least the first 2000 days after production end.
            - `'monthly_prod': List[float]`, monthly production plus forecast vaues over the life of the type curve.
            - `'days_in_month_arr': List[int] | None`, Only populated when data_freq is daiy. Represents the number of
            days in the month of the corresponding index in `monthly_prod`.
            - `'data_month_start_idx': List[int] | None`, Only populated when data_freq is daily. Represents the index
            of the fifteenth day of the month in the corresponding index of `monthly_prod`.
            - `'indexes': Dict[str, Dict[str, int | None]]`, fields follow

                - `'first_data' | 'last_data' | 'maximum_data': Dict[str, int | None]`, fields follow
                    - `'month' | 'day' | 'idx': int | None`, these fields contain the index in the prod array of the
                    beginning of production (`'first_data'`), end of production (`'last_data'`), and peak
                    (`'maximum_data'`).

            - `'header': Dict[str, str]`, fields follow
                - `'well_name': str`
                - `'wel_id': str`

        Params:
            - raw_background_data: see above
            - daily_range: Portion of data at a daily resolution
            - phase_type: 'rate' || 'ratio'
            - phase: 'oil' || 'gas' || 'water'
            - resolution: 'monthly' || 'daily', desired TC resolution
            - tc_id (str): the id of the TC
            - valid_phase_wells (Iterable[str]): list of valid wells for bg data
            - apply_normalization (bool): Default False, used in chart export service to apply the normalization.
        '''
        if raw_background_data is None:
            # Here, the type curve has no associated rep wells.
            return {
                'cum_dict': {
                    'idx': [],
                    'cum_subind': []
                },
                'eur': [],
                'monthly_prod': DEFAULT_BACKGROUND_DATA_RESULT,
                'align': DEFAULT_BACKGROUND_DATA_RESULT,
                'noalign': DEFAULT_BACKGROUND_DATA_RESULT,
                'monthly_target': None if phase_type == 'rate' else DEFAULT_BACKGROUND_DATA_RESULT,
                'target_phase': None if phase_type == 'rate' else {
                    'c4use': DEFAULT_BACKGROUND_DATA_RESULT,
                    'noalign': DEFAULT_BACKGROUND_DATA_RESULT
                },
                'resolution': resolution,
            }
        isMonthly = resolution == 'monthly'
        if phase_type == 'rate':
            cum_dict = raw_background_data['cum_dict']
            eur = raw_background_data['eur']
            well_information_s = raw_background_data['well_information_s']
            monthly_prod = get_noalign_monthly_resolution(well_information_s)
            if isMonthly:
                align = get_align_monthly_resolution(well_information_s)
                noalign = copy(monthly_prod)
            else:
                align = get_align_daily_resolution(well_information_s, daily_range['align'])
                noalign = get_noalign_daily_resolution(well_information_s, daily_range['noalign'])
            monthly_target = target_phase = None
            if apply_normalization:
                if default_multiplier is None:
                    multipliers = self.tc_normalization_service.get_norm_multipliers(
                        tc_id, valid_phase_wells, phase, True)[phase]
                    eur_multiplier = self.tc_normalization_service.get_norm_multipliers(
                        tc_id, valid_phase_wells, phase, False)[phase]
                else:
                    multipliers = default_multiplier

                monthly_prod['data'] = self.tc_normalization_service.apply_normalization_multipliers(
                    np.array(monthly_prod['data'], dtype=float), multipliers)
                align['data'] = self.tc_normalization_service.apply_normalization_multipliers(
                    np.array(align['data'], dtype=float), multipliers)
                noalign['data'] = self.tc_normalization_service.apply_normalization_multipliers(
                    np.array(noalign['data'], dtype=float), multipliers)
                eur = np.array(eur, dtype=float) * eur_multiplier.get('eur', 1)
        else:
            ratio = raw_background_data['ratio']
            target_phase = raw_background_data['target_phase']
            ratio_well_information = ratio['well_information_s']
            target_well_information = target_phase['well_information_s']
            cum_dict = target_phase['cum_dict']
            eur = target_phase['eur']
            monthly_target = get_noalign_monthly_resolution(target_well_information)
            monthly_prod = monthly_target
            align = None
            if isMonthly:
                noalign = get_noalign_monthly_resolution(ratio_well_information)
                c4use = monthly_target
            else:
                noalign = get_noalign_daily_resolution(ratio_well_information, daily_range['noalign'])
                c4use = get_noalign_daily_resolution(target_well_information, daily_range['noalign'])
            target_phase = {'c4use': c4use, 'noalign': monthly_target}

        return {
            'cum_dict': cum_dict,
            'eur': eur,
            'monthly_prod': monthly_prod,
            'align': align,
            'noalign': noalign,
            'monthly_target': monthly_target,
            'target_phase': target_phase,
            'wells': valid_phase_wells,
            'resolution': resolution,
        }

    def get_tc_background_forecasts_and_productions(
            self, type_curve_id: str) -> tuple[dict[str, dict[str, dict[str, Any]]], dict[str, dict[str, list[float]]]]:
        """Get all volume data for all background wells in a type curve.

        Args:
            type_curve_id: The id of the type_curve

        Returns:
            forecasts: dict[str, dict[str, dict[str, Any]]], The forecast documents, keyed on well and phase.
            productions: dict[str, dict[str, list[float]]], The production documents, keyed on well.
                Production documents themselves have access to keys of each phase, and 'index'.
        """
        pipeline = [{
            '$match': {
                '_id': ObjectId(type_curve_id)
            }
        }, {
            '$lookup': {
                'from': 'forecasts',
                'localField': 'forecast',
                'foreignField': '_id',
                'as': 'forecast_document'
            }
        }, {
            '$project': {
                '_id': 0,
                'forecast': 1,
                'forecast_type': {
                    '$arrayElemAt': ['$forecast_document.type', 0]
                },
                'wells': 1
            }
        }]

        tc_info = next(self.context.type_curves_collection.aggregate(pipeline))
        forecast_type = tc_info.get('forecast_type')
        forecasts = defaultdict(dict)
        if forecast_type == PROBABILISTIC_STR:
            forecast_datas_collection = self.context.forecast_datas_collection
        elif forecast_type == DETERMINISTIC_STR:
            forecast_datas_collection = self.context.deterministic_forecast_datas_collection
        else:
            forecast_datas_collection = None

        productions = {}
        if forecast_datas_collection is not None:
            pipeline = [{
                '$match': {
                    'forecast': tc_info['forecast'],
                    'well': {
                        '$in': tc_info['wells']
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'data_freq': 1,
                    'phase': 1,
                    'well': 1,
                    'forecast_type': '$forecastType',
                    'P_dict': 1,
                    'ratio': 1
                }
            }]

            daily_wells = set()
            monthly_wells = set()
            for forecast in forecast_datas_collection.aggregate(pipeline):
                well = str(forecast.pop('well'))
                phase = str(forecast.pop('phase'))
                if forecast['data_freq'] == 'daily':
                    daily_wells.add(well)
                elif forecast['data_freq'] == 'monthly':
                    monthly_wells.add(well)
                else:
                    raise ValueError("The data_freq label must be either 'daily' or ''monthly'.")
                forecasts[well][phase] = forecast

            daily_production = self.context.production_service.get_production(daily_wells, True)
            monthly_production = self.context.production_service.get_production(monthly_wells)
            for prod_freq, prod_collection in zip(('daily', 'monthly'), (daily_production, monthly_production)):
                prods_by_freq = {}
                for prod in prod_collection:
                    well = str(prod.pop('_id'))
                    prods_by_freq[well] = prod
                productions[prod_freq] = prods_by_freq

        return forecasts, productions


def generate_forecast_map(forecast_data_docs):
    forecast_map = {}
    if forecast_data_docs is not None:
        for phase_forecast in forecast_data_docs:
            well_str = str(phase_forecast['well'])
            _phase = phase_forecast['phase']

            if well_str in forecast_map:
                forecast_map[well_str][_phase] = phase_forecast
            else:
                forecast_map[well_str] = {_phase: phase_forecast}
    return forecast_map
