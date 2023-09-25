from collections import defaultdict
from copy import deepcopy
from datetime import date, datetime
from enum import Enum
import logging
from typing import Any, AnyStr, Dict, List, Optional, Tuple, Union, TYPE_CHECKING

from bson import ObjectId
import numpy as np
import pandas as pd
from pymongo.database import Collection
from pymongo import UpdateOne
from redis.exceptions import ConnectionError as RedisConnectionError

from combocurve.science.core_function.helper import shift_idx
from combocurve.science.deterministic_forecast.templates import return_template
from combocurve.science.diagnostics.diagnostics import ops as scalar_ops
from combocurve.science.forecast.auto_forecast_warnings import convert_header_to_human_readable
from combocurve.science.forecast_models.model_manager import mm
from combocurve.science.forecast_models.shared.parent_model import model_parent
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.science.type_curve.skeleton_normalize import ops as arr_ops
from combocurve.science.type_curve.tc_fit_init import tc_init
from combocurve.science.type_curve.tc_rep_init_helper import WellValidationCriteriaEnum
from combocurve.science.type_curve.tc_rep_init import rep_init
from combocurve.services.forecast.mass_modify_well_life_v2 import MassModifyWellLifeService
from combocurve.services.proximity_forecast.proximity_data_models import (NormalizationMultipliers, ProximityDocument,
                                                                          ProximityFitsContainer)
from combocurve.services.proximity_forecast.proximity_headers_listing import (headers_map_list, date_headers_list,
                                                                              mandatory_headers)
from combocurve.services.proximity_forecast.proximity_helpers import (update_ratio_or_P_dict)
from combocurve.services.proximity_forecast.proximity_data_model_helpers import (create_settings_object,
                                                                                 create_well_forecast_pairs)
from combocurve.services.type_curve.tc_normalization_data_models import StepsItem
from combocurve.services.type_curve.type_curve_service import TypeCurveService, generate_forecast_map
from combocurve.shared.constants import DAYS_IN_MONTH, PHASES, Q_MIN
from combocurve.shared.date import days_from_1900, index_from_date_str
from combocurve.shared.serialization import make_serializable
from combocurve.science.type_curve.skeleton_TC_new1 import fit_tc
from combocurve.science.type_curve.skeleton_normalize import linear, one_to_one, power_law
from combocurve.science.type_curve.TC_helper import (DEFAULT_DAILY_RANGE, get_cum_data, get_eur_data,
                                                     get_aligned_prod_data)
from combocurve.utils.exceptions import get_exception_info

multi_seg = MultipleSegments()

EARTH_RADIUS = 3958.8  # mile

if TYPE_CHECKING:
    from api.context import APIContext

EMPTY_FITS = {
    'fit': [{}],
    'new_forecast': {
        'P10': {},
        'P50': {},
        'P90': {},
        'average': {}
    },
    'unfit_forecast': {
        'P10': {},
        'P50': {},
        'P90': {},
        'average': {}
    },
}


class ProximityErrorType(Enum):
    NONE = {'status': False, 'message': ''}
    INVALID_TARGET = {'status': True, 'message': 'Target well is invalid (no surface latitude/longitude).'}
    INSUFFICIENT_WELLS = {
        'status':
        True,
        'message':
        ('Only found {n_wells} neighbor wells, but minimum requirement is {min_wells}.  Please lower the minimum '
         + 'requirement, relax the search criteria, or increase the search radius.')
    }
    NO_WELLS = {'status': True, 'message': 'No proximity wells found that meet the criteria specified.'}


class ProximityForecastService:
    def __init__(self, context: 'APIContext'):
        self.context = context
        self.mass_modify_well_life_service: MassModifyWellLifeService = context.mass_modify_well_life_service
        self.wells_collection: Collection = context.wells_collection
        self.forecasts_collection: Collection = context.forecasts_collection
        self.deterministic_forecast_datas_collection: Collection = context.deterministic_forecast_datas_collection
        self.use_header_list = headers_map_list
        self.proximity_forecast_datas_collection: Collection = context.proximity_forecast_datas_collection
        self.background_wells_info_cache = {}
        self.target_wells_headers_cache: dict[str, dict] = {}

    def get_proximity_document_by_id(self, id: ObjectId) -> ProximityDocument:
        '''
        Pull the corresponding proximity document from the DB based on the provided ObjectId

        Args:
            id (ObjectId): The ID of the object to pull

        Returns:
            ProximityDocument: the deserialized object from the db.
        '''
        data = self.proximity_forecast_datas_collection.find_one({'_id': id})
        return ProximityDocument.parse_obj(data)

    def get_proximity_document(self, forecast: ObjectId, well: ObjectId, phase: AnyStr) -> ProximityDocument:
        '''
        Pull the corresponding proximity document from the DB based on the provided ObjectId

        Args:
            forecast (ObjectId): The forecast of the document we are pulling.
            well (ObjectId): The well of the document we are pulling.
            phase (AnyStr): The phase of the document we are pulling.

        Returns:
            ProximityDocument: the deserialized object from the db.
        '''
        data = self.proximity_forecast_datas_collection.find_one({
            'forecast': forecast,
            'well': well,
            'phase': phase,
        })
        return ProximityDocument.parse_obj(data)

    def create_proximity_document(self, document: ProximityDocument) -> ObjectId:
        '''
        Writes the provided ProximityDocument to the db.

        Args:
            document (ProximityDocument): The document to be inserted

        Returns:
            ObjectId: the `_id` of the inserted document
        '''
        forecast = document.forecast
        well = document.well
        phase = document.phase

        if None not in [forecast, well, phase]:
            insert_result = self.proximity_forecast_datas_collection.insert_one(document.dict())
            return insert_result.inserted_id

    def update_proximity_document_by_id(self, id: ObjectId, document: ProximityDocument) -> ObjectId:
        '''
        Updates the object with `id` to match the provided ProximityDocument.

        Args:
            id (ObjectId): The `_id` of the document to be updated
            document (ProximityDocument): The new document contents

        Returns:
            ObjectId: the `_id` of the updated document
        '''
        update_result = self.proximity_forecast_datas_collection.update_one({'_id': id}, {'$set': document.dict()})
        return update_result.upserted_id

    def generate_proximity_bg_data(self, forecast: ObjectId, well: ObjectId, phase: AnyStr) -> Dict:
        '''
        Fetches a proximity Forecast document and generates the rawBackgroundData for it.

        Args:
            forecast (ObjectId): Forecast of proximity document
            well (ObjectId): target well for proximity document
            phase (AnyStr): phase of document

        Returns:
            Dict: the rawBackgroundData of the neighbor wells.
        '''
        document = self.get_proximity_document(forecast, well, phase)

        # Setup well list and well/forecast mappings
        wells = []
        wells_by_forecast = defaultdict(list)
        well_forecast_dict = {}
        for pair in document.wells:
            well_id_str = str(pair.well)
            forecast_id_str = str(pair.forecast)

            wells.append(well_id_str)
            wells_by_forecast[forecast_id_str].append(well_id_str)
            well_forecast_dict[well_id_str] = forecast_id_str

        fit_init_params = {
            'phase': phase,
            'phase_type': document.phase_type,
            'base_phase': document.base_phase,
            'num_month': document.settings.fit_settings.well_life * 12,
            'resolutionPreference': document.resolution,
        }
        proximity_rep_data = self._create_proximity_rep_data(
            phase,
            document.phase_type,
            document.base_phase,
            str(forecast),
            wells,
            well_forecast_dict,
            document.resolution,
        )
        fit_init_body = self._proximity_tc_fit_init(
            wells,
            fit_init_params,
            wells_by_forecast,
            well_forecast_dict,
            proximity_rep_data,
        )
        raw_background_data = self._get_raw_background_data(wells, fit_init_body)

        return make_serializable(raw_background_data), wells

    def generate_proximity_fits(self, params: dict) -> dict:
        '''
        Generate proximity fits using the requried parameters.

        Args:
            params: A dictionary of the requried parameters to generate proximity fits

        Returns:
            dict: A dictionary of the proximity fits result
        '''

        fit_params = params['fit_params']
        target_bg_info = params['bg_data']
        phase = fit_params['phase']
        phaseType = fit_params['phaseType']
        basePhase = fit_params['basePhase']

        TC_para_dict = fit_params['TC_para_dict']

        phase_enabled_dict = {p: False for p in ['oil', 'gas', 'water']}
        phase_enabled_dict[phase] = True

        fit_body = {
            'phases': phase_enabled_dict,
            phase: fit_params,
            'regressionType': 'rate',
        }

        obj = fit_tc(self.context)
        fit = obj.body(fit_body)
        single_phase_fit = fit[phase]

        p10_segments = single_phase_fit['percentile']['before']['P10']['segments']
        p50_segments = single_phase_fit['percentile']['before']['P50']['segments']
        p90_segments = single_phase_fit['percentile']['before']['P90']['segments']
        average_segments = single_phase_fit['average']['before']['segments']

        p10_body = self.apply_TC_fit(p10_segments, target_bg_info, phaseType, basePhase, TC_para_dict, fit_params)
        p50_body = self.apply_TC_fit(p50_segments, target_bg_info, phaseType, basePhase, TC_para_dict, fit_params)
        p90_body = self.apply_TC_fit(p90_segments, target_bg_info, phaseType, basePhase, TC_para_dict, fit_params)
        average_body = self.apply_TC_fit(average_segments, target_bg_info, phaseType, basePhase, TC_para_dict,
                                         fit_params)

        no_bg_data = {k: v for k, v in target_bg_info.items() if k != 'target_bg_data'}
        unfit_p10_body = self.apply_TC_fit(p10_segments, no_bg_data, phaseType, basePhase, TC_para_dict, fit_params)
        unfit_p50_body = self.apply_TC_fit(p50_segments, no_bg_data, phaseType, basePhase, TC_para_dict, fit_params)
        unfit_p90_body = self.apply_TC_fit(p90_segments, no_bg_data, phaseType, basePhase, TC_para_dict, fit_params)
        unfit_average_body = self.apply_TC_fit(average_segments, no_bg_data, phaseType, basePhase, TC_para_dict,
                                               fit_params)

        return {
            'fit': single_phase_fit,
            'new_forecast': {
                'P10': p10_body,
                'P50': p50_body,
                'P90': p90_body,
                'average': average_body
            },
            'unfit_forecast': {
                'P10': unfit_p10_body,
                'P50': unfit_p50_body,
                'P90': unfit_p90_body,
                'average': unfit_average_body
            },
        }

    def _prepare_proximity_phase_data(self, fit_params: dict, phase_type_dict, base_phase_dict, phases: List[AnyStr],
                                      proximity_wells: List, forecast_id: AnyStr) -> Tuple[List, List, Dict]:
        '''
        Prepare required data for proximity fits generation.

        Args:
            params: A dictionary of the requried parameters to prepare required information for proximity fits,
            we need sorted phases, extra phases and base phases' forecasts

        Returns:
            Tuple[List, List, Dict]: sorted phases, extra phases, and well/forecast dictionary
        '''

        rate_phases = []
        ratio_phases = []
        extra_phases = []

        for phase in phases:
            phase_type = phase_type_dict[phase]
            if phase_type == 'rate':
                rate_phases.append(phase)
                fit_params[phase]['base_phase'] = None
            else:
                ratio_phases.append(phase)
                base_phase = base_phase_dict[phase]

                if base_phase not in phases + extra_phases:
                    extra_phases.append(base_phase)

        sorted_phase = rate_phases + ratio_phases

        base_forecasts = {}
        if extra_phases:
            base_forecasts = self.context.production_service.get_well_forecast_deterministic(
                proximity_wells, forecast_id, extra_phases)
            base_forecasts = {str(doc['well']): doc['forecasts'] for doc in base_forecasts}

        return sorted_phase, extra_phases, base_forecasts

    def get_normalization_params(
        self,
        params: dict,
        wells_bg: list,
        headers_map: dict,
        raw_bg_data: list,
        phase: str,
        phase_type: str,
    ) -> Dict:
        '''
        Prepare required data for normalization.

        Args:
            params: A dictionary of the required parameters to run normalization, will modify this dict inplace
            wells_bg: A list of background wells' ids
            headers_map: A dictionary that has all the headers of background wells
            raw_bg_data: A dictionary that has the eur and other information of background wells
            phase: the current phase
            phase_type: the type of the phase (rate/ratio)

        Returns:
            Dict: contains mask fit, normalize headers, and target.
        '''
        if phase_type == 'ratio':
            raw_bg_data = raw_bg_data['target_phase']

        mask_fit = [True] * len(wells_bg)  # TODO: verify this is supposed to be all True's
        eurs = raw_bg_data['eur']
        normalize_header = []

        for i in range(len(wells_bg)):
            well_id = wells_bg[i]
            this_header = headers_map[well_id]
            this_header[f'{phase}_eur'] = eurs[i]
            normalize_header.append(this_header)

        return {
            'mask_fit': mask_fit,
            'mask_normalize': mask_fit,
            'normalize_header': normalize_header,
        }

    def _get_normalization_header_list(self, params: dict) -> list[str]:
        def _traverse_op_chain(chain: dict) -> list[str]:
            chain_headers = [chain['start_feature']]
            for chain_item in chain['op_chain']:
                chain_headers += [chain_item['opFeature']]
            return chain_headers

        headers = [params['numericalHeader']]
        headers += _traverse_op_chain(params['xChain'])
        headers += _traverse_op_chain(params['xChain'])
        return headers

    def _prepare_normalization_data(self, params: dict) -> Dict[AnyStr, NormalizationMultipliers]:
        '''
        Prepare normalization data for proximity fits generation.

        Args:
            params: A dictionary of the requried parameters to generate normalization multipliers

        Returns:
            dict: A dictionary of the normalization multipliers for needed phases
        '''
        for phase, phase_params in params.items():
            input_dict = {
                'mask_fit': phase_params['mask_fit'],
                'normalize_header': phase_params['normalize_header'],
                'x_chain': phase_params['xChain'],
                'y_chain': phase_params['yChain']
            }

            normalization_type = phase_params['normalizationType']  ## 'linear', 'power_law'
            if normalization_type == 'linear':
                norm = linear()
                _, slope = norm.body(input_dict, 'fit')
                phase_params['slope'] = slope
            else:
                norm = power_law()
                b, a = norm.body(input_dict, 'fit')
                phase_params['modified_beta'] = [a, b]

        input_dict = defaultdict(dict)
        for phase in params:
            normalization_type = params[phase]['normalizationType']  ## '1_to_1', 'linear'
            if normalization_type == "1_to_1":
                input_dict[phase] = {  ## float if 'linear', None if '1_to_1'
                    'x_chain': params[phase]['xChain'],
                    'y_chain': params[phase]['yChain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize'],
                }
            elif normalization_type == "linear":
                input_dict[phase] = {
                    'slope': params[phase]['slope'],
                    'x_chain': params[phase]['xChain'],
                    'y_chain': params[phase]['yChain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize']
                }
            elif normalization_type == 'power_law_fit':
                input_dict[phase] = {
                    'a': params[phase].get('modified_beta')[0],
                    'b': params[phase].get('modified_beta')[1],
                    'x_chain': params[phase]['xChain'],
                    'y_chain': params[phase]['yChain'],
                    'normalize_header': params[phase]['normalize_header'],
                    'target': params[phase]['target'],
                    'mask': params[phase]['mask_normalize']
                }

        norm_funcs = {'1_to_1': one_to_one(), 'linear': linear(), 'power_law_fit': power_law()}
        output = {}
        for phase in input_dict:
            normalization_type = params[phase]['normalizationType']
            output[phase] = norm_funcs[normalization_type].body(input_dict[phase], 'apply')

        return output

    def prepare_background_wells_info(
        self,
        target_wells: list[str],
        selected_forecasts: list[str],
        required_headers: list[str],
    ) -> tuple[dict, dict]:
        '''
        Generate the list of potential background wells for each target well.

        Args:
            target_wells (list[str]): List of wells to pull proximity wells for.
            selected_forecasts (list[str]): List of forecasts to pull proximity wells from.
            required_headers (list[str]): The headers that need to be pulled

        Returns:
            tuple[dict, dict]:
                candidate_well_data (dict[str, Any]): Two keys
                    well_headers (list[dict]): list of header dictionaries for all candidate wells.
                    well_forecast_pairs (list[dict]): list of dictionaries containing well ids and forecast ids.
                        Used to determine which forecast to pull forecast data from for each candidate well.
                target_wells_header_dict (dict[str, dict]): Maps target well id to target well headers
        '''
        header_project = {k: 1 for k in required_headers}
        target_wells_info = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': list(map(ObjectId, list(target_wells)))
                    }
                }
            }, {
                '$project': header_project
            }]))

        target_wells_header_dict = {str(well['_id']): well for well in target_wells_info}

        cache_key = self.create_redis_key(selected_forecasts, required_headers)

        try:
            candidate_well_data = self.context.data_cache_service.safe_get(
                cache_key,
                self.fetch_candidate_well_headers,
                [selected_forecasts, required_headers],
                {},
            )
        except RedisConnectionError:
            logging.warning('Failed to connect to redis.')
            candidate_well_data = self.fetch_candidate_well_headers(selected_forecasts, required_headers)

        return candidate_well_data, target_wells_header_dict

    def run_proximity_workflow_using_document(self, proximity_document: ProximityDocument):
        '''
        Using the provided proximity document, run the entire proximity workflow as if
        it was initiated from the grid page.

        Args:
            proximity_document (ProximityDocument): the document that contains the proximity settings.

        Returns:
            ???
        '''
        pass

    def fetch_candidate_well_headers(self, selected_forecasts: list[str], required_headers: list[str]) -> dict:
        '''
        Fetch the set of candidate well headers from MongoDB.

        Args:
            selected_forecasts (list[str]): List of forecast IDs to pull wells
            required_headers (list[str]): List of required headers

        Returns:
            dict:
                well_headers: List of well header dictionaries.
                well_forecast_pairs: List of dicts with only 'well' and 'forecast' keys.  Provides
                    a mapping, so that we know which forecast to pull segments from for each well.
        '''
        header_projection = {h: 1 for h in required_headers}
        selected_forecasts_ids = [ObjectId(f) for f in selected_forecasts]
        well_forecast_pairs = list(
            self.deterministic_forecast_datas_collection.aggregate([{
                '$match': {
                    'forecast': {
                        '$in': selected_forecasts_ids
                    },
                }
            }, {
                '$project': {
                    'well': 1,
                    'forecast': 1
                }
            }]))

        wells_id = [*{w['well'] for w in well_forecast_pairs}]
        wells_header = list(
            self.context.wells_collection.aggregate([{
                '$match': {
                    '_id': {
                        '$in': wells_id
                    },
                    'surfaceLatitude': {
                        '$ne': None
                    },
                    'surfaceLongitude': {
                        '$ne': None
                    },
                    'wells_collection_items': {
                        '$exists': False
                    }
                }
            }, {
                '$project': header_projection,
            }]))
        return {
            'well_headers': wells_header,
            'well_forecast_pairs': well_forecast_pairs,
        }

    def create_redis_key(self, selected_forecasts: list[str], required_headers: list[str]) -> str:
        '''
        Create a unique key for insertion into redis.

        Args:
            selected_forecasts (list[str]): List of string IDs to pull forecasts from.
            required_headers (list[str]): List of headers that are required.

        Returns:
            str: a unique key.
        '''
        sorted_forecast_strs: Tuple[str] = tuple(sorted(selected_forecasts))
        sorted_header_strs: Tuple[str] = tuple(sorted(required_headers))
        key_items = sorted_forecast_strs + sorted_header_strs
        prefix = 'proximity:candidate_wells:'
        final_key = self.context.data_cache_service.create_cache_key(prefix, key_items)
        return final_key

    def prepare_cached_candidate_well_data(
        self,
        params: dict,
    ) -> Dict:
        '''
        Fetches well header data from the DB, and stores it in the redis cache.

        Args:
            params (dict): Parameter dictionary from the API call

        Returns:
            Dict: Single-entry dictionary with the redis key.
        '''
        selected_forecasts = params['forecastIds']
        required_headers = self.extract_required_headers_from_auto_params(params)
        candidate_well_data = self.fetch_candidate_well_headers(selected_forecasts, required_headers)
        redis_key = self.create_redis_key(selected_forecasts, required_headers)
        self.context.data_cache_service.set(redis_key, candidate_well_data)
        return {'key': redis_key}

    def proximity_on_the_grid(self, params: dict) -> dict:
        '''
        Proximity on the grid pipeline:
            1. get the required parametmers
            2. prepare needed information for proximity fits, including production, forecasts and normalization data
            3. run proximity fits
            4. save results to database

        Args:
            params: A dictionary of the required parameters for proximity fits

        Returns:
            dict: A dictionary contains the database writing results of deterministic and proximity collections
        '''

        neighbor_criteria: List[Dict] = params['neighborCriteria']
        target_wells: List[AnyStr] = params['proximity_wells']

        phases, active_phases = self.get_phases_from_params(params)

        target_forecast_id = params['targetForecastId']
        resolution: AnyStr = params.get('resolution', 'monthly')
        project_id = params['projectId']

        fit_params_by_phase = {phase: params[phase]['fit'] for phase in active_phases}
        norm_params_by_phase = {phase: params[phase]['normalization'] for phase in active_phases}
        phase_type_by_phase = {phase: params[phase]['fit'].get('phaseType', 'rate') for phase in active_phases}
        base_phase_by_phase = {phase: params[phase]['fit'].get('basePhase') for phase in active_phases}

        sorted_phase, extra_phases, base_forecasts = self._prepare_proximity_phase_data(
            fit_params_by_phase, phase_type_by_phase, base_phase_by_phase, active_phases, target_wells,
            target_forecast_id)

        cums_and_last_prods = self.context.production_service.get_cums_and_last_prods(
            target_wells, target_wells, phases)

        well_production = self.context.production_service.get_production(target_wells, resolution == 'daily')
        well_production_dict = {str(well['_id']): well for well in well_production}

        if resolution == 'monthly':
            for well in well_production_dict:
                for key in well_production_dict[well]:
                    if key in PHASES:
                        well_production_dict[well][key] = np.array(well_production_dict[well][key],
                                                                   dtype=np.float64) / DAYS_IN_MONTH

        updates_deterministic = []
        updates_proximity = []
        all_proximity_data = []
        all_proximity_fits = []
        forecasted_segments = defaultdict(dict)

        required_headers = self.extract_required_headers_from_auto_params(params)

        candidate_well_data, target_wells_headers_dict = self.prepare_background_wells_info(
            target_wells, params['forecastIds'], required_headers)

        for well_id in target_wells:
            for phase in sorted_phase:
                try:
                    fit_params = fit_params_by_phase[phase]
                    norm_params = norm_params_by_phase[phase]

                    base_phase = base_phase_by_phase[phase]
                    phase_type = phase_type_by_phase[phase]

                    cum = cums_and_last_prods[resolution].get(str(well_id), {}).get(phase, 0)
                    last_prod_idx = cums_and_last_prods[resolution].get(str(well_id), {}).get('last_prod')

                    neighbor_dict_base = {
                        'wellCountRange': {
                            'start': params['wellCount'][0],
                            'end': params['wellCount'][1],
                        },
                        'selectedForecasts': params['forecastIds'],
                        'searchRadius': params['searchRadius'],
                        'selectedFields': [c['criteriaType'] for c in neighbor_criteria],
                    }

                    criteria_as_dict = {c['criteriaType']: c for c in neighbor_criteria}

                    neighbor_params = {
                        'phase': phase,
                        'phase_type': phase_type,
                        'base_phase': base_phase,
                        'proximity_forecast_id': target_forecast_id,
                        'neighbor_dict': {
                            **neighbor_dict_base,
                            **criteria_as_dict,
                        },
                        'target_well_id': str(well_id),
                        'num_month': 720,
                        'resolutionPreference': resolution,
                    }

                    proximity_data = self.prepare_tc_info(
                        neighbor_params,
                        candidate_well_data,
                        target_wells_headers_dict,
                    )

                    warning = proximity_data.get('warning')
                    if warning.get('status'):
                        deterministic_phase_update = self.context.deterministic_forecast_service.get_update_body(
                            ObjectId(well_id),
                            ObjectId(target_forecast_id),
                            phase,
                            user=params.get('user'),
                            warning=warning,
                        )
                        updates_deterministic.append(deterministic_phase_update)

                        continue

                    wells_bg = proximity_data['wells']
                    headers_map = proximity_data['headersMap']
                    raw_bg_data = proximity_data['rawBackgroundData']

                    normalization_type = norm_params['normalizationType']

                    norm_steps = StepsItem.parse_obj({
                        'base': {
                            'x': convert_keys_snake_to_camel(norm_params['xChain']),
                            'y': convert_keys_snake_to_camel(norm_params['yChain'])
                        }
                    })
                    norm_headers = norm_steps.get_all_headers()

                    bg_well_headers = {
                        well: {k: v
                               for k, v in headers.items() if k in norm_headers}
                        for well, headers in headers_map.items()
                    }

                    norm_data = self.get_normalization_params(norm_params, wells_bg, bg_well_headers, raw_bg_data,
                                                              phase, phase_type)

                    if normalization_type != 'no_normalization' and phase_type != 'ratio':
                        try:
                            target_norm_headers = proximity_data['target_well_headers']

                            target_norm_headers = {
                                k: v
                                for k, v in target_norm_headers.items() if k in norm_headers and v is not None
                            }
                            normalization_settings = {
                                phase: {
                                    'target': target_norm_headers,
                                    **norm_params,
                                    **norm_data
                                }
                            }

                            normalization_results = self._prepare_normalization_data(normalization_settings)

                            normalization_multipliers = normalization_results[phase]['multipliers']
                            normalization_multipliers = np.stack(
                                (normalization_multipliers, np.full(len(wells_bg), np.nan)), axis=1).astype(float)
                        except KeyError as e:
                            header = convert_header_to_human_readable(str(e).strip("'"))
                            normalization_warning = {
                                'status': True,
                                'message':
                                f"Failed to generate normalization multipliers, couldn't find header '{header}'",
                            }
                            deterministic_phase_update = self.context.deterministic_forecast_service.get_update_body(
                                ObjectId(well_id),
                                ObjectId(target_forecast_id),
                                phase,
                                user=params.get('user'),
                                warning=normalization_warning,
                            )
                            updates_deterministic.append(deterministic_phase_update)

                            continue
                    else:
                        normalization_multipliers = np.ones((len(wells_bg), 2))
                        normalization_settings = {phase: {'target': {}, **norm_params, **norm_data}}

                    calculated_bg_data = self.context.type_curve_service.calculate_background_data(
                        raw_bg_data,
                        DEFAULT_DAILY_RANGE,
                        phase_type,
                        phase,
                        resolution,
                        '',
                        wells_bg,
                    )

                    # Verify/Change this when we setup 2fn for proximity
                    eur_normalization_multipliers = normalization_multipliers[:, 0]

                    init_data = {
                        'eur':
                        get_eur_data(calculated_bg_data, eur_normalization_multipliers),
                        'cum_dict': {
                            **calculated_bg_data['cum_dict'],
                            **get_cum_data(calculated_bg_data, normalization_multipliers),
                        },
                        'background_data':
                        get_aligned_prod_data(calculated_bg_data, phase_type == 'rate', normalization_multipliers,
                                              'noalign'),
                    }

                    base_segs = None
                    if phase_type == 'ratio':
                        if base_phase in extra_phases:
                            base_segs = base_forecasts[well_id][base_phase].get('best', {}).get('segments', [])
                        else:
                            base_segs = forecasted_segments[well_id][base_phase]

                    phase_fit_params = {
                        'fit_params': {
                            "best_fit_method": 'average',
                            "best_fit_q_peak": fit_params['best_fit_q_peak'],
                            "best_fit_range": None,  # TODO figure out origin of this one
                            "fit_para": {
                                'data': 'noalign',
                                'fit_complexity': fit_params['fit_complexity'],
                                'p1_range': fit_params['p1_range'],
                                'TC_percentile': [10, 50, 90]
                            },
                            "init_data": init_data,
                            "phase": phase,
                            "phaseType": phase_type,
                            "TC_para_dict": fit_params,
                            "tcId": '',
                            "basePhase": base_phase,
                            'basePhaseSegments': base_segs,
                            'resolution': resolution,
                        },
                        'bg_data': {
                            'forecastId': target_forecast_id,
                            'wellId': well_id,
                            'target_bg_data': {
                                'index': well_production_dict.get(well_id, {}).get('index', []),
                                'value': well_production_dict.get(well_id, {}).get(phase, [])
                            },
                            'resolution': resolution,
                        },
                    }

                    proximity_fits, update = self.get_prox_fits(calculated_bg_data.get('eur', []), phase_fit_params)
                    phase_fit_to_target = fit_params['fitToTargetData']
                    phase_apply_series = fit_params.get('applySeries', 'average')

                    if phase_fit_to_target:
                        phase_P_dict = proximity_fits['new_forecast'][phase_apply_series].get('P_dict', {})
                        phase_warning = proximity_fits['new_forecast'][phase_apply_series].get('warning', {})
                    else:
                        phase_P_dict = proximity_fits['unfit_forecast'][phase_apply_series].get('P_dict', {})
                        phase_warning = proximity_fits['unfit_forecast'][phase_apply_series].get('warning', {})

                    forecastSubType = 'proximity'
                    if phase_type == 'rate':
                        phase_ratio_dict = None
                        forecastType = 'rate'
                    else:
                        phase_P_dict = {}
                        if phase_fit_to_target:
                            phase_ratio_dict = proximity_fits['new_forecast'][phase_apply_series].get('ratio', {})
                        else:
                            phase_ratio_dict = proximity_fits['unfit_forecast'][phase_apply_series].get('ratio', {})
                        forecastType = 'ratio'

                    forecasted_segments[well_id][phase] = phase_P_dict.get('best', {}).get('segments', [])
                    if not phase_warning.get('status', False):
                        phase_warning = {'status': False, 'message': ''}

                    if update:
                        deterministic_phase_update = self.context.deterministic_forecast_service.get_update_body(
                            ObjectId(well_id),
                            ObjectId(target_forecast_id),
                            phase,
                            user=params.get('user'),
                            P_dict=phase_P_dict,
                            ratio=phase_ratio_dict,
                            forecasted=True,
                            forecastType=forecastType,
                            forecastSubType=forecastSubType,
                            data_freq=resolution,
                            warning=phase_warning,

                            #for eur calculation
                            calc_eur=True,
                            cum=cum,
                            last_prod_idx=last_prod_idx,
                            base_segs=base_segs)

                    else:
                        warning = {'status': True, 'message': 'Not enough data to generate proximity forecast.'}

                        deterministic_phase_update = self.context.deterministic_forecast_service.get_update_body(
                            well_id=ObjectId(well_id),
                            forecast_id=ObjectId(target_forecast_id),
                            phase=phase,
                            warning=warning,
                        )

                    proximity_fits_to_db = {
                        'fitted': {
                            k: v.get('P_dict', {}).get('best', {}).get('segments', [])
                            if phase_type == 'rate' else v.get('ratio', {}).get('segments', [])
                            for k, v in proximity_fits['new_forecast'].items()
                        },
                        'unfitted': {
                            k: v.get('P_dict', {}).get('best', {}).get('segments', [])
                            if phase_type == 'rate' else v.get('ratio', {}).get('segments', [])
                            for k, v in proximity_fits['unfit_forecast'].items()
                        }
                    }

                    # wells and settings
                    settings_document = create_settings_object(neighbor_params, normalization_settings, fit_params)
                    new_proximity_document = ProximityDocument(
                        project=ObjectId(project_id),
                        forecast=ObjectId(target_forecast_id),
                        well=ObjectId(well_id),
                        phase=phase,
                        resolution=resolution,
                        phase_type=phase_type,
                        base_phase=base_phase,
                        fits=ProximityFitsContainer.parse_obj(proximity_fits_to_db),
                        normalization_multipliers=self.prepare_norm_multipliers(normalization_multipliers),
                        wells=create_well_forecast_pairs(proximity_data['wellForecastMap']),
                        settings=settings_document)
                    proximity_phase_update = self.get_proximity_document_update_body(new_proximity_document)

                    updates_deterministic.append(deterministic_phase_update)
                    updates_proximity.append(proximity_phase_update)
                    all_proximity_data.append(proximity_data)
                    all_proximity_fits.append(proximity_fits)
                except Exception as e:
                    error_info = get_exception_info(e)
                    logging.error(
                        error_info['message'],
                        extra={
                            'metadata': {
                                'error': error_info,
                                'proximity_params': params,
                                'target_well': well_id,
                                'phase': phase,
                            }
                        },
                    )

                    warning = {'status': True, 'message': 'Proximity forecast failed.'}
                    phase_update = self.context.deterministic_forecast_service.get_update_body(
                        ObjectId(well_id),
                        ObjectId(target_forecast_id),
                        phase,
                        user=params.get('user'),
                        warning=warning,
                    )
                    updates_deterministic.append(phase_update)

        deterministic_w_results = self.write_data_to_db(updates_deterministic, 'deterministic-forecast-datas')
        proximity_w_results = self.write_data_to_db(updates_proximity, 'proximity-forecast-datas')

        # Cleanup the cache, in case it is being called from python-apis
        self.background_wells_info_cache = {}

        return make_serializable({
            'deterministic_w_results': deterministic_w_results,
            'proximity_w_results': proximity_w_results
        })

    def get_phases_from_params(self, params):
        apply_all = params.get('applyAll', False)
        phases: Dict[AnyStr, bool] = params['phases']
        phases = phases if not apply_all else {k: True for k in phases.keys()}
        active_phases: List[AnyStr] = [k for k, v in phases.items() if v]
        return phases, active_phases

    def extract_required_headers_from_auto_params(self, params):
        neighbor_criteria = params['neighborCriteria']

        _, active_phases = self.get_phases_from_params(params)

        criteria_header_list = self.extract_criteria_headers(neighbor_criteria)
        normalization_headers_by_phase = {
            phase: self._get_normalization_header_list(params[phase]['normalization'])
            for phase in active_phases
        }
        normalization_headers_list = []
        for h_list in normalization_headers_by_phase.values():
            normalization_headers_list = normalization_headers_list + h_list

        required_headers: list[str] = list(set(criteria_header_list + normalization_headers_list + mandatory_headers))
        return required_headers

    def extract_criteria_headers(self, neighbor_criteria_dict: dict) -> list[str]:
        return [criteria['criteriaType'] for criteria in neighbor_criteria_dict]

    def prepare_norm_multipliers(self, multipliers: np.ndarray) -> List[Dict]:
        '''
        Do some minor data transformation to the normalization multipliers to prepare them for writing to the DB.

        Args:
            multipliers: The 2d array of normalization multipliers

        Returns:
            List of multipliers converted to dictionaries (for normalization schema compatibility)

        '''
        norm_multipliers = []

        for pair in multipliers:
            eur, _ = pair[0], pair[1]
            if eur is None or np.isnan(eur):
                eur = 1

            # proximity forecast do not support 2-factor norm
            norm_multipliers.append({'eur': eur, 'qPeak': None})

        return norm_multipliers

    def write_data_to_db(self, bulk_list: list, collection_name: str) -> list:
        '''
        Write bulk list data to the desired database

        Args:
            bulk list: A list of the items that needed to be write in to the database
            collection_name: the target collection name in database

        Returns:
            list: A list of the database writing results
        '''
        num_updates = int(np.ceil(len(bulk_list) / 500))
        results = []
        for i in range(num_updates):
            this_bulk = bulk_list[(i * 500):(i + 1) * 500]
            result = self.context.db[collection_name].bulk_write(this_bulk)
            results += [result.bulk_api_result]

        return results

    def get_proximity_document_update_body(self, doc: ProximityDocument) -> UpdateOne:
        return UpdateOne(
            filter={
                'forecast': doc.forecast,
                'well': doc.well,
                'phase': doc.phase,
            },
            update={'$set': doc.dict()},
            upsert=True,
        )

    def get_neighbor_wells(
        self,
        neighbor_well_params: dict,
        candidate_well_data: dict,
        target_well_header_dict: dict,
    ) -> tuple[list, dict, dict, list, dict, ProximityErrorType]:
        phase: AnyStr = neighbor_well_params['phase']
        phase_type: AnyStr = neighbor_well_params['phase_type']
        base_phase: AnyStr = neighbor_well_params.get('base_phase')
        target_forecast: AnyStr = neighbor_well_params['proximity_forecast_id']
        resolution: str = neighbor_well_params.get('resolutionPreference', 'monthly')

        target_well_id_str: AnyStr = neighbor_well_params['target_well_id']
        neighbor_dict = neighbor_well_params['neighbor_dict']
        search_radius = neighbor_dict['searchRadius']
        radius_in_haversine_distance = search_radius / EARTH_RADIUS

        target_well_headers = target_well_header_dict[target_well_id_str]
        candidate_wells = [w for w in candidate_well_data['well_headers'] if str(w['_id']) != target_well_id_str]
        well_forecast_pairs = candidate_well_data['well_forecast_pairs']
        well_forecast_pairs = list(filter(lambda x: x['well'] != target_well_id_str, well_forecast_pairs))

        selected_forecasts: List[AnyStr] = neighbor_dict['selectedForecasts']
        selected_forecasts: List[AnyStr] = sorted(set(selected_forecasts), key=selected_forecasts.index)

        well_forecast_dict: Dict[AnyStr, AnyStr] = {}
        for forecast in selected_forecasts:
            wells_with_forecast: List = list(filter(lambda x: str(x['forecast']) == forecast, well_forecast_pairs))
            for well in wells_with_forecast:
                if not well_forecast_dict.get(str(well['well'])):
                    well_forecast_dict[str(well['well'])] = forecast

        target_location = [target_well_headers.get('surfaceLatitude'), target_well_headers.get('surfaceLongitude')]
        if target_location[0] is None or target_location[1] is None:
            return [], {}, {}, [], {}, ProximityErrorType.INVALID_TARGET
        target_in_radians = np.radians(target_location).reshape(-1, 2)

        parsed_neighbor_well_list = list(map(parse_well_header, candidate_wells))
        parsed_target_well_info = parse_well_header(target_well_headers)
        ####### following filtering
        neighbor_well_df = pd.DataFrame(parsed_neighbor_well_list)
        minimum_wells = neighbor_dict['wellCountRange']['start']
        maximum_wells = neighbor_dict['wellCountRange']['end']

        mandatory_fields = []
        optional_fields = []
        for field in neighbor_dict['selectedFields']:
            if neighbor_dict[field]['mandatory']:
                mandatory_fields += [field]
            else:
                optional_fields += [field]

        for field in mandatory_fields + optional_fields:
            field_criteria = neighbor_dict[field]
            valid_mask = get_valid_mask(neighbor_well_df, field_criteria, parsed_target_well_info, field)
            filtered_num = np.sum(valid_mask)
            if filtered_num < minimum_wells:
                if field_criteria['mandatory']:
                    neighbor_well_df = neighbor_well_df.loc[valid_mask, :]
                    break
                else:
                    continue

            neighbor_well_df = neighbor_well_df.loc[valid_mask, :]

        if neighbor_well_df.shape[0] == 0:
            return [], {}, {}, [], {}, ProximityErrorType.NO_WELLS

        # Clean up the dataframe a bit
        neighbor_well_df['_id'] = neighbor_well_df['_id'].astype(str)

        # Sort and filter by distance to the target well
        neighbor_lat_in_radians = np.radians(np.array(neighbor_well_df['surfaceLatitude']))
        neighbor_long_in_radians = np.radians(np.array(neighbor_well_df['surfaceLongitude']))
        neighbor_location = np.array([neighbor_lat_in_radians, neighbor_long_in_radians]).transpose()
        dist = my_haversine_distances(neighbor_location, target_in_radians)
        neighbor_well_df['ProximityTargetDistance'] = dist

        neighbor_well_df = neighbor_well_df[neighbor_well_df['ProximityTargetDistance'] <= radius_in_haversine_distance]
        neighbor_well_df = neighbor_well_df.sort_values('ProximityTargetDistance')
        neighbor_well_df = neighbor_well_df.drop('ProximityTargetDistance', axis=1)

        pre_rep_filter_well_list: List[AnyStr] = list(neighbor_well_df['_id'])

        # Setup indices for searching for valid proximity wells
        search_start_idx = 0
        search_end_idx = min(maximum_wells, len(pre_rep_filter_well_list))

        # Get the rep data for `maximum_wells` number of items (usually 25)
        search_list = pre_rep_filter_well_list[search_start_idx:search_end_idx]
        temp_well_forecast_dict = {w: well_forecast_dict[w] for w in search_list}
        proximity_rep_data_final: List[Dict] = self._create_proximity_rep_data(phase, phase_type, base_phase,
                                                                               target_forecast, search_list,
                                                                               temp_well_forecast_dict, resolution)

        proximity_rep_data_final = self._filter_valid_rep_data(phase, proximity_rep_data_final)

        while len(proximity_rep_data_final) < minimum_wells:
            # Setup the range of wells to search through, and other data structures
            search_start_idx = search_end_idx
            search_end_idx = min(search_end_idx + maximum_wells, len(pre_rep_filter_well_list))
            search_list = pre_rep_filter_well_list[search_start_idx:search_end_idx]
            temp_well_forecast_dict = {w: well_forecast_dict[w] for w in search_list}

            # Check that we aren't at the end of our list
            if search_start_idx == len(pre_rep_filter_well_list):
                break

            # Get the valid rep_data for the new batch
            proximity_rep_data = self._create_proximity_rep_data(phase, phase_type, base_phase, target_forecast,
                                                                 search_list, temp_well_forecast_dict, resolution)

            proximity_rep_data = self._filter_valid_rep_data(phase, proximity_rep_data)

            # ... and add any valid ones to the valid rep list
            proximity_rep_data_final.extend(proximity_rep_data)

        rep_well_ids: List[AnyStr] = [r_well['well_id'] for r_well in proximity_rep_data_final]

        neighbor_well_df: pd.DataFrame = neighbor_well_df[neighbor_well_df['_id'].isin(rep_well_ids)]

        # Trim the wells dataframe to the correct size
        if neighbor_well_df.shape[0] > maximum_wells:
            neighbor_well_df = neighbor_well_df.iloc[:maximum_wells, :]

        # Final data preparation
        well_list = list(neighbor_well_df['_id'])
        well_forecast_dict = {k: v for k, v in well_forecast_dict.items() if k in well_list}
        wells_by_forecast = {}
        for well, forecast in well_forecast_dict.items():
            wells_by_forecast[forecast] = wells_by_forecast.get(forecast, []) + [well]
        proximity_rep_data_final = [x for x in proximity_rep_data_final if x['well_id'] in well_list]

        # Final check to ensure we have at least the min number of wells, or set the error type.
        if neighbor_well_df.shape[0] >= minimum_wells:
            return (well_list, well_forecast_dict, wells_by_forecast, proximity_rep_data_final, target_well_headers,
                    ProximityErrorType.NONE)
        elif neighbor_well_df.shape[0] == 0:
            return [], {}, {}, [], {}, ProximityErrorType.NO_WELLS
        else:
            ## well_list: list of well ids
            ## well_forecast_dict: key by well, value is the forecast this well is the forecast with higher priority
            ## wells_by_forecast: key by forecast, value is list of well, no repeated wells among multiple forecasts
            ## proximity_rep_data: List[Dict] same data as tc_rep_init
            ## target_well_info: Dict with target well headers
            ## proximity_error: ProximityErrorType  Error type (if any)
            return (well_list, well_forecast_dict, wells_by_forecast, proximity_rep_data_final, target_well_headers,
                    ProximityErrorType.INSUFFICIENT_WELLS)

    def _filter_valid_rep_data(self, phase: str, rep_data: list[dict]) -> list[dict]:
        """
        Filter out the rep data to remove wells that are invalid for the specified phase.

        Args:
            phase (str): The phase being checked
            rep_data (list[dict]): List of rep_data objects for wells.

        Returns:
            list[dict]: Same rep_data list from before, filtered to remove invalid wells.
        """
        return [rep_data for rep_data in rep_data if rep_data['valid'][phase]]

    def _create_proximity_rep_data(self, phase: AnyStr, phase_type: AnyStr, base_phase: AnyStr, target_forecast: AnyStr,
                                   wells: List[AnyStr], well_forecast_dict: Dict, resolution_preference: str):
        phase_types = {x: 'rate' for x in ['oil', 'gas', 'water']}
        phase_types[phase] = phase_type

        rep_init_params = {
            'forecast': target_forecast,
            'wells': wells,
            'basePhase': base_phase,
            'phaseType': phase_types,
            'tcType': phase_type,
            'wellForecastMap': well_forecast_dict,
            'resolutionPreference': resolution_preference,
        }
        proximity_rep_data = self.proximity_rep_init(rep_init_params)
        return proximity_rep_data

    def prepare_manual_proximity_info(self, params: dict):
        neighbor_criteria = params['neighbor_dict']
        header_list: list[str] = neighbor_criteria['selectedFields'] + mandatory_headers
        candidate_well_data, target_well_header_dict = self.prepare_background_wells_info(
            [params['target_well_id']],
            params['neighbor_dict']['selectedForecasts'],
            header_list,
        )

        return self.prepare_tc_info(params, candidate_well_data, target_well_header_dict)

    def prepare_tc_info(
        self,
        params: dict,
        candidate_well_data: dict,
        target_well_header_dict: dict,
    ) -> dict:
        """
        Prepares the background well information and TC rep data for a proximity run.

        Args:
            params (dict): parameters for determining neighbor wells and tc data
            use_cache (bool): Should data be cached locally within the service?
        Returns:
            dict: Background well and tc info for a proximity run.
        """
        phase: AnyStr = params['phase']
        phase_type: AnyStr = params['phase_type']
        target_forecast: AnyStr = params['proximity_forecast_id']

        (wells, well_forecast_dict, wells_by_forecast, proximity_rep_data, target_well_headers,
         proximity_error) = self.get_neighbor_wells(params, candidate_well_data, target_well_header_dict)

        # No errors getting neighbor wells
        if proximity_error == ProximityErrorType.NONE:

            tc_fit_init_body = self._proximity_tc_fit_init(wells, params, wells_by_forecast, well_forecast_dict,
                                                           proximity_rep_data)

            headers_map = self._get_headers_map(wells)
            fit_init = self._get_fit_init(target_forecast, phase_type, phase)
            tc_info = self._get_tc_info(wells)
            raw_background_data = self._get_raw_background_data(wells, tc_fit_init_body)

            return make_serializable({
                'headersMap': headers_map,
                'rawBackgroundData': raw_background_data,
                'tcInfo': tc_info,
                'fitInit': fit_init,
                'wells': wells,
                'wellForecastMap': well_forecast_dict,
                'repInit': proximity_rep_data,
                'warning': {
                    'status': False,
                    'message': '',
                },
                'target_well_headers': target_well_headers,
            })
        else:
            warning_body = deepcopy(proximity_error.value)
            # Warning parameters to be provided to the error messages when formatting.
            warning_params = {
                'n_wells': len(wells),
                'min_wells': params.get('neighbor_dict', {}).get('wellCountRange', {}).get('start'),
            }
            if warning_body:
                warning_body['message'] = warning_body['message'].format(**warning_params)
                return {'warning': warning_body}
            else:
                return None

    def _proximity_tc_fit_init(self, wells, params, wells_by_forecast, well_forecast_dict, proximity_rep_data=[]):
        phase = params['phase']
        phase_type = params['phase_type']
        resolution_preference = params.get('resolutionPreference', 'monthly')

        wells_info_for_background_data = {
            'wellsResolvedResolution': {},
            'wellsDataInfo': {},
            'wellsForecastInfo': {},
            'wellsEurInfo': {},
        }
        for well in proximity_rep_data:
            well_id = well['well_id']
            wells_info_for_background_data['wellsResolvedResolution'][well_id] = well['resolved_resolution']
            wells_info_for_background_data['wellsDataInfo'][well_id] = well['data_info']
            wells_info_for_background_data['wellsForecastInfo'][well_id] = well['forecast_info']
            wells_info_for_background_data['wellsEurInfo'][well_id] = well['eur']

        proximity_fit_init_input_data = self._get_proximity_fit_init_data(phase, phase_type, wells, wells_by_forecast,
                                                                          wells_info_for_background_data,
                                                                          params.get('base_phase', None))
        # TODO: check that we only have valid values for resolution preference
        init_para_dict = {
            "TC_life": int(params['num_month'] / 12),  ## unit is year
            'forecast_series': 'best',
            'TC_target_data_freq': resolution_preference,
        }

        proximity_fit_init_input_data.update({'init_para_dict': init_para_dict})

        obj = tc_init()
        ret = obj.body(proximity_fit_init_input_data)

        return ret

    def _get_proximity_fit_init_data(self,
                                     phase,
                                     phaseType,
                                     wells,
                                     wells_by_forecast,
                                     wells_valid_info,
                                     base_phase=None):
        well_strs = [str(well) for well in wells]

        resolved_resolution, data_info, forecast_info = wells_valid_info['wellsResolvedResolution'], wells_valid_info[
            'wellsDataInfo'], wells_valid_info['wellsForecastInfo']

        production_maps = {'daily': {}, 'monthly': {}}
        for resolution in ['daily', 'monthly']:
            productions = self.context.production_service.get_production(well_strs, resolution == 'daily')
            production_maps[resolution] = {
                str(x['_id']): {key: x[key]
                                for key in ['index', 'oil', 'gas', 'water']}
                for x in productions
            }
        ################
        forecast_data_docs = list(
            self.context.deterministic_forecast_datas_collection.aggregate([
                {
                    '$match': {
                        '$or': [{
                            'well': {
                                '$in': [ObjectId(x) for x in forecast_well_strs]
                            },
                            'forecast': ObjectId(forecast_str)
                        } for forecast_str, forecast_well_strs in wells_by_forecast.items()]
                    }
                },
            ]))

        forecast_map = generate_forecast_map(forecast_data_docs)
        #### forecast

        well_list = [{
            'well': well_str,
            'daily': production_maps['daily'].get(well_str),
            'monthly': production_maps['monthly'].get(well_str),
            'forecast': forecast_map.get(well_str)
        } for well_str in well_strs]

        return {
            'well_list': well_list,  # list of wells with forecasted data
            'phaseType': phaseType,  # rate/ratio
            'target_phase': phase,  # which phase are we looking at?  oil/gas/water
            'base_phase': base_phase,
            'forecast_series': 'best',  # 'best', because we are only using deterministic
            'resolved_resolution': resolved_resolution,
            'data_info': data_info,
            'forecast_info': forecast_info,
            'eur_info': wells_valid_info['wellsEurInfo'],
            'forecast_parent_type': 'deterministic'
        }

    def _get_headers_map(self, wells):
        wells_list = list(
            self.wells_collection.aggregate([{
                '$match': {
                    "_id": {
                        "$in": [ObjectId(w) for w in wells]
                    }
                }
            }, {
                '$project': {k: 1
                             for k in headers_map_list}
            }]))

        headers_map = {}
        for well in wells_list:
            headers_map[str(well['_id'])] = well
            del headers_map[str(well['_id'])]['_id']
        return headers_map

    def _get_tc_info(self, wells):
        _tc_info_keys = [
            'first_prod_date',
            'perf_lateral_length',
            'total_fluid_per_perforated_interval',
            'total_proppant_per_perforated_interval',
        ]
        tc_info = {k: [] for k in _tc_info_keys}
        for well in wells:
            match = {'$match': {'_id': ObjectId(well)}}
            project = {
                '$project': {
                    '_id': 1,
                    'first_prod_date': 1,
                    'perf_lateral_length': 1,
                    'total_fluid_per_perforated_interval': 1,
                    'total_proppant_per_perforated_interval': 1
                }
            }
            well_record = list(self.wells_collection.aggregate([match, project]))[0]
            for k in _tc_info_keys:
                if k == 'first_prod_date' and well_record.get(k):
                    tc_info[k].append(well_record[k].isoformat())
                else:
                    tc_info[k].append(well_record.get(k))
        return tc_info

    def _get_fit_init(self, forecast_id: AnyStr, phase_type: AnyStr, phase: AnyStr):
        fit_init = {
            'forecast': forecast_id,
            'phaseType': {k: phase_type if k == phase else 'rate'
                          for k in ['oil', 'gas', 'water']}
        }
        return fit_init

    def _get_raw_background_data(self, wells, tc_fit_init_body):
        # TODO: differentiate target_phase and ratio
        return {**tc_fit_init_body, 'normalization': np.ones((len(wells), 2))}

    ## this one is mimicing the tc.rep_init
    ####################################################################### normalization
    def proximity_rep_init(self, params: Dict):
        tc_service: TypeCurveService = self.context.type_curve_service
        # forecast_id_s: AnyStr = params['forecast']
        well_id_s: List[AnyStr] = params['wells']
        n_wells: int = len(well_id_s)
        # forecast_id: ObjectId = ObjectId(forecast_id_s)
        well_id: List[ObjectId] = [ObjectId(w) for w in well_id_s]
        base_phase: AnyStr = params['basePhase']
        phase_type: Dict[AnyStr, AnyStr] = params['phaseType']
        tc_type: AnyStr = params['tcType']
        well_forecast_map_s: Dict[AnyStr, AnyStr] = params['wellForecastMap']
        items: List[AnyStr] = params.get('items', ['header', 'forecast_info', 'data_info', 'production', 'eur'])
        header_items: Optional[List[AnyStr]] = params.get('header_items')
        resolution_preference: str = params.get('resolutionPreference', 'forecast')

        if header_items is None:
            header_items = headers_map_list

        TC_forecast_parent_type = 'deterministic'
        well_headers = [None] * n_wells
        well_productions = [None] * n_wells
        well_forecast_data_s = [None] * n_wells

        forecast_data_map_final = {}

        wells_by_forecast = {}
        for well, forecast in well_forecast_map_s.items():
            wells_by_forecast[forecast] = wells_by_forecast.get(forecast, []) + [well]

        for forecast, wells in wells_by_forecast.items():
            (_, headers, productions, forecast_data_s,
             forecast_data_map) = tc_service._get_well_data(ObjectId(forecast), [ObjectId(well) for well in wells],
                                                            header_items)

            for i in range(len(headers)):
                head = headers[i]
                prod = productions[i]
                data = forecast_data_s[i]

                well_idx = well_id.index(head['_id'])

                well_headers[well_idx] = head
                well_productions[well_idx] = prod
                well_forecast_data_s[well_idx] = data

                forecast_data_map_final.update(**forecast_data_map)

        init_input_data = {
            'TC': {
                'basePhase': base_phase,
                'tcType': tc_type,
                'phaseType': phase_type,
                'resolutionPreference': resolution_preference,
                'wellValidationCriteria': WellValidationCriteriaEnum.either_have_prod_or_forecast.value,
            },
            'forecast_series':
            'best',
            'TC_forecast_parent_type':
            TC_forecast_parent_type,
            'forecast_data_map':
            forecast_data_map_final,
            'well_data_s': [{
                'header': well_headers[i],
                'production': well_productions[i],
                'forecast': well_forecast_data_s[i]
            } for i in range(len(well_id))]
        }

        ret = rep_init(init_input_data, items, header_items)

        return ret

    def _get_phase_p_dict(self, forecast_id: AnyStr, well_id: AnyStr, phase: AnyStr):
        forecast_collection: Collection = self.context.deterministic_forecast_datas_collection
        forecast_pipeline = [{
            '$match': {
                'forecast': ObjectId(forecast_id),
                'well': ObjectId(well_id),
                'phase': phase
            }
        }, {
            '$project': {
                'P_dict': 1,
            }
        }]

        P_dict = list(forecast_collection.aggregate(forecast_pipeline))[0]['P_dict']
        return P_dict

    def get_well_fpd_index(self, well_id_s: AnyStr, resolution: AnyStr = 'monthly'):
        pipeline = [{
            '$match': {
                '_id': ObjectId(well_id_s)
            }
        }, {
            '$project':
            {header: 1
             for header in ['first_prod_date_monthly_calc', 'first_prod_date_daily_calc', 'first_prod_date']}
        }]
        headers_list = list(self.wells_collection.aggregate(pipeline))
        if len(headers_list):
            headers = headers_list[0]
            first_prod_date_monthly_calc: Union[date, datetime] = headers.get('first_prod_date_monthly_calc')
            first_prod_date_daily_calc: Union[date, datetime] = headers.get('first_prod_date_daily_calc')
            first_prod_date: Union[date, datetime] = headers.get('first_prod_date')

            monthly_calc = date(first_prod_date_monthly_calc.year, first_prod_date_monthly_calc.month,
                                15) if first_prod_date_monthly_calc else None
            daily_calc = date(first_prod_date_daily_calc.year, first_prod_date_daily_calc.month,
                              first_prod_date_daily_calc.day) if first_prod_date_daily_calc else None

            if resolution == 'monthly':
                fpd_list = [monthly_calc, first_prod_date, daily_calc, datetime.utcnow()]
            else:
                fpd_list = [daily_calc, first_prod_date, monthly_calc, datetime.utcnow()]

            # get the first non-None fpd value
            fpd = next(filter(bool, fpd_list), None)
            fpd_index = days_from_1900(fpd)
        else:
            fpd_index = days_from_1900(datetime.utcnow())

        return fpd_index

    ###################################################################################### fit
    def apply_TC_fit(self, tc_segments: List[Dict], target_bg_info: Dict, phaseType: AnyStr, basePhase: AnyStr,
                     TC_para_dict: Dict, initial_fit_params: Dict) -> Dict[AnyStr, Any]:
        '''
        Takes a TC fit, and applies it to the target well's background data.

        Params:
            tc_segments (List[Dict]): Segments that need to be fitted to target data
            target_bg_info (Dict): Structure to contain info about target well
            phaseType (AnyStr): "Rate" or "Ratio"
            basePhase (AnyStr): If target phase is Ratio, this is the base of the ratio.
            TC_para_dict (Dict): The parameters used to generate the TC segments.
            initial_fit_params (Dict): Contains data used to create initial fits.  Used for fitting methods that
                require background well information
        Returns:
            Updated deterministic_forecast_datas object.
        '''
        model_name: AnyStr = TC_para_dict['TC_model']
        multi_segs: MultipleSegments = MultipleSegments()
        segments: List[Dict] = deepcopy(tc_segments)
        target_bg_data = target_bg_info.get('target_bg_data')
        bg_wells_data: Dict = initial_fit_params['init_data']

        desired_well_life = TC_para_dict['well_life']

        update_body = return_template(forecastType=phaseType)

        update_body['data_freq'] = target_bg_info['resolution']

        fpd_index = self.get_well_fpd_index(target_bg_info['wellId'], target_bg_info['resolution'])

        if (target_bg_data is None) or \
           (len(target_bg_data.get('index', [])) == 0) or \
           (not any(target_bg_data['value'])) or \
           (np.all(np.isnan(np.array(target_bg_data['value'], dtype=float)))):
            # we have no production data for the selected resolution...
            update_ratio_or_P_dict(update_body, phaseType)

            segments_starting_today = multi_segs.shift_segments_idx(deepcopy(segments), fpd_index)

            if phaseType == 'ratio':
                update_body['ratio'] = {
                    'segments': segments_starting_today,
                    'basePhase': basePhase,
                    'x': 'time',
                    'diagnostics': {}
                }
                update_body['P_dict'] = {}
            else:
                update_body['P_dict']['best']['segments'] = segments_starting_today

            update_body = self.trim_well_life(fpd_index, update_body, desired_well_life)

            return update_body

        model_name = ("ratio_t_" if phaseType == 'ratio' else "") + model_name
        model: model_parent = mm.models[model_name]

        fit_update_body = model.TC_fit_to_bg_data(segments, target_bg_info, bg_wells_data, phaseType, basePhase,
                                                  TC_para_dict, fpd_index)

        final_result = self.trim_well_life(fpd_index, fit_update_body, desired_well_life)
        return final_result

    def trim_well_life(self, fpd_index: int, forecast_body: Dict, desired_well_life: float) -> Dict:
        '''
        Trims the well life of the forecast to honor the user's inputed `desired_well_life`.

        Args:
            fpd_index (int): First production date (as an index)
            forecast_body (Dict): deterministic_forecast_datas object containing proximity segments etc
            desired_well_life (float): The desired final maximum well life

        Returns:
            Dict: forecast body object with updated segments to honor the desired well life
        '''
        # If all we have is a warning, just exit.
        if set(forecast_body.keys()) == {'warning'}:
            return forecast_body

        forecast_type = forecast_body.get('forecastType')

        mmwls = self.mass_modify_well_life_service

        if forecast_type == 'rate':
            forecast_segments = forecast_body['P_dict'].get('best', {}).get('segments')
        else:
            forecast_segments = forecast_body['ratio'].get('segments')

        if len(forecast_segments) == 0:
            return forecast_body

        fixed_well_life_end_idx = shift_idx(fpd_index, desired_well_life, 'year')

        last_segment_end_idx = forecast_segments[-1]['end_idx']

        if fixed_well_life_end_idx < last_segment_end_idx:
            forecast_segments, _ = mmwls.change_forecast_segment_end_date(fixed_well_life_end_idx, Q_MIN,
                                                                          forecast_segments, False)

        if forecast_type == 'rate':
            forecast_body['P_dict']['best']['segments'] = forecast_segments
        else:
            forecast_body['ratio']['segments'] = forecast_segments

        return forecast_body

    def get_prox_fits(self, wells_eur, phase_fit_params):
        valid_eur = check_eur(wells_eur)
        update_forecast = True
        if valid_eur:
            proximity_fits = self.generate_proximity_fits(phase_fit_params)
        else:
            proximity_fits = EMPTY_FITS
            update_forecast = False

        return proximity_fits, update_forecast


def parse_well_header(well):
    updates = {}
    for k in date_headers_list:
        if header_value := well.get(k):
            if type(header_value) in [str]:
                try:
                    updates[k] = index_from_date_str(header_value)
                except Exception:
                    pass
            elif type(header_value) in [datetime, date]:
                updates[k] = days_from_1900(header_value)
            elif type(header_value) in [np.datetime64]:
                updates[k] = np.datetime_as_string(header_value)
            else:
                # Unsure what other value types we could have.  Possibly indices?  If it is an index,
                #  no modification would be needed.
                pass

    return {**well, **updates}


def check_for_number(value):
    return value != '' and type(value) not in [
        type(None), str
    ] and (not np.isnan(value)) and (not np.isinf(value)) and type(value) in [
        int, float, np.int8, np.int16, np.int32, np.int64, np.float16, np.float32, np.float64
    ]


def check_for_date_str(v):
    return type(v) == str and len(v) > 10


def merge_range(range_1, range_2):
    left_values = []
    right_values = []
    if check_for_number(range_1[0]):
        left_values += [range_1[0]]

    if check_for_number(range_1[1]):
        right_values += [range_1[1]]

    if check_for_number(range_2[0]):
        left_values += [range_2[0]]

    if check_for_number(range_2[1]):
        right_values += [range_2[1]]

    return [
        None if len(left_values) == 0 else max(left_values),
        None if len(right_values) == 0 else min(right_values),
    ]


def convert_keys_snake_to_camel(x: Dict) -> Dict:
    '''
    Converts keys of a dictionary from snake case to camel case.

    Args:
        x (Dict): dict with snake case keys

    Returns:
        Dict: dict with camel case keys
    '''
    ret = {}
    for k, v in x.items():
        key_parts = k.split('_')
        jsified_key = key_parts[0] + ''.join(part.title() for part in key_parts[1:])
        ret[jsified_key] = v

    return ret


def get_valid_mask(neighbor_well_df, field_criteria, parsed_target_well_info, field):
    fields = field.split('/')

    if len(fields) == 1:
        dtype_map = {'number': float, 'string': str, 'date': float}
        target_well_value = parsed_target_well_info.get(fields[0])
        this_col = np.array(neighbor_well_df.get(fields[0], [None] * neighbor_well_df.shape[0]),
                            dtype=dtype_map[field_criteria['type']])

    else:
        target_well_value = scalar_ops['/'](parsed_target_well_info.get(fields[0]),
                                            parsed_target_well_info.get(fields[1]))
        numerator_arr = np.array(neighbor_well_df.get(fields[0], [None] * neighbor_well_df.shape[0]), dtype=float)
        denominator_arr = np.array(neighbor_well_df.get(fields[1], [None] * neighbor_well_df.shape[0]), dtype=float)
        this_col = arr_ops['/'](numerator_arr, denominator_arr)

    valid_mask = np.ones(neighbor_well_df.shape[0], dtype=bool)
    if field_criteria['type'] == 'string':
        if type(target_well_value) == str or target_well_value is None:
            valid_mask = this_col == target_well_value
    elif field_criteria['type'] == 'number':
        absolute_range = field_criteria.get('absoluteRange', {})
        relative_value = field_criteria.get('relativeValue')
        relative_percentage = field_criteria.get('relativePercentage')
        this_col_range = [None, None]
        if check_for_number(target_well_value):
            if check_for_number(relative_value):
                relative_value_range = [target_well_value - relative_value, target_well_value + relative_value]
                this_col_range = merge_range(this_col_range, relative_value_range)

            if check_for_number(relative_percentage):
                relative_percentage_range = [
                    target_well_value * (1 - relative_percentage / 100), target_well_value *
                    (1 + relative_percentage / 100)
                ]
                this_col_range = merge_range(this_col_range, relative_percentage_range)
        this_col_range = merge_range(this_col_range, [absolute_range.get('start'), absolute_range.get('end')])
        if check_for_number(this_col_range[0]):
            valid_mask = valid_mask & (this_col.astype(float) >= this_col_range[0])

        if check_for_number(this_col_range[1]):
            valid_mask = valid_mask & (this_col.astype(float) <= this_col_range[1])
    elif field_criteria['type'] == 'date':
        relative_value = field_criteria.get('relativeValue')
        absolute_range = [
            field_criteria.get('absoluteRange', {}).get('start'),
            field_criteria.get('absoluteRange', {}).get('end')
        ]
        date_range = [index_from_date_str(str(x)) if check_for_date_str(x) else None for x in absolute_range]
        if check_for_number(target_well_value):
            if check_for_number(relative_value):
                date_range = merge_range(date_range, [shift_idx(target_well_value, -relative_value, 'month'), None])
                date_range = merge_range(date_range, [None, shift_idx(target_well_value, relative_value, 'month')])

        if check_for_number(date_range[0]):
            valid_mask = valid_mask & (this_col.astype(float) >= date_range[0])

        if check_for_number(date_range[1]):
            valid_mask = valid_mask & (this_col.astype(float) <= date_range[1])
    return valid_mask


def my_haversine_distances(x_arr, y_arr):
    part1 = np.square(np.sin((x_arr[:, 0] - y_arr[:, 0]) / 2))
    part2 = np.square(np.sin((x_arr[:, 1] - y_arr[:, 1]) / 2))
    part3 = np.cos(x_arr[:, 0]) * np.cos(y_arr[:, 0]) * part2
    final = 2 * np.arcsin(np.sqrt(part1 + part3))
    return final


def check_eur(wells_eur):
    for eur in wells_eur:
        if eur and eur > 0:
            return True

    return False
