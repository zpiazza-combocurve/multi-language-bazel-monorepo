import copy
import datetime
import pandas as pd

from pandas.tseries.offsets import MonthBegin, MonthEnd

from api.aries_phdwin_imports.phdwin_helpers.general import (DOLLAR_PER_VOL_CONV_DICT, format_for_matching,
                                                             get_date_obj, get_model_name,
                                                             get_phdwin_fpd_from_model_document,
                                                             set_phdwin_end_date_to_econ_limit)
from api.aries_phdwin_imports.combine_rows import copy_rows, FIXED_EXPENSE_CATEGORY, sum_rows
from api.aries_phdwin_imports.helpers import convert_dates_to_offset

from combocurve.shared.aries_import_enums import CCSchemaEnum, EconEnum, PhaseEnum
from combocurve.shared.phdwin_import_constants import PhdHeaderCols, PhdwinPTEEnum
from combocurve.utils.constants import DAYS_IN_MONTH


def process_phdwin_expense_document(default_document, model_name, document, fixed_expense_assignment, well_count_df,
                                    get_default_format, lse_id_to_case_multiplier, lse_id_to_no_expense_before_dict):

    filled = default_document is not None

    # get row obj
    data_obj = get_date_obj(document)

    if data_obj is None:
        return default_document, model_name, fixed_expense_assignment

    # add well to cc document
    if not filled:
        default_document = get_default_format('expense')
        default_document['wells'].add(document['well'])

    # appropriately set cc setting based on phdwin document
    default_document = set_phdwin_default_expense_format(default_document)

    # get phase, if variable expense
    phase = get_variable_expense_phase(document)

    # get the expense unit to use
    key_name = get_expense_unit_key(document, phase)

    # get CC fixed expense category to use, if fixed expense
    fixed_exp_category = get_fixed_expense_category(document, fixed_expense_assignment)

    # update data_obj with value and dates (include well count modelling when necessary)
    data_obj = update_expense_data_obj(data_obj, document, key_name, well_count_df)

    # format document and append data obj to appropriate location in cc document
    default_document = append_expense_obj_to_document(document, phase, fixed_exp_category, default_document, data_obj,
                                                      lse_id_to_case_multiplier, lse_id_to_no_expense_before_dict)

    model_name = get_model_name(model_name, default_document, phd_model_name=document.get('modelname'))
    # date settings
    if not filled:
        default_document['createdAt'] = datetime.datetime.now()
        default_document['updatedAt'] = datetime.datetime.now()

    return default_document, model_name, fixed_expense_assignment


def set_phdwin_default_expense_format(document):
    for category in variable_expenses_category:
        if category == EconEnum.transport.value:
            product_list = document[EconEnum.econ_function.value][EconEnum.var_exp.value]
            for product in product_list:
                document[EconEnum.econ_function.value][EconEnum.var_exp.value][product][category][
                    EconEnum.calc.value] = EconEnum.net_interest.value
                document[EconEnum.econ_function.value][EconEnum.var_exp.value][product][category][
                    EconEnum.shrinkage_condition.value] = EconEnum.shrunk.value
        else:
            document[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][category][
                EconEnum.calc.value] = EconEnum.w_interest.value
            document[EconEnum.econ_function.value][EconEnum.var_exp.value][PhaseEnum.gas.value][category][
                EconEnum.shrinkage_condition.value] = EconEnum.unshrunk.value

    return document


def get_fixed_expense_category(document, assignment_dic):
    type_name = document['type_name']
    product_name = document[PhdwinPTEEnum.product_name.value]
    category = None
    if any(
            format_for_matching(phdwin_fixed_expense_category) in format_for_matching(type_name)
            for phdwin_fixed_expense_category in phdwin_fixed_expense_categories):
        # check if type_name in assignment_dic values and return associated key (fixed_expense_category)
        category = [k for k, v in assignment_dic.items() if v == (type_name, product_name)]

        if len(category) == 0:
            for key, value in assignment_dic.items():
                if value is None:
                    category = key
                    assignment_dic[category] = (type_name, product_name)
                    break
                category = key
        else:
            category = category[-1]

    return category


def update_expense_data_obj(data_obj, document, key_name, well_count_df):
    multiplier = 1
    if key_name != 'need_to_delete':
        multiplier = DOLLAR_PER_VOL_CONV_DICT.get(key_name.split('dollar_per_')[-1])
        multiplier, key_name = (multiplier, 'dollar_per_bbl') if multiplier is not None else (1, key_name)

    data_obj[key_name] = document['value'] * multiplier

    data_obj = update_expense_data_date_obj(data_obj, document, well_count_df)

    return data_obj


def append_expense_obj_to_document(document, phase, fixed_exp_category, default_document, data_obj,
                                   lse_id_to_case_multiplier, lse_id_to_no_expense_before_dict):
    type_name = document.get('type_name')
    lease_id = document['lse_id']
    # productname == 'WELL COST' (type: 3, productcode: 17)
    # productname == 'FIXED COST' (type: 4, productcode: 18)
    if phase == 'water' or phase == 'total fluids':
        default_document['econ_function']['water_disposal'] = set_and_append_expense_data_obj(
            document,
            default_document['econ_function']['water_disposal'],
            data_obj,
            lease_id,
            no_expense_before=lse_id_to_no_expense_before_dict)
        if phase == 'total fluids':
            for phase in ['oil', 'ngl', 'drip_condensate']:
                default_document['econ_function']['variable_expenses'][phase][
                    VARIABLE_PHDWIN_EXPENSE_DICT[type_name]] = set_and_append_expense_data_obj(
                        document,
                        default_document['econ_function']['variable_expenses'][phase][
                            VARIABLE_PHDWIN_EXPENSE_DICT[type_name]],
                        data_obj,
                        lease_id,
                        no_expense_before=lse_id_to_no_expense_before_dict)

    elif any(
            format_for_matching(phdwin_fixed_expense_category) in format_for_matching(type_name)
            for phdwin_fixed_expense_category in phdwin_fixed_expense_categories):
        default_document['econ_function']['fixed_expenses'][fixed_exp_category] = set_and_append_expense_data_obj(
            document,
            default_document['econ_function']['fixed_expenses'][fixed_exp_category],
            data_obj,
            lease_id,
            case_multiplier=lse_id_to_case_multiplier,
            no_expense_before=lse_id_to_no_expense_before_dict)
    elif type_name in VARIABLE_PHDWIN_EXPENSE_DICT and phase in ['oil', 'gas', 'ngl', 'drip_condensate']:
        default_document['econ_function']['variable_expenses'][phase][
            VARIABLE_PHDWIN_EXPENSE_DICT[type_name]] = set_and_append_expense_data_obj(
                document,
                default_document['econ_function']['variable_expenses'][phase][VARIABLE_PHDWIN_EXPENSE_DICT[type_name]],
                data_obj,
                lease_id,
                no_expense_before=lse_id_to_no_expense_before_dict)

    return default_document


def set_and_append_expense_data_obj(document,
                                    precise_default_document,
                                    data_obj,
                                    lease_id,
                                    case_multiplier=None,
                                    no_expense_before=None):
    cap = document.get('cap')
    calc_using_wi = document.get('calcu_using_wi')
    affect_econ_limit1 = document.get('affect_econ_limit1')
    affect_econ_limit3 = document.get('affect_econ_limit3')
    type_name = document.get('type_name')
    if type(data_obj) != list:
        data_obj = [data_obj]
    data_obj, continue_process = check_for_no_expense_before_and_update(data_obj, lease_id, no_expense_before)
    if not continue_process:
        return precise_default_document

    if case_multiplier is not None:
        precise_default_document['deal_terms'] = case_multiplier.get(str(lease_id),
                                                                     1) * precise_default_document['deal_terms']

    if type_name is not None:
        precise_default_document['description'] = str(type_name).strip()
    if calc_using_wi == 1:  # Boolparam[0]
        precise_default_document['deduct_before_severance_tax'] == 'yes'
    if cap != 0:
        precise_default_document['cap'] = document['cap']
    if affect_econ_limit1 == 0 and affect_econ_limit3 == 0:
        precise_default_document['affect_econ_limit'] = 'no'
    if affect_econ_limit1 == 1:
        precise_default_document['deduct_before_ad_val_tax'] = 'yes'

    for obj in data_obj:
        precise_default_document['rows'].append(obj)

    return precise_default_document


def check_for_no_expense_before_and_update(objs, lease_id, no_expense_before):
    continue_process = True
    if no_expense_before is None:
        return objs, continue_process

    no_expense_before_date = pd.to_datetime(no_expense_before.get(str(lease_id)), errors='coerce')

    if pd.isnull(no_expense_before_date):
        return objs, continue_process

    for obj in objs:
        start_date = pd.to_datetime(obj['dates']['start_date'])
        end_date = pd.to_datetime(obj['dates']['end_date'])

        if no_expense_before_date > start_date and no_expense_before_date > end_date:
            continue_process = False

        elif no_expense_before_date > start_date and no_expense_before_date < end_date:
            obj['dates']['start_date'] = datetime.date(no_expense_before_date.year, no_expense_before_date.month,
                                                       1).strftime(CCSchemaEnum.ymd_date_dash_format.value)
            continue_process = True

    return objs, continue_process


def get_variable_expense_phase(document):
    product_as_key = str(document.get('productname')).lower()
    if any(acc_phase in product_as_key for acc_phase in ['oil', 'gas', 'ngl', 'condensate', 'water']):
        product_as_key = next(acc_phase for acc_phase in ['oil', 'gas', 'ngl', 'condensate', 'water']
                              if acc_phase in product_as_key)
    product_as_key = 'drip_condensate' if product_as_key == 'condensate' else product_as_key

    return product_as_key


def get_expense_unit_key(document, product_as_key):
    model_name = str(document.get('modelname')).strip()
    model_unit_str = str(document.get('model_unitstr')).strip()
    unit_str = str(document.get('unitstr')).strip()
    type_name = str(document.get('type_name')).strip().lower()

    unit_str = model_unit_str if model_name != 'none' else unit_str
    if 'variable' in type_name or 'water' in product_as_key:
        if unit_str == 'bbl':
            unit_as_key = 'dollar_per_bbl'
        else:
            if unit_str not in ['none', '']:
                unit_as_key = f'dollar_per_{unit_str.lower()}'
                if unit_as_key not in ['dollar_per_bbl', 'dollar_per_gal', 'dollar_per_mcf', 'dollar_per_mgal']:
                    if product_as_key == 'gas':
                        unit_as_key = 'dollar_per_mcf'
                    else:
                        unit_as_key = 'dollar_per_bbl'
            else:
                if product_as_key == 'gas':
                    unit_as_key = 'dollar_per_mcf'
                else:
                    unit_as_key = 'dollar_per_bbl'
    else:
        # fill to fixed_expense format
        unit_as_key = 'need_to_delete'  # will be delete later (replace by fixed_expense)

    return unit_as_key


def update_expense_data_date_obj(obj, document, well_count_df):
    '''
    Input:
    obj (dictionary): Filled date obj with date and expense values
    document (dictionary): Formatted PHDWin expense document
    filled_document (dictionary): CC expense document
    type_name (str): Name of expense type e.g. Scheduled Well Expense (Well Cost)
    product_name (str): Phase (for Variable expense)

    Updates CC expense document based on the values from the PHDWin expense document
    '''
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = document[CCSchemaEnum.start_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)
    obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = document[CCSchemaEnum.end_date.value].strftime(
        CCSchemaEnum.ymd_date_dash_format.value)

    per_well_expense = any(
        format_for_matching(expense_type) in format_for_matching(document[PhdwinPTEEnum.product_name.value])
        for expense_type in [PhdwinPTEEnum.well_cost.value, PhdwinPTEEnum.copas.value])
    if PhdwinPTEEnum.temporary_holder.value in obj and per_well_expense and not well_count_df.empty:
        obj = update_expense_value_based_on_well_count(obj, document, well_count_df)
        return obj
    elif PhdwinPTEEnum.temporary_holder.value in obj:
        del obj[PhdwinPTEEnum.temporary_holder.value]
        obj[EconEnum.fixed_exp.value] = document[EconEnum.value.value]
        return [obj]
    else:
        return obj


def update_expense_value_based_on_well_count(obj, document, well_count_df):
    try:
        lse_id = float(int(document[PhdHeaderCols.lse_id.name]))
    except ValueError:
        lse_id = None
    if lse_id is not None:
        selected_df = well_count_df[well_count_df[PhdHeaderCols.lse_id.name] == lse_id]
        if selected_df.empty:
            value = document[EconEnum.value.value]
            del obj[PhdwinPTEEnum.temporary_holder.value]
            obj[EconEnum.fixed_exp.value] = value
        else:
            obj = update_value_by_well_count_segment(obj, document, selected_df)
    if type(obj) == list:
        return obj
    else:
        return [obj]


def process_well_count_df_to_well_series_dict_for_expense_modeling(selected_df, start_date, end_date):
    # convert date column to pandas datetime, get the start of the month and end of the month
    selected_df['start_date'] = pd.to_datetime(selected_df['date']) + MonthBegin(-1)
    selected_df['end_date'] = pd.to_datetime(selected_df['date']) + MonthEnd(0)
    values = selected_df.tail(1)['count'].values
    index = selected_df.tail(1)['end_date']

    # remove all dates less than start date and remove all dates greater than end date
    selected_df = selected_df[(selected_df['start_date'] >= start_date) & (selected_df['end_date'] <= end_date)]
    if selected_df.empty:
        return pd.Series(values, index=index)

    # update the missing time periods with 1 well count
    new_idx = pd.date_range(start_date, selected_df.tail(1)['end_date'].values[-1], freq='M')
    well_count_series = pd.Series(selected_df['count'].values, index=selected_df['end_date'])
    well_count_series = well_count_series.reindex(new_idx, fill_value=1)

    return well_count_series


def update_value_by_well_count_segment(obj, document, selected_df):
    # get the start and end date of the object
    start_date, end_date = get_dates_for_well_count(obj)

    # get well count series (well count values, date  as index)
    well_count_series = process_well_count_df_to_well_series_dict_for_expense_modeling(
        selected_df, start_date, end_date)

    if well_count_series is None:
        copy_obj = copy.deepcopy(obj)
        copy_obj['fixed_expense'] = document.get('value')
        copy_obj.pop('need_to_delete', None)
        objs = [copy_obj]
    else:
        objs = get_new_obj_by_modeling(document, start_date, end_date, well_count_series)

    return objs


def get_new_obj_by_modeling(document, start_date, end_date, well_count_series):
    # initialize list of objects
    objs = []
    # get the fixed cost and start date
    fixed_value = document.get('value')
    current_start_date = start_date

    # intialize prev_well_count and prev_end_date
    prev_well_count = None
    prev_end_date = None

    # add first fixed expense object
    copy_obj = {
        'dates': {
            'start_date': current_start_date.strftime('%Y-%m-%d'),
            'end_date': well_count_series.index[0].strftime('%Y-%m-%d')
        },
        'fixed_expense': round(fixed_value * float(well_count_series.values[0]), 4)
    }

    # loop well_count series {date: value}
    # get model the objs by the well_count
    for date, well_count in well_count_series.items():
        if prev_well_count != well_count and prev_well_count is not None:
            copy_obj['dates']['end_date'] = prev_end_date.strftime('%Y-%m-%d')
            copy_obj['fixed_expense'] = round(fixed_value * prev_well_count, 4)
            objs.append(copy_obj)
            current_start_date = prev_end_date + pd.DateOffset(days=1)
            copy_obj = {'dates': {'start_date': current_start_date.strftime('%Y-%m-%d'), 'end_date': None}}
        prev_end_date = date
        prev_well_count = well_count

    copy_obj['dates']['end_date'] = end_date.strftime('%Y-%m-%d')
    copy_obj['fixed_expense'] = round(fixed_value * float(well_count), 4)
    objs.append(copy_obj)

    return objs


def create_expense_segment_from_periods(document, obj, period_list, original_period):
    new_obj = []
    if period_list:
        total_period = 0
        if CCSchemaEnum.dates.value in obj:
            for idx, values in enumerate(period_list):
                segment_obj = copy.deepcopy(obj)
                if len(new_obj) > 0:
                    total_period += (period_list[idx][0] - period_list[idx - 1][0])
                    del segment_obj[PhdwinPTEEnum.temporary_holder.value]
                    segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value] = new_obj[-1][
                        CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value]
                    try:
                        segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = (
                            pd.to_datetime(segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value]) +
                            pd.DateOffset(months=int(period_list[idx][0] - period_list[idx - 1][0]), days=-1)).strftime(
                                CCSchemaEnum.ymd_date_dash_format.value)
                    except ValueError:
                        segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = pd.to_datetime(
                            PHDWIN_ECON_LIMIT).strftime(CCSchemaEnum.ymd_date_dash_format.value)

                    segment_obj[EconEnum.fixed_exp.value] = document[EconEnum.value.value] * values[1]
                    new_obj.append(segment_obj)
                else:
                    total_period = values[0]
                    del segment_obj[PhdwinPTEEnum.temporary_holder.value]
                    segment_obj[EconEnum.fixed_exp.value] = document[EconEnum.value.value] * values[1]
                    try:
                        segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = (
                            pd.to_datetime(segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
                            + pd.DateOffset(months=int(period_list[idx][0]), days=-1)).strftime(
                                CCSchemaEnum.ymd_date_dash_format.value)
                    except ValueError:
                        segment_obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value] = pd.to_datetime(
                            PHDWIN_ECON_LIMIT).strftime(CCSchemaEnum.ymd_date_dash_format.value)
                    new_obj.append(segment_obj)
                if total_period == original_period:
                    break
    else:
        new_obj.append(copy.deepcopy(obj))
    return new_obj


def get_well_count_segment_periods_for_expense(start_date, end_date, selected_df):
    original_period = (end_date - start_date).days / DAYS_IN_MONTH
    period_list = []
    for i in range(selected_df.shape[0]):
        if selected_df.iloc[i, 1] > start_date and i == 0:
            period = int(round((selected_df.iloc[i, 1] - start_date).days / DAYS_IN_MONTH, 0))
            current_date = start_date + pd.DateOffset(months=period)
            if current_date >= end_date:
                period_list.append((original_period, 1))
                break
        elif selected_df.iloc[i, 1] > start_date:
            period = int(round((selected_df.iloc[i, 1] - start_date).days / DAYS_IN_MONTH, 0))
            current_date = start_date + pd.DateOffset(months=period)
            if current_date >= end_date:
                if len(period_list) > 0:
                    if period_list[-1][1] == selected_df.iloc[i - 1, 2]:
                        period_list[-1] = (original_period, selected_df.iloc[i - 1, 2])
                    else:
                        period_list.append((original_period, selected_df.iloc[i - 1, 2]))
                else:
                    period_list.append((original_period, selected_df.iloc[i - 1, 2]))
                break
            else:
                if len(period_list) > 0:
                    if period_list[-1][1] == selected_df.iloc[i - 1, 2]:
                        period_list[-1] = (period_list[-1][0] + period, selected_df.iloc[i - 1, 2])
                    else:
                        period_list.append((period_list[-1][0] + period, selected_df.iloc[i - 1, 2]))
                else:
                    period_list.append((period, selected_df.iloc[i - 1, 2]))
            start_date = selected_df.iloc[i, 1]

    if selected_df.iloc[-1, 1] < end_date:
        period = int(round((end_date - selected_df.iloc[-1, 1]).days / DAYS_IN_MONTH, 0))
        period_list.append((period, 1))

    return period_list


def get_dates_for_well_count(obj):
    start_date = None
    end_date = None
    if CCSchemaEnum.dates.value in obj:
        start_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.start_date.value])
        end_date = pd.to_datetime(obj[CCSchemaEnum.dates.value][CCSchemaEnum.end_date.value])

    return start_date, end_date


# def get_asof_date(df):
#     df[PhdHeaderCols.asof_date.value] = df.apply(lambda x: calculate_phdwin_date(x[PhdHeaderCols.asof_date.value]),
#                                                  axis=1)

#     return df.iloc[0][PhdHeaderCols.asof_date.value]


def get_fpd_dictionary(df):
    sop_act_df = df.loc[df[PhdHeaderCols.sop.value] != 0]
    if sop_act_df.empty:
        id_sop_dict = {}
    else:
        id_sop_dict = pd.Series(sop_act_df[PhdHeaderCols.sop.value].values,
                                index=sop_act_df[PhdHeaderCols.lse_id.value]).to_dict()

    return id_sop_dict


def process_expense_document_and_combine(document):
    # loop through expense type (fixed and variable)
    for expense_type in ['variable', 'fixed']:
        if expense_type == 'variable':
            # loop through phases
            for phase in [
                    PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
                    PhaseEnum.water.value
            ]:
                if phase != PhaseEnum.water.value:
                    for category in variable_expenses_category:
                        rows = document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                            EconEnum.rows.value]
                        rows = set_phdwin_end_date_to_econ_limit(rows)
                        variable_expense_rows = copy_rows(rows)
                        new_combined_rows = None
                        if len(variable_expense_rows) > 1:
                            new_combined_rows = sum_rows(variable_expense_rows)

                        if new_combined_rows is not None:
                            document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                                EconEnum.rows.value] = new_combined_rows
                else:
                    rows = document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value]
                    rows = set_phdwin_end_date_to_econ_limit(rows)
                    water_disposal_rows = copy_rows(rows)
                    new_combined_rows = None
                    if len(water_disposal_rows) > 1:
                        new_combined_rows = sum_rows(water_disposal_rows)

                    if new_combined_rows is not None:
                        document[EconEnum.econ_function.value][EconEnum.water_disposal.value][
                            EconEnum.rows.value] = new_combined_rows
        else:
            # loop through fixed expense category
            for category in FIXED_EXPENSE_CATEGORY:
                rows = document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                    EconEnum.rows.value]
                rows = set_phdwin_end_date_to_econ_limit(rows)
                fixed_expense_rows = copy_rows(rows)
                new_combined_rows = None
                if len(fixed_expense_rows) > 1:
                    new_combined_rows = sum_rows(fixed_expense_rows)

                if new_combined_rows is not None:
                    document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                        EconEnum.rows.value] = new_combined_rows
    return document


def convert_expense_dates_to_offset(document, lease_id_to_sop_dic, lease_to_well_id, tit_df):
    # get asof and fpd
    asof = pd.to_datetime(tit_df.at[0, 'Asof Date'], errors='coerce')
    fpd = get_phdwin_fpd_from_model_document(document, lease_id_to_sop_dic, lease_to_well_id)

    for expense_type in ['variable', 'fixed']:
        if expense_type == 'variable':
            # loop through phases
            for phase in [
                    PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.condensate.value,
                    PhaseEnum.water.value
            ]:
                if phase != PhaseEnum.water.value:
                    for category in variable_expenses_category:
                        rows = copy_rows(document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category]
                                         [EconEnum.rows.value])
                        rows = convert_dates_to_offset(rows, asof, fpd)

                        document[EconEnum.econ_function.value][EconEnum.var_exp.value][phase][category][
                            EconEnum.rows.value] = rows
                else:
                    rows = copy_rows(
                        document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value])
                    rows = convert_dates_to_offset(rows, asof, fpd)
                    document[EconEnum.econ_function.value][EconEnum.water_disposal.value][EconEnum.rows.value] = rows
        else:
            # loop through fixed expense category
            for category in FIXED_EXPENSE_CATEGORY:
                rows = copy_rows(
                    document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][EconEnum.rows.value])
                rows = convert_dates_to_offset(rows, asof, fpd)
                document[EconEnum.econ_function.value][EconEnum.fixed_expense.value][category][
                    EconEnum.rows.value] = rows

    return document


def get_new_fixed_assignment_dic():
    return copy.deepcopy(FIXED_EXPENSE_CATEGORY)


VARIABLE_PHDWIN_EXPENSE_DICT = {
    EconEnum.opt_cost_model.value: EconEnum.opc.value,
    EconEnum.trans_cost_var.value: EconEnum.transport.value,
    EconEnum.other_cost_var.value: EconEnum.other.value
}

PHDWIN_EXPENSE_TYPE = [
    'Scheduled Well Expense (Well Cost)', 'Scheduled Monthly Expense (Fixed Cost)',
    'Operating Cost Model (Variable Expense)', 'Trans Cost Model (Variable Expense)',
    'Other Cost Model (Variable Expense)', 'Well Cost', 'Fixed Cost'
]

variable_expenses_category = [
    EconEnum.gathering.value, EconEnum.opc.value, EconEnum.transport.value, EconEnum.market.value, EconEnum.other.value
]

phdwin_fixed_expense_categories = [
    EconEnum.sch_well_expense.value, EconEnum.sch_monthly_expense.value, EconEnum.well_cost.value,
    EconEnum.fixed_cost.value
]
PHDWIN_ECON_LIMIT = '4/11/2262'
