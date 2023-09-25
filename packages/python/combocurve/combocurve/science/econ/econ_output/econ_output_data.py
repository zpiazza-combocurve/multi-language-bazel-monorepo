import numpy as np


def econ_output_exp_insert(flat_econ, all_log):

    for var_exp in all_log['expense']['var_expense']:
        key = var_exp['key']
        category = var_exp['category']

        if f'{key}_{category}_expense' not in flat_econ:
            flat_econ[f'{key}_{category}_expense'] = np.copy(var_exp['values'])
        else:
            flat_econ[f'{key}_{category}_expense'] += var_exp['values']

        if f'total_{key}_variable_expense' not in flat_econ:
            flat_econ[f'total_{key}_variable_expense'] = np.copy(var_exp['values'])
        else:
            flat_econ[f'total_{key}_variable_expense'] += var_exp['values']

    for fixed_exp in all_log['expense']['fixed_expense']:
        category = fixed_exp['category']

        if category not in flat_econ:
            flat_econ[category] = np.copy(fixed_exp['values'])
        else:
            flat_econ[category] += fixed_exp['values']

    for ghg_exp in all_log['expense']['ghg_expense']:
        comp = ghg_exp['category']

        if f'{comp}_expense' not in flat_econ:
            flat_econ[f'{comp}_expense'] = np.copy(ghg_exp['values'])
        else:
            flat_econ[f'{comp}_expense'] += ghg_exp['values']

    flat_econ['water_disposal'] = all_log['expense']['total']['water_disp']
    flat_econ['total_carbon_expense'] = all_log['expense']['total']['ghg_expense']
    flat_econ['total_variable_expense'] = all_log['expense']['total']['water_disp'] + all_log['expense']['total'][
        'var_expense'] + all_log['expense']['total']['ghg_expense']
    flat_econ['total_fixed_expense'] = all_log['expense']['total']['fixed_expense']
    flat_econ['total_expense'] = all_log['expense']['total']['water_disp'] + all_log['expense']['total'][
        'var_expense'] + all_log['expense']['total']['fixed_expense'] + all_log['expense']['total']['ghg_expense']


def flatten_econ_log(all_log):
    flat_econ_log = {
        'date':
        all_log['date'],
        # well head volume
        'gross_oil_well_head_volume':
        all_log['volume']['oil']['well_head'],
        'gross_gas_well_head_volume':
        all_log['volume']['gas']['well_head'],
        'gross_boe_well_head_volume':
        all_log['volume']['boe']['well_head']['total'],
        'gross_mcfe_well_head_volume':
        all_log['volume']['mcfe']['well_head']['total'],
        'gross_water_well_head_volume':
        all_log['volume']['water']['well_head'],
        'net_oil_well_head_volume':
        all_log['volume']['oil']['ownership']['well_head']['nri'],
        'net_gas_well_head_volume':
        all_log['volume']['gas']['ownership']['well_head']['nri'],
        'net_water_well_head_volume':
        all_log['volume']['water']['ownership']['well_head']['nri'],
        'net_boe_well_head_volume':
        all_log['volume']['boe']['well_head']['nri'],
        'net_mcfe_well_head_volume':
        all_log['volume']['mcfe']['well_head']['nri'],
        # well head volume daily
        'gross_oil_well_head_volume_daily':
        all_log.get("volume_daily", {}).get("oil", {}).get("well_head", np.array([0])),
        'gross_gas_well_head_volume_daily':
        all_log.get("volume_daily", {}).get("gas", {}).get("well_head", np.array([0])),
        'gross_boe_well_head_volume_daily':
        all_log.get("volume_daily", {}).get("boe", {}).get("well_head", {}).get("total", np.array([0])),
        'gross_water_well_head_volume_daily':
        all_log.get("volume_daily", {}).get("water", {}).get("well_head", np.array([0])),
        'gross_mcfe_well_head_volume_daily':
        all_log.get("volume_daily", {}).get("mcfe", {}).get("well_head", {}).get("total", np.array([0])),
        # pre risk volume
        'pre_risk_oil_volume':
        all_log['volume']['oil']['pre_risk'],
        'pre_risk_gas_volume':
        all_log['volume']['gas']['pre_risk'],
        'pre_risk_water_volume':
        all_log['volume']['water']['pre_risk'],
        'pre_risk_drip_condensate_volume':
        all_log['volume']['drip_condensate']['pre_risk'],
        'pre_risk_ngl_volume':
        all_log['volume']['ngl']['pre_risk'],
        # gas pre flare volume
        'gas_pre_flare_volume':
        all_log['volume']['gas']['pre_flare'],
        # pre shrinkage volume (after loss, flare, risking)
        'oil_pre_shrunk_volume':
        all_log['volume']['oil']['unshrunk'],
        'gas_pre_shrunk_volume':
        all_log['volume']['gas']['unshrunk'],
        # sales volume
        'gross_oil_sales_volume':
        all_log['volume']['oil']['sales'],
        'gross_gas_sales_volume':
        all_log['volume']['gas']['sales'],
        'gross_ngl_sales_volume':
        all_log['volume']['ngl']['sales'],
        'gross_drip_condensate_sales_volume':
        all_log['volume']['drip_condensate']['sales'],
        'gross_boe_sales_volume':
        all_log['volume']['boe']['sales']['total'],
        'gross_mcfe_sales_volume':
        all_log['volume']['mcfe']['sales']['total'],
        'wi_oil':
        all_log['ownership']['oil']['wi'],
        'wi_gas':
        all_log['ownership']['gas']['wi'],
        'wi_ngl':
        all_log['ownership']['ngl']['wi'],
        'wi_drip_condensate':
        all_log['ownership']['drip_condensate']['wi'],
        'nri_oil':
        all_log['ownership']['oil']['nri'],
        'nri_gas':
        all_log['ownership']['gas']['nri'],
        'nri_ngl':
        all_log['ownership']['ngl']['nri'],
        'nri_drip_condensate':
        all_log['ownership']['drip_condensate']['nri'],
        'lease_nri':
        all_log['ownership']['original']['lease_nri'],
        'wi_oil_sales_volume':
        all_log['volume']['oil']['ownership']['sales']['wi'],
        'wi_gas_sales_volume':
        all_log['volume']['gas']['ownership']['sales']['wi'],
        'wi_ngl_sales_volume':
        all_log['volume']['ngl']['ownership']['sales']['wi'],
        'wi_drip_condensate_sales_volume':
        all_log['volume']['drip_condensate']['ownership']['sales']['wi'],
        'wi_boe_sales_volume':
        all_log['volume']['boe']['sales']['wi'],
        'wi_mcfe_sales_volume':
        all_log['volume']['mcfe']['sales']['wi'],
        'wi_water_sales_volume':
        all_log['volume']['water']['ownership']['sales']['wi'],
        'net_oil_sales_volume':
        all_log['volume']['oil']['ownership']['sales']['nri'],
        'net_gas_sales_volume':
        all_log['volume']['gas']['ownership']['sales']['nri'],
        'net_ngl_sales_volume':
        all_log['volume']['ngl']['ownership']['sales']['nri'],
        'net_drip_condensate_sales_volume':
        all_log['volume']['drip_condensate']['ownership']['sales']['nri'],
        'net_boe_sales_volume':
        all_log['volume']['boe']['sales']['nri'],
        'net_mcfe_sales_volume':
        all_log['volume']['mcfe']['sales']['nri'],
        'net_water_sales_volume':
        all_log['volume']['water']['ownership']['sales']['nri'],
        'gross_co2e_mass_emission':
        all_log['ghg_mass']['co2e']['100_pct_wi'],
        'gross_co2_mass_emission':
        all_log['ghg_mass']['co2']['100_pct_wi'],
        'gross_ch4_mass_emission':
        all_log['ghg_mass']['ch4']['100_pct_wi'],
        'gross_n2o_mass_emission':
        all_log['ghg_mass']['n2o']['100_pct_wi'],
        'wi_co2e_mass_emission':
        all_log['ghg_mass']['co2e']['wi'],
        'wi_co2_mass_emission':
        all_log['ghg_mass']['co2']['wi'],
        'wi_ch4_mass_emission':
        all_log['ghg_mass']['ch4']['wi'],
        'wi_n2o_mass_emission':
        all_log['ghg_mass']['n2o']['wi'],
        'nri_co2e_mass_emission':
        all_log['ghg_mass']['co2e']['nri'],
        'nri_co2_mass_emission':
        all_log['ghg_mass']['co2']['nri'],
        'nri_ch4_mass_emission':
        all_log['ghg_mass']['ch4']['nri'],
        'nri_n2o_mass_emission':
        all_log['ghg_mass']['n2o']['nri'],
        'input_oil_price':
        all_log['revenue']['oil']['original_price'],
        'input_gas_price':
        all_log['revenue']['gas']['original_price'],
        'input_ngl_price':
        all_log['revenue']['ngl']['original_price'],
        'input_drip_condensate_price':
        all_log['revenue']['drip_condensate']['original_price'],
        'oil_differentials_1':
        all_log['revenue']['oil']['differentials_1'],
        'gas_differentials_1':
        all_log['revenue']['gas']['differentials_1'],
        'ngl_differentials_1':
        all_log['revenue']['ngl']['differentials_1'],
        'drip_condensate_differentials_1':
        all_log['revenue']['drip_condensate']['differentials_1'],
        'oil_differentials_2':
        all_log['revenue']['oil']['differentials_2'],
        'gas_differentials_2':
        all_log['revenue']['gas']['differentials_2'],
        'ngl_differentials_2':
        all_log['revenue']['ngl']['differentials_2'],
        'drip_condensate_differentials_2':
        all_log['revenue']['drip_condensate']['differentials_2'],
        'oil_differentials_3':
        all_log['revenue']['oil']['differentials_3'],
        'gas_differentials_3':
        all_log['revenue']['gas']['differentials_3'],
        'ngl_differentials_3':
        all_log['revenue']['ngl']['differentials_3'],
        'drip_condensate_differentials_3':
        all_log['revenue']['drip_condensate']['differentials_3'],
        'oil_price':
        all_log['revenue']['oil']['price_after_diff'],
        'gas_price':
        all_log['revenue']['gas']['price_after_diff'],
        'ngl_price':
        all_log['revenue']['ngl']['price_after_diff'],
        'drip_condensate_price':
        all_log['revenue']['drip_condensate']['price_after_diff'],
        # sales volume daily
        'gross_oil_sales_volume_daily':
        all_log.get("volume_daily", {}).get("oil", {}).get("sales", np.array([0])),
        'gross_gas_sales_volume_daily':
        all_log.get("volume_daily", {}).get("gas", {}).get("sales", np.array([0])),
        'gross_ngl_sales_volume_daily':
        all_log.get("volume_daily", {}).get("ngl", {}).get("sales", np.array([0])),
        'gross_drip_condensate_sales_volume_daily':
        all_log.get("volume_daily", {}).get("drip_condensate", {}).get("sales", np.array([0])),
        'gross_boe_sales_volume_daily':
        all_log.get("volume_daily", {}).get("boe", {}).get("sales", {}).get("total", np.array([0])),
        'wi_oil_sales_volume_daily':
        all_log.get("volume_daily", {}).get("oil", {}).get("ownership", {}).get("sales", {}).get("wi", np.array([0])),
        'wi_gas_sales_volume_daily':
        all_log.get("volume_daily", {}).get("gas", {}).get("ownership", {}).get("sales", {}).get("wi", np.array([0])),
        'wi_ngl_sales_volume_daily':
        all_log.get("volume_daily", {}).get("ngl", {}).get("ownership", {}).get("sales", {}).get("wi", np.array([0])),
        'wi_drip_condensate_sales_volume_daily':
        all_log.get("volume_daily", {}).get("drip_condensate", {}).get("ownership",
                                                                       {}).get("sales", {}).get("wi", np.array([0])),
        'wi_boe_sales_volume_daily':
        all_log.get("volume_daily", {}).get("boe", {}).get("sales", {}).get("wi", np.array([0])),
        'net_oil_sales_volume_daily':
        all_log.get("volume_daily", {}).get("oil", {}).get("ownership", {}).get("sales", {}).get("nri", np.array([0])),
        'net_gas_sales_volume_daily':
        all_log.get("volume_daily", {}).get("gas", {}).get("ownership", {}).get("sales", {}).get("nri", np.array([0])),
        'net_ngl_sales_volume_daily':
        all_log.get("volume_daily", {}).get("ngl", {}).get("ownership", {}).get("sales", {}).get("nri", np.array([0])),
        'net_drip_condensate_sales_volume_daily':
        all_log.get("volume_daily", {}).get("drip_condensate", {}).get("ownership",
                                                                       {}).get("sales", {}).get("nri", np.array([0])),
        'net_boe_sales_volume_daily':
        all_log.get("volume_daily", {}).get("boe", {}).get("sales", {}).get("nri", np.array([0])),
        # end break down price calculation
        'oil_revenue':
        all_log['revenue']['oil']['net_revenue'],
        'gas_revenue':
        all_log['revenue']['gas']['net_revenue'],
        'ngl_revenue':
        all_log['revenue']['ngl']['net_revenue'],
        'drip_condensate_revenue':
        all_log['revenue']['drip_condensate']['net_revenue'],
        'total_revenue':
        all_log['bfit_cf']['total_net_revenue'],
        # gross revenue
        'gross_oil_revenue':
        all_log['revenue']['oil']['gross_revenue'],
        'gross_gas_revenue':
        all_log['revenue']['gas']['gross_revenue'],
        'gross_ngl_revenue':
        all_log['revenue']['ngl']['gross_revenue'],
        'gross_drip_condensate_revenue':
        all_log['revenue']['drip_condensate']['gross_revenue'],
        'total_gross_revenue':
        all_log['bfit_cf']['total_gross_revenue'],
        # 100 pct wi revenue
        '100_pct_wi_oil_revenue':
        all_log['revenue']['oil']['100_pct_wi_revenue'],
        '100_pct_wi_gas_revenue':
        all_log['revenue']['gas']['100_pct_wi_revenue'],
        '100_pct_wi_ngl_revenue':
        all_log['revenue']['ngl']['100_pct_wi_revenue'],
        '100_pct_wi_drip_condensate_revenue':
        all_log['revenue']['drip_condensate']['100_pct_wi_revenue'],
        'total_100_pct_wi_revenue':
        (all_log['revenue']['oil']['100_pct_wi_revenue'] + all_log['revenue']['gas']['100_pct_wi_revenue']
         + all_log['revenue']['ngl']['100_pct_wi_revenue']
         + all_log['revenue']['drip_condensate']['100_pct_wi_revenue']),
        'net_income':
        all_log['bfit_cf']['net_income'],
        # production tax
        'oil_severance_tax':
        all_log['production_tax']['oil_severance_tax'],
        'gas_severance_tax':
        all_log['production_tax']['gas_severance_tax'],
        'ngl_severance_tax':
        all_log['production_tax']['ngl_severance_tax'],
        'drip_condensate_severance_tax':
        all_log['production_tax']['drip_condensate_severance_tax'],
        'total_severance_tax':
        all_log['production_tax']['oil_severance_tax'] + all_log['production_tax']['gas_severance_tax']
        + all_log['production_tax']['ngl_severance_tax'] + all_log['production_tax']['drip_condensate_severance_tax'],
        'ad_valorem_tax':
        all_log['production_tax']['ad_valorem_tax'],
        'total_production_tax':
        all_log['production_tax']['total_production_tax'],
        # capex
        'tangible_drilling':
        all_log['capex']['capex_by_category']['net']['drilling']['tangible'],
        'intangible_drilling':
        all_log['capex']['capex_by_category']['net']['drilling']['intangible'],
        'total_drilling':
        all_log['capex']['capex_by_category']['net']['drilling']['total'],
        'tangible_completion':
        all_log['capex']['capex_by_category']['net']['completion']['tangible'],
        'intangible_completion':
        all_log['capex']['capex_by_category']['net']['completion']['intangible'],
        'total_completion':
        all_log['capex']['capex_by_category']['net']['completion']['total'],
        'tangible_legal':
        all_log['capex']['capex_by_category']['net']['legal']['tangible'],
        'intangible_legal':
        all_log['capex']['capex_by_category']['net']['legal']['intangible'],
        'total_legal':
        all_log['capex']['capex_by_category']['net']['legal']['total'],
        'tangible_pad':
        all_log['capex']['capex_by_category']['net']['pad']['tangible'],
        'intangible_pad':
        all_log['capex']['capex_by_category']['net']['pad']['intangible'],
        'total_pad':
        all_log['capex']['capex_by_category']['net']['pad']['total'],
        'tangible_facilities':
        all_log['capex']['capex_by_category']['net']['facilities']['tangible'],
        'intangible_facilities':
        all_log['capex']['capex_by_category']['net']['facilities']['intangible'],
        'total_facilities':
        all_log['capex']['capex_by_category']['net']['facilities']['total'],
        'tangible_artificial_lift':
        all_log['capex']['capex_by_category']['net']['artificial_lift']['tangible'],
        'intangible_artificial_lift':
        all_log['capex']['capex_by_category']['net']['artificial_lift']['intangible'],
        'total_artificial_lift':
        all_log['capex']['capex_by_category']['net']['artificial_lift']['total'],
        'tangible_workover':
        all_log['capex']['capex_by_category']['net']['workover']['tangible'],
        'intangible_workover':
        all_log['capex']['capex_by_category']['net']['workover']['intangible'],
        'total_workover':
        all_log['capex']['capex_by_category']['net']['workover']['total'],
        'tangible_leasehold':
        all_log['capex']['capex_by_category']['net']['leasehold']['tangible'],
        'intangible_leasehold':
        all_log['capex']['capex_by_category']['net']['leasehold']['intangible'],
        'total_leasehold':
        all_log['capex']['capex_by_category']['net']['leasehold']['total'],
        'tangible_development':
        all_log['capex']['capex_by_category']['net']['development']['tangible'],
        'intangible_development':
        all_log['capex']['capex_by_category']['net']['development']['intangible'],
        'total_development':
        all_log['capex']['capex_by_category']['net']['development']['total'],
        'tangible_pipelines':
        all_log['capex']['capex_by_category']['net']['pipelines']['tangible'],
        'intangible_pipelines':
        all_log['capex']['capex_by_category']['net']['pipelines']['intangible'],
        'total_pipelines':
        all_log['capex']['capex_by_category']['net']['pipelines']['total'],
        'tangible_exploration':
        all_log['capex']['capex_by_category']['net']['exploration']['tangible'],
        'intangible_exploration':
        all_log['capex']['capex_by_category']['net']['exploration']['intangible'],
        'total_exploration':
        all_log['capex']['capex_by_category']['net']['exploration']['total'],
        'tangible_waterline':
        all_log['capex']['capex_by_category']['net']['waterline']['tangible'],
        'intangible_waterline':
        all_log['capex']['capex_by_category']['net']['waterline']['intangible'],
        'total_waterline':
        all_log['capex']['capex_by_category']['net']['waterline']['total'],
        'tangible_appraisal':
        all_log['capex']['capex_by_category']['net']['appraisal']['tangible'],
        'intangible_appraisal':
        all_log['capex']['capex_by_category']['net']['appraisal']['intangible'],
        'total_appraisal':
        all_log['capex']['capex_by_category']['net']['appraisal']['total'],
        'tangible_other_investment':
        all_log['capex']['capex_by_category']['net']['other_investment']['tangible'],
        'intangible_other_investment':
        all_log['capex']['capex_by_category']['net']['other_investment']['intangible'],
        'total_other_investment':
        all_log['capex']['capex_by_category']['net']['other_investment']['total'],
        'tangible_abandonment':
        all_log['capex']['capex_by_category']['net']['abandonment']['tangible'],
        'intangible_abandonment':
        all_log['capex']['capex_by_category']['net']['abandonment']['intangible'],
        'total_abandonment':
        all_log['capex']['capex_by_category']['net']['abandonment']['total'],
        'tangible_salvage':
        all_log['capex']['capex_by_category']['net']['salvage']['tangible'],
        'intangible_salvage':
        all_log['capex']['capex_by_category']['net']['salvage']['intangible'],
        'total_salvage':
        all_log['capex']['capex_by_category']['net']['salvage']['total'],
        #
        'total_tangible_capex':
        all_log['capex']['tangible'],
        'total_intangible_capex':
        all_log['capex']['intangible'],
        'total_capex':
        all_log['capex']['total_capex'],
        'total_gross_capex':
        all_log['capex']['total_gross_capex'],
        'first_discounted_capex':
        all_log['bfit_disc']['first_discounted_capex'],
        'second_discounted_capex':
        all_log['bfit_disc']['second_discounted_capex'],
        'first_discount_net_income':
        all_log['bfit_disc']['first_discount_net_income'],
        'second_discount_net_income':
        all_log['bfit_disc']['second_discount_net_income'],
        'net_profit':
        all_log['bfit_cf']['net_profit'],
        'before_income_tax_cash_flow':
        all_log['bfit_cf']['bfit_cf'],
        'first_discount_cash_flow':
        all_log['bfit_disc']['detail_cf']['disc_cf_1'],
        'second_discount_cash_flow':
        all_log['bfit_disc']['detail_cf']['disc_cf_2'],
        # well count
        'gross_well_count':
        all_log['well_count']['gross_well_count'],
        'wi_well_count':
        all_log['well_count']['wi_well_count'],
        'nri_well_count':
        all_log['well_count']['nri_well_count'],
    }

    # expenses
    econ_output_exp_insert(flat_econ_log, all_log)

    # discount table cf
    for key, cf in all_log['bfit_disc']['npv'].items():
        flat_econ_log[key] = cf

    # afit columns
    if 'afit_cf' in all_log.keys():
        flat_econ_log['tax_credit'] = all_log['afit_cf']['tax_credit']
        flat_econ_log['depreciation'] = all_log['afit_cf']['depreciation']
        flat_econ_log['tangible_depreciation'] = all_log['afit_cf']['tangible_depreciation']
        flat_econ_log['intangible_depreciation'] = all_log['afit_cf']['intangible_depreciation']
        flat_econ_log['depletion'] = all_log['afit_cf']['depletion']
        flat_econ_log['tangible_depletion'] = all_log['afit_cf']['tangible_depletion']
        flat_econ_log['intangible_depletion'] = all_log['afit_cf']['intangible_depletion']
        flat_econ_log['percentage_depletion'] = all_log['afit_cf']['percentage_depletion']
        flat_econ_log['total_deductions'] = all_log['afit_cf']['total_deductions']
        flat_econ_log['taxable_income'] = all_log['afit_cf']['taxable_income']
        flat_econ_log['state_income_tax'] = all_log['afit_cf']['state_income_tax']
        flat_econ_log['state_tax_rate'] = all_log['afit_cf']['state_tax_rate']
        flat_econ_log['federal_income_tax'] = all_log['afit_cf']['federal_income_tax']
        flat_econ_log['federal_tax_rate'] = all_log['afit_cf']['federal_tax_rate']
        flat_econ_log['after_income_tax_cash_flow'] = all_log['afit_cf']['afit_cf']
        flat_econ_log['afit_first_discount_cash_flow'] = all_log['afit_disc']['detail_cf']['disc_cf_1']
        flat_econ_log['afit_second_discount_cash_flow'] = all_log['afit_disc']['detail_cf']['disc_cf_2']
        flat_econ_log['afit_first_discounted_capex'] = all_log['afit_disc']['first_discounted_capex']
        flat_econ_log['afit_second_discounted_capex'] = all_log['afit_disc']['second_discounted_capex']
        flat_econ_log['afit_first_discounted_net_income'] = all_log['afit_disc']['first_discount_net_income']
        flat_econ_log['afit_second_discounted_net_income'] = all_log['afit_disc']['second_discount_net_income']

        for key, cf in all_log['afit_disc']['npv'].items():
            flat_econ_log['afit_' + key] = cf

    # stream properties
    flat_econ_log['oil_shrinkage'] = all_log['stream_property']['shrinkage']['oil']
    flat_econ_log['gas_shrinkage'] = all_log['stream_property']['shrinkage']['gas']
    flat_econ_log['oil_loss'] = all_log['stream_property']['loss_flare']['oil']['loss']
    flat_econ_log['gas_loss'] = all_log['stream_property']['loss_flare']['gas']['loss']
    flat_econ_log['gas_flare'] = all_log['stream_property']['loss_flare']['gas']['flare']
    flat_econ_log['ngl_yield'] = all_log['stream_property']['yield']['ngl']['value']
    flat_econ_log['drip_condensate_yield'] = all_log['stream_property']['yield']['drip_condensate']['value']

    return flat_econ_log


def group_econ_data_from_well_result(well_result, econ_group, combo_name):
    date_array = well_result['date']
    return {
        'econ_group':
        np.repeat(econ_group, len(date_array)),
        'date':
        date_array,
        'combo_name':
        np.repeat(combo_name, len(date_array)),
        'total_expense':
        np.array([
            well_result['expense']['total'][key]
            for key in ['water_disp', 'var_expense', 'fixed_expense', 'ghg_expense']
        ]).sum(axis=0),
        'total_production_tax':
        well_result['production_tax']['total_production_tax'],
        'total_capex':
        well_result['capex']['total_capex'],
        'oil_revenue':
        well_result['revenue']['oil']['net_revenue'],
        'gas_revenue':
        well_result['revenue']['gas']['net_revenue'],
        'ngl_revenue':
        well_result['revenue']['ngl']['net_revenue'],
        'drip_condensate_revenue':
        well_result['revenue']['drip_condensate']['net_revenue'],
        'total_revenue':
        well_result['bfit_cf']['total_net_revenue'],
        'gross_oil_revenue':
        well_result['revenue']['oil']['gross_revenue'],
        'gross_gas_revenue':
        well_result['revenue']['gas']['gross_revenue'],
        'gross_ngl_revenue':
        well_result['revenue']['ngl']['gross_revenue'],
        'gross_drip_condensate_revenue':
        well_result['revenue']['drip_condensate']['gross_revenue'],
        'total_gross_revenue':
        well_result['bfit_cf']['total_gross_revenue'],
        '100_pct_wi_oil_revenue':
        well_result['revenue']['oil']['100_pct_wi_revenue'],
        '100_pct_wi_gas_revenue':
        well_result['revenue']['gas']['100_pct_wi_revenue'],
        '100_pct_wi_ngl_revenue':
        well_result['revenue']['ngl']['100_pct_wi_revenue'],
        '100_pct_wi_drip_condensate_revenue':
        well_result['revenue']['drip_condensate']['100_pct_wi_revenue'],
        'total_100_pct_wi_revenue':
        np.array([
            well_result['revenue'][phase]['100_pct_wi_revenue'] for phase in ['oil', 'gas', 'ngl', 'drip_condensate']
        ]).sum(axis=0),
        'net_income':
        well_result['bfit_cf']['net_income'],
        'gross_oil_well_head_volume':
        well_result['volume']['oil']['well_head'],
        'net_oil_well_head_volume':
        well_result['volume']['oil']['ownership']['well_head']['nri'],
        'gross_gas_well_head_volume':
        well_result['volume']['gas']['well_head'],
        'net_gas_well_head_volume':
        well_result['volume']['gas']['ownership']['well_head']['nri'],
        'gross_water_well_head_volume':
        well_result['volume']['water']['well_head'],
        'gross_boe_well_head_volume':
        well_result['volume']['boe']['well_head']['total'],
        'net_boe_well_head_volume':
        well_result['volume']['boe']['well_head']['nri'],
        'gross_oil_sales_volume':
        well_result['volume']['oil']['sales'],
        'gross_gas_sales_volume':
        well_result['volume']['gas']['sales'],
        'gross_ngl_sales_volume':
        well_result['volume']['ngl']['sales'],
        'gross_drip_condensate_sales_volume':
        well_result['volume']['drip_condensate']['sales'],
        'unshrunk_oil_volume':
        well_result['volume']['oil']['unshrunk'],
        'unshrunk_gas_volume':
        well_result['volume']['gas']['unshrunk'],
        # well count not used for cutoff calculation
        'gross_well_count':
        well_result['well_count']['gross_well_count'],
        'wi_well_count':
        well_result['well_count']['wi_well_count'],
        'nri_well_count':
        well_result['well_count']['nri_well_count'],
    }
