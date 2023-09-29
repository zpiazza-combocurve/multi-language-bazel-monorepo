import copy
import datetime
import numpy as np
import pandas as pd

from api.aries_phdwin_imports.error import ErrorMsgSeverityEnum
from api.aries_phdwin_imports.phdwin_helpers.general import get_dictionary, merge_two_dicts
from api.aries_phdwin_imports.helpers import (add_btu_from_ecf, check_near_equality, format_well_header_col)
from combocurve.shared.aries_import_enums import PhaseEnum, ForecastEnum
from combocurve.shared.date import date_from_index, days_from_1900
from combocurve.utils.constants import DAYS_IN_YEAR

NUMFORM_HANDLED_MAX = 30


def process_selected_forecast_df(df, property_id, ecf_df, product_name_map_dic, error_log, error_msg):
    # get dataframe for property_id
    selected_df = df.loc[df['Lse Id'] == property_id]

    # convert dataframe to 'acceptable' dataframe (main logic)
    lse_segment_df_ls, yield_multiplier_dict = process_lse_df_to_lse_segment_df(selected_df, product_name_map_dic,
                                                                                error_log, error_msg)

    # format the segment columns in dataframe
    lse_segment_df = format_lse_segment_df(lse_segment_df_ls)

    # strip all items in dataframe
    lse_segment_df = lse_segment_df.applymap(lambda x: x.strip() if type(x) is str else x)

    # add dates for formula ratio
    lse_segment_df = add_formula_ratio_dates(lse_segment_df)

    # add BTU from ECF
    lse_segment_df = add_btu_from_ecf(lse_segment_df, ecf_df)

    # remove formula line when a corresponding ratio is found
    # (e.g if a gor line is found remove all Gas that is defined as a typecurve)
    # any accepted multiplier effect from the 'gas' line is stored in the yield multiplier dict
    # this is added in the add_multiplier_for_yield
    # lse_segment_df = remove_formula_when_ratio(lse_segment_df)

    # add the effect of ratio phase to yield linw
    lse_segment_df = add_multiplier_for_yield(lse_segment_df, yield_multiplier_dict)

    lse_segment_df = remove_ratio_lines_that_have_invalid_formula(lse_segment_df, yield_multiplier_dict)

    return lse_segment_df


def add_multiplier_for_yield(df, seq_multiplier_dict):
    for arc_seq in seq_multiplier_dict:
        for key in seq_multiplier_dict[arc_seq]:
            if seq_multiplier_dict[arc_seq][key] == 1:
                continue
            for idx, row in df[(df.productname.astype(str).str.strip().str.lower() == key)
                               & (df.arcseqname.astype(str).str.strip().str.lower() == arc_seq)].iterrows():
                df.at[idx, 'qi'] = df.loc[idx, 'qi'] * seq_multiplier_dict[arc_seq][key][0]
                df.at[idx, 'qend'] = df.loc[idx, 'qend'] * seq_multiplier_dict[arc_seq][key][0]
    return df


def remove_ratio_lines_that_have_invalid_formula(df, seq_multiplier_dict):
    for arc_seq in df.arcseqname.unique():
        arc_seq = str(arc_seq).strip().lower()
        if arc_seq in seq_multiplier_dict:
            for key in seq_multiplier_dict[arc_seq]:
                if not seq_multiplier_dict[arc_seq][key][1]:
                    if key != 'ngl yield':
                        df = df[~((df.productname.astype(str).str.strip().str.lower() == key)
                                  & (df.arcseqname.astype(str).str.strip().str.lower() == arc_seq))]
        else:
            for key in YIELD_MULTIPLIER_DICT:
                if key != 'ngl yield':
                    df = df[~((df.productname.astype(str).str.strip().str.lower() == key)
                              & (df.arcseqname.astype(str).str.strip().str.lower() == arc_seq))]
    return df


def remove_formula_when_ratio(df):
    for key in RATIO_TO_BASE_CODE_DICT:
        if key in df.productcode.astype(str).str.strip().values:
            remove_row_item = RATIO_TO_BASE_CODE_DICT[key]

            df = df[~((df.productcode.astype(str).str.strip() == remove_row_item) &
                      (df.typecurve.astype(str).str.strip() == '6'))]
    return df


def process_all_well_phdwin_forecast_df(for_df, idc_df, uni_df, pnf_df, arc_df, lease_id_to_exclsum_dic):

    # add product name and arcseqname to Forecast dataframe
    df, seq_to_forecast_name_dic, product_code_to_name_dict = add_product_name_and_arcseqname_to_for_df(
        for_df, pnf_df, arc_df)

    # map numform tables to Formula
    df = process_numform_to_formula(df, product_code_to_name_dict)

    # remove excluded wells from Forecast Dataframe
    df = preprocess_phdwin_forecast_df(df, lease_id_to_exclsum_dic)

    # add phdwin id column to table
    df = add_idc_to_forecast_table(df, idc_df)

    # get the unit name
    df = map_units_to_forecast_df(df, uni_df)

    # create filter list to select needed column
    df = filter_required_forecast_df_columns(df)

    # store forecast_df in global scope for stream_properties data conversions and extraction
    if df.empty:
        return None, {}, {}

    # default '1899-12-30', the raw data from PHDWin need to correct by -99 years and 2 days
    df = process_start_and_end_date_of_forecast_df(df)

    # strip all string in whole dataframe
    df = df.applymap(lambda x: x.strip() if type(x) is str else x)

    return df, seq_to_forecast_name_dic, product_code_to_name_dict


def add_product_name_and_arcseqname_to_for_df(df, pnf_df, arc_df):
    productcode_descr_dict = pd.Series(pnf_df['Descr'].values, index=pnf_df['Productcode']).to_dict()
    seq_abbrev_dict = pd.Series(arc_df['Abbrev'].values, index=arc_df['Seq']).to_dict()

    # add key value pair, 65534: 'default' to Seq_Abbrev_dict, since it's not in .ARC.csv
    seq_abbrev_dict = merge_two_dicts(get_dictionary('Seq_Abbrev_dict'), seq_abbrev_dict)

    df["Productname"] = df["Productcode"].map(productcode_descr_dict)
    df["Arcseqname"] = df["Arcseq"].map(seq_abbrev_dict)

    return df, seq_abbrev_dict, productcode_descr_dict


def add_formula_ratio_dates(df):
    columns = ['start_date', 'start_year', 'start_month', 'start_day', 'end_date', 'end_year', 'end_month', 'end_day']
    delete_idx = []
    for idx, row in df[(df['typecurve'] == 6) | (df['typecurve'] == 10)].iterrows():
        compare_base_phase = str(row.base_phase).strip().lower()
        arc_seqname = str(row.arcseqname).strip().lower()
        by_phase_df = df[((df.productname.astype(str).str.strip().str.lower() == compare_base_phase) &
                          (df.arcseqname.astype(str).str.strip().str.lower() == arc_seqname))]

        if by_phase_df.empty:
            if compare_base_phase in BASE_PHASE_YIELD_DICT:
                for _yield in BASE_PHASE_YIELD_DICT.get(compare_base_phase):
                    by_phase_df = df[((df.productname.astype(str).str.strip().str.lower() == _yield) &
                                      (df.arcseqname.astype(str).str.strip().str.lower() == arc_seqname))]
                    if by_phase_df.empty:
                        continue
                    else:
                        break
        if by_phase_df.empty:
            delete_idx.append(idx)
            continue

        by_phase_df.reset_index(inplace=True, drop=True)
        date_values = {}
        last_idx = by_phase_df.shape[0] - 1
        for column in columns:
            use_idx = last_idx if column.startswith('end') else 0
            date_values[column] = by_phase_df.loc[use_idx, column]

        for column, value in date_values.items():
            df.at[idx, column] = value

    df = df.drop(df.index[delete_idx])
    df.reset_index(inplace=True, drop=True)

    return df


def check_for_incremental_forecast(document, parent_incremental_dict, lse_id_curarcseq_dic):
    """Updates Forecast name if well is an incremental
    Args:
        document (dictionary): Forecast document for well and segment
        parent_incremental_dict (dictionary): Dictionary containing the parent lease number as key and its associated
                                              incremental lease numbers (list) as values
        lse_to_db_id (dictionary): Dictionary with key as lease id and value as the well_id (mongo)
        lse_id_curarcseq_dic (dictionary): Dictionary with key as lease id and value as the active archive for well
    Returns:
        document: updated document changing the forecast name if well is increm
    """
    # get the well associated with forecast
    well_id = str(document['lse_id'])
    # convert all lease ids to string (a precautionary thing)
    str_lse_id_curarcseq_dic = {str(k): v for k, v in lse_id_curarcseq_dic.items()}
    # get the curarcseq associated with this well
    curarcseq = str(str_lse_id_curarcseq_dic.get(well_id))
    # get arcseq of the forecast
    forecast_arcseq = str(document['arcseq'])
    # only set as an INCREMENTAL forecast IFF the forecast arc seq matches with the wells current arcseq
    if curarcseq == forecast_arcseq:
        for incr_lse_ids in parent_incremental_dict.values():
            if well_id in incr_lse_ids:
                incremental_index = incr_lse_ids.index(well_id)
                forecast_name = 'INCREMENTALS' if incremental_index == 0 else f'INCREMENTALS_{incremental_index+1}'
                document['arcseqname'] = forecast_name
                break
    return document


def preprocess_phdwin_forecast_df(df, lease_id_to_exclsum_dic):
    """
    Remove excluded wells from from forecast dataframe
    """
    df['Exclsum'] = df['Lse Id'].map(lease_id_to_exclsum_dic)
    df = df.loc[(df['Exclsum'] == 0)]
    del df['Exclsum']

    # filter out those well_id which do not have start date (Segmentdate[0])
    df = df.loc[(df['Segmentdate[0]'] != 0) | (df['Eurvol'] != 0) | (df['Typecurve'] == 10)]

    return df


def add_idc_to_forecast_table(df, idc_df):
    '''
    Adds PHDWIN ID to Forecast dataframe
    '''
    idc_df = idc_df.loc[(idc_df['Lblnum'] == 7)]
    idc_df['Idval'] = idc_df['Idval'].apply(lambda x: x.strip())
    lseid_idval_dict = pd.Series(idc_df['Idval'].values, index=idc_df['Lse Id']).to_dict()
    df["phdwin_id"] = df["Lse Id"].map(lseid_idval_dict)

    return df


def map_units_to_forecast_df(df, uni_df):
    uniid_abbr_dict = pd.Series(uni_df['Abbr'].values, index=uni_df['Uni Id']).to_dict()
    df["Unitsn name"] = df["Unitsn"].map(uniid_abbr_dict)
    df["Unitsd name"] = df["Unitsd"].map(uniid_abbr_dict)

    return df


def filter_required_forecast_df_columns(df):
    ls_column_segment_all = []
    for idx in range(10):
        idx = str(idx)
        ls_column_segment_all += [
            'Segmentdate[' + idx + ']', 'Segmentend[' + idx + ']', 'Q Beg[' + idx + ']', 'Q End[' + idx + ']',
            'Decline[' + idx + ']', 'N Factor[' + idx + ']', 'Declmin[' + idx + ']', f'Productrisk[{idx}]'
        ]

    df = df.filter(items=BASIC_COLUMNS_FOR_FORECAST + ls_column_segment_all)

    return df


def process_start_and_end_date_of_forecast_df(df):
    for idx in range(10):
        # process start date
        start_date_array = pd.to_numeric(df[f'Segmentdate[{idx}]'], errors='coerce').replace(np.nan,
                                                                                             0).astype(int).values
        start_date_array = start_date_array + np.datetime64('1800-12-28')
        start_date_array[start_date_array > np.datetime64('2262-04-11')] = np.datetime64('2262-04-11')
        df[f'start date {idx}'] = start_date_array

        # process end date
        end_date_array = pd.to_numeric(df[f'Segmentend[{idx}]'], errors='coerce').replace(np.nan, 0).astype(int).values
        end_date_array = end_date_array + np.datetime64('1800-12-28')
        end_date_array[end_date_array > np.datetime64('2262-04-11')] = np.datetime64('2262-04-11')
        df[f'end date {idx}'] = end_date_array

    return df


def get_segment_end_date_dict(for_df):
    segmentdate_zero_for_df = for_df.loc[for_df['Segmentdate[0]'] != 0]  # noqa: F841

    for_df['Lse Id str'] = for_df['Lse Id'].astype(str)
    for_df['Arcseq str'] = for_df['Arcseq'].astype(str)
    for_df['Productcode str'] = for_df['Productcode'].astype(str)
    for_df['Id_Arcseq'] = for_df['Lse Id str'].values + '_' + for_df['Arcseq str'].values
    for_df['Id_Arcseq_Productcode'] = for_df['Lse Id str'].values + '_' + for_df['Arcseq str'].values + '_' + for_df[
        'Productcode str'].values

    idx = 0
    start_date_array = pd.to_numeric(for_df[f'Segmentdate[{idx}]'], errors='coerce').replace(np.nan,
                                                                                             0).astype(int).values
    start_date_array = start_date_array + np.datetime64('1800-12-28')
    start_date_array[start_date_array > np.datetime64('2262-04-11')] = np.datetime64('2262-04-11')

    # process end date
    end_date_array = pd.to_numeric(for_df[f'Segmentend[{idx}]'], errors='coerce').replace(np.nan, 0).astype(int).values
    end_date_array = end_date_array + np.datetime64('1800-12-28')
    end_date_array[end_date_array > np.datetime64('2262-04-11')] = np.datetime64('2262-04-11')
    # seg1 == prodseg1
    id_arcseq_segmentdate0_dict = pd.Series(start_date_array, index=for_df['Id_Arcseq']).to_dict()

    # majseg1 or minseg1 (if major phase(productcode == 1), then minor phase(productcode == 2), vice versa)
    id_arcseq_productcode_segmentdate0_dict = pd.Series(start_date_array,
                                                        index=for_df['Id_Arcseq_Productcode']).to_dict()

    # # majdecl1 (also for MSC EndPrj)
    id_arcseq_productcode_segmentend0_dict = pd.Series(end_date_array, index=for_df['Id_Arcseq_Productcode']).to_dict()

    return (id_arcseq_segmentdate0_dict, id_arcseq_productcode_segmentdate0_dict,
            id_arcseq_productcode_segmentend0_dict)


def process_lse_df_to_lse_segment_df(selected_df, product_name_map_dic, error_log, error_msg):  # noqa (C901)
    # sort the dataframe by Arcseq and Productcode
    selected_df.sort_values(by=['Arcseq', 'Productcode'], ascending=True, inplace=True)

    # create new df for holding each segment
    lse_segment_df_ls = []
    yield_multiplier_dict = {}
    # loop through each row in df
    for index, row_selected in selected_df.iterrows():
        # intiate end variable used for type curves, as the end of a type curve is not defined with 0 (1800-12-28)
        # if a type curve formula is defined it needs to be appended to new segment ls and end the horizontal search
        # using end = True
        end = False

        # search horizontally and stack vertically
        # A1 B1 C1 A2 B2 C2
        # converted to
        # A1 A2
        # B1 B2
        # C1 C2
        for idx in range(10):

            # get segement column names to be earched horizontally
            idx = str(idx)
            ls_column_segment = [
                'start date ' + idx, 'end date ' + idx, 'Q Beg[' + idx + ']', 'Q End[' + idx + ']',
                'Decline[' + idx + ']', 'N Factor[' + idx + ']', 'Declmin[' + idx + ']', f'Productrisk[{idx}]'
            ]

            # filter to see only key columns and columns to search
            filter_row_selected = row_selected.filter(items=BASIC_COLUMNS_FOR_FORECAST + ls_column_segment)

            # initialize base phase and ratio value which will be a columns of the new df, so must have a value
            ratio_value = None
            base_phase = None

            # year == 1800 means the raw data is 0, then break the for loop, searching next segment
            if filter_row_selected['start date ' + idx].year == 1800:
                if filter_row_selected['Typecurve'] == 10:
                    product_name = str(filter_row_selected['Productname']).strip().lower()
                    phase = YIELD_BASE_RATE_DICT.get(product_name)
                    if phase is None:
                        break
                    base_phase = phase[-1]
                    end = True

                # Type Curve == 6 signified use of formula
                elif filter_row_selected['Typecurve'] == 6:

                    # get phase of row
                    phase = str(filter_row_selected['Productname']).strip().lower()

                    # if phase is gas, oil, water and ngl
                    if phase in ACCEPTABLE_RATIO_PHASE:

                        # get formula string
                        formula_string = filter_row_selected['formula']

                        # get all the products identified in the string
                        phases_in_string = [
                            phase for phase in [str(value).strip().lower() for value in product_name_map_dic.values()]
                            if phase in formula_string
                        ]

                        # get arcseq name
                        arcseqname = str(filter_row_selected['Arcseqname']).strip().lower()

                        # current condition
                        # must be a single variable
                        # must be a valid base phase in ComboCurve ('oil', 'gas', 'water')
                        if len(phases_in_string) == 1 and phases_in_string[0] in ACCEPTBLE_BASE_PHASE:
                            # get base phase and formula string
                            base_phase = phases_in_string[0]
                            eval_string = formula_string

                            # NGL can only be handle gas as its base phase in ComboCurve
                            if phase == 'ngl' and base_phase != 'gas':
                                break

                            # replace the base phase with 1 and evaluate the string
                            # since we know that it has a single variable which is also the base phase
                            # if we replace with 1
                            # it means that the evaluated value is the ratio of the phase:base_phase
                            eval_string = eval_string.replace(base_phase, '1')

                            try:
                                value = eval(eval_string)
                            except Exception as e:
                                error_log.log_error(message=error_msg.formula_evaluation_error,
                                                    well=filter_row_selected['Lse Id'],
                                                    severity=ErrorMsgSeverityEnum.error.value,
                                                    exception=e)

                            # get the numerator unit for the current phase
                            numerator = str(filter_row_selected['Unitsn name']).strip().lower()

                            # get the denominator of the base phase
                            # this requires getting base phase row for the arcseqname of the row being looked at
                            base_phase_unit_df = selected_df[
                                (selected_df['Productname'].astype(str).str.lower().str.strip() == phases_in_string[0])
                                & (selected_df['Arcseqname'].astype(str).str.lower().str.strip() == arcseqname
                                   )]['Unitsn name']
                            if base_phase_unit_df.shape[0] > 0:
                                denominator = str(base_phase_unit_df.values[-1]).strip().lower()

                                # get the unit which is numerator vs denominator
                                # conversion converts the value to bbl/mcf or mcf/bbl or bbl/bbl
                                unit = f'{numerator}/{denominator}'
                                ratio_value = flow_rate_unit_conversion(value, unit)

                                # as ratio value has been initialized set end to True
                                end = True

                        # in cases where there are two products identified
                        # one must be a yield that is a key in the yield base rate dict
                        # the other must be a the base phase of the said yield
                        # and the phase  in the current row must match the ratio phase of the yield
                        elif len(phases_in_string) == 2:

                            # check if any of the phases in the string is in the YIELD_BASE_RATE_DICT
                            # the YIELD_BASE_RATE_DICT stores the accepted yields as keys
                            # the values are lists with first item being the 'ratio' phase and 2nd item the base phase
                            if any(str_phase in YIELD_BASE_RATE_DICT for str_phase in phases_in_string):

                                # get the yield type
                                yield_var = next(str_phase for str_phase in phases_in_string
                                                 if str_phase in YIELD_BASE_RATE_DICT)

                                # store the ratio phase and base phase from the YIELD_BASE_RATE_DICT
                                ratio_phase, base_phase = YIELD_BASE_RATE_DICT.get(yield_var)

                                # confirm that the ratio_phase, base_phase and yield name conditions has been met
                                if all(phase_type in phases_in_string
                                       for phase_type in [base_phase, yield_var]) and phase == ratio_phase:

                                    # get formula string
                                    eval_string = formula_string

                                    # replace the both the base phase variable and yield name with 1
                                    # to get the factor for the yield
                                    eval_string = eval_string.replace(yield_var, '1').replace(base_phase, '1')

                                    try:
                                        value = eval(eval_string)
                                    except Exception as e:
                                        error_log.log_error(message=error_msg.formula_evaluation_error,
                                                            well=filter_row_selected['Lse Id'],
                                                            severity=ErrorMsgSeverityEnum.error.value,
                                                            exception=e)

                                    # get the unit of the base phase
                                    # and update the value based on the base phase unit
                                    base_phase_unit_df = selected_df[
                                        (selected_df['Productname'].astype(str).str.lower().str.strip() == base_phase)
                                        & (selected_df['Arcseqname'].astype(str).str.lower().str.strip() == arcseqname
                                           )]['Unitsn name']
                                    if base_phase_unit_df.shape[0] > 0:
                                        unit = str(base_phase_unit_df.values[-1]).strip().lower()
                                        value = flow_rate_unit_conversion(value, unit)

                                        # update yield_multiplier_dict
                                        if arcseqname not in yield_multiplier_dict:
                                            yield_multiplier_dict[arcseqname] = copy.deepcopy(YIELD_MULTIPLIER_DICT)
                                        yield_multiplier_dict[arcseqname][yield_var][0] *= value
                                        yield_multiplier_dict[arcseqname][yield_var][1] = True
                                        break
                                    else:
                                        break
                                else:
                                    break
                            else:
                                break
                        else:
                            break
                    else:
                        break
                else:
                    break

            # default '1899-12-30', the raw data from PHDWin need to correct by -99 years and 2 days

            # add year, month, date (3 columns) for both t start and t end
            # 'Segmentdate[' + idx + ']' is in DatetimeIndex type,
            # so no need use .dt to get year, month, day to return!!
            start_year = filter_row_selected['start date ' + idx].year
            start_month = filter_row_selected['start date ' + idx].month
            start_day = filter_row_selected['start date ' + idx].day

            end_year = filter_row_selected['end date ' + idx].year
            end_month = filter_row_selected['end date ' + idx].month
            end_day = filter_row_selected['end date ' + idx].day

            start_date = datetime.date(start_year, start_month, start_day).strftime('%Y-%m-%d')
            end_date = datetime.date(end_year, end_month, end_day).strftime('%Y-%m-%d')

            lse_segment_df_ls.append(filter_row_selected.values.tolist() + [
                start_year, start_month, start_day, end_year, end_month, end_day,
                int(idx) + 1, start_date, end_date, base_phase, ratio_value
            ])
            if end:
                break

    return lse_segment_df_ls, yield_multiplier_dict


def format_lse_segment_df(lse_segment_df_ls):

    lse_segment_df = pd.DataFrame.from_records(lse_segment_df_ls, columns=PHDWIN_FORECAST_COLUMN)

    ls_order_column = BASIC_COLUMNS_FOR_FORECAST \
        + ['Segment sequence'] \
        + ['start Year', 'start Month', 'start Day', ] \
        + ['end Year', 'end Month', 'end Day', ] \
        + ['qi', 'qend', 'B', 'Deff', 'Dm', 'Productrisk', 'ratio_value', 'base_phase'] \
        + ['start_date', 'end_date']
    lse_segment_df = lse_segment_df[ls_order_column]

    lse_segment_df.columns = format_well_header_col(lse_segment_df.columns)

    return lse_segment_df


def process_numform_to_formula(df, pn_dict):

    pnf_dict_str = {str(k): str(v).strip().lower() for k, v in pn_dict.items()}
    max_count = df.Numcount.max() if df.Numcount.max() <= NUMFORM_HANDLED_MAX else NUMFORM_HANDLED_MAX

    column_minus_numform = [item for item in df.columns if 'Numform[' not in item]

    numform_cols = [f'Numform[{i}].{item}' for i in range(max_count) for item in NUMFORM_ATTRIBUTE]

    numform_df = df[numform_cols].values

    formula_array = np.apply_along_axis(process_segment, 1, numform_df, pnf_dict_str)
    new_df = df[column_minus_numform]

    new_df = new_df.assign(formula=formula_array)
    new_df['formula'] = new_df.formula.replace(np.nan, '')

    return new_df


def create_numform_ls(df, max_count):
    numform_ls = []
    for idx, row in df.iterrows():
        final_ls = []
        for i in range(max_count):
            temp_ls = []
            for item in NUMFORM_ATTRIBUTE:
                temp_ls.append(str(row[f'Numform[{i}].{item}']))
            final_ls.append(' '.join(temp_ls))
        numform_ls.append(final_ls)

    return numform_ls


def process_list(ls):
    return [float(item) if float(item) - int(float(item)) > 0 else int(float(item)) for item in ls]


def divide_chunks(array, chunk):
    # looping till length l
    for i in range(0, len(array), chunk):
        yield array[i:i + chunk]


def process_segment(row, phase_dict):
    str_ls = []
    for operator in list(divide_chunks(row, len(NUMFORM_ATTRIBUTE))):
        if row.sum() == 0:
            return None
        attributes = process_list(operator)
        use_idx = VAL_TYPE_DICT.get(str(attributes[0]))
        if use_idx:
            if use_idx[-1] == 'v':
                str_ls.append(str(attributes[use_idx[0]]))
            elif use_idx[-1] == 'p':
                if str(attributes[use_idx[0]]) in phase_dict:
                    str_ls.append(phase_dict.get(str(attributes[use_idx[0]])).strip())
                else:
                    break
            elif use_idx[-1] == 's':
                if str(attributes[use_idx[0]]) in SIGN_DICT:
                    str_ls.append(SIGN_DICT.get(str(attributes[use_idx[0]])))
                else:
                    break
        else:
            break
    return ' '.join(str_ls)


def validate_unit(unit):
    if unit in phdwin_flow_rate_unit_dict:
        return unit
    elif '/' in unit:
        if len(unit.split('/')) == 2:
            if unit.split('/')[0] in phdwin_flow_rate_unit_dict and unit.split('/')[1] in phdwin_flow_rate_unit_dict:
                return unit


def flow_rate_unit_conversion(q, unit):
    unit = validate_unit(unit)
    if unit is not None:
        if '/' in unit:
            q = q * phdwin_flow_rate_unit_dict.get(
                unit.split('/')[0]) * (1 / phdwin_flow_rate_unit_dict.get(unit.split('/')[1]))
        else:
            q = q * phdwin_flow_rate_unit_dict.get(unit)
        return q
    return q


def update_qi_from_forecast_parameters(document, exponential=False, arps=False, arps_mod=False):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    deff_phd = document['deff']
    q_end = document['qend']
    d = -np.log(1 - deff_phd / 100) / DAYS_IN_YEAR
    b = document[ForecastEnum.b.value]
    if exponential:
        document['qi'] = q_end / np.exp(-d * (end_idx - start_idx))
    elif arps:
        document['qi'] = q_end / np.power(1 + b * d * (end_idx - start_idx), -1 / b)
    elif arps_mod:
        pass
        # d_lim_eff = np.abs(document['dm'] / 100)
        # success, qi, _, _ = get_phdwin_arps_mod_parameters(start_idx, q_end, b, d, d_lim_eff, initial=True)
        # if success:
        #     document['qi'] = qi
        # else:
        #     document['qi'] = q_end / np.exp(-d * (end_idx - start_idx))
    return document


def update_d_from_forecast_parameters(document, exponential=False, arps=False, arps_mod=False):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    end_date = datetime.date(document['end_year'], document['end_month'], document['end_day'])
    end_idx = days_from_1900(end_date)
    qi = document['qi']
    qend = document['qend']

    if exponential:
        d_inpt = -np.log(qend / qi) / (end_idx - start_idx)
        document['deff'] = (1 - np.exp(-d_inpt * DAYS_IN_YEAR)) * 100
    elif arps:
        b = document[ForecastEnum.b.value]
        d_inpt = (np.power((qi / qend), b) - 1) / (b * (end_idx - start_idx))
        document['deff'] = (1 - np.exp(-d_inpt * DAYS_IN_YEAR)) * 100
    elif arps_mod:
        pass
    return document


def update_end_date_from_forecast_parameters(document, exponential=False, arps=False, arps_mod=False):
    start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
    start_idx = days_from_1900(start_date)
    qi = document['qi']
    qend = document['qend']
    deff_phd = document['deff']
    d = -np.log(1 - deff_phd / 100) / DAYS_IN_YEAR
    if exponential:
        end_idx = int(round(-np.log(qend / qi) / d) + start_idx)
        end_date = date_from_index(end_idx)

        document['end_year'] = end_date.year
        document['end_month'] = end_date.month
        document['end_day'] = end_date.day
    elif arps:
        b = document[ForecastEnum.b.value]
        end_idx = int(((np.power((qi / qend), b) - 1) / (b * d)) + start_idx)
        end_date = date_from_index(end_idx)

        document['end_year'] = end_date.year
        document['end_month'] = end_date.month
        document['end_day'] = end_date.day
    elif arps_mod:
        pass
        # b = document[ForecastEnum.b.value]
        # d_lim_eff = np.abs(document['dm'] / 100)
        # success, q_sw, d_sw, sw_idx = get_phdwin_arps_mod_parameters(start_idx, qi, b, d, d_lim_eff)
        # try:
        #     if success:
        #         end_idx = int((-np.log(qend / q_sw) / d_sw) + sw_idx)
        #     else:
        #         end_idx = int((-np.log(qend / qi) / d) + start_idx)

        #     end_date = date_from_index(end_idx)
        #     document['end_year'] = end_date.year
        #     document['end_month'] = end_date.month
        #     document['end_day'] = end_date.day

    return document


def verify_segment_merge(document, forecastname, well, phase, forecast_datas_dic):
    phase = str(phase).strip().lower()
    if (forecastname, well) in forecast_datas_dic:
        saved_document = forecast_datas_dic[(forecastname, well)]
        if phase in ACCECPTABLE_RATE_PHASE:
            segments = saved_document[ForecastEnum.data.value][phase][ForecastEnum.p_dict.value][
                ForecastEnum.best.value][ForecastEnum.segments.value]
            start_date = datetime.date(document['start_year'], document['start_month'], document['start_day'])
            start_idx = days_from_1900(start_date)
            if len(segments) != 0 and check_near_equality(segments[-1]['end_idx'], start_idx, tolerance=1):
                start_idx = segments[-1]['end_idx'] + 1
                start_date = date_from_index(start_idx)
                document['start_year'] = start_date.year
                document['start_month'] = start_date.month
                document['start_day'] = start_date.day
                document['start_date'] = start_date

    return document


def calculate_select_forecast_parameters(document):

    # get required parameters
    phd_b = document['b']
    phd_deff = document['deff']
    phd_dm = document['dm']
    phd_risk = document['productrisk']

    # identify forecast type
    exponential = phd_b == 0 and phd_deff != 0
    arps = phd_b > 0 and phd_dm == 0
    arps_modified = phd_b > 0 and phd_dm > 0

    # currently not handling calculation for ratio/yields
    document = identify_and_calculate_parameters_phdwin_forecast_import(document,
                                                                        phd_risk,
                                                                        exponential=exponential,
                                                                        arps=arps,
                                                                        arps_mod=arps_modified)

    return document


def identify_and_calculate_parameters_phdwin_forecast_import(document,
                                                             phd_risk,
                                                             exponential=False,
                                                             arps=False,
                                                             arps_mod=False):
    if phd_risk == 18:
        # calc qi
        document = update_qi_from_forecast_parameters(document, exponential=exponential, arps=arps, arps_mod=arps_mod)
    elif phd_risk == 24:
        # calc De
        document = update_d_from_forecast_parameters(document, exponential=exponential, arps=arps, arps_mod=arps_mod)
    elif phd_risk == 48:
        # calc End Date
        update_end_date_from_forecast_parameters(document, exponential=exponential, arps=arps, arps_mod=arps_mod)

    return document


NUMFORM_ATTRIBUTE = ['VALUETYPE', 'PCODE', 'PRODVALTYPE', 'ACTION', 'VALUEREAL', 'DATEVAL']
PHDWIN_FORECAST_COLUMN = [
    'phdwin_id', 'Lse Id', 'Arcseq', 'Productcode', 'Typecurve', 'Unitsn', 'Unitsd', 'Unitsn name', 'Unitsd name',
    'Productname', 'Arcseqname', 'Projhasprecedence', 'formula', 'start date', 'end date', 'qi', 'qend', 'Deff', 'B',
    'Dm', 'Productrisk', 'start Year', 'start Month', 'start Day', 'end Year', 'end Month', 'end Day',
    'Segment sequence', 'start_date', 'end_date', 'base_phase', 'ratio_value'
]
BASIC_COLUMNS_FOR_FORECAST = [
    'phdwin_id', 'Lse Id', 'Arcseq', 'Productcode', 'Typecurve', 'Unitsn', 'Unitsd', 'Unitsn name', 'Unitsd name',
    'Productname', 'Arcseqname', 'Projhasprecedence', 'formula'
]

ACCEPTABLE_RATIO_PHASE = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.ngl.value, PhaseEnum.water.value]
ACCEPTBLE_BASE_PHASE = [PhaseEnum.oil.value, PhaseEnum.gas.value, PhaseEnum.water.value]

RATIO_TO_BASE_CODE_DICT = {'9': '1', '10': '2', '11': '3', '29': '3', '34': '3', '40': '21', '46': '21'}

VAL_TYPE_DICT = {'0': '', '1': [4, 'v'], '2': [1, 'p'], '3': [3, 's']}

SIGN_DICT = {'1': '*', '2': "+", '3': '-', '4': '/', '13': '(', '14': ')'}

YIELD_BASE_RATE_DICT = {
    'gor': [PhaseEnum.gas.value, PhaseEnum.oil.value],
    'yield': [PhaseEnum.oil.value, PhaseEnum.gas.value],
    'ngl yield': [PhaseEnum.ngl.value, PhaseEnum.gas.value],
    'wor': [PhaseEnum.water.value, PhaseEnum.oil.value],
    'wgr': [PhaseEnum.water.value, PhaseEnum.gas.value]
}

phdwin_flow_rate_unit_dict = {
    'scf': 0.001,
    'mcf': 1,
    'mmcf': 1000,
    'bcf': 1000000,
    'tcf': 1000000000,
    'bbl': 1,
    'gal': 1 / 42,
    'mgal': 1000 / 42,
    'mbbl': 1000,
    'mmbbl': 1000000,
    'bbbl': 1000000000
}

# initiate yield multiplier dict that stores the multiplier
YIELD_MULTIPLIER_DICT = {
    'gor': [1, False],
    'yield': [1, False],
    'ngl yield': [1, False],
    'wor': [1, False],
    'wgr': [1, False]
}

BASE_PHASE_YIELD_DICT = {'gas': ['gor'], 'oil': ['yield'], 'water': ['wor', 'gor']}

ACCECPTABLE_RATE_PHASE = ['oil', 'gas', 'water']


def get_forecast_use_cols():
    to_remove = []
    for i in range(NUMFORM_HANDLED_MAX, 100):
        for attribute in NUMFORM_ATTRIBUTE:
            to_remove.append(f'Numform[{i}].{attribute}')

    return [item for item in ALL_FORECAST_COLUMNS if item not in to_remove]


ALL_FORECAST_COLUMNS = [
    'Rec No', 'Lse Id', 'Arcseq', 'Productcode', 'Productpline', 'Cumxprod', 'Unitsn', 'Unitsd', 'Decimalpts',
    'Productsymbol', 'Productline', 'Typecurve', 'Typehist', 'Projhasprecedence', 'Productcolor', 'Segmentdate[0]',
    'Segmentdate[1]', 'Segmentdate[2]', 'Segmentdate[3]', 'Segmentdate[4]', 'Segmentdate[5]', 'Segmentdate[6]',
    'Segmentdate[7]', 'Segmentdate[8]', 'Segmentdate[9]', 'Segmentend[0]', 'Segmentend[1]', 'Segmentend[2]',
    'Segmentend[3]', 'Segmentend[4]', 'Segmentend[5]', 'Segmentend[6]', 'Segmentend[7]', 'Segmentend[8]',
    'Segmentend[9]', 'Begcum[0]', 'Begcum[1]', 'Begcum[2]', 'Begcum[3]', 'Begcum[4]', 'Begcum[5]', 'Begcum[6]',
    'Begcum[7]', 'Begcum[8]', 'Begcum[9]', 'Endcum[0]', 'Endcum[1]', 'Endcum[2]', 'Endcum[3]', 'Endcum[4]', 'Endcum[5]',
    'Endcum[6]', 'Endcum[7]', 'Endcum[8]', 'Endcum[9]', 'Q Beg[0]', 'Q Beg[1]', 'Q Beg[2]', 'Q Beg[3]', 'Q Beg[4]',
    'Q Beg[5]', 'Q Beg[6]', 'Q Beg[7]', 'Q Beg[8]', 'Q Beg[9]', 'Q End[0]', 'Q End[1]', 'Q End[2]', 'Q End[3]',
    'Q End[4]', 'Q End[5]', 'Q End[6]', 'Q End[7]', 'Q End[8]', 'Q End[9]', 'Decline[0]', 'Decline[1]', 'Decline[2]',
    'Decline[3]', 'Decline[4]', 'Decline[5]', 'Decline[6]', 'Decline[7]', 'Decline[8]', 'Decline[9]', 'Declmin[0]',
    'Declmin[1]', 'Declmin[2]', 'Declmin[3]', 'Declmin[4]', 'Declmin[5]', 'Declmin[6]', 'Declmin[7]', 'Declmin[8]',
    'Declmin[9]', 'N Factor[0]', 'N Factor[1]', 'N Factor[2]', 'N Factor[3]', 'N Factor[4]', 'N Factor[5]',
    'N Factor[6]', 'N Factor[7]', 'N Factor[8]', 'N Factor[9]', 'Productrisk[0]', 'Productrisk[1]', 'Productrisk[2]',
    'Productrisk[3]', 'Productrisk[4]', 'Productrisk[5]', 'Productrisk[6]', 'Productrisk[7]', 'Productrisk[8]',
    'Productrisk[9]', 'Cumvol', 'Remvol', 'Eurvol', 'Streamswitch[0]', 'Streamswitch[1]', 'Streamswitch[2]',
    'Streamswitch[3]', 'Streamswitch[4]', 'Streamswitch[5]', 'Streamswitch[6]', 'Streamswitch[7]', 'Streamswitch[8]',
    'Streamswitch[9]', 'Streamswitch[10]', 'Streamswitch[11]', 'Streamswitch[12]', 'Streamswitch[13]',
    'Streamswitch[14]', 'Streamswitch[15]', 'Streamswitch[16]', 'Streamswitch[17]', 'Streamswitch[18]',
    'Streamswitch[19]', 'Histsym', 'Projsym', 'Projoverhist', 'Balance', 'Dateofbalance', 'Numcount',
    'Numform[0].VALUETYPE', 'Numform[0].PCODE', 'Numform[0].PRODVALTYPE', 'Numform[0].ACTION', 'Numform[0].VALUEREAL',
    'Numform[0].DATEVAL', 'Numform[1].VALUETYPE', 'Numform[1].PCODE', 'Numform[1].PRODVALTYPE', 'Numform[1].ACTION',
    'Numform[1].VALUEREAL', 'Numform[1].DATEVAL', 'Numform[2].VALUETYPE', 'Numform[2].PCODE', 'Numform[2].PRODVALTYPE',
    'Numform[2].ACTION', 'Numform[2].VALUEREAL', 'Numform[2].DATEVAL', 'Numform[3].VALUETYPE', 'Numform[3].PCODE',
    'Numform[3].PRODVALTYPE', 'Numform[3].ACTION', 'Numform[3].VALUEREAL', 'Numform[3].DATEVAL', 'Numform[4].VALUETYPE',
    'Numform[4].PCODE', 'Numform[4].PRODVALTYPE', 'Numform[4].ACTION', 'Numform[4].VALUEREAL', 'Numform[4].DATEVAL',
    'Numform[5].VALUETYPE', 'Numform[5].PCODE', 'Numform[5].PRODVALTYPE', 'Numform[5].ACTION', 'Numform[5].VALUEREAL',
    'Numform[5].DATEVAL', 'Numform[6].VALUETYPE', 'Numform[6].PCODE', 'Numform[6].PRODVALTYPE', 'Numform[6].ACTION',
    'Numform[6].VALUEREAL', 'Numform[6].DATEVAL', 'Numform[7].VALUETYPE', 'Numform[7].PCODE', 'Numform[7].PRODVALTYPE',
    'Numform[7].ACTION', 'Numform[7].VALUEREAL', 'Numform[7].DATEVAL', 'Numform[8].VALUETYPE', 'Numform[8].PCODE',
    'Numform[8].PRODVALTYPE', 'Numform[8].ACTION', 'Numform[8].VALUEREAL', 'Numform[8].DATEVAL', 'Numform[9].VALUETYPE',
    'Numform[9].PCODE', 'Numform[9].PRODVALTYPE', 'Numform[9].ACTION', 'Numform[9].VALUEREAL', 'Numform[9].DATEVAL',
    'Numform[10].VALUETYPE', 'Numform[10].PCODE', 'Numform[10].PRODVALTYPE', 'Numform[10].ACTION',
    'Numform[10].VALUEREAL', 'Numform[10].DATEVAL', 'Numform[11].VALUETYPE', 'Numform[11].PCODE',
    'Numform[11].PRODVALTYPE', 'Numform[11].ACTION', 'Numform[11].VALUEREAL', 'Numform[11].DATEVAL',
    'Numform[12].VALUETYPE', 'Numform[12].PCODE', 'Numform[12].PRODVALTYPE', 'Numform[12].ACTION',
    'Numform[12].VALUEREAL', 'Numform[12].DATEVAL', 'Numform[13].VALUETYPE', 'Numform[13].PCODE',
    'Numform[13].PRODVALTYPE', 'Numform[13].ACTION', 'Numform[13].VALUEREAL', 'Numform[13].DATEVAL',
    'Numform[14].VALUETYPE', 'Numform[14].PCODE', 'Numform[14].PRODVALTYPE', 'Numform[14].ACTION',
    'Numform[14].VALUEREAL', 'Numform[14].DATEVAL', 'Numform[15].VALUETYPE', 'Numform[15].PCODE',
    'Numform[15].PRODVALTYPE', 'Numform[15].ACTION', 'Numform[15].VALUEREAL', 'Numform[15].DATEVAL',
    'Numform[16].VALUETYPE', 'Numform[16].PCODE', 'Numform[16].PRODVALTYPE', 'Numform[16].ACTION',
    'Numform[16].VALUEREAL', 'Numform[16].DATEVAL', 'Numform[17].VALUETYPE', 'Numform[17].PCODE',
    'Numform[17].PRODVALTYPE', 'Numform[17].ACTION', 'Numform[17].VALUEREAL', 'Numform[17].DATEVAL',
    'Numform[18].VALUETYPE', 'Numform[18].PCODE', 'Numform[18].PRODVALTYPE', 'Numform[18].ACTION',
    'Numform[18].VALUEREAL', 'Numform[18].DATEVAL', 'Numform[19].VALUETYPE', 'Numform[19].PCODE',
    'Numform[19].PRODVALTYPE', 'Numform[19].ACTION', 'Numform[19].VALUEREAL', 'Numform[19].DATEVAL',
    'Numform[20].VALUETYPE', 'Numform[20].PCODE', 'Numform[20].PRODVALTYPE', 'Numform[20].ACTION',
    'Numform[20].VALUEREAL', 'Numform[20].DATEVAL', 'Numform[21].VALUETYPE', 'Numform[21].PCODE',
    'Numform[21].PRODVALTYPE', 'Numform[21].ACTION', 'Numform[21].VALUEREAL', 'Numform[21].DATEVAL',
    'Numform[22].VALUETYPE', 'Numform[22].PCODE', 'Numform[22].PRODVALTYPE', 'Numform[22].ACTION',
    'Numform[22].VALUEREAL', 'Numform[22].DATEVAL', 'Numform[23].VALUETYPE', 'Numform[23].PCODE',
    'Numform[23].PRODVALTYPE', 'Numform[23].ACTION', 'Numform[23].VALUEREAL', 'Numform[23].DATEVAL',
    'Numform[24].VALUETYPE', 'Numform[24].PCODE', 'Numform[24].PRODVALTYPE', 'Numform[24].ACTION',
    'Numform[24].VALUEREAL', 'Numform[24].DATEVAL', 'Numform[25].VALUETYPE', 'Numform[25].PCODE',
    'Numform[25].PRODVALTYPE', 'Numform[25].ACTION', 'Numform[25].VALUEREAL', 'Numform[25].DATEVAL',
    'Numform[26].VALUETYPE', 'Numform[26].PCODE', 'Numform[26].PRODVALTYPE', 'Numform[26].ACTION',
    'Numform[26].VALUEREAL', 'Numform[26].DATEVAL', 'Numform[27].VALUETYPE', 'Numform[27].PCODE',
    'Numform[27].PRODVALTYPE', 'Numform[27].ACTION', 'Numform[27].VALUEREAL', 'Numform[27].DATEVAL',
    'Numform[28].VALUETYPE', 'Numform[28].PCODE', 'Numform[28].PRODVALTYPE', 'Numform[28].ACTION',
    'Numform[28].VALUEREAL', 'Numform[28].DATEVAL', 'Numform[29].VALUETYPE', 'Numform[29].PCODE',
    'Numform[29].PRODVALTYPE', 'Numform[29].ACTION', 'Numform[29].VALUEREAL', 'Numform[29].DATEVAL',
    'Numform[30].VALUETYPE', 'Numform[30].PCODE', 'Numform[30].PRODVALTYPE', 'Numform[30].ACTION',
    'Numform[30].VALUEREAL', 'Numform[30].DATEVAL', 'Numform[31].VALUETYPE', 'Numform[31].PCODE',
    'Numform[31].PRODVALTYPE', 'Numform[31].ACTION', 'Numform[31].VALUEREAL', 'Numform[31].DATEVAL',
    'Numform[32].VALUETYPE', 'Numform[32].PCODE', 'Numform[32].PRODVALTYPE', 'Numform[32].ACTION',
    'Numform[32].VALUEREAL', 'Numform[32].DATEVAL', 'Numform[33].VALUETYPE', 'Numform[33].PCODE',
    'Numform[33].PRODVALTYPE', 'Numform[33].ACTION', 'Numform[33].VALUEREAL', 'Numform[33].DATEVAL',
    'Numform[34].VALUETYPE', 'Numform[34].PCODE', 'Numform[34].PRODVALTYPE', 'Numform[34].ACTION',
    'Numform[34].VALUEREAL', 'Numform[34].DATEVAL', 'Numform[35].VALUETYPE', 'Numform[35].PCODE',
    'Numform[35].PRODVALTYPE', 'Numform[35].ACTION', 'Numform[35].VALUEREAL', 'Numform[35].DATEVAL',
    'Numform[36].VALUETYPE', 'Numform[36].PCODE', 'Numform[36].PRODVALTYPE', 'Numform[36].ACTION',
    'Numform[36].VALUEREAL', 'Numform[36].DATEVAL', 'Numform[37].VALUETYPE', 'Numform[37].PCODE',
    'Numform[37].PRODVALTYPE', 'Numform[37].ACTION', 'Numform[37].VALUEREAL', 'Numform[37].DATEVAL',
    'Numform[38].VALUETYPE', 'Numform[38].PCODE', 'Numform[38].PRODVALTYPE', 'Numform[38].ACTION',
    'Numform[38].VALUEREAL', 'Numform[38].DATEVAL', 'Numform[39].VALUETYPE', 'Numform[39].PCODE',
    'Numform[39].PRODVALTYPE', 'Numform[39].ACTION', 'Numform[39].VALUEREAL', 'Numform[39].DATEVAL',
    'Numform[40].VALUETYPE', 'Numform[40].PCODE', 'Numform[40].PRODVALTYPE', 'Numform[40].ACTION',
    'Numform[40].VALUEREAL', 'Numform[40].DATEVAL', 'Numform[41].VALUETYPE', 'Numform[41].PCODE',
    'Numform[41].PRODVALTYPE', 'Numform[41].ACTION', 'Numform[41].VALUEREAL', 'Numform[41].DATEVAL',
    'Numform[42].VALUETYPE', 'Numform[42].PCODE', 'Numform[42].PRODVALTYPE', 'Numform[42].ACTION',
    'Numform[42].VALUEREAL', 'Numform[42].DATEVAL', 'Numform[43].VALUETYPE', 'Numform[43].PCODE',
    'Numform[43].PRODVALTYPE', 'Numform[43].ACTION', 'Numform[43].VALUEREAL', 'Numform[43].DATEVAL',
    'Numform[44].VALUETYPE', 'Numform[44].PCODE', 'Numform[44].PRODVALTYPE', 'Numform[44].ACTION',
    'Numform[44].VALUEREAL', 'Numform[44].DATEVAL', 'Numform[45].VALUETYPE', 'Numform[45].PCODE',
    'Numform[45].PRODVALTYPE', 'Numform[45].ACTION', 'Numform[45].VALUEREAL', 'Numform[45].DATEVAL',
    'Numform[46].VALUETYPE', 'Numform[46].PCODE', 'Numform[46].PRODVALTYPE', 'Numform[46].ACTION',
    'Numform[46].VALUEREAL', 'Numform[46].DATEVAL', 'Numform[47].VALUETYPE', 'Numform[47].PCODE',
    'Numform[47].PRODVALTYPE', 'Numform[47].ACTION', 'Numform[47].VALUEREAL', 'Numform[47].DATEVAL',
    'Numform[48].VALUETYPE', 'Numform[48].PCODE', 'Numform[48].PRODVALTYPE', 'Numform[48].ACTION',
    'Numform[48].VALUEREAL', 'Numform[48].DATEVAL', 'Numform[49].VALUETYPE', 'Numform[49].PCODE',
    'Numform[49].PRODVALTYPE', 'Numform[49].ACTION', 'Numform[49].VALUEREAL', 'Numform[49].DATEVAL',
    'Numform[50].VALUETYPE', 'Numform[50].PCODE', 'Numform[50].PRODVALTYPE', 'Numform[50].ACTION',
    'Numform[50].VALUEREAL', 'Numform[50].DATEVAL', 'Numform[51].VALUETYPE', 'Numform[51].PCODE',
    'Numform[51].PRODVALTYPE', 'Numform[51].ACTION', 'Numform[51].VALUEREAL', 'Numform[51].DATEVAL',
    'Numform[52].VALUETYPE', 'Numform[52].PCODE', 'Numform[52].PRODVALTYPE', 'Numform[52].ACTION',
    'Numform[52].VALUEREAL', 'Numform[52].DATEVAL', 'Numform[53].VALUETYPE', 'Numform[53].PCODE',
    'Numform[53].PRODVALTYPE', 'Numform[53].ACTION', 'Numform[53].VALUEREAL', 'Numform[53].DATEVAL',
    'Numform[54].VALUETYPE', 'Numform[54].PCODE', 'Numform[54].PRODVALTYPE', 'Numform[54].ACTION',
    'Numform[54].VALUEREAL', 'Numform[54].DATEVAL', 'Numform[55].VALUETYPE', 'Numform[55].PCODE',
    'Numform[55].PRODVALTYPE', 'Numform[55].ACTION', 'Numform[55].VALUEREAL', 'Numform[55].DATEVAL',
    'Numform[56].VALUETYPE', 'Numform[56].PCODE', 'Numform[56].PRODVALTYPE', 'Numform[56].ACTION',
    'Numform[56].VALUEREAL', 'Numform[56].DATEVAL', 'Numform[57].VALUETYPE', 'Numform[57].PCODE',
    'Numform[57].PRODVALTYPE', 'Numform[57].ACTION', 'Numform[57].VALUEREAL', 'Numform[57].DATEVAL',
    'Numform[58].VALUETYPE', 'Numform[58].PCODE', 'Numform[58].PRODVALTYPE', 'Numform[58].ACTION',
    'Numform[58].VALUEREAL', 'Numform[58].DATEVAL', 'Numform[59].VALUETYPE', 'Numform[59].PCODE',
    'Numform[59].PRODVALTYPE', 'Numform[59].ACTION', 'Numform[59].VALUEREAL', 'Numform[59].DATEVAL',
    'Numform[60].VALUETYPE', 'Numform[60].PCODE', 'Numform[60].PRODVALTYPE', 'Numform[60].ACTION',
    'Numform[60].VALUEREAL', 'Numform[60].DATEVAL', 'Numform[61].VALUETYPE', 'Numform[61].PCODE',
    'Numform[61].PRODVALTYPE', 'Numform[61].ACTION', 'Numform[61].VALUEREAL', 'Numform[61].DATEVAL',
    'Numform[62].VALUETYPE', 'Numform[62].PCODE', 'Numform[62].PRODVALTYPE', 'Numform[62].ACTION',
    'Numform[62].VALUEREAL', 'Numform[62].DATEVAL', 'Numform[63].VALUETYPE', 'Numform[63].PCODE',
    'Numform[63].PRODVALTYPE', 'Numform[63].ACTION', 'Numform[63].VALUEREAL', 'Numform[63].DATEVAL',
    'Numform[64].VALUETYPE', 'Numform[64].PCODE', 'Numform[64].PRODVALTYPE', 'Numform[64].ACTION',
    'Numform[64].VALUEREAL', 'Numform[64].DATEVAL', 'Numform[65].VALUETYPE', 'Numform[65].PCODE',
    'Numform[65].PRODVALTYPE', 'Numform[65].ACTION', 'Numform[65].VALUEREAL', 'Numform[65].DATEVAL',
    'Numform[66].VALUETYPE', 'Numform[66].PCODE', 'Numform[66].PRODVALTYPE', 'Numform[66].ACTION',
    'Numform[66].VALUEREAL', 'Numform[66].DATEVAL', 'Numform[67].VALUETYPE', 'Numform[67].PCODE',
    'Numform[67].PRODVALTYPE', 'Numform[67].ACTION', 'Numform[67].VALUEREAL', 'Numform[67].DATEVAL',
    'Numform[68].VALUETYPE', 'Numform[68].PCODE', 'Numform[68].PRODVALTYPE', 'Numform[68].ACTION',
    'Numform[68].VALUEREAL', 'Numform[68].DATEVAL', 'Numform[69].VALUETYPE', 'Numform[69].PCODE',
    'Numform[69].PRODVALTYPE', 'Numform[69].ACTION', 'Numform[69].VALUEREAL', 'Numform[69].DATEVAL',
    'Numform[70].VALUETYPE', 'Numform[70].PCODE', 'Numform[70].PRODVALTYPE', 'Numform[70].ACTION',
    'Numform[70].VALUEREAL', 'Numform[70].DATEVAL', 'Numform[71].VALUETYPE', 'Numform[71].PCODE',
    'Numform[71].PRODVALTYPE', 'Numform[71].ACTION', 'Numform[71].VALUEREAL', 'Numform[71].DATEVAL',
    'Numform[72].VALUETYPE', 'Numform[72].PCODE', 'Numform[72].PRODVALTYPE', 'Numform[72].ACTION',
    'Numform[72].VALUEREAL', 'Numform[72].DATEVAL', 'Numform[73].VALUETYPE', 'Numform[73].PCODE',
    'Numform[73].PRODVALTYPE', 'Numform[73].ACTION', 'Numform[73].VALUEREAL', 'Numform[73].DATEVAL',
    'Numform[74].VALUETYPE', 'Numform[74].PCODE', 'Numform[74].PRODVALTYPE', 'Numform[74].ACTION',
    'Numform[74].VALUEREAL', 'Numform[74].DATEVAL', 'Numform[75].VALUETYPE', 'Numform[75].PCODE',
    'Numform[75].PRODVALTYPE', 'Numform[75].ACTION', 'Numform[75].VALUEREAL', 'Numform[75].DATEVAL',
    'Numform[76].VALUETYPE', 'Numform[76].PCODE', 'Numform[76].PRODVALTYPE', 'Numform[76].ACTION',
    'Numform[76].VALUEREAL', 'Numform[76].DATEVAL', 'Numform[77].VALUETYPE', 'Numform[77].PCODE',
    'Numform[77].PRODVALTYPE', 'Numform[77].ACTION', 'Numform[77].VALUEREAL', 'Numform[77].DATEVAL',
    'Numform[78].VALUETYPE', 'Numform[78].PCODE', 'Numform[78].PRODVALTYPE', 'Numform[78].ACTION',
    'Numform[78].VALUEREAL', 'Numform[78].DATEVAL', 'Numform[79].VALUETYPE', 'Numform[79].PCODE',
    'Numform[79].PRODVALTYPE', 'Numform[79].ACTION', 'Numform[79].VALUEREAL', 'Numform[79].DATEVAL',
    'Numform[80].VALUETYPE', 'Numform[80].PCODE', 'Numform[80].PRODVALTYPE', 'Numform[80].ACTION',
    'Numform[80].VALUEREAL', 'Numform[80].DATEVAL', 'Numform[81].VALUETYPE', 'Numform[81].PCODE',
    'Numform[81].PRODVALTYPE', 'Numform[81].ACTION', 'Numform[81].VALUEREAL', 'Numform[81].DATEVAL',
    'Numform[82].VALUETYPE', 'Numform[82].PCODE', 'Numform[82].PRODVALTYPE', 'Numform[82].ACTION',
    'Numform[82].VALUEREAL', 'Numform[82].DATEVAL', 'Numform[83].VALUETYPE', 'Numform[83].PCODE',
    'Numform[83].PRODVALTYPE', 'Numform[83].ACTION', 'Numform[83].VALUEREAL', 'Numform[83].DATEVAL',
    'Numform[84].VALUETYPE', 'Numform[84].PCODE', 'Numform[84].PRODVALTYPE', 'Numform[84].ACTION',
    'Numform[84].VALUEREAL', 'Numform[84].DATEVAL', 'Numform[85].VALUETYPE', 'Numform[85].PCODE',
    'Numform[85].PRODVALTYPE', 'Numform[85].ACTION', 'Numform[85].VALUEREAL', 'Numform[85].DATEVAL',
    'Numform[86].VALUETYPE', 'Numform[86].PCODE', 'Numform[86].PRODVALTYPE', 'Numform[86].ACTION',
    'Numform[86].VALUEREAL', 'Numform[86].DATEVAL', 'Numform[87].VALUETYPE', 'Numform[87].PCODE',
    'Numform[87].PRODVALTYPE', 'Numform[87].ACTION', 'Numform[87].VALUEREAL', 'Numform[87].DATEVAL',
    'Numform[88].VALUETYPE', 'Numform[88].PCODE', 'Numform[88].PRODVALTYPE', 'Numform[88].ACTION',
    'Numform[88].VALUEREAL', 'Numform[88].DATEVAL', 'Numform[89].VALUETYPE', 'Numform[89].PCODE',
    'Numform[89].PRODVALTYPE', 'Numform[89].ACTION', 'Numform[89].VALUEREAL', 'Numform[89].DATEVAL',
    'Numform[90].VALUETYPE', 'Numform[90].PCODE', 'Numform[90].PRODVALTYPE', 'Numform[90].ACTION',
    'Numform[90].VALUEREAL', 'Numform[90].DATEVAL', 'Numform[91].VALUETYPE', 'Numform[91].PCODE',
    'Numform[91].PRODVALTYPE', 'Numform[91].ACTION', 'Numform[91].VALUEREAL', 'Numform[91].DATEVAL',
    'Numform[92].VALUETYPE', 'Numform[92].PCODE', 'Numform[92].PRODVALTYPE', 'Numform[92].ACTION',
    'Numform[92].VALUEREAL', 'Numform[92].DATEVAL', 'Numform[93].VALUETYPE', 'Numform[93].PCODE',
    'Numform[93].PRODVALTYPE', 'Numform[93].ACTION', 'Numform[93].VALUEREAL', 'Numform[93].DATEVAL',
    'Numform[94].VALUETYPE', 'Numform[94].PCODE', 'Numform[94].PRODVALTYPE', 'Numform[94].ACTION',
    'Numform[94].VALUEREAL', 'Numform[94].DATEVAL', 'Numform[95].VALUETYPE', 'Numform[95].PCODE',
    'Numform[95].PRODVALTYPE', 'Numform[95].ACTION', 'Numform[95].VALUEREAL', 'Numform[95].DATEVAL',
    'Numform[96].VALUETYPE', 'Numform[96].PCODE', 'Numform[96].PRODVALTYPE', 'Numform[96].ACTION',
    'Numform[96].VALUEREAL', 'Numform[96].DATEVAL', 'Numform[97].VALUETYPE', 'Numform[97].PCODE',
    'Numform[97].PRODVALTYPE', 'Numform[97].ACTION', 'Numform[97].VALUEREAL', 'Numform[97].DATEVAL',
    'Numform[98].VALUETYPE', 'Numform[98].PCODE', 'Numform[98].PRODVALTYPE', 'Numform[98].ACTION',
    'Numform[98].VALUEREAL', 'Numform[98].DATEVAL', 'Numform[99].VALUETYPE', 'Numform[99].PCODE',
    'Numform[99].PRODVALTYPE', 'Numform[99].ACTION', 'Numform[99].VALUEREAL', 'Numform[99].DATEVAL'
]
