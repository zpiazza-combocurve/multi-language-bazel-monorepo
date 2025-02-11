/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';
export { WellSchema } from '../schemas';

export const DATA_POOLS = ['external', 'internal'] as const;
export const DATA_SOURCES = ['di', 'ihs', 'phdwin', 'aries', 'internal', 'other'] as const;
export const IMPORT_TYPES = ['db', 'phdwin', 'aries', 'api', 'spreadsheet'] as const;

export type DataPool = (typeof DATA_POOLS)[number];
export type DataSource = (typeof DATA_SOURCES)[number];
export type ImportType = (typeof IMPORT_TYPES)[number];

export interface IWell extends Document {
	_id: Types.ObjectId;
	api14?: string;
	chosenID: string;
	dataPool: DataPool;
	dataSource: DataSource;
	inptID?: string;
	project: Types.ObjectId | null;
	mostRecentImportType?: ImportType;
	mostRecentImportDate?: Date;
	basin?: string;
	county?: string;
	current_operator?: string;
	first_cluster_count?: number;
	first_stage_count?: number;
	generic?: boolean;
	hole_direction?: string;
	landing_zone?: string;
	lateral_length: number | null;
	lease_name?: string;
	pad_name?: string;
	perf_lateral_length: number | null;
	play?: string;
	primary_product: string | null;
	refrac_date?: Date;
	state?: string;
	status?: string;
	township?: string;
	true_vertical_depth: number | null;
	type_curve_area?: string;
	well_name?: string;
	mostRecentImportDesc?: string;
	chosenKeyID?: string;
	copied?: boolean;
	copiedFrom?: Types.ObjectId;
	dataSourceCustomName?: string;
	abstract?: string;
	acre_spacing?: number;
	allocation_type?: string;
	api10?: string;
	api12?: string;
	aries_id?: string;
	azimuth?: number;
	bg?: number;
	block?: string;
	bo?: number;
	bubble_point_press?: number;
	casing_id?: number;
	choke_size?: number;
	completion_design?: string;
	completion_end_date?: Date;
	completion_start_date?: Date;
	country?: string;
	current_operator_alias?: string;
	current_operator_code?: string;
	current_operator_ticker?: string;
	date_rig_release?: Date;
	dew_point_press?: number;
	distance_from_base_of_zone?: number;
	distance_from_top_of_zone?: number;
	district?: string;
	drainage_area?: number;
	drill_end_date?: Date;
	drill_start_date?: Date;
	drillinginfo_id?: string;
	elevation?: number;
	elevation_type?: string;
	field?: string;
	first_additive_volume?: number;
	first_frac_vendor?: string;
	first_max_injection_pressure?: number;
	first_max_injection_rate?: number;
	first_prod_date?: Date;
	first_prop_weight: number | null;
	first_test_flow_tbg_press?: number;
	first_test_gas_vol?: number;
	first_test_gor?: number;
	first_fluid_volume: number | null;
	first_test_oil_vol?: number;
	first_test_water_vol?: number;
	first_treatment_type?: string;
	flow_path?: string;
	fluid_type?: string;
	footage_in_landing_zone?: number;
	formation_thickness_mean?: number;
	fracture_conductivity?: number;
	gas_analysis_date?: Date;
	gas_c1?: number;
	gas_c2?: number;
	gas_c3?: number;
	gas_co2?: number;
	gas_gatherer?: string;
	gas_h2?: number;
	gas_h2o?: number;
	gas_h2s?: number;
	gas_he?: number;
	gas_ic4?: number;
	gas_ic5?: number;
	gas_n2?: number;
	gas_nc4?: number;
	gas_nc5?: number;
	gas_nc6?: number;
	gas_nc7?: number;
	gas_nc8?: number;
	gas_nc9?: number;
	gas_nc10?: number;
	gas_o2?: number;
	gas_specific_gravity?: number;
	gross_perforated_interval?: number;
	ground_elevation?: number;
	heelLatitude?: number;
	heelLongitude?: number;
	horizontal_spacing?: number;
	hz_well_spacing_any_zone?: number;
	hz_well_spacing_same_zone?: number;
	ihs_id?: string;
	initial_respress?: number;
	initial_restemp?: number;
	landing_zone_base?: number;
	landing_zone_top?: number;
	lease_number?: string;
	lower_perforation?: number;
	matrix_permeability?: number;
	measured_depth: number | null;
	month_produced?: number;
	ngl_gatherer?: string;
	num_treatment_records?: number;
	oil_api_gravity?: number;
	oil_gatherer?: string;
	oil_specific_gravity?: number;
	parent_child_any_zone?: string;
	parent_child_same_zone?: string;
	percent_in_zone?: number;
	permit_date?: Date;
	phdwin_id?: string;
	porosity?: number;
	previous_operator?: string;
	previous_operator_alias?: string;
	previous_operator_code?: string;
	previous_operator_ticker?: string;
	prms_reserves_category?: string;
	prms_reserves_sub_category?: string;
	prms_resources_class?: string;
	production_method?: string;
	proppant_mesh_size?: string;
	proppant_type?: string;
	range?: string;
	recovery_method?: string;
	refrac_additive_volume?: number;
	refrac_cluster_count?: number;
	refrac_fluid_volume?: number;
	refrac_frac_vendor?: string;
	refrac_max_injection_pressure?: number;
	refrac_max_injection_rate?: number;
	refrac_prop_weight?: number;
	refrac_stage_count?: number;
	refrac_treatment_type?: string;
	rig?: string;
	rs?: number;
	rseg_id?: string;
	section?: string;
	sg?: number;
	so?: number;
	spud_date?: Date;
	stage_spacing?: number;
	subplay?: string;
	surfaceLatitude: number | null;
	surfaceLongitude: number | null;
	survey?: string;
	sw?: number;
	target_formation?: string;
	tgs_id?: string;
	thickness?: number;
	til?: Date;
	toeLatitude?: number;
	toeLongitude?: number;
	toe_in_landing_zone?: string;
	toe_up?: string;
	tubing_depth?: number;
	tubing_id?: number;
	upper_perforation?: number;
	vertical_spacing?: number;
	vt_well_spacing_any_zone?: number;
	vt_well_spacing_same_zone?: number;
	well_number?: string;
	well_type?: string;
	zi?: number;
	custom_string_0?: string;
	custom_string_1?: string;
	custom_string_2?: string;
	custom_string_3?: string;
	custom_string_4?: string;
	custom_string_5?: string;
	custom_string_6?: string;
	custom_string_7?: string;
	custom_string_8?: string;
	custom_string_9?: string;
	custom_string_10?: string;
	custom_string_11?: string;
	custom_string_12?: string;
	custom_string_13?: string;
	custom_string_14?: string;
	custom_string_15?: string;
	custom_string_16?: string;
	custom_string_17?: string;
	custom_string_18?: string;
	custom_string_19?: string;
	custom_number_0?: number;
	custom_number_1?: number;
	custom_number_2?: number;
	custom_number_3?: number;
	custom_number_4?: number;
	custom_number_5?: number;
	custom_number_6?: number;
	custom_number_7?: number;
	custom_number_8?: number;
	custom_number_9?: number;
	custom_number_10?: number;
	custom_number_11?: number;
	custom_number_12?: number;
	custom_number_13?: number;
	custom_number_14?: number;
	custom_number_15?: number;
	custom_number_16?: number;
	custom_number_17?: number;
	custom_number_18?: number;
	custom_number_19?: number;
	custom_date_0?: Date;
	custom_date_1?: Date;
	custom_date_2?: Date;
	custom_date_3?: Date;
	custom_date_4?: Date;
	custom_date_5?: Date;
	custom_date_6?: Date;
	custom_date_7?: Date;
	custom_date_8?: Date;
	custom_date_9?: Date;
	custom_bool_0?: boolean;
	custom_bool_1?: boolean;
	custom_bool_2?: boolean;
	custom_bool_3?: boolean;
	custom_bool_4?: boolean;
	first_proppant_per_fluid: number | null;
	refrac_proppant_per_perforated_interval: number | null;
	refrac_fluid_per_perforated_interval: number | null;
	refrac_proppant_per_fluid: number | null;
	total_additive_volume?: number;
	total_cluster_count?: number;
	total_fluid_volume: number | null;
	total_prop_weight: number | null;
	total_proppant_per_fluid: number | null;
	cum_boe?: number;
	cum_oil?: number;
	cum_gas?: number;
	cum_gor?: number;
	cum_water?: number;
	cum_mmcfge?: number;
	cum_boe_per_perforated_interval?: number;
	cum_gas_per_perforated_interval?: number;
	cum_oil_per_perforated_interval?: number;
	cum_water_per_perforated_interval?: number;
	cum_mmcfge_per_perforated_interval?: number;
	first_12_boe?: number;
	first_12_boe_per_perforated_interval?: number;
	first_12_gas?: number;
	first_12_gas_per_perforated_interval?: number;
	first_12_gor?: number;
	first_12_oil?: number;
	first_12_oil_per_perforated_interval?: number;
	first_12_water?: number;
	first_12_water_per_perforated_interval?: number;
	first_12_mmcfge?: number;
	first_12_mmcfge_per_perforated_interval?: number;
	first_6_boe?: number;
	first_6_boe_per_perforated_interval?: number;
	first_6_gas?: number;
	first_6_gas_per_perforated_interval?: number;
	first_6_gor?: number;
	first_6_mmcfge?: number;
	first_6_mmcfge_per_perforated_interval?: number;
	first_6_oil?: number;
	first_6_oil_per_perforated_interval?: number;
	first_6_water?: number;
	first_6_water_per_perforated_interval?: number;
	last_12_boe?: number;
	last_12_boe_per_perforated_interval?: number;
	last_12_gas?: number;
	last_12_gas_per_perforated_interval?: number;
	last_12_gor?: number;
	last_12_mmcfge?: number;
	last_12_mmcfge_per_perforated_interval?: number;
	last_12_oil?: number;
	last_12_oil_per_perforated_interval?: number;
	last_12_water?: number;
	last_12_water_per_perforated_interval?: number;
	last_month_boe?: number;
	last_month_boe_per_perforated_interval?: number;
	last_month_gas?: number;
	last_month_gas_per_perforated_interval?: number;
	last_month_gor?: number;
	last_month_mmcfge?: number;
	last_month_mmcfge_per_perforated_interval?: number;
	last_month_oil?: number;
	last_month_oil_per_perforated_interval?: number;
	last_month_water?: number;
	last_month_water_per_perforated_interval?: number;
	first_proppant_per_perforated_interval: number | null;
	first_fluid_per_perforated_interval: number | null;
	total_fluid_per_perforated_interval: number | null;
	total_proppant_per_perforated_interval: number | null;
	total_stage_count?: number;
	has_daily?: boolean;
	has_monthly?: boolean;
	first_prod_date_daily_calc: Date | null;
	first_prod_date_monthly_calc: Date | null;
	last_prod_date_monthly?: Date;
	last_prod_date_daily?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
