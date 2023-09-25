from collections import defaultdict
import logging
from typing import Any, Dict, Iterable, List
from bson.objectid import ObjectId
import numpy as np
from pymongo import UpdateOne, InsertOne
import datetime
from combocurve.science.forecast.forecast_body_v2 import MATCH_EUR_AVAILABLE
from combocurve.science.forecast.forecast_body_v2 import apply_forecast
from combocurve.science.segment_models.multiple_segments import MultipleSegments
from combocurve.utils.exceptions import get_exception_info
from combocurve.services.forecast.shared import (check_None_and_update, get_para_dicts,
                                                 adjust_para_dict_for_header_range, get_para_dict_date_headers)
from combocurve.shared.constants import GAS_STR, OIL_STR, PHASES, WATER_STR

EMPTY_COMPARISON_IDS = {'diagonstics': [], 'manual': [], 'view': []}
Q_FINAL_PHASES = PHASES + ['oil/gas', 'oil/water', 'gas/oil', 'gas/water', 'water/oil', 'water/gas']
Q_FINAL_DICT_DEFAULT = {phase: None for phase in Q_FINAL_PHASES}
WARNING_DEFAULT = {'status': False, 'message': ''}
RATIO_DEFAULT = {'segments': [], 'diagnostics': {}, 'basePhase': None, 'x': None}
TYPE_CURVE_APPLY_SETTING_DEFAULT = {
    'applyNormalization': False,
    'fpdSource': 'fixed',
    'schedule': None,
    'fixedDateIdx': None,
    'series': 'best',
    'riskFactor': None
}


class DeterministicForecastService(object):
    '''
    Service for deterministic forecasts. Entry point is "forecast."

    Dependencies:
    - Services: production_service
    - Collections: deterministic_forecast_datas_collection
    '''
    def __init__(self, context):
        self.context = context

    def get_update_body(
            self,
            well_id: ObjectId,
            forecast_id: ObjectId,
            phase: str,
            user: str = None,  ## TODO, make it not default to None and user will be required
            model_name: str = None,
            P_dict: dict = {},
            forecasted: bool = None,
            forecastType: str = None,
            forecastSubType: str = None,
            ratio: dict = {},
            warning: dict = None,
            data_freq: str = None,
            p_extra: dict = None,
            typeCurve: ObjectId = None,
            typeCurveApplySetting: dict = None,
            diagnostics: dict = None,
            diagDate: datetime.datetime = None,
            lastAutomaticRun: dict = None,
            is_diagnostics: bool = False,
            calc_eur: bool = False,
            cum: float = 0.0,
            last_prod_idx: int = None,
            base_segs: List[Dict[str, Any]] = None) -> UpdateOne:
        # forecasted --> true
        # data_freq --> monthly/daily
        # forecastType --> type_here

        # runDate --> new Date()
        # status --> in_progress

        cur_time = datetime.datetime.utcnow()
        update_set = {'updatedAt': cur_time}
        if forecasted:
            update_set['forecastedAt'] = cur_time

        check_None_and_update(update_set, 'model_name', model_name)
        check_None_and_update(update_set, 'forecasted', forecasted)
        check_None_and_update(update_set, 'forecastType', forecastType)
        check_None_and_update(update_set, 'forecastSubType', forecastSubType)
        check_None_and_update(update_set, 'warning', warning)
        check_None_and_update(update_set, 'data_freq', data_freq)
        check_None_and_update(update_set, 'p_extra', p_extra)
        check_None_and_update(update_set, 'typeCurve', typeCurve)
        check_None_and_update(update_set, 'typeCurveApplySetting', typeCurveApplySetting)
        check_None_and_update(update_set, 'diagnostics', diagnostics)
        check_None_and_update(update_set, 'diagDate', diagDate)

        if P_dict:
            for k, segs_and_diags in P_dict.items():
                if k in ['best']:
                    if calc_eur and forecastType == 'rate':
                        segs = segs_and_diags['segments']
                        if len(segs) == 0:
                            eur = cum
                        else:
                            if last_prod_idx is None:
                                last_prod_idx = int(segs[0]['start_idx'] - 1)
                            eur = MultipleSegments().eur_precise(cum, last_prod_idx, last_prod_idx + 1,
                                                                 int(segs[-1]['end_idx']), segs, data_freq)
                        segs_and_diags['rur'] = eur - cum
                        segs_and_diags['eur'] = eur

                    for kk, v in segs_and_diags.items():
                        update_set['P_dict.{}.{}'.format(k, kk)] = v

        if ratio:
            if calc_eur and forecastType == 'ratio':
                segs = ratio['segments']
                if len(segs) == 0 or base_segs is None:
                    eur = 0.0
                else:
                    if last_prod_idx is None:
                        last_prod_idx = segs[0]['start_idx'] - 1
                    eur = MultipleSegments().ratio_eur(cum, last_prod_idx, last_prod_idx + 1, segs[-1]['end_idx'], segs,
                                                       base_segs, data_freq)
                    ratio['rur'] = eur - cum
                    ratio['eur'] = eur

            for k, v in ratio.items():
                update_set['ratio.{}'.format(k)] = v

        if P_dict is not None and not is_diagnostics:
            if len(P_dict) > 0 or ratio is not None:
                update_set['status'] = 'in_progress'
                update_set['reviewedAt'] = None
                update_set['reviewedBy'] = None

        if user is not None:
            update_set['forecastedBy'] = ObjectId(user)

        return UpdateOne({'forecast': forecast_id, 'well': well_id, 'phase': phase}, {'$set': update_set})

    def get_insert_body(self,
                        well: ObjectId,
                        forecast: ObjectId,
                        phase: str,
                        project: ObjectId,
                        data_freq: str = 'monthly',
                        diagDate: datetime.datetime = None,
                        forecasted: bool = False,
                        P_dict: dict = {},
                        forecastType: str = 'not_forecasted',
                        ratio: dict = RATIO_DEFAULT,
                        warning: dict = WARNING_DEFAULT,
                        p_extra: dict = {},
                        typeCurve: ObjectId = None,
                        typeCurveApplySetting: dict = TYPE_CURVE_APPLY_SETTING_DEFAULT,
                        status: str = 'in_progress',
                        reviewedAt: datetime.datetime = None,
                        reviewedBy: ObjectId = None,
                        forecastedAt: ObjectId = None,
                        forecastedBy: ObjectId = None,
                        diagnostics: dict = None,
                        forecastSubType: str = None,
                        __v: int = 0,
                        **kwargs) -> InsertOne:
        # Inserts into forecast_data collection.

        cur_time = datetime.datetime.utcnow()
        mandatory_set = {
            'well': well,
            'forecast': forecast,
            'phase': phase,
            'project': project,
            'data_freq': data_freq,
            'diagDate': diagDate,
            'forecasted': forecasted,
            'P_dict': P_dict,
            'forecastType': forecastType,
            'ratio': ratio,
            'warning': warning,
            'p_extra': p_extra,
            'typeCurve': typeCurve,
            'status': status,
            'reviewedAt': reviewedAt,
            'reviewedBy': reviewedBy,
            'forecastedAt': forecastedAt,
            'forecastedBy': forecastedBy,
            'createdAt': cur_time,
            'updatedAt': cur_time,
            'typeCurveApplySetting': typeCurveApplySetting,
            'forecastSubType': forecastSubType,
            '__v': __v,
        }

        optional_set = {}
        # Provides access to update optional fields w/out default values
        optional_set.update({k: v for k, v in kwargs.items()})
        check_None_and_update(optional_set, 'diagnostics', diagnostics)
        mandatory_set.update(optional_set)
        return InsertOne(mandatory_set)

    def write_forecast_data_to_db(self, bulk_list):
        num_updates = int(np.ceil(len(bulk_list) / 500))
        results = []
        for i in range(num_updates):
            this_bulk = bulk_list[(i * 500):(i + 1) * 500]
            result = self.context.db['deterministic-forecast-datas'].bulk_write(this_bulk)
            results += [result.bulk_api_result]

        return results

    # Unified deterministic forecast service for rate, ratio, and match eur
    def forecast(self, params):
        # TODO: the db instance should not be accessed directly from services
        # instead, we should use the collection/model instances in `context`
        # this is temporary until all the code using db instances directly is refactorized
        forecast_id: str = params['forecast_id']
        settings: dict = params['settings']
        para_dicts: dict = get_para_dicts(settings)
        reforecast: bool = params['reforecast']
        forecast_phase_bools: Dict[str, bool] = settings['phases']
        forecast_phases = _sort_by_rate([p for p in PHASES if forecast_phase_bools[p]], para_dicts)
        # Need to pull forecasts for match EUR by forecast phases.
        eur_forecast_ids = {}
        extra_phases = []
        for phase in forecast_phases:
            base_phase = para_dicts[phase].get('base_phase')
            # Due to ratio, might need to pull more phases from db than just those being forecasted.
            if base_phase and base_phase not in forecast_phases + extra_phases:
                extra_phases.append(base_phase)
            if para_dicts[phase].get('match_eur', {}).get('match_type') == 'forecast':
                eur_forecast_ids[phase] = para_dicts[phase]['match_eur']['match_forecast_id']
        resolution: str = params['resolution']
        wells: list = params['wells']
        # Query DB. TODO: We could save some time here by checking if we need to fetch data
        # (manual override True and no match eur).
        forecast_datas = self._get_eur_and_manual_data(wells, eur_forecast_ids, forecast_id)
        header_fields = get_para_dict_date_headers(forecast_phases + extra_phases, para_dicts)
        data = self.context.production_service.get_production_with_headers(wells, header_fields, resolution,
                                                                           forecast_phases + extra_phases)
        base_forecasts = self.context.production_service.get_well_forecast_deterministic(
            wells, forecast_id, extra_phases)
        base_forecasts = {str(doc['well']): doc['forecasts'] for doc in base_forecasts}

        reforecast_results = []
        updates = []
        succeeded = []
        failed = []
        forecasted_segments = defaultdict(dict)

        for well in data:
            # Phase independent data
            well_id: str = well['well']
            index = np.array(well['production']['index'], dtype=float)
            headers = well['headers']
            data_freq = well['data_freq']
            for cur_phase in forecast_phases:

                # Dereference date headers to absolute range.
                this_para_dicts = adjust_para_dict_for_header_range(para_dicts, cur_phase, well)

                if not reforecast and not this_para_dicts.get(cur_phase, {}).get(
                        'overwrite_manual', False) and forecast_datas.get(well_id, {}).get(cur_phase, {}).get(
                            'is_manual', False):
                    warning_msg = 'Current forecast was saved from manual editing. Navigate to Run Auto Forecast '
                    warning_msg += 'form and update config with "Overwrite Manual" turned on.'
                    warning = {'message': warning_msg, 'status': True}
                    phase_update = self.get_update_body(ObjectId(well_id),
                                                        ObjectId(forecast_id),
                                                        cur_phase,
                                                        warning=warning)
                    updates.append(phase_update)
                    succeeded += [well_id]

                else:
                    try:

                        # Unpack the data
                        target_values = np.array(well['production'][cur_phase], dtype=float)
                        forecast_type = this_para_dicts[cur_phase]['axis_combo']
                        model_name = this_para_dicts[cur_phase]['model_name']
                        # Beware! Frontend possibly passing stale match EUR parameters.
                        if forecast_type != 'ratio' and this_para_dicts[cur_phase].get('match_eur', {}).get(
                                'match_type', 'no_match') != 'no_match' and model_name in MATCH_EUR_AVAILABLE:
                            forecast_type = 'match_eur'
                        if forecast_type == 'ratio':
                            this_para_dicts[cur_phase]['model_name'] = 'ratio_t_' + model_name
                        base_phase = this_para_dicts[cur_phase].get('base_phase')
                        base_values = np.array(well['production'].get(base_phase), dtype=float)
                        target_eur = None
                        error_percentage = None
                        match_percent_change = 0
                        if forecast_type == 'match_eur':
                            match_settings = this_para_dicts[cur_phase]['match_eur']
                            error_percentage = match_settings['error_percentage'] / 100.0
                            if match_settings['match_type'] == 'number':
                                target_eur = match_settings['match_eur_num']
                            else:  # Match type is 'forecast'
                                match_percent_change: float = match_settings.get('match_percent_change', 0)
                                if well_id in forecast_datas.keys():
                                    target_eur = self._get_target_eur(
                                        index, target_values, cur_phase, data_freq,
                                        forecast_datas[well_id][cur_phase]['eur_forecasts'], match_percent_change)
                                else:
                                    # In this case, the well wasn't in the target forecast, so we'll change to a regular
                                    # rate forecast.
                                    forecast_type = 'rate'

                        # We destruct this_para_dict to flatten all forecast parameters so that they are all accessed
                        # at the same level inside apply_forecast.
                        out = apply_forecast(index=index,
                                             target_values=target_values,
                                             forecast_type=forecast_type,
                                             data_freq=data_freq,
                                             cur_phase=cur_phase,
                                             is_deterministic=True,
                                             base_values=base_values,
                                             target_eur=target_eur,
                                             error_percentage=error_percentage,
                                             headers=headers,
                                             **this_para_dicts[cur_phase])
                        P_dict = out['P_dict']
                        if P_dict is None:
                            P_dict = {}
                        forecasted_segments[well_id][cur_phase] = P_dict.get('best', {}).get('segments', [])

                        if (reforecast):
                            reforecast_results = out
                        else:
                            cum = np.nansum(target_values)
                            last_prod_idx = index[-1] if len(index) > 0 else None
                            base_segs = None
                            if forecast_type == 'ratio':
                                if base_phase in extra_phases:
                                    base_segs = base_forecasts[well_id][base_phase].get('best', {}).get('segments', [])
                                else:
                                    base_segs = forecasted_segments[well_id][base_phase]

                            phase_update = self.get_update_body(ObjectId(well_id),
                                                                ObjectId(forecast_id),
                                                                cur_phase,
                                                                user=params.get('user'),
                                                                P_dict=out.get('P_dict'),
                                                                ratio=out.get('ratio'),
                                                                forecasted=out.get('forecasted'),
                                                                forecastType=out.get('forecastType'),
                                                                forecastSubType=out.get('forecastSubType'),
                                                                warning=out.get('warning'),
                                                                data_freq=out.get('data_freq'),
                                                                p_extra=out.get('p_extra'),
                                                                calc_eur=True,
                                                                cum=cum,
                                                                last_prod_idx=last_prod_idx,
                                                                base_segs=base_segs)
                            updates.append(phase_update)
                            succeeded += [well_id]
                    except Exception as e:
                        error_info = get_exception_info(e)
                        logging.error(error_info['message'],
                                      extra={'metadata': {
                                          'error': error_info,
                                          'det_rate': params
                                      }})
                        if (reforecast):
                            reforecast_results = []
                        else:
                            warning = {'status': True, 'message': 'Automatic forecast failed.'}
                            phase_update = self.get_update_body(ObjectId(well_id),
                                                                ObjectId(forecast_id),
                                                                cur_phase,
                                                                user=params.get('user'),
                                                                warning=warning)
                            updates.append(phase_update)
                            failed += [well_id]

        if (reforecast):
            return reforecast_results
        else:
            write_results = self.write_forecast_data_to_db(updates)
            ret = {'write_results': write_results, 'succeeded': succeeded, 'failed': failed}

            return ret

    def _get_eur_and_manual_data(
        self,
        well_list: list,
        eur_forecast_ids: dict,
        forecast_id: str,
    ) -> dict:
        '''
        Queries forecast collection for data required by match eur, along w/ which forecast are manual forecasts.
        Outputs a dict of the form
        {
            well_id: {
                phase: {
                    'is_manual': bool,
                    'eur_forecasts': {
                        phase: dict
                        ...
                    }
                }
                ...
            }
            ...
        }
        '''

        sort = {'_id': 1}

        match = {
            'well': {
                '$in': list(map(ObjectId, well_list))
            },
            '$or': [{
                'forecast': {
                    '$in': list(map(ObjectId, eur_forecast_ids.values()))
                }
            }, {
                'forecast': ObjectId(forecast_id),
                'forecastSubType': 'manual'
            }]
        }

        group = {
            '_id': '$well',
            'forecast_data': {
                '$push': {
                    'phase': '$phase',
                    'P_dict': '$P_dict',
                    'forecastType': '$forecastType',
                    'forecastSubType': '$forecastSubType',
                    'ratio': '$ratio',
                    'forecast_id': '$forecast'
                }
            }
        }

        forecast_pipeline = [{'$match': match}, {'$group': group}, {'$sort': sort}]
        forecasts = list(self.context.deterministic_forecast_datas_collection.aggregate(forecast_pipeline))

        ret = {}

        for f in forecasts:
            eur_phase_segments = {phase: {} for phase in PHASES}
            manual_phases = dict.fromkeys(PHASES)
            this_well_id = str(f['_id'])
            this_well_data = {}
            for this_forecast in f['forecast_data']:
                this_forecast_phase = this_forecast['phase']
                this_forecast_id = str(this_forecast['forecast_id'])
                if this_forecast_id == forecast_id:
                    manual_phases[this_forecast_phase] = this_forecast['forecastSubType'] == 'manual'
                for k, v in eur_forecast_ids.items():
                    if this_forecast_id == v:
                        if this_forecast['forecastType'] in ['rate', 'not_forecasted']:
                            eur_phase_segments[k].update({this_forecast_phase: this_forecast['P_dict']})
                        else:  # Ratio.
                            eur_phase_segments[k].update({this_forecast_phase: {'ratio': this_forecast['ratio']}})
            for phase in PHASES:
                this_well_data[phase] = {
                    'is_manual': manual_phases.get(phase),
                    'eur_forecasts': eur_phase_segments.get(phase)
                }
            ret[this_well_id] = this_well_data

        return ret

    def _get_target_eur(self, index: np.ndarray, target_values: np.ndarray, cur_phase: str, data_freq: str,
                        forecast_segments: dict, match_percent_change: float) -> float:

        multi_seg = MultipleSegments()

        # Calculate cum of production
        cum_data = np.nansum(target_values, dtype=float)
        forecast_type = 'rate'
        if cur_phase not in forecast_segments.keys():
            # In this case there's no forecast to match to
            return cum_data
        if 'ratio' in forecast_segments[cur_phase].keys():
            forecast_type = 'ratio'
        if forecast_type == 'rate':
            rate_segments = forecast_segments[cur_phase].get('best', {}).get('segments', [])
            if len(rate_segments) == 0:
                this_eur = cum_data
            else:
                if len(index) > 0:
                    end_data_idx = index[-1]
                else:
                    end_data_idx = rate_segments[0]['start_idx'] - 200
                this_eur = multi_seg.eur(cum_data, end_data_idx, rate_segments[0]['start_idx'] - 100,
                                         rate_segments[-1]['end_idx'], rate_segments, data_freq)
        else:  ## ratio
            ratio_segments: list = forecast_segments[cur_phase].get('ratio', {}).get('segments', [])
            base_phase: str = forecast_segments[cur_phase].get('ratio', {}).get('basePhase')
            if base_phase not in [OIL_STR, GAS_STR, WATER_STR]:
                raise Exception('Base phase {} not valid'.format(base_phase))
            base_phase_rate_segments: list = forecast_segments[base_phase].get('best', {}).get('segments', [])
            if len(ratio_segments) == 0 or len(base_phase_rate_segments) == 0:
                this_eur = cum_data
            else:
                if len(index) > 0:
                    end_data_idx = index[-1]
                else:
                    end_data_idx = ratio_segments[0]['start_idx'] - 200
                this_eur = multi_seg.ratio_eur_interval(cum_data, end_data_idx, ratio_segments[0]['start_idx'] - 100,
                                                        ratio_segments[-1]['end_idx'], ratio_segments,
                                                        base_phase_rate_segments, data_freq)
        return this_eur * (1 + match_percent_change / 100)


def _sort_by_rate(phases: Iterable[str], para_dicts: Dict[str, Any]):
    """To compute EUR at end, need to make sure rate phases are computed first."""
    rate_phases = []
    ratio_phases = []
    for p in phases:
        if para_dicts[p]['axis_combo'] == 'rate':
            rate_phases.append(p)
        else:
            ratio_phases.append(p)
    return rate_phases + ratio_phases
