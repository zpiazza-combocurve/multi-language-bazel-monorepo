from combocurve.services.rollUp.roll_up_well_input import RollUpWellInput
from combocurve.science.econ.econ_calculations.well_result import WellResult
from combocurve.shared.econ_tools.econ_model_tools import OwnershipEnum
from combocurve.science.econ.econ_calculations.reversion import get_initial_ownership_params

WELL_HEAD = 'well_head'
OWNERSHIP = OwnershipEnum.OWNERSHIP.value


def flatten_volume_columns(volume_dict):
    # this BOE conversion is always using 6 now, if meet issue, we need to add the calculation in econ
    return {
        'gross_oil_well_head_volume': volume_dict['oil'][WELL_HEAD],
        'gross_gas_well_head_volume': volume_dict['gas'][WELL_HEAD],
        'gross_boe_well_head_volume': volume_dict['boe'][WELL_HEAD]['total'],
        'gross_mcfe_well_head_volume': volume_dict['mcfe'][WELL_HEAD]['total'],
        'gross_water_well_head_volume': volume_dict['water'][WELL_HEAD],
        'gross_oil_sales_volume': volume_dict['oil']['sales'],
        'gross_gas_sales_volume': volume_dict['gas']['sales'],
        'gross_ngl_sales_volume': volume_dict['ngl']['sales'],
        'gross_drip_condensate_sales_volume': volume_dict['drip_condensate']['sales'],
        'gross_boe_sales_volume': volume_dict['boe']['sales']['total'],
        'gross_mcfe_sales_volume': volume_dict['mcfe']['sales']['total'],
        'wi_oil_sales_volume': volume_dict['oil'][OWNERSHIP]['sales']['wi'],
        'wi_gas_sales_volume': volume_dict['gas'][OWNERSHIP]['sales']['wi'],
        'wi_ngl_sales_volume': volume_dict['ngl'][OWNERSHIP]['sales']['wi'],
        'wi_drip_condensate_sales_volume': volume_dict['drip_condensate'][OWNERSHIP]['sales']['wi'],
        'wi_boe_sales_volume': volume_dict['boe']['sales']['wi'],
        'wi_mcfe_sales_volume': volume_dict['mcfe']['sales']['wi'],
        'net_oil_sales_volume': volume_dict['oil'][OWNERSHIP]['sales']['nri'],
        'net_gas_sales_volume': volume_dict['gas'][OWNERSHIP]['sales']['nri'],
        'net_ngl_sales_volume': volume_dict['ngl'][OWNERSHIP]['sales']['nri'],
        'net_drip_condensate_sales_volume': volume_dict['drip_condensate'][OWNERSHIP]['sales']['nri'],
        'net_boe_sales_volume': volume_dict['boe']['sales']['nri'],
        'net_mcfe_sales_volume': volume_dict['mcfe']['sales']['nri'],
    }


class RollUpWellResult(WellResult):
    def __init__(self, well_input: RollUpWellInput, well_result_params):
        self.well_input = well_input
        self.unecon_bool = False
        self.deep_update_result_by_dict(well_result_params)

        initial_ownership_model = self.well_input.ownership_model['ownership'][OwnershipEnum.INITIAL_OWNERSHIP.value]
        self.ownership_params, self.t_ownership = get_initial_ownership_params(initial_ownership_model,
                                                                               self.well_input.date_dict)

    def rollup_result_dict(self, daily):
        if not daily:
            all_columns = flatten_volume_columns(self.volume_dict)

            ret_dict = {'date': list(self.date_list)}
            columns_selected = self.well_input.columns_selected
        else:
            all_columns = flatten_volume_columns(self.volume_dict_daily)

            date_list_daily = next(iter(self.gross_wh_volume_dict_daily.items()))[1]['date']
            ret_dict = {'date': list(date_list_daily)}
            columns_selected = self.well_input.columns_selected

        for col in columns_selected:
            if col == 'well_count_curve':
                continue
            ret_dict[col] = all_columns[col]
        return ret_dict
