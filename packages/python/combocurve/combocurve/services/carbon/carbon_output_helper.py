import datetime
import pandas as pd
import polars as pl
from bson import ObjectId
from combocurve.shared.parquet_types import to_date
from combocurve.science.network_module.nodes.shared.helper import assign_unit, assign_scope, \
    update_fuel_type_label


def add_row_id_inserted_at_to_df(df):
    df['row_id'] = [str(ObjectId()) for _ in range(df.shape[0])]
    df['inserted_at'] = datetime.datetime.now()


def append_run_and_row_info_to_df(df: pl.DataFrame, run: dict) -> pl.DataFrame:
    df = df.with_columns([(pl.Series([str(run['_id'])])).alias('run_id'),
                          (pl.Series([run['createdAt']])).alias('run_at'),
                          (pl.Series([str(ObjectId()) for _ in range(df.shape[0])])).alias('row_id'),
                          (pl.Series([datetime.datetime.now()])).alias('inserted_at')])
    return df


def append_unit_and_scope_to_df(df: pl.DataFrame) -> pl.DataFrame:
    df = df.with_columns([
        pl.col('product').apply(assign_unit).alias('unit'),
        pl.when(pl.col('node_type').is_in(['scope2', 'scope3'])).then(pl.col('node_type')).otherwise(
            pl.col('emission_type')).fill_null("").apply(assign_scope).alias('scope'),
        pl.col('product').apply(update_fuel_type_label)
    ])
    # update the fuel_type products from the key to the label to make it more readable
    # 'distillate_fuel_oil_number_1' -> 'Petroleum products: distillate fuel oil No. 1'
    # this is done after assigning the unit since the product is used as the key in assign_unit
    return df


def process_date_cols(schema: dict, pldf: pl.DataFrame) -> pd.DataFrame:
    date_cols = [col for col in pldf.columns if schema.get(col) == 'DATE']
    pldf_processed = pldf.with_columns([pl.col(col).apply(to_date) for col in date_cols])
    pddf_processed = pldf_processed.to_pandas()

    return pddf_processed
