status_dt = {
    "component": "forecast-data",
    "title": "Forecast Status",
    "key": "forecast-status",
    "fields": {
        "approved": {
            "label": "Approved",
            "shortLabel": "App",
            "color": "primary"
        },
        "in_progress": {
            "label": "In Progress",
            "shortLabel": "IP",
            "color": "secondary"
        },
        "rejected": {
            "label": "Rejected",
            "shortLabel": "Rej",
            "color": "warning"
        },
        "submitted": {
            "label": "Submitted",
            "shortLabel": "Sub",
            "color": "primary"
        }
    }
}

prob_type_dt = {
    "component": "forecast-data",
    "title": "Forecast Types",
    "key": "forecast-types",
    "fields": {
        "flat/zero": {
            "label": "Flat/Zero",
            "shortLabel": "F/Z",
            "showMsg": False
        },
        "manual": {
            "label": "Manual",
            "shortLabel": "Man",
            "showMsg": False
        },
        "ml": {
            "label": "Machine Learning",
            "shortLabel": "ML",
            "showMsg": False
        },
        "not_forecasted": {
            "label": "No Forecast",
            "shortLabel": "None",
            "showMsg": False
        },
        "prob": {
            "label": "Auto Fit",
            "shortLabel": "Fit",
            "showMsg": False
        },
        "typecurve": {
            "label": "Type Curve",
            "shortLabel": "TC",
            "showMsg": False
        },
        "library": {
            "label": "Library Based Forecast",
            "shortLabel": "Lib",
            "showMsg": False
        },
        "add_segment": {
            "label": "Mass Add Segment",
            "shortLabel": "Added",
            "showMsg": False
        },
        "imported": {
            "label": "Imported",
            "shortLabel": "Imp",
            "showMsg": False
        }
    }
}

det_type_dt = {
    "component": "forecast-data",
    "title": "Forecast Types",
    "key": "forecast-types",
    "fields": {
        "rate": {
            "label": "Rate",
            "shortLabel": "Rate",
            "showMsg": False
        },
        "ratio": {
            "label": "Ratio",
            "shortLabel": "Ratio",
            "showMsg": False
        },
        "not_forecasted": {
            "label": "No Forecast",
            "shortLabel": "None",
            "showMsg": False
        },
        "add_segment": {
            "label": "Mass Add Segment",
            "shortLabel": "Added",
            "showMsg": False
        },
        "automatic": {
            "label": "Auto Fit",
            "shortLabel": "Fit",
            "showMsg": False
        },
        "flat/zero": {
            "label": "Flat/Zero",
            "shortLabel": "F/Z",
            "showMsg": False
        },
        "manual": {
            "label": "Manual",
            "shortLabel": "Man",
            "showMsg": False
        },
        "ml": {
            "label": "Machine Learning",
            "shortLabel": "ML",
            "showMsg": False
        },
        "typecurve": {
            "label": "Type Curve",
            "shortLabel": "TC",
            "showMsg": False
        },
        "imported": {
            "label": "Imported",
            "shortLabel": "Imp",
            "showMsg": False
        },
        "proximity": {
            "label": "Proximity",
            "shortLabel": "None",
            "showMsg": False
        }
    }
}

well_headers_json = {
    "title": "Well Headers",
    "key": "well_headers",
    "component": "wells",
    "fields": {
        "abstract": "Abstract",
        "acre_spacing": "Acre Same Zone Spacing",
        "allocation_type": "Allocation Type",
        "api10": "API 10",
        "api12": "API 12",
        "api14": "API 14",
        "aries_id": "Aries ID",
        "azimuth": "Azimuth",
        "basin": "Basin",
        "block": "Block",
        "casing_id": "Casing ID",
        "choke_size": "Choke Size",
        "chosenID": "Chosen ID",
        "chosenKeyID": "Chosen ID Key",
        "cluster_count": "Cluster Count",
        "completion_design": "Completion Design",
        "completion_end_date": "Completion End Date",
        "completion_start_date": "Completion Start Date",
        "copied": "Copied Well",
        "country": "Country",
        "county": "County/Parish",
        "current_operator": "Current Operator",
        "current_operator_alias": "Current Operator Alias",
        "current_operator_code": "Current Operator Code",
        "current_operator_ticker": "Current Operator Ticker",
        "dataSource": "Data Source",
        "dataPool": "Data Pool",
        "date_rig_release": "Date Rig Release",
        "distance_from_base_of_zone": "Distance From Base Of Zone",
        "distance_from_top_of_zone": "Distance From Top Of Zone",
        "district": "District",
        "drill_end_date": "Drill End Date",
        "drill_start_date": "Drill Start Date",
        "elevation": "Elevation",
        "elevation_type": "Elevation Type",
        "field": "Field",
        "first_additive_volume": "Additive Vol (1st Job)",
        "first_cluster_count": "Cluster Count  (1st Job)",
        "first_fluid_per_perforated_interval": "Total Fluid/Perf LL (1st Job)",
        "first_fluid_volume": "Total Fluid (1st Job)",
        "first_frac_vendor": "Frac Vendor (1st Job)",
        "first_max_injection_pressure": "Max Injection Pressure  (1st Job)",
        "first_max_injection_rate": "Max Injection Rate  (1st Job)",
        "first_prod_date": "First Prod Date",
        "first_prod_date_daily_calc": "First Prod Date Daily",
        "first_prod_date_monthly_calc": "First Prod Date Monthly",
        "first_prop_weight": "Total Prop (1st Job)",
        "first_proppant_per_fluid": "Total Prop/Fluid (1st Job)",
        "first_proppant_per_perforated_interval": "Total Prop/Perf LL (1st Job)",
        "first_stage_count": "Stage Count  (1st Job)",
        "first_test_flow_tbg_press": "First Test Flow TBG Press",
        "first_test_gas_vol": "First Test Gas Vol",
        "first_test_gor": "First Test Gor",
        "first_test_oil_vol": "First Test Oil Vol",
        "first_test_water_vol": "First Test Water Vol",
        "first_treatment_type": "Treatment Type (1st Job)",
        "flow_path": "Flow Path",
        "fluid_type": "Fluid Type",
        "footage_in_landing_zone": "Footage In Landing Zone",
        "formation_thickness_mean": "Formation Thickness Mean",
        "gas_gatherer": "Gas Gatherer",
        "gas_specific_gravity": "Gas Specific Gravity",
        "generic": "Created Well",
        "ground_elevation": "Ground Elevation",
        "has_daily": "Has Daily Data",
        "has_monthly": "Has Monthly Data",
        "hole_direction": "Hole Direction",
        "hz_well_spacing_any_zone": "Hz Well Spacing Any Zone",
        "hz_well_spacing_same_zone": "Hz Well Spacing Same Zone",
        "mostRecentImportType": "Import Type",
        "mostRecentImportDate": "Import Date",
        "initial_respress": "Initial Respress",
        "initial_restemp": "Initial Restemp",
        "inptID": "INPT ID",
        "landing_zone": "Landing Zone",
        "landing_zone_base": "Landing Zone Base",
        "landing_zone_top": "Landing Zone Top",
        "last_prod_date_monthly": "Last Prod Date Monthly",
        "last_prod_date_daily": "Last Prod Date Daily",
        "lateral_length": "Lateral Length",
        "lease_expiration": "Lease Expiration",
        "lease_name": "Lease Name",
        "lease_number": "Lease Number",
        "lower_perforation": "Lower Perforation",
        "matrix_permeability": "Matrix Permeability",
        "measured_depth": "Measured Depth",
        "num_treatment_records": "Num Treatment Records",
        "oil_api_gravity": "Oil API Gravity",
        "oil_gatherer": "Oil Gatherer",
        "oil_specific_gravity": "Oil Specific Gravity",
        "pad_name": "Pad Name",
        "parent_child_any_zone": "Parent Child Any Zone",
        "parent_child_same_zone": "Parent Child Same Zone",
        "percent_in_zone": "Percent In Zone",
        "perf_lateral_length": "Perf Lateral Length",
        "permit_date": "Permit Date",
        "phdwin_id": "PhdWin ID",
        "play": "Play",
        "porosity": "Porosity",
        "previous_operator": "Previous Operator",
        "previous_operator_alias": "Previous Operator Alias",
        "previous_operator_code": "Previous Operator Code",
        "previous_operator_ticker": "Previous Operator Ticker",
        "primary_product": "Primary Product",
        "production_method": "Production Method",
        "proppant_mesh_size": "Prop Mesh Size",
        "proppant_type": "Prop Type",
        "range": "Range",
        "recovery_method": "Recovery Method",
        "refrac_additive_volume": "Additive Vol (Refrac)",
        "refrac_cluster_count": "Cluster Count (Refrac)",
        "refrac_date": "Refrac Date",
        "refrac_fluid_per_perforated_interval": "Total Fluid/Perf LL (Refrac)",
        "refrac_fluid_volume": "Total Fluid (Refrac)",
        "refrac_frac_vendor": "Frac Vendor (Refrac)",
        "refrac_max_injection_pressure": "Max Injection Pressure (Refrac)",
        "refrac_max_injection_rate": "Max Injection Rate (Refrac)",
        "refrac_prop_weight": "Total Prop (Refrac)",
        "refrac_proppant_per_fluid": "Total Prop/Fluid (Refrac)",
        "refrac_proppant_per_perforated_interval": "Total Prop/Perf LL (Refrac)",
        "refrac_stage_count": "Stage Count (Refrac)",
        "refrac_treatment_type": "Treatment Type (Refrac)",
        "rig": "Rig Name",
        "section": "Section",
        "sg": "Gas Saturation",
        "so": "Oil Saturation",
        "spud_date": "Spud Date",
        "stage_spacing": "Stage Spacing",
        "state": "State",
        "status": "Status",
        "subplay": "Subplay",
        "surfaceLatitude": "Surface Latitude",
        "surfaceLongitude": "Surface Longitude",
        "survey": "Survey",
        "sw": "Water Saturation",
        "target_formation": "Target Formation",
        "thickness": "Thickness",
        "til": "TIL",
        "toeLatitude": "Toe Latitude",
        "toeLongitude": "Toe Longitude",
        "toe_in_landing_zone": "Toe In Landing Zone",
        "toe_up": "Toe Up",
        "total_additive_volume": "Additive Vol (All Jobs)",
        "total_cluster_count": "Total Cluster (All Jobs)",
        "total_fluid_per_perforated_interval": "Total Fluid/Perf LL (All Jobs)",
        "total_fluid_volume": "Total Fluid (All Jobs)",
        "total_prop_weight": "Total Prop (All Jobs)",
        "total_proppant_per_fluid": "Total Prop/Fluid (All Jobs)",
        "total_proppant_per_perforated_interval": "Total Prop/Perf LL (All Jobs)",
        "total_stage_count": "Total Stages (All Jobs)",
        "township": "Township",
        "true_vertical_depth": "True Vertical Depth",
        "tubing_depth": "Tubing Depth",
        "tubing_id": "Tubing ID",
        "type_curve_area": "Type Curve Area",
        "upper_perforation": "Upper Perforation",
        "vt_well_spacing_any_zone": "Vt Well Spacing Any Zone",
        "vt_well_spacing_same_zone": "Vt Well Spacing Same Zone",
        "well_name": "Well Name",
        "well_number": "Well Number",
        "well_type": "Well Type",
        "mostRecentImportDesc": "Import Name",
        "custom_string_0": "Custom Text Header 1",
        "custom_string_1": "Custom Text Header 2",
        "custom_string_2": "Custom Text Header 3",
        "custom_string_3": "Custom Text Header 4",
        "custom_string_4": "Custom Text Header 5",
        "custom_string_5": "Custom Text Header 6",
        "custom_string_6": "Custom Text Header 7",
        "custom_string_7": "Custom Text Header 8",
        "custom_string_8": "Custom Text Header 9",
        "custom_string_9": "Custom Text Header 10",
        "custom_string_10": "Custom Text Header 11",
        "custom_string_11": "Custom Text Header 12",
        "custom_string_12": "Custom Text Header 13",
        "custom_string_13": "Custom Text Header 14",
        "custom_string_14": "Custom Text Header 15",
        "custom_string_15": "Custom Text Header 16",
        "custom_string_16": "Custom Text Header 17",
        "custom_string_17": "Custom Text Header 18",
        "custom_string_18": "Custom Text Header 19",
        "custom_string_19": "Custom Text Header 20",
        "custom_number_0": "Custom Number Header 1",
        "custom_number_1": "Custom Number Header 2",
        "custom_number_2": "Custom Number Header 3",
        "custom_number_3": "Custom Number Header 4",
        "custom_number_4": "Custom Number Header 5",
        "custom_number_5": "Custom Number Header 6",
        "custom_number_6": "Custom Number Header 7",
        "custom_number_7": "Custom Number Header 8",
        "custom_number_8": "Custom Number Header 9",
        "custom_number_9": "Custom Number Header 10",
        "custom_number_10": "Custom Number Header 11",
        "custom_number_11": "Custom Number Header 12",
        "custom_number_12": "Custom Number Header 13",
        "custom_number_13": "Custom Number Header 14",
        "custom_number_14": "Custom Number Header 15",
        "custom_number_15": "Custom Number Header 16",
        "custom_number_16": "Custom Number Header 17",
        "custom_number_17": "Custom Number Header 18",
        "custom_number_18": "Custom Number Header 19",
        "custom_number_19": "Custom Number Header 20",
        "custom_date_0": "Custom Date Header 1",
        "custom_date_1": "Custom Date Header 2",
        "custom_date_2": "Custom Date Header 3",
        "custom_date_3": "Custom Date Header 4",
        "custom_date_4": "Custom Date Header 5",
        "custom_date_5": "Custom Date Header 6",
        "custom_date_6": "Custom Date Header 7",
        "custom_date_7": "Custom Date Header 8",
        "custom_date_8": "Custom Date Header 9",
        "custom_date_9": "Custom Date Header 10",
        "custom_bool_0": "Custom Boolean Header 1",
        "custom_bool_1": "Custom Boolean Header 2",
        "custom_bool_2": "Custom Boolean Header 3",
        "custom_bool_3": "Custom Boolean Header 4",
        "custom_bool_4": "Custom Boolean Header 5",
        "cum_boe": "Cum BOE",
        "cum_oil": "Cum Oil",
        "cum_gas": "Cum Gas",
        "cum_gor": "Cum GOR",
        "cum_water": "Cum Water",
        "cum_mmcfge": "Cum MMCFGE",
        "cum_boe_per_perforated_interval": "Cum BOE/Perf LL",
        "cum_gas_per_perforated_interval": "Cum Gas/Perf LL",
        "cum_oil_per_perforated_interval": "Cum Oil/Perf LL",
        "cum_water_per_perforated_interval": "Cum Water/Perf LL",
        "cum_mmcfge_per_perforated_interval": "Cum MMCFGE/Perf LL",
        "first_12_boe": "First 12 BOE",
        "first_12_boe_per_perforated_interval": "First 12 BOE/Perf LL",
        "first_12_gas": "First 12 Gas",
        "first_12_gas_per_perforated_interval": "First 12 Gas/Perf LL",
        "first_12_gor": "First 12 GOR",
        "first_12_oil": "First 12 Oil",
        "first_12_oil_per_perforated_interval": "First 12 Oil/Perf LL",
        "first_12_water": "First 12 Water",
        "first_12_water_per_perforated_interval": "First 12 Water/Perf LL",
        "first_12_mmcfge": "First 12 MMCFGE",
        "first_12_mmcfge_per_perforated_interval": "First 12 MMCFGE/Perf LL",
        "first_6_boe": "First 6 BOE",
        "first_6_boe_per_perforated_interval": "First 6 BOE/Perf LL",
        "first_6_gas": "First 6 Gas",
        "first_6_gas_per_perforated_interval": "First 6 Gas/Perf LL",
        "first_6_gor": "First 6 GOR",
        "first_6_mmcfge": "First 6 MMCFGE",
        "first_6_mmcfge_per_perforated_interval": "First 6 MMCFGE/Perf LL",
        "first_6_oil": "First 6 Oil",
        "first_6_oil_per_perforated_interval": "First 6 Oil/Perf LL",
        "first_6_water": "First 6 Water",
        "first_6_water_per_perforated_interval": "First 6 Water/Perf LL",
        "last_12_boe": "Last 12 BOE",
        "last_12_boe_per_perforated_interval": "Last 12 BOE/Perf LL",
        "last_12_gas": "Last 12 Gas",
        "last_12_gas_per_perforated_interval": "Last 12 Gas/Perf LL",
        "last_12_gor": "Last 12 GOR",
        "last_12_mmcfge": "Last 12 MMCFGE",
        "last_12_mmcfge_per_perforated_interval": "Last 12 MMCFGE/Perf LL",
        "last_12_oil": "Last 12 Oil",
        "last_12_oil_per_perforated_interval": "Last 12 Oil/Perf LL",
        "last_12_water": "Last 12 Water",
        "last_12_water_per_perforated_interval": "Last 12 Water/Perf LL",
        "last_month_boe": "Last Month BOE",
        "last_month_boe_per_perforated_interval": "Last Month BOE/Perf LL",
        "last_month_gas": "Last Month Gas",
        "last_month_gas_per_perforated_interval": "Last Month Gas/Perf LL",
        "last_month_gor": "Last Month GOR",
        "last_month_mmcfge": "Last Month MMCFGE",
        "last_month_mmcfge_per_perforated_interval": "Last Month MMCFGE/Perf LL",
        "last_month_oil": "Last Month Oil",
        "last_month_oil_per_perforated_interval": "Last Month Oil/Perf LL",
        "last_month_water": "Last Month Water",
        "last_month_water_per_perforated_interval": "Last Month Water/Perf LL",
        "month_produced": "Months Produced",
        "combo_name": "Econ Scenario & Combo",
        "econ_run_date": "Econ Run Date",
        "wi_oil": "WI Oil",
        "nri_oil": "NRI Oil",
        "before_income_tax_cash_flow": "Before Income Tax Cash Flow",
        "first_discount_cash_flow": "10% Discount Cash Flow",
        "econ_first_production_date": "Econ First Prod Date",
        "undiscounted_roi": "Undisc ROI",
        "irr": "IRR",
        "payout_duration": "Payout Duration",
        "oil_breakeven": "Oil Break Even",
        "gas_breakeven": "Gas Break Even",
        "oil_shrunk_eur": "Oil Shrunk EUR",
        "gas_shrunk_eur": "Gas Shrunk EUR",
        "ngl_shrunk_eur": "NGL EUR",
        "oil_shrunk_eur_over_pll": "Oil Shrunk EUR/PLL",
        "gas_shrunk_eur_over_pll": "Gas Shrunk EUR/PLL",
        "ngl_shrunk_eur_over_pll": "NGL EUR/PLL",
        "prms_reserves_category": "PRMS Reserves Category",
        "prms_reserves_sub_category": "PRMS Reserves Sub Category",
        "createdAt": "Created At",
        "updatedAt": "Updated At"
    }
}

well_header_units_json = {
    "title": "Well Months Units",
    "key": "well_months_units",
    "component": "wells",
    "fields": {
        "choke": "in",
        "oil": "BBL/MO",
        "gas": "MCF/MO",
        "water": "BBL/MO"
    }
}

daily_units_dt = {
    "title": "Internal Daily Units",
    "key": "daily-units",
    "component": "units",
    "fields": {
        "gas/oil": "MCF/BBL",
        "gas/water": "MCF/BBL",
        "oil/gas": "BBL/MCF",
        "oil/water": "BBL/BBL",
        "water/gas": "BBL/MCF",
        "water/oil": "BBL/BBL",
        "gas/oil/pll": "MCF/BBL/FT",
        "gas/water/pll": "MCF/BBL/FT",
        "oil/gas/pll": "BBL/MCF/FT",
        "oil/water/pll": "BBL/BBL/FT",
        "water/gas/pll": "BBL/MCF/FT",
        "water/oil/pll": "BBL/BBL/FT",
        "cumsum_gas": "MCF",
        "cumsum_oil": "BBL",
        "cumsum_water": "BBL",
        "cumsum_gas/pll": "MCF/FT",
        "cumsum_oil/pll": "BBL/FT",
        "cumsum_water/pll": "BBL/FT",
        "gas": "MCF/D",
        "oil": "BBL/D",
        "water": "BBL/D",
        "gas/pll": "MCF/D/FT",
        "oil/pll": "BBL/D/FT",
        "water/pll": "BBL/D/FT",
        "bottom_hole_pressure": "PSI",
        "casing_head_pressure": "PSI",
        "flowline_pressure": "PSI",
        "gas_lift_injection_pressure": "PSI",
        "tubing_head_pressure": "PSI",
        "vessel_separator_pressure": "PSI",
        "pll": "FT",
        "gas_eur": "MCF",
        "gas_eur/pll": "MCF/FT",
        "oil_eur": "BBL",
        "oil_eur/pll": "BBL/FT",
        "water_eur": "BBL",
        "water_eur/pll": "BBL/FT",
        "oil_k": "BBL/D/D",
        "gas_k": "MCF/D/D",
        "water_k": "BBL/D/D",
        "gas/oil_k": "MCF/BBL/D",
        "gas/water_k": "MCF/BBL/D",
        "oil/gas_k": "BBL/MCF/D",
        "oil/water_k": "BBL/BBL/D",
        "water/gas_k": "BBL/MCF/D",
        "water/oil_k": "BBL/BBL/D"
    }
}
monthly_units_dt = {
    "title": "Internal Monthly Units",
    "key": "monthly-units",
    "component": "units",
    "fields": {
        "gas/oil": "MCF/BBL",
        "gas/water": "MCF/BBL",
        "oil/gas": "BBL/MCF",
        "oil/water": "BBL/BBL",
        "water/gas": "BBL/MCF",
        "water/oil": "BBL/BBL",
        "gas/oil/pll": "MCF/BBL/FT",
        "gas/water/pll": "MCF/BBL/FT",
        "oil/gas/pll": "BBL/MCF/FT",
        "oil/water/pll": "BBL/BBL/FT",
        "water/gas/pll": "BBL/MCF/FT",
        "water/oil/pll": "BBL/BBL/FT",
        "cumsum_gas": "MCF",
        "cumsum_oil": "BBL",
        "cumsum_water": "BBL",
        "cumsum_gas/pll": "MCF/FT",
        "cumsum_oil/pll": "BBL/FT",
        "cumsum_water/pll": "BBL/FT",
        "gas": "MCF/M",
        "oil": "BBL/M",
        "water": "BBL/M",
        "gas/pll": "MCF/M/FT",
        "oil/pll": "BBL/M/FT",
        "water/pll": "BBL/M/FT",
        "bottom_hole_pressure": "PSI",
        "casing_head_pressure": "PSI",
        "flowline_pressure": "PSI",
        "gas_lift_injection_pressure": "PSI",
        "tubing_head_pressure": "PSI",
        "vessel_separator_pressure": "PSI",
        "pll": "FT",
        "gas_eur": "MCF",
        "gas_eur/pll": "MCF/FT",
        "oil_eur": "BBL",
        "oil_eur/pll": "BBL/FT",
        "water_eur": "BBL",
        "water_eur/pll": "BBL/FT",
        "oil_k": "BBL/D/D",
        "gas_k": "MCF/D/D",
        "water_k": "BBL/D/D",
        "gas/oil_k": "MCF/BBL/D",
        "gas/water_k": "MCF/BBL/D",
        "oil/gas_k": "BBL/MCF/D",
        "oil/water_k": "BBL/BBL/D",
        "water/gas_k": "BBL/MCF/D",
        "water/oil_k": "BBL/BBL/D"
    }
}

display_units_dt = {
    "title": "Default Units Display Preference",
    "key": "default-units",
    "component": "units",
    "fields": {
        "gas/oil": "CF/BBL",
        "gas/water": "MCF/BBL",
        "oil/gas": "BBL/MMCF",
        "oil/water": "BBL/BBL",
        "water/gas": "BBL/MMCF",
        "water/oil": "BBL/BBL",
        "gas/oil/pll": "MCF/BBL/FT",
        "gas/water/pll": "MCF/BBL/FT",
        "oil/gas/pll": "BBL/MCF/FT",
        "oil/water/pll": "BBL/BBL/FT",
        "water/gas/pll": "BBL/MCF/FT",
        "water/oil/pll": "BBL/BBL/FT",
        "cumsum_gas": "MMCF",
        "cumsum_oil": "MBBL",
        "cumsum_water": "MBBL",
        "cumsum_gas/pll": "MCF/FT",
        "cumsum_oil/pll": "BBL/FT",
        "cumsum_water/pll": "BBL/FT",
        "gas": "MCF/D",
        "oil": "BBL/D",
        "water": "BBL/D",
        "gas/pll": "MCF/D/1000FT",
        "oil/pll": "BBL/D/1000FT",
        "water/pll": "BBL/D/1000FT",
        "bottom_hole_pressure": "PSI",
        "casing_head_pressure": "PSI",
        "flowline_pressure": "PSI",
        "gas_lift_injection_pressure": "PSI",
        "tubing_head_pressure": "PSI",
        "vessel_separator_pressure": "PSI",
        "pll": "FT",
        "gas_eur": "MMCF",
        "gas_eur/pll": "MCF/FT",
        "oil_eur": "MBBL",
        "oil_eur/pll": "BBL/FT",
        "water_eur": "MBBL",
        "water_eur/pll": "BBL/FT",
        "oil_k": "BBL/D/D",
        "gas_k": "MCF/D/D",
        "water_k": "BBL/D/D",
        "gas/oil_k": "CF/BBL/D",
        "gas/water_k": "MCF/BBL/D",
        "oil/gas_k": "BBL/MMCF/D",
        "oil/water_k": "BBL/BBL/D",
        "water/gas_k": "BBL/MMCF/D",
        "water/oil_k": "BBL/BBL/D"
    },
    "normalization": {
        "oil_eur": "BBL",
        "gas_eur": "MCF",
        "water_eur": "BBL"
    }
}

segment_models = {
    'flat': 'Flat',
    'linear': 'Linear',
    'arps': 'Arps',
    'arps_inc': 'Arps Incline',
    'empty': 'Shut-in Period',
    'exp_inc': 'Exp Incline',
    'exp_dec': 'Exp Decline',
    'arps_modified': 'Modified Arps'
}
