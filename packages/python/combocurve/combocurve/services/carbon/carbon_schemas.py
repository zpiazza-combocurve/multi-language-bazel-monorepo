import polars as pl
from combocurve.services.econ.econ_big_query_schema import WELL_HEADER

GHG_REPORT_SCHEMA = [{
    "name": "run_id",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "name": "run_at",
    "type": "DATETIME",
    "mode": "REQUIRED"
}, {
    "name": "combo_name",
    "type": "STRING"
}, {
    "name": "well_id",
    "type": "STRING",
    "mode": "REQUIRED"
}, {
    "name": "incremental_index",
    "type": "INTEGER"
}, {
    "name": "row_id",
    "type": "STRING"
}, {
    "name": "inserted_at",
    "type": "DATETIME"
}, {
    "name": "node_id",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "node_type",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "emission_type",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "product_type",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "product",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "date",
    "type": "DATE",
    "mode": "NULLABLE"
}, {
    "name": "value",
    "type": "NUMERIC",
    "mode": "NULLABLE"
}, {
    "name": "unit",
    "type": "STRING",
    "mode": "NULLABLE"
}, {
    "name": "scope",
    "type": "STRING",
    "mode": "NULLABLE"
}]

GHG_WELL_HEADER_SCHEMA = [{
    'mode': 'REQUIRED',
    'name': 'well_id',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'run_id',
    'type': 'STRING'
}, {
    'name': 'run_at',
    'mode': 'REQUIRED',
    'type': 'DATETIME'
}, {
    'name': 'row_id',
    'type': 'STRING'
}, {
    'name': 'inserted_at',
    'type': 'TIMESTAMP'
}, {
    'mode': 'REQUIRED',
    'name': 'created_at',
    'type': 'TIMESTAMP'
}, *WELL_HEADER]

MONTHLY_POLARDF_SCHEMA = {
    'well_id': pl.Utf8,
    'node_id': pl.Utf8,
    'node_type': pl.Utf8,
    'emission_type': pl.Utf8,
    'product_type': pl.Utf8,
    'product': pl.Utf8,
    'value': pl.Float64,
    'date': pl.Date,
    'combo_name': pl.Utf8,
    'incremental_index': pl.Int64
}
