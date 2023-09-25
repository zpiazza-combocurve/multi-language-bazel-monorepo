import numpy as np
import polars as pl
from bson import ObjectId
from collections import defaultdict
from joblib import Parallel, delayed
from combocurve.science.network_module.network import FIRST_PRODUCTION_DATE_STR, CUT_OFF_DATE_STR

from combocurve.science.network_module.nodes.node_class_map import FACILITY_NODES_EMISSION_CALCULATION
from combocurve.science.network_module.nodes.shared.helper import get_output_df_from_date_and_value_arr
from combocurve.science.network_module.nodes.shared.type_hints import MonthlyFrequencyDatetime64mNDArray
from combocurve.services.carbon.carbon_schemas import MONTHLY_POLARDF_SCHEMA

VIRTUAL_STR = 'virtual'


def make_virtual_facility_id(node):
    node_id = node['id']
    return f'{VIRTUAL_STR}_{node_id}'


def get_node_id_from_virtual_facility_id(virtual_facility_id):
    return virtual_facility_id.split(f'{VIRTUAL_STR}_')[-1]


def facility_emission(facility_devices_well_groups_per_combo_per_network: dict, batch_df_list: list[pl.DataFrame],
                      n_threads: int) -> list[pl.DataFrame]:
    # check if any facilities are present:
    facilities_in_run: bool = any(list(facility_devices_well_groups_per_combo_per_network.values())[0].values())
    if not facilities_in_run:
        return []
    # batches
    dates_from_batches = Parallel(n_jobs=n_threads)(delayed(well_dates_pipeline)(batch_df)
                                                    for batch_df in batch_df_list)
    batch_start_end_dates_maps, batch_min_dates, batch_max_dates = zip(*dates_from_batches)
    # once
    overall_min_date, overall_max_date = get_overall_min_max_dates(batch_min_dates, batch_max_dates)
    # check if there are any valid wells in run
    if np.isnat(overall_min_date):
        return []
    # batches
    parallel_jobs = [
        delayed(get_batch_facility_well_counts)(batch_start_end_dates_map,
                                                facility_devices_well_groups_per_combo_per_network, overall_min_date,
                                                overall_max_date)
        for batch_start_end_dates_map in batch_start_end_dates_maps
    ]
    batch_fwc_df_list = Parallel(n_jobs=n_threads)(parallel_jobs)
    # once
    total_facility_well_counts = sum_batch_facility_well_counts(batch_fwc_df_list)
    # batches
    facility_dfs: list = Parallel(n_jobs=n_threads)(delayed(batch_allocate_facility_emissions)(
        batch_start_end_dates_map, facility_devices_well_groups_per_combo_per_network, overall_min_date,
        overall_max_date, total_facility_well_counts) for batch_start_end_dates_map in batch_start_end_dates_maps)

    return facility_dfs


def _datestr_to_datetime64m(date_str):
    return np.datetime64(date_str).astype('datetime64[M]')


def well_dates_pipeline(df: pl.DataFrame) -> tuple[dict, np.datetime64, np.datetime64]:
    well_start_end_date = prepare_start_end_dates(df)
    return get_start_end_dates_map(well_start_end_date)


def prepare_start_end_dates(df: pl.DataFrame) -> pl.LazyFrame:
    query_cols: list = ['combo_name', 'well_id', 'incremental_index']
    query_cols_w_date: list = query_cols + ['date']
    fpd_pldf: pl.LazyFrame = df.lazy().filter(
        pl.col('product') == FIRST_PRODUCTION_DATE_STR).select(query_cols_w_date).rename(
            {'date': FIRST_PRODUCTION_DATE_STR})
    cutoff_pldf: pl.LazyFrame = df.lazy().filter(
        pl.col('product') == CUT_OFF_DATE_STR).select(query_cols_w_date).rename({'date': CUT_OFF_DATE_STR})
    min_date_pldf: pl.LazyFrame = df.lazy().filter(pl.col('product').is_in(
        ['wh_oil', 'wh_gas',
         'wh_water'])).select(query_cols_w_date).groupby(query_cols).agg(pl.col('date').min().alias('min_date'))
    well_start_end_dates: pl.LazyFrame = fpd_pldf.join(cutoff_pldf, on=query_cols).join(min_date_pldf, on=query_cols)
    return well_start_end_dates


def get_start_end_dates_map(well_start_end_pldf: pl.LazyFrame) -> tuple[dict, np.datetime64, np.datetime64]:
    ## pair update well_start_end_date using well_fpd
    batch_min_date = np.datetime64('NaT')
    batch_max_date = np.datetime64('NaT')
    # convert pl df to pd df for iterating over rows
    well_start_end_date = well_start_end_pldf.collect().to_pandas()
    well_start_end_date_map = defaultdict(dict)
    for _, row in well_start_end_date.iterrows():
        # convert dates to 'YYYY-MM'
        # this_min_date is either as_of_date or cf_start_date (if CAPEX before As Of)
        this_min_date, this_fpd, this_cutoff = (
            _datestr_to_datetime64m(well_date)
            for well_date in [row['min_date'], row[FIRST_PRODUCTION_DATE_STR], row[CUT_OFF_DATE_STR]])
        if this_cutoff < this_min_date or this_cutoff < this_fpd:
            # cutoff is before fpd or asOfDate so this well will be skipped when updating facility_well_counts
            ## --------------asOfDate----------cutoffdate-----------fpd------------
            ## --------------cutoffdate--------asOfDate-------------fpd------------
            ## --------------fpd---------------cutoffdate-----------asOfDate-------
            ## --------------cutoffdate--------fpd------------------asOfDate-------
            processed_min_date = this_min_date
            # set max_date before min_date so date range that gets updated in facility_well_counts is empty []
            processed_max_date = this_min_date - np.timedelta64(1, 'M')
        elif this_fpd < this_min_date:
            # --------------fpd---------------asOfDate-------------cutoffdate-----
            processed_min_date = this_min_date
            processed_max_date = this_cutoff
        else:
            # --------------asOfDate----------fpd------------------cutoffdate-----
            processed_min_date = this_fpd
            processed_max_date = this_cutoff

        ## do not need to check for max date, they gets updated at the same time
        if np.isnat(batch_min_date):
            batch_min_date = processed_min_date
            batch_max_date = processed_max_date
        else:
            batch_min_date = min(batch_min_date, processed_min_date)
            batch_max_date = max(batch_max_date, processed_max_date)

        well_start_end_date_map[row['combo_name']][(ObjectId(
            row['well_id']), row['incremental_index'])] = [processed_min_date, processed_max_date]

    return well_start_end_date_map, batch_min_date, batch_max_date


def get_overall_min_max_dates(min_dates: tuple[np.datetime64, ...],
                              max_dates: tuple[np.datetime64, ...]) -> tuple[np.datetime64, np.datetime64]:
    # filter out dates that are NaT's, which occur in batches without any wells that need facility emissions
    min_dates_filtered = np.array(min_dates)[~np.isnat(min_dates)]
    max_dates_filtered = np.array(max_dates)[~np.isnat(max_dates)]
    # only need to check one array for non-NaT values
    if len(min_dates_filtered) == 0:
        return np.datetime64('NaT'), np.datetime64('NaT')
    else:
        return np.min(min_dates_filtered), np.max(max_dates_filtered)


def get_batch_facility_well_counts(well_start_end_date_map: dict,
                                   facility_devices_well_groups_per_combo_per_network: dict,
                                   overall_min_date: np.datetime64, overall_max_date: np.datetime64) -> pl.DataFrame:
    """Create an array of length equal to number of months from min_date to max_date
    for each unique combo, network and facility
    The value at each position is the number of wells active at that time step
    These arrays in one column of dataframe along with the combo name, network id and facility id
    Columns: combo_name: str, network_id: str(ObjectId), facility_id: str(ObjectId), facility_counts: pl.Series
    """
    columns: dict = {
        'combo_name': str,
        'network_id_str': str,
        'facility_node_id': str,
        'facility_counts': pl.List(pl.Float64)
    }
    n_month: int = (overall_max_date - overall_min_date).astype(int) + 1
    df_rows: list = []
    for combo_name, combo_v in facility_devices_well_groups_per_combo_per_network.items():
        for network_id, facilities_and_its_devices_and_well_groups in combo_v.items():
            for facility_id, devices_and_well_groups in facilities_and_its_devices_and_well_groups.items():
                facility_well_counts = np.zeros(n_month)
                for well_group in devices_and_well_groups['well_groups']:
                    for (well_id, incremental_index) in well_group['params']['well_incremental_index']:
                        # get left and right dates if the well exists in the date map
                        # wells that don't have production or forecast will not be included
                        left_right_date = well_start_end_date_map.get(combo_name, {}).get((well_id, incremental_index),
                                                                                          None)
                        if left_right_date:
                            [left_date, right_date] = left_right_date
                            slice_left = (left_date - overall_min_date).astype(int)
                            slice_right = (right_date - overall_min_date).astype(int) + 1
                            facility_well_counts[slice_left:slice_right] += 1
                one_row: list = [combo_name, str(network_id), facility_id, facility_well_counts]
                df_rows.append(one_row)
    batch_fwc_df = pl.DataFrame(list(zip(*df_rows)), columns=columns)
    return batch_fwc_df


def sum_batch_facility_well_counts(df_list: list) -> pl.DataFrame:
    group_columns: list = ['combo_name', 'network_id_str', 'facility_node_id']
    # Create a lazy df concatenates all of the batch dfs
    one_df: pl.LazyFrame = pl.concat(df_list).lazy()
    # group by combo, network, facilty and concat all facility well counts as list of lists [[0,0,1,...],[0,1,1,...]]
    group_df: pl.LazyFrame = one_df.groupby(group_columns).agg(pl.concat_list(pl.col('facility_counts')))
    # rearrange facility_counts so that all values at the same position (i.e. month) in each list are in the same list
    # n lists with m elements -> m lists with n elements
    # [[0,0,1,...],[0,1,1,...]] -> [[0,0],[0,1],[1,1],[...,...]]
    group_df = group_df.select(
        [pl.col('*').exclude('facility_counts'),
         pl.col('facility_counts').apply(lambda x: list(zip(*x)))])
    # sum all elements inside each list of facility_well_counts and overwrite 'facility_counts' column
    # result is a list of aggregated counts for each facility
    # # [[0,0],[0,1],[1,1],[...,...]] -> [0,1,2,...]
    clean_df: pl.DataFrame = group_df.collect().with_column(
        pl.col('facility_counts').arr.eval(pl.element().apply(sum, return_dtype=pl.Float64)))
    return clean_df


def batch_allocate_facility_emissions(well_start_end_date_map: dict,
                                      facility_devices_well_groups_per_combo_per_network: dict,
                                      overall_min_date: np.datetime64, overall_max_date: np.datetime64,
                                      df: pl.DataFrame) -> pl.DataFrame:
    ret = pl.DataFrame(columns=MONTHLY_POLARDF_SCHEMA)
    n_month: int = (overall_max_date - overall_min_date).astype(int) + 1
    date_arr: MonthlyFrequencyDatetime64mNDArray = np.arange(n_month) + overall_min_date
    for combo_name, combo_v in facility_devices_well_groups_per_combo_per_network.items():
        for network_id, facilities_and_its_devices_and_well_groups in combo_v.items():
            for facility_id, devices_and_well_groups in facilities_and_its_devices_and_well_groups.items():
                write_facility_id = None if facility_id.startswith(VIRTUAL_STR) else facility_id
                ## TODO: give df a detailed type hint
                ## the following query gives the well_count_arr that is of length: n_month
                facility_well_counts = pl.first(
                    df.filter(
                        pl.col('combo_name') == combo_name).filter(pl.col('network_id_str') == str(network_id)).filter(
                            pl.col('facility_node_id') == facility_id).lazy().collect().get_column(
                                'facility_counts')).to_numpy()
                ## for each facility_device in the list, generate their record associated to each well
                for node in devices_and_well_groups['devices']:
                    ## when no well is calculated against this facility, ignore it
                    ## TODO: move this logic to the facility validation at the begining
                    if facility_well_counts.sum() == 0:
                        continue
                    node_per_well_emission = FACILITY_NODES_EMISSION_CALCULATION[node['type']](node,
                                                                                               facility_well_counts,
                                                                                               date_arr)
                    for well_group in devices_and_well_groups['well_groups']:
                        for (well_id, incremental_index) in well_group['params']['well_incremental_index']:
                            # get left and right dates if the well exists in the date map
                            # wells that don't have production or forecast will not be included
                            left_right_date = well_start_end_date_map[combo_name].get((well_id, incremental_index),
                                                                                      None)
                            if left_right_date:
                                [left_date, right_date] = left_right_date
                                slice_left = (left_date - overall_min_date).astype(int)
                                slice_right = (right_date - overall_min_date).astype(int) + 1
                                well_emission_months = overall_min_date + np.arange(slice_left, slice_right)
                                if len(well_emission_months) > 0:
                                    for product, product_value in node_per_well_emission.items():
                                        ## TODO: rework this part of logic to better accomodate the complication from
                                        ## CustomCalculation Node can specify emission type and emission category
                                        if node['type'] == 'custom_calculation':
                                            to_be_concat = get_output_df_from_date_and_value_arr(
                                                combo_name, well_id, incremental_index, write_facility_id, node,
                                                well_emission_months, product_value['value'][slice_left:slice_right],
                                                product, product_value['emission_category'],
                                                product_value['emission_type'])
                                        else:
                                            to_be_concat = get_output_df_from_date_and_value_arr(
                                                combo_name, well_id, incremental_index, write_facility_id, node,
                                                well_emission_months, product_value[slice_left:slice_right], product)
                                        ret = pl.concat([ret, to_be_concat])

    return ret
