import numpy as np
from combocurve.science.econ.general_functions import CAPEX_CATEGORY
from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from dateutil.relativedelta import relativedelta
import copy
import datetime
from combocurve.science.econ.general_functions import get_py_date
from combocurve.science.econ.pre_process import header_idx_to_dates, schedule_idx_to_dates, ECL_CAPEX_CATEGORY
from combocurve.science.econ.helpers import date_to_t
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.science.econ.escalation import capex_escalation


def get_capex_params_with_dates(dates_setting,
                                date_dict,
                                capex_model,
                                shut_in_params,
                                schedule,
                                well_header_info,
                                is_complete=False,
                                gross_wh_volume_dict={}):
    '''
        Existence of capex before CF start or after CF end may change the length of time.
    '''
    cf_prior_to_aod = dates_setting['cash_flow_prior_to_as_of_date']
    first_production_date = date_dict['first_production_date']
    as_of_date = date_dict['as_of_date']
    discount_date = date_dict['original_discount_date']
    first_segment_date = date_dict['first_segment_date']
    cut_off_date = date_dict['cut_off_date']

    max_econ_life = float(dates_setting['max_well_life'])
    max_econ_life_date = as_of_date + relativedelta(months=int(max_econ_life * 12), days=-1)
    t_max_econ_life = (max_econ_life_date.year
                       - first_production_date.year) * 12 + max_econ_life_date.month - first_production_date.month

    capex_params_dict = other_capex_pre(
        capex_model['other_capex'],
        first_production_date,
        as_of_date,
        discount_date,
        first_segment_date,
        cut_off_date,
        t_max_econ_life,
        shut_in_params,
        schedule,
        well_header_info,
        is_complete=is_complete,  # ignore capex offset to econ limit when calculating reversion and cutoff
        gross_wh_volume_dict=gross_wh_volume_dict,
    )
    cf_end_date = capex_params_dict['cut_off_date']
    first_capex_date = capex_params_dict['fist_capex_date']
    if cf_prior_to_aod == 'yes' and first_capex_date is not None and first_capex_date < as_of_date:
        cf_start_date = first_capex_date
        disc_date = first_capex_date
        capex_params = capex_params_dict['all_capex']
        capex_time_list = capex_params_dict['all_time_list']
    else:
        cf_start_date = as_of_date
        disc_date = date_dict['discount_date']
        capex_params = capex_params_dict['after_aod_capex']
        capex_time_list = capex_params_dict['time_list']
    date_dict_update = {
        'cf_end_date': cf_end_date,
        'cf_start_date': cf_start_date,
        'discount_date': disc_date,
    }
    return date_dict_update, capex_params, capex_time_list, capex_params_dict['all_capex']


def other_capex_pre(
    other_capex_input,
    fpd,
    as_of_date,
    discount_date,
    fsd,
    lpd,
    t_max_econ_life,
    shut_in_params,
    schedule,
    well_header_info,
    is_complete=False,
    gross_wh_volume_dict={},
):
    t_as_of_date = (as_of_date.year - fpd.year) * 12 + as_of_date.month - fpd.month
    t_lpd = (lpd.year - fpd.year) * 12 + lpd.month - fpd.month

    rows = copy.deepcopy(other_capex_input['rows'])

    possible_criteria_modes = {
        'offset_to_fpd': fpd,
        'offset_to_as_of_date': as_of_date,
        'offset_to_discount_date': discount_date,
        'offset_to_first_segment': fsd,
        'offset_to_econ_limit': lpd,
    }
    possible_rate_criteria_modes = ['oil_rate', 'water_rate', 'gas_rate', 'total_fluid_rate']

    for row in rows:
        this_row_keys = row.keys()

        if 'date' in this_row_keys:
            default_offset_date = row.get('offset_date')
            row['date'] = get_py_date(row.get('date'))
        elif any(item in this_row_keys for item in possible_rate_criteria_modes):
            if not gross_wh_volume_dict:
                continue
            criteria_mode = list(filter(lambda key: key in this_row_keys, possible_rate_criteria_modes))[0]

            criteria_phase = 'oil'
            if criteria_mode == 'total_fluid_rate':
                phase_volume_list = gross_wh_volume_dict['oil']['well_head'] + \
                    gross_wh_volume_dict['water']['well_head']
            else:
                criteria_phase = criteria_mode.split('_')[0]
                phase_volume_list = gross_wh_volume_dict[criteria_phase]['well_head']

            # time array is based on FPD, 0 = FPD
            months = np.datetime64(fpd, 'M') + gross_wh_volume_dict[criteria_phase]['time']
            days = ((months + 1).astype('datetime64[D]') - months.astype('datetime64[D]')).astype(int)

            daily_volume = phase_volume_list / days

            try:
                phase_volume_list_trimmed = np.trim_zeros(daily_volume, trim='f')
                is_current_month_less = phase_volume_list_trimmed <= row[criteria_mode]
                is_last_month_higher = phase_volume_list_trimmed > row[criteria_mode]
                is_last_month_higher = np.concatenate((np.array([False]), is_last_month_higher), axis=0)[:-1]
                is_condition_met = is_last_month_higher & is_current_month_less
                criteria_time_index = np.argwhere(is_condition_met)[0][0] + len(daily_volume) - len(
                    phase_volume_list_trimmed)
            except IndexError:
                continue
            default_offset_date = fpd + relativedelta(
                months=int(gross_wh_volume_dict[criteria_phase]['time'][criteria_time_index]))
            row['date'] = default_offset_date
        else:
            if 'fromSchedule' in this_row_keys:
                possible_criteria_modes.update(schedule_idx_to_dates(schedule))
            elif 'fromHeaders' in this_row_keys:
                possible_criteria_modes.update(header_idx_to_dates(well_header_info))

            criteria_mode = list(filter(lambda key: key in this_row_keys, possible_criteria_modes.keys()))[0]
            default_offset_date = possible_criteria_modes[criteria_mode]
            if default_offset_date is None:  # drop capex if default_offset_date is none
                continue
            row['date'] = default_offset_date + datetime.timedelta(row[criteria_mode])

        offset_date_option = row.get('escalation_start', EconModelDefaults.escalation_start)
        offset_date_criteria = next(iter(offset_date_option))
        offset_date_value = offset_date_option[offset_date_criteria]
        if offset_date_criteria == 'fpd':
            row['offset_date'] = fpd + datetime.timedelta(offset_date_value)
        elif offset_date_criteria == 'as_of_date':
            row['offset_date'] = as_of_date + datetime.timedelta(offset_date_value)
        elif offset_date_criteria == 'econ_limit':
            row['offset_date'] = lpd + datetime.timedelta(offset_date_value)
        elif offset_date_criteria == 'date':
            row['offset_date'] = get_py_date(offset_date_value)
        elif offset_date_criteria == 'apply_to_criteria' and default_offset_date:
            row['offset_date'] = default_offset_date + datetime.timedelta(offset_date_value)
        else:
            row['offset_date'] = default_offset_date

        # add time
        this_time = date_to_t(row['date'], fpd)
        row['time'] = this_time

        # escalation preprocess
        row['escalation_param'] = capex_escalation(row, fpd)

    ## shut in
    if shut_in_params:
        rows = update_capex_rows(rows, shut_in_params)

    #### construct capex lists and escalation preprocess for capex model
    rows = list(filter(lambda item: 'time' in item, rows))  # drop unprocessed capex from rows
    all_time_list, all_capex, time_list, after_aod_capex = rows_to_capex(rows, t_as_of_date, t_max_econ_life, t_lpd,
                                                                         is_complete)

    #### cut_off_date, t_cut_off
    ## cut off date
    cut_off_date = lpd
    t_cut_off = t_lpd

    if len(all_time_list) > 0:
        last_capex_date = all_capex[np.argmax(all_time_list)]['date']
        t_last_capex_date = max(all_time_list)

        ## cut off date
        if t_last_capex_date > t_lpd:
            cut_off_date = last_capex_date
            t_cut_off = t_last_capex_date

    if len(all_time_list) > 0:
        fist_capex_date = all_capex[np.argmin(all_time_list)]['date']
    else:
        fist_capex_date = None

    return {
        't_cut_off': t_cut_off,
        'cut_off_date': cut_off_date,  # actually cf end date
        #
        'all_capex': all_capex,
        'all_time_list': all_time_list,
        #
        'after_aod_capex': after_aod_capex,
        'time_list': time_list,
        #
        'fist_capex_date': fist_capex_date
    }


def update_capex_rows(other_capex_rows, shut_in_params):
    capex_pop_idx_list = []
    for p in shut_in_params.keys():
        if shut_in_params[p] is None:
            continue
        for s in shut_in_params[p]:
            if s['capex'] == 'yes':
                continue
            for i, c in enumerate(other_capex_rows):
                capex_date_idx = (np.datetime64(c['date']) - np.datetime64('1900-01-01')).astype(int)
                if capex_date_idx >= s['start_idx'] and capex_date_idx <= s['end_idx']:
                    capex_pop_idx_list.append(i)

    # empty list won't cause error in np.delete but empty np array will
    unique_pop_idx_list = np.unique(capex_pop_idx_list).tolist()
    return np.delete(other_capex_rows, unique_pop_idx_list)


# oneline capex
def rows_to_capex(rows, t_as_of_date, t_max_econ_life, t_lpd, is_complete):
    all_time_list = []
    all_capex = []
    after_aod_time_list = []
    after_aod_capex = []

    for i in range(len(rows)):

        this_time = rows[i]['time']

        this_row_keys = rows[i].keys()
        appear_after_ecl = rows[i].get('after_econ_limit', 'no')

        is_offset_ecl_in_keys = 'offset_to_econ_limit' in this_row_keys
        after_max_life = this_time > t_max_econ_life
        after_ecl = this_time > t_lpd
        category_ecl_capex = rows[i]['category'] in ECL_CAPEX_CATEGORY

        # skip capex later than econ limit if: 1. not abandonment and salvage,
        # 2. not offset to econ limit 3. appear_after_ecl not set to yes
        if (after_ecl) and (not category_ecl_capex) and (not is_offset_ecl_in_keys) and appear_after_ecl == 'no':
            continue

        # skip capex later than max econ life if: 1. not abandonment and salvage, 2. not offset to econ limit
        if (after_max_life) and (not category_ecl_capex) and (not is_offset_ecl_in_keys):
            continue

        if (is_offset_ecl_in_keys or after_ecl) and (is_complete is False):
            continue

        # convert m$ to $
        rows[i]['tangible'] = rows[i]['tangible'] * 1000
        rows[i]['intangible'] = rows[i]['intangible'] * 1000

        # group CAPEX need to consider gross CAPEX
        rows[i]['from_group'] = rows[i].get('from_group', False)
        if rows[i]['from_group']:
            rows[i]['gross_tangible'] = rows[i]['gross_tangible'] * 1000
            rows[i]['gross_intangible'] = rows[i]['gross_intangible'] * 1000

        all_time_list.append(this_time)
        all_capex.append(rows[i])

        if this_time >= t_as_of_date:
            after_aod_time_list.append(this_time)
            after_aod_capex.append(rows[i])

    return all_time_list, all_capex, after_aod_time_list, after_aod_capex


class CAPEX(EconCalculation):
    def __init__(self, date_dict, dates_setting, shut_in_params, capex_model, schedule, well_header_info):
        self.shut_in_params = shut_in_params
        self.date_dict = date_dict
        self.dates_setting = dates_setting
        self.capex_model = capex_model
        self.schedule = schedule
        self.well_header_info = well_header_info

    def _get_reversion_by_t(self, rev_dates_detail):
        reversion_by_t = {}

        for rev in rev_dates_detail:
            this_t = rev['t']
            if this_t not in reversion_by_t:
                reversion_by_t[this_t] = [rev]
            else:
                reversion_by_t[this_t].append(rev)

        for t in reversion_by_t:
            reversion_by_t[t] = sorted(reversion_by_t[t], key=lambda k: k['date'])

        return reversion_by_t

    def _get_wi_in_reversion_month(self, capex_date, month_reversions):
        for rev in month_reversions:
            if capex_date < rev['date']:
                return rev['before']
        return month_reversions[-1]['after']

    @staticmethod
    def _get_gross_net_capex(one_capex, tangible, intangible, capex_wi, deal_term):
        capex_calculation = one_capex['calculation']

        if one_capex.get('from_group', False):
            # deal term is already considered on group level
            # directly use gross and net numbers from model for group and net CAPEX
            return one_capex['gross_tangible'], one_capex['gross_intangible'], tangible, intangible

        if capex_calculation == 'net':
            try:
                if capex_wi == 0:
                    # if WI is 0, can not gross up, set gross same as net
                    capex_wi = 1
                gross_tangible = tangible / capex_wi
                gross_intangible = intangible / capex_wi
            except (FloatingPointError, ZeroDivisionError):
                gross_tangible = tangible
                gross_intangible = intangible

        elif capex_calculation == 'gross':
            gross_tangible = tangible
            gross_intangible = intangible
        else:
            raise Exception('CAPEX calculation neither net nor gross!', None)

        net_tangible = gross_tangible * capex_wi * deal_term
        net_intangible = gross_intangible * capex_wi * deal_term

        return gross_tangible, gross_intangible, net_tangible, net_intangible

    def result(self, ownership_dict_by_phase, t_all, rev_dates_detail, is_complete, gross_wh_volume_dict):

        _, capex_params, capex_time_list, all_capex = get_capex_params_with_dates(
            self.dates_setting,
            self.date_dict,
            self.capex_model,
            self.shut_in_params,
            self.schedule,
            self.well_header_info,
            is_complete=is_complete,
            gross_wh_volume_dict=gross_wh_volume_dict,
        )

        volume_wi = ownership_dict_by_phase['oil']['wi']

        if len(capex_time_list) == 0:
            t_capex = t_all
        else:
            t_capex = np.arange(t_all[0], max(t_all[-1], max(capex_time_list)) + 1)

        capex_dict = {'time': t_capex}

        if isinstance(volume_wi, np.ndarray):
            t_start = min(t_capex[0], t_all[0])
            t_end = max(t_capex[-1], t_all[-1])

            # wi from t_start to t_end
            all_wi = np.concatenate(
                (np.repeat(volume_wi[0], t_all[0] - t_start), volume_wi, np.repeat(volume_wi[-1], t_end - t_all[-1])),
                axis=0)

            # t_all need to be updated after all_wi been updated
            t_all = np.arange(t_start, t_end + 1)

            capex_wi = all_wi[(t_all >= t_capex[0]) & (t_all <= t_capex[-1])]
        else:
            capex_wi = np.repeat(volume_wi, len(t_capex))

        ## gross and deal terms adjustment
        tangible = np.zeros(len(t_capex))
        intangible = np.zeros(len(t_capex))
        tangible_gross = np.zeros(len(t_capex))
        intangible_gross = np.zeros(len(t_capex))
        capex_detail = []

        capex_dict['capex_by_category'] = {
            'gross': {
                key: {
                    'tangible': np.zeros(len(t_capex)),
                    'intangible': np.zeros(len(t_capex)),
                    'total': None
                }
                for key in CAPEX_CATEGORY
            },
            'net': {
                key: {
                    'tangible': np.zeros(len(t_capex)),
                    'intangible': np.zeros(len(t_capex)),
                    'total': None
                }
                for key in CAPEX_CATEGORY
            }
        }

        reversion_by_t = self._get_reversion_by_t(rev_dates_detail)

        for one_capex in capex_params:
            this_capex_t = one_capex['time']

            # deal_terms
            if one_capex['deal_terms'] == '' or one_capex['deal_terms'] is None:
                this_deal_term = 1
            else:
                this_deal_term = one_capex['deal_terms']

            # escalation
            this_capex_esca = one_capex['escalation_param']
            if this_capex_esca:
                this_esca_method = this_capex_esca['type']
                this_esca_value = this_capex_esca['value']

                if this_esca_method == 'add':
                    this_tangible = one_capex['tangible'] + this_esca_value
                    this_intangible = one_capex['intangible'] + this_esca_value
                else:
                    this_tangible = one_capex['tangible'] * this_esca_value
                    this_intangible = one_capex['intangible'] * this_esca_value

            else:
                this_tangible = one_capex['tangible']
                this_intangible = one_capex['intangible']

            # net/gross
            if this_capex_t in reversion_by_t:
                this_capex_wi = self._get_wi_in_reversion_month(one_capex['date'], reversion_by_t[this_capex_t])
            else:
                capex_mask = t_capex == this_capex_t
                this_capex_wi = capex_wi[capex_mask][0] if len(capex_wi[capex_mask]) != 0 else 1.0

            tan_gross, intan_gross, tan_final, intan_final = self._get_gross_net_capex(
                one_capex, this_tangible, this_intangible, this_capex_wi, this_deal_term)

            capex_t_flag = t_capex == this_capex_t

            # fill in value of tangible and intangible
            tangible[capex_t_flag] = np.add(tangible[capex_t_flag], tan_final)
            intangible[capex_t_flag] = np.add(intangible[capex_t_flag], intan_final)
            tangible_gross[capex_t_flag] = np.add(tangible_gross[capex_t_flag], tan_gross)
            intangible_gross[capex_t_flag] = np.add(intangible_gross[capex_t_flag], intan_gross)

            # capex by category
            this_category = one_capex['category']

            for calc in ['gross', 'net']:
                this_cat_dict = capex_dict['capex_by_category'][calc][this_category]
                if calc == 'gross':
                    tan = tan_gross
                    intan = intan_gross
                else:
                    tan = tan_final
                    intan = intan_final
                this_cat_dict['tangible'][capex_t_flag] = np.add(this_cat_dict['tangible'][capex_t_flag], tan)
                this_cat_dict['intangible'][capex_t_flag] = np.add(this_cat_dict['intangible'][capex_t_flag], intan)

            # fill in capex detail for discount
            capex_detail.append({
                'date': one_capex['date'],
                'index': this_capex_t,
                'tangible': tan_final,
                'intangible': intan_final,
                # gross capex for group capex allocation
                'gross_tangible': tan_gross,
                'gross_intangible': intan_gross,
                'total': tan_final + intan_final,
                'after_econ_limit': one_capex.get('after_econ_limit', 'no')
            })

        total_capex = np.add(tangible, intangible)
        total_gross_capex = np.add(tangible_gross, intangible_gross)
        for calc in capex_dict['capex_by_category']:
            for cat in capex_dict['capex_by_category'][calc]:
                this_cat_dict = capex_dict['capex_by_category'][calc][cat]
                cat_tan = this_cat_dict['tangible']
                cat_intan = this_cat_dict['intangible']
                this_cat_dict['total'] = cat_tan + cat_intan

        # update capex_dict
        capex_dict['tangible'] = tangible
        capex_dict['intangible'] = intangible
        capex_dict['total_capex'] = total_capex
        capex_dict['total_gross_capex'] = total_gross_capex
        capex_dict['capex_detail'] = capex_detail

        return {'capex_dict': capex_dict, 'all_capex': all_capex}
