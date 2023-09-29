import copy
import numpy as np

from api.cc_to_cc.helper import (first_available_value, selection_validation, number_validation, str_to_display,
                                 row_view_process, multi_line_to_rows, get_phase_name, equals_to_default,
                                 RATE_TYPE_OPTIONS, ROWS_CALCULATION_METHOD_OPTIONS, esca_depre_validation,
                                 standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName, PROD_TAX_KEY

from combocurve.science.econ.default_econ_assumptions import get_default

from combocurve.shared.econ_tools.econ_to_options import production_taxes_state_options
from combocurve.shared.econ_tools.econ_model_tools import (
    RATE_BASED_ROW_KEYS,
    CRITERIA_MAP_DICT,
    UnitKeyEnum,
    UNIT_MAP,
    PhaseEnum,
)

SEV_KEY = 'severance_tax'
AD_VAL_KEY = 'ad_valorem_tax'

PROD_TAXES_PHASES = ['oil', 'gas', 'ngl', 'drip cond']
PROD_TAXES_KEYS = ['severance', 'ad valorem']
PROD_TAXES_SEVERANCE_KEY = 'severance'
PROD_TAXES_AD_VALOREM_KEY = 'ad valorem'

CALCULATION_OPTIONS = [
    'nri', 'wi', "lease_nri", "one_minus_wi", "one_minus_nri", "one_minus_lease_nri", "wi_minus_one", "nri_minus_one",
    "lease_nri_minus_one", "100_pct_wi"
]
SHRINKAGE_OPTIONS = ["shrunk", "unshrunk"]

START_DATE_OPTIONS = ["fpd", "spud date from headers", "spud date from schedule"]

PRODUCTION_TAXES_STATE_OPTIONS = list(production_taxes_state_options.keys())

PROD_TAX_UNIT_KEYS = [
    UnitKeyEnum.DOLLAR_PER_MONTH.value,
    UnitKeyEnum.DOLLAR_PER_BBL.value,
    UnitKeyEnum.PCT_OF_REVENUE.value,
    UnitKeyEnum.DOLLAR_PER_MMBTU.value,
    UnitKeyEnum.DOLLAR_PER_MCF.value,
    UnitKeyEnum.DOLLAR_PER_BOE.value,
]

PROD_TAX_UNIT_MAP = {key: UNIT_MAP[key] for key in PROD_TAX_UNIT_KEYS}

CALCULATION_MAPPER = {
    "wi": "wi",
    "nri": "nri",
    "lease_nri": "lease_nri",
    "one_minus_wi": "1-wi",
    "one_minus_nri": "1-nri",
    "one_minus_lease_nri": "1-lease_nri",
    "wi_minus_one": "wi-1",
    "nri_minus_one": "nri-1",
    "lease_nri_minus_one": "lease_nri-1",
    "100_pct_wi": "100% wi"
}


def check_row_unit_value(rows):
    # this handles edge case when 2 criteria is same in prod tax, and merge to 1 critera
    for row in rows:
        if ColumnName.unit.value in row:
            row[ColumnName.unit1.value] = row[ColumnName.unit.value]
            del row[ColumnName.unit.value]

        if ColumnName.value.value in row:
            row[ColumnName.value1.value] = row[ColumnName.value.value]
            del row[ColumnName.value.value]


def production_taxes(model, esca_id_to_name, include_default):
    default_prod_tax = get_default(PROD_TAX_KEY)
    rows = []

    econ_function = model['econ_function']
    sev_tax = econ_function[SEV_KEY]
    ad_val_tax = econ_function[AD_VAL_KEY]

    last_update_str = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    common_row = get_assumption_empty_row(PROD_TAX_KEY)

    common_row[ColumnName.updatedAt.value] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)
    common_row[ColumnName.production_taxes_state.value] = sev_tax.get("state")

    rate_type = sev_tax.get(ColumnName.rate_type.name, RATE_TYPE_OPTIONS[0]).replace('_', ' ')
    rows_calculation_method = sev_tax.get(ColumnName.rows_calculation_method.name,
                                          ROWS_CALCULATION_METHOD_OPTIONS[0]).replace('_', ' ')

    # sev
    sev_cal = CALCULATION_MAPPER.get(sev_tax[ColumnName.calculation.name])
    sev_shrinkage_condition = sev_tax.get(ColumnName.shrinkage_condition.name)
    for phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        phase_sev_tax = sev_tax[phase]

        if (not include_default) and equals_to_default({"rows": phase_sev_tax['rows']},
                                                       {"rows": default_prod_tax[SEV_KEY][phase]['rows']}):
            continue

        sev_tax_row = copy.deepcopy(common_row)
        sev_tax_row[ColumnName.key.value] = 'severance'
        sev_tax_row[ColumnName.phase.value] = get_phase_name(phase)
        sev_tax_row[ColumnName.calculation.value] = sev_cal
        sev_tax_row[ColumnName.shrinkage_condition.value] = sev_shrinkage_condition

        for esc_model in [ColumnName.escalation_model_1.name, ColumnName.escalation_model_2.name]:
            try:
                escalation_id = model['options'][SEV_KEY][phase]['subItems'][
                    ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['value']
            except KeyError:
                escalation_id = None
            sev_tax_row[ColumnName[esc_model].value] = esca_id_to_name.get(escalation_id, "None")

        row_keys = list(phase_sev_tax['rows'][0].keys())
        if set(row_keys) & set(RATE_BASED_ROW_KEYS):
            sev_tax_row[ColumnName.rate_type.value] = rate_type
            sev_tax_row[ColumnName.rows_calculation_method.value] = rows_calculation_method

        sev_tax_rows = row_view_process(sev_tax_row, phase_sev_tax)
        check_row_unit_value(sev_tax_rows)

        rows += sev_tax_rows

    # ad
    if sev_tax.get("state") is not None and ('pennsylvania vertical' in sev_tax.get("state").lower()
                                             or 'pennsylvania horizontal' in sev_tax.get("state").lower()):
        default_ad_val = copy.deepcopy(default_prod_tax[AD_VAL_KEY])
        for key in [ColumnName.escalation_model.name, ColumnName.start_date.name]:
            if key not in ad_val_tax:
                default_ad_val.pop(key)
        is_ad_val_default = equals_to_default(ad_val_tax, default_ad_val)
    else:
        is_ad_val_default = equals_to_default({"rows": ad_val_tax["rows"]},
                                              {"rows": default_prod_tax[AD_VAL_KEY]["rows"]})

    if include_default or not is_ad_val_default:
        ad_val_row = copy.deepcopy(common_row)
        ad_val_row[ColumnName.key.value] = 'ad valorem'
        ad_val_row[ColumnName.calculation.value] = CALCULATION_MAPPER.get(ad_val_tax[ColumnName.calculation.name])
        ad_val_row[ColumnName.deduct_severance_tax.value] = ad_val_tax[ColumnName.deduct_severance_tax.name]
        ad_val_row[ColumnName.shrinkage_condition.value] = ad_val_tax.get(ColumnName.shrinkage_condition.name)
        ad_val_row[ColumnName.start_date.value] = ad_val_tax.get(ColumnName.start_date.name)
        for esc_model in [ColumnName.escalation_model_1.name, ColumnName.escalation_model_2.name]:
            try:
                escalation_id = model['options'][AD_VAL_KEY][
                    ColumnName.escalation_model.name]['subItems']['row_view']['headers'][esc_model]['value']
            except KeyError:
                escalation_id = None
            ad_val_row[ColumnName[esc_model].value] = esca_id_to_name.get(escalation_id, "None")

        row_keys = list(ad_val_tax['rows'][0].keys())
        if set(row_keys) & set(RATE_BASED_ROW_KEYS):
            ad_val_row[ColumnName.rate_type.value] = ad_val_tax.get(ColumnName.rate_type.name,
                                                                    RATE_TYPE_OPTIONS[0]).replace('_', ' ')
            ad_val_row[ColumnName.rows_calculation_method.value] = ad_val_tax.get(
                ColumnName.rows_calculation_method.name, ROWS_CALCULATION_METHOD_OPTIONS[0]).replace('_', ' ')

        ad_val_rows = row_view_process(ad_val_row, ad_val_tax)
        check_row_unit_value(ad_val_rows)

        rows += ad_val_rows

    return rows


def get_econ_unit(unit, key, row_index, error_list):
    unit_map_dict_rev = {PROD_TAX_UNIT_MAP[k]: k for k in PROD_TAX_UNIT_MAP}

    oil_unit_check = key == PhaseEnum.oil.value and unit not in [
        PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MONTH.value],
        PROD_TAX_UNIT_MAP[UnitKeyEnum.PCT_OF_REVENUE.value]
    ]
    gas_unit_check = key == PhaseEnum.gas.value and unit not in [
        PROD_TAX_UNIT_MAP[UnitKeyEnum.PCT_OF_REVENUE.value], PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MCF.value],
        PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MONTH.value]
    ]
    ngl_unit_check = key == PhaseEnum.ngl.value and unit not in [
        PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MONTH.value],
        PROD_TAX_UNIT_MAP[UnitKeyEnum.PCT_OF_REVENUE.value]
    ]
    drip_cond_unit_check = key == PhaseEnum.drip_condensate.value and unit not in [
        PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BBL.value], PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MONTH.value],
        PROD_TAX_UNIT_MAP[UnitKeyEnum.PCT_OF_REVENUE.value]
    ]
    ad_valorem_unit_check = key == AD_VAL_KEY and unit not in [
        PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_BOE.value], PROD_TAX_UNIT_MAP[UnitKeyEnum.DOLLAR_PER_MONTH.value],
        PROD_TAX_UNIT_MAP[UnitKeyEnum.PCT_OF_REVENUE.value]
    ]

    if (unit not in unit_map_dict_rev.keys() or oil_unit_check or gas_unit_check or ngl_unit_check
            or drip_cond_unit_check or ad_valorem_unit_check):
        error_list.append({'error_message': f'Unit of {str_to_display(key)} is Invalid!', 'row_index': row_index})
        return None, error_list

    return unit_map_dict_rev[unit], error_list


def one_production_tax_import(error_list, header, production_taxes_list, key, row_index, esca_name_dict):
    prod_tax_row_dict = dict(zip(header, production_taxes_list[0]))
    first_row_index = row_index[0]
    ret_dict = {}

    if key == PROD_TAXES_AD_VALOREM_KEY:
        calculation = prod_tax_row_dict[ColumnName.calculation.value]
        calculation = list(filter(lambda x: CALCULATION_MAPPER.get(x) == calculation, CALCULATION_MAPPER.keys()))[0]
        ret_dict[ColumnName.calculation.name] = selection_validation(
            error_list=error_list,
            input_dict={ColumnName.calculation.value: calculation},
            input_key=ColumnName.calculation.value,
            options=CALCULATION_OPTIONS,
            row_index=first_row_index,
        )

        shrinkage_condition = prod_tax_row_dict[ColumnName.shrinkage_condition.value]
        ret_dict[ColumnName.shrinkage_condition.name] = selection_validation(
            error_list=error_list,
            input_dict={ColumnName.shrinkage_condition.value: shrinkage_condition},
            input_key=ColumnName.shrinkage_condition.value,
            options=SHRINKAGE_OPTIONS,
            default_option="shrunk",
            row_index=first_row_index,
        )

        ret_dict['deduct_severance_tax'] = selection_validation(
            error_list=error_list,
            input_dict=prod_tax_row_dict,
            input_key='Deduct Severance Tax',
            options=['yes', 'no'],
            row_index=first_row_index,
        )

        if prod_tax_row_dict[ColumnName.start_date.value] is not None:
            ret_dict[ColumnName.start_date.name] = selection_validation(error_list=error_list,
                                                                        input_dict=prod_tax_row_dict,
                                                                        input_key=ColumnName.start_date.value,
                                                                        options=START_DATE_OPTIONS,
                                                                        row_index=first_row_index)

    criteria = selection_validation(
        error_list=error_list,
        input_dict=prod_tax_row_dict,
        input_key='Criteria',
        options=list(CRITERIA_MAP_DICT.values()),
        row_index=first_row_index,
    )

    criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}
    if criteria:
        econ_criteria = criteria_map_dict_rev[criteria]
    else:
        econ_criteria = None

    unit_1 = selection_validation(
        error_list=error_list,
        input_dict=prod_tax_row_dict,
        input_key='Unit 1',
        options=list(PROD_TAX_UNIT_MAP.values()),
        row_index=first_row_index,
    )

    econ_unit_1, error_list = get_econ_unit(unit_1, key, first_row_index, error_list)

    unit_2 = selection_validation(
        error_list=error_list,
        input_dict=prod_tax_row_dict,
        input_key='Unit 2',
        options=list(PROD_TAX_UNIT_MAP.values()),
        row_index=first_row_index,
        default_option=unit_1,
    )

    econ_unit_2, error_list = get_econ_unit(unit_2, key, first_row_index, error_list)

    if criteria == 'flat':
        rows = [{
            econ_criteria:
            'Flat',
            econ_unit_1:
            number_validation(
                error_list=error_list,
                input_dict=prod_tax_row_dict,
                input_key='Value 1',
                required=True,
                row_index=first_row_index,
            )
        }]
        if unit_2 != unit_1:
            rows[0][econ_unit_2] = number_validation(
                error_list=error_list,
                input_dict=prod_tax_row_dict,
                input_key='Value 2',
                required=False,
                row_index=first_row_index,
            )

        if len(production_taxes_list) > 1:
            for i in range(1, len(production_taxes_list)):
                error_list.append({'error_message': 'Duplicated row of Flat Period', 'row_index': row_index[i]})
    else:
        prod_taxes_dict_list = [dict(zip(header, p)) for p in production_taxes_list]
        rows = multi_line_to_rows(error_list, prod_taxes_dict_list, econ_criteria, econ_unit_1, row_index, econ_unit_2)

    ret_dict['rows'] = rows

    # adding escalation
    escalation_model_1 = esca_depre_validation(
        error_list=error_list,
        input_dict=prod_tax_row_dict,
        input_key=ColumnName.escalation_model_1.value,
        name_dict=esca_name_dict,
        row_index=first_row_index,
    )
    escalation_model_2 = esca_depre_validation(
        error_list=error_list,
        input_dict=prod_tax_row_dict,
        input_key=ColumnName.escalation_model_2.value,
        name_dict=esca_name_dict,
        row_index=first_row_index,
    )
    ret_dict[ColumnName.escalation_model.name] = {
        ColumnName.escalation_model_1.name: escalation_model_1,
        ColumnName.escalation_model_2.name: escalation_model_2,
    }

    return ret_dict


def production_taxes_import(well_array, header, esca_name_dict):
    production_taxes = get_default('production_taxes')
    error_list = []

    key_col_idx = header.index('Key')
    phase_col_idx = header.index('Phase')

    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, key_col_idx]])
    well_phase_list = np.array([x.strip() if x is not None else x for x in well_array[:, phase_col_idx]])

    for i in range(len(well_key_list)):
        this_key = well_key_list[i]
        this_phase = well_phase_list[i]

        if this_key == PROD_TAXES_SEVERANCE_KEY:
            if this_phase not in PROD_TAXES_PHASES:
                error_list.append({'error_message': 'Wrong value of Phase for corresponding Key', 'row_index': i})
        elif this_key != 'ad valorem':
            error_list.append({'error_message': 'Wrong value of Key', 'row_index': i})

    # sev
    severance_list = well_array[well_key_list == PROD_TAXES_SEVERANCE_KEY]
    severance_phases_list = severance_list[:, phase_col_idx]

    calculation_col_idx = header.index(ColumnName.calculation.value)
    shrinkage_col_idx = header.index(ColumnName.shrinkage_condition.value)
    production_taxes_state_col_idx = header.index(ColumnName.production_taxes_state.value)
    rate_type_col_idx = header.index(ColumnName.rate_type.value)
    rows_calculation_method_col_idx = header.index(ColumnName.rows_calculation_method.value)

    index = np.where((well_key_list == PROD_TAXES_SEVERANCE_KEY) | (well_key_list == PROD_TAXES_AD_VALOREM_KEY))[0][0]

    if len(severance_list):
        production_taxes_state = first_available_value(severance_list[:, production_taxes_state_col_idx])
        production_taxes_state = "custom" if production_taxes_state is None else production_taxes_state
        production_taxes[SEV_KEY]["state"] = selection_validation(
            error_list=error_list,
            input_dict={ColumnName.production_taxes_state.value: production_taxes_state},
            input_key=ColumnName.production_taxes_state.value,
            options=PRODUCTION_TAXES_STATE_OPTIONS,
            row_index=index,
        )

        calculation = first_available_value(severance_list[:, calculation_col_idx])
        calculation = list(filter(lambda x: CALCULATION_MAPPER.get(x) == calculation, CALCULATION_MAPPER.keys()))[0]
        production_taxes[SEV_KEY][ColumnName.calculation.name] = selection_validation(
            error_list=error_list,
            input_dict={ColumnName.calculation.value: calculation},
            input_key=ColumnName.calculation.value,
            options=CALCULATION_OPTIONS,
            row_index=index,
        )
        shrinkage_condition = first_available_value(severance_list[:, shrinkage_col_idx])
        production_taxes[SEV_KEY][ColumnName.shrinkage_condition.name] = selection_validation(
            error_list=error_list,
            input_dict={ColumnName.shrinkage_condition.value: shrinkage_condition},
            input_key=ColumnName.shrinkage_condition.value,
            options=SHRINKAGE_OPTIONS,
            default_option="shrunk",
            row_index=index,
        )

        rate_type = first_available_value(severance_list[:, rate_type_col_idx])
        production_taxes[SEV_KEY][ColumnName.rate_type.name] = selection_validation(
            error_list=error_list,
            input_dict={
                ColumnName.rate_type.value: rate_type
            },
            input_key=ColumnName.rate_type.value,
            options=RATE_TYPE_OPTIONS,
            default_option=RATE_TYPE_OPTIONS[0],
            row_index=index,
        ).replace(' ', '_')

        rows_calculation_method = first_available_value(severance_list[:, rows_calculation_method_col_idx])
        production_taxes[SEV_KEY][ColumnName.rows_calculation_method.name] = selection_validation(
            error_list=error_list,
            input_dict={
                ColumnName.rows_calculation_method.value: rows_calculation_method
            },
            input_key=ColumnName.rows_calculation_method.value,
            options=ROWS_CALCULATION_METHOD_OPTIONS,
            default_option=ROWS_CALCULATION_METHOD_OPTIONS[0],
            row_index=index,
        ).replace(' ', '_')
    else:
        if PROD_TAXES_AD_VALOREM_KEY in well_key_list:
            ad_valorem_list = well_array[well_key_list == PROD_TAXES_AD_VALOREM_KEY]
            production_taxes_state = first_available_value(ad_valorem_list[:, production_taxes_state_col_idx])
            production_taxes_state = "custom" if production_taxes_state is None else production_taxes_state
            production_taxes[SEV_KEY]["state"] = selection_validation(
                error_list=error_list,
                input_dict={ColumnName.production_taxes_state.value: production_taxes_state},
                input_key=ColumnName.production_taxes_state.value,
                options=PRODUCTION_TAXES_STATE_OPTIONS,
                row_index=index,
            )

    for phase in PROD_TAXES_PHASES:
        phase_model = phase if phase != 'drip cond' else 'drip_condensate'
        if phase not in severance_phases_list:
            continue
        else:
            phase_severance_list = severance_list[severance_phases_list == phase]
            row_index = np.where((well_key_list == PROD_TAXES_SEVERANCE_KEY) & (well_phase_list == phase))[0]
            production_taxes[SEV_KEY][phase_model] = one_production_tax_import(error_list, header, phase_severance_list,
                                                                               PROD_TAXES_SEVERANCE_KEY, row_index,
                                                                               esca_name_dict)
    # ad valorem
    if PROD_TAXES_AD_VALOREM_KEY in well_key_list:
        ad_valorem_list = well_array[well_key_list == PROD_TAXES_AD_VALOREM_KEY]

        rate_type = first_available_value(ad_valorem_list[:, rate_type_col_idx])
        production_taxes[AD_VAL_KEY][ColumnName.rate_type.name] = selection_validation(
            error_list=error_list,
            input_dict={
                ColumnName.rate_type.value: rate_type
            },
            input_key=ColumnName.rate_type.value,
            options=RATE_TYPE_OPTIONS,
            default_option=RATE_TYPE_OPTIONS[0],
            row_index=index,
        ).replace(' ', '_')

        rows_calculation_method = first_available_value(ad_valorem_list[:, rows_calculation_method_col_idx])
        production_taxes[AD_VAL_KEY][ColumnName.rows_calculation_method.name] = selection_validation(
            error_list=error_list,
            input_dict={
                ColumnName.rows_calculation_method.value: rows_calculation_method
            },
            input_key=ColumnName.rows_calculation_method.value,
            options=ROWS_CALCULATION_METHOD_OPTIONS,
            default_option=ROWS_CALCULATION_METHOD_OPTIONS[0],
            row_index=index,
        ).replace(' ', '_')

        row_index = np.where(well_key_list == PROD_TAXES_AD_VALOREM_KEY)[0]
        production_taxes[AD_VAL_KEY].update(
            one_production_tax_import(error_list, header, ad_valorem_list, PROD_TAXES_AD_VALOREM_KEY, row_index,
                                      esca_name_dict))

    return production_taxes, error_list
