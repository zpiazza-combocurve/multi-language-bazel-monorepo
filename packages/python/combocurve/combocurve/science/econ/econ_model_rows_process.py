import copy
import numpy as np
from calendar import monthrange
import datetime

from combocurve.science.econ.helpers import date_to_t
from combocurve.science.econ.escalation import process_escalation_model

WI_100_PCT = '100_pct_wi'


class EconRowError(Exception):
    expected = True


class SimpleDate:

    def __init__(self, year, month, day):
        self.year = int(year)
        self.month = int(month)
        self.day = int(day)

    def __eq__(self, other):
        return self.year == other.year and self.month == other.month and self.day == other.day

    def __gt__(self, other):
        if self.year != other.year:
            return self.year > other.year
        elif self.month != other.month:
            return self.month > other.month
        else:
            return self.day > other.day

    def __lt__(self, other):
        if self.year != other.year:
            return self.year < other.year
        elif self.month != other.month:
            return self.month < other.year
        else:
            return self.day < other.day


def get_monthly_para(list_of_dic, fpd, list_start_date, list_end_date, value_key, extend_value=0):
    '''
    input format : [
            {'start_date' : date_1, 'end_date' : date_2, value_key : x},
            {'start_date' : date_3, 'end_date' : date_4, value_key : y}
        ]
    '''

    def date_to_simple_date(date):
        if isinstance(date, str):
            if date[4] == '-':
                simple_date = SimpleDate(*date.split('-'))
            else:
                split_date = date.split('/')
                simple_date = SimpleDate(split_date[2], split_date[0], split_date[1])
        else:
            simple_date = SimpleDate(date.year, date.month, date.day)

        return simple_date

    value_before_cut = []
    time_before_cut = []

    # t_fpd is 0
    t_list_end = date_to_t(list_end_date, fpd)
    t_list_start = date_to_t(list_start_date, fpd)

    if 'entire_well_life' in list_of_dic[0].keys():
        flat_value = list_of_dic[0].get(value_key)

        try:  # the value can be invalid for some reason like import created bad model
            this_value = float(flat_value)
        except Exception:
            this_value = 0

        ret_list = np.repeat(this_value, t_list_end - t_list_start + 1)
    else:
        prev_end_t = t_list_start - 1
        list_start_date = SimpleDate(list_start_date.year, list_start_date.month, list_start_date.day)
        list_end_date = SimpleDate(list_end_date.year, list_end_date.month, list_end_date.day)

        for i in range(len(list_of_dic)):
            this_value = list_of_dic[i].get(value_key)

            try:
                this_value = float(this_value)
            except Exception:
                this_value = 0
            this_date_range = list_of_dic[i]['dates']

            start_date = this_date_range['start_date']
            end_date = this_date_range['end_date']

            this_start = date_to_simple_date(start_date)

            if end_date == 'Econ Limit' or i == len(list_of_dic) - 1:
                # if end_date is 'Econ Limit'
                if list_end_date > this_start:
                    this_end = list_end_date
                else:
                    this_end = this_start
            else:
                this_end = date_to_simple_date(end_date)

            if this_end is None:
                raise EconRowError('Could not get end date when processing econ rows')

            this_start_t = (this_start.year - fpd.year) * 12 + this_start.month - fpd.month

            if this_start_t == prev_end_t:
                # this may happend due to change in the middle of month
                this_start_t = this_start_t + 1

            this_end_t = (this_end.year - fpd.year) * 12 + this_end.month - fpd.month
            prev_end_t = this_end_t

            this_t_list = np.arange(this_start_t, this_end_t + 1)
            time_before_cut.extend(this_t_list)
            value_before_cut.extend([this_value] * len(this_t_list))

        # extend value list with 0 if it doen't cover start and end point
        if t_list_start < time_before_cut[0]:
            prev_add_time = np.arange(t_list_start, time_before_cut[0])
            prev_add_value = np.repeat(extend_value, len(prev_add_time))
            time_before_cut = np.append(prev_add_time, time_before_cut)
            value_before_cut = np.append(prev_add_value, value_before_cut)

        if t_list_end > time_before_cut[-1]:
            after_add_time = np.arange(time_before_cut[-1], t_list_end)
            after_add_value = np.repeat(extend_value, len(after_add_time))
            time_before_cut = np.append(time_before_cut, after_add_time)
            value_before_cut = np.append(value_before_cut, after_add_value)

        time_before_cut, value_before_cut = np.array(time_before_cut), np.array(value_before_cut)
        ret_list = value_before_cut[(time_before_cut >= t_list_start) & (time_before_cut <= t_list_end)]

    return ret_list


def offset_to_date(list_of_dic, date_dict):
    '''
    example:
    front end format: [[1,5], [6,9], ...]
    offset to '5-22-2010' result: [['5-1-2010', '9-30-2010'], ['10-1-2010', '1-31-2011'], ...]
    '''

    def add_months_to_offset_date(offset_date, months):
        if offset_date[1] + months % 12 < 13:
            return offset_date[0] + months // 12, offset_date[1] + months % 12
        else:
            return offset_date[0] + months // 12 + 1, offset_date[1] + months % 12 - 12

    key_and_date_map = {
        'offset_to_fpd': 'first_production_date',
        'offset_to_as_of_date': 'as_of_date',
        'offset_to_discount_date': 'discount_date',
        'offset_to_first_segment': 'first_segment_date',
        'offset_to_end_history': 'end_history_date'
    }

    offset_key = None
    for key in key_and_date_map.keys():
        if key in list_of_dic[0].keys():
            offset_key = key
            offset_date = date_dict[key_and_date_map[key]]
            offset_year_and_month = (offset_date.year, offset_date.month)
            break

    if offset_key is None:
        return list_of_dic

    start_days, end_days = [], []

    for i in range(len(list_of_dic)):
        this_offset = list_of_dic[i][offset_key]
        # start date (the first day of the start month of offset)
        start_days.append(add_months_to_offset_date(offset_year_and_month, this_offset['start'] - 1))

        # end date (the last day of the end month of offset)
        if i < len(list_of_dic) - 1:
            end_days.append(add_months_to_offset_date(offset_year_and_month, this_offset['end'] - 1))
        elif i == len(list_of_dic) - 1:
            end_days.append('Econ Limit')

    ret_list_of_dic = [{key: dic[key] for key in dic if key != offset_key} for dic in list_of_dic]

    for i, dic in enumerate(ret_list_of_dic):
        dic['dates'] = {
            'start_date':
            datetime.date(*start_days[i], 1),
            'end_date':
            datetime.date(*end_days[i],
                          monthrange(*end_days[i])[1]) if not isinstance(end_days[i], str) else end_days[i]
        }

    return ret_list_of_dic


def rows_process(rows, date_dict, fpd, cf_start_date, cut_off_date, value_key, extend_value=0):
    rows_by_date = offset_to_date(rows, date_dict)
    monthly_para = get_monthly_para(
        rows_by_date,
        fpd,
        cf_start_date,
        cut_off_date,
        value_key,
        extend_value,
    )

    return monthly_para


def rows_process_with_escalation(
    rows,
    date_dict,
    fpd,
    cf_start_date,
    cut_off_date,
    value_key,
    extend_value=0,
    escalation=None,
):
    rows_by_date = offset_to_date(rows, date_dict)
    monthly_para = get_monthly_para(
        rows_by_date,
        fpd,
        cf_start_date,
        cut_off_date,
        value_key,
        extend_value,
    )

    # escalation
    esca_param = None
    if escalation:
        esca_param = process_escalation_model(rows_by_date, escalation, cf_start_date, cut_off_date, fpd)

    return monthly_para, esca_param


def get_monotonic_rates(rates, t_list):
    ret_row = []

    for i, rate in enumerate(rates):
        this_t = t_list[i]

        if this_t < 0:
            ret_row.append(0)
        elif i == 0 or this_t == 0:
            ret_row.append(rate)
        else:
            prev_rate = ret_row[i - 1]
            if rate <= prev_rate:
                ret_row.append(rate)
            else:
                ret_row.append(prev_rate)

    return np.array(ret_row)


def get_monthly_param_based_on_rate(rows, rates, t_list, value_key, criteria_key, rows_cal_method, fpd):
    monthly_para = np.zeros(len(rates))

    if np.all(t_list < 0):
        return monthly_para

    after_fpd_idxs = t_list >= 0

    if rows_cal_method == 'monotonic':
        rates = get_monotonic_rates(rates, t_list)

    months = np.datetime64(fpd, 'M') + t_list
    days = ((months + 1).astype('datetime64[D]') - months.astype('datetime64[D]')).astype(int)
    daily_rates = rates / days

    for i, row in enumerate(rows):
        value = row[value_key]

        if value == '':
            value = 0

        criteria = row[criteria_key]

        start_rate = criteria['start']
        end_rate = criteria['end']
        if i == len(rows) - 1:
            end_rate = 'inf'

        if end_rate == 'inf':
            update_idx = (daily_rates >= start_rate) & after_fpd_idxs
        else:
            update_idx = (daily_rates >= start_rate) & (daily_rates < end_rate) & after_fpd_idxs

        monthly_para[update_idx] = value

    return monthly_para


def rate_rows_process(rows, value_key, criteria_key, rate_type, rows_cal_method, ownership_volumes, date_dict):
    phase = criteria_key.split('_')[0]

    if rate_type == 'gross_well_head':
        if phase == 'total':
            rates = ownership_volumes['well_head']['oil'][WI_100_PCT] + ownership_volumes['well_head']['water'][
                WI_100_PCT]
        else:
            rates = ownership_volumes['well_head'][phase][WI_100_PCT]
    elif rate_type == 'gross_sales':
        if phase == 'total':
            rates = ownership_volumes['sales']['oil'][WI_100_PCT] + ownership_volumes['sales']['water'][WI_100_PCT]
        else:
            rates = ownership_volumes['sales'][phase][WI_100_PCT]
    else:
        # net_sales
        if phase == 'total':
            rates = ownership_volumes['sales']['oil']['nri'] + ownership_volumes['sales']['water']['nri']
        else:
            rates = ownership_volumes['sales'][phase]['nri']

    t_list = ownership_volumes['well_head']['time']

    fpd = date_dict['first_production_date']
    fpd_month_num_days = monthrange(fpd.year, fpd.month)[1]
    fpd_active_prop = 1 - (fpd.day - 1) / fpd_month_num_days

    as_of_date = date_dict['as_of_date']
    t_aod = (as_of_date.year - fpd.year) * 12 + as_of_date.month - fpd.month
    aod_month_num_days = monthrange(as_of_date.year, as_of_date.month)[1]
    aod_active_prop = 1 - (as_of_date.day - 1) / aod_month_num_days

    if 0 in t_list and fpd_active_prop != 1:
        rates = copy.deepcopy(rates)
        rates[t_list == 0] = rates[t_list == 0] / fpd_active_prop
    elif t_aod == t_list[0] and aod_active_prop != 1:
        rates = copy.deepcopy(rates)
        rates[0] = rates[0] / aod_active_prop

    monthly_para = get_monthly_param_based_on_rate(rows, rates, t_list, value_key, criteria_key, rows_cal_method,
                                                   date_dict['first_production_date'])

    return monthly_para
