import numpy as np
from combocurve.science.econ.pre_process import PreProcess


class Byproduct:
    def __init__(self, name, parent_name):
        self.name = name
        self.parent_name = parent_name

    def get_parent_name(self):
        return self.parent_name

    def get_gross_sales_volume(self, parent_volume_dict, this_yield_dict, phase_risk_model, date_dict,
                               use_risked_parent_volume):
        '''
            Calculate and return a dict containing gross sales volume, pre-yield gross and pre-risk gross volume.
            Drip Cond (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
            Drip Cond (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
            NGL (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
            NGL (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
        '''
        if use_risked_parent_volume == 'yes':
            if this_yield_dict['shrinkage'] == 'shrunk':
                this_parent_volume = parent_volume_dict['sales']
            else:
                this_parent_volume = parent_volume_dict['unshrunk']
        else:
            if this_yield_dict['shrinkage'] == 'shrunk':
                this_parent_volume = parent_volume_dict['pre_risk_sales']
            else:
                this_parent_volume = parent_volume_dict['pre_risk_unshrunk']

        pre_risk_volume = np.multiply(this_parent_volume, this_yield_dict['value'])
        monthly_risk = PreProcess.phase_risk_pre(phase_risk_model, date_dict, date_dict['cf_start_date'],
                                                 date_dict['cf_end_date'])
        gross_sales_volume = np.multiply(pre_risk_volume, monthly_risk)
        this_gross_sales_dict = {'pre_risk': pre_risk_volume, 'sales': gross_sales_volume}
        return this_gross_sales_dict

    def get_gross_sales_volume_daily(self, parent_volume_dict, this_yield_dict, phase_risk_model, date_dict,
                                     use_risked_parent_volume):
        '''
            Calculate and return a dict containing gross sales volume, pre-yield gross and pre-risk gross volume.
            Drip Cond (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
            Drip Cond (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross Drip Cond Sales
            NGL (Shrunk): Gross Gas Sales -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
            NGL (Unshrunk): Unshrunk Gas -> (yield) -> Pre Risk -> (risking) -> Gross NGL Sales
        '''
        # TODO: decide to use risked vs unrisked gas volume
        if use_risked_parent_volume == 'yes':
            if this_yield_dict['shrinkage'] == 'shrunk':
                this_parent_volume = parent_volume_dict['sales']
            else:
                this_parent_volume = parent_volume_dict['unshrunk']
        else:
            if this_yield_dict['shrinkage'] == 'shrunk':
                this_parent_volume = parent_volume_dict['pre_risk_sales']
            else:
                this_parent_volume = parent_volume_dict['pre_risk_unshrunk']

        pre_risk_volume = np.multiply(this_parent_volume, this_yield_dict['value'])
        daily_risk = PreProcess.phase_risk_daily_pre(phase_risk_model, date_dict, date_dict['cf_start_date'],
                                                     date_dict['cf_end_date'])
        gross_sales_volume = np.multiply(pre_risk_volume, daily_risk)
        this_gross_sales_dict = {'pre_risk': pre_risk_volume, 'sales': gross_sales_volume}
        return this_gross_sales_dict

    def get_ownership_sales_volume(self, gross_sales_volume_dict, phase_ownership):
        '''
            Calculate and return a dict containing net sales volume.
            Gross Sales -> (ownership) -> Net Sales
        '''
        ownership_volume_names = list(phase_ownership.keys())
        ownership_volume_dict = {}
        for volume_dict_key in gross_sales_volume_dict.keys():
            if volume_dict_key in ['date', 'time']:
                continue
            ownership_volume_dict[volume_dict_key] = {}
            for ownership_multiplier_name in ownership_volume_names:
                ownership_volume_dict[volume_dict_key][ownership_multiplier_name] = np.multiply(
                    gross_sales_volume_dict[volume_dict_key], phase_ownership[ownership_multiplier_name])
        return ownership_volume_dict
