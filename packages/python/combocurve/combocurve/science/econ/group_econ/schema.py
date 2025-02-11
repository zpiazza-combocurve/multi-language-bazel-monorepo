import polars as pl

GROUP_PL_DF_SCHEMA = {
    'econ_group': pl.Utf8,
    'date': pl.Utf8,
    'combo_name': pl.Utf8,
    'total_expense': pl.Float64,
    'total_production_tax': pl.Float64,
    'total_capex': pl.Float64,
    'oil_revenue': pl.Float64,
    'gas_revenue': pl.Float64,
    'ngl_revenue': pl.Float64,
    'drip_condensate_revenue': pl.Float64,
    'total_revenue': pl.Float64,
    'gross_oil_revenue': pl.Float64,
    'gross_gas_revenue': pl.Float64,
    'gross_ngl_revenue': pl.Float64,
    'gross_drip_condensate_revenue': pl.Float64,
    'total_gross_revenue': pl.Float64,
    '100_pct_wi_oil_revenue': pl.Float64,
    '100_pct_wi_gas_revenue': pl.Float64,
    '100_pct_wi_ngl_revenue': pl.Float64,
    '100_pct_wi_drip_condensate_revenue': pl.Float64,
    'total_100_pct_wi_revenue': pl.Float64,
    'net_income': pl.Float64,
    'gross_oil_well_head_volume': pl.Float64,
    'net_oil_well_head_volume': pl.Float64,
    'gross_gas_well_head_volume': pl.Float64,
    'net_gas_well_head_volume': pl.Float64,
    'gross_water_well_head_volume': pl.Float64,
    'gross_boe_well_head_volume': pl.Float64,
    'net_boe_well_head_volume': pl.Float64,
    'gross_oil_sales_volume': pl.Float64,
    'gross_gas_sales_volume': pl.Float64,
    'gross_ngl_sales_volume': pl.Float64,
    'gross_drip_condensate_sales_volume': pl.Float64,
    'unshrunk_oil_volume': pl.Float64,
    'unshrunk_gas_volume': pl.Float64,
    'gross_well_count': pl.Float64,
    'wi_well_count': pl.Float64,
    'nri_well_count': pl.Float64,
}
