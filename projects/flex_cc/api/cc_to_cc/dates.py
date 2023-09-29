import copy
import pandas as pd

from api.cc_to_cc.helper import (number_validation, selection_validation, date_validation, is_date, inpt_id_selection,
                                 inpt_id_validation, standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName

from combocurve.shared.helpers import clean_up_str
from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults
from combocurve.shared.econ_tools.econ_model_display_templates import FPD_SCOURCE_CRITERIA

DATES_SETTING = 'dates_setting'
CUT_OFF = 'cut_off'

MAX_CUM_CF = 'max_cum_cash_flow'
FIRST_NEG_CF = 'first_negative_cash_flow'
LAST_POS_CF = 'last_positive_cash_flow'
NO_CUT_OFF = 'no_cut_off'
OIL_RATE = 'oil_rate'
GAS_RATE = 'gas_rate'
WATER_RATE = 'water_rate'
DATE = 'date'
YEARS_FROM_AS_OF = 'years_from_as_of'
LINK_TO_WELLS_ECL = 'link_to_wells_ecl'

CUT_OFF_KEY_MAP = {
    MAX_CUM_CF: 'max cum',
    FIRST_NEG_CF: 'first negative',
    LAST_POS_CF: 'last positive',
    NO_CUT_OFF: 'no cut off',
    OIL_RATE: 'oil rate',
    GAS_RATE: 'gas rate',
    WATER_RATE: 'water rate',
    DATE: DATE,
    YEARS_FROM_AS_OF: 'years from as of',
    LINK_TO_WELLS_ECL: "Link to Well's ECL",
}

MIN_CUT_OFF = 'min_cut_off'
NONE = 'none'
AS_OF = 'as_of'
END_HIST = 'end_hist'
MIN_CUT_OFF_KEY_MAP = {NONE: NONE, DATE: DATE, AS_OF: 'as of', END_HIST: 'end hist'}


def dates_export(model):
    row_list = []

    well_dates_row = get_assumption_empty_row('dates')

    well_dates_row[ColumnName.updatedAt.value] = model[ColumnName.updatedAt.name].strftime(standard_date_str)

    well_dates_row = fill_in_model_type_and_name(well_dates_row, model)

    # dates setting
    dates_setting = model['econ_function'][DATES_SETTING]
    well_dates_row[ColumnName.max_well_life.value] = dates_setting[ColumnName.max_well_life.name]

    for header_enum in [ColumnName.as_of_date, ColumnName.discount_date]:
        this_date_dict = dates_setting[header_enum.name]
        this_date_key = list(this_date_dict.keys())[0]
        if this_date_key == 'date':
            well_dates_row[header_enum.value] = this_date_dict['date']
        elif this_date_key == 'dynamic':
            well_dates_row[header_enum.value] = this_date_dict['dynamic']['value'].replace('_', ' ')
        else:
            well_dates_row[header_enum.value] = this_date_key.replace('_', ' ')

    well_dates_row[ColumnName.cash_flow_prior_to_as_of_date.value] = dates_setting[
        ColumnName.cash_flow_prior_to_as_of_date.name]

    well_dates_row[ColumnName.production_data_resolution.value] = dates_setting.get(
        ColumnName.production_data_resolution.name, EconModelDefaults.production_data_resolution).replace('_', ' ')

    fpd_source_hierarchy = dates_setting.get(ColumnName.fpd_source_hierarchy.name,
                                             EconModelDefaults.fpd_source_hierarchy())

    well_dates_row[ColumnName.use_forecast_schedule_when_no_prod.value] = fpd_source_hierarchy.get(
        ColumnName.use_forecast_schedule_when_no_prod.name,
        EconModelDefaults.fpd_source_hierarchy()[ColumnName.use_forecast_schedule_when_no_prod.name])

    for fpd_key, content in fpd_source_hierarchy.items():
        if fpd_key == ColumnName.use_forecast_schedule_when_no_prod.name:
            # use_forecast_schedule_when_no_prod been processed bove separately
            continue
        selected_key = list(content.keys())[0]
        value = content[selected_key]
        if selected_key == 'date' or selected_key == LINK_TO_WELLS_ECL:
            well_dates_row[ColumnName[fpd_key].value] = value
        else:
            well_dates_row[ColumnName[fpd_key].value] = selected_key.replace('_', ' ')

    # cut_off_criteria
    cut_off = model['econ_function'][CUT_OFF]
    cut_off_key = list(set(CUT_OFF_KEY_MAP.keys()) & set(cut_off.keys()))[0]
    well_dates_row[ColumnName.cut_off_criteria.value] = CUT_OFF_KEY_MAP[cut_off_key]
    # cut_off_value
    if cut_off_key in [DATE, YEARS_FROM_AS_OF, OIL_RATE, GAS_RATE, WATER_RATE, LINK_TO_WELLS_ECL]:
        well_dates_row[ColumnName.cut_off_value.value] = cut_off[cut_off_key]

    # side_phase_end
    well_dates_row[ColumnName.side_phase_end.value] = cut_off.get(ColumnName.side_phase_end.name, 'no')

    # min_cut_off_criteria, min_cut_off_value
    min_cutoff = cut_off.get(MIN_CUT_OFF, {'none': None})
    min_cutoff_key = list(min_cutoff.keys())[0]  # only one field in dict
    well_dates_row[ColumnName.min_cut_off_criteria.value] = MIN_CUT_OFF_KEY_MAP[min_cutoff_key]
    if min_cutoff_key in [DATE, AS_OF]:
        well_dates_row[ColumnName.min_cut_off_value.value] = min_cutoff[min_cutoff_key]

    # include_capex, capex_offset_to_ecl, econ_limit_delay, discount, consecutive_negative
    if cut_off_key in [MAX_CUM_CF, FIRST_NEG_CF, LAST_POS_CF]:
        well_dates_row[ColumnName.include_capex.value] = cut_off.get(ColumnName.include_capex.name, 'no')
        well_dates_row[ColumnName.capex_offset_to_ecl.value] = cut_off.get(ColumnName.capex_offset_to_ecl.name, 'no')
        well_dates_row[ColumnName.econ_limit_delay.value] = cut_off.get(ColumnName.econ_limit_delay.name, 0)

        if cut_off_key == MAX_CUM_CF:
            well_dates_row[ColumnName.discount.value] = cut_off.get(ColumnName.discount.name, 0)
        if cut_off_key == FIRST_NEG_CF:
            well_dates_row[ColumnName.consecutive_negative.value] = cut_off.get(ColumnName.consecutive_negative.name, 0)

    row_list.append(well_dates_row)

    return row_list


def process_cash_flow_related_cut_off(econ_criteria, cut_off_econ, error_list, dates_dict):
    if econ_criteria in [MAX_CUM_CF, FIRST_NEG_CF, LAST_POS_CF]:
        cut_off_econ[ColumnName.include_capex.name] = selection_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.include_capex.value,
            options=['yes', 'no'],
        )
        cut_off_econ[ColumnName.capex_offset_to_ecl.name] = selection_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.capex_offset_to_ecl.value,
            options=['yes', 'no'],
        )
        cut_off_econ[ColumnName.econ_limit_delay.name] = number_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.econ_limit_delay.value,
            required=True,
        )

        if econ_criteria == MAX_CUM_CF:
            cut_off_econ[ColumnName.discount.name] = number_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.discount.value,
                required=True,
            )
        elif econ_criteria == FIRST_NEG_CF:
            cut_off_econ[ColumnName.consecutive_negative.name] = number_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.consecutive_negative.value,
                required=True,
            )


def dates_import(well_array, header, project_wells_df):  # noqa: C901
    error_list = []
    dates = get_default('dates')

    if len(well_array) > 0:
        for i in range(1, len(well_array)):
            error_list.append({'error_message': 'Duplicated dates row', 'row_index': i})

    dates_list = well_array[0]
    dates_dict = dict(zip(header, dates_list))

    dates[DATES_SETTING][ColumnName.max_well_life.name] = number_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.max_well_life.value,
        required=True,
    )

    for header_enum in [ColumnName.as_of_date, ColumnName.discount_date]:
        date_value = dates_dict.get(header_enum.value)
        if date_value is None:
            error_list.append({'error_message': f'{header_enum.value} is missing', 'row_index': 0})
        else:
            date_value_clean = clean_up_str(date_value)
            if date_value_clean in ['fpd', 'maj seg']:
                dates[DATES_SETTING][header_enum.name] = {date_value_clean.replace(' ', '_'): ''}
            elif date_value_clean in ['first of next month', 'first of next year']:  # dynamic dates option
                dates[DATES_SETTING][header_enum.name] = {
                    'dynamic': {
                        'label': date_value_clean.strip().capitalize(),
                        'value': date_value_clean.replace(' ', '_'),
                        'disabled': False
                    }
                }
            else:
                try:
                    dates[DATES_SETTING][header_enum.name] = {'date': str(pd.to_datetime(date_value_clean).date())}
                except Exception:
                    error_list.append({
                        'error_message':
                        f'{header_enum.value} can only be fpd, maj seg, a date or a dynamic date option',
                        'row_index': 0
                    })

    dates[DATES_SETTING][ColumnName.cash_flow_prior_to_as_of_date.name] = selection_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.cash_flow_prior_to_as_of_date.value,
        options=['yes', 'no'],
    )

    prod_data_resolution_option_to_key = {
        EconModelDefaults.production_data_resolution.replace('_', ' '): EconModelDefaults.production_data_resolution,
        'monthly': 'monthly',
        'daily': 'daily'
    }

    resolution = selection_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.production_data_resolution.value,
        options=list(prod_data_resolution_option_to_key.keys()),
    )
    dates[DATES_SETTING][ColumnName.production_data_resolution.name] = prod_data_resolution_option_to_key.get(
        resolution)

    # FPD source
    fpd_source = copy.deepcopy(EconModelDefaults.fpd_source_hierarchy())
    fpd_source_col_name_to_key = {
        ColumnName.first_fpd_source.value: ColumnName.first_fpd_source.name,
        ColumnName.second_fpd_source.value: ColumnName.second_fpd_source.name,
        ColumnName.third_fpd_source.value: ColumnName.third_fpd_source.name,
        ColumnName.fourth_fpd_source.value: ColumnName.fourth_fpd_source.name
    }

    fpd_source_option_to_key = {key.replace('_', ' '): key for key in FPD_SCOURCE_CRITERIA.keys()}
    fpd_source_option_to_key['prod data'] = 'production_data'

    for col in fpd_source_col_name_to_key.keys():
        fpd_col_key = fpd_source_col_name_to_key[col]

        this_fpd_source_input = dates_dict.get(col)
        check_if_date = is_date(this_fpd_source_input)
        is_inpt = 'inpt' in this_fpd_source_input.lower() if this_fpd_source_input is not None else False

        if check_if_date and not is_inpt:
            this_fpd_source = date_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=col,
            )
            fpd_source[fpd_col_key] = {'date': this_fpd_source}
        elif is_inpt and not check_if_date:
            fpd_source[fpd_col_key] = {}
            fpd_source[fpd_col_key][LINK_TO_WELLS_ECL] = inpt_id_selection(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=col,
            )
            fpd_source[fpd_col_key][f'{LINK_TO_WELLS_ECL}_well_id'] = inpt_id_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=col,
                project_wells_df=project_wells_df,
            )
        else:
            this_fpd_source = selection_validation(error_list=error_list,
                                                   input_dict=dates_dict,
                                                   input_key=col,
                                                   options=list(fpd_source_option_to_key.keys()))
            fpd_source[fpd_col_key] = {fpd_source_option_to_key.get(this_fpd_source): ''}

    # check if more than one fpd link exists in fpd hierarchy
    if sum(LINK_TO_WELLS_ECL in fpd_source_value for fpd_source_value in fpd_source.values()) > 1:
        error_list.append({'error_message': "More than one FPD source is linked to another well's ECL", 'row_index': 0})

    dates[DATES_SETTING][ColumnName.fpd_source_hierarchy.name] = fpd_source

    dates[DATES_SETTING][ColumnName.fpd_source_hierarchy.name][
        ColumnName.use_forecast_schedule_when_no_prod.name] = selection_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.use_forecast_schedule_when_no_prod.value,
            options=['yes', 'no'])

    # cut off
    cut_off_econ = {}

    cut_off_econ[ColumnName.side_phase_end.name] = selection_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.side_phase_end.value,
        options=['yes', 'no'],
    )

    # min cut off
    min_cut_off_criteria = selection_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.min_cut_off_criteria.value,
        options=list(MIN_CUT_OFF_KEY_MAP.values()),
        default_option=NONE,
    )
    min_cut_off_key_map_rev = {MIN_CUT_OFF_KEY_MAP[k]: k for k in MIN_CUT_OFF_KEY_MAP}
    min_cut_off_econ_criteria = min_cut_off_key_map_rev[min_cut_off_criteria]
    if min_cut_off_econ_criteria == DATE:
        min_cut_off_value = date_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.min_cut_off_value.value,
        )

    elif min_cut_off_econ_criteria == AS_OF:
        min_cut_off_value = number_validation(
            error_list=error_list,
            input_dict=dates_dict,
            input_key=ColumnName.min_cut_off_value.value,
            required=True,
        )
    else:  # for none and end_hist
        min_cut_off_value = None
    cut_off_econ[MIN_CUT_OFF] = {min_cut_off_econ_criteria: min_cut_off_value}

    # cut off
    cut_off_key_map_rev = {CUT_OFF_KEY_MAP[k]: k for k in CUT_OFF_KEY_MAP}
    cut_off_criteria = selection_validation(
        error_list=error_list,
        input_dict=dates_dict,
        input_key=ColumnName.cut_off_criteria.value,
        options=list(CUT_OFF_KEY_MAP.values()),
    )
    if cut_off_criteria:
        econ_criteria = cut_off_key_map_rev[cut_off_criteria]
    else:
        econ_criteria = None

    if econ_criteria:
        if econ_criteria == DATE:
            cut_off_econ[DATE] = date_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.cut_off_value.value,
            )
        elif econ_criteria == YEARS_FROM_AS_OF:
            cut_off_econ[econ_criteria] = number_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.cut_off_value.value,
                required=True,
            )
        elif econ_criteria in [OIL_RATE, GAS_RATE, WATER_RATE]:
            cut_off_econ[econ_criteria] = number_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.cut_off_value.value,
                required=True,
            )
        elif econ_criteria == LINK_TO_WELLS_ECL:
            cut_off_econ[LINK_TO_WELLS_ECL] = inpt_id_selection(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.cut_off_value.value,
            )
            cut_off_econ[f'{LINK_TO_WELLS_ECL}_well_id'] = inpt_id_validation(
                error_list=error_list,
                input_dict=dates_dict,
                input_key=ColumnName.cut_off_value.value,
                project_wells_df=project_wells_df,
            )

        else:
            # for cf related cutoff and no cutoff
            cut_off_econ[econ_criteria] = ''

            process_cash_flow_related_cut_off(econ_criteria, cut_off_econ, error_list, dates_dict)

    dates[CUT_OFF] = cut_off_econ

    # merge errors for each row
    error_list_merged = []
    for row_index in set([item['row_index'] for item in error_list]):
        row_index_errors = [item for item in error_list if item['row_index'] == row_index]
        error_list_merged.append({
            'error_message': '. '.join([item['error_message'] for item in row_index_errors]),
            'row_index': row_index,
        })

    return dates, error_list_merged
