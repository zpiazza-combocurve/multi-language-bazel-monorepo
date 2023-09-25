BASIC_HEADER = {
    'well_index': 'Index',
    'api14': 'API 14',
    'inptID': 'INPT ID',
    'chosenID': 'Chosen ID',
    'well_name': 'Well Name',
    'incremental_index': 'Incremental Index',
    'well_number': 'Well Number',
    'econ_prms_resources_class': 'Econ PRMS Resources Class',
    'econ_prms_reserves_category': 'Econ PRMS Reserves Category',
    'econ_prms_reserves_sub_category': 'Econ PRMS Reserves Sub Category',
    'state': 'State',
    'county': 'County/Parish',
    'current_operator': 'Current Operator',
    'current_operator_alias': 'Current Operator Alias',
    'type_curve_area': 'Type Curve Area',
}

SUGGESTED_HEADER = {
    'basin': 'Basin',
    'pad_name': 'Pad Name',
    'hole_direction': 'Hole Direction',
    'landing_zone': 'Landing Zone',
    'target_formation': 'Target Formation',
    'surfaceLatitude': 'Surface Latitude',
    'surfaceLongitude': 'Surface Longitude',
    'toeLatitude': 'Toe Latitude',
    'toeLongitude': 'Toe Longitude',
    'first_prod_date_monthly_calc': 'First Monthly Prod Date Calc',
    'perf_lateral_length': 'Perf Lateral Length',
    'total_proppant_per_perforated_interval': 'Total Prop/Perf LL (All Jobs)',
    'total_fluid_per_perforated_interval': 'Total Fluid/Perf LL (All Jobs)',
    'true_vertical_depth': 'True Vertical Depth',
    'hz_well_spacing_same_zone': 'Hz Well Spacing Same Zone',
    'vt_well_spacing_same_zone': 'Vt Well Spacing Same Zone',
    'stage_spacing': 'Stage Spacing',
    'total_stage_count': 'Total Stages (All Jobs)',
    'well_type': 'Well Type',
    'status': 'Status',
    'oil_gatherer': 'Oil Gatherer',
    'gas_gatherer': 'Gas Gatherer',
    'ngl_gatherer': 'NGL Gatherer',
}

QUALIFIER_NAME_HEADER = {
    'reserves_category_qualifier': 'Reserves Category Qualifier',
    'ownership_reversion_qualifier': 'Ownership and Reversion Qualifier',
    'dates_qualifier': 'Dates Qualifier',
    'forecast_qualifier': 'Forecast Qualifier',
    'forecast_p_series_qualifier': 'Forecast P Series Qualifier',
    'schedule_qualifier': 'Schedule Qualifier',
    'capex_qualifier': 'CAPEX Qualifier',
    'pricing_qualifier': 'Pricing Qualifier',
    'differentials_qualifier': 'Differentials Qualifier',
    'stream_properties_qualifier': 'Stream Properties Qualifier',
    'expenses_qualifier': 'Expenses Qualifier',
    'production_taxes_qualifier': 'Production Taxes Qualifier',
    'production_vs_fit_qualifier': 'Actual or Forecast Qualifier',
    'risking_qualifier': 'Risking Qualifier',
}

# ONE LINER CSV EXPORT DOES NOT HAVE WARNING
OTHER_HEADER_WO_DATE_WO_WARNING = {
    'project_name': 'Project Name',
    'scenario_name': 'Scenario Name',
    'user_name': 'User Name',
    'combo_name': 'Combo Name',
    'econ_group': 'Econ Group',
    **QUALIFIER_NAME_HEADER,
    'created_at': 'Created At',
    'error': 'Error',
}

# CASHFLOW EXPORT HAS WARNING
OTHER_HEADER_WO_DATE = {**OTHER_HEADER_WO_DATE_WO_WARNING, 'warning': 'Warning'}

OTHER_HEADER = {**OTHER_HEADER_WO_DATE, 'date': 'Date'}

# always include both first_aggregation_header and second_aggregation_header
# second_aggregation_header will be discard when generating file if not used
OTHER_HEADER_AGG = {
    **{key: label
       for key, label in OTHER_HEADER_WO_DATE.items() if key != 'econ_group'},
    'first_aggregation_header': 'First Aggregation Header',
    'second_aggregation_header': 'Second Aggregation Header',
    'aggregation_group': 'Group',
    'date': 'Date',
}

SPECIAL_COL_DICT = {
    'wi_oil': {
        'numerator': 'wi_oil_sales_volume',
        'denominator': 'gross_oil_sales_volume'
    },
    'wi_gas': {
        'numerator': 'wi_gas_sales_volume',
        'denominator': 'gross_gas_sales_volume'
    },
    'wi_ngl': {
        'numerator': 'wi_ngl_sales_volume',
        'denominator': 'gross_ngl_sales_volume'
    },
    'wi_drip_condensate': {
        'numerator': 'wi_drip_condensate_sales_volume',
        'denominator': 'gross_drip_condensate_sales_volume'
    },
    'nri_oil': {
        'numerator': 'net_oil_sales_volume',
        'denominator': 'gross_oil_sales_volume'
    },
    'nri_gas': {
        'numerator': 'net_gas_sales_volume',
        'denominator': 'gross_gas_sales_volume'
    },
    'nri_ngl': {
        'numerator': 'net_ngl_sales_volume',
        'denominator': 'gross_ngl_sales_volume'
    },
    'nri_drip_condensate': {
        'numerator': 'net_drip_condensate_sales_volume',
        'denominator': 'gross_drip_condensate_sales_volume'
    },
    'oil_price': {
        'method': 'average',
        'weight': 'net_oil_sales_volume'
    },
    'gas_price': {
        'method': 'average',
        'weight': 'net_gas_sales_volume'
    },
    'ngl_price': {
        'method': 'average',
        'weight': 'net_ngl_sales_volume'
    },
    'drip_condensate_price': {
        'method': 'average',
        'weight': 'net_drip_condensate_sales_volume'
    },
    'input_oil_price': {
        'method': 'average',
        'weight': 'net_oil_sales_volume'
    },
    'input_gas_price': {
        'method': 'average',
        'weight': 'net_gas_sales_volume'
    },
    'input_ngl_price': {
        'method': 'average',
        'weight': 'net_ngl_sales_volume'
    },
    'input_drip_condensate_price': {
        'method': 'average',
        'weight': 'net_drip_condensate_sales_volume'
    },
    'oil_differentials_1': {
        'method': 'average',
        'weight': 'net_oil_sales_volume'
    },
    'gas_differentials_1': {
        'method': 'average',
        'weight': 'net_gas_sales_volume'
    },
    'ngl_differentials_1': {
        'method': 'average',
        'weight': 'net_ngl_sales_volume'
    },
    'drip_condensate_differentials_1': {
        'method': 'average',
        'weight': 'net_drip_condensate_sales_volume'
    },
    'oil_differentials_2': {
        'method': 'average',
        'weight': 'net_oil_sales_volume'
    },
    'gas_differentials_2': {
        'method': 'average',
        'weight': 'net_gas_sales_volume'
    },
    'ngl_differentials_2': {
        'method': 'average',
        'weight': 'net_ngl_sales_volume'
    },
    'drip_condensate_differentials_2': {
        'method': 'average',
        'weight': 'net_drip_condensate_sales_volume'
    },
    'oil_differentials_3': {
        'method': 'average',
        'weight': 'net_oil_sales_volume'
    },
    'gas_differentials_3': {
        'method': 'average',
        'weight': 'net_gas_sales_volume'
    },
    'ngl_differentials_3': {
        'method': 'average',
        'weight': 'net_ngl_sales_volume'
    },
    'drip_condensate_differentials_3': {
        'method': 'average',
        'weight': 'net_drip_condensate_sales_volume'
    },
    'ngl_yield': {
        'method': 'average',
        'weight': 'pre_yield_gas_volume_ngl'
    },
    'drip_condensate_yield': {
        'method': 'average',
        'weight': 'pre_yield_gas_volume_drip_condensate'
    },
    'oil_shrinkage': {
        'numerator': 'gross_oil_sales_volume',
        'denominator': 'unshrunk_oil_volume'
    },
    'gas_shrinkage': {
        'numerator': 'gross_gas_sales_volume',
        'denominator': 'unshrunk_gas_volume'
    },
    'oil_loss': {
        'numerator': 'unshrunk_oil_volume',
        'denominator': 'gross_oil_well_head_volume'
    },
    'gas_loss': {
        'numerator': 'pre_flare_gas_volume',
        'denominator': 'gross_gas_well_head_volume'
    },
    'gas_flare': {
        'numerator': 'unshrunk_gas_volume',
        'denominator': 'pre_flare_gas_volume'
    },
    'lease_nri': {
        'numerator': 'net_oil_sales_volume',
        'denominator': 'wi_oil_sales_volume'
    },
    'oil_risk': {
        'numerator': 'gross_oil_well_head_volume',
        'denominator': 'pre_risk_oil_volume'
    },
    'gas_risk': {
        'numerator': 'gross_gas_well_head_volume',
        'denominator': 'pre_risk_gas_volume'
    },
    'water_risk': {
        'numerator': 'gross_water_well_head_volume',
        'denominator': 'pre_risk_water_volume'
    },
    'drip_condensate_risk': {
        'numerator': 'gross_drip_condensate_sales_volume',
        'denominator': 'pre_risk_drip_condensate_volume'
    },
    'ngl_risk': {
        'numerator': 'gross_ngl_sales_volume',
        'denominator': 'pre_risk_ngl_volume'
    },
    'state_tax_rate': {
        'method': 'average',
        'weight': 'taxable_income'
    },
    'federal_tax_rate': {
        'method': 'average',
        'weight': 'taxable_income'
    },
}

# list to check that these columns are in incremental flat output, elsewise skip
SPECIAL_INCREMENTAL_COLUMNS = ['state_tax_rate', 'federal_tax_rate']

# well count is not a user selected column, it will always generate in res cat table
WELL_COUNT_HEADER = {
    'gross_well_count': 'Gross Well Count',
    'wi_well_count': 'WI Well Count',
    'nri_well_count': 'NRI Well Count',
}

VOLUME_COLS = [
    'gross_oil_well_head_volume',
    'gross_gas_well_head_volume',
    'gross_boe_well_head_volume',
    'gross_water_well_head_volume',
    'gross_oil_sales_volume',
    'gross_gas_sales_volume',
    'gross_ngl_sales_volume',
    'gross_drip_condensate_sales_volume',
    'gross_boe_sales_volume',
    'wi_oil_sales_volume',
    'wi_gas_sales_volume',
    'wi_ngl_sales_volume',
    'wi_drip_condensate_sales_volume',
    'wi_boe_sales_volume',
    'net_oil_sales_volume',
    'net_gas_sales_volume',
    'net_ngl_sales_volume',
    'net_drip_condensate_sales_volume',
    'net_boe_sales_volume',
]

OWNERSHIP_COLS = [
    'wi_oil',
    'wi_gas',
    'wi_ngl',
    'wi_drip_condensate',
    'nri_oil',
    'nri_gas',
    'nri_ngl',
    'nri_drip_condensate',
    'original_wi_oil',
    'original_wi_gas',
    'original_wi_ngl',
    'original_wi_drip_condensate',
    'original_nri_oil',
    'original_nri_gas',
    'original_nri_ngl',
    'original_nri_drip_condensate',
]

RATIO_COLS = OWNERSHIP_COLS + [
    'ngl_yield',
    'drip_condensate_yield',
    'oil_shrinkage',
    'gas_shrinkage',
    'oil_loss',
    'gas_loss',
    'gas_flare',
    'lease_nri',
    'oil_risk',
    'gas_risk',
    'water_risk',
    'drip_condensate_risk',
    'ngl_risk',
]

# these headers are econ columns on FE but need to be treated as headers on python BE
CSV_FAKE_ECON_COLUMNS = set([
    'well_index',
    'incremental_index',
    'econ_prms_resources_class',
    'econ_prms_reserves_category',
    'econ_prms_reserves_sub_category',
    *OTHER_HEADER.keys(),
    *WELL_COUNT_HEADER.keys(),
])

CUMULATIVE_ECON_COLUMNS = {
    'cum_gross_oil_well_head_volume': 'Cum Gross Oil Well Head Volume',
    'cum_gross_gas_well_head_volume': 'Cum Gross Gas Well Head Volume',
    'cum_gross_boe_well_head_volume': 'Cum Gross BOE Well Head Volume',
    'cum_gross_mcfe_well_head_volume': 'Cum Gross MCFE Well Head Volume',
    'cum_gross_water_well_head_volume': 'Cum Gross Water Well Head Volume',
    'cum_gross_oil_sales_volume': 'Cum Gross Oil Sales Volume',
    'cum_gross_gas_sales_volume': 'Cum Gross Gas Sales Volume',
    'cum_gross_ngl_sales_volume': 'Cum Gross NGL Sales Volume',
    'cum_gross_drip_condensate_sales_volume': 'Cum Gross Drip Condensate Sales Volume',
    'cum_gross_boe_sales_volume': 'Cum Gross BOE Sales Volume',
    'cum_gross_mcfe_sales_volume': 'Cum Gross MCFE Sales Volume',
    'cum_wi_oil_sales_volume': 'Cum WI Oil Sales Volume',
    'cum_wi_gas_sales_volume': 'Cum WI Gas Sales Volume',
    'cum_wi_ngl_sales_volume': 'Cum WI NGL Sales Volume',
    'cum_wi_drip_condensate_sales_volume': 'Cum WI Drip Condensate Sales Volume',
    'cum_wi_boe_sales_volume': 'Cum WI BOE Sales Volume',
    'cum_wi_mcfe_sales_volume': 'Cum WI MCFE Sales Volume',
    'cum_wi_water_sales_volume': 'Cum WI Water Sales Volume',
    'cum_net_oil_sales_volume': 'Cum Net Oil Sales Volume',
    'cum_net_gas_sales_volume': 'Cum Net Gas Sales Volume',
    'cum_net_ngl_sales_volume': 'Cum Net NGL Sales Volume',
    'cum_net_drip_condensate_sales_volume': 'Cum Net Drip Condensate Sales Volume',
    'cum_net_boe_sales_volume': 'Cum Net BOE Sales Volume',
    'cum_net_mcfe_sales_volume': 'Cum Net MCFE Sales Volume',
    'cum_net_water_sales_volume': 'Cum Net Water Sales Volume',
    'cum_net_oil_well_head_volume': 'Cum Net Oil Well Head Volume',
    'cum_net_gas_well_head_volume': 'Cum Net Gas Well Head Volume',
    'cum_net_water_well_head_volume': 'Cum Net Water Well Head Volume',
    'cum_oil_revenue': 'Cum Net Oil Revenue',
    'cum_gas_revenue': 'Cum Net Gas Revenue',
    'cum_ngl_revenue': 'Cum Net NGL Revenue',
    'cum_drip_condensate_revenue': 'Cum Net Drip Condensate Revenue',
    'cum_total_revenue': 'Cum Total Net Revenue',
    'cum_oil_gathering_expense': 'Cum Oil G & P Expense',
    'cum_oil_processing_expense': 'Cum Oil OPC Expense',
    'cum_oil_transportation_expense': 'Cum Oil TRN Expense',
    'cum_oil_marketing_expense': 'Cum Oil MKT Expense',
    'cum_oil_other_expense': 'Cum Oil Other Expense',
    'cum_total_oil_variable_expense': 'Cum Total Oil Variable Expense',
    'cum_gas_gathering_expense': 'Cum Gas G & P Expense',
    'cum_gas_processing_expense': 'Cum Gas OPC Expense',
    'cum_gas_transportation_expense': 'Cum Gas TRN Expense',
    'cum_gas_marketing_expense': 'Cum Gas MKT Expense',
    'cum_gas_other_expense': 'Cum Gas Other Expense',
    'cum_total_gas_variable_expense': 'Cum Total Gas Variable Expense',
    'cum_ngl_gathering_expense': 'Cum NGL G & P Expense',
    'cum_ngl_processing_expense': 'Cum NGL OPC Expense',
    'cum_ngl_transportation_expense': 'Cum NGL TRN Expense',
    'cum_ngl_marketing_expense': 'Cum NGL MKT Expense',
    'cum_ngl_other_expense': 'Cum NGL Other Expense',
    'cum_total_ngl_variable_expense': 'Cum Total NGL Variable Expense',
    'cum_drip_condensate_gathering_expense': 'Cum Drip Condensate G & P Expense',
    'cum_drip_condensate_processing_expense': 'Cum Drip Condensate OPC Expense',
    'cum_drip_condensate_transportation_expense': 'Cum Drip Condensate TRN Expense',
    'cum_drip_condensate_marketing_expense': 'Cum Drip Condensate MKT Expense',
    'cum_drip_condensate_other_expense': 'Cum Drip Condensate Other Expense',
    'cum_total_drip_condensate_variable_expense': 'Cum Total Drip Condensate Variable Expense',
    'cum_water_disposal': 'Cum Water Disposal Expense',
    'cum_co2e_expense': 'Cum CO2e Expense',
    'cum_co2_expense': 'Cum CO2 Expense',
    'cum_ch4_expense': 'Cum CH4 Expense',
    'cum_n2o_expense': 'Cum N2O Expense',
    'cum_total_carbon_expense': 'Cum Total Carbon Expense',
    'cum_total_variable_expense': 'Cum Total Variable Expense',
    'cum_monthly_well_cost': 'Cum Fixed Expense 1',
    'cum_other_monthly_cost_1': 'Cum Fixed Expense 2',
    'cum_other_monthly_cost_2': 'Cum Fixed Expense 3',
    'cum_other_monthly_cost_3': 'Cum Fixed Expense 4',
    'cum_other_monthly_cost_4': 'Cum Fixed Expense 5',
    'cum_other_monthly_cost_5': 'Cum Fixed Expense 6',
    'cum_other_monthly_cost_6': 'Cum Fixed Expense 7',
    'cum_other_monthly_cost_7': 'Cum Fixed Expense 8',
    'cum_other_monthly_cost_8': 'Cum Fixed Expense 9',
    'cum_total_fixed_expense': 'Cum Total Fixed Expense',
    'cum_total_expense': 'Cum Total Expense',
    'cum_oil_severance_tax': 'Cum Oil Severance Tax',
    'cum_gas_severance_tax': 'Cum Gas Severance Tax',
    'cum_ngl_severance_tax': 'Cum NGL Severance Tax',
    'cum_drip_condensate_severance_tax': 'Cum Drip Condensate Severance Tax',
    'cum_total_severance_tax': 'Cum Total Severance Tax',
    'cum_ad_valorem_tax': 'Cum Ad Valorem Tax',
    'cum_total_production_tax': 'Cum Total Production Tax',
    'cum_tangible_drilling': 'Cum Net Tangible Drilling',
    'cum_intangible_drilling': 'Cum Net Intangible Drilling',
    'cum_total_drilling': 'Cum Total Net Drilling',
    'cum_tangible_completion': 'Cum Net Tangible Completion',
    'cum_intangible_completion': 'Cum Net Intangible Completion',
    'cum_total_completion': 'Cum Total Net Completion',
    'cum_tangible_legal': 'Cum Net Tangible Legal',
    'cum_intangible_legal': 'Cum Net Intangible Legal',
    'cum_total_legal': 'Cum Total Net Legal',
    'cum_tangible_pad': 'Cum Net Tangible Pad',
    'cum_intangible_pad': 'Cum Net Intangible Pad',
    'cum_total_pad': 'Cum Total Net Pad',
    'cum_tangible_facilities': 'Cum Net Tangible Facilities',
    'cum_intangible_facilities': 'Cum Net Intangible Facilities',
    'cum_total_facilities': 'Cum Total Net Facilities',
    'cum_tangible_artificial_lift': 'Cum Net Tangible Artificial Lift',
    'cum_intangible_artificial_lift': 'Cum Net Intangible Artificial Lift',
    'cum_total_artificial_lift': 'Cum Total Net Artificial Lift',
    'cum_tangible_workover': 'Cum Net Tangible Workover',
    'cum_intangible_workover': 'Cum Net Intangible Workover',
    'cum_total_workover': 'Cum Total Net Workover',
    'cum_tangible_leasehold': 'Cum Net Tangible Leasehold',
    'cum_intangible_leasehold': 'Cum Net Intangible Leasehold',
    'cum_total_leasehold': 'Cum Total Net Leasehold',
    'cum_tangible_development': 'Cum Net Tangible Development',
    'cum_intangible_development': 'Cum Net Intangible Development',
    'cum_total_development': 'Cum Total Net Development',
    'cum_tangible_pipelines': 'Cum Net Tangible Pipelines',
    'cum_intangible_pipelines': 'Cum Net Intangible Pipelines',
    'cum_total_pipelines': 'Cum Total Net Pipelines',
    'cum_tangible_exploration': 'Cum Net Tangible Exploration',
    'cum_intangible_exploration': 'Cum Net Intangible Exploration',
    'cum_total_exploration': 'Cum Total Net Exploration',
    'cum_tangible_waterline': 'Cum Net Tangible Waterline',
    'cum_intangible_waterline': 'Cum Net Intangible Waterline',
    'cum_total_waterline': 'Cum Total Net Waterline',
    'cum_tangible_appraisal': 'Cum Net Tangible Appraisal',
    'cum_intangible_appraisal': 'Cum Net Intangible Appraisal',
    'cum_total_appraisal': 'Cum Total Net Appraisal',
    'cum_tangible_other_investment': 'Cum Net Tangible Other Investment',
    'cum_intangible_other_investment': 'Cum Net Intangible Other Investment',
    'cum_total_other_investment': 'Cum Total Net Other Investment',
    'cum_tangible_abandonment': 'Cum Net Tangible Abandonment',
    'cum_intangible_abandonment': 'Cum Net Intangible Abandonment',
    'cum_total_abandonment': 'Cum Total Net Abandonment',
    'cum_tangible_salvage': 'Cum Net Tangible Salvage',
    'cum_intangible_salvage': 'Cum Net Intangible Salvage',
    'cum_total_salvage': 'Cum Total Net Salvage',
    'cum_total_tangible_capex': 'Cum Total Net Tangible Investment',
    'cum_total_intangible_capex': 'Cum Total Net Intangible Investment',
    'cum_total_capex': 'Cum Total Net Investment',
    'cum_first_discounted_capex': 'Cum First Discount Total Net Investment',
    'cum_second_discounted_capex': 'Cum Second Discount Total Net Investment',
    'cum_total_gross_capex': 'Cum Total Gross Investment',
    'cum_net_profit': 'Cum NPI Cash Flow',
    'cum_net_income': 'Cum Net Operating Income',
    'cum_first_discount_net_income': 'Cum First Discount Net Operating Income',
    'cum_second_discount_net_income': 'Cum Second Discount Net Operating Income',
    'cum_before_income_tax_cash_flow': 'Cum Before Income Tax Cash Flow',
    'cum_first_discount_cash_flow': 'Cum First Discount Cash Flow',
    'cum_second_discount_cash_flow': 'Cum Second Discount Cash Flow',
    'cum_tax_credit': 'Cum Tax Credit',
    'cum_tangible_depreciation': 'Cum Tangible Depreciation',
    'cum_intangible_depreciation': 'Cum Intangible Depreciation',
    'cum_depreciation': 'Cum Total Depreciation',
    'cum_depletion': 'Cum Total Depletion',
    'cum_tangible_depletion': 'Cum Tangible Cost Depletion',
    'cum_intangible_depletion': 'Cum Intangible Cost Depletion',
    'cum_percentage_depletion': 'Cum Percentage Depletion',
    'cum_total_deductions': 'Cum Total Deductions',
    'cum_taxable_income': 'Cum Taxable Income',
    'cum_state_income_tax': 'Cum State Income Tax',
    'cum_federal_income_tax': 'Cum Federal Income Tax',
    'cum_after_income_tax_cash_flow': 'Cum After Income Tax Cash Flow',
    'cum_afit_first_discount_cash_flow': 'Cum AFIT First Discount Cash Flow',
    'cum_afit_second_discount_cash_flow': 'Cum AFIT Second Discount Cash Flow',
    'cum_gross_co2e_mass_emission': 'Cum Gross CO2e Mass Emitted',
    'cum_gross_co2_mass_emission': 'Cum Gross CO2 Mass Emitted',
    'cum_gross_ch4_mass_emission': 'Cum Gross CH4 Mass Emitted',
    'cum_gross_n2o_mass_emission': 'Cum Gross N2O Mass Emitted',
    'cum_wi_co2e_mass_emission': 'Cum WI CO2e Mass Emitted',
    'cum_wi_co2_mass_emission': 'Cum WI CO2 Mass Emitted',
    'cum_wi_ch4_mass_emission': 'Cum WI CH4 Mass Emitted',
    'cum_wi_n2o_mass_emission': 'Cum WI N2O Mass Emitted',
    'cum_nri_co2e_mass_emission': 'Cum NRI CO2e Mass Emitted',
    'cum_nri_co2_mass_emission': 'Cum NRI CO2 Mass Emitted',
    'cum_nri_ch4_mass_emission': 'Cum NRI CH4 Mass Emitted',
    'cum_nri_n2o_mass_emission': 'Cum NRI N2O Mass Emitted',
}
