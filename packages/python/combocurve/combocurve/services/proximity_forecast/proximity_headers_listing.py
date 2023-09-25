headers_map_list = [
    "_id",
    "abstract",
    "acre_spacing",
    "allocation_type",
    "api10",
    "api12",
    "api14",
    "aries_id",
    "azimuth",
    "basin",
    "block",
    "casing_id",
    "choke_size",
    "chosenID",
    "chosenKeyID",
    "cluster_count",
    "completion_design",
    "completion_end_date",
    "completion_start_date",
    "copied",
    "country",
    "county",
    "current_operator",
    "current_operator_alias",
    "current_operator_code",
    "current_operator_ticker",
    "dataSource",
    "dataPool",
    "date_rig_release",
    "distance_from_base_of_zone",
    "distance_from_top_of_zone",
    "district",
    "drill_end_date",
    "drill_start_date",
    "elevation",
    "elevation_type",
    "field",
    "first_additive_volume",
    "first_cluster_count",
    "first_fluid_per_perforated_interval",
    "first_fluid_volume",
    "first_frac_vendor",
    "first_max_injection_pressure",
    "first_max_injection_rate",
    "first_prod_date",
    "first_prod_date_daily_calc",
    "first_prod_date_monthly_calc",
    "first_prop_weight",
    "first_proppant_per_fluid",
    "first_proppant_per_perforated_interval",
    "first_stage_count",
    "first_test_flow_tbg_press",
    "first_test_gas_vol",
    "first_test_gor",
    "first_test_oil_vol",
    "first_test_water_vol",
    "first_treatment_type",
    "flow_path",
    "fluid_type",
    "footage_in_landing_zone",
    "formation_thickness_mean",
    "gas_gatherer",
    "gas_specific_gravity",
    "generic",
    "ground_elevation",
    "has_daily",
    "has_monthly",
    "heelLatitude",
    "heelLongitude",
    "hole_direction",
    "hz_well_spacing_any_zone",
    "hz_well_spacing_same_zone",
    "mostRecentImportType",
    "mostRecentImportDate",
    "initial_respress",
    "initial_restemp",
    "inptID",
    "landing_zone",
    "landing_zone_base",
    "landing_zone_top",
    "last_prod_date_monthly",
    "last_prod_date_daily",
    "lateral_length",
    "lease_expiration",
    "lease_name",
    "lease_number",
    "lower_perforation",
    "matrix_permeability",
    "measured_depth",
    "num_treatment_records",
    "oil_api_gravity",
    "oil_gatherer",
    "oil_specific_gravity",
    "pad_name",
    "parent_child_any_zone",
    "parent_child_same_zone",
    "percent_in_zone",
    "perf_lateral_length",
    "permit_date",
    "phdwin_id",
    "play",
    "porosity",
    "previous_operator",
    "previous_operator_alias",
    "previous_operator_code",
    "previous_operator_ticker",
    "primary_product",
    "production_method",
    "proppant_mesh_size",
    "proppant_type",
    "range",
    "recovery_method",
    "refrac_additive_volume",
    "refrac_cluster_count",
    "refrac_date",
    "refrac_fluid_per_perforated_interval",
    "refrac_fluid_volume",
    "refrac_frac_vendor",
    "refrac_max_injection_pressure",
    "refrac_max_injection_rate",
    "refrac_prop_weight",
    "refrac_proppant_per_fluid",
    "refrac_proppant_per_perforated_interval",
    "refrac_stage_count",
    "refrac_treatment_type",
    "rig",
    "section",
    "sg",
    "so",
    "spud_date",
    "stage_spacing",
    "state",
    "status",
    "subplay",
    "surfaceLatitude",
    "surfaceLongitude",
    "survey",
    "sw",
    "target_formation",
    "thickness",
    "til",
    "toeLatitude",
    "toeLongitude",
    "toe_in_landing_zone",
    "toe_up",
    "total_additive_volume",
    "total_cluster_count",
    "total_fluid_per_perforated_interval",
    "total_fluid_volume",
    "total_prop_weight",
    "total_proppant_per_fluid",
    "total_proppant_per_perforated_interval",
    "total_stage_count",
    "township",
    "true_vertical_depth",
    "tubing_depth",
    "tubing_id",
    "type_curve_area",
    "upper_perforation",
    "vt_well_spacing_any_zone",
    "vt_well_spacing_same_zone",
    "well_name",
    "well_number",
    "well_type",
    "mostRecentImportDesc",
    "custom_string_0",
    "custom_string_1",
    "custom_string_2",
    "custom_string_3",
    "custom_string_4",
    "custom_string_5",
    "custom_string_6",
    "custom_string_7",
    "custom_string_8",
    "custom_string_9",
    "custom_string_10",
    "custom_string_11",
    "custom_string_12",
    "custom_string_13",
    "custom_string_14",
    "custom_string_15",
    "custom_string_16",
    "custom_string_17",
    "custom_string_18",
    "custom_string_19",
    "custom_number_0",
    "custom_number_1",
    "custom_number_2",
    "custom_number_3",
    "custom_number_4",
    "custom_number_5",
    "custom_number_6",
    "custom_number_7",
    "custom_number_8",
    "custom_number_9",
    "custom_number_10",
    "custom_number_11",
    "custom_number_12",
    "custom_number_13",
    "custom_number_14",
    "custom_number_15",
    "custom_number_16",
    "custom_number_17",
    "custom_number_18",
    "custom_number_19",
    "custom_date_0",
    "custom_date_1",
    "custom_date_2",
    "custom_date_3",
    "custom_date_4",
    "custom_date_5",
    "custom_date_6",
    "custom_date_7",
    "custom_date_8",
    "custom_date_9",
    "custom_bool_0",
    "custom_bool_1",
    "custom_bool_2",
    "custom_bool_3",
    "custom_bool_4",
    "cum_boe",
    "cum_oil",
    "cum_gas",
    "cum_gor",
    "cum_water",
    "cum_mmcfge",
    "cum_boe_per_perforated_interval",
    "cum_gas_per_perforated_interval",
    "cum_oil_per_perforated_interval",
    "cum_water_per_perforated_interval",
    "cum_mmcfge_per_perforated_interval",
    "first_12_boe",
    "first_12_boe_per_perforated_interval",
    "first_12_gas",
    "first_12_gas_per_perforated_interval",
    "first_12_gor",
    "first_12_oil",
    "first_12_oil_per_perforated_interval",
    "first_12_water",
    "first_12_water_per_perforated_interval",
    "first_12_mmcfge",
    "first_12_mmcfge_per_perforated_interval",
    "first_6_boe",
    "first_6_boe_per_perforated_interval",
    "first_6_gas",
    "first_6_gas_per_perforated_interval",
    "first_6_gor",
    "first_6_mmcfge",
    "first_6_mmcfge_per_perforated_interval",
    "first_6_oil",
    "first_6_oil_per_perforated_interval",
    "first_6_water",
    "first_6_water_per_perforated_interval",
    "last_12_boe",
    "last_12_boe_per_perforated_interval",
    "last_12_gas",
    "last_12_gas_per_perforated_interval",
    "last_12_gor",
    "last_12_mmcfge",
    "last_12_mmcfge_per_perforated_interval",
    "last_12_oil",
    "last_12_oil_per_perforated_interval",
    "last_12_water",
    "last_12_water_per_perforated_interval",
    "last_month_boe",
    "last_month_boe_per_perforated_interval",
    "last_month_gas",
    "last_month_gas_per_perforated_interval",
    "last_month_gor",
    "last_month_mmcfge",
    "last_month_mmcfge_per_perforated_interval",
    "last_month_oil",
    "last_month_oil_per_perforated_interval",
    "last_month_water",
    "last_month_water_per_perforated_interval",
    "month_produced",
    "combo_name",
    "econ_run_date",
    "wi_oil",
    "nri_oil",
    "before_income_tax_cash_flow",
    "first_discount_cash_flow",
    "econ_first_production_date",
    "undiscounted_roi",
    "irr",
    "payout_duration",
    "oil_breakeven",
    "gas_breakeven",
    "oil_shrunk_eur",
    "gas_shrunk_eur",
    "ngl_shrunk_eur",
    "prms_reserves_category",
    "prms_reserves_sub_category",
    "createdAt",
    "updatedAt",
]

date_headers_list = [
    'completion_end_date',
    'completion_start_date',
    'date_rig_release',
    'drill_end_date',
    'drill_start_date',
    'first_prod_date',
    'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc',
    'mostRecentImportDate',
    'last_prod_date_monthly',
    'last_prod_date_daily',
    'lease_expiration',
    'permit_date',
    'refrac_date',
    'spud_date',
    'til',
    'econ_run_date',
    'econ_first_production_date',
    'custom_date_0',
    'custom_date_1',
    'custom_date_2',
    'custom_date_3',
    'custom_date_4',
    'custom_date_5',
    'custom_date_6',
    'custom_date_7',
    'custom_date_8',
    'custom_date_9',
    'createdAt',
    'updatedAt',
]

mandatory_headers = [
    'first_prod_date',
    'first_prod_date_daily_calc',
    'first_prod_date_monthly_calc',
    '_id',
    'surfaceLatitude',
    'surfaceLongitude',
]
