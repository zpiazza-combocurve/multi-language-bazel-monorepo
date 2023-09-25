from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.pre_process import PreProcess
from combocurve.science.econ.helpers import days_in_month
import numpy as np


class Ownership(EconCalculation):
    def result(
            self,
            ownership_params,  # added by Reversion
            t_ownership,  # added by Reversion
            t_all,  # added by Wellhead Volume
            is_complete=True,  # this is set to False in reversion and cutoff calculation
    ):
        '''
            Translates the ownership input to ownership_dict
        '''
        # get ownership_dict
        ownership_dict_by_phase = self._ownership_pre(ownership_params, t_ownership, t_all)
        if is_complete:  # treat npi as expense when calculating reversion and cutoff
            npi_dict = {
                ownership_params[self.NET_PROFIT_INTEREST_TYPE]:
                PreProcess.adjust_array(ownership_params[self.NET_PROFIT_INTEREST], t_ownership, t_all)
            }
        else:
            npi_dict = {
                'expense': PreProcess.adjust_array(ownership_params[self.NET_PROFIT_INTEREST], t_ownership, t_all)
            }

        return {'ownership_dict_by_phase': ownership_dict_by_phase, 'npi': npi_dict}

    def _ownership_pre(self, ownership_input, t_ownership, t_all):

        ownership_dict = {}

        for key in ['oil', 'gas', 'ngl', 'drip_condensate', 'original']:
            # the orinigal is for ad valorem tax $/month by nri, fixed expense by nri and water disposal by nri
            ownership_dict[key] = {}

            ownership_dict[key]['wi'] = ownership_input['working_interest']
            ownership_dict[key]['nri'] = ownership_input[key + '_ownership']['net_revenue_interest']
            ownership_dict[key]['lease_nri'] = ownership_input[key + '_ownership']['lease_net_revenue_interest']

            ownership_dict[key]['one_minus_wi'] = 1 - ownership_dict[key]['wi']
            ownership_dict[key]['one_minus_nri'] = 1 - ownership_dict[key]['nri']
            ownership_dict[key]['one_minus_lease_nri'] = 1 - ownership_dict[key]['lease_nri']

            ownership_dict[key]['wi_minus_one'] = ownership_dict[key]['wi'] - 1
            ownership_dict[key]['nri_minus_one'] = ownership_dict[key]['nri'] - 1
            ownership_dict[key]['lease_nri_minus_one'] = ownership_dict[key]['lease_nri'] - 1
            ownership_dict[key]['100_pct_wi'] = np.repeat(1, len(ownership_input['working_interest']))

        for key in ownership_dict:
            for subkey in ownership_dict[key]:
                this_ownership = ownership_dict[key][subkey]
                ownership_dict[key][subkey] = PreProcess.adjust_array(this_ownership, t_ownership, t_all)

        return ownership_dict


class OwnershipDaily(EconCalculation):
    def __init__(self, date_dict):
        self.date_dict = date_dict

    def result(
            self,
            ownership_dict_by_phase,
            date_list,  # added by Wellhead Volume
    ):
        ownership_dict_by_phase_daily = self._daily_result(ownership_dict_by_phase, date_list, self.date_dict)

        return {
            'ownership_dict_by_phase_daily': ownership_dict_by_phase_daily,
        }

    def _daily_result(
        self,
        ownership_dict_by_phase,
        date_list,
        date_dict,
    ):
        '''
            convert the monthly ownership to daily ownership_dict
        '''
        ownership_dict_by_phase_daily = {phase: dict() for phase in ownership_dict_by_phase}
        cf_start_date = date_dict['cf_start_date']
        cf_end_date = date_dict['cf_end_date']
        number_of_days = days_in_month(np.arange(date_list[0], date_list[-1], dtype='datetime64[M]'))
        if len(number_of_days) > 0:
            number_of_days[0] -= cf_start_date.day - 1
            number_of_days = np.append(number_of_days, cf_end_date.day)
        else:
            number_of_days = np.append(number_of_days, cf_end_date.day - cf_start_date.day + 1)

        for key in ownership_dict_by_phase:
            for ownership in ownership_dict_by_phase[key]:
                ownership_dict_by_phase_daily[key][ownership] = np.repeat(ownership_dict_by_phase[key][ownership],
                                                                          number_of_days)

        return ownership_dict_by_phase_daily
