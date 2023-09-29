import datetime
import pandas as pd
from combocurve.shared.aries_import_enums import PriceEnum, PhaseEnum, EconEnum
from api.aries_phdwin_imports.combine_rows import sum_rows, copy_rows
from api.aries_phdwin_imports.helpers import convert_dates_to_offset
from api.aries_phdwin_imports.phdwin_helpers.general import (get_date_obj, get_model_name,
                                                             get_phdwin_fpd_from_model_document,
                                                             set_phdwin_end_date_to_econ_limit)


def process_phdwin_pricing_diff_document(document,
                                         default_document,
                                         model_name,
                                         get_default_format,
                                         differential_document=None):
    try:
        # get price and differential row obj
        if default_document is None:
            default_document = get_default_format('pricing')
        price_obj = get_date_obj(document)
        differential_obj = get_date_obj(document)

        # clean phdwin document for differentials, change None to Zero
        document = clean_phdwin_price_document(document)

        # set name of phdwin model and well to document
        default_document['name'] = document['modelname']
        if differential_document is None:
            default_document['wells'].add(document['well'])

        # get differential document and add well to document
        if differential_document is None:
            differential_document = get_default_format('differentials')
            differential_document['wells'].add(document['well'])

        # base on unitstr, differential_percentage, differential_dollar, need to logically change default unit
        unit_key = get_price_unit_key(document)

        # update price obj based on certain criteria
        price_obj, unit_key, gas_unit_key = update_price_obj_with_document(price_obj, unit_key, document)

        # update differential and price obj and add differential document
        default_document, differential_document = update_price_differential_obj_with_document(
            document, default_document, differential_document, unit_key, gas_unit_key, price_obj, differential_obj)

        model_name = get_model_name(model_name, default_document, phd_model_name=document.get('modelname'))
        # set created and updated at
        if differential_document is None:
            default_document['createdAt'] = datetime.datetime.now()
            default_document['updatedAt'] = datetime.datetime.now()
            differential_document['createdAt'] = datetime.datetime.now()
            differential_document['updatedAt'] = datetime.datetime.now()
    except Exception:
        pass

    return default_document, differential_document, model_name


def clean_phdwin_price_document(document):
    try:
        document[PriceEnum.diff_percent.value] = float(document[PriceEnum.diff_percent.value])
    except (ValueError, TypeError):
        document[PriceEnum.diff_percent.value] = 0
    try:
        document[PriceEnum.diff_dollar.value] = float(document[PriceEnum.diff_dollar.value])
    except (ValueError, TypeError):
        document[PriceEnum.diff_dollar.value] = 0

    return document


def get_price_unit_key(document):
    product_name = str(document.get('productname')).strip().lower()
    unit_str = str(document.get('unitstr')).strip().lower()
    if unit_str in ['unknown', 'none']:
        unit_key = 'dollar_per_' + unit_str
    else:
        if product_name == 'gas':
            unit_key = 'dollar_per_mmbtu'
        else:
            if unit_str in ['gal', 'mgal']:
                document['value'] = document.get('value') / 42
                if unit_str.startswith('m'):
                    document['value'] = document.get('value') / 1000
            unit_key = 'dollar_per_bbl'

    if unit_key not in ['dollar_per_bbl', 'dollar_per_mcf', 'dollar_per_mmbtu', 'dollar_per_gal', 'dollar_per_mgal']:
        if product_name == 'gas':
            unit_key = 'dollar_per_mmbtu'
        else:
            unit_key = 'dollar_per_bbl'
        unit_key = 'dollar_per_bbl'
    return unit_key


def update_price_obj_with_document(price_obj, unit_key, document):
    gas_unit_key = None
    model_name = document.get('modelname')
    if model_name is None:
        calculate_using_wi = document.get('calcu_using_wi')  # Boolparam[0]:
        if calculate_using_wi == 1:
            gas_unit_key = 'dollar_per_mmbtu'
        elif calculate_using_wi == 0:
            gas_unit_key = 'dollar_per_mcf'
    else:
        gas_unit_key = unit_key

    product_name = document.get('productname')
    if product_name != 'GAS':
        price_obj[unit_key] = document['value']
    else:
        price_obj[gas_unit_key] = document['value']

    price_obj['dates']['start_date'] = document['start_date'].strftime("%Y-%m-%d")
    price_obj['dates']['end_date'] = document['end_date'].strftime("%Y-%m-%d")

    return price_obj, unit_key, gas_unit_key


def update_price_differential_obj_with_document(document, price_document, differential_document, unit_key, gas_unit_key,
                                                price_obj, differential_obj):
    try:
        product_name = str(document.get('productname')).lower()
        if product_name == 'gas':
            use_key = gas_unit_key
        else:
            use_key = unit_key
        phase = product_name if product_name != 'condensate' else 'drip_condensate'

        # NO Percentage differential (ignore percentage differentials)
        if document['differential_percentage'] != 0 and document['differential_dollar'] != 0:
            differential_obj[use_key] = (document['differential_percentage'] / 100.
                                         * document['value']) + document['differential_dollar']
        elif document['differential_percentage'] == 0:
            differential_obj[use_key] = document['differential_dollar']

        else:
            differential_obj['pct_of_base_price'] = 100 + document['differential_percentage']

        differential_obj['dates']['start_date'] = document['start_date'].strftime("%Y-%m-%d")
        differential_obj['dates']['end_date'] = document['end_date'].strftime("%Y-%m-%d")

        # maping cap
        if document['cap'] != 0:
            price_document['econ_function']['price_model'][phase]['cap'] = document['cap']

        if product_name == 'oil':
            price_obj['price'] = price_obj[unit_key]
            del price_obj[unit_key]

        price_document['econ_function']['price_model'][phase]['rows'].append(price_obj)
        differential_document['econ_function']['differentials']['differentials_1'][phase]['rows'].append(
            differential_obj)
    except Exception:
        pass

    return price_document, differential_document


def process_price_document_and_combine(document):
    """
    Convert all end dates = '04/2262' to Econ Limit and combine the rows
    """
    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        rows = document['econ_function']['price_model'][phase]['rows']
        rows = set_phdwin_end_date_to_econ_limit(rows)

    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        price_rows = copy_rows(
            document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][EconEnum.rows.value])
        new_combined_rows = None
        if len(price_rows) > 1:
            new_combined_rows = sum_rows(price_rows)

        if new_combined_rows is not None:
            document[EconEnum.econ_function.value][PriceEnum.price_model.value][phase][
                EconEnum.rows.value] = new_combined_rows

    return document


def convert_price_dates_to_offset(document, lease_id_to_sop_dic, lease_to_well_id, tit_df):
    # get asof and fpd
    asof = pd.to_datetime(tit_df.at[0, 'Asof Date'], errors='coerce')
    fpd = get_phdwin_fpd_from_model_document(document, lease_id_to_sop_dic, lease_to_well_id)

    for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
        # get rows
        rows = copy_rows(document['econ_function']['price_model'][phase]['rows'])
        rows = convert_dates_to_offset(rows, asof, fpd)

        document['econ_function']['price_model'][phase]['rows'] = rows

    return document
