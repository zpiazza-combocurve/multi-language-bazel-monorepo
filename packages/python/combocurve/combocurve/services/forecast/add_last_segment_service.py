from bson import ObjectId
from combocurve.science.add_segment.add_seg import add_seg
from combocurve.shared.batch_runner_with_notification import batch_updates_with_progress
from combocurve.shared.constants import PHASES

add_seg_obj = add_seg()


class AddLastSegmentService(object):
    def __init__(self, context):
        self.context = context

    def add_segment(self, params):  # noqa: C901
        # params = {
        #     'forecast_id': '5ebc8b90fd48b1001274eef7',
        #     'phase': 'oil',
        #     'setting': {
        #         'end': {
        #             'absolute_idx_end': 0,
        #             'end_method': 'absolute'
        #         },
        #         'model_params': {
        #             'P10': {},
        #             'P50': {},
        #             'P90': {},
        #             'best': {}
        #         },
        #         'name': 'arps_modified',
        #         'start': {
        #             'absolute_idx_start': 43982,
        #             'start_method': 'absolute'
        #         }
        #     },
        #     'wells': ['5ebc8b71fd48b1001274eef3'],
        # }

        phases = [params['phase']]
        wells = params['wells']
        forecast_id = params['forecast_id']
        setting = params['setting']
        model_params = setting.pop('model_params')  ## remove model_params from setting
        if setting['data_freq'] == 'not_change':
            data_freq = None
        else:
            data_freq = setting['data_freq']

        forecast_document = self.context.db['forecasts'].find_one({'_id': ObjectId(forecast_id)})
        is_deterministic = forecast_document['type'] == 'deterministic'
        if is_deterministic:
            valid_series = ['best']
        else:
            valid_series = ['best', 'P10', 'P50', 'P90']
        #Only have best seg for deterministic forecast
        series_params = {}
        for k, v in model_params.items():
            if k in valid_series:
                this_dict = {'model_params': v}
                this_dict.update(setting)
                series_params[k] = this_dict

        ### get_data, preparation
        PDs_and_forecast = self.get_well_PD_and_forecasts(wells, forecast_id, is_deterministic)
        cums_and_last_prods = self.context.production_service.get_cums_and_last_prods(wells, wells, phases)

        ########## run the loop
        def update_generator(well_info):
            updates = []

            well_id = well_info['well']
            well_PD = well_info['well_PD']
            well_forecasts = well_info['forecasts']

            rate_phases = []
            ratio_phases = []
            for phase in phases:
                if 'ratio' in well_forecasts.get(phase, {}).keys():
                    ratio_phases.append(phase)
                else:
                    rate_phases.append(phase)

            for phase in rate_phases + ratio_phases:
                phase_forecast = well_forecasts[phase]
                is_ratio = 'ratio' in phase_forecast
                update_forecast = False
                phase_P_dict = {}
                phase_ratio_dict = None
                warning_status = False
                warning_message = ''
                for sery, sery_params in series_params.items():
                    if is_ratio:
                        orig_sery_P_dict = phase_forecast['ratio']
                    else:
                        orig_sery_P_dict = phase_forecast.get(sery)

                    if orig_sery_P_dict is None:
                        orig_sery_forecasts = []
                    else:
                        if is_ratio:
                            orig_sery_forecasts = phase_forecast['ratio']['segments']
                        else:
                            orig_sery_forecasts = phase_forecast[sery]['segments']
                    sery_ret, sery_warning = add_seg_obj.body(sery_params, well_PD, orig_sery_forecasts)
                    if sery_warning != '':
                        warning_status = True
                        if is_ratio:
                            warning_message += '{}: '.format('ratio') + sery_warning + '\n'
                        else:
                            warning_message += '{}: '.format(sery) + sery_warning + '\n'

                    if sery_ret is not None:
                        update_forecast = True
                        if is_ratio:
                            phase_P_dict = {}
                            phase_ratio_dict = {
                                'segments': sery_ret,
                                'basePhase': phase_forecast['ratio']['basePhase'],
                                'x': phase_forecast['ratio']['x'],
                                'diagnostics': {}
                            }
                            well_forecasts[phase].update({'ratio': {'segments': sery_ret}})
                        else:
                            phase_P_dict[sery] = {'segments': sery_ret, 'diagnostics': {}}
                            phase_ratio_dict = None
                            well_forecasts[phase].update({sery: {'segments': sery_ret}})

                phase_warning = {'status': warning_status, 'message': warning_message}

                ### get update information
                # model_name = None
                # forecasted = True
                # forecastType= None
                # data_freq = 'monthly',
                p_extra = {}
                forecasted, forecastType, forecastSubType = self.getForecastStatus(update_forecast, is_deterministic,
                                                                                   is_ratio)
                phase_freq = phase_forecast['data_freq']
                cum = cums_and_last_prods[phase_freq][str(well_id)][phase]
                last_prod_idx = cums_and_last_prods[phase_freq][str(well_id)]['last_prod']
                base_segs = None
                if 'ratio' in phase_forecast:
                    base_phase = phase_forecast['ratio'].get('basePhase')
                    base_segs = well_forecasts.get(base_phase, {}).get('best', {}).get('segments', [])

                if is_deterministic:
                    phase_update = self.context.deterministic_forecast_service.get_update_body(
                        forecast_id=ObjectId(forecast_id),
                        well_id=well_id,
                        phase=phase,
                        P_dict=phase_P_dict,
                        forecasted=forecasted,
                        forecastType=forecastType,
                        forecastSubType=forecastSubType,
                        warning=phase_warning,
                        p_extra=p_extra,
                        data_freq=data_freq,
                        ratio=phase_ratio_dict,
                        calc_eur=True,
                        cum=cum,
                        last_prod_idx=last_prod_idx,
                        base_segs=base_segs)
                else:
                    phase_update = self.context.forecast_service.get_update_body(forecast_id=ObjectId(forecast_id),
                                                                                 well_id=well_id,
                                                                                 phase=phase,
                                                                                 P_dict=phase_P_dict,
                                                                                 forecasted=forecasted,
                                                                                 forecastType=forecastType,
                                                                                 warning=phase_warning,
                                                                                 p_extra=p_extra,
                                                                                 data_freq=data_freq,
                                                                                 calc_eur=True,
                                                                                 cum=cum,
                                                                                 last_prod_idx=last_prod_idx)

                # if update_P_dict:
                #     this_set = {'P_dict': phase_P_dict, 'warning': phase_warning}
                # else:
                #     this_set = {'warning': phase_warning}

                updates += [phase_update]
                return updates

        batch_updates_with_progress(context=self.context,
                                    batch_count=params.get('batch_count'),
                                    data_iterator=PDs_and_forecast,
                                    update_generator=update_generator,
                                    db_updater=lambda x: self.write_added_segments_to_db(x, is_deterministic),
                                    notification_id=params.get('notification_id'),
                                    user_id=params.get('user_id'))

    def write_added_segments_to_db(self, updates, is_deterministic):
        if is_deterministic:
            self.context.deterministic_forecast_service.write_forecast_data_to_db(updates)
        else:
            self.context.forecast_service.write_forecast_data_to_db(updates)

    def getForecastStatus(self, update_forecast, is_deterministic, is_ratio):
        if update_forecast:
            forecasted = True
            if is_deterministic:
                if is_ratio:
                    forecastType = 'ratio'
                else:
                    forecastType = 'rate'
                forecastSubType = 'add_segment'
            else:
                forecastType = 'add_segment'
                forecastSubType = None
        else:
            forecasted = None
            forecastType = None
            forecastSubType = None

        return forecasted, forecastType, forecastSubType

    def get_well_PD_and_forecasts(self, wells, forecast, is_deterministic):
        PD_items = [
            'first_prod_date', 'first_prod_date_daily_calc', 'first_prod_date_monthly_calc', 'last_prod_date_daily',
            'last_prod_date_monthly'
        ]
        headers_and_forecast = self.context.production_service.get_forecast_with_headers(
            wells, PD_items, forecast, PHASES, is_deterministic)
        for well_info in headers_and_forecast:
            well_header = well_info['headers']
            well_info['well_PD'] = {k: well_header.get(k) for k in PD_items}

        return headers_and_forecast
