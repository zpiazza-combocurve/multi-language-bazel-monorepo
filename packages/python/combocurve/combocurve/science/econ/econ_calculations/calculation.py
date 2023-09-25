from abc import ABC, abstractclassmethod
import datetime
import numpy as np
from calendar import monthrange


class EconCalculation(ABC):
    TOTAL_REVENUE = 'total_revenue'
    RATE_ROW_KEYS = ['oil_rate', 'gas_rate', 'water_rate', 'total_fluid_rate']
    NET_PROFIT_INTEREST = 'net_profit_interest'
    NET_PROFIT_INTEREST_TYPE = 'net_profit_interest_type'
    # keep unit_cost for old schema
    EXP_UNIT_KEYS = [
        'dollar_per_bbl',
        'dollar_per_mcf',
        'dollar_per_mmbtu',
        'pct_of_oil_rev',
        'pct_of_gas_rev',
        'pct_of_ngl_rev',
        'pct_of_drip_condensate_rev',
        'pct_of_total_rev',
    ]

    @abstractclassmethod
    def result(self):
        ...

    def _intersect_with_rate_row_keys(self, row_keys):
        return set(row_keys) & set(self.RATE_ROW_KEYS)

    def _apply_escalation(self, values, escalation_params):
        if escalation_params is None:
            return values

        escalation_type = escalation_params['escalation_type']
        escalation_values = escalation_params['escalation_values']

        if escalation_type == 'add':
            return values + escalation_values
        else:
            # multiply
            return values * escalation_values

    def _crop_by_month_fraction(self,
                                t_all: np.array,
                                fpd: datetime.date,
                                cutoff_date: datetime.date,
                                cf_start_date: datetime.date,
                                cf_end_date: datetime.date,
                                stop_at_ecl: str = 'yes',
                                bf_fpd: str = 'no'):
        '''Provides the multipler to crop and/or diminutize the values in time series data according to its start and
        the end. The function assumes fixed value in each month and considers the relationship between the start/end
        and Econ dates as well as model specific settings.

        Args:
            t_all (np.array): array of all monthly timestamps in well life relative to fpd
            fpd (datetime.date): date that a well starts producing
            cutoff_date (datetime.date): date that a well stops producing
            cf_start_date (datetime.date): date that econ report starts
            cf_end_date (datetime.date): date that econ report ends
            stop_at_ecl (str, optional): option to determine if it stops at cutoff date. Defaults to 'yes'.
            bf_fpd (str, optional): option to determine if it appears before fpd. Defaults to 'no'.

        Returns:
            multiplier (np.array): array of multiliers to produce the cropped data
        '''
        t_cutoff = self._date_to_t(cutoff_date, fpd)
        t_cf_start = self._date_to_t(cf_start_date, fpd)
        t_cf_end = self._date_to_t(cf_end_date, fpd)

        # case 1: bf_fpd = no, CF Start < FPD: crop at FPD
        # case 2: bf_fpd = yes, CF Start < FPD: crop at CF Start
        # case 3: CF Start >= FPD: crop at CF Start (bf_fpd not affecting result)
        first_crop_date = fpd
        t_first_crop = 0
        if (cf_start_date < fpd and bf_fpd == 'yes') or (cf_start_date >= fpd):  # t_fpd = 0
            first_crop_date = cf_start_date
            t_first_crop = t_cf_start

        # case 1: stop_at_ecl = no, CF End > CutOff: crop at CF End
        # case 2: stop_at_ecl = yes: crop at CutOff
        last_crop_date = cutoff_date
        t_last_crop = t_cutoff
        if stop_at_ecl == 'no' and cf_end_date > cutoff_date:
            last_crop_date = cf_end_date
            t_last_crop = t_cf_end

        # first_production_prop
        first_month_num_days = monthrange(first_crop_date.year, first_crop_date.month)[1]
        first_production_prop = 1 - (first_crop_date.day - 1) / first_month_num_days

        # last_production_prop
        last_month_num_days = monthrange(last_crop_date.year, last_crop_date.month)[1]
        last_production_prop = last_crop_date.day / last_month_num_days

        #construct and crop the multiplier array
        multiplier = np.ones(len(t_all))
        multiplier[t_all < t_first_crop] = 0
        if t_first_crop in t_all and t_cutoff > t_first_crop:
            multiplier[t_all == t_first_crop] = first_production_prop

        multiplier[t_all > t_last_crop] = 0
        if t_last_crop in t_all:
            multiplier[t_all == t_last_crop] = last_production_prop

        return multiplier

    def _date_to_t(self, input_date, fpd):
        return (input_date.year - fpd.year) * 12 + input_date.month - fpd.month

    def _get_phase_ownership(self, ownership_dict_by_phase, stream_name):
        return ownership_dict_by_phase.get(stream_name, ownership_dict_by_phase['original'])
