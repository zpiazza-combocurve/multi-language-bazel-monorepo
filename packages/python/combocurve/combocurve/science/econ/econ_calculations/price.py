from typing import Tuple, Optional

from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.econ_model_rows_process import rows_process_with_escalation
from combocurve.science.econ.escalation import get_escalation_model
import numpy as np

from combocurve.science.econ.helpers import convert_list_of_int_to_as_of_dates, convert_list_of_date_strings_to_dates
from combocurve.science.econ.utils import criteria_label_converter
from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.services.feature_flags.feature_flags_service import evaluate_boolean_flag
from combocurve.shared.contexts import current_context


def _format_compositional_row_as_standard_rows(compositional_row) -> list[dict]:
    """Helper function to adapt the compositional row to the standard row format.

    When refactoring the code, we should consider using the compositional row format as the standard row format.

    Args:
        compositional_row (dict): A row in the compositional economics pricing model.

    Returns:
        list[dict]: A list of standard rows.
    """
    periods = compositional_row.get('period', [])
    values = compositional_row.get('value', [])
    criteria = criteria_label_converter(compositional_row.get('criteria', 'Flat'))
    if criteria == 'offset_to_as_of_date':
        periods = convert_list_of_int_to_as_of_dates(periods)
    elif criteria == 'dates':
        periods = convert_list_of_date_strings_to_dates(periods)

    rows = [{criteria: period, 'price': value} for period, value in zip(periods, values)]
    return rows


def _get_param_from_row_keys(row_keys) -> Tuple[Optional[str], Optional[str]]:
    """Get price/differentials unit parameter from row keys."""
    mapping_dict = {
        'pct_of_oil_price': 'ratio_of_oil',
        'price': 'number',
        'dollar_per_bbl': 'number',
        'dollar_per_mcf': 'number',
        'dollar_per_mmbtu': 'mmbtu',
        'dollar_per_gal': 'gal',
        'pct_of_base_price': 'ratio',
    }

    matching_units = [key for key in row_keys if key in mapping_dict]

    if len(matching_units) > 0:
        return mapping_dict[matching_units[0]], matching_units[0]
    else:
        return None, None


def _compositionals_pricing_pre(compositional_economics_pricing: dict[str, list[dict]], date_dict: dict) -> dict:
    """Compute the price for compositional economics.

    Args:
        compositional_economics_pricing (dict): The compositional economics pricing model.
        date_dict (dict): The date dictionary.

    Returns:
        dict: The price dictionary.
    """
    fpd = date_dict['first_production_date']
    cf_start_date = date_dict['cf_start_date']
    cf_end_date = date_dict['cf_end_date']

    price_dict = {}
    price_para = {}
    price_cap = {}
    price_escalation = {}

    for key in compositional_economics_pricing:
        if compositional_economics_pricing.get(key) is None:
            continue
        price_dict[key] = {}
        price_para[key] = {}
        price_cap[key] = {}
        price_escalation[key] = {}
        for category_row in compositional_economics_pricing.get(key, []):
            if category_row is None:
                continue
            category = category_row.get('category')

            # cap and escalation
            price_cap[key][category] = category_row.get('cap')
            escalation_input = category_row.get('escalation_model', {}).get('value')
            if escalation_input is None or escalation_input.lower() == 'none':
                escalation_input = {}

            price_param, _ = _get_param_from_row_keys([category_row.get('unit')])

            price_para[key][category] = price_param

            rows = _format_compositional_row_as_standard_rows(category_row)

            monthly_para, esca_param = rows_process_with_escalation(
                rows,
                date_dict,
                fpd,
                cf_start_date,
                cf_end_date,
                'price',
                escalation=escalation_input,
            )

            price_escalation[key][category] = esca_param

            if category_row.get('unit') == 'pct_of_oil_price':
                price_dict[key][category] = np.divide(monthly_para, 100)
            else:
                price_dict[key][category] = monthly_para

    return {
        'price_dict': price_dict,
        'price_parameter': price_para,
        'price_cap': price_cap,
        'price_escalation': price_escalation
    }


def _price_pre(price_input_dic, date_dict):
    fpd = date_dict['first_production_date']
    cf_start_date = date_dict['cf_start_date']
    cf_end_date = date_dict['cf_end_date']

    price_dict = {}
    price_para = {}
    price_cap = {}
    price_escalation = {}

    for key in price_input_dic:
        rows = price_input_dic[key]['rows']

        if len(rows) == 0:
            continue

        row_keys = rows[0].keys()

        # cap and escalation
        price_cap[key] = price_input_dic[key]['cap']
        escalation_input = get_escalation_model(price_input_dic[key])

        price_param, value_key = _get_param_from_row_keys(row_keys)
        price_para[key] = price_param

        monthly_para, esca_param = rows_process_with_escalation(
            rows,
            date_dict,
            fpd,
            cf_start_date,
            cf_end_date,
            value_key,
            escalation=escalation_input,
        )

        price_escalation[key] = esca_param

        if 'pct_of_oil_price' in row_keys:
            price_dict[key] = np.divide(monthly_para, 100)
        else:
            price_dict[key] = monthly_para

    return {
        'price_dict': price_dict,
        'price_parameter': price_para,
        'price_cap': price_cap,
        'price_escalation': price_escalation
    }


def _diff_pre(diff_input_dic, date_dict):
    fpd = date_dict['first_production_date']
    cf_start_date = date_dict['cf_start_date']
    cf_end_date = date_dict['cf_end_date']

    all_diff_dic = {}
    all_diff_para = {}
    all_diff_escalation = {}

    for diff_key, one_diff in diff_input_dic.items():
        diff_dic = {}
        diff_para = {}
        diff_escalation = {}
        for key in one_diff:
            rows = one_diff[key]['rows']

            if len(rows) == 0:
                continue

            escalation_input = get_escalation_model(one_diff[key])

            row_keys = rows[0].keys()

            diff_param, value_key = _get_param_from_row_keys(row_keys)
            diff_para[key] = diff_param

            monthly_para, esca_param = rows_process_with_escalation(rows,
                                                                    date_dict,
                                                                    fpd,
                                                                    cf_start_date,
                                                                    cf_end_date,
                                                                    value_key,
                                                                    escalation=escalation_input)
            diff_escalation[key] = esca_param

            if 'pct_of_base_price' in row_keys:
                diff_dic[key] = np.divide(monthly_para, 100)
            else:
                diff_dic[key] = monthly_para

        all_diff_dic[diff_key] = diff_dic
        all_diff_para[diff_key] = diff_para
        all_diff_escalation[diff_key] = diff_escalation

    return {'diff_dict': all_diff_dic, 'diff_parameter': all_diff_para, 'diff_escalation': all_diff_escalation}


class Price(EconCalculation):
    def __init__(self, date_dict, pricing_model, differential_model, compositional_economics_pricing):
        self.date_dict = date_dict
        self.pricing_model = pricing_model
        self.differential_model = differential_model
        self.compositional_economics_pricing = compositional_economics_pricing
        organization = current_context.get().tenant_info.get('db_name')
        self.compositional_economics_enabled = evaluate_boolean_flag(
            EnabledFeatureFlags.roll_out_compositional_economics, {
                "context_name": organization,
                "context_type": "organization"
            })

    def result(self):
        """Compute the price for economics.
            price = {
                'price_dict':,
                'price_parameter':,
                'price_cap':,
                'price_escalation':,
            }
            differential = {
                'diff_dict':,
                'diff_parameter':,
            }

        """
        price = _price_pre(self.pricing_model, self.date_dict)
        if self.compositional_economics_enabled and self.compositional_economics_pricing:
            compositionals = _compositionals_pricing_pre(self.compositional_economics_pricing, self.date_dict)
            for key in compositionals:
                price[key].update({'compositionals': compositionals[key]})
        differential = _diff_pre(self.differential_model, self.date_dict)
        return {'price': price, 'differential': differential}
