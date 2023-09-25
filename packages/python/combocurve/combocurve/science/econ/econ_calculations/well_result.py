from combocurve.science.econ.econ_input.well_input import WellInput
import numpy as np
import datetime
import collections


def get_str_date_dict(date_dict):
    str_date_dict = {}
    # convert to a dict of string dates
    for date_key in date_dict:
        if date_dict[date_key] is datetime.date:
            str_date_dict[date_key] = str(date_dict[date_key])
        else:
            str_date_dict[date_key] = date_dict[date_key]
    return str_date_dict


def deep_update(source, overrides):
    """
    Update a nested dictionary or similar mapping.
    Modify ``source`` in place.
    """
    for key, value in overrides.items():
        if isinstance(value, collections.Mapping) and value:
            returned = deep_update(source.get(key, {}), value)
            source[key] = returned
        else:
            source[key] = overrides[key]
    return source


class WellResultError(Exception):
    def __init__(self, message='Error in using well result'):
        self.message = message
        super().__init__(self.message)


class WellResult():
    def __init__(self, well_input: WellInput, well_result_params: dict):
        # TODO: not pass in whole well input, only pass in needed result
        self.is_complete = False
        self.unecon_bool = False
        self.well_input = well_input
        self.deep_update_result_by_dict(well_result_params)

    def __getitem__(self, key):
        if key in self.__dict__:
            return self.__dict__[key]
        else:
            raise WellResultError(f'variable {key} not found in well result')

    def get(self, key, default=None):
        if key in self.__dict__:
            return self.__dict__[key]
        else:
            return default

    def update_result(self, variable_name, variable):
        self.__dict__[variable_name] = variable

    def deep_update_result_by_dict(self, update_dict):
        deep_update(self.__dict__, update_dict)

    def update_result_by_dict(self, update_dict):
        self.__dict__.update(update_dict)

    def simple_econ_result(self):
        # convert to a dict of string dates
        str_date_dict = get_str_date_dict(self.well_input.date_dict)
        str_date_list = np.array(list(map(lambda date: str(date), self.date_list)))

        # In the future, we want to include computation of all columns here.
        econ_results = {
            'volume': self.volume_dict,
            'volume_daily': self.get('volume_dict_daily', {}),
            # this daily WH volume is constructed from monthly calcs.
            'daily_wh_volume': self.get('gross_wh_volume_dict_daily_temp', {}),
            'stream_property': {
                'loss_flare': self.stream_property_dict['loss_flare'],
                'shrinkage': self.stream_property_dict['shrinkage'],
                'yield': self.stream_property_dict['yield']
            },
            'revenue': self.revenue_dict,
            'ghg_mass': self.carbon_ownership_mass_dict,
            'expense': {
                'var_expense': self.variable_expenses,
                'fixed_expense': self.fixed_expenses,
                'water_expense': self.water_disposal,
                'ghg_expense': self.carbon_expenses,
                'total': {
                    'water_disp':
                    np.sum([disposal['values'] for disposal in self.water_disposal], axis=0),
                    'var_expense':
                    np.sum([variable_expense['values'] for variable_expense in self.variable_expenses], axis=0),
                    'fixed_expense':
                    np.sum([fixed_expense['values'] for fixed_expense in self.fixed_expenses], axis=0),
                    'ghg_expense':
                    np.sum([ghg_expense['values'] for ghg_expense in self.carbon_expenses], axis=0)
                },
            },
            'production_tax': self.production_tax_dict,
            'capex': self.capex_dict,
            'bfit_cf': self.bfit_cf_dict,
            'bfit_disc': self.discounted_bfit_cf_dict,
            'afit_cf': self.afit_cf_dict,
            'afit_disc': self.discounted_afit_cf_dict,
            'date': str_date_list,
            'py_date': self.date_list,
            'time': self.t_all,
            'ownership': self.ownership_dict_by_phase,
            'date_dict': str_date_dict,
            'unecon_bool': self.unecon_bool,
            'well_id': self.well_input.well_id,
            'well_count': self.well_count,
        }

        if self.well_input.tax_option == 'no':
            del econ_results['afit_cf']
            del econ_results['afit_disc']

        return econ_results


def econ_result_for_group_case(well_result_dict):
    return {
        'volume': well_result_dict['volume_dict'],
        'production_tax': well_result_dict['production_tax_dict'],
        'time': well_result_dict['t_all'],
        'py_date': well_result_dict['date_list'],
        'ownership': well_result_dict['ownership_dict_by_phase'],
        'date': np.array(list(map(lambda date: str(date), well_result_dict['date_list']))),
        'capex': well_result_dict['capex_dict'],
        'revenue': well_result_dict['revenue_dict'],
        'expense': {
            'var_expense': well_result_dict['variable_expenses'],
            'fixed_expense': well_result_dict['fixed_expenses'],
            'water_expense': well_result_dict['water_disposal'],
            'ghg_expense': well_result_dict['carbon_expenses'],
            'total': {
                'water_disp':
                np.sum([disposal['values'] for disposal in well_result_dict['water_disposal']], axis=0),
                'var_expense':
                np.sum([variable_expense['values'] for variable_expense in well_result_dict['variable_expenses']],
                       axis=0),
                'fixed_expense':
                np.sum([fixed_expense['values'] for fixed_expense in well_result_dict['fixed_expenses']], axis=0),
                'ghg_expense':
                np.sum([ghg_expense['values'] for ghg_expense in well_result_dict['carbon_expenses']], axis=0)
            },
        },
        'bfit_cf': well_result_dict['bfit_cf_dict'],
        'bfit_disc': well_result_dict['discounted_bfit_cf_dict'],
        'well_count': well_result_dict['well_count'],
    }


def econ_result_for_group_volume_cutoff(well_result_dict):
    return {
        'time': well_result_dict['t_all'],
        'py_date': well_result_dict['date_list'],
        'volume': well_result_dict['volume_dict'],
        'daily_wh_volume': {},  # no daily volume for group aggregation result
    }


def econ_result_for_group_cf_cutoff(well_result_dict):
    return {
        'time': well_result_dict['t_all'],
        'py_date': well_result_dict['date_list'],
        'capex': well_result_dict['capex_dict'],
        'expense': {
            'var_expense': well_result_dict['variable_expenses'],
            'fixed_expense': well_result_dict['fixed_expenses'],
            'water_expense': well_result_dict['water_disposal'],
            'ghg_expense': well_result_dict['carbon_expenses'],
            'total': {
                'water_disp':
                np.sum([disposal['values'] for disposal in well_result_dict['water_disposal']], axis=0),
                'var_expense':
                np.sum([variable_expense['values'] for variable_expense in well_result_dict['variable_expenses']],
                       axis=0),
                'fixed_expense':
                np.sum([fixed_expense['values'] for fixed_expense in well_result_dict['fixed_expenses']], axis=0),
                'ghg_expense':
                np.sum([ghg_expense['values'] for ghg_expense in well_result_dict['carbon_expenses']], axis=0)
            },
        },
        'bfit_cf': well_result_dict['bfit_cf_dict'],
    }
