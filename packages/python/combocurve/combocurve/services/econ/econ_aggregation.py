from combocurve.services.econ.econ_big_query_schema import AGGREGATION_SCHEMA, GROSS_REVENUE, GROUP_ECON_ADDITIONAL

from combocurve.services.econ.econ_output_service import get_schema
from combocurve.science.econ.big_query import SPECIAL_COL_DICT
import polars as pl

aggregation_types = get_schema(AGGREGATION_SCHEMA)

numeric_cols = [k for k, v in aggregation_types.items() if v == 'NUMERIC' and k not in SPECIAL_COL_DICT]
other_cols = [k for k, v in aggregation_types.items() if v != 'NUMERIC']

group_aggregation_types = get_schema(AGGREGATION_SCHEMA + GROSS_REVENUE + GROUP_ECON_ADDITIONAL)
group_numeric_cols = [k for k, v in group_aggregation_types.items() if v == 'NUMERIC' and k not in SPECIAL_COL_DICT]

GROUP_DF_SORT_BY = ['combo_name', 'econ_group', 'date']


def group_aggregation(df):

    def agg_func(col):
        if col in group_numeric_cols:
            return pl.col(col).sum()
        else:
            return pl.col(col).first()

    return df.groupby(GROUP_DF_SORT_BY, maintain_order=True).agg([
        agg_func(col) for col in df.columns if col not in GROUP_DF_SORT_BY and col not in SPECIAL_COL_DICT
    ]).sort(GROUP_DF_SORT_BY)


def group_aggregation_for_allocation(df):

    def agg_func(col):
        if col in group_numeric_cols:
            return pl.col(col).sum()
        else:
            return pl.col(col).first()

    df = df.select([
        'econ_group',
        'date',
        'combo_name',
        'gross_oil_well_head_volume',
        'net_oil_well_head_volume',
        'gross_gas_well_head_volume',
        'net_gas_well_head_volume',
        'gross_boe_well_head_volume',
        'net_boe_well_head_volume',
        'gross_well_count',
        'wi_well_count',
        'nri_well_count',
        pl.when(pl.col('total_revenue') < 0).then(0).otherwise(pl.col('total_revenue')).alias('total_revenue'),
        pl.when(pl.col('total_100_pct_wi_revenue') < 0).then(0).otherwise(
            pl.col('total_100_pct_wi_revenue')).alias('total_100_pct_wi_revenue'),
        pl.when(pl.col('net_income') < 0).then(0).otherwise(pl.col('net_income')).alias('net_income'),
    ])

    return df.groupby(GROUP_DF_SORT_BY, maintain_order=True).agg([
        agg_func(col) for col in df.columns if col not in GROUP_DF_SORT_BY and col not in SPECIAL_COL_DICT
    ]).sort(GROUP_DF_SORT_BY)


def agg_func(col):
    if col in numeric_cols:
        return pl.col(col).sum()
    if col in other_cols:
        return pl.col(col).first()
    if col in SPECIAL_COL_DICT:
        col_dict = SPECIAL_COL_DICT[col]
        if 'method' in col_dict:
            weight_col = col_dict['weight']
            return pl.when(pl.col(weight_col).sum() > 0).then(
                (pl.col(col).dot(weight_col) / pl.col(weight_col).sum()).fill_nan(0)).otherwise(pl.col(col).mean())
        else:
            numerator_col = col_dict['numerator']
            denominator_col = col_dict['denominator']
            return pl.when(pl.col(denominator_col).sum() > 0).then(
                (pl.col(numerator_col).sum() / pl.col(denominator_col).sum()).fill_nan(0).alias(col)).otherwise(
                    pl.col(col).mean())


def by_cat_sub_cat(df, existing_cols):
    cat_sub_cat_df = df.groupby(
        ['date', 'combo_name', 'econ_prms_reserves_category', 'econ_prms_reserves_sub_category']).agg([
            agg_func(col) for col in existing_cols
            if col not in ['date', 'combo_name', 'econ_prms_reserves_category', 'econ_prms_reserves_sub_category']
        ])
    cat_sub_cat_df = cat_sub_cat_df.with_column(
        (pl.col('econ_prms_reserves_category') + ', '
         + pl.col('econ_prms_reserves_sub_category')).alias('aggregation_group'))
    return cat_sub_cat_df


def by_cat(df, existing_cols):
    cat_df = df.groupby(['date', 'combo_name', 'econ_prms_reserves_category']).agg(
        [agg_func(col) for col in existing_cols if col not in ['date', 'combo_name', 'econ_prms_reserves_category']])
    cat_df = cat_df.with_column((pl.col('econ_prms_reserves_category')).alias('aggregation_group'))
    return cat_df


def by_headers(df, existing_cols, headers):
    by_headers_df = df.groupby(['date', 'combo_name'] + headers).agg(
        [agg_func(col) for col in existing_cols if col not in ['date', 'combo_name'] + headers])
    if len(headers) == 1:
        by_headers_df = by_headers_df.with_column((pl.col(headers[0])).alias('aggregation_group'))
    else:
        # assuming two headers
        by_headers_df = by_headers_df.with_column(
            (pl.col(headers[0]) + ', ' + pl.col(headers[1])).alias('aggregation_group'))

    return by_headers_df


def by_all_wells(df, existing_cols):
    all_wells_df = df.groupby(['date', 'combo_name'
                               ]).agg([agg_func(col) for col in existing_cols if col not in ['date', 'combo_name']])
    all_wells_df = all_wells_df.with_column(pl.lit('all wells').alias('aggregation_group'))
    return all_wells_df


def all_wells_first_combo(df, combo_name):
    return df.filter(pl.col('combo_name') == combo_name)


def econ_output_aggregation(df, run):
    output_aggregation_setting = run['outputParams']['headersArr']
    display_combo_name = run['outputParams']['combos'][0]['name']
    existing_cols = [col for col in aggregation_types.keys() if col in df.columns]

    if 'res_cat' in output_aggregation_setting:
        # group by res cat, output_aggregation_setting should only contain res_cat
        cat_sub_cat_df = by_cat_sub_cat(df, existing_cols)  # include uncategorized wells
        cat_df = by_cat(cat_sub_cat_df, existing_cols)  # do not include uncategorized wells
        all_wells_df = by_all_wells(cat_df, existing_cols)

        cat_sub_cat_df = cat_sub_cat_df.select(sorted(cat_sub_cat_df.columns))
        cat_df = cat_df.select(sorted(cat_df.columns))
        all_wells_df = all_wells_df.select(sorted(all_wells_df.columns))

        aggregated_df = pl.concat([cat_sub_cat_df, cat_df, all_wells_df])
    else:
        # aggregate by selected group header(s)
        by_headers_df = by_headers(df, existing_cols, output_aggregation_setting)  # include uncategorized wells
        all_wells_df = by_all_wells(by_headers_df, existing_cols)
        all_wells_df = all_wells_df.select(sorted(all_wells_df.columns))
        by_headers_df = by_headers_df.select(sorted(by_headers_df.columns))

        aggregated_df = pl.concat([by_headers_df, all_wells_df])

    # all wells for first combo
    display_df = all_wells_first_combo(all_wells_df, display_combo_name)

    return aggregated_df.sort(['combo_name', 'date',
                               'aggregation_group']), display_df.sort(['date', 'aggregation_group'])
