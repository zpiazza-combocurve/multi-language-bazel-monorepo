import copy
import datetime
import pandas as pd

from api.aries_phdwin_imports.helpers import convert_dates_to_offset, date_obj
from api.aries_phdwin_imports.phdwin_helpers.general import (DOLLAR_PER_VOL_CONV_DICT, get_model_name,
                                                             get_phdwin_fpd_from_model_document,
                                                             set_phdwin_end_date_to_econ_limit)
from api.aries_phdwin_imports.combine_rows import copy_rows, combine_tax_rows
from combocurve.shared.aries_import_enums import CCSchemaEnum, EconEnum, PhaseEnum

LOCAL_TAX_MODEL = 'Local Tax Model (Ad Val Tax)'
STATE_TAX_MODEL = 'State Tax Model (Severance Tax)'


def convert_tax_dates_to_offset(document, lease_id_to_sop_dic, lease_to_well_id, tit_df):
    # get asof and fpd
    asof = pd.to_datetime(tit_df.at[0, 'Asof Date'], errors='coerce')
    fpd = get_phdwin_fpd_from_model_document(document, lease_id_to_sop_dic, lease_to_well_id)

    for type_tax_rows in [EconEnum.sev_tax.value, EconEnum.adval_tax.value]:
        if type_tax_rows == EconEnum.sev_tax.value:
            for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                sev_tax_rows = copy_rows(
                    document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value])
                rows = convert_dates_to_offset(sev_tax_rows, asof, fpd)
                document[EconEnum.econ_function.value][EconEnum.sev_tax.value][phase][EconEnum.rows.value] = rows

        else:
            adval_tax_rows = copy_rows(
                document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value])
            rows = convert_dates_to_offset(adval_tax_rows, asof, fpd)
            document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value] = rows

    return document


def process_tax_document_and_combine(document):
    for tax_type in [EconEnum.sev_tax.value, EconEnum.adval_tax.value]:
        if tax_type == EconEnum.sev_tax.value:
            for phase in [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value]:
                rows = document['econ_function']['severance_tax'][phase]['rows']
                rows = set_phdwin_end_date_to_econ_limit(rows)
        else:
            rows = document[EconEnum.econ_function.value][EconEnum.adval_tax.value][EconEnum.rows.value]
            rows = set_phdwin_end_date_to_econ_limit(rows)

    document = combine_tax_rows(document)

    return document


def process_phdwin_tax_document(default_document, model_name, document, get_default_format):
    filled = default_document is not None
    if not filled:
        default_document = get_default_format('tax')
        default_document['wells'].add(document['well'])

    type_name = document.get('type_name')
    phdwin_tax_doc_conv = {
        LOCAL_TAX_MODEL: process_phdwin_adval_tax_doc,
        STATE_TAX_MODEL: process_phdwin_severance_tax_doc
    }
    if type_name in [LOCAL_TAX_MODEL, STATE_TAX_MODEL]:
        phdwin_tax_doc_conv[type_name](default_document, document, filled)
    model_name = get_model_name(model_name, default_document, phd_model_name=document.get('modelname'))
    return default_document, model_name


def process_phdwin_severance_tax_doc(default_document, document, filled):

    if document[CCSchemaEnum.start_date.value] is None or document[CCSchemaEnum.end_date.value] is None:
        return default_document
    key_name = get_phdwin_tax_unit_key(document)
    product_name = str(document.get('productname')).lower()

    multiplier = DOLLAR_PER_VOL_CONV_DICT.get(key_name.split('dollar_per_')[-1])
    multiplier, key_name = (multiplier, 'dollar_per_bbl') if multiplier is not None else (1, key_name)

    obj = {"pct_of_revenue": document['ad_val_tax'], key_name: (document['value'] * multiplier)}

    # set start and end end for row obj
    obj.update(copy.deepcopy(date_obj))
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    # select phdwin-cc calculation options
    default_document = select_phdwin_tax_options(default_document, document)

    # get phase
    phase = product_name if product_name != 'condensate' else 'drip_condensate'

    # append tax obj to coument
    if phase in ['gas', 'oil', 'ngl', 'drip_condensate']:
        default_document['econ_function']['severance_tax'][phase]['rows'].append(obj)

    if not filled:
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

    return default_document


def process_phdwin_adval_tax_doc(default_document, document, filled):
    # get unit key
    key_name = get_phdwin_tax_unit_key(document, sev_tax=False)

    # create tax_obj
    obj = {"pct_of_revenue": document['ad_val_tax'], key_name: document['value']}

    # update tax_obj_with_date
    obj.update(copy.deepcopy(date_obj))
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)

    # select phdwin_tax_options
    default_document = select_phdwin_tax_options(default_document, document, sev_tax=False)

    # append the adval tax row obj
    default_document['econ_function']['ad_valorem_tax']['rows'].append(obj)

    if not filled:
        # update date
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

    return default_document


def get_phdwin_tax_unit_key(document, sev_tax=True):
    unit_str = str(document.get('unitstr')).lower()
    product_name = str(document.get('productname')).lower()

    if sev_tax:
        if document['affect_econ_limit3'] == 0:
            if unit_str not in ['unknown', 'none']:
                key_name = 'dollar_per_' + document['unitstr'].lower()
                if key_name not in [
                        'dollar_per_mcf', 'dollar_per_bbl', 'dollar_per_boe', 'dollar_per_month', 'dollar_per_mgal',
                        'dollar_per_gal'
                ]:
                    if product_name == 'gas':
                        key_name = 'dollar_per_mcf'
                    else:
                        key_name = 'dollar_per_bbl'
            else:
                if product_name == 'gas':
                    key_name = 'dollar_per_mcf'
                else:
                    key_name = 'dollar_per_bbl'
        else:
            key_name = 'dollar_per_month'
    else:
        if document['affect_econ_limit3'] == 1:
            key_name = 'dollar_per_month'
        elif document['affect_econ_limit3'] == 0:
            key_name = 'dollar_per_boe'
        else:
            key_name = 'dollar_per_month'

    return key_name


def select_phdwin_tax_options(default_document, document, sev_tax=True):
    # set severance tax to calculation to use WI
    if document['calcu_using_wi'] == 1:
        tax_type = 'severance_tax' if sev_tax else 'ad_valorem_tax'
        default_document['econ_function'][tax_type]['calculation'] = 'wi'

    # deduct_severance_tax for ad_valorem_tax
    # need to be filled when type_name is State Tax Model (Severance Tax)
    if document['deduct_sev_tax'] == 1:
        default_document['econ_function']['ad_valorem_tax']['deduct_severance_tax'] = 'yes'

    return default_document


PHDWIN_TAX_TYPE = ['State Tax Model (Severance Tax)', 'Local Tax Model (Ad Val Tax)']
