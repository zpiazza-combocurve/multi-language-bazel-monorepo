from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults


class MissingAssumptionError(Exception):
    expected = True


class LinkToWellsEclError(Exception):
    expected = True


def check_missing_assumption(assumptions):
    required_assumptions = {
        'general_options': 'General Options',
        'dates': 'Dates',
        'ownership_reversion': 'Ownership Reversion',
    }

    other_assumptions = {
        'pricing': 'Pricing',
        'production_taxes': 'Production Taxes',
    }

    missing_assump_error_list = []
    for key in required_assumptions.keys():
        if assumptions.get(key) is None:
            missing_assump_error_list.append(key)
    if len(missing_assump_error_list) > 0:
        missing_assump_error = 'Missing required assumption: '
        for i in range(len(missing_assump_error_list)):
            if i < len(missing_assump_error_list) - 1:
                missing_assump_error += required_assumptions[missing_assump_error_list[i]] + ', '
            else:
                missing_assump_error += required_assumptions[missing_assump_error_list[i]]
        raise MissingAssumptionError(missing_assump_error, None)

    missing_assump_warning = None
    missing_assump_warning_keys = []
    for key in other_assumptions.keys():
        if assumptions.get(key) is None:
            missing_assump_warning_keys.append(key)
    if len(missing_assump_warning_keys) > 0:
        missing_assump_warning = 'Missing assumption: '
        for i in range(len(missing_assump_warning_keys)):
            if i < len(missing_assump_warning_keys) - 1:
                missing_assump_warning += other_assumptions[missing_assump_warning_keys[i]] + ', '
            else:
                missing_assump_warning += other_assumptions[missing_assump_warning_keys[i]]

    return missing_assump_warning


def check_link_to_wells_ecl_error(dates_assumption):
    error_message = []
    if 'link_to_wells_ecl_error' in dates_assumption.get('cut_off', {}):
        error_message.append(dates_assumption['cut_off']['link_to_wells_ecl_error'])

    fpd_source_hierarchy = dates_assumption['dates_setting'].get('fpd_source_hierarchy',
                                                                 EconModelDefaults.fpd_source_hierarchy())
    fpd_sources = [
        fpd_source_hierarchy['first_fpd_source'],
        fpd_source_hierarchy['second_fpd_source'],
        fpd_source_hierarchy['third_fpd_source'],
        fpd_source_hierarchy['fourth_fpd_source'],
    ]
    is_ecl_error_in_fpd_sources = ['link_to_wells_ecl_error' in fpd_source for fpd_source in fpd_sources]
    if any(is_ecl_error_in_fpd_sources):
        mapper = {
            0: 'first_fpd_source',
            1: 'second_fpd_source',
            2: 'third_fpd_source',
            3: 'fourth_fpd_source',
        }
        fpd_error = fpd_source_hierarchy[mapper[is_ecl_error_in_fpd_sources.index(True)]]['link_to_wells_ecl_error']
        error_message.append(fpd_error)

    if error_message:
        raise LinkToWellsEclError(' AND '.join(error_message), None)


def process_warning_message(warning_list):
    warning_message = ''

    for warning in warning_list:
        if warning:
            warning_message += warning + '; '

    if warning_message == '':
        warning_message = None
    elif warning_message[-2:] == '; ':
        warning_message = warning_message[:-2]

    return warning_message


def check_missing_forecast(forecast):
    missing_forecast_warning = None
    missing_forecast_list = []

    for key in ALL_PHASES:
        phase_forecast = forecast.get(key)
        if phase_forecast:
            continue
        else:
            missing_forecast_list.append(key)

    if len(missing_forecast_list) > 0:
        missing_forecast_warning = 'Missing phase forecast: '
        for i, key in enumerate(missing_forecast_list):
            if i < len(missing_forecast_list) - 1:
                missing_forecast_warning += key + ', '
            else:
                missing_forecast_warning += key

    return missing_forecast_warning
