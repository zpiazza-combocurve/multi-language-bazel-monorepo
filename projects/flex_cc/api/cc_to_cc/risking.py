import copy
import numpy as np
from datetime import datetime
from api.cc_to_cc.helper import (number_validation, date_validation, selection_validation, get_phase_name,
                                 date_str_format_change, row_view_process, multi_line_to_rows, SEASONAL_MONTHS,
                                 standard_date_str)
from api.cc_to_cc.file_headers import get_assumption_empty_row, fill_in_model_type_and_name, ColumnName

from combocurve.science.econ.default_econ_assumptions import get_default
from combocurve.shared.econ_tools.econ_model_tools import CRITERIA_MAP_DICT, CriteriaEnum
from combocurve.shared.econ_tools.default_econ_fields import EconModelDefaults

SEASONAL_ROW_NUMBER = 12

KEY_MAP_DICT = {
    'risking_model': 'risking',
    'shutIn': 'shut-in',
}

SHUT_IN_CSV_KEY_MAP_DICT = {
    'phase': ColumnName.phase.value,
    'offset_to_as_of_date': ColumnName.criteria.value,
    'dates': ColumnName.criteria.value,
    'unit': ColumnName.unit.value,
    ColumnName.repeat_range_of_dates.name: ColumnName.repeat_range_of_dates.value,
    ColumnName.total_occurrences.name: ColumnName.total_occurrences.value,
    'multiplier': ColumnName.scale_post_shut_in_factor.value,
    ColumnName.scale_post_shut_in_end_criteria.name: ColumnName.scale_post_shut_in_end_criteria.value,
    ColumnName.scale_post_shut_in_end.name: ColumnName.scale_post_shut_in_end.value,
    'fixed_expense': ColumnName.fixed_expense.value,
    'capex': ColumnName.capex.value,
}

RISKING_KEY_MAP_DICT = {
    'oil': 'oil',
    'gas': 'gas',
    'ngl': 'ngl',
    'drip_condensate': 'drip cond',
    'water': 'water',
}

WELLS = 'wells'
WELL_STREAM = 'well_stream'

SHUT_IN_ROW_ECON = {
    'phase': '',
    'unit': '',
    ColumnName.repeat_range_of_dates.name: '',
    ColumnName.total_occurrences.name: '',
    'multiplier': '',
    ColumnName.scale_post_shut_in_end_criteria.name: '',
    ColumnName.scale_post_shut_in_end.name: '',
    'fixed_expense': '',
    'capex': '',
}

RISKING_CRITERIA_MAP = {
    'offset_to_as_of_date': 'as of',
    'dates': 'dates',
}

SCALE_CRITERIA_MAP = {
    'offset_to_as_of_date': 'as of',
    'dates': 'dates',
    'econ_limit': 'econ limit',
}

RISKING_UNIT_MAP = {'multiplier': '%'}


def _get_criteria(header, row, row_index, error_list):
    csv_dict = dict(zip(header, row))

    this_criteria = selection_validation(
        error_list=error_list,
        input_dict=csv_dict,
        input_key='Criteria',
        options=RISKING_CRITERIA_MAP.values(),
        row_index=row_index,
    )

    risking_criteria_to_key = {RISKING_CRITERIA_MAP[k]: k for k in RISKING_CRITERIA_MAP}

    return this_criteria, risking_criteria_to_key.get(this_criteria)


def risking_export(model):
    row_list = []

    last_update_str = model['updatedAt'].strftime(standard_date_str)

    # common row
    common_row = get_assumption_empty_row('risking')
    common_row['Last Update'] = last_update_str
    common_row = fill_in_model_type_and_name(common_row, model)

    econ_dict = model['econ_function']

    # risking
    econ_key = 'risking_model'
    sub_econ_dict = econ_dict[econ_key]

    risk_common_row = copy.deepcopy(common_row)
    risk_common_row[ColumnName.risk_prod.value] = sub_econ_dict.get(ColumnName.risk_prod.name, 'yes')
    risk_common_row[ColumnName.risk_ngl_drip_cond_via_gas_risk.value] = sub_econ_dict.get(
        ColumnName.risk_ngl_drip_cond_via_gas_risk.name, 'yes')

    # risking by phase
    for phase in RISKING_KEY_MAP_DICT.keys():
        csv_phase = get_phase_name(phase)

        csv_row = copy.deepcopy(risk_common_row)
        csv_row[ColumnName.key.value] = KEY_MAP_DICT[econ_key]
        csv_row[ColumnName.phase.value] = csv_phase

        row_list += row_view_process(csv_row, sub_econ_dict[phase])

    # well count
    well_count_row = copy.deepcopy(common_row)
    well_count_row[ColumnName.key.value] = WELLS
    row_list += row_view_process(well_count_row, sub_econ_dict.get(WELL_STREAM, EconModelDefaults.well_stream()))

    # shut-in
    econ_key = 'shutIn'
    rows = econ_dict[econ_key]['rows']

    for row in rows:
        csv_row = copy.deepcopy(common_row)
        csv_row[ColumnName.key.value] = KEY_MAP_DICT[econ_key]

        # handle export of old model
        if 'repeat_range_of_dates' not in row:
            row['repeat_range_of_dates'] = 'no_repeat'
            row['total_occurrences'] = 1
        if ColumnName.scale_post_shut_in_end_criteria.name not in row:
            row[ColumnName.scale_post_shut_in_end_criteria.name] = 'econ_limit'
            row[ColumnName.scale_post_shut_in_end.name] = ''

        for key, value in row.items():
            csv_key = SHUT_IN_CSV_KEY_MAP_DICT[key]
            csv_value = value

            if key == 'phase':
                csv_value = get_phase_name(value)

            if key == 'unit' and 'dates' in row:
                # skip unit when dates is selected
                continue

            if key in ['dates', 'offset_to_as_of_date']:
                csv_value = CRITERIA_MAP_DICT[key]
                start_key, end_key = ('start_date', 'end_date') if key == 'dates' else ('start', 'end')
                start = value[start_key]
                end = value[end_key]
                if key == 'dates':
                    start = date_str_format_change(start)
                    end = date_str_format_change(end)
                csv_row[ColumnName.criteria_start.value] = start
                csv_row[ColumnName.criteria_end.value] = end

            if key == ColumnName.scale_post_shut_in_end_criteria.name:
                csv_value = SCALE_CRITERIA_MAP[csv_value]

            if key == ColumnName.scale_post_shut_in_end.name:
                if row[ColumnName.scale_post_shut_in_end_criteria.name] == 'dates':
                    scale_end = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ')
                    csv_value = date_str_format_change(f'{scale_end.year}-{scale_end.month}-{scale_end.day}')
                elif row[ColumnName.scale_post_shut_in_end_criteria.name] == 'econ_limit':
                    csv_value = ''

            csv_row[csv_key] = csv_value

        row_list.append(csv_row)

    return row_list


def well_count_unit_validation(first_row_dict, first_row_index, second_row_dict, second_row_index, error_list):
    if first_row_dict['Unit'] is not None:
        error_list.append({'error_message': 'Wells first row should have no unit', 'row_index': first_row_index})

    if second_row_dict is None:
        second_row_unit = None
    elif second_row_dict['Unit'] is None:
        second_row_unit = None
    else:
        second_row_unit = selection_validation(
            error_list=error_list,
            input_dict=second_row_dict,
            input_key='Unit',
            options=['%'],
            row_index=second_row_index,
        )

    if second_row_unit == '%':
        econ_unit = 'percentage'
    elif second_row_unit is None:
        econ_unit = 'count'
    else:
        error_list.append({'error_message': 'Wells second row should have no unit or %', 'row_index': second_row_dict})

    return econ_unit


def risk_unit_validation(first_row_dict, first_row_index, error_list):
    unit_map_dict_rev = {RISKING_UNIT_MAP[k]: k for k in {**RISKING_UNIT_MAP}}

    unit = selection_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key='Unit',
        options=list(RISKING_UNIT_MAP.values()),
        row_index=first_row_index,
        default_option='',
    )

    if (unit not in unit_map_dict_rev.keys()):
        error_list.append({'error_message': 'Unit is Invalid!', 'row_index': first_row_index})
        econ_unit = None
    else:
        econ_unit = unit_map_dict_rev[unit]

    return econ_unit


def criteria_validation(first_row_dict, first_row_index, error_list):
    criteria = selection_validation(
        error_list=error_list,
        input_dict=first_row_dict,
        input_key='Criteria',
        options=list(CRITERIA_MAP_DICT.values()),
        row_index=first_row_index,
    )

    criteria_map_dict_rev = {CRITERIA_MAP_DICT[k]: k for k in CRITERIA_MAP_DICT}
    if criteria:
        econ_criteria = criteria_map_dict_rev[criteria]
    else:
        econ_criteria = None

    return econ_criteria


def process_flat_row(error_list, risking, phase, rows, rows_index, econ_criteria, econ_unit, first_row_dict,
                     first_row_index):
    if len(rows) > 1:
        for i in range(1, len(rows)):
            error_list.append({'error_message': 'Duplicated row of Flat Period', 'row_index': rows_index[i]})
    else:
        rows = [{
            econ_criteria:
            'Flat',
            econ_unit:
            number_validation(
                error_list=error_list,
                input_dict=first_row_dict,
                input_key='Value',
                required=True,
                row_index=first_row_index,
            )
        }]
        risking['risking_model'][phase]['rows'] = rows


def process_well_count(header, error_list, risking, well_array, well_key_list):
    is_well_count_row = well_key_list == WELLS
    well_count_rows = well_array[is_well_count_row]

    if len(well_count_rows) == 0:
        return

    well_count_rows_index = np.where(is_well_count_row)[0]

    first_row_dict = dict(zip(header, well_count_rows[0]))
    first_row_index = well_count_rows_index[0]

    # need 2 rows to check unit for percentage well count

    if len(well_count_rows) > 1:
        second_row_dict = dict(zip(header, well_count_rows[1]))
        second_row_index = well_count_rows_index[1]
    else:
        second_row_dict = None
        second_row_index = None

    econ_unit = well_count_unit_validation(first_row_dict, first_row_index, second_row_dict, second_row_index,
                                           error_list)
    econ_criteria = criteria_validation(first_row_dict, first_row_index, error_list)

    if econ_criteria == CriteriaEnum.entire_well_life.name:
        process_flat_row(error_list, risking, WELL_STREAM, well_count_rows, well_count_rows_index, econ_criteria,
                         econ_unit, first_row_dict, first_row_index)
    else:
        well_count_rows_with_header = [dict(zip(header, p)) for p in well_count_rows]
        rows = multi_line_to_rows(error_list, well_count_rows_with_header, econ_criteria, econ_unit,
                                  well_count_rows_index)
        risking['risking_model'][WELL_STREAM]['rows'] = rows


def risking_import(well_array, header):
    risking = get_default('risking')
    error_list = []

    well_key_list = np.array([x.strip() if x is not None else x for x in well_array[:, header.index('Key')]])
    well_phase_list = np.array([x.strip() if x is not None else x for x in well_array[:, header.index('Phase')]])

    for i in range(len(well_key_list)):
        this_key = well_key_list[i]
        this_phase = well_phase_list[i]
        if this_key == 'risking':
            if this_phase not in ['oil', 'gas', 'ngl', 'drip cond', 'water']:
                error_list.append({
                    'error_message': 'Phase can only be oil, gas, ngl, drip cond or water',
                    'row_index': i
                })
        elif this_key == 'shut-in':
            if this_phase not in ['all', 'oil', 'gas', 'water']:
                error_list.append({'error_message': 'Phase can only be all, oil, gas, or water', 'row_index': i})
        elif this_key != WELLS:
            error_list.append({'error_message': 'Wrong value in Key', 'row_index': i})

    risking_phase_map_dict_rev = {RISKING_KEY_MAP_DICT[k]: k for k in RISKING_KEY_MAP_DICT}

    # risking
    is_risking_rows = well_key_list == 'risking'
    first_risking_row_idx = np.where(is_risking_rows)[0][0]

    first_risking_row = well_array[first_risking_row_idx]
    first_risking_row_dict = dict(zip(header, first_risking_row))

    risking['risking_model'][ColumnName.risk_prod.name] = selection_validation(
        error_list=error_list,
        input_dict=first_risking_row_dict,
        input_key=ColumnName.risk_prod.value,
        options=['yes', 'no'],
        row_index=first_risking_row_idx,
    )

    risking['risking_model'][ColumnName.risk_ngl_drip_cond_via_gas_risk.name] = selection_validation(
        error_list=error_list,
        input_dict=first_risking_row_dict,
        input_key=ColumnName.risk_ngl_drip_cond_via_gas_risk.value,
        options=['yes', 'no'],
        row_index=first_risking_row_idx,
    )

    # phase risking
    for risking_phase in RISKING_KEY_MAP_DICT.values():
        risking_list = well_array[is_risking_rows & (well_phase_list == risking_phase)]
        risking_list_index = np.where(is_risking_rows & (well_phase_list == risking_phase))[0]

        if not len(risking_list):
            continue

        phase_econ_key = risking_phase_map_dict_rev[risking_phase]

        first_row_dict = dict(zip(header, risking_list[0]))
        first_row_index = risking_list_index[0]

        econ_unit = risk_unit_validation(first_row_dict, first_row_index, error_list)
        econ_criteria = criteria_validation(first_row_dict, first_row_index, error_list)

        if econ_criteria == CriteriaEnum.entire_well_life.name:
            process_flat_row(error_list, risking, phase_econ_key, risking_list, risking_list_index, econ_criteria,
                             econ_unit, first_row_dict, first_row_index)
        else:
            risking_dict_list = [dict(zip(header, p)) for p in risking_list]
            if econ_criteria == CriteriaEnum.seasonal.name:
                criteria_set = set([r['Period'] for r in risking_dict_list])
                if len(risking_dict_list) != SEASONAL_ROW_NUMBER:
                    error_list.append({
                        'error_message': 'Seasonal model need to have 12 rows',
                        'row_index': risking_list_index[0]
                    })
                    continue
                elif criteria_set != SEASONAL_MONTHS:
                    error_list.append({
                        'error_message': 'Seasonal model Criteria need to be Jan - Dec',
                        'row_index': risking_list_index[0]
                    })
                    continue

            rows = multi_line_to_rows(error_list, risking_dict_list, econ_criteria, econ_unit, risking_list_index)
            risking['risking_model'][phase_econ_key]['rows'] = rows

    # well count
    process_well_count(header, error_list, risking, well_array, well_key_list)

    # shut-in
    shut_in_rows = []
    shut_in_csv_list = well_array[well_key_list == 'shut-in']
    shut_in_csv_list_index = np.where(well_key_list == 'shut-in')[0]

    if len(shut_in_csv_list):
        this_criteria, this_criteria_key = _get_criteria(header, shut_in_csv_list[0], shut_in_csv_list_index[0],
                                                         error_list)
    else:
        this_criteria = None
        this_criteria_key = None

    for index, csv_row in enumerate(shut_in_csv_list):
        this_shut_in, this_error_list = validate_shut_in_row(header, shut_in_csv_list_index, csv_row, index,
                                                             this_criteria, this_criteria_key)
        error_list = error_list + this_error_list
        shut_in_rows.append(this_shut_in)

    risking['shutIn'] = {'rows': shut_in_rows}

    return risking, error_list


def validate_shut_in_row(header, shut_in_csv_list_index, csv_row, index, this_criteria, this_criteria_key):
    this_error_list = []
    this_csv_dict = dict(zip(header, csv_row))
    this_shut_in = copy.deepcopy(SHUT_IN_ROW_ECON)
    row_index = shut_in_csv_list_index[index]

    this_shut_in['phase'] = selection_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.phase.value,
        options=['all', 'oil', 'gas', 'water'],
        row_index=row_index,
    )

    this_shut_in['multiplier'] = number_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.scale_post_shut_in_factor.value,
        required=True,
        row_index=row_index,
    )

    scale_criteria_map_rev = {value: key for key, value in SCALE_CRITERIA_MAP.items()}
    this_shut_in[ColumnName.scale_post_shut_in_end_criteria.name] = scale_criteria_map_rev[selection_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.scale_post_shut_in_end_criteria.value,
        options=[
            SCALE_CRITERIA_MAP['econ_limit'],
            SCALE_CRITERIA_MAP['dates'] if this_criteria == 'dates' else SCALE_CRITERIA_MAP['offset_to_as_of_date']
        ],
        row_index=row_index,
    )]

    is_econ_limit = this_shut_in[ColumnName.scale_post_shut_in_end_criteria.name] == 'econ_limit'

    if is_econ_limit:
        this_shut_in[ColumnName.scale_post_shut_in_end.name] = ' '

    if this_criteria == 'dates' and not is_econ_limit:
        shut_in_end_date = date_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.criteria_end.value,
            row_index=row_index,
        )
        scale_end_date = date_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.scale_post_shut_in_end.value,
            row_index=row_index,
        )
        repeat = ColumnName.repeat_range_of_dates.name
        if (shut_in_end_date and scale_end_date):
            shut_in_end = datetime.fromisoformat(shut_in_end_date)
            scale_end = datetime.fromisoformat(scale_end_date)
            if (shut_in_end >= scale_end):
                this_error_list.append({
                    'error_message': 'Scale end date must be later than criteria end',
                    'row_index': row_index
                })
            elif this_shut_in[repeat] == 'yearly' and (shut_in_end.year != scale_end.year):
                this_error_list.append({
                    'error_message': 'Scale end year must be in the same year of criteria dates for yearly repeater',
                    'row_index': row_index
                })
            elif this_shut_in[repeat] == 'monthly' and ((shut_in_end.year != scale_end.year) or
                                                        (shut_in_end.month != scale_end.month)):
                this_error_list.append({
                    'error_message': 'Scale end dates must be in the same month of criteria dates for monthly repeater',
                    'row_index': row_index
                })
        this_shut_in[ColumnName.scale_post_shut_in_end.name] = scale_end.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    elif this_criteria == 'as of' and not is_econ_limit:
        this_shut_in[ColumnName.scale_post_shut_in_end.name] = number_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.scale_post_shut_in_end.value,
            required=True,
            row_index=row_index,
        )

    this_shut_in['fixed_expense'] = selection_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.fixed_expense.value,
        options=['yes', 'no'],
        row_index=row_index,
    )

    this_shut_in['capex'] = selection_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.capex.value,
        options=['yes', 'no'],
        row_index=row_index,
    )

    this_shut_in[ColumnName.repeat_range_of_dates.name] = selection_validation(
        error_list=this_error_list,
        input_dict=this_csv_dict,
        input_key=ColumnName.repeat_range_of_dates.value,
        options=['no_repeat', 'monthly', 'yearly'],
        row_index=row_index,
    )

    if this_shut_in[ColumnName.repeat_range_of_dates.name] == 'no_repeat':
        this_shut_in[ColumnName.total_occurrences.name] = 1
    else:
        this_shut_in[ColumnName.total_occurrences.name] = number_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.total_occurrences.value,
            required=True,
            row_index=row_index,
        )

    if this_criteria == 'dates':
        start_date = date_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.criteria_start.value,
            row_index=row_index,
        )

        end_date = date_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.criteria_end.value,
            row_index=row_index,
        )
        if (end_date and start_date):
            end = datetime.fromisoformat(end_date)
            start = datetime.fromisoformat(start_date)
            if (end_date < start_date):
                this_error_list.append({
                    'error_message': 'Criteria end must be later than criteria start',
                    'row_index': row_index
                })
            elif this_shut_in[ColumnName.repeat_range_of_dates.name] == 'yearly' and (end.year != start.year):
                this_error_list.append({
                    'error_message': 'Criteria dates must be in the same year for yearly repeater',
                    'row_index': row_index
                })
            elif this_shut_in[ColumnName.repeat_range_of_dates.name] == 'monthly' and ((end.year != start.year) or
                                                                                       (end.month != start.month)):
                this_error_list.append({
                    'error_message': 'Criteria dates must be in the same month for monthly repeater',
                    'row_index': row_index
                })
        if this_shut_in[ColumnName.total_occurrences.name] and this_shut_in[ColumnName.total_occurrences.name] < 1:
            this_error_list.append({'error_message': 'Number of occurrence is at least 1', 'row_index': row_index})
        this_shut_in[this_criteria_key] = {'start_date': start_date, 'end_date': end_date}
        this_shut_in['unit'] = 'day'
    else:
        start = number_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.criteria_start.value,
            required=True,
            row_index=row_index,
        )

        end = number_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.criteria_end.value,
            required=True,
            row_index=row_index,
        )

        if (start and end) and (end < start):
            this_error_list.append({
                'error_message': 'Criteria end must be greater than criteria start',
                'row_index': row_index
            })
        this_shut_in[this_criteria_key] = {'start': start, 'end': end}

        this_shut_in['unit'] = selection_validation(
            error_list=this_error_list,
            input_dict=this_csv_dict,
            input_key=ColumnName.unit.value,
            options=['day', 'month'],
            row_index=row_index,
        )
    return this_shut_in, this_error_list
