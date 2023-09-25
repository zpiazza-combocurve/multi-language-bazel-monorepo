from bson.objectid import ObjectId
from copy import copy, deepcopy
from combocurve.services.production.helpers import get_daily_monthly_wells, group_forecasts_by_well
from combocurve.services.production.production_service import ProductionService
from combocurve.shared.constants import DETERMINISTIC_STR, PHASES, PROBABILISTIC_STR, PROB_SERIES, BEST_STR
from combocurve.science.segment_models.shared.helper import arps_modified_switch, pred_arps, pred_exp

from combocurve.shared.batch_runner_with_notification import batch_updates_with_progress


class MassAdjustTerminalDeclineService(object):
    def __init__(self, context):
        self.context = context
        self.production_service: ProductionService = self.context.production_service

    def adjust(self, params):
        forecast_id_str = params['forecast_id']
        forecast_id = ObjectId(forecast_id_str)
        wells_str = params['wells']
        wells = list(map(ObjectId, wells_str))
        user = params['user_id']

        form_values = params['form_values']
        phases = form_values['phases']

        ##### get data from db
        forecast_document = self.context.forecasts_collection.find_one({'_id': forecast_id}, {'wells': 0})
        forecast_type = forecast_document['type']
        forecast_service = {
            DETERMINISTIC_STR: self.context.deterministic_forecast_service,
            PROBABILISTIC_STR: self.context.forecast_service
        }.get(forecast_type)
        forecast_data_collection = {
            DETERMINISTIC_STR: self.context.deterministic_forecast_datas_collection,
            PROBABILISTIC_STR: self.context.forecast_datas_collection
        }.get(forecast_type)

        forecast_data_cursor = group_forecasts_by_well(
            forecast_data_collection.aggregate([{
                '$match': {
                    'forecast': forecast_id,
                    'well': {
                        '$in': wells
                    },
                    'phase': {
                        '$in': PHASES
                    }
                }
            }, {
                '$project': {
                    'well': 1,
                    'phase': 1,
                    'forecastType': 1,
                    'P_dict': 1,
                    'ratio': 1,
                    'data_freq': 1
                }
            }]))

        daily_wells, monthly_wells = get_daily_monthly_wells(forecast_data_cursor, phases)
        cums_and_last_prods = self.production_service.get_cums_and_last_prods(daily_wells, monthly_wells, phases)

        def update_generator(well_data):
            updates = []
            data_by_phases = {phase_data.pop('phase'): phase_data for phase_data in well_data}
            rate_phases = []
            ratio_phases = []
            for phase in phases:
                if data_by_phases[phase]['forecastType'] == 'rate':
                    rate_phases.append(phase)
                else:
                    ratio_phases.append(phase)
            for phase in rate_phases + ratio_phases:
                phase_data = data_by_phases[phase]
                adjust, update_P_dict, update_ratio = self._get_adjusted_phase_data(forecast_type, phase_data,
                                                                                    form_values)
                if adjust:
                    rate_or_ratio = phase_data['forecastType']
                    data_freq = phase_data['data_freq']
                    well_id = str(phase_data['well'])
                    cum = cums_and_last_prods[data_freq][well_id][phase]
                    last_prod_idx = cums_and_last_prods[data_freq][well_id]['last_prod']
                    if rate_or_ratio == 'ratio':
                        base_phase = phase_data['ratio']['basePhase']
                        base_segs = data_by_phases.get(base_phase, {}).get('P_dict', {}).get('best',
                                                                                             {}).get('segments', [])
                    else:
                        base_segs = None
                    updates += [
                        forecast_service.get_update_body(well_id=phase_data['well'],
                                                         forecast_id=forecast_id,
                                                         phase=phase,
                                                         user=user,
                                                         P_dict=update_P_dict,
                                                         ratio=update_ratio,
                                                         forecasted=True,
                                                         forecastType=rate_or_ratio,
                                                         data_freq=data_freq,
                                                         calc_eur=True,
                                                         cum=cum,
                                                         last_prod_idx=last_prod_idx,
                                                         base_segs=base_segs)
                    ]
            return updates

        batch_updates_with_progress(context=self.context,
                                    batch_count=params.get('batch_count'),
                                    data_iterator=forecast_data_cursor,
                                    update_generator=update_generator,
                                    db_updater=lambda x: forecast_service.write_forecast_data_to_db(x),
                                    notification_id=params.get('notification_id'),
                                    user_id=params.get('user_id'))

    def _get_adjusted_phase_data(self, forecast_type, phase_data, form_values):
        P_dict = phase_data.get('P_dict', {})
        ratio = phase_data.get('ratio', {})
        update_P_dict = {}
        update_ratio = None
        if forecast_type == PROBABILISTIC_STR:
            adjust = False
            temp_P_dict = {}
            for series in PROB_SERIES:
                if series in P_dict:
                    adjust_series, adjusted_segments = self._adjust_segments(
                        P_dict.get(series, {}).get('segments', []), form_values)
                    adjust = adjust or adjust_series
                    temp_P_dict[series] = {'segments': adjusted_segments, 'diagnostics': {}}
            if adjust:
                update_P_dict = temp_P_dict
        else:
            phase_forecast_type = phase_data['forecastType']
            if phase_forecast_type == 'ratio':
                adjust, adjusted_segments = self._adjust_segments(ratio.get('segments', []), form_values)
                if adjust:
                    ratio['segments'] = adjusted_segments
                    update_ratio = copy(ratio)
                    update_ratio['diagnostics'] = {}
            else:
                adjust, adjusted_segments = self._adjust_segments(
                    P_dict.get(BEST_STR, {}).get('segments', []), form_values)
                if adjust:
                    update_P_dict = {BEST_STR: {'segments': adjusted_segments, 'diagnostics': {}}}
                    P_dict[BEST_STR]['segments'] = adjusted_segments
        return adjust, update_P_dict, update_ratio

    def _adjust_segments(self, segments, form_values):
        adjust = False
        adjusted_segments = []
        for segment in segments:
            if segment['name'] == 'arps_modified':
                adjust = True
                adjusted_segments += [self._adjust_terminal_decline(segment, form_values['target_D_eff_sw'])]
            else:
                adjusted_segments += [segment]
        return adjust, adjusted_segments

    def _adjust_terminal_decline(self, segment, target_D_eff_sw):
        ret = deepcopy(segment)
        q_start, start_idx, b, D, end_idx = (segment['q_start'], segment['start_idx'], segment['b'], segment['D'],
                                             segment['end_idx'])

        switch_params = arps_modified_switch(start_idx, b, D, target_D_eff_sw)
        sw_idx = switch_params['sw_idx']
        q_sw = pred_arps(sw_idx, start_idx, q_start, D, b)
        if end_idx <= sw_idx:
            q_end = pred_arps(end_idx, start_idx, q_start, D, b)
        else:
            q_end = pred_exp(end_idx, sw_idx, q_sw, switch_params['D_exp'])

        ret.update({**switch_params, 'q_sw': q_sw, 'q_end': q_end, 'target_D_eff_sw': target_D_eff_sw})
        return ret
