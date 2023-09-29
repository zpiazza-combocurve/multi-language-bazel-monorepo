import copy
import datetime
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults


def process_phdwin_capex_document(default_document, document, get_default_format, lse_id_to_case_multiplier):
    filled = default_document is not None

    if not filled:
        default_document = get_default_format('capex')
    obj = copy.deepcopy(CAPEX_OBJ)
    obj['description'] = document['descr']

    set_capex_obj_category(obj)

    try:
        obj['date'] = document['offset_date'].strftime("%Y-%m-%d")
    except Exception:
        if document['strdate'] == 'Ecl':
            obj['offset_to_econ_limit'] = obj.pop('date')
            obj['offset_to_econ_limit'] = int(document['linkoffset'])
        elif document['strdate'] == 'AsOf':
            obj['offset_to_as_of_date'] = obj.pop('date')
            obj['offset_to_as_of_date'] = int(document['linkoffset'])
        elif document['strdate'] == 'FirstProd':
            obj['offset_to_fpd'] = obj.pop('date')
            obj['offset_to_fpd'] = int(document['linkoffset'])

    obj['tangible'] = document['tang_amnt']
    obj['intangible'] = document['intang_amnt']
    obj['calculation'] = document['net_gross'].lower()

    try:
        multiplier = float(document['riskfactor'])
    except ValueError:
        multiplier = 1

    if lse_id_to_case_multiplier is not None:
        if multiplier != 0:
            multiplier = multiplier * lse_id_to_case_multiplier.get(str(document['lse_id']), 1)
        else:
            multiplier = lse_id_to_case_multiplier.get(str(document['lse_id']), 1)

    if multiplier != 0:
        obj['deal_terms'] = multiplier

    if not filled:
        default_document['wells'].add((document['well'], document['grp_id']))
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()
    default_document['econ_function']['other_capex']['rows'].append(obj)

    return default_document


def set_capex_obj_category(obj):
    description = str(obj['description']).lower()
    if 'aban' in description:
        obj['category'] = 'abandonment'
    elif 'salv' in description:
        obj['category'] = 'salvage'
    elif 'drill' in description:
        obj['category'] = 'drilling'


CAPEX_OBJ = {
    "category": "other_investment",
    "description": "",
    "date": "2019-02-11",
    "tangible": 0,
    "intangible": 5,
    "capex_expense": "capex",
    "after_econ_limit": "yes",
    "calculation": "gross",
    "escalation_model": "none",
    'escalation_start': copy.deepcopy(EconModelDefaults.escalation_start),
    "depreciation_model": "none",
    "deal_terms": 1
}
