import pandas as pd
import numpy as np
import copy

from calendar import monthrange


def get_earliest_and_latest_date(multiple_rows_key_ls, model, phase, price_document):
    '''
    get earliest_date and latest_date among rows, rows2, row3,... for corresponding model, phase
    '''
    earliest_date = None
    latest_date = None

    for row_key in multiple_rows_key_ls:
        if model == "differentials":
            rows = price_document['econ_function'][model]['differentials_1'][phase][row_key]
        else:
            rows = price_document['econ_function'][model][phase][row_key]
        for obj in rows:
            if 'dates' in obj:
                if earliest_date is None and latest_date is None:
                    try:
                        earliest_date = pd.to_datetime(obj['dates']['start_date'])
                        latest_date = pd.to_datetime(obj['dates']['end_date'])
                    except Exception:
                        pass
                else:
                    try:
                        if pd.to_datetime(obj['dates']['start_date']) < earliest_date:
                            earliest_date = pd.to_datetime(obj['dates']['start_date'])
                        if pd.to_datetime(obj['dates']['start_date']) > latest_date:
                            latest_date = pd.to_datetime(obj['dates']['start_date'])
                        if pd.to_datetime(obj['dates']['end_date']) < earliest_date:
                            earliest_date = pd.to_datetime(obj['dates']['end_date'])
                        if pd.to_datetime(obj['dates']['end_date']) > latest_date:
                            latest_date = pd.to_datetime(obj['dates']['end_date'])
                    except Exception:
                        pass
            else:
                continue

    if latest_date is None:
        latest_date = earliest_date

    return earliest_date, latest_date


def determine_cutoff_unit_key(rows_obj):
    '''
    determin rows obj use which cutoff_key and unit_key
    ex: cutoff_key = 'dates', cutoff_key = 'well_head_oil_cum', cutoff_key = 'well_head_gas_cum',...
    ex: unit_key = 'dollar_per_mmbtu', unit_key = 'price', unit_key = 'dollar_per_bbl',...

    note: deprecated function
    '''
    # remove 'cap' 'escalation_model' keyword
    rows_obj_key_ls = [key for key in rows_obj.keys() if not (key.startswith('c') or key.startswith('e'))]

    # the index for cutoff_key and unit_key should be fix
    if rows_obj_key_ls[0].startswith('d'):
        obj_cutoff_key, obj_unit_key = rows_obj_key_ls[0], rows_obj_key_ls[1]
    else:
        obj_cutoff_key, obj_unit_key = rows_obj_key_ls[1], rows_obj_key_ls[0]
    # print(obj_cutoff_key, obj_unit_key, rows_obj_key_ls)

    return obj_cutoff_key, obj_unit_key


def sum_up_all_rows(all_rows_to_nparray_dic):
    '''
    sum up all rows store in all_rows_to_nparray_dic
    '''
    combined_np_array = None
    for row_key in all_rows_to_nparray_dic:
        if combined_np_array is None:
            combined_np_array = all_rows_to_nparray_dic[row_key]
        else:
            combined_np_array += all_rows_to_nparray_dic[row_key]
    return combined_np_array


def combine_process_of_rows(earliest_date, latest_date, multiple_rows_key_ls, model, phase, price_document):
    '''
    use earliest_date, latest_date to create the frame of np array for each rows, rows2, rows3,...
    then put the value to the corresponding index from earliest_date for each rows, rows2, rows3,...
    finally sum up each np array to a combined_np_array
    '''
    frame_months_diff = ((latest_date.to_period('M') - earliest_date.to_period('M')).freqstr)[:-1]
    if frame_months_diff == '':
        # special handle for 1 months difference
        frame_months_diff = '1'
    frame_months_diff = int(frame_months_diff) + 1
    fixed_len_frame_ls = np.zeros(frame_months_diff)

    all_rows_to_nparray_dic = {}  # ex: {'rows': np.arr}
    for row_key in multiple_rows_key_ls:
        # assign all 0 np.arr to row_key with obj_cutoff_key, obj_unit_key
        all_rows_to_nparray_dic[row_key] = copy.deepcopy(fixed_len_frame_ls)
        unit_key = None
        if model == "differentials":
            rows = price_document['econ_function'][model]['differentials_1'][phase][row_key]
        else:
            rows = price_document['econ_function'][model][phase][row_key]
        for obj in rows:
            obj_cutoff_key, obj_unit_key = determine_cutoff_unit_key(obj)

            # update and compare obj_cutoff_key to cutoff_key
            if unit_key is None:
                unit_key = obj_unit_key
            if unit_key != obj_unit_key:
                # since cutoff_key or unit_key is different, rows can not be combine
                return None, None

            if 'dates' in obj.keys():
                start_months_diff = ((pd.to_datetime(obj['dates']['start_date']).to_period('M')
                                      - earliest_date.to_period('M')).freqstr)[:-1]
                if start_months_diff == '':
                    # speical handle for 1 months difference
                    start_months_diff = '1'
                start_months_idx = int(start_months_diff)

                if obj['dates']['end_date'] == 'Econ Limit':
                    end_months_diff = ((latest_date.to_period('M') - earliest_date.to_period('M')).freqstr)[:-1]
                else:
                    end_date = pd.to_datetime(obj['dates']['end_date'])
                    # get the last day of the month (28, 29, 30, 31)
                    last_day_of_the_month = monthrange(end_date.year, end_date.month)[1]
                    if end_date.day == last_day_of_the_month:
                        end_months_diff = ((end_date.to_period('M') - earliest_date.to_period('M')).freqstr)[:-1]
                    else:
                        end_months_diff = (((end_date + pd.DateOffset(months=-1)).to_period('M')
                                            - earliest_date.to_period('M')).freqstr)[:-1]
                if end_months_diff == '':
                    # speical handle for 1 months difference
                    end_months_diff = '1'
                end_months_idx = int(end_months_diff)

                all_rows_to_nparray_dic[row_key][start_months_idx:end_months_idx + 1] += obj[obj_unit_key]
            else:
                # can not combine rows with cutoff_keyword, such as well_head_oil_cum, well_head_gas_cum
                return None, None
    combined_np_array = sum_up_all_rows(all_rows_to_nparray_dic)
    return combined_np_array, unit_key


def create_new_rows(combined_np_array, earliest_date, latest_date, unit_key):
    '''
    based on the new np_array, create a row list with new segment and price or differential value
    '''
    # change earliest_date day alway start from 1
    earliest_date = earliest_date.replace(day=1)

    row = []
    switch_index = np.where(np.diff(combined_np_array))
    start_date = earliest_date
    for index_ls in switch_index:

        # if no switch index find, means it has only one value
        if len(index_ls) == 0:
            obj = {
                'dates': {
                    'start_date': start_date.strftime("%Y-%m-%d"),
                    'end_date': 'Econ Limit',
                },
                unit_key: round(combined_np_array[0], 4)
            }
            row.append(obj)
            return row

        for idx in range(len(index_ls)):
            end_date = earliest_date + pd.DateOffset(months=index_ls[idx] + 1, days=-1)

            obj = {
                'dates': {
                    'start_date': start_date.strftime("%Y-%m-%d"),
                    'end_date': end_date.strftime("%Y-%m-%d"),
                },
                unit_key: round(combined_np_array[index_ls[idx]], 4)
            }
            row.append(obj)

            start_date = end_date + pd.DateOffset(days=1)

        if latest_date.strftime("%Y-%m-%d") == '2262-04-11':
            end_date = latest_date
        else:
            end_date = latest_date + pd.DateOffset(months=1, days=-1)

        try:
            obj = {
                'dates': {
                    'start_date': start_date.strftime("%Y-%m-%d"),
                    'end_date': end_date.strftime("%Y-%m-%d"),
                },
                unit_key: round(combined_np_array[index_ls[idx] + 1], 4)
            }
            row.append(obj)
        except Exception:
            # print('it already reach the end of the combined_np_array')
            pass
    # change last element in row end_date to 'Econ Limit'
    row[-1]['dates']['end_date'] = 'Econ Limit'
    return row


def replace_rows(price_document, rows, model, phase, multiple_rows_key_ls):
    '''
    replace the old rows to combined rows for specific model, phase in price_document
    need to also delete the rows2, rows3, rows4,...
    '''
    if model == "differentials":
        price_document['econ_function'][model]['differentials_1'][phase]['rows'] = rows
    else:
        price_document['econ_function'][model][phase]['rows'] = rows
    for row_key in multiple_rows_key_ls:
        if row_key != 'rows':
            if model == "differentials":
                del price_document['econ_function'][model]['differentials_1'][phase][row_key]
            else:
                del price_document['econ_function'][model][phase][row_key]
    return price_document


def combine_multiple_rows(document):
    '''
    This main mothod combine multilple rows in aries price model
    It will sum up the price in the same date segment

    input: aries price_model with rows, rows2, rows3, rows4,...
    output: aries price_model with rows
    '''
    if document['assumptionKey'] == 'pricing':
        model = 'price_model'
        phase_ls = ['oil', 'gas', 'ngl', 'drip_condensate']
    elif document['assumptionKey'] == 'differentials':
        model = 'differentials'
        phase_ls = ['oil', 'gas', 'ngl', 'drip_condensate']
    elif document['assumptionKey'] == 'expenses':
        model = 'fixed_expenses'
        phase_ls = ['monthly_well_cost', 'other_monthly_cost_1', 'other_monthly_cost_2']

    for phase in phase_ls:
        if model == 'differentials':
            multiple_rows_key_ls = [
                key for key in document['econ_function'][model]['differentials_1'][phase].keys() if key.startswith('r')
            ]
            rows = document['econ_function'][model]['differentials_1'][phase]['rows']
        else:
            multiple_rows_key_ls = [
                key for key in document['econ_function'][model][phase].keys() if key.startswith('r')
            ]
            rows = document['econ_function'][model][phase]['rows']
        # print(multiple_rows_key_ls, model, phase)
        # if len(multiple_rows_key_ls) > 1 or document['assumptionKey'] == 'expenses':
        if len(rows) > 1:
            earliest_date, latest_date = get_earliest_and_latest_date(multiple_rows_key_ls, model, phase, document)
            if earliest_date is not None or latest_date is not None:
                combined_np_array, unit_key = combine_process_of_rows(earliest_date, latest_date, multiple_rows_key_ls,
                                                                      model, phase, document)
                if combined_np_array is not None:
                    rows = create_new_rows(combined_np_array, earliest_date, latest_date, unit_key)
                    document = replace_rows(document, rows, model, phase, multiple_rows_key_ls)
    return document


# import pprint
# pprint.pprint(combine_multiple_rows(expenses_document))
# pprint.pprint(combine_multiple_rows(price_document))
