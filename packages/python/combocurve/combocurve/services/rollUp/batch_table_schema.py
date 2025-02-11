from google.cloud import bigquery

FORECAST_BATCH_TABLE_SCHEMA = [
    bigquery.SchemaField("run_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("run_at", "DATETIME", mode="REQUIRED"),
    bigquery.SchemaField("project_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("project_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("forecast_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("forecast_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("user_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("user_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("batch_id", "INTEGER", mode="REQUIRED"),
    bigquery.SchemaField("rollup_type", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("group_key", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("date", "DATE", mode="NULLABLE"),
    bigquery.SchemaField("gross_well_count", "INTEGER", mode="NULLABLE"),
    bigquery.SchemaField("gross_oil_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_gas_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_water_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_boe_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_mcfe_well_head_volume", "NUMERIC", mode="NULLABLE"),
]

SCENARIO_BATCH_TABLE_SCHEMA = [
    bigquery.SchemaField("run_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("run_at", "DATETIME", mode="REQUIRED"),
    bigquery.SchemaField("project_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("project_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("scenario_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("scenario_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("user_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("user_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("batch_id", "INTEGER", mode="REQUIRED"),
    bigquery.SchemaField("rollup_type", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("group_key", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("date", "DATE", mode="NULLABLE"),
    bigquery.SchemaField("gross_well_count", "INTEGER", mode="NULLABLE"),
    bigquery.SchemaField("gross_oil_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_gas_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_water_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_boe_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_mcfe_well_head_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_oil_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_gas_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_ngl_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_drip_condensate_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_boe_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("gross_mcfe_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_oil_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_gas_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_ngl_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_drip_condensate_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_boe_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("wi_mcfe_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_oil_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_gas_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_ngl_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_drip_condensate_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_boe_sales_volume", "NUMERIC", mode="NULLABLE"),
    bigquery.SchemaField("net_mcfe_sales_volume", "NUMERIC", mode="NULLABLE"),
]

WELL_TABLE_SCHEMA = [
    bigquery.SchemaField("chosen_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("well_id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("inpt_id", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("api14", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("well_name", "STRING", mode="NULLABLE"),
    bigquery.SchemaField("well_number", "STRING", mode="NULLABLE"),
]
