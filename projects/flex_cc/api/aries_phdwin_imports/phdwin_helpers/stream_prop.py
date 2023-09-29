import copy
import datetime
import math

from api.aries_phdwin_imports.combine_rows import aries_cc_round, combine_ngl_yield_rows
from api.aries_phdwin_imports.phdwin_helpers.general import get_model_name
from api.aries_phdwin_imports.helpers import date_obj
from api.aries_phdwin_imports.helpers import remove_default_item_and_set_date_econ_limit
from combocurve.shared.aries_import_enums import CCSchemaEnum


def process_phdwin_stream_properties_document(default_document, stream_prop_name, document, get_default_format):
    filled = default_document is not None
    shrinkage_data_obj = {"pct_remaining": 0}

    shrinkage_data_obj['pct_remaining'] = 100 - document['value']
    shrinkage_data_obj = update_shrinkage_date_obj(shrinkage_data_obj, document)
    if not filled:
        default_document = get_default_format('stream_properties')
        default_document['wells'].add(document['well'])
    btu_value = get_btu_value(document)
    default_document['econ_function']['btu_content']['shrunk_gas'] = btu_value
    # default_document['econ_function']['btu_content']['unshrunk_gas'] = btu_value
    phase = str(document.get('productname')).lower().strip()
    if phase in ['oil', 'gas']:
        default_document['econ_function']['shrinkage'][phase]['rows'].append(shrinkage_data_obj)
    stream_prop_name = get_model_name(stream_prop_name, default_document, phd_model_name=document.get('modelname'))
    if not filled:
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

    return default_document, stream_prop_name


def set_flat_stream_property(document):
    for phase in ['oil', 'gas']:
        rows = document['econ_function']['shrinkage'][phase]['rows']

        if len(rows) == 1 and rows[0]['pct_remaining'] != 100:
            check = rows[0].pop('dates', None)
            if check is not None:
                rows[0]['entire_well_life'] = "Entire Well Life"
    return document


def process_stream_properties_document_format(document, yield_=False):
    remove_default_item_and_set_date_econ_limit(document, yield_=yield_)
    document = set_flat_stream_property(document)
    document = combine_ngl_yield_rows(document)
    return document


def process_phdwin_risk_document(document, get_default_format, lse_id_to_case_multiplier):
    default_document = None
    multiplier = document.get('multiplier')
    case_mult = document.get('case_mult')

    # Combine multipliers if both exist, else override to case mutliplier
    if case_mult is not None:
        if multiplier is not None:
            multiplier = case_mult * multiplier
        else:
            multiplier = case_mult
        lse_id_to_case_multiplier[str(document['lse_id'])] = case_mult

    if multiplier is not None:
        default_document = get_default_format('risking')
        default_document['wells'].add(document['well'])
        for phase in ['oil', 'gas', 'water', 'ngl', 'drip_condensate']:
            default_document['econ_function']['risking_model'][phase]['rows'][0]['multiplier'] = aries_cc_round(
                multiplier * 100)
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()
    return default_document


def update_shrinkage_date_obj(obj, document):
    obj.update(copy.deepcopy(date_obj))
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)

    return obj


def get_btu_value(document):
    try:
        btu_value = float(document.get('btu'))
    except (ValueError, TypeError):
        btu_value = 0

    if math.isnan(btu_value) or btu_value == 0:
        btu_value = 1000

    return btu_value


def process_ngl_yield_units(row, obj, formula=False, document=None):

    if not formula:
        # numerator = row.get('unitsn')
        # denominator = row.get('unitsd')
        qi = row.get('qi')
        qend = row.get('qend')

        q = (qi + qend) / 2

        if qi is not None:
            yield_value = round(1000 * q, 4)
            obj['yield'] = yield_value
    else:
        ratio_value = row.get('ratio_value')
        if ratio_value is not None:
            document['econ_function']['yields']['ngl']['rows'] = [{
                "yield": ratio_value * 1000,
                "entire_well_life": "Entire Well Life",
                "unshrunk_gas": "Unshrunk Gas"
            }]
            return document, True
        else:
            return document, False

    return obj
