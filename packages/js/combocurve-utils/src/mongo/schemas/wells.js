// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const geohash = require('ngeohash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DATA_SOURCES } = require('./constants/data-sources');

const GEOHASH_PRECISION = 12;

const getGeoHash = (p) => {
	if (p.location && p.location.coordinates && p.location.coordinates.length) {
		return geohash.encode(p.location.coordinates[1], p.location.coordinates[0], GEOHASH_PRECISION);
	}
	return undefined;
};

const WELL_SCHEMA_VERSION = 1;

const wellSchema = {
	schemaVersion: { type: Number, default: WELL_SCHEMA_VERSION },
	// Critical indexed fields
	api14: { type: String, index: true },
	chosenID: { type: Schema.Types.Mixed, index: true },
	dataPool: { type: String, enum: ['external', 'internal'], default: 'internal', index: true },
	dataSource: {
		type: String,
		enum: DATA_SOURCES,
		default: 'other',
		index: true,
	},
	inptID: { type: String, index: true },
	project: { type: Schema.ObjectId, ref: 'projects', default: null, index: true },
	mostRecentImportType: {
		type: String,
		enum: ['db', 'api', 'spreadsheet', 'aries', 'phdwin'],
	},
	mostRecentImportDate: Date,

	// field indicating current document is not a well but wells collection
	// if is not null/undefined, it is wells collection
	wells_collection_items: { type: [Schema.ObjectId], ref: 'wells', index: true, default: undefined },

	location: {},
	toeLocation: {},
	heelLocation: {},
	// Indexed fields
	aries_id: { type: String, index: true },
	basin: { type: String, index: true },
	county: { type: String, index: true },
	current_operator: { type: String, index: true },
	first_cluster_count: { type: Number, index: true },
	first_stage_count: { type: Number, index: true },
	generic: { type: Boolean, index: true },
	geohash: { type: String, index: true },
	hole_direction: { type: String, index: true },
	landing_zone: { type: String, index: true },
	lateral_length: { type: Number, default: null, index: true },
	lease_name: { type: String, index: true },
	pad_name: { type: String, index: true },
	perf_lateral_length: { type: Number, default: null, index: true },
	play: { type: String, index: true },
	primary_product: { type: String, default: null, index: true },
	refrac_date: { type: Date, index: true },
	state: { type: String, index: true },
	status: { type: String, index: true },
	township: { type: String, index: true },
	true_vertical_depth: { type: Number, default: null, index: true },
	type_curve_area: { type: String, index: true },
	well_name: { type: String, index: true },
	mostRecentImportDesc: { type: String, index: true },

	chosenKeyID: String,
	copied: { type: Boolean, default: false },
	copiedFrom: { type: Schema.ObjectId, ref: 'wells' },
	dataSourceCustomName: String,
	mostRecentImport: { type: Schema.ObjectId, ref: 'file-imports' },
	closest_well_any_zone: { type: Schema.ObjectId, ref: 'wells' },
	closest_well_same_zone: { type: Schema.ObjectId, ref: 'wells' },

	abstract: String,
	acre_spacing: Number,
	allocation_type: String,
	api10: String,
	api12: String,
	azimuth: Number,
	bg: Number,
	block: String,
	bo: Number,
	bubble_point_press: Number,
	casing_id: Number,
	choke_size: Number,
	completion_design: String,
	completion_end_date: Date,
	completion_start_date: Date,
	country: String,
	current_operator_alias: String,
	current_operator_code: String,
	current_operator_ticker: String,
	date_rig_release: Date,
	dew_point_press: Number,
	distance_from_base_of_zone: Number,
	distance_from_top_of_zone: Number,
	district: String,
	drainage_area: Number,
	drill_end_date: Date,
	drill_start_date: Date,
	drillinginfo_id: String,
	elevation: Number,
	elevation_type: String,
	field: String,
	first_additive_volume: Number,
	first_fluid_volume: { type: Number, default: null },
	first_frac_vendor: String,
	first_max_injection_pressure: Number,
	first_max_injection_rate: Number,
	first_prod_date: Date,
	first_prop_weight: { type: Number, default: null },
	first_test_flow_tbg_press: Number,
	first_test_gas_vol: Number,
	first_test_gor: Number,
	first_test_oil_vol: Number,
	first_test_water_vol: Number,
	first_treatment_type: String,
	flow_path: String,
	fluid_type: String,
	footage_in_landing_zone: Number,
	formation_thickness_mean: Number,
	fracture_conductivity: Number,
	gas_analysis_date: Date,
	gas_c1: Number,
	gas_c2: Number,
	gas_c3: Number,
	gas_co2: Number,
	gas_gatherer: String,
	gas_h2: Number,
	gas_h2o: Number,
	gas_h2s: Number,
	gas_he: Number,
	gas_ic4: Number,
	gas_ic5: Number,
	gas_n2: Number,
	gas_nc4: Number,
	gas_nc5: Number,
	gas_nc6: Number,
	gas_nc7: Number,
	gas_nc8: Number,
	gas_nc9: Number,
	gas_nc10: Number,
	gas_o2: Number,
	gas_specific_gravity: Number,
	gross_perforated_interval: Number,
	ground_elevation: Number,
	heelLatitude: Number,
	heelLongitude: Number,
	horizontal_spacing: Number,
	hz_well_spacing_any_zone: Number,
	hz_well_spacing_same_zone: Number,
	ihs_id: String,
	initial_respress: Number,
	initial_restemp: Number,
	landing_zone_base: Number,
	landing_zone_top: Number,
	lease_number: String,
	lower_perforation: Number,
	matrix_permeability: Number,
	measured_depth: { type: Number, default: null },
	ngl_gatherer: String,
	num_treatment_records: Number,
	oil_api_gravity: Number,
	oil_gatherer: String,
	oil_specific_gravity: Number,
	parent_child_any_zone: String,
	parent_child_same_zone: String,
	percent_in_zone: Number,
	permit_date: Date,
	phdwin_id: String,
	porosity: Number,
	previous_operator: String,
	previous_operator_alias: String,
	previous_operator_code: String,
	previous_operator_ticker: String,
	prms_reserves_category: String,
	prms_reserves_sub_category: String,
	prms_resources_class: String,
	production_method: String,
	proppant_mesh_size: String,
	proppant_type: String,
	range: String,
	recovery_method: String,
	refrac_additive_volume: Number,
	refrac_cluster_count: Number,
	refrac_fluid_volume: Number,
	refrac_frac_vendor: String,
	refrac_max_injection_pressure: Number,
	refrac_max_injection_rate: Number,
	refrac_prop_weight: Number,
	refrac_stage_count: Number,
	refrac_treatment_type: String,
	rig: String,
	rs: Number,
	rseg_id: String,
	section: String,
	sg: Number,
	so: Number,
	spud_date: Date,
	stage_spacing: Number,
	subplay: String,
	surfaceLatitude: { type: Number, default: null },
	surfaceLongitude: { type: Number, default: null },
	survey: String,
	sw: Number,
	target_formation: String,
	tgs_id: String,
	thickness: Number,
	til: Date,
	toeLatitude: Number,
	toeLongitude: Number,
	toe_in_landing_zone: String,
	toe_up: String,
	tubing_depth: Number,
	tubing_id: Number,
	upper_perforation: Number,
	vertical_spacing: Number,
	vt_well_spacing_any_zone: Number,
	vt_well_spacing_same_zone: Number,
	well_number: String,
	well_type: String,
	zi: Number,

	// custom string
	custom_string_0: String,
	custom_string_1: String,
	custom_string_2: String,
	custom_string_3: String,
	custom_string_4: String,
	custom_string_5: String,
	custom_string_6: String,
	custom_string_7: String,
	custom_string_8: String,
	custom_string_9: String,
	custom_string_10: String,
	custom_string_11: String,
	custom_string_12: String,
	custom_string_13: String,
	custom_string_14: String,
	custom_string_15: String,
	custom_string_16: String,
	custom_string_17: String,
	custom_string_18: String,
	custom_string_19: String,

	// custom number
	custom_number_0: Number,
	custom_number_1: Number,
	custom_number_2: Number,
	custom_number_3: Number,
	custom_number_4: Number,
	custom_number_5: Number,
	custom_number_6: Number,
	custom_number_7: Number,
	custom_number_8: Number,
	custom_number_9: Number,
	custom_number_10: Number,
	custom_number_11: Number,
	custom_number_12: Number,
	custom_number_13: Number,
	custom_number_14: Number,
	custom_number_15: Number,
	custom_number_16: Number,
	custom_number_17: Number,
	custom_number_18: Number,
	custom_number_19: Number,

	// custom date
	custom_date_0: Date,
	custom_date_1: Date,
	custom_date_2: Date,
	custom_date_3: Date,
	custom_date_4: Date,
	custom_date_5: Date,
	custom_date_6: Date,
	custom_date_7: Date,
	custom_date_8: Date,
	custom_date_9: Date,

	// custom boolean
	custom_bool_0: Boolean,
	custom_bool_1: Boolean,
	custom_bool_2: Boolean,
	custom_bool_3: Boolean,
	custom_bool_4: Boolean,

	// Calcs
	first_proppant_per_fluid: { type: Number, default: null },
	refrac_proppant_per_perforated_interval: { type: Number, default: null },
	refrac_fluid_per_perforated_interval: { type: Number, default: null },
	refrac_proppant_per_fluid: { type: Number, default: null },
	total_additive_volume: Number,
	total_cluster_count: Number,
	total_fluid_volume: { type: Number, default: null },
	total_prop_weight: { type: Number, default: null },
	total_proppant_per_fluid: { type: Number, default: null },

	// production related calcs
	cum_boe: Number,
	cum_oil: Number,
	cum_gas: Number,
	cum_gor: Number,
	cum_water: Number,
	cum_mmcfge: Number,
	cum_boe_per_perforated_interval: Number,
	cum_gas_per_perforated_interval: Number,
	cum_oil_per_perforated_interval: Number,
	cum_water_per_perforated_interval: Number,
	cum_mmcfge_per_perforated_interval: Number,
	first_12_boe: Number,
	first_12_boe_per_perforated_interval: Number,
	first_12_gas: Number,
	first_12_gas_per_perforated_interval: Number,
	first_12_gor: Number,
	first_12_oil: Number,
	first_12_oil_per_perforated_interval: Number,
	first_12_water: Number,
	first_12_water_per_perforated_interval: Number,
	first_12_mmcfge: Number,
	first_12_mmcfge_per_perforated_interval: Number,
	first_6_boe: Number,
	first_6_boe_per_perforated_interval: Number,
	first_6_gas: Number,
	first_6_gas_per_perforated_interval: Number,
	first_6_gor: Number,
	first_6_mmcfge: Number,
	first_6_mmcfge_per_perforated_interval: Number,
	first_6_oil: Number,
	first_6_oil_per_perforated_interval: Number,
	first_6_water: Number,
	first_6_water_per_perforated_interval: Number,
	last_12_boe: Number,
	last_12_boe_per_perforated_interval: Number,
	last_12_gas: Number,
	last_12_gas_per_perforated_interval: Number,
	last_12_gor: Number,
	last_12_mmcfge: Number,
	last_12_mmcfge_per_perforated_interval: Number,
	last_12_oil: Number,
	last_12_oil_per_perforated_interval: Number,
	last_12_water: Number,
	last_12_water_per_perforated_interval: Number,
	last_month_boe: Number,
	last_month_boe_per_perforated_interval: Number,
	last_month_gas: Number,
	last_month_gas_per_perforated_interval: Number,
	last_month_gor: Number,
	last_month_mmcfge: Number,
	last_month_mmcfge_per_perforated_interval: Number,
	last_month_oil: Number,
	last_month_oil_per_perforated_interval: Number,
	last_month_water: Number,
	last_month_water_per_perforated_interval: Number,
	month_produced: Number,
	// Indexed calcs
	first_proppant_per_perforated_interval: { type: Number, index: true, default: null },
	first_fluid_per_perforated_interval: { type: Number, index: true, default: null },
	total_fluid_per_perforated_interval: { type: Number, index: true, default: null },
	total_proppant_per_perforated_interval: { type: Number, index: true, default: null },
	total_stage_count: { type: Number, index: true },
	has_daily: { type: Boolean, index: true },
	has_monthly: { type: Boolean, index: true },
	has_directional_survey: { type: Boolean, index: true },
	first_prod_date_daily_calc: { type: Date, index: true, default: null },
	first_prod_date_monthly_calc: { type: Date, index: true, default: null },
	last_prod_date_monthly: Date,
	last_prod_date_daily: Date,
	// Econ run calcs
	combo_name: String,
	econ_run_date: Date,
	wi_oil: Number,
	nri_oil: Number,
	before_income_tax_cash_flow: Number,
	first_discount_cash_flow: Number,
	econ_first_production_date: Date,
	undiscounted_roi: Number,
	irr: Number,
	payout_duration: Number,
	oil_breakeven: Number,
	gas_breakeven: Number,
	oil_shrunk_eur: Number,
	gas_shrunk_eur: Number,
	ngl_shrunk_eur: Number,
	oil_shrunk_eur_over_pll: Number,
	gas_shrunk_eur_over_pll: Number,
	ngl_shrunk_eur_over_pll: Number,
};

const WellSchema = new Schema(wellSchema, { timestamps: true });

WellSchema.index(
	{ wells_collection_items: 1, project: 1 },
	{ partialFilterExpression: { wells_collection_items: { $exists: true } } }
);
WellSchema.index({ location: '2dsphere' });

const isValidLocation = (location) => location?.coordinates?.length > 0;

WellSchema.virtual('asGeoLine').get(function anon() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	if (!isValidLocation(this.location)) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	if (!isValidLocation(this.toeLocation) && !isValidLocation(this.heelLocation)) {
		return {
			type: 'Feature',
			// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
			geometry: this.location,
			properties: {
				// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
				wellId: this._id,
			},
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	const coordinates = [this.location.coordinates];
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	if (isValidLocation(this.heelLocation)) {
		// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
		coordinates.push(this.heelLocation.coordinates);
	}
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	if (isValidLocation(this.toeLocation)) {
		// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
		coordinates.push(this.toeLocation.coordinates);
	}

	return {
		type: 'Feature',
		geometry: {
			type: 'LineString',
			coordinates,
		},
		properties: {
			// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
			wellId: this._id,
		},
	};
});

WellSchema.pre('save', function save() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	this.geohash = getGeoHash(this);
});

WellSchema.pre('update', function update() {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	this.geohash = getGeoHash(this);
});

WellSchema.query.onlyWellCollections = function () {
	return this.where({ wells_collection_items: { $exists: true } });
};

WellSchema.query.onlyWells = function () {
	return this.where({ wells_collection_items: { $exists: false } });
};

module.exports = { WellSchema, getGeoHash, wellSchema };
