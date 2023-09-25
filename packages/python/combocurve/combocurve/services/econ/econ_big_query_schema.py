METADATA_SCHEMA = [{
    'mode': 'REQUIRED',
    'name': 'run_id',
    'type': 'STRING'
}, {
    'name': 'run_date',
    'mode': 'REQUIRED',
    'type': 'DATE'
}, {
    'mode': 'REQUIRED',
    'name': 'project_id',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'project_name',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'scenario_id',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'scenario_name',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'user_id',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'user_name',
    'type': 'STRING'
}, {
    'name': 'general_options_name',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'schema_version',
    'type': 'INTEGER'
}, {
    'mode': 'REQUIRED',
    'name': 'created_at',
    'type': 'TIMESTAMP'
}]

NON_BQ_HEADERS = [{
    'name': 'casing_id',
    'type': 'NUMERIC'
}, {
    'name': 'choke_size',
    'type': 'NUMERIC'
}, {
    'name': 'chosenID',
    'type': 'STRING'
}, {
    'name': 'chosenKeyID',
    'type': 'STRING'
}, {
    'name': 'copied',
    'type': 'BOOLEAN'
}, {
    'name': 'dataSource',
    'type': 'STRING'
}, {
    'name': 'dataPool',
    'type': 'STRING'
}, {
    'name': 'date_rig_release',
    'type': 'DATE'
}, {
    'name': 'distance_from_base_of_zone',
    'type': 'NUMERIC'
}, {
    'name': 'distance_from_top_of_zone',
    'type': 'NUMERIC'
}, {
    'name': 'elevation',
    'type': 'NUMERIC'
}, {
    'name': 'first_additive_volume',
    'type': 'NUMERIC'
}, {
    'name': 'first_max_injection_pressure',
    'type': 'NUMERIC'
}, {
    'name': 'first_max_injection_rate',
    'type': 'NUMERIC'
}, {
    'name': 'first_test_flow_tbg_press',
    'type': 'NUMERIC'
}, {
    'name': 'first_test_gas_vol',
    'type': 'NUMERIC'
}, {
    'name': 'first_test_gor',
    'type': 'NUMERIC'
}, {
    'name': 'first_test_oil_vol',
    'type': 'NUMERIC'
}, {
    'name': 'first_test_water_vol',
    'type': 'NUMERIC'
}, {
    'name': 'gas_specific_gravity',
    'type': 'NUMERIC'
}, {
    'name': 'ground_elevation',
    'type': 'NUMERIC'
}, {
    'name': 'initial_respress',
    'type': 'NUMERIC'
}, {
    'name': 'initial_restemp',
    'type': 'NUMERIC'
}, {
    'name': 'inptID',
    'type': 'STRING'
}, {
    'name': 'landing_zone_base',
    'type': 'NUMERIC'
}, {
    'name': 'landing_zone_top',
    'type': 'NUMERIC'
}, {
    'name': 'lower_perforation',
    'type': 'NUMERIC'
}, {
    'name': 'matrix_permeability',
    'type': 'NUMERIC'
}, {
    'name': 'oil_api_gravity',
    'type': 'NUMERIC'
}, {
    'name': 'porosity',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_additive_volume',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_cluster_count',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_date',
    'type': 'DATE'
}, {
    'name': 'refrac_max_injection_pressure',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_max_injection_rate',
    'type': 'NUMERIC'
}, {
    'name': 'sg',
    'type': 'NUMERIC'
}, {
    'name': 'so',
    'type': 'NUMERIC'
}, {
    'name': 'surfaceLatitude',
    'type': 'NUMERIC'
}, {
    'name': 'surfaceLongitude',
    'type': 'NUMERIC'
}, {
    'name': 'sw',
    'type': 'NUMERIC'
}, {
    'name': 'til',
    'type': 'DATE'
}, {
    'name': 'toeLatitude',
    'type': 'NUMERIC'
}, {
    'name': 'toeLongitude',
    'type': 'NUMERIC'
}, {
    'name': 'tubing_depth',
    'type': 'NUMERIC'
}, {
    'name': 'tubing_id',
    'type': 'NUMERIC'
}, {
    'name': 'upper_perforation',
    'type': 'NUMERIC'
}, {
    'name': 'mostRecentImportDesc',
    'type': 'STRING'
}, {
    'name': 'custom_number_0',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_1',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_2',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_3',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_4',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_5',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_6',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_7',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_8',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_9',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_10',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_11',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_12',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_13',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_14',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_15',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_16',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_17',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_18',
    'type': 'NUMERIC'
}, {
    'name': 'custom_number_19',
    'type': 'NUMERIC'
}, {
    'name': 'custom_date_0',
    'type': 'DATE'
}, {
    'name': 'custom_date_1',
    'type': 'DATE'
}, {
    'name': 'custom_date_2',
    'type': 'DATE'
}, {
    'name': 'custom_date_3',
    'type': 'DATE'
}, {
    'name': 'custom_date_4',
    'type': 'DATE'
}, {
    'name': 'custom_date_5',
    'type': 'DATE'
}, {
    'name': 'custom_date_6',
    'type': 'DATE'
}, {
    'name': 'custom_date_7',
    'type': 'DATE'
}, {
    'name': 'custom_date_8',
    'type': 'DATE'
}, {
    'name': 'custom_date_9',
    'type': 'DATE'
}, {
    'name': 'custom_bool_0',
    'type': 'BOOLEAN'
}, {
    'name': 'custom_bool_1',
    'type': 'BOOLEAN'
}, {
    'name': 'custom_bool_2',
    'type': 'BOOLEAN'
}, {
    'name': 'custom_bool_3',
    'type': 'BOOLEAN'
}, {
    'name': 'custom_bool_4',
    'type': 'BOOLEAN'
}]

WELL_HEADER = [{
    'mode': 'REQUIRED',
    'name': 'econ_group',
    'type': 'STRING'
}, {
    'name': 'prms_resources_class',
    'type': 'STRING'
}, {
    'name': 'prms_reserves_category',
    'type': 'STRING'
}, {
    'name': 'prms_reserves_sub_category',
    'type': 'STRING'
}, {
    'name': 'api14',
    'type': 'STRING'
}, {
    'name': 'basin',
    'type': 'STRING'
}, {
    'name': 'chosen_id',
    'type': 'STRING'
}, {
    'name': 'county',
    'type': 'STRING'
}, {
    'name': 'current_operator',
    'type': 'STRING'
}, {
    'name': 'current_operator_alias',
    'type': 'STRING'
}, {
    'name': 'first_prod_date_monthly_calc',
    'type': 'DATE'
}, {
    'name': 'hole_direction',
    'type': 'STRING'
}, {
    'name': 'hz_well_spacing_same_zone',
    'type': 'NUMERIC'
}, {
    'name': 'inpt_id',
    'type': 'STRING'
}, {
    'name': 'landing_zone',
    'type': 'STRING'
}, {
    'name': 'perf_lateral_length',
    'type': 'NUMERIC'
}, {
    'name': 'stage_spacing',
    'type': 'NUMERIC'
}, {
    'name': 'state',
    'type': 'STRING'
}, {
    'name': 'status',
    'type': 'STRING'
}, {
    'name': 'surface_latitude',
    'type': 'NUMERIC'
}, {
    'name': 'surface_longitude',
    'type': 'NUMERIC'
}, {
    'name': 'target_formation',
    'type': 'STRING'
}, {
    'name': 'toe_latitude',
    'type': 'NUMERIC'
}, {
    'name': 'toe_longitude',
    'type': 'NUMERIC'
}, {
    'name': 'total_fluid_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'total_proppant_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'total_stage_count',
    'type': 'NUMERIC'
}, {
    'name': 'true_vertical_depth',
    'type': 'NUMERIC'
}, {
    'name': 'type_curve_area',
    'type': 'STRING'
}, {
    'name': 'vt_well_spacing_same_zone',
    'type': 'NUMERIC'
}, {
    'name': 'well_name',
    'type': 'STRING'
}, {
    'name': 'well_number',
    'type': 'STRING'
}, {
    'name': 'well_type',
    'type': 'STRING'
}, {
    'name': 'field',
    'type': 'STRING'
}, {
    'name': 'play',
    'type': 'STRING'
}, {
    'name': 'oil_gatherer',
    'type': 'STRING'
}, {
    'name': 'gas_gatherer',
    'type': 'STRING'
}, {
    'name': 'ngl_gatherer',
    'type': 'STRING'
}, {
    'name': 'pad_name',
    'type': 'STRING'
}, {
    'name': 'acre_spacing',
    'type': 'NUMERIC'
}, {
    'name': 'allocation_type',
    'type': 'STRING'
}, {
    'name': 'api10',
    'type': 'STRING'
}, {
    'name': 'aries_id',
    'type': 'STRING'
}, {
    'name': 'azimuth',
    'type': 'NUMERIC'
}, {
    'name': 'completion_design',
    'type': 'STRING'
}, {
    'name': 'completion_end_date',
    'type': 'DATE'
}, {
    'name': 'completion_start_date',
    'type': 'DATE'
}, {
    'name': 'country',
    'type': 'STRING'
}, {
    'name': 'cum_boe',
    'type': 'NUMERIC'
}, {
    'name': 'cum_boe_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'cum_gas',
    'type': 'NUMERIC'
}, {
    'name': 'cum_gas_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'cum_gor',
    'type': 'NUMERIC'
}, {
    'name': 'cum_mmcfge',
    'type': 'NUMERIC'
}, {
    'name': 'cum_mmcfge_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'cum_oil',
    'type': 'NUMERIC'
}, {
    'name': 'cum_oil_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'cum_water',
    'type': 'NUMERIC'
}, {
    'name': 'cum_water_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'current_operator_ticker',
    'type': 'STRING'
}, {
    'name': 'drainage_area',
    'type': 'NUMERIC'
}, {
    'name': 'drill_end_date',
    'type': 'DATE'
}, {
    'name': 'drill_start_date',
    'type': 'DATE'
}, {
    'name': 'first_6_boe',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_boe_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_gas',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_gas_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_gor',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_mmcfge',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_mmcfge_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_oil',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_oil_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_water',
    'type': 'NUMERIC'
}, {
    'name': 'first_6_water_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_cluster_count',
    'type': 'NUMERIC'
}, {
    'name': 'first_fluid_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_fluid_volume',
    'type': 'NUMERIC'
}, {
    'name': 'first_prod_date',
    'type': 'DATE'
}, {
    'name': 'first_prod_date_daily_calc',
    'type': 'DATE'
}, {
    'name': 'first_prop_weight',
    'type': 'NUMERIC'
}, {
    'name': 'first_proppant_per_fluid',
    'type': 'NUMERIC'
}, {
    'name': 'first_proppant_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'first_stage_count',
    'type': 'NUMERIC'
}, {
    'name': 'first_treatment_type',
    'type': 'STRING'
}, {
    'name': 'fluid_type',
    'type': 'STRING'
}, {
    'name': 'footage_in_landing_zone',
    'type': 'NUMERIC'
}, {
    'name': 'formation_thickness_mean',
    'type': 'NUMERIC'
}, {
    'name': 'generic',
    'type': 'BOOLEAN'
}, {
    'name': 'gross_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'has_daily',
    'type': 'BOOLEAN'
}, {
    'name': 'has_monthly',
    'type': 'BOOLEAN'
}, {
    'name': 'heel_latitude',
    'type': 'NUMERIC'
}, {
    'name': 'heel_longitude',
    'type': 'NUMERIC'
}, {
    'name': 'horizontal_spacing',
    'type': 'NUMERIC'
}, {
    'name': 'hz_well_spacing_any_zone',
    'type': 'NUMERIC'
}, {
    'name': 'last_prod_date_daily',
    'type': 'DATE'
}, {
    'name': 'last_prod_date_monthly',
    'type': 'DATE'
}, {
    'name': 'lateral_length',
    'type': 'NUMERIC'
}, {
    'name': 'lease_name',
    'type': 'STRING'
}, {
    'name': 'measured_depth',
    'type': 'NUMERIC'
}, {
    'name': 'months_produced',
    'type': 'NUMERIC'
}, {
    'name': 'num_treatment_records',
    'type': 'NUMERIC'
}, {
    'name': 'oil_specific_gravity',
    'type': 'NUMERIC'
}, {
    'name': 'parent_child_any_zone',
    'type': 'STRING'
}, {
    'name': 'parent_child_same_zone',
    'type': 'STRING'
}, {
    'name': 'percent_in_zone',
    'type': 'NUMERIC'
}, {
    'name': 'permit_date',
    'type': 'DATE'
}, {
    'name': 'previous_operator',
    'type': 'STRING'
}, {
    'name': 'previous_operator_alias',
    'type': 'STRING'
}, {
    'name': 'previous_operator_ticker',
    'type': 'STRING'
}, {
    'name': 'primary_product',
    'type': 'STRING'
}, {
    'name': 'production_method',
    'type': 'STRING'
}, {
    'name': 'proppant_mesh_size',
    'type': 'STRING'
}, {
    'name': 'proppant_type',
    'type': 'STRING'
}, {
    'name': 'refrac_fluid_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_fluid_volume',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_prop_weight',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_proppant_per_fluid',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_proppant_per_perforated_interval',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_stage_count',
    'type': 'NUMERIC'
}, {
    'name': 'refrac_treatment_type',
    'type': 'STRING'
}, {
    'name': 'section',
    'type': 'STRING'
}, {
    'name': 'spud_date',
    'type': 'DATE'
}, {
    'name': 'subplay',
    'type': 'STRING'
}, {
    'name': 'thickness',
    'type': 'NUMERIC'
}, {
    'name': 'total_additive_volume',
    'type': 'NUMERIC'
}, {
    'name': 'total_cluster_count',
    'type': 'NUMERIC'
}, {
    'name': 'total_fluid_volume',
    'type': 'NUMERIC'
}, {
    'name': 'total_prop_weight',
    'type': 'NUMERIC'
}, {
    'name': 'total_proppant_per_fluid',
    'type': 'NUMERIC'
}, {
    'name': 'township',
    'type': 'STRING'
}, {
    'name': 'vertical_spacing',
    'type': 'NUMERIC'
}, {
    'name': 'vt_well_spacing_any_zone',
    'type': 'NUMERIC'
}, {
    'name': 'abstract',
    'type': 'STRING'
}, {
    'name': 'api12',
    'type': 'STRING'
}, {
    'name': 'block',
    'type': 'STRING'
}, {
    'name': 'chosen_key_id',
    'type': 'STRING'
}, {
    'name': 'current_operator_code',
    'type': 'STRING'
}, {
    'name': 'data_source',
    'type': 'STRING'
}, {
    'name': 'district',
    'type': 'STRING'
}, {
    'name': 'elevation_type',
    'type': 'STRING'
}, {
    'name': 'first_frac_vendor',
    'type': 'STRING'
}, {
    'name': 'flow_path',
    'type': 'STRING'
}, {
    'name': 'most_recent_import_type',
    'type': 'STRING'
}, {
    'name': 'lease_number',
    'type': 'STRING'
}, {
    'name': 'phdwin_id',
    'type': 'STRING'
}, {
    'name': 'previous_operator_code',
    'type': 'STRING'
}, {
    'name': 'range',
    'type': 'STRING'
}, {
    'name': 'recovery_method',
    'type': 'STRING'
}, {
    'name': 'refrac_frac_vendor',
    'type': 'STRING'
}, {
    'name': 'rig',
    'type': 'STRING'
}, {
    'name': 'survey',
    'type': 'STRING'
}, {
    'name': 'toe_in_landing_zone',
    'type': 'STRING'
}, {
    'name': 'toe_up',
    'type': 'STRING'
}, {
    'name': 'most_recent_import_desc',
    'type': 'STRING'
}, {
    'name': 'custom_string_0',
    'type': 'STRING'
}, {
    'name': 'custom_string_1',
    'type': 'STRING'
}, {
    'name': 'custom_string_2',
    'type': 'STRING'
}, {
    'name': 'custom_string_3',
    'type': 'STRING'
}, {
    'name': 'custom_string_4',
    'type': 'STRING'
}, {
    'name': 'custom_string_5',
    'type': 'STRING'
}, {
    'name': 'custom_string_6',
    'type': 'STRING'
}, {
    'name': 'custom_string_7',
    'type': 'STRING'
}, {
    'name': 'custom_string_8',
    'type': 'STRING'
}, {
    'name': 'custom_string_9',
    'type': 'STRING'
}, {
    'name': 'custom_string_10',
    'type': 'STRING'
}, {
    'name': 'custom_string_11',
    'type': 'STRING'
}, {
    'name': 'custom_string_12',
    'type': 'STRING'
}, {
    'name': 'custom_string_13',
    'type': 'STRING'
}, {
    'name': 'custom_string_14',
    'type': 'STRING'
}, {
    'name': 'custom_string_15',
    'type': 'STRING'
}, {
    'name': 'custom_string_16',
    'type': 'STRING'
}, {
    'name': 'custom_string_17',
    'type': 'STRING'
}, {
    'name': 'custom_string_18',
    'type': 'STRING'
}, {
    'name': 'custom_string_19',
    'type': 'STRING'
}]

WELL_HEADER_SCHEMA = [{
    'mode': 'REQUIRED',
    'name': 'well_id',
    'type': 'STRING'
}, {
    'mode': 'REQUIRED',
    'name': 'run_id',
    'type': 'STRING'
}, {
    'name': 'run_date',
    'mode': 'REQUIRED',
    'type': 'DATE'
}, {
    'mode': 'REQUIRED',
    'name': 'created_at',
    'type': 'TIMESTAMP'
}, *WELL_HEADER]

MONTHLY_SCHEMA = [{
    'mode': 'REQUIRED',
    'name': 'created_at',
    'type': 'TIMESTAMP'
}, {
    'name': 'state_tax_rate',
    'type': 'NUMERIC'
}, {
    'name': 'federal_tax_rate',
    'type': 'NUMERIC'
}, {
    'name': 'ad_valorem_tax',
    'type': 'NUMERIC'
}, {
    'name': 'afit_first_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'afit_second_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'after_income_tax_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'before_income_tax_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'capex_qualifier',
    'type': 'STRING'
}, {
    'name': 'combo_name',
    'type': 'STRING'
}, {
    'name': 'date',
    'type': 'DATE'
}, {
    'name': 'dates_qualifier',
    'type': 'STRING'
}, {
    'name': 'depletion',
    'type': 'NUMERIC'
}, {
    'name': 'depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_price',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'error',
    'type': 'STRING'
}, {
    'name': 'expenses_qualifier',
    'type': 'STRING'
}, {
    'name': 'federal_income_tax',
    'type': 'NUMERIC'
}, {
    'name': 'first_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'forecast_p_series_qualifier',
    'type': 'STRING'
}, {
    'name': 'forecast_qualifier',
    'type': 'STRING'
}, {
    'name': 'gas_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_price',
    'type': 'NUMERIC'
}, {
    'name': 'gas_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'gas_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'gas_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gross_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_boe_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_gas_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_oil_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_water_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_oil_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_gas_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_water_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_completion',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_development',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_legal',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_pad',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_workover',
    'type': 'NUMERIC'
}, {
    'name': 'monthly_well_cost',
    'type': 'NUMERIC'
}, {
    'name': 'net_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_profit',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_price',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'nri_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'nri_gas',
    'type': 'NUMERIC'
}, {
    'name': 'nri_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'nri_oil',
    'type': 'NUMERIC'
}, {
    'name': 'oil_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_price',
    'type': 'NUMERIC'
}, {
    'name': 'oil_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'oil_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'oil_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_1',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_2',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_3',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_4',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_5',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_6',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_7',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_8',
    'type': 'NUMERIC'
}, {
    'name': 'ownership_reversion_qualifier',
    'type': 'STRING'
}, {
    'name': 'percentage_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'econ_prms_reserves_category',
    'type': 'STRING'
}, {
    'name': 'econ_prms_reserves_sub_category',
    'type': 'STRING'
}, {
    'name': 'econ_prms_resources_class',
    'type': 'STRING'
}, {
    'name': 'production_taxes_qualifier',
    'type': 'STRING'
}, {
    'name': 'production_vs_fit_qualifier',
    'type': 'STRING'
}, {
    'name': 'reserves_category_qualifier',
    'type': 'STRING'
}, {
    'name': 'risking_qualifier',
    'type': 'STRING'
}, {
    'name': 'run_date',
    'type': 'DATE'
}, {
    'name': 'run_id',
    'type': 'STRING'
}, {
    'name': 'schedule_qualifier',
    'type': 'STRING'
}, {
    'name': 'second_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'state_income_tax',
    'type': 'NUMERIC'
}, {
    'name': 'stream_properties_qualifier',
    'type': 'STRING'
}, {
    'name': 'tangible_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_completion',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_development',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_legal',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_pad',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_workover',
    'type': 'NUMERIC'
}, {
    'name': 'taxable_income',
    'type': 'NUMERIC'
}, {
    'name': 'total_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'total_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'total_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'total_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_completion',
    'type': 'NUMERIC'
}, {
    'name': 'total_deductions',
    'type': 'NUMERIC'
}, {
    'name': 'total_development',
    'type': 'NUMERIC'
}, {
    'name': 'total_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'total_drip_condensate_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'total_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'total_fixed_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_gas_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_intangible_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'total_legal',
    'type': 'NUMERIC'
}, {
    'name': 'total_ngl_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_oil_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'total_pad',
    'type': 'NUMERIC'
}, {
    'name': 'total_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'total_production_tax',
    'type': 'NUMERIC'
}, {
    'name': 'total_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'total_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'total_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'total_tangible_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'total_workover',
    'type': 'NUMERIC'
}, {
    'name': 'warning',
    'type': 'STRING'
}, {
    'name': 'water_disposal',
    'type': 'NUMERIC'
}, {
    'name': 'well_id',
    'type': 'STRING'
}, {
    'name': 'well_index',
    'type': 'NUMERIC'
}, {
    'name': 'wi_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'wi_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_gas',
    'type': 'NUMERIC'
}, {
    'name': 'wi_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_oil',
    'type': 'NUMERIC'
}, {
    'name': 'wi_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'combo_well_id',
    'type': 'STRING'
}, {
    'name': 'gross_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'wi_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'nri_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'oil_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'gas_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'water_start_using_forecast_date',
    'type': 'DATE'
}, {
    'name': 'reversion_date',
    'type': 'STRING'
}, {
    'name': 'gor',
    'type': 'NUMERIC'
}, {
    'name': 'wor',
    'type': 'NUMERIC'
}, {
    'name': 'water_cut',
    'type': 'NUMERIC'
}, {
    'name': 'econ_first_production_date',
    'type': 'DATE'
}, {
    'name': 'pricing_qualifier',
    'type': 'STRING'
}, {
    'name': 'differentials_qualifier',
    'type': 'STRING'
}, {
    'name': 'incremental_name',
    'type': 'STRING'
}, {
    'name': 'incremental_index',
    'type': 'INTEGER'
}, {
    'name': 'combo_well_incremental_id',
    'type': 'STRING'
}, {
    'name': 'first_discounted_capex',
    'type': 'NUMERIC'
}, {
    'name': 'second_discounted_capex',
    'type': 'NUMERIC'
}, {
    'name': 'net_income',
    'type': 'NUMERIC'
}, {
    'name': 'first_discount_net_income',
    'type': 'NUMERIC'
}, {
    'name': 'second_discount_net_income',
    'type': 'NUMERIC'
}, {
    'name': 'input_oil_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_gas_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_ngl_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_drip_condensate_price',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_yield',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_yield',
    'type': 'NUMERIC'
}, {
    'name': 'oil_shrinkage',
    'type': 'NUMERIC'
}, {
    'name': 'gas_shrinkage',
    'type': 'NUMERIC'
}, {
    'name': 'oil_loss',
    'type': 'NUMERIC'
}, {
    'name': 'gas_loss',
    'type': 'NUMERIC'
}, {
    'name': 'gas_flare',
    'type': 'NUMERIC'
}, {
    'name': 'gross_mcfe_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_water_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_water_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'lease_nri',
    'type': 'NUMERIC'
}, {
    'name': 'oil_risk',
    'type': 'NUMERIC'
}, {
    'name': 'gas_risk',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_risk',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_risk',
    'type': 'NUMERIC'
}, {
    'name': 'water_risk',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_oil_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_water_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_ngl_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_drip_condensate_volume',
    'type': 'NUMERIC'
}, {
    'name': 'unshrunk_oil_volume',
    'type': 'NUMERIC'
}, {
    'name': 'unshrunk_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_flare_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'total_gross_capex',
    'type': 'NUMERIC'
}, {
    'name': 'pre_yield_gas_volume_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'pre_yield_gas_volume_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'gross_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'co2e_expense',
    'type': 'NUMERIC'
}, {
    'name': 'co2_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ch4_expense',
    'type': 'NUMERIC'
}, {
    'name': 'n2o_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_carbon_expense',
    'type': 'NUMERIC'
}, {
    'name': 'tax_credit',
    'type': 'NUMERIC'
}]

ONE_LINER_SCHEMA = [
    {
        'mode': 'REQUIRED',
        'name': 'created_at',
        'type': 'TIMESTAMP'
    },
    {
        'name': 'abandonment_date',
        'type': 'DATE'
    },
    {
        'name': 'ad_valorem_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_10',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_11',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_12',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_13',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_14',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_15',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_16',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_4',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_5',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_6',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_7',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_8',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_discount_table_cash_flow_9',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_first_discount_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_second_discount_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'after_income_tax_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'as_of_date',
        'type': 'DATE'
    },
    {
        'name': 'before_income_tax_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'bfit_first_reversion_amount',
        'type': 'NUMERIC'
    },
    {
        'mode': 'REQUIRED',
        'name': 'capex_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'combo_name',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'combo_well_id',
        'type': 'STRING'
    },
    {
        'name': 'consecutive_negative_cash_flow_month_count',
        'type': 'NUMERIC'
    },
    {
        'name': 'consecutive_negative_cash_flow_months',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'dates_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'depletion',
        'type': 'NUMERIC'
    },
    {
        'name': 'depreciation',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_date',
        'type': 'DATE'
    },
    {
        'name': 'discount_table_cash_flow_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_10',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_11',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_12',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_13',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_14',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_15',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_16',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_4',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_5',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_6',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_7',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_8',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_cash_flow_9',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_gathering_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_marketing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_other_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_differentials_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_differentials_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_differentials_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_differentials_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_processing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_severance_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_shrunk_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_transportation_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_yield',
        'type': 'NUMERIC'
    },
    {
        'name': 'error',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'expenses_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'federal_income_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_consecutive_negative_cash_flow_month',
        'type': 'STRING'
    },
    {
        'name': 'first_discount_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_discount_roi',
        'type': 'FLOAT'
    },
    {
        'mode': 'REQUIRED',
        'name': 'forecast_p_series_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'forecast_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_assigned_p_series_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_assigned_p_series_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_best_fit_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_best_fit_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_best_fit_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_best_fit_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_breakeven',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_flare',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_gathering_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_loss',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_marketing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_other_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p10_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p10_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p10_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p10_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p10_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p10_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p10_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p10_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p50_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p50_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p50_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p50_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p90_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_p90_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'gas_p90_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_p90_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_processing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_severance_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_shrinkage',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_shrunk_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_transportation_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_well_head_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_abandonment',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_appraisal',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_artificial_lift',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_completion',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_depletion',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_depreciation',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_development',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_drilling',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_exploration',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_facilities',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_leasehold',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_legal',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_other_investment',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_pad',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_pipelines',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_salvage',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_waterline',
        'type': 'NUMERIC'
    },
    {
        'name': 'intangible_workover',
        'type': 'NUMERIC'
    },
    {
        'name': 'irr',
        'type': 'FLOAT'
    },
    {
        'name': 'last_consecutive_negative_cash_flow_month',
        'type': 'STRING'
    },
    {
        'name': 'monthly_well_cost',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_profit',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_gathering_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_marketing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_other_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_processing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_severance_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_shrunk_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_transportation_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_yield',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_nri_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_nri_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_nri_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_nri_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_assigned_p_series_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_assigned_p_series_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_best_fit_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_best_fit_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_best_fit_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_best_fit_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_breakeven',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_gathering_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_loss',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_marketing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_other_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p10_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p10_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p10_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p10_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p10_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p10_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p10_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p10_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p50_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p50_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p50_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p50_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p90_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_p90_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'oil_p90_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_p90_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_processing_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_severance_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_shrinkage',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_shrunk_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_transportation_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_well_head_eur',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_nri_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_nri_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_nri_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_nri_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_wi_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_wi_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_wi_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_wi_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_4',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_5',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_6',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_7',
        'type': 'NUMERIC'
    },
    {
        'name': 'other_monthly_cost_8',
        'type': 'NUMERIC'
    },
    {
        'name': 'percentage_depletion',
        'type': 'NUMERIC'
    },
    {
        'mode': 'REQUIRED',
        'name': 'ownership_reversion_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_reserves_category',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_reserves_sub_category',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_resources_class',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'production_taxes_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'production_vs_fit_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'reserves_category_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'risking_qualifier',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'run_date',
        'type': 'DATE'
    },
    {
        'mode': 'REQUIRED',
        'name': 'run_id',
        'type': 'STRING'
    },
    {
        'mode': 'REQUIRED',
        'name': 'schedule_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'second_discount_cash_flow',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discount_roi',
        'type': 'FLOAT'
    },
    {
        'name': 'shrunk_gas_btu',
        'type': 'NUMERIC'
    },
    {
        'name': 'state_income_tax',
        'type': 'NUMERIC'
    },
    {
        'mode': 'REQUIRED',
        'name': 'stream_properties_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'tangible_abandonment',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_appraisal',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_artificial_lift',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_completion',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_depletion',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_depreciation',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_development',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_drilling',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_exploration',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_facilities',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_leasehold',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_legal',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_other_investment',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_pad',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_pipelines',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_salvage',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_waterline',
        'type': 'NUMERIC'
    },
    {
        'name': 'tangible_workover',
        'type': 'NUMERIC'
    },
    {
        'name': 'taxable_income',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_abandonment',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_appraisal',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_artificial_lift',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_completion',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_deductions',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_development',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_drilling',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_drip_condensate_variable_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_oil_variable_expense_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_gas_variable_expense_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_water_variable_expense_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_ngl_variable_expense_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_drip_condensate_variable_expense_input',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_exploration',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_facilities',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_fixed_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_gas_variable_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_intangible_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_leasehold',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_legal',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_negative_cash_flow_month_count',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_discount_rate',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discount_rate',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_rate_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'discount_table_rate_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_capital_efficiency_attribute',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_years_capital_efficiency_attribute',
        'type': 'NUMERIC'
    },
    {
        'name': 'well_life_capital_efficiency_attribute',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_ngl_variable_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_oil_variable_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_other_investment',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_pad',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_pipelines',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_production_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_salvage',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_severance_tax',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_tangible_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_variable_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_waterline',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_workover',
        'type': 'NUMERIC'
    },
    {
        'name': 'undiscounted_payout',
        'type': 'STRING'
    },
    {
        'name': 'afit_undiscounted_payout',
        'type': 'STRING'
    },
    {
        'name': 'undiscounted_roi',
        'type': 'FLOAT'
    },
    {
        'name': 'unshrunk_gas_btu',
        'type': 'NUMERIC'
    },
    {
        'name': 'warning',
        'type': 'STRING'
    },
    {
        'name': 'water_assigned_p_series_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_assigned_p_series_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_assigned_p_series_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_assigned_p_series_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_assigned_p_series_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_assigned_p_series_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_assigned_p_series_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_assigned_p_series_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_assigned_p_series_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_best_fit_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_best_fit_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_best_fit_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_best_fit_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_disposal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p10_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p10_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p10_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p10_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p10_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p10_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p10_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p10_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p50_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p50_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p50_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p50_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_first_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_first_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_first_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p90_first_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_first_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_last_segment_b',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_d1_nominal',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_di_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_end_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_last_segment_q_end',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_q_start',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_realized_d_sw_eff_sec',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_p90_last_segment_segment_type',
        'type': 'STRING'
    },
    {
        'name': 'water_p90_last_segment_start_date',
        'type': 'DATE'
    },
    {
        'name': 'water_p90_last_segment_sw_date',
        'type': 'DATE'
    },
    {
        'name': 'water_well_head_eur',
        'type': 'NUMERIC'
    },
    {
        'mode': 'REQUIRED',
        'name': 'well_id',
        'type': 'STRING'
    },
    {
        'name': 'well_index',
        'type': 'NUMERIC'
    },
    {
        'name': 'well_life',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_wi_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_wi_gas',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_wi_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_reversion_wi_oil',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'payout_duration',
        'type': 'FLOAT'
    },
    {
        'name': 'afit_payout_duration',
        'type': 'NUMERIC'
    },
    {
        'name': 'econ_first_production_date',
        'type': 'DATE'
    },
    {
        'name': 'oil_start_using_forecast_date',
        'type': 'DATE'
    },
    {
        'name': 'gas_start_using_forecast_date',
        'type': 'DATE'
    },
    {
        'name': 'water_start_using_forecast_date',
        'type': 'DATE'
    },
    {
        'name': 'reversion_date',
        'type': 'STRING'
    },
    {
        'name': 'gor',
        'type': 'NUMERIC'
    },
    {
        'name': 'wor',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_cut',
        'type': 'NUMERIC'
    },
    {
        'name': 'pricing_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'differentials_qualifier',
        'type': 'STRING'
    },
    {
        'name': 'incremental_name',
        'type': 'STRING'
    },
    {
        'name': 'incremental_index',
        'type': 'INTEGER'
    },
    {
        'name': 'combo_well_incremental_id',
        'type': 'STRING'
    },
    {
        'name': 'first_discounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_income',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_discount_net_income',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discount_net_income',
        'type': 'NUMERIC'
    },
    {
        'name': 'input_oil_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'input_gas_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'input_ngl_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'input_drip_condensate_price',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_differentials_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_differentials_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_differentials_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_differentials_1',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_differentials_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_differentials_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_differentials_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_differentials_2',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_differentials_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_differentials_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_differentials_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_differentials_3',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_mcfe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_mcfe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_mcfe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_water_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_mcfe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'net_water_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'lease_nri',
        'type': 'NUMERIC'
    },
    {
        'name': 'original_lease_nri',
        'type': 'NUMERIC'
    },
    {
        'name': 'forecast_name',
        'type': 'STRING'
    },
    {
        'name': 'ownership_reversion_model_name',
        'type': 'STRING'
    },
    {
        'name': 'differentials_model_name',
        'type': 'STRING'
    },
    {
        'name': 'production_taxes_model_name',
        'type': 'STRING'
    },
    {
        'name': 'capex_model_name',
        'type': 'STRING'
    },
    {
        'name': 'capex_description',
        'type': 'STRING'
    },
    {
        'name': 'expenses_model_name',
        'type': 'STRING'
    },
    {
        'name': 'expenses_description',
        'type': 'STRING'
    },
    {
        'name': 'stream_properties_model_name',
        'type': 'STRING'
    },
    {
        'name': 'dates_model_name',
        'type': 'STRING'
    },
    {
        'name': 'pricing_model_name',
        'type': 'STRING'
    },
    {
        'name': 'risking_model_name',
        'type': 'STRING'
    },
    {
        'name': 'oil_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_discount_roi_undiscounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discount_roi_undiscounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_well_head_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_well_head_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_well_head_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_shrunk_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_shrunk_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_shrunk_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_shrunk_eur_over_pll',
        'type': 'NUMERIC'
    },
    {
        'name': 'first_discount_payout',
        'type': 'STRING'
    },
    {
        'name': 'first_discount_payout_duration',
        'type': 'NUMERIC'
    },
    {
        'name': 'second_discount_payout',
        'type': 'STRING'
    },
    {
        'name': 'second_discount_payout_duration',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_oil_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_net_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_wi_oil_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_gas_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_net_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_wi_gas_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_boe_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_net_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_wi_boe_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_net_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_wi_ngl_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_water_well_head_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_gross_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_net_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_month_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_month_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'six_month_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'one_year_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'two_year_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'three_year_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'five_year_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'ten_year_wi_drip_condensate_sales_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_production_as_of_date',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_production_as_of_date',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_production_as_of_date',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_one_month_oil_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_three_month_oil_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_one_month_gas_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_three_month_gas_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_one_month_boe_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_three_month_boe_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_one_month_mcfe_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_three_month_mcfe_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_one_month_water_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'last_three_month_water_average',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_boe_conversion',
        'type': 'NUMERIC'
    },
    {
        'name': 'wet_gas_boe_conversion',
        'type': 'NUMERIC'
    },
    {
        'name': 'dry_gas_boe_conversion',
        'type': 'NUMERIC'
    },
    {
        'name': 'ngl_boe_conversion',
        'type': 'NUMERIC'
    },
    {
        'name': 'drip_condensate_boe_conversion',
        'type': 'NUMERIC'
    },
    {
        'name': 'oil_tc_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'gas_tc_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'water_tc_risk',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_risk_oil_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_risk_gas_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_risk_water_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_risk_ngl_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_risk_drip_condensate_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'unshrunk_oil_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'unshrunk_gas_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_flare_gas_volume',
        'type': 'NUMERIC'
    },
    {
        'name': 'apply_normalization',
        'type': 'STRING'
    },
    {
        'name': 'total_gross_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_yield_gas_volume_drip_condensate',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_irr',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_undiscounted_roi',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_first_discount_roi',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_second_discount_roi',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_first_discount_roi_undiscounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_second_discount_roi_undiscounted_capex',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_first_discount_payout',
        'type': 'STRING'
    },
    {
        'name': 'afit_second_discount_payout',
        'type': 'STRING'
    },
    {
        'name': 'afit_first_discount_payout_duration',
        'type': 'NUMERIC'
    },
    {
        'name': 'afit_second_discount_payout_duration',
        'type': 'NUMERIC'
    },
    {
        'name': 'pre_yield_gas_volume_ngl',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_co2e_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_co2e_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_co2e_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_co2_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_co2_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_co2_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_ch4_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_ch4_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_ch4_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_n2o_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_n2o_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_n2o_mass_emission',
        'type': 'NUMERIC'
    },
    {
        'name': 'co2e_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'co2_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'ch4_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'n2o_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_carbon_expense',
        'type': 'NUMERIC'
    },
    {
        'name': 'tax_credit',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_well_count',
        'type': 'NUMERIC'
    },
    {
        'name': 'wi_well_count',
        'type': 'NUMERIC'
    },
    {
        'name': 'nri_well_count',
        'type': 'NUMERIC'
    },
]

AGGREGATION_ECON_SCHEMA = [{
    'name': 'capex_qualifier',
    'type': 'STRING'
}, {
    'name': 'state_tax_rate',
    'type': 'NUMERIC'
}, {
    'name': 'federal_tax_rate',
    'type': 'NUMERIC'
}, {
    'name': 'dates_qualifier',
    'type': 'STRING'
}, {
    'name': 'expenses_qualifier',
    'type': 'STRING'
}, {
    'name': 'ownership_reversion_qualifier',
    'type': 'STRING'
}, {
    'name': 'production_taxes_qualifier',
    'type': 'STRING'
}, {
    'name': 'production_vs_fit_qualifier',
    'type': 'STRING'
}, {
    'name': 'reserves_category_qualifier',
    'type': 'STRING'
}, {
    'name': 'risking_qualifier',
    'type': 'STRING'
}, {
    'name': 'stream_properties_qualifier',
    'type': 'STRING'
}, {
    'name': 'forecast_qualifier',
    'type': 'STRING'
}, {
    'name': 'forecast_p_series_qualifier',
    'type': 'STRING'
}, {
    'name': 'schedule_qualifier',
    'type': 'STRING'
}, {
    'name': 'ad_valorem_tax',
    'type': 'NUMERIC'
}, {
    'name': 'after_income_tax_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'before_income_tax_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'depletion',
    'type': 'NUMERIC'
}, {
    'name': 'depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_price',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_depreciation',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'percentage_depletion',
    'type': 'NUMERIC'
}, {
    'name': 'total_deductions',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'federal_income_tax',
    'type': 'NUMERIC'
}, {
    'name': 'first_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'afit_first_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'gas_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_price',
    'type': 'NUMERIC'
}, {
    'name': 'gas_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gas_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'gas_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'gas_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'gross_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_boe_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_gas_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_oil_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_water_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_oil_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_gas_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_water_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'monthly_well_cost',
    'type': 'NUMERIC'
}, {
    'name': 'net_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_profit',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_price',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'nri_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'nri_gas',
    'type': 'NUMERIC'
}, {
    'name': 'nri_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'nri_oil',
    'type': 'NUMERIC'
}, {
    'name': 'oil_gathering_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_marketing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_other_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_price',
    'type': 'NUMERIC'
}, {
    'name': 'oil_processing_expense',
    'type': 'NUMERIC'
}, {
    'name': 'oil_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'oil_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'oil_transportation_expense',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_1',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_2',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_3',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_4',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_5',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_6',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_7',
    'type': 'NUMERIC'
}, {
    'name': 'other_monthly_cost_8',
    'type': 'NUMERIC'
}, {
    'name': 'second_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'afit_second_discount_cash_flow',
    'type': 'NUMERIC'
}, {
    'name': 'state_income_tax',
    'type': 'NUMERIC'
}, {
    'name': 'taxable_income',
    'type': 'NUMERIC'
}, {
    'name': 'total_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_drip_condensate_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_fixed_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_gas_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_intangible_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_ngl_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_oil_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_production_tax',
    'type': 'NUMERIC'
}, {
    'name': 'total_revenue',
    'type': 'NUMERIC'
}, {
    'name': 'total_severance_tax',
    'type': 'NUMERIC'
}, {
    'name': 'total_tangible_capex',
    'type': 'NUMERIC'
}, {
    'name': 'total_variable_expense',
    'type': 'NUMERIC'
}, {
    'name': 'water_disposal',
    'type': 'NUMERIC'
}, {
    'name': 'wi_boe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'wi_drip_condensate_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_gas',
    'type': 'NUMERIC'
}, {
    'name': 'wi_gas_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ngl_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_oil',
    'type': 'NUMERIC'
}, {
    'name': 'wi_oil_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'total_drilling',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_completion',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_completion',
    'type': 'NUMERIC'
}, {
    'name': 'total_completion',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_legal',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_legal',
    'type': 'NUMERIC'
}, {
    'name': 'total_legal',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_pad',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_pad',
    'type': 'NUMERIC'
}, {
    'name': 'total_pad',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'total_facilities',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'total_artificial_lift',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_workover',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_workover',
    'type': 'NUMERIC'
}, {
    'name': 'total_workover',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'total_leasehold',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_development',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_development',
    'type': 'NUMERIC'
}, {
    'name': 'total_development',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'total_pipelines',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'total_exploration',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'total_waterline',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'total_appraisal',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'total_other_investment',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'total_abandonment',
    'type': 'NUMERIC'
}, {
    'name': 'tangible_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'intangible_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'total_salvage',
    'type': 'NUMERIC'
}, {
    'name': 'gross_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'wi_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'nri_well_count',
    'type': 'NUMERIC'
}, {
    'name': 'pricing_qualifier',
    'type': 'STRING'
}, {
    'name': 'differentials_qualifier',
    'type': 'STRING'
}, {
    'name': 'first_discounted_capex',
    'type': 'NUMERIC'
}, {
    'name': 'second_discounted_capex',
    'type': 'NUMERIC'
}, {
    'name': 'net_income',
    'type': 'NUMERIC'
}, {
    'name': 'first_discount_net_income',
    'type': 'NUMERIC'
}, {
    'name': 'second_discount_net_income',
    'type': 'NUMERIC'
}, {
    'name': 'input_oil_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_gas_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_ngl_price',
    'type': 'NUMERIC'
}, {
    'name': 'input_drip_condensate_price',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_1',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_2',
    'type': 'NUMERIC'
}, {
    'name': 'oil_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'gas_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_differentials_3',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_yield',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_yield',
    'type': 'NUMERIC'
}, {
    'name': 'oil_shrinkage',
    'type': 'NUMERIC'
}, {
    'name': 'gas_shrinkage',
    'type': 'NUMERIC'
}, {
    'name': 'oil_loss',
    'type': 'NUMERIC'
}, {
    'name': 'gas_loss',
    'type': 'NUMERIC'
}, {
    'name': 'gas_flare',
    'type': 'NUMERIC'
}, {
    'name': 'gross_mcfe_well_head_volume',
    'type': 'NUMERIC'
}, {
    'name': 'gross_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'wi_water_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_mcfe_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'net_water_sales_volume',
    'type': 'NUMERIC'
}, {
    'name': 'lease_nri',
    'type': 'NUMERIC'
}, {
    'name': 'oil_risk',
    'type': 'NUMERIC'
}, {
    'name': 'gas_risk',
    'type': 'NUMERIC'
}, {
    'name': 'ngl_risk',
    'type': 'NUMERIC'
}, {
    'name': 'drip_condensate_risk',
    'type': 'NUMERIC'
}, {
    'name': 'water_risk',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_oil_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_water_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_ngl_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_risk_drip_condensate_volume',
    'type': 'NUMERIC'
}, {
    'name': 'unshrunk_oil_volume',
    'type': 'NUMERIC'
}, {
    'name': 'unshrunk_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'pre_flare_gas_volume',
    'type': 'NUMERIC'
}, {
    'name': 'total_gross_capex',
    'type': 'NUMERIC'
}, {
    'name': 'pre_yield_gas_volume_ngl',
    'type': 'NUMERIC'
}, {
    'name': 'pre_yield_gas_volume_drip_condensate',
    'type': 'NUMERIC'
}, {
    'name': 'gross_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_co2e_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_co2_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_ch4_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'gross_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'wi_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'nri_n2o_mass_emission',
    'type': 'NUMERIC'
}, {
    'name': 'co2e_expense',
    'type': 'NUMERIC'
}, {
    'name': 'co2_expense',
    'type': 'NUMERIC'
}, {
    'name': 'ch4_expense',
    'type': 'NUMERIC'
}, {
    'name': 'n2o_expense',
    'type': 'NUMERIC'
}, {
    'name': 'total_carbon_expense',
    'type': 'NUMERIC'
}, {
    'name': 'tax_credit',
    'type': 'NUMERIC'
}]

GROSS_REVENUE = [
    {
        'name': 'gross_oil_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_gas_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_ngl_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'gross_drip_condensate_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_gross_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': '100_pct_wi_oil_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': '100_pct_wi_gas_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': '100_pct_wi_ngl_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': '100_pct_wi_drip_condensate_revenue',
        'type': 'NUMERIC'
    },
    {
        'name': 'total_100_pct_wi_revenue',
        'type': 'NUMERIC'
    },
]

GROUP_ECON_ADDITIONAL = [
    {
        'name': 'net_boe_well_head_volume',
        'type': 'NUMERIC'
    },
]

AGGREGATION_SCHEMA = [
    *WELL_HEADER,
    *AGGREGATION_ECON_SCHEMA,
    {
        'name': 'run_id',
        'type': 'STRING'
    },
    {
        'name': 'run_date',
        'type': 'DATE'
    },
    {
        'name': 'created_at',
        'type': 'TIMESTAMP'
    },
    {
        'name': 'combo_name',
        'type': 'STRING'
    },
    {
        'name': 'econ_group',
        'type': 'STRING'
    },
    {
        'name': 'date',
        'type': 'DATE'
    },
    {
        'name': 'aggregation_group',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_reserves_category',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_reserves_sub_category',
        'type': 'STRING'
    },
    {
        'name': 'econ_prms_resources_class',
        'type': 'STRING'
    },
]
