const toApiOneLiner = (oneLiner) => ({
	id: oneLiner._id.toString(),
	comboName: oneLiner.comboName,
	econPRMSResourcesClass: oneLiner?.reservesCategory?.econ_prms_resources_class,
	econPRMSReservesCategory: oneLiner?.reservesCategory?.econ_prms_reserves_category,
	econPRMSReservesSubCategory: oneLiner?.reservesCategory?.econ_prms_reserves_sub_category,
	output: oneLiner.oneLinerData && toApiOneLinerOutput(oneLiner),
	well: oneLiner.well.toString(),
});

// eslint-disable-next-line complexity
const toApiOneLinerOutput = (oneLiner) => ({
	abandonmentDate: oneLiner.oneLinerData.abandonment_date && oneLiner.oneLinerData.abandonment_date.value,
	adValoremTax: oneLiner.oneLinerData.ad_valorem_tax && oneLiner.oneLinerData.ad_valorem_tax.value,
	afterIncomeTaxCashFlow:
		oneLiner.oneLinerData.after_income_tax_cash_flow && oneLiner.oneLinerData.after_income_tax_cash_flow.value,
	applyNormalization: oneLiner.oneLinerData.apply_normalization && oneLiner.oneLinerData.apply_normalization.value,
	asOfDate: oneLiner.oneLinerData.as_of_date && oneLiner.oneLinerData.as_of_date.value,
	beforeIncomeTaxCashFlow:
		oneLiner.oneLinerData.before_income_tax_cash_flow && oneLiner.oneLinerData.before_income_tax_cash_flow.value,
	consecutiveNegativeCashFlowMonthCount:
		oneLiner.oneLinerData.consecutive_negative_cash_flow_month_count &&
		oneLiner.oneLinerData.consecutive_negative_cash_flow_month_count.value,
	consecutiveNegativeCashFlowMonths:
		oneLiner.oneLinerData.consecutive_negative_cash_flow_months &&
		oneLiner.oneLinerData.consecutive_negative_cash_flow_months.value,
	depreciation: oneLiner.oneLinerData.depreciation && oneLiner.oneLinerData.depreciation.value,
	discountDate: oneLiner.oneLinerData.discount_date && oneLiner.oneLinerData.discount_date.value,
	discountTableCashFlow_1:
		oneLiner.oneLinerData.discount_table_cash_flow_1 && oneLiner.oneLinerData.discount_table_cash_flow_1.value,
	discountTableCashFlow_10:
		oneLiner.oneLinerData.discount_table_cash_flow_10 && oneLiner.oneLinerData.discount_table_cash_flow_10.value,
	discountTableCashFlow_11:
		oneLiner.oneLinerData.discount_table_cash_flow_11 && oneLiner.oneLinerData.discount_table_cash_flow_11.value,
	discountTableCashFlow_12:
		oneLiner.oneLinerData.discount_table_cash_flow_12 && oneLiner.oneLinerData.discount_table_cash_flow_12.value,
	discountTableCashFlow_13:
		oneLiner.oneLinerData.discount_table_cash_flow_13 && oneLiner.oneLinerData.discount_table_cash_flow_13.value,
	discountTableCashFlow_14:
		oneLiner.oneLinerData.discount_table_cash_flow_14 && oneLiner.oneLinerData.discount_table_cash_flow_14.value,
	discountTableCashFlow_15:
		oneLiner.oneLinerData.discount_table_cash_flow_15 && oneLiner.oneLinerData.discount_table_cash_flow_15.value,
	discountTableCashFlow_16:
		oneLiner.oneLinerData.discount_table_cash_flow_16 && oneLiner.oneLinerData.discount_table_cash_flow_16.value,
	discountTableCashFlow_2:
		oneLiner.oneLinerData.discount_table_cash_flow_2 && oneLiner.oneLinerData.discount_table_cash_flow_2.value,
	discountTableCashFlow_3:
		oneLiner.oneLinerData.discount_table_cash_flow_3 && oneLiner.oneLinerData.discount_table_cash_flow_3.value,
	discountTableCashFlow_4:
		oneLiner.oneLinerData.discount_table_cash_flow_4 && oneLiner.oneLinerData.discount_table_cash_flow_4.value,
	discountTableCashFlow_5:
		oneLiner.oneLinerData.discount_table_cash_flow_5 && oneLiner.oneLinerData.discount_table_cash_flow_5.value,
	discountTableCashFlow_6:
		oneLiner.oneLinerData.discount_table_cash_flow_6 && oneLiner.oneLinerData.discount_table_cash_flow_6.value,
	discountTableCashFlow_7:
		oneLiner.oneLinerData.discount_table_cash_flow_7 && oneLiner.oneLinerData.discount_table_cash_flow_7.value,
	discountTableCashFlow_8:
		oneLiner.oneLinerData.discount_table_cash_flow_8 && oneLiner.oneLinerData.discount_table_cash_flow_8.value,
	discountTableCashFlow_9:
		oneLiner.oneLinerData.discount_table_cash_flow_9 && oneLiner.oneLinerData.discount_table_cash_flow_9.value,
	dripCondensateGatheringExpense:
		oneLiner.oneLinerData.drip_condensate_gathering_expense &&
		oneLiner.oneLinerData.drip_condensate_gathering_expense.value,
	dripCondensateMarketingExpense:
		oneLiner.oneLinerData.drip_condensate_marketing_expense &&
		oneLiner.oneLinerData.drip_condensate_marketing_expense.value,
	dripCondensateOtherExpense:
		oneLiner.oneLinerData.drip_condensate_other_expense &&
		oneLiner.oneLinerData.drip_condensate_other_expense.value,
	dripCondensatePrice:
		oneLiner.oneLinerData.drip_condensate_price && oneLiner.oneLinerData.drip_condensate_price.value,
	dripCondensateProcessingExpense:
		oneLiner.oneLinerData.drip_condensate_processing_expense &&
		oneLiner.oneLinerData.drip_condensate_processing_expense.value,
	dripCondensateRevenue:
		oneLiner.oneLinerData.drip_condensate_revenue && oneLiner.oneLinerData.drip_condensate_revenue.value,
	dripCondensateSeveranceTax:
		oneLiner.oneLinerData.drip_condensate_severance_tax &&
		oneLiner.oneLinerData.drip_condensate_severance_tax.value,
	dripCondensateShrunkEur:
		oneLiner.oneLinerData.drip_condensate_shrunk_eur && oneLiner.oneLinerData.drip_condensate_shrunk_eur.value,
	dripCondensateTransportationExpense:
		oneLiner.oneLinerData.drip_condensate_transportation_expense &&
		oneLiner.oneLinerData.drip_condensate_transportation_expense.value,
	dripCondensateYield:
		oneLiner.oneLinerData.drip_condensate_yield && oneLiner.oneLinerData.drip_condensate_yield.value,
	dripCondensateBoeConversion:
		oneLiner.oneLinerData.drip_condensate_boe_conversion &&
		oneLiner.oneLinerData.drip_condensate_boe_conversion.value,
	dripCondensateDifferentials1:
		oneLiner.oneLinerData.drip_condensate_differentials_1 &&
		oneLiner.oneLinerData.drip_condensate_differentials_1.value,
	dripCondensateDifferentials2:
		oneLiner.oneLinerData.drip_condensate_differentials_2 &&
		oneLiner.oneLinerData.drip_condensate_differentials_2.value,
	dripCondensateRisk: oneLiner.oneLinerData.drip_condensate_risk && oneLiner.oneLinerData.drip_condensate_risk.value,
	dripCondensateShrunkEurOverPll:
		oneLiner.oneLinerData.drip_condensate_shrunk_eur_over_pll &&
		oneLiner.oneLinerData.drip_condensate_shrunk_eur_over_pll.value,
	dryGasBoeConversion:
		oneLiner.oneLinerData.dry_gas_boe_conversion && oneLiner.oneLinerData.dry_gas_boe_conversion.value,
	federalIncomeTax: oneLiner.oneLinerData.federal_income_tax && oneLiner.oneLinerData.federal_income_tax.value,
	firstConsecutiveNegativeCashFlowMonth:
		oneLiner.oneLinerData.first_consecutive_negative_cash_flow_month &&
		oneLiner.oneLinerData.first_consecutive_negative_cash_flow_month.value,
	firstDiscountCashFlow:
		oneLiner.oneLinerData.first_discount_cash_flow && oneLiner.oneLinerData.first_discount_cash_flow.value,
	firstDiscountRoi: oneLiner.oneLinerData.first_discount_roi && oneLiner.oneLinerData.first_discount_roi.value,
	firstDiscountNetIncome:
		oneLiner.oneLinerData.first_discount_net_income && oneLiner.oneLinerData.first_discount_net_income.value,
	firstDiscountPayout:
		oneLiner.oneLinerData.first_discount_payout && oneLiner.oneLinerData.first_discount_payout.value,
	firstDiscountPayoutDuration:
		oneLiner.oneLinerData.first_discount_payout_duration &&
		oneLiner.oneLinerData.first_discount_payout_duration.value,
	firstDiscountRoiUndiscountedCapex:
		oneLiner.oneLinerData.first_discount_roi_undiscounted_capex &&
		oneLiner.oneLinerData.first_discount_roi_undiscounted_capex.value,
	firstDiscountedCapex:
		oneLiner.oneLinerData.first_discounted_capex && oneLiner.oneLinerData.first_discounted_capex.value,
	fiveYearGrossBoeSalesVolume:
		oneLiner.oneLinerData.five_year_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.five_year_gross_BOE_sales_volume.value,
	fiveYearGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.five_year_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.five_year_gross_BOE_well_head_volume.value,
	fiveYearGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.five_year_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.five_year_gross_drip_condensate_sales_volume.value,
	fiveYearGrossGasSalesVolume:
		oneLiner.oneLinerData.five_year_gross_gas_sales_volume &&
		oneLiner.oneLinerData.five_year_gross_gas_sales_volume.value,
	fiveYearGrossGasWellHeadVolume:
		oneLiner.oneLinerData.five_year_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.five_year_gross_gas_well_head_volume.value,
	fiveYearGrossNglSalesVolume:
		oneLiner.oneLinerData.five_year_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.five_year_gross_ngl_sales_volume.value,
	fiveYearGrossOilSalesVolume:
		oneLiner.oneLinerData.five_year_gross_oil_sales_volume &&
		oneLiner.oneLinerData.five_year_gross_oil_sales_volume.value,
	fiveYearGrossOilWellHeadVolume:
		oneLiner.oneLinerData.five_year_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.five_year_gross_oil_well_head_volume.value,
	fiveYearGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.five_year_gross_water_well_head_volume &&
		oneLiner.oneLinerData.five_year_gross_water_well_head_volume.value,
	fiveYearNetBoeSalesVolume:
		oneLiner.oneLinerData.five_year_net_BOE_sales_volume &&
		oneLiner.oneLinerData.five_year_net_BOE_sales_volume.value,
	fiveYearNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.five_year_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.five_year_net_drip_condensate_sales_volume.value,
	fiveYearNetGasSalesVolume:
		oneLiner.oneLinerData.five_year_net_gas_sales_volume &&
		oneLiner.oneLinerData.five_year_net_gas_sales_volume.value,
	fiveYearNetNglSalesVolume:
		oneLiner.oneLinerData.five_year_net_ngl_sales_volume &&
		oneLiner.oneLinerData.five_year_net_ngl_sales_volume.value,
	fiveYearNetOilSalesVolume:
		oneLiner.oneLinerData.five_year_net_oil_sales_volume &&
		oneLiner.oneLinerData.five_year_net_oil_sales_volume.value,
	fiveYearWiBoeSalesVolume:
		oneLiner.oneLinerData.five_year_wi_BOE_sales_volume &&
		oneLiner.oneLinerData.five_year_wi_BOE_sales_volume.value,
	fiveYearWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.five_year_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.five_year_wi_drip_condensate_sales_volume.value,
	fiveYearWiGasSalesVolume:
		oneLiner.oneLinerData.five_year_wi_gas_sales_volume &&
		oneLiner.oneLinerData.five_year_wi_gas_sales_volume.value,
	fiveYearWiNglSalesVolume:
		oneLiner.oneLinerData.five_year_wi_ngl_sales_volume &&
		oneLiner.oneLinerData.five_year_wi_ngl_sales_volume.value,
	fiveYearWiOilSalesVolume:
		oneLiner.oneLinerData.five_year_wi_oil_sales_volume &&
		oneLiner.oneLinerData.five_year_wi_oil_sales_volume.value,
	forecastName: oneLiner.oneLinerData.forecast_name && oneLiner.oneLinerData.forecast_name.value,
	gasAssignedPSeriesFirstSegmentB:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_b &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_b.value,
	gasAssignedPSeriesFirstSegmentD1Nominal:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_d1_nominal.value,
	gasAssignedPSeriesFirstSegmentDiEffSec:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_di_eff_sec.value,
	gasAssignedPSeriesFirstSegmentEndDate:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_end_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_end_date.value,
	gasAssignedPSeriesFirstSegmentQEnd:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_q_end &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_q_end.value,
	gasAssignedPSeriesFirstSegmentQStart:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_q_start &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_q_start.value,
	gasAssignedPSeriesFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_realized_d_sw_eff_sec.value,
	gasAssignedPSeriesFirstSegmentSegmentType:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_segment_type &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_segment_type.value,
	gasAssignedPSeriesFirstSegmentStartDate:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_start_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_start_date.value,
	gasAssignedPSeriesFirstSegmentSwDate:
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_sw_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_first_segment_sw_date.value,
	gasAssignedPSeriesLastSegmentB:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_b &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_b.value,
	gasAssignedPSeriesLastSegmentD1Nominal:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_d1_nominal.value,
	gasAssignedPSeriesLastSegmentDiEffSec:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_di_eff_sec.value,
	gasAssignedPSeriesLastSegmentEndDate:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_end_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_end_date.value,
	gasAssignedPSeriesLastSegmentQEnd:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_q_end &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_q_end.value,
	gasAssignedPSeriesLastSegmentQStart:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_q_start &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_q_start.value,
	gasAssignedPSeriesLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_realized_d_sw_eff_sec.value,
	gasAssignedPSeriesLastSegmentSegmentType:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_segment_type &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_segment_type.value,
	gasAssignedPSeriesLastSegmentStartDate:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_start_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_start_date.value,
	gasAssignedPSeriesLastSegmentSwDate:
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_sw_date &&
		oneLiner.oneLinerData.gas_assigned_p_series_last_segment_sw_date.value,
	gasBestFitFirstSegmentB:
		oneLiner.oneLinerData.gas_best_fit_first_segment_b && oneLiner.oneLinerData.gas_best_fit_first_segment_b.value,
	gasBestFitFirstSegmentD1Nominal:
		oneLiner.oneLinerData.gas_best_fit_first_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_d1_nominal.value,
	gasBestFitFirstSegmentDiEffSec:
		oneLiner.oneLinerData.gas_best_fit_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_di_eff_sec.value,
	gasBestFitFirstSegmentEndDate:
		oneLiner.oneLinerData.gas_best_fit_first_segment_end_date &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_end_date.value,
	gasBestFitFirstSegmentQEnd:
		oneLiner.oneLinerData.gas_best_fit_first_segment_q_end &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_q_end.value,
	gasBestFitFirstSegmentQStart:
		oneLiner.oneLinerData.gas_best_fit_first_segment_q_start &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_q_start.value,
	gasBestFitFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_best_fit_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_realized_d_sw_eff_sec.value,
	gasBestFitFirstSegmentSegmentType:
		oneLiner.oneLinerData.gas_best_fit_first_segment_segment_type &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_segment_type.value,
	gasBestFitFirstSegmentStartDate:
		oneLiner.oneLinerData.gas_best_fit_first_segment_start_date &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_start_date.value,
	gasBestFitFirstSegmentSwDate:
		oneLiner.oneLinerData.gas_best_fit_first_segment_sw_date &&
		oneLiner.oneLinerData.gas_best_fit_first_segment_sw_date.value,
	gasBestFitLastSegmentB:
		oneLiner.oneLinerData.gas_best_fit_last_segment_b && oneLiner.oneLinerData.gas_best_fit_last_segment_b.value,
	gasBestFitLastSegmentD1Nominal:
		oneLiner.oneLinerData.gas_best_fit_last_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_d1_nominal.value,
	gasBestFitLastSegmentDiEffSec:
		oneLiner.oneLinerData.gas_best_fit_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_di_eff_sec.value,
	gasBestFitLastSegmentEndDate:
		oneLiner.oneLinerData.gas_best_fit_last_segment_end_date &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_end_date.value,
	gasBestFitLastSegmentQEnd:
		oneLiner.oneLinerData.gas_best_fit_last_segment_q_end &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_q_end.value,
	gasBestFitLastSegmentQStart:
		oneLiner.oneLinerData.gas_best_fit_last_segment_q_start &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_q_start.value,
	gasBestFitLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_best_fit_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_realized_d_sw_eff_sec.value,
	gasBestFitLastSegmentSegmentType:
		oneLiner.oneLinerData.gas_best_fit_last_segment_segment_type &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_segment_type.value,
	gasBestFitLastSegmentStartDate:
		oneLiner.oneLinerData.gas_best_fit_last_segment_start_date &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_start_date.value,
	gasBestFitLastSegmentSwDate:
		oneLiner.oneLinerData.gas_best_fit_last_segment_sw_date &&
		oneLiner.oneLinerData.gas_best_fit_last_segment_sw_date.value,
	gasBreakeven: oneLiner.oneLinerData.gas_breakeven && oneLiner.oneLinerData.gas_breakeven.value,
	gasFlare: oneLiner.oneLinerData.gas_flare && oneLiner.oneLinerData.gas_flare.value,
	gasGatheringExpense:
		oneLiner.oneLinerData.gas_gathering_expense && oneLiner.oneLinerData.gas_gathering_expense.value,
	gasLoss: oneLiner.oneLinerData.gas_loss && oneLiner.oneLinerData.gas_loss.value,
	gasMarketingExpense:
		oneLiner.oneLinerData.gas_marketing_expense && oneLiner.oneLinerData.gas_marketing_expense.value,
	gasOtherExpense: oneLiner.oneLinerData.gas_other_expense && oneLiner.oneLinerData.gas_other_expense.value,
	gasP10FirstSegmentB:
		oneLiner.oneLinerData.gas_p10_first_segment_b && oneLiner.oneLinerData.gas_p10_first_segment_b.value,
	gasP10FirstSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p10_first_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p10_first_segment_d1_nominal.value,
	gasP10FirstSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p10_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p10_first_segment_di_eff_sec.value,
	gasP10FirstSegmentEndDate:
		oneLiner.oneLinerData.gas_p10_first_segment_end_date &&
		oneLiner.oneLinerData.gas_p10_first_segment_end_date.value,
	gasP10FirstSegmentQEnd:
		oneLiner.oneLinerData.gas_p10_first_segment_q_end && oneLiner.oneLinerData.gas_p10_first_segment_q_end.value,
	gasP10FirstSegmentQStart:
		oneLiner.oneLinerData.gas_p10_first_segment_q_start &&
		oneLiner.oneLinerData.gas_p10_first_segment_q_start.value,
	gasP10FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p10_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p10_first_segment_realized_d_sw_eff_sec.value,
	gasP10FirstSegmentSegmentType:
		oneLiner.oneLinerData.gas_p10_first_segment_segment_type &&
		oneLiner.oneLinerData.gas_p10_first_segment_segment_type.value,
	gasP10FirstSegmentStartDate:
		oneLiner.oneLinerData.gas_p10_first_segment_start_date &&
		oneLiner.oneLinerData.gas_p10_first_segment_start_date.value,
	gasP10FirstSegmentSwDate:
		oneLiner.oneLinerData.gas_p10_first_segment_sw_date &&
		oneLiner.oneLinerData.gas_p10_first_segment_sw_date.value,
	gasP10LastSegmentB:
		oneLiner.oneLinerData.gas_p10_last_segment_b && oneLiner.oneLinerData.gas_p10_last_segment_b.value,
	gasP10LastSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p10_last_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p10_last_segment_d1_nominal.value,
	gasP10LastSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p10_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p10_last_segment_di_eff_sec.value,
	gasP10LastSegmentEndDate:
		oneLiner.oneLinerData.gas_p10_last_segment_end_date &&
		oneLiner.oneLinerData.gas_p10_last_segment_end_date.value,
	gasP10LastSegmentQEnd:
		oneLiner.oneLinerData.gas_p10_last_segment_q_end && oneLiner.oneLinerData.gas_p10_last_segment_q_end.value,
	gasP10LastSegmentQStart:
		oneLiner.oneLinerData.gas_p10_last_segment_q_start && oneLiner.oneLinerData.gas_p10_last_segment_q_start.value,
	gasP10LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p10_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p10_last_segment_realized_d_sw_eff_sec.value,
	gasP10LastSegmentSegmentType:
		oneLiner.oneLinerData.gas_p10_last_segment_segment_type &&
		oneLiner.oneLinerData.gas_p10_last_segment_segment_type.value,
	gasP10LastSegmentStartDate:
		oneLiner.oneLinerData.gas_p10_last_segment_start_date &&
		oneLiner.oneLinerData.gas_p10_last_segment_start_date.value,
	gasP10LastSegmentSwDate:
		oneLiner.oneLinerData.gas_p10_last_segment_sw_date && oneLiner.oneLinerData.gas_p10_last_segment_sw_date.value,
	gasP50FirstSegmentB:
		oneLiner.oneLinerData.gas_p50_first_segment_b && oneLiner.oneLinerData.gas_p50_first_segment_b.value,
	gasP50FirstSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p50_first_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p50_first_segment_d1_nominal.value,
	gasP50FirstSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p50_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p50_first_segment_di_eff_sec.value,
	gasP50FirstSegmentEndDate:
		oneLiner.oneLinerData.gas_p50_first_segment_end_date &&
		oneLiner.oneLinerData.gas_p50_first_segment_end_date.value,
	gasP50FirstSegmentQEnd:
		oneLiner.oneLinerData.gas_p50_first_segment_q_end && oneLiner.oneLinerData.gas_p50_first_segment_q_end.value,
	gasP50FirstSegmentQStart:
		oneLiner.oneLinerData.gas_p50_first_segment_q_start &&
		oneLiner.oneLinerData.gas_p50_first_segment_q_start.value,
	gasP50FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p50_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p50_first_segment_realized_d_sw_eff_sec.value,
	gasP50FirstSegmentSegmentType:
		oneLiner.oneLinerData.gas_p50_first_segment_segment_type &&
		oneLiner.oneLinerData.gas_p50_first_segment_segment_type.value,
	gasP50FirstSegmentStartDate:
		oneLiner.oneLinerData.gas_p50_first_segment_start_date &&
		oneLiner.oneLinerData.gas_p50_first_segment_start_date.value,
	gasP50FirstSegmentSwDate:
		oneLiner.oneLinerData.gas_p50_first_segment_sw_date &&
		oneLiner.oneLinerData.gas_p50_first_segment_sw_date.value,
	gasP50LastSegmentB:
		oneLiner.oneLinerData.gas_p50_last_segment_b && oneLiner.oneLinerData.gas_p50_last_segment_b.value,
	gasP50LastSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p50_last_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p50_last_segment_d1_nominal.value,
	gasP50LastSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p50_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p50_last_segment_di_eff_sec.value,
	gasP50LastSegmentEndDate:
		oneLiner.oneLinerData.gas_p50_last_segment_end_date &&
		oneLiner.oneLinerData.gas_p50_last_segment_end_date.value,
	gasP50LastSegmentQEnd:
		oneLiner.oneLinerData.gas_p50_last_segment_q_end && oneLiner.oneLinerData.gas_p50_last_segment_q_end.value,
	gasP50LastSegmentQStart:
		oneLiner.oneLinerData.gas_p50_last_segment_q_start && oneLiner.oneLinerData.gas_p50_last_segment_q_start.value,
	gasP50LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p50_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p50_last_segment_realized_d_sw_eff_sec.value,
	gasP50LastSegmentSegmentType:
		oneLiner.oneLinerData.gas_p50_last_segment_segment_type &&
		oneLiner.oneLinerData.gas_p50_last_segment_segment_type.value,
	gasP50LastSegmentStartDate:
		oneLiner.oneLinerData.gas_p50_last_segment_start_date &&
		oneLiner.oneLinerData.gas_p50_last_segment_start_date.value,
	gasP50LastSegmentSwDate:
		oneLiner.oneLinerData.gas_p50_last_segment_sw_date && oneLiner.oneLinerData.gas_p50_last_segment_sw_date.value,
	gasP90FirstSegmentB:
		oneLiner.oneLinerData.gas_p90_first_segment_b && oneLiner.oneLinerData.gas_p90_first_segment_b.value,
	gasP90FirstSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p90_first_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p90_first_segment_d1_nominal.value,
	gasP90FirstSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p90_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p90_first_segment_di_eff_sec.value,
	gasP90FirstSegmentEndDate:
		oneLiner.oneLinerData.gas_p90_first_segment_end_date &&
		oneLiner.oneLinerData.gas_p90_first_segment_end_date.value,
	gasP90FirstSegmentQEnd:
		oneLiner.oneLinerData.gas_p90_first_segment_q_end && oneLiner.oneLinerData.gas_p90_first_segment_q_end.value,
	gasP90FirstSegmentQStart:
		oneLiner.oneLinerData.gas_p90_first_segment_q_start &&
		oneLiner.oneLinerData.gas_p90_first_segment_q_start.value,
	gasP90FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p90_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p90_first_segment_realized_d_sw_eff_sec.value,
	gasP90FirstSegmentSegmentType:
		oneLiner.oneLinerData.gas_p90_first_segment_segment_type &&
		oneLiner.oneLinerData.gas_p90_first_segment_segment_type.value,
	gasP90FirstSegmentStartDate:
		oneLiner.oneLinerData.gas_p90_first_segment_start_date &&
		oneLiner.oneLinerData.gas_p90_first_segment_start_date.value,
	gasP90FirstSegmentSwDate:
		oneLiner.oneLinerData.gas_p90_first_segment_sw_date &&
		oneLiner.oneLinerData.gas_p90_first_segment_sw_date.value,
	gasP90LastSegmentB:
		oneLiner.oneLinerData.gas_p90_last_segment_b && oneLiner.oneLinerData.gas_p90_last_segment_b.value,
	gasP90LastSegmentD1Nominal:
		oneLiner.oneLinerData.gas_p90_last_segment_d1_nominal &&
		oneLiner.oneLinerData.gas_p90_last_segment_d1_nominal.value,
	gasP90LastSegmentDiEffSec:
		oneLiner.oneLinerData.gas_p90_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.gas_p90_last_segment_di_eff_sec.value,
	gasP90LastSegmentEndDate:
		oneLiner.oneLinerData.gas_p90_last_segment_end_date &&
		oneLiner.oneLinerData.gas_p90_last_segment_end_date.value,
	gasP90LastSegmentQEnd:
		oneLiner.oneLinerData.gas_p90_last_segment_q_end && oneLiner.oneLinerData.gas_p90_last_segment_q_end.value,
	gasP90LastSegmentQStart:
		oneLiner.oneLinerData.gas_p90_last_segment_q_start && oneLiner.oneLinerData.gas_p90_last_segment_q_start.value,
	gasP90LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.gas_p90_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.gas_p90_last_segment_realized_d_sw_eff_sec.value,
	gasP90LastSegmentSegmentType:
		oneLiner.oneLinerData.gas_p90_last_segment_segment_type &&
		oneLiner.oneLinerData.gas_p90_last_segment_segment_type.value,
	gasP90LastSegmentStartDate:
		oneLiner.oneLinerData.gas_p90_last_segment_start_date &&
		oneLiner.oneLinerData.gas_p90_last_segment_start_date.value,
	gasP90LastSegmentSwDate:
		oneLiner.oneLinerData.gas_p90_last_segment_sw_date && oneLiner.oneLinerData.gas_p90_last_segment_sw_date.value,
	gasPrice: oneLiner.oneLinerData.gas_price && oneLiner.oneLinerData.gas_price.value,
	gasProcessingExpense:
		oneLiner.oneLinerData.gas_processing_expense && oneLiner.oneLinerData.gas_processing_expense.value,
	gasRevenue: oneLiner.oneLinerData.gas_revenue && oneLiner.oneLinerData.gas_revenue.value,
	gasSeveranceTax: oneLiner.oneLinerData.gas_severance_tax && oneLiner.oneLinerData.gas_severance_tax.value,
	gasShrinkage: oneLiner.oneLinerData.gas_shrinkage && oneLiner.oneLinerData.gas_shrinkage.value,
	gasShrunkEur: oneLiner.oneLinerData.gas_shrunk_eur && oneLiner.oneLinerData.gas_shrunk_eur.value,
	gasTransportationExpense:
		oneLiner.oneLinerData.gas_transportation_expense && oneLiner.oneLinerData.gas_transportation_expense.value,
	gasWellHeadEur: oneLiner.oneLinerData.gas_well_head_eur && oneLiner.oneLinerData.gas_well_head_eur.value,
	gasDifferentials1: oneLiner.oneLinerData.gas_differentials_1 && oneLiner.oneLinerData.gas_differentials_1.value,
	gasDifferentials2: oneLiner.oneLinerData.gas_differentials_2 && oneLiner.oneLinerData.gas_differentials_2.value,
	gasProductionAsOfDate:
		oneLiner.oneLinerData.gas_production_as_of_date && oneLiner.oneLinerData.gas_production_as_of_date.value,
	gasRisk: oneLiner.oneLinerData.gas_risk && oneLiner.oneLinerData.gas_risk.value,
	gasShrunkEurOverPll:
		oneLiner.oneLinerData.gas_shrunk_eur_over_pll && oneLiner.oneLinerData.gas_shrunk_eur_over_pll.value,
	gasTcRisk: oneLiner.oneLinerData.gas_tc_risk && oneLiner.oneLinerData.gas_tc_risk.value,
	gasWellHeadEurOverPll:
		oneLiner.oneLinerData.gas_well_head_eur_over_pll && oneLiner.oneLinerData.gas_well_head_eur_over_pll.value,
	grossBoeSalesVolume:
		oneLiner.oneLinerData.gross_boe_sales_volume && oneLiner.oneLinerData.gross_boe_sales_volume.value,
	grossBoeWellHeadVolume:
		oneLiner.oneLinerData.gross_boe_well_head_volume && oneLiner.oneLinerData.gross_boe_well_head_volume.value,
	grossDripCondensateSalesVolume:
		oneLiner.oneLinerData.gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.gross_drip_condensate_sales_volume.value,
	grossGasSalesVolume:
		oneLiner.oneLinerData.gross_gas_sales_volume && oneLiner.oneLinerData.gross_gas_sales_volume.value,
	grossGasWellHeadVolume:
		oneLiner.oneLinerData.gross_gas_well_head_volume && oneLiner.oneLinerData.gross_gas_well_head_volume.value,
	grossNglSalesVolume:
		oneLiner.oneLinerData.gross_ngl_sales_volume && oneLiner.oneLinerData.gross_ngl_sales_volume.value,
	grossOilSalesVolume:
		oneLiner.oneLinerData.gross_oil_sales_volume && oneLiner.oneLinerData.gross_oil_sales_volume.value,
	grossOilWellHeadVolume:
		oneLiner.oneLinerData.gross_oil_well_head_volume && oneLiner.oneLinerData.gross_oil_well_head_volume.value,
	grossWaterWellHeadVolume:
		oneLiner.oneLinerData.gross_water_well_head_volume && oneLiner.oneLinerData.gross_water_well_head_volume.value,
	grossMcfeSalesVolume:
		oneLiner.oneLinerData.gross_mcfe_sales_volume && oneLiner.oneLinerData.gross_mcfe_sales_volume.value,
	grossMcfeWellHeadVolume:
		oneLiner.oneLinerData.gross_mcfe_well_head_volume && oneLiner.oneLinerData.gross_mcfe_well_head_volume.value,
	inputDripCondensatePrice:
		oneLiner.oneLinerData.input_drip_condensate_price && oneLiner.oneLinerData.input_drip_condensate_price.value,
	inputGasPrice: oneLiner.oneLinerData.input_gas_price && oneLiner.oneLinerData.input_gas_price.value,
	inputNglPrice: oneLiner.oneLinerData.input_ngl_price && oneLiner.oneLinerData.input_ngl_price.value,
	inputOilPrice: oneLiner.oneLinerData.input_oil_price && oneLiner.oneLinerData.input_oil_price.value,
	intangibleAbandonment:
		oneLiner.oneLinerData.intangible_abandonment && oneLiner.oneLinerData.intangible_abandonment.value,
	intangibleAppraisal: oneLiner.oneLinerData.intangible_appraisal && oneLiner.oneLinerData.intangible_appraisal.value,
	intangibleArtificialLift:
		oneLiner.oneLinerData.intangible_artificial_lift && oneLiner.oneLinerData.intangible_artificial_lift.value,
	intangibleCompletion:
		oneLiner.oneLinerData.intangible_completion && oneLiner.oneLinerData.intangible_completion.value,
	intangibleDevelopment:
		oneLiner.oneLinerData.intangible_development && oneLiner.oneLinerData.intangible_development.value,
	intangibleDrilling: oneLiner.oneLinerData.intangible_drilling && oneLiner.oneLinerData.intangible_drilling.value,
	intangibleExploration:
		oneLiner.oneLinerData.intangible_exploration && oneLiner.oneLinerData.intangible_exploration.value,
	intangibleFacilities:
		oneLiner.oneLinerData.intangible_facilities && oneLiner.oneLinerData.intangible_facilities.value,
	intangibleLeasehold: oneLiner.oneLinerData.intangible_leasehold && oneLiner.oneLinerData.intangible_leasehold.value,
	intangibleLegal: oneLiner.oneLinerData.intangible_legal && oneLiner.oneLinerData.intangible_legal.value,
	intangibleOtherInvestment:
		oneLiner.oneLinerData.intangible_other_investment && oneLiner.oneLinerData.intangible_other_investment.value,
	intangiblePad: oneLiner.oneLinerData.intangible_pad && oneLiner.oneLinerData.intangible_pad.value,
	intangiblePipelines: oneLiner.oneLinerData.intangible_pipelines && oneLiner.oneLinerData.intangible_pipelines.value,
	intangibleSalvage: oneLiner.oneLinerData.intangible_salvage && oneLiner.oneLinerData.intangible_salvage.value,
	intangibleWaterline: oneLiner.oneLinerData.intangible_waterline && oneLiner.oneLinerData.intangible_waterline.value,
	intangibleWorkover: oneLiner.oneLinerData.intangible_workover && oneLiner.oneLinerData.intangible_workover.value,
	irr: oneLiner.oneLinerData.irr && oneLiner.oneLinerData.irr.value,
	lastConsecutiveNegativeCashFlowMonth:
		oneLiner.oneLinerData.last_consecutive_negative_cash_flow_month &&
		oneLiner.oneLinerData.last_consecutive_negative_cash_flow_month.value,
	lastOneMonthBoeAverage:
		oneLiner.oneLinerData.last_one_month_boe_average && oneLiner.oneLinerData.last_one_month_boe_average.value,
	lastOneMonthGasAverage:
		oneLiner.oneLinerData.last_one_month_gas_average && oneLiner.oneLinerData.last_one_month_gas_average.value,
	lastOneMonthMcfeAverage:
		oneLiner.oneLinerData.last_one_month_mcfe_average && oneLiner.oneLinerData.last_one_month_mcfe_average.value,
	lastOneMonthOilAverage:
		oneLiner.oneLinerData.last_one_month_oil_average && oneLiner.oneLinerData.last_one_month_oil_average.value,
	lastOneMonthWaterAverage:
		oneLiner.oneLinerData.last_one_month_water_average && oneLiner.oneLinerData.last_one_month_water_average.value,
	lastThreeMonthBoeAverage:
		oneLiner.oneLinerData.last_three_month_boe_average && oneLiner.oneLinerData.last_three_month_boe_average.value,
	lastThreeMonthGasAverage:
		oneLiner.oneLinerData.last_three_month_gas_average && oneLiner.oneLinerData.last_three_month_gas_average.value,
	lastThreeMonthMcfeAverage:
		oneLiner.oneLinerData.last_three_month_mcfe_average &&
		oneLiner.oneLinerData.last_three_month_mcfe_average.value,
	lastThreeMonthOilAverage:
		oneLiner.oneLinerData.last_three_month_oil_average && oneLiner.oneLinerData.last_three_month_oil_average.value,
	lastThreeMonthWaterAverage:
		oneLiner.oneLinerData.last_three_month_water_average &&
		oneLiner.oneLinerData.last_three_month_water_average.value,
	leaseNri: oneLiner.oneLinerData.lease_nri && oneLiner.oneLinerData.lease_nri.value,
	monthlyWellCost: oneLiner.oneLinerData.monthly_well_cost && oneLiner.oneLinerData.monthly_well_cost.value,
	netBoeSalesVolume: oneLiner.oneLinerData.net_boe_sales_volume && oneLiner.oneLinerData.net_boe_sales_volume.value,
	netDripCondensateSalesVolume:
		oneLiner.oneLinerData.net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.net_drip_condensate_sales_volume.value,
	netGasSalesVolume: oneLiner.oneLinerData.net_gas_sales_volume && oneLiner.oneLinerData.net_gas_sales_volume.value,
	netNglSalesVolume: oneLiner.oneLinerData.net_ngl_sales_volume && oneLiner.oneLinerData.net_ngl_sales_volume.value,
	netOilSalesVolume: oneLiner.oneLinerData.net_oil_sales_volume && oneLiner.oneLinerData.net_oil_sales_volume.value,
	netProfit: oneLiner.oneLinerData.net_profit && oneLiner.oneLinerData.net_profit.value,
	netIncome: oneLiner.oneLinerData.net_income && oneLiner.oneLinerData.net_income.value,
	netMcfeSalesVolume:
		oneLiner.oneLinerData.net_mcfe_sales_volume && oneLiner.oneLinerData.net_mcfe_sales_volume.value,
	nglGatheringExpense:
		oneLiner.oneLinerData.ngl_gathering_expense && oneLiner.oneLinerData.ngl_gathering_expense.value,
	nglMarketingExpense:
		oneLiner.oneLinerData.ngl_marketing_expense && oneLiner.oneLinerData.ngl_marketing_expense.value,
	nglOtherExpense: oneLiner.oneLinerData.ngl_other_expense && oneLiner.oneLinerData.ngl_other_expense.value,
	nglPrice: oneLiner.oneLinerData.ngl_price && oneLiner.oneLinerData.ngl_price.value,
	nglProcessingExpense:
		oneLiner.oneLinerData.ngl_processing_expense && oneLiner.oneLinerData.ngl_processing_expense.value,
	nglRevenue: oneLiner.oneLinerData.ngl_revenue && oneLiner.oneLinerData.ngl_revenue.value,
	nglSeveranceTax: oneLiner.oneLinerData.ngl_severance_tax && oneLiner.oneLinerData.ngl_severance_tax.value,
	nglShrunkEur: oneLiner.oneLinerData.ngl_shrunk_eur && oneLiner.oneLinerData.ngl_shrunk_eur.value,
	nglTransportationExpense:
		oneLiner.oneLinerData.ngl_transportation_expense && oneLiner.oneLinerData.ngl_transportation_expense.value,
	nglYield: oneLiner.oneLinerData.ngl_yield && oneLiner.oneLinerData.ngl_yield.value,
	nglBoeConversion: oneLiner.oneLinerData.ngl_boe_conversion && oneLiner.oneLinerData.ngl_boe_conversion.value,
	nglDifferentials1: oneLiner.oneLinerData.ngl_differentials_1 && oneLiner.oneLinerData.ngl_differentials_1.value,
	nglDifferentials2: oneLiner.oneLinerData.ngl_differentials_2 && oneLiner.oneLinerData.ngl_differentials_2.value,
	nglRisk: oneLiner.oneLinerData.ngl_risk && oneLiner.oneLinerData.ngl_risk.value,
	nglShrunkEurOverPll:
		oneLiner.oneLinerData.ngl_shrunk_eur_over_pll && oneLiner.oneLinerData.ngl_shrunk_eur_over_pll.value,
	nriDripCondensate: oneLiner.oneLinerData.nri_drip_condensate && oneLiner.oneLinerData.nri_drip_condensate.value,
	nriGas: oneLiner.oneLinerData.nri_gas && oneLiner.oneLinerData.nri_gas.value,
	nriNgl: oneLiner.oneLinerData.nri_ngl && oneLiner.oneLinerData.nri_ngl.value,
	nriOil: oneLiner.oneLinerData.nri_oil && oneLiner.oneLinerData.nri_oil.value,
	oilAssignedPSeriesFirstSegmentB:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_b &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_b.value,
	oilAssignedPSeriesFirstSegmentD1Nominal:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_d1_nominal.value,
	oilAssignedPSeriesFirstSegmentDiEffSec:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_di_eff_sec.value,
	oilAssignedPSeriesFirstSegmentEndDate:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_end_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_end_date.value,
	oilAssignedPSeriesFirstSegmentQEnd:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_q_end &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_q_end.value,
	oilAssignedPSeriesFirstSegmentQStart:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_q_start &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_q_start.value,
	oilAssignedPSeriesFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_realized_d_sw_eff_sec.value,
	oilAssignedPSeriesFirstSegmentSegmentType:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_segment_type &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_segment_type.value,
	oilAssignedPSeriesFirstSegmentStartDate:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_start_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_start_date.value,
	oilAssignedPSeriesFirstSegmentSwDate:
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_sw_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_first_segment_sw_date.value,
	oilAssignedPSeriesLastSegmentB:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_b &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_b.value,
	oilAssignedPSeriesLastSegmentD1Nominal:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_d1_nominal.value,
	oilAssignedPSeriesLastSegmentDiEffSec:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_di_eff_sec.value,
	oilAssignedPSeriesLastSegmentEndDate:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_end_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_end_date.value,
	oilAssignedPSeriesLastSegmentQEnd:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_q_end &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_q_end.value,
	oilAssignedPSeriesLastSegmentQStart:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_q_start &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_q_start.value,
	oilAssignedPSeriesLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_realized_d_sw_eff_sec.value,
	oilAssignedPSeriesLastSegmentSegmentType:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_segment_type &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_segment_type.value,
	oilAssignedPSeriesLastSegmentStartDate:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_start_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_start_date.value,
	oilAssignedPSeriesLastSegmentSwDate:
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_sw_date &&
		oneLiner.oneLinerData.oil_assigned_p_series_last_segment_sw_date.value,
	oilBestFitFirstSegmentB:
		oneLiner.oneLinerData.oil_best_fit_first_segment_b && oneLiner.oneLinerData.oil_best_fit_first_segment_b.value,
	oilBestFitFirstSegmentD1Nominal:
		oneLiner.oneLinerData.oil_best_fit_first_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_d1_nominal.value,
	oilBestFitFirstSegmentDiEffSec:
		oneLiner.oneLinerData.oil_best_fit_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_di_eff_sec.value,
	oilBestFitFirstSegmentEndDate:
		oneLiner.oneLinerData.oil_best_fit_first_segment_end_date &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_end_date.value,
	oilBestFitFirstSegmentQEnd:
		oneLiner.oneLinerData.oil_best_fit_first_segment_q_end &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_q_end.value,
	oilBestFitFirstSegmentQStart:
		oneLiner.oneLinerData.oil_best_fit_first_segment_q_start &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_q_start.value,
	oilBestFitFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_best_fit_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_realized_d_sw_eff_sec.value,
	oilBestFitFirstSegmentSegmentType:
		oneLiner.oneLinerData.oil_best_fit_first_segment_segment_type &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_segment_type.value,
	oilBestFitFirstSegmentStartDate:
		oneLiner.oneLinerData.oil_best_fit_first_segment_start_date &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_start_date.value,
	oilBestFitFirstSegmentSwDate:
		oneLiner.oneLinerData.oil_best_fit_first_segment_sw_date &&
		oneLiner.oneLinerData.oil_best_fit_first_segment_sw_date.value,
	oilBestFitLastSegmentB:
		oneLiner.oneLinerData.oil_best_fit_last_segment_b && oneLiner.oneLinerData.oil_best_fit_last_segment_b.value,
	oilBestFitLastSegmentD1Nominal:
		oneLiner.oneLinerData.oil_best_fit_last_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_d1_nominal.value,
	oilBestFitLastSegmentDiEffSec:
		oneLiner.oneLinerData.oil_best_fit_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_di_eff_sec.value,
	oilBestFitLastSegmentEndDate:
		oneLiner.oneLinerData.oil_best_fit_last_segment_end_date &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_end_date.value,
	oilBestFitLastSegmentQEnd:
		oneLiner.oneLinerData.oil_best_fit_last_segment_q_end &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_q_end.value,
	oilBestFitLastSegmentQStart:
		oneLiner.oneLinerData.oil_best_fit_last_segment_q_start &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_q_start.value,
	oilBestFitLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_best_fit_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_realized_d_sw_eff_sec.value,
	oilBestFitLastSegmentSegmentType:
		oneLiner.oneLinerData.oil_best_fit_last_segment_segment_type &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_segment_type.value,
	oilBestFitLastSegmentStartDate:
		oneLiner.oneLinerData.oil_best_fit_last_segment_start_date &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_start_date.value,
	oilBestFitLastSegmentSwDate:
		oneLiner.oneLinerData.oil_best_fit_last_segment_sw_date &&
		oneLiner.oneLinerData.oil_best_fit_last_segment_sw_date.value,
	oilBreakeven: oneLiner.oneLinerData.oil_breakeven && oneLiner.oneLinerData.oil_breakeven.value,
	oilGatheringExpense:
		oneLiner.oneLinerData.oil_gathering_expense && oneLiner.oneLinerData.oil_gathering_expense.value,
	oilLoss: oneLiner.oneLinerData.oil_loss && oneLiner.oneLinerData.oil_loss.value,
	oilMarketingExpense:
		oneLiner.oneLinerData.oil_marketing_expense && oneLiner.oneLinerData.oil_marketing_expense.value,
	oilOtherExpense: oneLiner.oneLinerData.oil_other_expense && oneLiner.oneLinerData.oil_other_expense.value,
	oilP10FirstSegmentB:
		oneLiner.oneLinerData.oil_p10_first_segment_b && oneLiner.oneLinerData.oil_p10_first_segment_b.value,
	oilP10FirstSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p10_first_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p10_first_segment_d1_nominal.value,
	oilP10FirstSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p10_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p10_first_segment_di_eff_sec.value,
	oilP10FirstSegmentEndDate:
		oneLiner.oneLinerData.oil_p10_first_segment_end_date &&
		oneLiner.oneLinerData.oil_p10_first_segment_end_date.value,
	oilP10FirstSegmentQEnd:
		oneLiner.oneLinerData.oil_p10_first_segment_q_end && oneLiner.oneLinerData.oil_p10_first_segment_q_end.value,
	oilP10FirstSegmentQStart:
		oneLiner.oneLinerData.oil_p10_first_segment_q_start &&
		oneLiner.oneLinerData.oil_p10_first_segment_q_start.value,
	oilP10FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p10_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p10_first_segment_realized_d_sw_eff_sec.value,
	oilP10FirstSegmentSegmentType:
		oneLiner.oneLinerData.oil_p10_first_segment_segment_type &&
		oneLiner.oneLinerData.oil_p10_first_segment_segment_type.value,
	oilP10FirstSegmentStartDate:
		oneLiner.oneLinerData.oil_p10_first_segment_start_date &&
		oneLiner.oneLinerData.oil_p10_first_segment_start_date.value,
	oilP10FirstSegmentSwDate:
		oneLiner.oneLinerData.oil_p10_first_segment_sw_date &&
		oneLiner.oneLinerData.oil_p10_first_segment_sw_date.value,
	oilP10LastSegmentB:
		oneLiner.oneLinerData.oil_p10_last_segment_b && oneLiner.oneLinerData.oil_p10_last_segment_b.value,
	oilP10LastSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p10_last_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p10_last_segment_d1_nominal.value,
	oilP10LastSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p10_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p10_last_segment_di_eff_sec.value,
	oilP10LastSegmentEndDate:
		oneLiner.oneLinerData.oil_p10_last_segment_end_date &&
		oneLiner.oneLinerData.oil_p10_last_segment_end_date.value,
	oilP10LastSegmentQEnd:
		oneLiner.oneLinerData.oil_p10_last_segment_q_end && oneLiner.oneLinerData.oil_p10_last_segment_q_end.value,
	oilP10LastSegmentQStart:
		oneLiner.oneLinerData.oil_p10_last_segment_q_start && oneLiner.oneLinerData.oil_p10_last_segment_q_start.value,
	oilP10LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p10_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p10_last_segment_realized_d_sw_eff_sec.value,
	oilP10LastSegmentSegmentType:
		oneLiner.oneLinerData.oil_p10_last_segment_segment_type &&
		oneLiner.oneLinerData.oil_p10_last_segment_segment_type.value,
	oilP10LastSegmentStartDate:
		oneLiner.oneLinerData.oil_p10_last_segment_start_date &&
		oneLiner.oneLinerData.oil_p10_last_segment_start_date.value,
	oilP10LastSegmentSwDate:
		oneLiner.oneLinerData.oil_p10_last_segment_sw_date && oneLiner.oneLinerData.oil_p10_last_segment_sw_date.value,
	oilP50FirstSegmentB:
		oneLiner.oneLinerData.oil_p50_first_segment_b && oneLiner.oneLinerData.oil_p50_first_segment_b.value,
	oilP50FirstSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p50_first_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p50_first_segment_d1_nominal.value,
	oilP50FirstSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p50_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p50_first_segment_di_eff_sec.value,
	oilP50FirstSegmentEndDate:
		oneLiner.oneLinerData.oil_p50_first_segment_end_date &&
		oneLiner.oneLinerData.oil_p50_first_segment_end_date.value,
	oilP50FirstSegmentQEnd:
		oneLiner.oneLinerData.oil_p50_first_segment_q_end && oneLiner.oneLinerData.oil_p50_first_segment_q_end.value,
	oilP50FirstSegmentQStart:
		oneLiner.oneLinerData.oil_p50_first_segment_q_start &&
		oneLiner.oneLinerData.oil_p50_first_segment_q_start.value,
	oilP50FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p50_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p50_first_segment_realized_d_sw_eff_sec.value,
	oilP50FirstSegmentSegmentType:
		oneLiner.oneLinerData.oil_p50_first_segment_segment_type &&
		oneLiner.oneLinerData.oil_p50_first_segment_segment_type.value,
	oilP50FirstSegmentStartDate:
		oneLiner.oneLinerData.oil_p50_first_segment_start_date &&
		oneLiner.oneLinerData.oil_p50_first_segment_start_date.value,
	oilP50FirstSegmentSwDate:
		oneLiner.oneLinerData.oil_p50_first_segment_sw_date &&
		oneLiner.oneLinerData.oil_p50_first_segment_sw_date.value,
	oilP50LastSegmentB:
		oneLiner.oneLinerData.oil_p50_last_segment_b && oneLiner.oneLinerData.oil_p50_last_segment_b.value,
	oilP50LastSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p50_last_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p50_last_segment_d1_nominal.value,
	oilP50LastSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p50_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p50_last_segment_di_eff_sec.value,
	oilP50LastSegmentEndDate:
		oneLiner.oneLinerData.oil_p50_last_segment_end_date &&
		oneLiner.oneLinerData.oil_p50_last_segment_end_date.value,
	oilP50LastSegmentQEnd:
		oneLiner.oneLinerData.oil_p50_last_segment_q_end && oneLiner.oneLinerData.oil_p50_last_segment_q_end.value,
	oilP50LastSegmentQStart:
		oneLiner.oneLinerData.oil_p50_last_segment_q_start && oneLiner.oneLinerData.oil_p50_last_segment_q_start.value,
	oilP50LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p50_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p50_last_segment_realized_d_sw_eff_sec.value,
	oilP50LastSegmentSegmentType:
		oneLiner.oneLinerData.oil_p50_last_segment_segment_type &&
		oneLiner.oneLinerData.oil_p50_last_segment_segment_type.value,
	oilP50LastSegmentStartDate:
		oneLiner.oneLinerData.oil_p50_last_segment_start_date &&
		oneLiner.oneLinerData.oil_p50_last_segment_start_date.value,
	oilP50LastSegmentSwDate:
		oneLiner.oneLinerData.oil_p50_last_segment_sw_date && oneLiner.oneLinerData.oil_p50_last_segment_sw_date.value,
	oilP90FirstSegmentB:
		oneLiner.oneLinerData.oil_p90_first_segment_b && oneLiner.oneLinerData.oil_p90_first_segment_b.value,
	oilP90FirstSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p90_first_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p90_first_segment_d1_nominal.value,
	oilP90FirstSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p90_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p90_first_segment_di_eff_sec.value,
	oilP90FirstSegmentEndDate:
		oneLiner.oneLinerData.oil_p90_first_segment_end_date &&
		oneLiner.oneLinerData.oil_p90_first_segment_end_date.value,
	oilP90FirstSegmentQEnd:
		oneLiner.oneLinerData.oil_p90_first_segment_q_end && oneLiner.oneLinerData.oil_p90_first_segment_q_end.value,
	oilP90FirstSegmentQStart:
		oneLiner.oneLinerData.oil_p90_first_segment_q_start &&
		oneLiner.oneLinerData.oil_p90_first_segment_q_start.value,
	oilP90FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p90_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p90_first_segment_realized_d_sw_eff_sec.value,
	oilP90FirstSegmentSegmentType:
		oneLiner.oneLinerData.oil_p90_first_segment_segment_type &&
		oneLiner.oneLinerData.oil_p90_first_segment_segment_type.value,
	oilP90FirstSegmentStartDate:
		oneLiner.oneLinerData.oil_p90_first_segment_start_date &&
		oneLiner.oneLinerData.oil_p90_first_segment_start_date.value,
	oilP90FirstSegmentSwDate:
		oneLiner.oneLinerData.oil_p90_first_segment_sw_date &&
		oneLiner.oneLinerData.oil_p90_first_segment_sw_date.value,
	oilP90LastSegmentB:
		oneLiner.oneLinerData.oil_p90_last_segment_b && oneLiner.oneLinerData.oil_p90_last_segment_b.value,
	oilP90LastSegmentD1Nominal:
		oneLiner.oneLinerData.oil_p90_last_segment_d1_nominal &&
		oneLiner.oneLinerData.oil_p90_last_segment_d1_nominal.value,
	oilP90LastSegmentDiEffSec:
		oneLiner.oneLinerData.oil_p90_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.oil_p90_last_segment_di_eff_sec.value,
	oilP90LastSegmentEndDate:
		oneLiner.oneLinerData.oil_p90_last_segment_end_date &&
		oneLiner.oneLinerData.oil_p90_last_segment_end_date.value,
	oilP90LastSegmentQEnd:
		oneLiner.oneLinerData.oil_p90_last_segment_q_end && oneLiner.oneLinerData.oil_p90_last_segment_q_end.value,
	oilP90LastSegmentQStart:
		oneLiner.oneLinerData.oil_p90_last_segment_q_start && oneLiner.oneLinerData.oil_p90_last_segment_q_start.value,
	oilP90LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.oil_p90_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.oil_p90_last_segment_realized_d_sw_eff_sec.value,
	oilP90LastSegmentSegmentType:
		oneLiner.oneLinerData.oil_p90_last_segment_segment_type &&
		oneLiner.oneLinerData.oil_p90_last_segment_segment_type.value,
	oilP90LastSegmentStartDate:
		oneLiner.oneLinerData.oil_p90_last_segment_start_date &&
		oneLiner.oneLinerData.oil_p90_last_segment_start_date.value,
	oilP90LastSegmentSwDate:
		oneLiner.oneLinerData.oil_p90_last_segment_sw_date && oneLiner.oneLinerData.oil_p90_last_segment_sw_date.value,
	oilPrice: oneLiner.oneLinerData.oil_price && oneLiner.oneLinerData.oil_price.value,
	oilProcessingExpense:
		oneLiner.oneLinerData.oil_processing_expense && oneLiner.oneLinerData.oil_processing_expense.value,
	oilRevenue: oneLiner.oneLinerData.oil_revenue && oneLiner.oneLinerData.oil_revenue.value,
	oilSeveranceTax: oneLiner.oneLinerData.oil_severance_tax && oneLiner.oneLinerData.oil_severance_tax.value,
	oilShrinkage: oneLiner.oneLinerData.oil_shrinkage && oneLiner.oneLinerData.oil_shrinkage.value,
	oilShrunkEur: oneLiner.oneLinerData.oil_shrunk_eur && oneLiner.oneLinerData.oil_shrunk_eur.value,
	oilTransportationExpense:
		oneLiner.oneLinerData.oil_transportation_expense && oneLiner.oneLinerData.oil_transportation_expense.value,
	oilWellHeadEur: oneLiner.oneLinerData.oil_well_head_eur && oneLiner.oneLinerData.oil_well_head_eur.value,
	oilBoeConversion: oneLiner.oneLinerData.oil_boe_conversion && oneLiner.oneLinerData.oil_boe_conversion.value,
	oilDifferentials1: oneLiner.oneLinerData.oil_differentials_1 && oneLiner.oneLinerData.oil_differentials_1.value,
	oilDifferentials2: oneLiner.oneLinerData.oil_differentials_2 && oneLiner.oneLinerData.oil_differentials_2.value,
	oilProductionAsOfDate:
		oneLiner.oneLinerData.oil_production_as_of_date && oneLiner.oneLinerData.oil_production_as_of_date.value,
	oilRisk: oneLiner.oneLinerData.oil_risk && oneLiner.oneLinerData.oil_risk.value,
	oilShrunkEurOverPll:
		oneLiner.oneLinerData.oil_shrunk_eur_over_pll && oneLiner.oneLinerData.oil_shrunk_eur_over_pll.value,
	oilTcRisk: oneLiner.oneLinerData.oil_tc_risk && oneLiner.oneLinerData.oil_tc_risk.value,
	oilWellHeadEurOverPll:
		oneLiner.oneLinerData.oil_well_head_eur_over_pll && oneLiner.oneLinerData.oil_well_head_eur_over_pll.value,
	oneMonthGrossBoeSalesVolume:
		oneLiner.oneLinerData.one_month_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.one_month_gross_BOE_sales_volume.value,
	oneMonthGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.one_month_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.one_month_gross_BOE_well_head_volume.value,
	oneMonthGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_month_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_month_gross_drip_condensate_sales_volume.value,
	oneMonthGrossGasSalesVolume:
		oneLiner.oneLinerData.one_month_gross_gas_sales_volume &&
		oneLiner.oneLinerData.one_month_gross_gas_sales_volume.value,
	oneMonthGrossGasWellHeadVolume:
		oneLiner.oneLinerData.one_month_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.one_month_gross_gas_well_head_volume.value,
	oneMonthGrossNglSalesVolume:
		oneLiner.oneLinerData.one_month_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.one_month_gross_ngl_sales_volume.value,
	oneMonthGrossOilSalesVolume:
		oneLiner.oneLinerData.one_month_gross_oil_sales_volume &&
		oneLiner.oneLinerData.one_month_gross_oil_sales_volume.value,
	oneMonthGrossOilWellHeadVolume:
		oneLiner.oneLinerData.one_month_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.one_month_gross_oil_well_head_volume.value,
	oneMonthGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.one_month_gross_water_well_head_volume &&
		oneLiner.oneLinerData.one_month_gross_water_well_head_volume.value,
	oneMonthNetBoeSalesVolume:
		oneLiner.oneLinerData.one_month_net_BOE_sales_volume &&
		oneLiner.oneLinerData.one_month_net_BOE_sales_volume.value,
	oneMonthNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_month_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_month_net_drip_condensate_sales_volume.value,
	oneMonthNetGasSalesVolume:
		oneLiner.oneLinerData.one_month_net_gas_sales_volume &&
		oneLiner.oneLinerData.one_month_net_gas_sales_volume.value,
	oneMonthNetNglSalesVolume:
		oneLiner.oneLinerData.one_month_net_ngl_sales_volume &&
		oneLiner.oneLinerData.one_month_net_ngl_sales_volume.value,
	oneMonthNetOilSalesVolume:
		oneLiner.oneLinerData.one_month_net_oil_sales_volume &&
		oneLiner.oneLinerData.one_month_net_oil_sales_volume.value,
	oneMonthWiBoeSalesVolume:
		oneLiner.oneLinerData.one_month_wi_BOE_sales_volume &&
		oneLiner.oneLinerData.one_month_wi_BOE_sales_volume.value,
	oneMonthWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_month_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_month_wi_drip_condensate_sales_volume.value,
	oneMonthWiGasSalesVolume:
		oneLiner.oneLinerData.one_month_wi_gas_sales_volume &&
		oneLiner.oneLinerData.one_month_wi_gas_sales_volume.value,
	oneMonthWiNglSalesVolume:
		oneLiner.oneLinerData.one_month_wi_ngl_sales_volume &&
		oneLiner.oneLinerData.one_month_wi_ngl_sales_volume.value,
	oneMonthWiOilSalesVolume:
		oneLiner.oneLinerData.one_month_wi_oil_sales_volume &&
		oneLiner.oneLinerData.one_month_wi_oil_sales_volume.value,
	oneYearGrossBoeSalesVolume:
		oneLiner.oneLinerData.one_year_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.one_year_gross_BOE_sales_volume.value,
	oneYearGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.one_year_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.one_year_gross_BOE_well_head_volume.value,
	oneYearGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_year_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_year_gross_drip_condensate_sales_volume.value,
	oneYearGrossGasSalesVolume:
		oneLiner.oneLinerData.one_year_gross_gas_sales_volume &&
		oneLiner.oneLinerData.one_year_gross_gas_sales_volume.value,
	oneYearGrossGasWellHeadVolume:
		oneLiner.oneLinerData.one_year_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.one_year_gross_gas_well_head_volume.value,
	oneYearGrossNglSalesVolume:
		oneLiner.oneLinerData.one_year_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.one_year_gross_ngl_sales_volume.value,
	oneYearGrossOilSalesVolume:
		oneLiner.oneLinerData.one_year_gross_oil_sales_volume &&
		oneLiner.oneLinerData.one_year_gross_oil_sales_volume.value,
	oneYearGrossOilWellHeadVolume:
		oneLiner.oneLinerData.one_year_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.one_year_gross_oil_well_head_volume.value,
	oneYearGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.one_year_gross_water_well_head_volume &&
		oneLiner.oneLinerData.one_year_gross_water_well_head_volume.value,
	oneYearNetBoeSalesVolume:
		oneLiner.oneLinerData.one_year_net_BOE_sales_volume &&
		oneLiner.oneLinerData.one_year_net_BOE_sales_volume.value,
	oneYearNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_year_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_year_net_drip_condensate_sales_volume.value,
	oneYearNetGasSalesVolume:
		oneLiner.oneLinerData.one_year_net_gas_sales_volume &&
		oneLiner.oneLinerData.one_year_net_gas_sales_volume.value,
	oneYearNetNglSalesVolume:
		oneLiner.oneLinerData.one_year_net_ngl_sales_volume &&
		oneLiner.oneLinerData.one_year_net_ngl_sales_volume.value,
	oneYearNetOilSalesVolume:
		oneLiner.oneLinerData.one_year_net_oil_sales_volume &&
		oneLiner.oneLinerData.one_year_net_oil_sales_volume.value,
	oneYearWiBoeSalesVolume:
		oneLiner.oneLinerData.one_year_wi_BOE_sales_volume && oneLiner.oneLinerData.one_year_wi_BOE_sales_volume.value,
	oneYearWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.one_year_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.one_year_wi_drip_condensate_sales_volume.value,
	oneYearWiGasSalesVolume:
		oneLiner.oneLinerData.one_year_wi_gas_sales_volume && oneLiner.oneLinerData.one_year_wi_gas_sales_volume.value,
	oneYearWiNglSalesVolume:
		oneLiner.oneLinerData.one_year_wi_ngl_sales_volume && oneLiner.oneLinerData.one_year_wi_ngl_sales_volume.value,
	oneYearWiOilSalesVolume:
		oneLiner.oneLinerData.one_year_wi_oil_sales_volume && oneLiner.oneLinerData.one_year_wi_oil_sales_volume.value,
	originalWiDripCondensate:
		oneLiner.oneLinerData.original_wi_drip_condensate && oneLiner.oneLinerData.original_wi_drip_condensate.value,
	originalWiGas: oneLiner.oneLinerData.original_wi_gas && oneLiner.oneLinerData.original_wi_gas.value,
	originalWiNgl: oneLiner.oneLinerData.original_wi_ngl && oneLiner.oneLinerData.original_wi_ngl.value,
	originalWiOil: oneLiner.oneLinerData.original_wi_oil && oneLiner.oneLinerData.original_wi_oil.value,
	otherMonthlyCost_1: oneLiner.oneLinerData.other_monthly_cost_1 && oneLiner.oneLinerData.other_monthly_cost_1.value,
	otherMonthlyCost_2: oneLiner.oneLinerData.other_monthly_cost_2 && oneLiner.oneLinerData.other_monthly_cost_2.value,
	payoutDuration: oneLiner.oneLinerData.payout_duration && oneLiner.oneLinerData.payout_duration.value,
	secondDiscountCashFlow:
		oneLiner.oneLinerData.second_discount_cash_flow && oneLiner.oneLinerData.second_discount_cash_flow.value,
	secondDiscountRoi: oneLiner.oneLinerData.second_discount_roi && oneLiner.oneLinerData.second_discount_roi.value,
	secondDiscountNetIncome:
		oneLiner.oneLinerData.second_discount_net_income && oneLiner.oneLinerData.second_discount_net_income.value,
	secondDiscountPayout:
		oneLiner.oneLinerData.second_discount_payout && oneLiner.oneLinerData.second_discount_payout.value,
	secondDiscountPayoutDuration:
		oneLiner.oneLinerData.second_discount_payout_duration &&
		oneLiner.oneLinerData.second_discount_payout_duration.value,
	secondDiscountRoiUndiscountedCapex:
		oneLiner.oneLinerData.second_discount_roi_undiscounted_capex &&
		oneLiner.oneLinerData.second_discount_roi_undiscounted_capex.value,
	secondDiscountedCapex:
		oneLiner.oneLinerData.second_discounted_capex && oneLiner.oneLinerData.second_discounted_capex.value,
	shrunkGasBtu: oneLiner.oneLinerData.shrunk_gas_btu && oneLiner.oneLinerData.shrunk_gas_btu.value,
	sixMonthGrossBoeSalesVolume:
		oneLiner.oneLinerData.six_month_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.six_month_gross_BOE_sales_volume.value,
	sixMonthGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.six_month_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.six_month_gross_BOE_well_head_volume.value,
	sixMonthGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.six_month_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.six_month_gross_drip_condensate_sales_volume.value,
	sixMonthGrossGasSalesVolume:
		oneLiner.oneLinerData.six_month_gross_gas_sales_volume &&
		oneLiner.oneLinerData.six_month_gross_gas_sales_volume.value,
	sixMonthGrossGasWellHeadVolume:
		oneLiner.oneLinerData.six_month_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.six_month_gross_gas_well_head_volume.value,
	sixMonthGrossNglSalesVolume:
		oneLiner.oneLinerData.six_month_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.six_month_gross_ngl_sales_volume.value,
	sixMonthGrossOilSalesVolume:
		oneLiner.oneLinerData.six_month_gross_oil_sales_volume &&
		oneLiner.oneLinerData.six_month_gross_oil_sales_volume.value,
	sixMonthGrossOilWellHeadVolume:
		oneLiner.oneLinerData.six_month_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.six_month_gross_oil_well_head_volume.value,
	sixMonthGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.six_month_gross_water_well_head_volume &&
		oneLiner.oneLinerData.six_month_gross_water_well_head_volume.value,
	sixMonthNetBoeSalesVolume:
		oneLiner.oneLinerData.six_month_net_BOE_sales_volume &&
		oneLiner.oneLinerData.six_month_net_BOE_sales_volume.value,
	sixMonthNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.six_month_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.six_month_net_drip_condensate_sales_volume.value,
	sixMonthNetGasSalesVolume:
		oneLiner.oneLinerData.six_month_net_gas_sales_volume &&
		oneLiner.oneLinerData.six_month_net_gas_sales_volume.value,
	sixMonthNetNglSalesVolume:
		oneLiner.oneLinerData.six_month_net_ngl_sales_volume &&
		oneLiner.oneLinerData.six_month_net_ngl_sales_volume.value,
	sixMonthNetOilSalesVolume:
		oneLiner.oneLinerData.six_month_net_oil_sales_volume &&
		oneLiner.oneLinerData.six_month_net_oil_sales_volume.value,
	sixMonthWiBoeSalesVolume:
		oneLiner.oneLinerData.six_month_wi_BOE_sales_volume &&
		oneLiner.oneLinerData.six_month_wi_BOE_sales_volume.value,
	sixMonthWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.six_month_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.six_month_wi_drip_condensate_sales_volume.value,
	sixMonthWiGasSalesVolume:
		oneLiner.oneLinerData.six_month_wi_gas_sales_volume &&
		oneLiner.oneLinerData.six_month_wi_gas_sales_volume.value,
	sixMonthWiNglSalesVolume:
		oneLiner.oneLinerData.six_month_wi_ngl_sales_volume &&
		oneLiner.oneLinerData.six_month_wi_ngl_sales_volume.value,
	sixMonthWiOilSalesVolume:
		oneLiner.oneLinerData.six_month_wi_oil_sales_volume &&
		oneLiner.oneLinerData.six_month_wi_oil_sales_volume.value,
	stateIncomeTax: oneLiner.oneLinerData.state_income_tax && oneLiner.oneLinerData.state_income_tax.value,
	tangibleAbandonment: oneLiner.oneLinerData.tangible_abandonment && oneLiner.oneLinerData.tangible_abandonment.value,
	tangibleAppraisal: oneLiner.oneLinerData.tangible_appraisal && oneLiner.oneLinerData.tangible_appraisal.value,
	tangibleArtificialLift:
		oneLiner.oneLinerData.tangible_artificial_lift && oneLiner.oneLinerData.tangible_artificial_lift.value,
	tangibleCompletion: oneLiner.oneLinerData.tangible_completion && oneLiner.oneLinerData.tangible_completion.value,
	tangibleDevelopment: oneLiner.oneLinerData.tangible_development && oneLiner.oneLinerData.tangible_development.value,
	tangibleDrilling: oneLiner.oneLinerData.tangible_drilling && oneLiner.oneLinerData.tangible_drilling.value,
	tangibleExploration: oneLiner.oneLinerData.tangible_exploration && oneLiner.oneLinerData.tangible_exploration.value,
	tangibleFacilities: oneLiner.oneLinerData.tangible_facilities && oneLiner.oneLinerData.tangible_facilities.value,
	tangibleLeasehold: oneLiner.oneLinerData.tangible_leasehold && oneLiner.oneLinerData.tangible_leasehold.value,
	tangibleLegal: oneLiner.oneLinerData.tangible_legal && oneLiner.oneLinerData.tangible_legal.value,
	tangibleOtherInvestment:
		oneLiner.oneLinerData.tangible_other_investment && oneLiner.oneLinerData.tangible_other_investment.value,
	tangiblePad: oneLiner.oneLinerData.tangible_pad && oneLiner.oneLinerData.tangible_pad.value,
	tangiblePipelines: oneLiner.oneLinerData.tangible_pipelines && oneLiner.oneLinerData.tangible_pipelines.value,
	tangibleSalvage: oneLiner.oneLinerData.tangible_salvage && oneLiner.oneLinerData.tangible_salvage.value,
	tangibleWaterline: oneLiner.oneLinerData.tangible_waterline && oneLiner.oneLinerData.tangible_waterline.value,
	tangibleWorkover: oneLiner.oneLinerData.tangible_workover && oneLiner.oneLinerData.tangible_workover.value,
	taxableIncome: oneLiner.oneLinerData.taxable_income && oneLiner.oneLinerData.taxable_income.value,
	tenYearGrossBoeSalesVolume:
		oneLiner.oneLinerData.ten_year_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.ten_year_gross_BOE_sales_volume.value,
	tenYearGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.ten_year_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.ten_year_gross_BOE_well_head_volume.value,
	tenYearGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.ten_year_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.ten_year_gross_drip_condensate_sales_volume.value,
	tenYearGrossGasSalesVolume:
		oneLiner.oneLinerData.ten_year_gross_gas_sales_volume &&
		oneLiner.oneLinerData.ten_year_gross_gas_sales_volume.value,
	tenYearGrossGasWellHeadVolume:
		oneLiner.oneLinerData.ten_year_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.ten_year_gross_gas_well_head_volume.value,
	tenYearGrossNglSalesVolume:
		oneLiner.oneLinerData.ten_year_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.ten_year_gross_ngl_sales_volume.value,
	tenYearGrossOilSalesVolume:
		oneLiner.oneLinerData.ten_year_gross_oil_sales_volume &&
		oneLiner.oneLinerData.ten_year_gross_oil_sales_volume.value,
	tenYearGrossOilWellHeadVolume:
		oneLiner.oneLinerData.ten_year_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.ten_year_gross_oil_well_head_volume.value,
	tenYearGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.ten_year_gross_water_well_head_volume &&
		oneLiner.oneLinerData.ten_year_gross_water_well_head_volume.value,
	tenYearNetBoeSalesVolume:
		oneLiner.oneLinerData.ten_year_net_BOE_sales_volume &&
		oneLiner.oneLinerData.ten_year_net_BOE_sales_volume.value,
	tenYearNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.ten_year_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.ten_year_net_drip_condensate_sales_volume.value,
	tenYearNetGasSalesVolume:
		oneLiner.oneLinerData.ten_year_net_gas_sales_volume &&
		oneLiner.oneLinerData.ten_year_net_gas_sales_volume.value,
	tenYearNetNglSalesVolume:
		oneLiner.oneLinerData.ten_year_net_ngl_sales_volume &&
		oneLiner.oneLinerData.ten_year_net_ngl_sales_volume.value,
	tenYearNetOilSalesVolume:
		oneLiner.oneLinerData.ten_year_net_oil_sales_volume &&
		oneLiner.oneLinerData.ten_year_net_oil_sales_volume.value,
	tenYearWiBoeSalesVolume:
		oneLiner.oneLinerData.ten_year_wi_BOE_sales_volume && oneLiner.oneLinerData.ten_year_wi_BOE_sales_volume.value,
	tenYearWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.ten_year_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.ten_year_wi_drip_condensate_sales_volume.value,
	tenYearWiGasSalesVolume:
		oneLiner.oneLinerData.ten_year_wi_gas_sales_volume && oneLiner.oneLinerData.ten_year_wi_gas_sales_volume.value,
	tenYearWiNglSalesVolume:
		oneLiner.oneLinerData.ten_year_wi_ngl_sales_volume && oneLiner.oneLinerData.ten_year_wi_ngl_sales_volume.value,
	tenYearWiOilSalesVolume:
		oneLiner.oneLinerData.ten_year_wi_oil_sales_volume && oneLiner.oneLinerData.ten_year_wi_oil_sales_volume.value,
	threeMonthGrossBoeSalesVolume:
		oneLiner.oneLinerData.three_month_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.three_month_gross_BOE_sales_volume.value,
	threeMonthGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.three_month_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.three_month_gross_BOE_well_head_volume.value,
	threeMonthGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_month_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_month_gross_drip_condensate_sales_volume.value,
	threeMonthGrossGasSalesVolume:
		oneLiner.oneLinerData.three_month_gross_gas_sales_volume &&
		oneLiner.oneLinerData.three_month_gross_gas_sales_volume.value,
	threeMonthGrossGasWellHeadVolume:
		oneLiner.oneLinerData.three_month_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.three_month_gross_gas_well_head_volume.value,
	threeMonthGrossNglSalesVolume:
		oneLiner.oneLinerData.three_month_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.three_month_gross_ngl_sales_volume.value,
	threeMonthGrossOilSalesVolume:
		oneLiner.oneLinerData.three_month_gross_oil_sales_volume &&
		oneLiner.oneLinerData.three_month_gross_oil_sales_volume.value,
	threeMonthGrossOilWellHeadVolume:
		oneLiner.oneLinerData.three_month_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.three_month_gross_oil_well_head_volume.value,
	threeMonthGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.three_month_gross_water_well_head_volume &&
		oneLiner.oneLinerData.three_month_gross_water_well_head_volume.value,
	threeMonthNetBoeSalesVolume:
		oneLiner.oneLinerData.three_month_net_BOE_sales_volume &&
		oneLiner.oneLinerData.three_month_net_BOE_sales_volume.value,
	threeMonthNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_month_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_month_net_drip_condensate_sales_volume.value,
	threeMonthNetGasSalesVolume:
		oneLiner.oneLinerData.three_month_net_gas_sales_volume &&
		oneLiner.oneLinerData.three_month_net_gas_sales_volume.value,
	threeMonthNetNglSalesVolume:
		oneLiner.oneLinerData.three_month_net_ngl_sales_volume &&
		oneLiner.oneLinerData.three_month_net_ngl_sales_volume.value,
	threeMonthNetOilSalesVolume:
		oneLiner.oneLinerData.three_month_net_oil_sales_volume &&
		oneLiner.oneLinerData.three_month_net_oil_sales_volume.value,
	threeMonthWiBoeSalesVolume:
		oneLiner.oneLinerData.three_month_wi_BOE_sales_volume &&
		oneLiner.oneLinerData.three_month_wi_BOE_sales_volume.value,
	threeMonthWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_month_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_month_wi_drip_condensate_sales_volume.value,
	threeMonthWiGasSalesVolume:
		oneLiner.oneLinerData.three_month_wi_gas_sales_volume &&
		oneLiner.oneLinerData.three_month_wi_gas_sales_volume.value,
	threeMonthWiNglSalesVolume:
		oneLiner.oneLinerData.three_month_wi_ngl_sales_volume &&
		oneLiner.oneLinerData.three_month_wi_ngl_sales_volume.value,
	threeMonthWiOilSalesVolume:
		oneLiner.oneLinerData.three_month_wi_oil_sales_volume &&
		oneLiner.oneLinerData.three_month_wi_oil_sales_volume.value,
	threeYearGrossBoeSalesVolume:
		oneLiner.oneLinerData.three_year_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.three_year_gross_BOE_sales_volume.value,
	threeYearGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.three_year_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.three_year_gross_BOE_well_head_volume.value,
	threeYearGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_year_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_year_gross_drip_condensate_sales_volume.value,
	threeYearGrossGasSalesVolume:
		oneLiner.oneLinerData.three_year_gross_gas_sales_volume &&
		oneLiner.oneLinerData.three_year_gross_gas_sales_volume.value,
	threeYearGrossGasWellHeadVolume:
		oneLiner.oneLinerData.three_year_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.three_year_gross_gas_well_head_volume.value,
	threeYearGrossNglSalesVolume:
		oneLiner.oneLinerData.three_year_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.three_year_gross_ngl_sales_volume.value,
	threeYearGrossOilSalesVolume:
		oneLiner.oneLinerData.three_year_gross_oil_sales_volume &&
		oneLiner.oneLinerData.three_year_gross_oil_sales_volume.value,
	threeYearGrossOilWellHeadVolume:
		oneLiner.oneLinerData.three_year_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.three_year_gross_oil_well_head_volume.value,
	threeYearGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.three_year_gross_water_well_head_volume &&
		oneLiner.oneLinerData.three_year_gross_water_well_head_volume.value,
	threeYearNetBoeSalesVolume:
		oneLiner.oneLinerData.three_year_net_BOE_sales_volume &&
		oneLiner.oneLinerData.three_year_net_BOE_sales_volume.value,
	threeYearNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_year_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_year_net_drip_condensate_sales_volume.value,
	threeYearNetGasSalesVolume:
		oneLiner.oneLinerData.three_year_net_gas_sales_volume &&
		oneLiner.oneLinerData.three_year_net_gas_sales_volume.value,
	threeYearNetNglSalesVolume:
		oneLiner.oneLinerData.three_year_net_ngl_sales_volume &&
		oneLiner.oneLinerData.three_year_net_ngl_sales_volume.value,
	threeYearNetOilSalesVolume:
		oneLiner.oneLinerData.three_year_net_oil_sales_volume &&
		oneLiner.oneLinerData.three_year_net_oil_sales_volume.value,
	threeYearWiBoeSalesVolume:
		oneLiner.oneLinerData.three_year_wi_BOE_sales_volume &&
		oneLiner.oneLinerData.three_year_wi_BOE_sales_volume.value,
	threeYearWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.three_year_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.three_year_wi_drip_condensate_sales_volume.value,
	threeYearWiGasSalesVolume:
		oneLiner.oneLinerData.three_year_wi_gas_sales_volume &&
		oneLiner.oneLinerData.three_year_wi_gas_sales_volume.value,
	threeYearWiNglSalesVolume:
		oneLiner.oneLinerData.three_year_wi_ngl_sales_volume &&
		oneLiner.oneLinerData.three_year_wi_ngl_sales_volume.value,
	threeYearWiOilSalesVolume:
		oneLiner.oneLinerData.three_year_wi_oil_sales_volume &&
		oneLiner.oneLinerData.three_year_wi_oil_sales_volume.value,
	totalAbandonment: oneLiner.oneLinerData.total_abandonment && oneLiner.oneLinerData.total_abandonment.value,
	totalAppraisal: oneLiner.oneLinerData.total_appraisal && oneLiner.oneLinerData.total_appraisal.value,
	totalArtificialLift:
		oneLiner.oneLinerData.total_artificial_lift && oneLiner.oneLinerData.total_artificial_lift.value,
	totalCapex: oneLiner.oneLinerData.total_capex && oneLiner.oneLinerData.total_capex.value,
	totalCompletion: oneLiner.oneLinerData.total_completion && oneLiner.oneLinerData.total_completion.value,
	totalDevelopment: oneLiner.oneLinerData.total_development && oneLiner.oneLinerData.total_development.value,
	totalDrilling: oneLiner.oneLinerData.total_drilling && oneLiner.oneLinerData.total_drilling.value,
	totalDripCondensateVariableExpense:
		oneLiner.oneLinerData.total_drip_condensate_variable_expense &&
		oneLiner.oneLinerData.total_drip_condensate_variable_expense.value,
	totalExpense: oneLiner.oneLinerData.total_expense && oneLiner.oneLinerData.total_expense.value,
	totalExploration: oneLiner.oneLinerData.total_exploration && oneLiner.oneLinerData.total_exploration.value,
	totalFacilities: oneLiner.oneLinerData.total_facilities && oneLiner.oneLinerData.total_facilities.value,
	totalFixedExpense: oneLiner.oneLinerData.total_fixed_expense && oneLiner.oneLinerData.total_fixed_expense.value,
	totalGasVariableExpense:
		oneLiner.oneLinerData.total_gas_variable_expense && oneLiner.oneLinerData.total_gas_variable_expense.value,
	totalIntangibleCapex:
		oneLiner.oneLinerData.total_intangible_capex && oneLiner.oneLinerData.total_intangible_capex.value,
	totalLeasehold: oneLiner.oneLinerData.total_leasehold && oneLiner.oneLinerData.total_leasehold.value,
	totalLegal: oneLiner.oneLinerData.total_legal && oneLiner.oneLinerData.total_legal.value,
	totalNegativeCashFlowMonthCount:
		oneLiner.oneLinerData.total_negative_cash_flow_month_count &&
		oneLiner.oneLinerData.total_negative_cash_flow_month_count.value,
	totalNglVariableExpense:
		oneLiner.oneLinerData.total_ngl_variable_expense && oneLiner.oneLinerData.total_ngl_variable_expense.value,
	totalOilVariableExpense:
		oneLiner.oneLinerData.total_oil_variable_expense && oneLiner.oneLinerData.total_oil_variable_expense.value,
	totalOtherInvestment:
		oneLiner.oneLinerData.total_other_investment && oneLiner.oneLinerData.total_other_investment.value,
	totalPad: oneLiner.oneLinerData.total_pad && oneLiner.oneLinerData.total_pad.value,
	totalPipelines: oneLiner.oneLinerData.total_pipelines && oneLiner.oneLinerData.total_pipelines.value,
	totalProductionTax: oneLiner.oneLinerData.total_production_tax && oneLiner.oneLinerData.total_production_tax.value,
	totalRevenue: oneLiner.oneLinerData.total_revenue && oneLiner.oneLinerData.total_revenue.value,
	totalSalvage: oneLiner.oneLinerData.total_salvage && oneLiner.oneLinerData.total_salvage.value,
	totalSeveranceTax: oneLiner.oneLinerData.total_severance_tax && oneLiner.oneLinerData.total_severance_tax.value,
	totalTangibleCapex: oneLiner.oneLinerData.total_tangible_capex && oneLiner.oneLinerData.total_tangible_capex.value,
	totalVariableExpense:
		oneLiner.oneLinerData.total_variable_expense && oneLiner.oneLinerData.total_variable_expense.value,
	totalWaterline: oneLiner.oneLinerData.total_waterline && oneLiner.oneLinerData.total_waterline.value,
	totalWorkover: oneLiner.oneLinerData.total_workover && oneLiner.oneLinerData.total_workover.value,
	totalGrossCapex: oneLiner.oneLinerData.total_gross_capex && oneLiner.oneLinerData.total_gross_capex.value,
	twoYearGrossBoeSalesVolume:
		oneLiner.oneLinerData.two_year_gross_BOE_sales_volume &&
		oneLiner.oneLinerData.two_year_gross_BOE_sales_volume.value,
	twoYearGrossBoeWellHeadVolume:
		oneLiner.oneLinerData.two_year_gross_BOE_well_head_volume &&
		oneLiner.oneLinerData.two_year_gross_BOE_well_head_volume.value,
	twoYearGrossDripCondensateSalesVolume:
		oneLiner.oneLinerData.two_year_gross_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.two_year_gross_drip_condensate_sales_volume.value,
	twoYearGrossGasSalesVolume:
		oneLiner.oneLinerData.two_year_gross_gas_sales_volume &&
		oneLiner.oneLinerData.two_year_gross_gas_sales_volume.value,
	twoYearGrossGasWellHeadVolume:
		oneLiner.oneLinerData.two_year_gross_gas_well_head_volume &&
		oneLiner.oneLinerData.two_year_gross_gas_well_head_volume.value,
	twoYearGrossNglSalesVolume:
		oneLiner.oneLinerData.two_year_gross_ngl_sales_volume &&
		oneLiner.oneLinerData.two_year_gross_ngl_sales_volume.value,
	twoYearGrossOilSalesVolume:
		oneLiner.oneLinerData.two_year_gross_oil_sales_volume &&
		oneLiner.oneLinerData.two_year_gross_oil_sales_volume.value,
	twoYearGrossOilWellHeadVolume:
		oneLiner.oneLinerData.two_year_gross_oil_well_head_volume &&
		oneLiner.oneLinerData.two_year_gross_oil_well_head_volume.value,
	twoYearGrossWaterWellHeadVolume:
		oneLiner.oneLinerData.two_year_gross_water_well_head_volume &&
		oneLiner.oneLinerData.two_year_gross_water_well_head_volume.value,
	twoYearNetBoeSalesVolume:
		oneLiner.oneLinerData.two_year_net_BOE_sales_volume &&
		oneLiner.oneLinerData.two_year_net_BOE_sales_volume.value,
	twoYearNetDripCondensateSalesVolume:
		oneLiner.oneLinerData.two_year_net_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.two_year_net_drip_condensate_sales_volume.value,
	twoYearNetGasSalesVolume:
		oneLiner.oneLinerData.two_year_net_gas_sales_volume &&
		oneLiner.oneLinerData.two_year_net_gas_sales_volume.value,
	twoYearNetNglSalesVolume:
		oneLiner.oneLinerData.two_year_net_ngl_sales_volume &&
		oneLiner.oneLinerData.two_year_net_ngl_sales_volume.value,
	twoYearNetOilSalesVolume:
		oneLiner.oneLinerData.two_year_net_oil_sales_volume &&
		oneLiner.oneLinerData.two_year_net_oil_sales_volume.value,
	twoYearWiBoeSalesVolume:
		oneLiner.oneLinerData.two_year_wi_BOE_sales_volume && oneLiner.oneLinerData.two_year_wi_BOE_sales_volume.value,
	twoYearWiDripCondensateSalesVolume:
		oneLiner.oneLinerData.two_year_wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.two_year_wi_drip_condensate_sales_volume.value,
	twoYearWiGasSalesVolume:
		oneLiner.oneLinerData.two_year_wi_gas_sales_volume && oneLiner.oneLinerData.two_year_wi_gas_sales_volume.value,
	twoYearWiNglSalesVolume:
		oneLiner.oneLinerData.two_year_wi_ngl_sales_volume && oneLiner.oneLinerData.two_year_wi_ngl_sales_volume.value,
	twoYearWiOilSalesVolume:
		oneLiner.oneLinerData.two_year_wi_oil_sales_volume && oneLiner.oneLinerData.two_year_wi_oil_sales_volume.value,
	undiscountedPayout: oneLiner.oneLinerData.undiscounted_payout && oneLiner.oneLinerData.undiscounted_payout.value,
	undiscountedRoi: oneLiner.oneLinerData.undiscounted_roi && oneLiner.oneLinerData.undiscounted_roi.value,
	unshrunkGasBtu: oneLiner.oneLinerData.unshrunk_gas_btu && oneLiner.oneLinerData.unshrunk_gas_btu.value,
	waterAssignedPSeriesFirstSegmentB:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_b &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_b.value,
	waterAssignedPSeriesFirstSegmentD1Nominal:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_d1_nominal &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_d1_nominal.value,
	waterAssignedPSeriesFirstSegmentDiEffSec:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_di_eff_sec.value,
	waterAssignedPSeriesFirstSegmentEndDate:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_end_date &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_end_date.value,
	waterAssignedPSeriesFirstSegmentQEnd:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_q_end &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_q_end.value,
	waterAssignedPSeriesFirstSegmentQStart:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_q_start &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_q_start.value,
	waterAssignedPSeriesFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_realized_d_sw_eff_sec.value,
	waterAssignedPSeriesFirstSegmentSegmentType:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_segment_type &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_segment_type.value,
	waterAssignedPSeriesFirstSegmentStartDate:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_start_date &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_start_date.value,
	waterAssignedPSeriesFirstSegmentSwDate:
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_sw_date &&
		oneLiner.oneLinerData.water_assigned_p_series_first_segment_sw_date.value,
	waterAssignedPSeriesLastSegmentB:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_b &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_b.value,
	waterAssignedPSeriesLastSegmentD1Nominal:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_d1_nominal &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_d1_nominal.value,
	waterAssignedPSeriesLastSegmentDiEffSec:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_di_eff_sec.value,
	waterAssignedPSeriesLastSegmentEndDate:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_end_date &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_end_date.value,
	waterAssignedPSeriesLastSegmentQEnd:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_q_end &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_q_end.value,
	waterAssignedPSeriesLastSegmentQStart:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_q_start &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_q_start.value,
	waterAssignedPSeriesLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_realized_d_sw_eff_sec.value,
	waterAssignedPSeriesLastSegmentSegmentType:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_segment_type &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_segment_type.value,
	waterAssignedPSeriesLastSegmentStartDate:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_start_date &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_start_date.value,
	waterAssignedPSeriesLastSegmentSwDate:
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_sw_date &&
		oneLiner.oneLinerData.water_assigned_p_series_last_segment_sw_date.value,
	waterBestFitFirstSegmentB:
		oneLiner.oneLinerData.water_best_fit_first_segment_b &&
		oneLiner.oneLinerData.water_best_fit_first_segment_b.value,
	waterBestFitFirstSegmentD1Nominal:
		oneLiner.oneLinerData.water_best_fit_first_segment_d1_nominal &&
		oneLiner.oneLinerData.water_best_fit_first_segment_d1_nominal.value,
	waterBestFitFirstSegmentDiEffSec:
		oneLiner.oneLinerData.water_best_fit_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_best_fit_first_segment_di_eff_sec.value,
	waterBestFitFirstSegmentEndDate:
		oneLiner.oneLinerData.water_best_fit_first_segment_end_date &&
		oneLiner.oneLinerData.water_best_fit_first_segment_end_date.value,
	waterBestFitFirstSegmentQEnd:
		oneLiner.oneLinerData.water_best_fit_first_segment_q_end &&
		oneLiner.oneLinerData.water_best_fit_first_segment_q_end.value,
	waterBestFitFirstSegmentQStart:
		oneLiner.oneLinerData.water_best_fit_first_segment_q_start &&
		oneLiner.oneLinerData.water_best_fit_first_segment_q_start.value,
	waterBestFitFirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_best_fit_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_best_fit_first_segment_realized_d_sw_eff_sec.value,
	waterBestFitFirstSegmentSegmentType:
		oneLiner.oneLinerData.water_best_fit_first_segment_segment_type &&
		oneLiner.oneLinerData.water_best_fit_first_segment_segment_type.value,
	waterBestFitFirstSegmentStartDate:
		oneLiner.oneLinerData.water_best_fit_first_segment_start_date &&
		oneLiner.oneLinerData.water_best_fit_first_segment_start_date.value,
	waterBestFitFirstSegmentSwDate:
		oneLiner.oneLinerData.water_best_fit_first_segment_sw_date &&
		oneLiner.oneLinerData.water_best_fit_first_segment_sw_date.value,
	waterBestFitLastSegmentB:
		oneLiner.oneLinerData.water_best_fit_last_segment_b &&
		oneLiner.oneLinerData.water_best_fit_last_segment_b.value,
	waterBestFitLastSegmentD1Nominal:
		oneLiner.oneLinerData.water_best_fit_last_segment_d1_nominal &&
		oneLiner.oneLinerData.water_best_fit_last_segment_d1_nominal.value,
	waterBestFitLastSegmentDiEffSec:
		oneLiner.oneLinerData.water_best_fit_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_best_fit_last_segment_di_eff_sec.value,
	waterBestFitLastSegmentEndDate:
		oneLiner.oneLinerData.water_best_fit_last_segment_end_date &&
		oneLiner.oneLinerData.water_best_fit_last_segment_end_date.value,
	waterBestFitLastSegmentQEnd:
		oneLiner.oneLinerData.water_best_fit_last_segment_q_end &&
		oneLiner.oneLinerData.water_best_fit_last_segment_q_end.value,
	waterBestFitLastSegmentQStart:
		oneLiner.oneLinerData.water_best_fit_last_segment_q_start &&
		oneLiner.oneLinerData.water_best_fit_last_segment_q_start.value,
	waterBestFitLastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_best_fit_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_best_fit_last_segment_realized_d_sw_eff_sec.value,
	waterBestFitLastSegmentSegmentType:
		oneLiner.oneLinerData.water_best_fit_last_segment_segment_type &&
		oneLiner.oneLinerData.water_best_fit_last_segment_segment_type.value,
	waterBestFitLastSegmentStartDate:
		oneLiner.oneLinerData.water_best_fit_last_segment_start_date &&
		oneLiner.oneLinerData.water_best_fit_last_segment_start_date.value,
	waterBestFitLastSegmentSwDate:
		oneLiner.oneLinerData.water_best_fit_last_segment_sw_date &&
		oneLiner.oneLinerData.water_best_fit_last_segment_sw_date.value,
	waterDisposal: oneLiner.oneLinerData.water_disposal && oneLiner.oneLinerData.water_disposal.value,
	waterP10FirstSegmentB:
		oneLiner.oneLinerData.water_p10_first_segment_b && oneLiner.oneLinerData.water_p10_first_segment_b.value,
	waterP10FirstSegmentD1Nominal:
		oneLiner.oneLinerData.water_p10_first_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p10_first_segment_d1_nominal.value,
	waterP10FirstSegmentDiEffSec:
		oneLiner.oneLinerData.water_p10_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p10_first_segment_di_eff_sec.value,
	waterP10FirstSegmentEndDate:
		oneLiner.oneLinerData.water_p10_first_segment_end_date &&
		oneLiner.oneLinerData.water_p10_first_segment_end_date.value,
	waterP10FirstSegmentQEnd:
		oneLiner.oneLinerData.water_p10_first_segment_q_end &&
		oneLiner.oneLinerData.water_p10_first_segment_q_end.value,
	waterP10FirstSegmentQStart:
		oneLiner.oneLinerData.water_p10_first_segment_q_start &&
		oneLiner.oneLinerData.water_p10_first_segment_q_start.value,
	waterP10FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p10_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p10_first_segment_realized_d_sw_eff_sec.value,
	waterP10FirstSegmentSegmentType:
		oneLiner.oneLinerData.water_p10_first_segment_segment_type &&
		oneLiner.oneLinerData.water_p10_first_segment_segment_type.value,
	waterP10FirstSegmentStartDate:
		oneLiner.oneLinerData.water_p10_first_segment_start_date &&
		oneLiner.oneLinerData.water_p10_first_segment_start_date.value,
	waterP10FirstSegmentSwDate:
		oneLiner.oneLinerData.water_p10_first_segment_sw_date &&
		oneLiner.oneLinerData.water_p10_first_segment_sw_date.value,
	waterP10LastSegmentB:
		oneLiner.oneLinerData.water_p10_last_segment_b && oneLiner.oneLinerData.water_p10_last_segment_b.value,
	waterP10LastSegmentD1Nominal:
		oneLiner.oneLinerData.water_p10_last_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p10_last_segment_d1_nominal.value,
	waterP10LastSegmentDiEffSec:
		oneLiner.oneLinerData.water_p10_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p10_last_segment_di_eff_sec.value,
	waterP10LastSegmentEndDate:
		oneLiner.oneLinerData.water_p10_last_segment_end_date &&
		oneLiner.oneLinerData.water_p10_last_segment_end_date.value,
	waterP10LastSegmentQEnd:
		oneLiner.oneLinerData.water_p10_last_segment_q_end && oneLiner.oneLinerData.water_p10_last_segment_q_end.value,
	waterP10LastSegmentQStart:
		oneLiner.oneLinerData.water_p10_last_segment_q_start &&
		oneLiner.oneLinerData.water_p10_last_segment_q_start.value,
	waterP10LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p10_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p10_last_segment_realized_d_sw_eff_sec.value,
	waterP10LastSegmentSegmentType:
		oneLiner.oneLinerData.water_p10_last_segment_segment_type &&
		oneLiner.oneLinerData.water_p10_last_segment_segment_type.value,
	waterP10LastSegmentStartDate:
		oneLiner.oneLinerData.water_p10_last_segment_start_date &&
		oneLiner.oneLinerData.water_p10_last_segment_start_date.value,
	waterP10LastSegmentSwDate:
		oneLiner.oneLinerData.water_p10_last_segment_sw_date &&
		oneLiner.oneLinerData.water_p10_last_segment_sw_date.value,
	waterP50FirstSegmentB:
		oneLiner.oneLinerData.water_p50_first_segment_b && oneLiner.oneLinerData.water_p50_first_segment_b.value,
	waterP50FirstSegmentD1Nominal:
		oneLiner.oneLinerData.water_p50_first_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p50_first_segment_d1_nominal.value,
	waterP50FirstSegmentDiEffSec:
		oneLiner.oneLinerData.water_p50_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p50_first_segment_di_eff_sec.value,
	waterP50FirstSegmentEndDate:
		oneLiner.oneLinerData.water_p50_first_segment_end_date &&
		oneLiner.oneLinerData.water_p50_first_segment_end_date.value,
	waterP50FirstSegmentQEnd:
		oneLiner.oneLinerData.water_p50_first_segment_q_end &&
		oneLiner.oneLinerData.water_p50_first_segment_q_end.value,
	waterP50FirstSegmentQStart:
		oneLiner.oneLinerData.water_p50_first_segment_q_start &&
		oneLiner.oneLinerData.water_p50_first_segment_q_start.value,
	waterP50FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p50_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p50_first_segment_realized_d_sw_eff_sec.value,
	waterP50FirstSegmentSegmentType:
		oneLiner.oneLinerData.water_p50_first_segment_segment_type &&
		oneLiner.oneLinerData.water_p50_first_segment_segment_type.value,
	waterP50FirstSegmentStartDate:
		oneLiner.oneLinerData.water_p50_first_segment_start_date &&
		oneLiner.oneLinerData.water_p50_first_segment_start_date.value,
	waterP50FirstSegmentSwDate:
		oneLiner.oneLinerData.water_p50_first_segment_sw_date &&
		oneLiner.oneLinerData.water_p50_first_segment_sw_date.value,
	waterP50LastSegmentB:
		oneLiner.oneLinerData.water_p50_last_segment_b && oneLiner.oneLinerData.water_p50_last_segment_b.value,
	waterP50LastSegmentD1Nominal:
		oneLiner.oneLinerData.water_p50_last_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p50_last_segment_d1_nominal.value,
	waterP50LastSegmentDiEffSec:
		oneLiner.oneLinerData.water_p50_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p50_last_segment_di_eff_sec.value,
	waterP50LastSegmentEndDate:
		oneLiner.oneLinerData.water_p50_last_segment_end_date &&
		oneLiner.oneLinerData.water_p50_last_segment_end_date.value,
	waterP50LastSegmentQEnd:
		oneLiner.oneLinerData.water_p50_last_segment_q_end && oneLiner.oneLinerData.water_p50_last_segment_q_end.value,
	waterP50LastSegmentQStart:
		oneLiner.oneLinerData.water_p50_last_segment_q_start &&
		oneLiner.oneLinerData.water_p50_last_segment_q_start.value,
	waterP50LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p50_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p50_last_segment_realized_d_sw_eff_sec.value,
	waterP50LastSegmentSegmentType:
		oneLiner.oneLinerData.water_p50_last_segment_segment_type &&
		oneLiner.oneLinerData.water_p50_last_segment_segment_type.value,
	waterP50LastSegmentStartDate:
		oneLiner.oneLinerData.water_p50_last_segment_start_date &&
		oneLiner.oneLinerData.water_p50_last_segment_start_date.value,
	waterP50LastSegmentSwDate:
		oneLiner.oneLinerData.water_p50_last_segment_sw_date &&
		oneLiner.oneLinerData.water_p50_last_segment_sw_date.value,
	waterP90FirstSegmentB:
		oneLiner.oneLinerData.water_p90_first_segment_b && oneLiner.oneLinerData.water_p90_first_segment_b.value,
	waterP90FirstSegmentD1Nominal:
		oneLiner.oneLinerData.water_p90_first_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p90_first_segment_d1_nominal.value,
	waterP90FirstSegmentDiEffSec:
		oneLiner.oneLinerData.water_p90_first_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p90_first_segment_di_eff_sec.value,
	waterP90FirstSegmentEndDate:
		oneLiner.oneLinerData.water_p90_first_segment_end_date &&
		oneLiner.oneLinerData.water_p90_first_segment_end_date.value,
	waterP90FirstSegmentQEnd:
		oneLiner.oneLinerData.water_p90_first_segment_q_end &&
		oneLiner.oneLinerData.water_p90_first_segment_q_end.value,
	waterP90FirstSegmentQStart:
		oneLiner.oneLinerData.water_p90_first_segment_q_start &&
		oneLiner.oneLinerData.water_p90_first_segment_q_start.value,
	waterP90FirstSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p90_first_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p90_first_segment_realized_d_sw_eff_sec.value,
	waterP90FirstSegmentSegmentType:
		oneLiner.oneLinerData.water_p90_first_segment_segment_type &&
		oneLiner.oneLinerData.water_p90_first_segment_segment_type.value,
	waterP90FirstSegmentStartDate:
		oneLiner.oneLinerData.water_p90_first_segment_start_date &&
		oneLiner.oneLinerData.water_p90_first_segment_start_date.value,
	waterP90FirstSegmentSwDate:
		oneLiner.oneLinerData.water_p90_first_segment_sw_date &&
		oneLiner.oneLinerData.water_p90_first_segment_sw_date.value,
	waterP90LastSegmentB:
		oneLiner.oneLinerData.water_p90_last_segment_b && oneLiner.oneLinerData.water_p90_last_segment_b.value,
	waterP90LastSegmentD1Nominal:
		oneLiner.oneLinerData.water_p90_last_segment_d1_nominal &&
		oneLiner.oneLinerData.water_p90_last_segment_d1_nominal.value,
	waterP90LastSegmentDiEffSec:
		oneLiner.oneLinerData.water_p90_last_segment_di_eff_sec &&
		oneLiner.oneLinerData.water_p90_last_segment_di_eff_sec.value,
	waterP90LastSegmentEndDate:
		oneLiner.oneLinerData.water_p90_last_segment_end_date &&
		oneLiner.oneLinerData.water_p90_last_segment_end_date.value,
	waterP90LastSegmentQEnd:
		oneLiner.oneLinerData.water_p90_last_segment_q_end && oneLiner.oneLinerData.water_p90_last_segment_q_end.value,
	waterP90LastSegmentQStart:
		oneLiner.oneLinerData.water_p90_last_segment_q_start &&
		oneLiner.oneLinerData.water_p90_last_segment_q_start.value,
	waterP90LastSegmentRealizedDSwEffSec:
		oneLiner.oneLinerData.water_p90_last_segment_realized_d_sw_eff_sec &&
		oneLiner.oneLinerData.water_p90_last_segment_realized_d_sw_eff_sec.value,
	waterP90LastSegmentSegmentType:
		oneLiner.oneLinerData.water_p90_last_segment_segment_type &&
		oneLiner.oneLinerData.water_p90_last_segment_segment_type.value,
	waterP90LastSegmentStartDate:
		oneLiner.oneLinerData.water_p90_last_segment_start_date &&
		oneLiner.oneLinerData.water_p90_last_segment_start_date.value,
	waterP90LastSegmentSwDate:
		oneLiner.oneLinerData.water_p90_last_segment_sw_date &&
		oneLiner.oneLinerData.water_p90_last_segment_sw_date.value,
	waterWellHeadEur: oneLiner.oneLinerData.water_well_head_eur && oneLiner.oneLinerData.water_well_head_eur.value,
	waterProductionAsOfDate:
		oneLiner.oneLinerData.water_production_as_of_date && oneLiner.oneLinerData.water_production_as_of_date.value,
	waterRisk: oneLiner.oneLinerData.water_risk && oneLiner.oneLinerData.water_risk.value,
	waterTcRisk: oneLiner.oneLinerData.water_tc_risk && oneLiner.oneLinerData.water_tc_risk.value,
	waterWellHeadEurOverPll:
		oneLiner.oneLinerData.water_well_head_eur_over_pll && oneLiner.oneLinerData.water_well_head_eur_over_pll.value,
	wellLife: oneLiner.oneLinerData.well_life && oneLiner.oneLinerData.well_life.value,
	wetGasBoeConversion:
		oneLiner.oneLinerData.wet_gas_boe_conversion && oneLiner.oneLinerData.wet_gas_boe_conversion.value,
	wiBoeSalesVolume: oneLiner.oneLinerData.wi_boe_sales_volume && oneLiner.oneLinerData.wi_boe_sales_volume.value,
	wiDripCondensate: oneLiner.oneLinerData.wi_drip_condensate && oneLiner.oneLinerData.wi_drip_condensate.value,
	wiDripCondensateSalesVolume:
		oneLiner.oneLinerData.wi_drip_condensate_sales_volume &&
		oneLiner.oneLinerData.wi_drip_condensate_sales_volume.value,
	wiGas: oneLiner.oneLinerData.wi_gas && oneLiner.oneLinerData.wi_gas.value,
	wiGasSalesVolume: oneLiner.oneLinerData.wi_gas_sales_volume && oneLiner.oneLinerData.wi_gas_sales_volume.value,
	wiNgl: oneLiner.oneLinerData.wi_ngl && oneLiner.oneLinerData.wi_ngl.value,
	wiNglSalesVolume: oneLiner.oneLinerData.wi_ngl_sales_volume && oneLiner.oneLinerData.wi_ngl_sales_volume.value,
	wiOil: oneLiner.oneLinerData.wi_oil && oneLiner.oneLinerData.wi_oil.value,
	wiOilSalesVolume: oneLiner.oneLinerData.wi_oil_sales_volume && oneLiner.oneLinerData.wi_oil_sales_volume.value,
	wiMcfeSalesVolume: oneLiner.oneLinerData.wi_mcfe_sales_volume && oneLiner.oneLinerData.wi_mcfe_sales_volume.value,
});

module.exports = {
	toApiOneLiner,
};
