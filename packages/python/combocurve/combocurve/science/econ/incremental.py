import numpy as np

from combocurve.services.econ.econ_columns import SPECIAL_COL_DICT, RATIO_COLS, SPECIAL_INCREMENTAL_COLUMNS


def econ_log_subtraction(inc_flat_log, base_flat_log):
    inc_date = inc_flat_log['date'].astype('datetime64')
    base_date = base_flat_log['date'].astype('datetime64')

    inc_start_date = inc_date[0]
    inc_end_date = inc_date[-1]

    base_start_date = base_date[0]
    base_end_date = base_date[-1]

    # construct base result in range of incremental
    base_log_inc_range = {'date': inc_flat_log['date']}
    if base_end_date < inc_start_date or base_start_date > inc_end_date:
        # no overlapping
        zerro_array = np.zeros(len(inc_date))
        for col in inc_flat_log:
            if col == 'date' or 'daily' in col:
                continue
            else:
                base_log_inc_range[col] = zerro_array
    else:
        # overlapping
        base_used_idx = (base_date >= inc_start_date) & (base_date <= inc_end_date)
        base_used_date = base_date[base_used_idx]
        inc_fill_idx = (inc_date >= base_used_date[0]) & (inc_date <= base_used_date[-1])
        for col in inc_flat_log:
            if col == 'date' or 'daily' in col:
                continue
            else:
                this_col = np.zeros(len(inc_date))
                this_col[inc_fill_idx] = base_flat_log[col][base_used_idx]
                base_log_inc_range[col] = this_col

    # calculate delta
    delta_flat_log = {}
    for col in inc_flat_log:
        if col == 'date' or 'daily' in col:
            delta_flat_log[col] = inc_flat_log[col]
        else:
            if col in SPECIAL_COL_DICT:
                continue
            else:
                delta_flat_log[col] = inc_flat_log[col] - base_log_inc_range[col]

    for col, item in SPECIAL_COL_DICT.items():
        if col in SPECIAL_INCREMENTAL_COLUMNS and col not in inc_flat_log:
            continue
        try:
            if col in RATIO_COLS:
                # display incremental case input instead
                delta_flat_log[col] = inc_flat_log[col]
            elif 'method' in item:
                delta_flat_log[col] = np.zeros(len(inc_flat_log[col]))
            else:
                delta_num_col = delta_flat_log[item['numerator']]
                delta_denom_col = delta_flat_log[item['denominator']]
                delta_flat_log[col] = np.nan_to_num(delta_num_col / delta_denom_col)
        except KeyError:
            delta_flat_log[col] = np.zeros(len(inc_date))

    return delta_flat_log
