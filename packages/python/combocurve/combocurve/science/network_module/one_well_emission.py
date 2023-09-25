from datetime import date
import pandas as pd
from combocurve.science.econ.escalation import process_escalation_model, apply_escalation, get_escalation_model
from combocurve.utils.units import get_multiplier
from functools import partial

TOP_DOWN_EMISSION = 'emission'
EMISSION_PRODUCTS = ['co2e', 'co2', 'ch4', 'n2o']
EMISSION_PRODUCT_MAP = {
    'co2e': 'CO2e',
    'co2': 'CO2',
    'ch4': 'C1',
    'n2o': 'N2O',
}


def get_dates(date_dict):
    ## manually set the as_of_date and fpd to be the first day of the month
    raw_fpd = date_dict['first_production_date']
    raw_as_of_date = date_dict['as_of_date']
    return date(raw_fpd.year, raw_fpd.month, 1), date(raw_as_of_date.year, raw_as_of_date.month,
                                                      1), date_dict['cut_off_date']


def process_per_well_per_year(well_id, well_data, emission_data, date_dict, escalation_params):
    fpd, _, _ = get_dates(date_dict)

    ret = []
    for _product in EMISSION_PRODUCTS:
        value = emission_data[_product] / 12
        product = EMISSION_PRODUCT_MAP[_product]
        if not value:
            continue

        values_after_escalation = apply_escalation(value, escalation_params)

        ret += [
            {
                'node_type': emission_data['category'],
                'product': product,
                'value': 0 if date < fpd else (values_after_escalation[i] if escalation_params else
                                               value),  ## take care of special case when no escalation
                'date': date
            } for i, date in enumerate(well_data['date'])
        ]

    return ret


def process_per_new_well(well_id, well_data, emission_data, date_dict, escalation_params):
    fpd, as_of_date, cut_off_date = get_dates(date_dict)

    if fpd < as_of_date or fpd > cut_off_date:
        return []
    ret = []
    for _product in EMISSION_PRODUCTS:
        value = emission_data[_product]
        product = EMISSION_PRODUCT_MAP[_product]
        if not value:
            continue
        # TODO: check with Xuyan to see how to apply escalation to only FPD? should it change or not?
        # else:
        #     values_after_escalation = apply_escalation(value, escalation_params)

        ret += [{
            # 'well_id': well_id,
            # 'node_id': None,
            'node_type': emission_data['category'],
            # 'emission_type': TOP_DOWN_EMISSION,
            # 'product_type': 'ghg',  ## understand what to be added here
            'product': product,
            'value': value,
            'date': fpd  ## NOTE: check with Xuyan to see if fpd always exists
        }]
    return ret


STREAM_UNITS = {
    'oil': {
        'orig': 'bbl',
        'target': 'mbbl'
    },
    'gas': {
        'orig': 'mcf',
        'target': 'mmcf'
    },
    'boe': {
        'orig': 'boe',
        'target': 'mboe'
    }
}


def _process_per_stream(well_id, well_data, emission_data, date_dict, escalation_params, stream: str):
    ret = []
    stream_unit = STREAM_UNITS[stream]
    unit_multiplier = get_multiplier(stream_unit['orig'], stream_unit['target'])
    for _product in EMISSION_PRODUCTS:
        multiplier = emission_data[_product] * unit_multiplier
        product = EMISSION_PRODUCT_MAP[_product]
        if not multiplier:
            continue
        else:
            values_after_escalation = apply_escalation(well_data[stream], escalation_params)

        ret += [
            {
                # 'well_id': well_id,
                # 'node_id': None,
                'node_type': emission_data['category'],
                # 'emission_type': TOP_DOWN_EMISSION,
                # 'product_type': 'ghg',  ## understand what to be added here
                'product': product,
                'value': values_after_escalation[i] * multiplier,
                'date': date
            } for i, date in enumerate(well_data['date'])
        ]
    return ret


process_emission = {
    'mt_per_mbbl': partial(_process_per_stream, stream='oil'),
    'mt_per_mmcf': partial(_process_per_stream, stream='gas'),
    'mt_per_mboe': partial(_process_per_stream, stream='boe'),
    'mt_per_well_per_year': process_per_well_per_year,
    'mt_per_new_well': process_per_new_well,
}

EMISSION_ECON_MODEL_ROWS = [{
    'entire_well_life': 'Flat'
}]  ## hard code for now, ghg emission, escalation is only applied to a flat thing


def one_well_emission(well_id, well_data, well_emission, date_dict, unecon_bool: bool):
    ret = []
    ## TODO: talk on the expected behavior of this
    if unecon_bool:
        return []

    for emission_data in well_emission['table']:
        if emission_data['selected']:
            calculation_method = emission_data['unit']
            escalation_model = get_escalation_model(emission_data)
            escalation_params = None
            if escalation_model:
                escalation_params = process_escalation_model(EMISSION_ECON_MODEL_ROWS, escalation_model,
                                                             date_dict['cf_start_date'], date_dict['cf_end_date'],
                                                             date_dict['first_production_date'])
            ret += process_emission[calculation_method](well_id, well_data, emission_data, date_dict, escalation_params)

    if len(ret) == 0:
        return []

    df = pd.DataFrame(ret)
    summed = df.groupby(['node_type', 'product', 'date']).sum('value').reset_index()
    summed['well_id'] = well_id
    summed['node_id'] = None
    summed['emission_type'] = TOP_DOWN_EMISSION
    summed['product_type'] = 'ghg'
    return summed.to_dict('record')
