import copy
import datetime
import numpy as np
from dateutil.relativedelta import relativedelta
from calendar import monthrange
from combocurve.science.econ.general_functions import get_py_date, index_to_py_date, py_date_to_index
from combocurve.science.econ.econ_model_rows_process import rows_process
from combocurve.science.econ.helpers import date_to_t, date_to_t_daily, days_in_month

ECL_CAPEX_CATEGORY = ['abandonment', 'salvage']


class PreprocessError(Exception):
    expected = True


def schedule_idx_to_dates(schedule):
    schedule_date = copy.deepcopy(schedule)
    for key in schedule_date.keys():
        if schedule_date.get(key) is not None and not key.endswith(('id', 'Id', 'Name')):
            schedule_date[key] = index_to_py_date(schedule_date.get(key))

    return {
        'offset_to_pad_preparation_mob_start': schedule_date.get('preparationMobStart'),
        'offset_to_pad_preparation_mob_end': schedule_date.get('preparationMobEnd'),
        'offset_to_pad_preparation_start': schedule_date.get('preparationWorkStart'),
        'offset_to_pad_preparation_end': schedule_date.get('preparationWorkEnd'),
        'offset_to_pad_preparation_demob_start': schedule_date.get('preparationDemobStart'),
        'offset_to_pad_preparation_demob_end': schedule_date.get('preparationDemobEnd'),
        'offset_to_spud_mob_start': schedule_date.get('spudMobStart'),
        'offset_to_spud_mob_end': schedule_date.get('spudMobEnd'),
        'offset_to_spud_start': schedule_date.get('spudWorkStart'),
        'offset_to_spud_end': schedule_date.get('spudWorkEnd'),
        'offset_to_spud_demob_start': schedule_date.get('spudDemobStart'),
        'offset_to_spud_demob_end': schedule_date.get('spudDemobEnd'),
        'offset_to_drill_mob_start': schedule_date.get('drillMobStart'),
        'offset_to_drill_mob_end': schedule_date.get('drillMobEnd'),
        'offset_to_drill_start': schedule_date.get('drillWorkStart'),
        'offset_to_drill_end': schedule_date.get('drillWorkEnd'),
        'offset_to_drill_demob_start': schedule_date.get('drillDemobStart'),
        'offset_to_drill_demob_end': schedule_date.get('drillDemobEnd'),
        'offset_to_completion_mob_start': schedule_date.get('completeMobStart'),
        'offset_to_completion_mob_end': schedule_date.get('completeMobEnd'),
        'offset_to_completion_start': schedule_date.get('completeWorkStart'),
        'offset_to_completion_end': schedule_date.get('completeWorkEnd'),
        'offset_to_completion_demob_start': schedule_date.get('completeDemobStart'),
        'offset_to_completion_demob_end': schedule_date.get('completeDemobEnd'),
    }


def header_idx_to_dates(well_header_info):
    header_dates = {}
    required_dates = [
        'refrac_date',
        'completion_end_date',
        'completion_start_date',
        'date_rig_release',
        'drill_end_date',
        'drill_start_date',
        'first_prod_date',
        'permit_date',
        'spud_date',
        'til',
        'custom_date_0',
        'custom_date_1',
        'custom_date_2',
        'custom_date_3',
        'custom_date_4',
        'custom_date_5',
        'custom_date_6',
        'custom_date_7',
        'custom_date_8',
        'custom_date_9',
        'first_prod_date_daily_calc',
        'first_prod_date_monthly_calc',
        'last_prod_date_monthly',
        'last_prod_date_daily',
    ]
    for item in required_dates:
        if well_header_info.get(item) is not None:
            header_dates[f'offset_to_{item}'] = well_header_info.get(item).date()
        else:
            header_dates[f'offset_to_{item}'] = None
    return header_dates


class PreProcess:
    @staticmethod
    def drilling_cost_pre(drilling_cost_input, vertical_depth, lateral_length, schedule):
        if len(drilling_cost_input) == 0:
            return []
        drilling_cost_list = []
        #
        drilling_vertical_m = vertical_depth * drilling_cost_input['dollar_per_ft_of_vertical'] / 1000
        drilling_horizontal_m = lateral_length * drilling_cost_input['dollar_per_ft_of_horizontal'] / 1000
        total_drilling_cost = drilling_cost_input['fixed_cost'] + drilling_vertical_m + drilling_horizontal_m
        #
        total_tangible = total_drilling_cost * drilling_cost_input['tangible_pct'] / 100
        total_intangible = total_drilling_cost * (1 - drilling_cost_input['tangible_pct'] / 100)
        #
        rows = drilling_cost_input['rows']
        # schedule_key
        schedule_key = None
        for key in ['schedule_start', 'schedule_end']:
            if key in rows[0].keys():
                schedule_key = key
                schedule_idx = PreProcess.get_schedule_idx(schedule, schedule_key, 'drill')
        #
        for i in range(len(rows)):
            this_row = rows[i]
            this_drilling_cost = copy.deepcopy(this_row)
            this_drilling_cost.pop('pct_of_total_cost')
            if schedule_key:
                offset_date = np.datetime64('1900-01-01') + schedule_idx
                this_drilling_cost['offset_date'] = offset_date.item()  # convert np date to py date
                this_drilling_cost['date'] = (offset_date + this_drilling_cost[schedule_key]).item()

            this_drilling_cost['name'] = 'Drilling Cost ' + str(i)
            this_drilling_cost['category'] = 'drilling'
            this_drilling_cost['tangible'] = total_tangible * (this_row['pct_of_total_cost'] / 100)
            this_drilling_cost['intangible'] = total_intangible * (this_row['pct_of_total_cost'] / 100)
            this_drilling_cost['capex_expense'] = 'capex'
            this_drilling_cost['calculation'] = drilling_cost_input['calculation']
            this_drilling_cost['escalation_model'] = drilling_cost_input['escalation_model']
            this_drilling_cost['depreciation_model'] = drilling_cost_input['depreciation_model']
            this_drilling_cost['deal_terms'] = drilling_cost_input['deal_terms']
            this_drilling_cost['capex_model_record'] = {'model_key': 'drilling_cost_model', 'order': i}
            drilling_cost_list.append(this_drilling_cost)
        return drilling_cost_list

    @staticmethod
    # transform completion cost model to the format of other_capex.
    def completion_cost_pre(completion_cost_input, vertical_depth, lateral_length, total_prop_weight, schedule):
        if len(completion_cost_input) == 0:
            return []
        completion_cost_list = []
        #
        well_prop_ll = total_prop_weight / lateral_length if lateral_length else 0
        # if only one row, assume another point as (0, 0); if more than one row, do a linear fit.
        horizontal_price_rows = completion_cost_input['dollar_per_ft_of_horizontal']['rows']

        if len(horizontal_price_rows) == 1:
            well_unit_cost = horizontal_price_rows[0]['unit_cost'] * (well_prop_ll
                                                                      / horizontal_price_rows[0]['prop_ll'])
            completion_horizontal_m = well_unit_cost * lateral_length / 1000
        else:
            x = []
            y = []
            for i in horizontal_price_rows:
                x.append(i['prop_ll'])
                y.append(i['unit_cost'])

            if len(set(y)) == 1:  # horizontal line, always use the unique y as unit_cost
                a = 0
                b = y[0]
            elif len(set(x)) == 1:  # vertical line, always use the average y as unit_cost
                a = 0
                b = sum(y) / len(y)
            else:
                a, b = np.polyfit(x, y, 1)

            completion_horizontal_m = (a * well_prop_ll + b) * lateral_length / 1000
            if completion_horizontal_m < 0:
                completion_horizontal_m = 0
        #
        completion_vertical_m = vertical_depth * completion_cost_input['dollar_per_ft_of_vertical'] / 1000
        total_completion_cost = completion_cost_input['fixed_cost'] + completion_vertical_m + completion_horizontal_m
        #
        total_tangible = total_completion_cost * completion_cost_input['tangible_pct'] / 100
        total_intangible = total_completion_cost * (1 - completion_cost_input['tangible_pct'] / 100)
        #
        rows = completion_cost_input['rows']
        # schedule_key
        schedule_key = None
        for key in ['schedule_start', 'schedule_end']:
            if key in rows[0].keys():
                schedule_key = key
                schedule_idx = PreProcess.get_schedule_idx(schedule, schedule_key, 'complete')
        #
        for i in range(len(rows)):
            this_row = rows[i]
            this_completion_cost = copy.deepcopy(this_row)
            this_completion_cost.pop('pct_of_total_cost')
            if schedule_key:
                offset_date = np.datetime64('1900-01-01') + schedule_idx
                this_completion_cost['offset_date'] = offset_date.item()  # convert np date to py date
                this_completion_cost['date'] = (offset_date + this_completion_cost[schedule_key]).item()

            this_completion_cost['name'] = 'Completion Cost ' + str(i)
            this_completion_cost['category'] = 'completion'
            this_completion_cost['tangible'] = total_tangible * (this_row['pct_of_total_cost'] / 100)
            this_completion_cost['intangible'] = total_intangible * (this_row['pct_of_total_cost'] / 100)
            this_completion_cost['capex_expense'] = 'capex'
            this_completion_cost['calculation'] = completion_cost_input['calculation']
            this_completion_cost['escalation_model'] = completion_cost_input['escalation_model']
            this_completion_cost['depreciation_model'] = completion_cost_input['depreciation_model']
            this_completion_cost['deal_terms'] = completion_cost_input['deal_terms']
            this_completion_cost['capex_model_record'] = {'model_key': 'completion_cost_model', 'order': i}
            completion_cost_list.append(this_completion_cost)
        return completion_cost_list

    @staticmethod
    # discount
    def discount_pre(discount_input):
        return {
            'disc_method': discount_input['discount_method'],
            'cash_accrual_time': discount_input['cash_accrual_time'],
            'disc_rate': [discount_input['first_discount'] / 100, discount_input['second_discount'] / 100],
            'one_line_rows': [i['discount_table'] / 100 for i in discount_input['rows']]
        }

    @staticmethod
    def phase_risk_pre(phase_risk_input, date_dict, start_date, end_date):
        '''
            Processes input rows of risking model for one phase as a list of monthly risking. If the user used seasonal
            risking as input method, the monthly risking will be produced from the monthly risking table and the given
            date range. There is annother version of this function for handling daily production data.
        '''
        fpd = date_dict['first_production_date']
        phase_risk_rows = phase_risk_input['rows']
        if 'seasonal' in phase_risk_rows[0]:
            # construct map of seasonal risking
            months = list(map(lambda row: row['seasonal'], phase_risk_rows))
            monthly_risks = list(map(lambda row: row['multiplier'], phase_risk_rows))
            risk_by_month = dict(zip(months, monthly_risks))
            # create list of month indices
            start_date_m = (np.datetime64('1900-01-01') + py_date_to_index(start_date)).astype('datetime64[M]')
            end_date_m = (np.datetime64('1900-01-01') + py_date_to_index(end_date)).astype('datetime64[M]')
            monthly_index = np.arange(start_date_m, end_date_m + 1)
            # produce risking by month
            monthly_para = list(map(lambda x: risk_by_month[x.astype(datetime.date).strftime('%b')], monthly_index))
        else:
            monthly_para = rows_process(phase_risk_rows,
                                        date_dict,
                                        fpd,
                                        start_date,
                                        end_date,
                                        'multiplier',
                                        extend_value=100)

        monthly_para = np.divide(monthly_para, 100)

        return monthly_para

    @staticmethod
    def phase_risk_daily_pre(phase_risk_input, date_dict, start_date, end_date):
        fpd = date_dict['first_production_date']
        phase_risk_rows = phase_risk_input['rows']
        if 'seasonal' in phase_risk_rows[0]:
            months = list(map(lambda row: row['seasonal'], phase_risk_rows))
            monthly_risks = list(map(lambda row: row['multiplier'], phase_risk_rows))
            risk_by_month = dict(zip(months, monthly_risks))
            all_index = np.arange(py_date_to_index(start_date), py_date_to_index(end_date) + 1)
            daily_para = list(map(lambda x: risk_by_month[index_to_py_date(x).strftime('%b')], all_index))
        else:
            monthly_para = rows_process(phase_risk_rows,
                                        date_dict,
                                        fpd,
                                        start_date,
                                        end_date,
                                        'multiplier',
                                        extend_value=100)
            daily_para = PreProcess.monthly_list_to_daily(monthly_para, start_date, end_date)

        daily_para = np.divide(daily_para, 100)

        return daily_para

    @staticmethod
    # actual_or_forecast
    def actual_or_forecast_pre(actual_or_forecast, as_of_date):
        ret = {}
        replace_actual = actual_or_forecast['replace_actual']
        for key in replace_actual:
            if 'never' in replace_actual[key].keys():
                ret[key] = 'never'
            elif 'as_of_date' in replace_actual[key].keys():
                ret[key] = as_of_date
            else:
                ret[key] = get_py_date(replace_actual[key]['date'])

        return ret

    @staticmethod
    # pre process of input data
    def append_zeros(monthly_volume_dict, t_cut_off, t_cf_end):
        if t_cut_off < t_cf_end:
            for key in monthly_volume_dict:
                if key == 'time':
                    monthly_volume_dict['time'] = np.append(monthly_volume_dict['time'],
                                                            np.arange(t_cut_off + 1, t_cf_end + 1))
                elif key == 'date':
                    monthly_volume_dict['date'] = np.append(monthly_volume_dict['date'],
                                                            (np.datetime64(monthly_volume_dict['date'][-1], 'M')
                                                             + np.arange(1, t_cf_end - t_cut_off + 1)).tolist())
                else:
                    monthly_volume_dict[key] = np.append(monthly_volume_dict[key], np.zeros(t_cf_end - t_cut_off))

        return monthly_volume_dict

    @staticmethod
    def adjust_volume_date_range(volume_dict, dates):
        '''
            Make adjustments to the date range of volume data. This method currently assume the input to be well-head
            volumes including pre-risk volumes. volume_dict in input should look like below:

            volume_dict = {
                'monthly': {
                    'date': np.array,
                    'time': np.array,
                    'well_head': np.array,
                    'pre_risk': np.array,
                },
                'daily': {
                    'volume': np.array
                }
            }
        '''
        fpd = dates['first_production_date']
        cut_off_date = dates['cut_off_date']
        cf_start_date = dates['cf_start_date']
        cf_end_date = dates['cf_end_date']
        vol_start_date = dates['volume_start_date']

        t_cf_start = date_to_t(cf_start_date, fpd)
        t_cut_off = date_to_t(cut_off_date, fpd)
        t_cf_end = date_to_t(cf_end_date, fpd)
        t_vol_start = date_to_t(vol_start_date, fpd)

        time_list = volume_dict['monthly']['time']

        if t_cut_off < t_cf_start:
            raise Exception('data_pre_monthly error: end date earlier than start date')

        if t_cut_off < time_list[0] or t_cf_start > time_list[-1]:
            # cut off before volume data or cf start after volume data
            times = np.arange(t_cf_start, t_cf_end + 1)
            len_time = len(times)
            dates = np.array([cf_start_date.replace(day=1) + relativedelta(months=int(x)) for x in range(len_time)])

            volume_dict['monthly'] = {
                'time': times,
                'date': dates,
                'well_head': np.zeros(len_time),
                'pre_risk': np.zeros(len_time),
            }

            return

        # last month
        if t_cut_off > time_list[-1]:
            # if cf_end_date after last data date, we extend the dataframe and set production after cf_end_date as 0
            add_date = [
                volume_dict['monthly']['date'][-1].replace(day=1) + relativedelta(months=int(x))
                for x in range(1, t_cut_off - time_list[-1] + 1)
            ]
            add_time = np.arange(time_list[-1] + 1, t_cut_off + 1)
            for key in volume_dict['monthly'].keys():
                if key not in ['time', 'date']:
                    volume_dict['monthly'][key] = np.append(volume_dict['monthly'][key], np.zeros(len(add_time)))
                elif key == 'date':
                    volume_dict['monthly'][key] = np.append(volume_dict['monthly'][key], add_date)
                elif key == 'time':
                    volume_dict['monthly'][key] = np.append(volume_dict['monthly'][key], add_time)
        else:
            if t_cut_off == time_list[-1]:
                # if t_cut_off == the last t from df, then we don't cut the production
                percent_prod_day_end = 1
            else:
                num_days_end = monthrange(cut_off_date.year, cut_off_date.month)[1]
                percent_prod_day_end = cut_off_date.day / num_days_end

            for key in volume_dict['monthly'].keys():
                volume_dict['monthly'][key] = volume_dict['monthly'][key][:t_cut_off + 1]
                if key in ['date', 'time']:
                    continue
                volume_dict['monthly'][key][-1] = volume_dict['monthly'][key][-1] * percent_prod_day_end

        #### first month
        # use volume start date instead of fpd because volume may not start from fpd (rollup can overwrite it)
        if cf_start_date < vol_start_date:
            # cf_start_date before vol_start_date, we extend the data and set production before vol_start_date as 0
            add_date = [
                vol_start_date.replace(day=1) + relativedelta(months=int(x))
                for x in np.arange(t_cf_start, t_vol_start)
            ]
            add_time = np.arange(t_cf_start, t_vol_start)
            for key in volume_dict['monthly'].keys():
                if key not in ['time', 'date']:
                    volume_dict['monthly'][key] = np.append(np.zeros(len(add_time)), volume_dict['monthly'][key])
                elif key == 'date':
                    volume_dict['monthly'][key] = np.append(add_date, volume_dict['monthly'][key])
                elif key == 'time':
                    volume_dict['monthly'][key] = np.append(add_time, volume_dict['monthly'][key])
        else:
            num_days_begin = monthrange(cf_start_date.year, cf_start_date.month)[1]
            if t_cf_start == 0:
                percent_prod_day_begin = (num_days_begin - cf_start_date.day + 1) / (num_days_begin - fpd.day + 1)
            else:
                percent_prod_day_begin = (num_days_begin - cf_start_date.day + 1) / num_days_begin

            for key in volume_dict['monthly'].keys():
                volume_dict['monthly'][key] = volume_dict['monthly'][key][t_cf_start:]
                if key in ['date', 'time']:
                    continue
                volume_dict['monthly'][key][0] = volume_dict['monthly'][key][0] * percent_prod_day_begin

        # transform each list to be np.array
        for key in volume_dict['monthly'].keys():
            volume_dict['monthly'][key] = np.array(volume_dict['monthly'][key])

        # append zeros from cut_off to report end
        PreProcess.append_zeros(volume_dict['monthly'], t_cut_off, t_cf_end)

    @staticmethod
    def adjust_volume_date_range_daily(volume_dict, dates):
        '''
            Make adjustments to the date range of volume data. This method currently assume the input to be well-head
            volumes including pre-risk volumes. volume_dict in input should look like below:

            volume_dict = {
                'daily': {
                    'date': np.array,
                    'time': np.array,
                    'volume': np.array,
                    'pre_risk_volume': np.array,
                }
            }
        '''
        fpd = dates['first_production_date']
        cut_off_date = dates['cut_off_date']
        cf_start_date = dates['cf_start_date']
        cf_end_date = dates['cf_end_date']
        vol_start_date = dates['volume_start_date']

        t_cf_start = date_to_t_daily(cf_start_date, fpd)
        t_cut_off = date_to_t_daily(cut_off_date, fpd)
        t_cf_end = date_to_t_daily(cf_end_date, fpd)
        t_vol_start = date_to_t_daily(vol_start_date, fpd)

        time_list = volume_dict['daily']['time']

        if t_cut_off < t_cf_start:
            raise Exception('data_pre_daily error: end date earlier than start date')

        if t_cut_off < time_list[0] or t_cf_start > time_list[-1]:
            # cut off before volume data or cf start after volume data
            times = np.arange(t_cf_start, t_cf_end + 1)
            len_time = len(times)
            dates = np.array([cf_start_date + relativedelta(days=int(x)) for x in range(len_time)])

            volume_dict['daily'] = {
                'time': times,
                'date': dates,
                'well_head': np.zeros(len_time),
                'pre_risk': np.zeros(len_time),
            }

            return

        # last month
        if t_cut_off > time_list[-1]:
            # if cf_end_date after last data date, we extend the dataframe and set production after cf_end_date as 0
            add_date = [
                volume_dict['daily']['date'][-1] + relativedelta(days=int(x))
                for x in range(1, t_cut_off - time_list[-1] + 1)
            ]
            add_time = np.arange(time_list[-1] + 1, t_cut_off + 1)
            for key in volume_dict['daily'].keys():
                if key not in ['time', 'date']:
                    volume_dict['daily'][key] = np.append(volume_dict['daily'][key], np.zeros(len(add_time)))
                elif key == 'date':
                    volume_dict['daily'][key] = np.append(volume_dict['daily'][key], add_date)
                elif key == 'time':
                    volume_dict['daily'][key] = np.append(volume_dict['daily'][key], add_time)
        else:
            if t_cut_off == time_list[-1]:
                # if t_cut_off == the last t from df, then we don't cut the production
                percent_prod_day_end = 1
            else:
                num_days_end = monthrange(cut_off_date.year, cut_off_date.month)[1]
                percent_prod_day_end = cut_off_date.day / num_days_end

            for key in volume_dict['daily'].keys():
                volume_dict['daily'][key] = volume_dict['daily'][key][:t_cut_off + 1]
                if key in ['date', 'time']:
                    continue
                volume_dict['daily'][key][-1] = volume_dict['daily'][key][-1] * percent_prod_day_end

        #### first month
        # use volume start date instead of fpd because volume may not start from fpd (rollup can overwrite it)
        if cf_start_date < vol_start_date:
            # cf_start_date before vol_start_date, we extend the data and set production before vol_start_date as 0
            add_date = [vol_start_date + relativedelta(days=int(x)) for x in np.arange(t_cf_start, t_vol_start)]

            add_time = np.arange(t_cf_start, t_vol_start)
            for key in volume_dict['daily'].keys():
                if key not in ['time', 'date']:
                    volume_dict['daily'][key] = np.append(np.zeros(len(add_time)), volume_dict['daily'][key])
                elif key == 'date':
                    volume_dict['daily'][key] = np.append(add_date, volume_dict['daily'][key])
                elif key == 'time':
                    volume_dict['daily'][key] = np.append(add_time, volume_dict['daily'][key])
        else:
            num_days_begin = monthrange(cf_start_date.year, cf_start_date.month)[1]
            if t_cf_start == 0:
                percent_prod_day_begin = (num_days_begin - cf_start_date.day + 1) / (num_days_begin - fpd.day + 1)
            else:
                percent_prod_day_begin = (num_days_begin - cf_start_date.day + 1) / num_days_begin

            for key in volume_dict['daily'].keys():
                volume_dict['daily'][key] = volume_dict['daily'][key][t_cf_start:]
                if key in ['date', 'time']:
                    continue
                volume_dict['daily'][key][0] = volume_dict['daily'][key][0] * percent_prod_day_begin

        # transform each list to be np.array
        for key in volume_dict['daily'].keys():
            volume_dict['daily'][key] = np.array(volume_dict['daily'][key])

        # append zeros from cut_off to report end
        PreProcess.append_zeros(volume_dict['daily'], t_cut_off, t_cf_end)

    @staticmethod
    # ownership
    def adjust_array(input_array, t_input, t_all, extend_value=None):
        output_array = input_array
        t_long = t_input
        # extend start
        if t_long[0] > t_all[0]:
            start_extend_value = extend_value if extend_value is not None else output_array[0]
            output_array = np.append(np.repeat(start_extend_value, int(t_long[0] - t_all[0])), output_array)
            t_long = np.append(np.arange(t_all[0], t_long[0]), t_long)
        # extend end
        if t_long[-1] < t_all[-1]:
            end_extend_value = extend_value if extend_value is not None else output_array[-1]
            output_array = np.append(output_array, np.repeat(end_extend_value, int(t_all[-1] - t_long[-1])))
            t_long = np.append(t_long, np.arange(t_long[-1] + 1, t_all[-1] + 1))
        # cut output_array
        output_array = output_array[(t_long >= t_all[0]) & (t_long <= t_all[-1])]
        return output_array

    @staticmethod
    def monthly_list_to_daily(monthly_list, start_date, end_date):
        monthly_days = days_in_month(np.arange(start_date, end_date, dtype='datetime64[M]'))
        if len(monthly_days) == 0:
            monthly_days = np.append(monthly_days, max(end_date.day - start_date.day + 1, 1))
        else:
            monthly_days[0] -= start_date.day - 1
            monthly_days = np.append(monthly_days, end_date.day)

        return np.repeat(monthly_list, monthly_days)

    @staticmethod
    # capex pre process
    # transform drilling cost model to the format of other_capex.
    def get_schedule_idx(schedule, schedule_key, model_category):
        schedule_key_map = {'schedule_start': model_category + 'WorkStart', 'schedule_end': model_category + 'WorkEnd'}
        schedule_date_idx = schedule.get(schedule_key_map[schedule_key])
        if schedule_date_idx:
            return schedule_date_idx
        else:
            if model_category == 'drill':
                schedule_label = 'Drilling ' + schedule_key.split('_')[-1]
            else:
                schedule_label = 'Completion ' + schedule_key.split('_')[-1]
            error_message = f'{schedule_label} is used in CAPEX but missing in schedule'
            raise PreprocessError(error_message)
