import { useMemo } from 'react';

import { useAlfa } from '@/helpers/alfa';

const WELL_HEADER_NAME = 'headerFiles';
const WELL_HEADER_LABEL = '* Well Header';
const WELL_HEADER_TYPE = 'headers';

const PROD_MONTHLY_NAME = 'prodFiles_monthly';
const PROD_MONTHLY_LABEL = 'Production Data (Monthly)';
const PROD_MONTHLY_TYPE = 'monthly';

const PROD_DAILY_NAME = 'prodFiles_daily';
const PROD_DAILY_LABEL = 'Production Data (Daily)';
const PROD_DAILY_TYPE = 'daily';

export const DIRECTIONAL_SURVEY_NAME = 'directionalSurvey';
const DIRECTIONAL_SURVEY_LABEL = 'Directional Surveys';
const DIRECTIONAL_SURVEY_TYPE = 'survey';

const WELL_HEADER_CATEGORY = WELL_HEADER_NAME;
const PROD_DATA_CATEGORY = 'prodFiles';
const DIRECTIONAL_SURVEY_CATEGORY = DIRECTIONAL_SURVEY_NAME;

export const HEADER_TEMPLATE = {
	name: WELL_HEADER_NAME,
	category: WELL_HEADER_CATEGORY,
	label: WELL_HEADER_LABEL,
	prodType: WELL_HEADER_TYPE,
};

export const MONTHLY_TEMPLATE = {
	name: PROD_MONTHLY_NAME,
	category: PROD_DATA_CATEGORY,
	label: PROD_MONTHLY_LABEL,
	prodType: PROD_MONTHLY_TYPE,
};

export const DAILY_TEMPLATE = {
	name: PROD_DAILY_NAME,
	category: PROD_DATA_CATEGORY,
	label: PROD_DAILY_LABEL,
	prodType: PROD_DAILY_TYPE,
};

export const DIRECTIONAL_SURVEY_TEMPLATE = {
	name: DIRECTIONAL_SURVEY_NAME,
	category: DIRECTIONAL_SURVEY_CATEGORY,
	label: DIRECTIONAL_SURVEY_LABEL,
	prodType: DIRECTIONAL_SURVEY_TYPE,
};

export const ARIES_TEMPLATE = {
	name: 'aries',
	label: '* ARIES DB',
	accept: '.accdb,.mdb',
};

export const PHDWIN_TEMPLATE = {
	name: 'phdwin',
	label: '* PHDWIN DB',
	accept: '.phz',
};

export const ARIES_EXTRA_TEMPLATE = {
	name: 'aries_extra',
	label: (
		<>
			.A OUTSIDEFILES
			<br />
			(OPTIONAL, ZIP FILE)
		</>
	),
	accept: '.zip',
};

export const RECOMMENDED_FIELDS = [
	'api14',
	'chosenID',
	'county',
	'current_operator',
	'current_operator_alias',
	'date',
	'first_fluid_volume',
	'first_prop_weight',
	'gas',
	'landing_zone',
	'measured_depth',
	'oil',
	'perf_lateral_length',
	'state',
	'status',
	'surfaceLatitude',
	'surfaceLongitude',
	'toeLatitude',
	'toeLongitude',
	'total_fluid_volume',
	'total_prop_weight',
	'true_vertical_depth',
	'water',
	'well_name',
	'well_number',
];

export const DAY_FIELDS = {
	chosenID: { label: 'Chosen ID', required: true, important: true },
	date: { label: 'Date', required: { ifMissing: [['day', 'month', 'year']] } },
	day: { label: 'Day', required: { ifMissing: [['date']] } },
	month: { label: 'Month', required: { ifMissing: [['date']] } },
	year: { label: 'Year', required: { ifMissing: [['date']] } },
	gas: { label: 'Gas (MCF/D)', required: { ifMissing: [['oil'], ['water']] } },
	oil: { label: 'Oil (BBL/D)', required: { ifMissing: [['gas'], ['water']] } },
	water: { label: 'Water (BBL/D)', required: { ifMissing: [['gas'], ['oil']] } },

	bottom_hole_pressure: { label: 'Bottom Hole Pressure (PSI)' },
	casing_head_pressure: { label: 'Casing Head Pressure (PSI)' },
	choke: { label: 'Choke (in)' },
	flowline_pressure: { label: 'Flowline Pressure (PSI)' },
	gas_lift_injection_pressure: { label: 'Gas Lift Injection Pressure (PSI)' },
	hours_on: { label: 'Hours On' },
	tubing_head_pressure: { label: 'Tubing Head Pressure (PSI)' },
	vessel_separator_pressure: { label: 'Vessel Separator Pressure (PSI)' },

	operational_tag: { label: 'Operational Tag' },

	gasInjection: { label: 'Gas Injection (MCF/D)' },
	waterInjection: { label: 'Water Injection (BBL/D)' },
	co2Injection: { label: 'CO2 Injection (MCF/D)' },
	steamInjection: { label: 'Steam Injection (MCF/D)' },
	ngl: { label: 'NGL (BBL/D)' },

	customNumber0: { label: 'Custom Number 0' },
	customNumber1: { label: 'Custom Number 1' },
	customNumber2: { label: 'Custom Number 2' },
	customNumber3: { label: 'Custom Number 3' },
	customNumber4: { label: 'Custom Number 4' },
};

export const MONTH_FIELDS = {
	chosenID: { label: 'Chosen ID', required: true, important: true },
	date: { label: 'Date', required: { ifMissing: [['month', 'year']] } },
	month: { label: 'Month', required: { ifMissing: [['date']] } },
	year: { label: 'Year', required: { ifMissing: [['date']] } },
	gas: { label: 'Gas (MCF/MO)', required: { ifMissing: [['oil'], ['water']] } },
	oil: { label: 'Oil (BBL/MO)', required: { ifMissing: [['gas'], ['water']] } },
	water: { label: 'Water (BBL/MO)', required: { ifMissing: [['gas'], ['oil']] } },
	choke: { label: 'Choke (in)' },

	days_on: { label: 'Days On' },

	operational_tag: { label: 'Operational Tag' },

	gasInjection: { label: 'Gas Injection (MCF/MO)' },
	waterInjection: { label: 'Water Injection (BBL/MO)' },
	co2Injection: { label: 'CO2 Injection (MCF/MO)' },
	steamInjection: { label: 'Steam Injection (MCF/MO)' },
	ngl: { label: 'NGL (BBL/MO)' },

	customNumber0: { label: 'Custom Number 0' },
	customNumber1: { label: 'Custom Number 1' },
	customNumber2: { label: 'Custom Number 2' },
	customNumber3: { label: 'Custom Number 3' },
	customNumber4: { label: 'Custom Number 4' },
};

export const SURVEY_FIELDS = {
	chosenID: { label: 'Chosen ID', required: true, important: true },

	measuredDepth: { label: 'Measured Depth (FT)', required: true },
	trueVerticalDepth: { label: 'True Vertical Depth (FT)', required: { ifMissing: [['inclination', 'azimuth']] } },
	azimuth: {
		label: 'Azimuth (degrees)',
		required: { ifMissing: [['trueVerticalDepth', 'deviationNS', 'deviationEW']] },
	},
	inclination: {
		label: 'Inclination (degrees)',
		required: { ifMissing: [['trueVerticalDepth', 'deviationNS', 'deviationEW']] },
	},
	deviationNS: { label: 'Deviation NS (FT)', required: { ifMissing: [['inclination', 'azimuth']] } },
	deviationEW: { label: 'Deviation EW (FT)', required: { ifMissing: [['inclination', 'azimuth']] } },
	latitude: { label: 'Latitude' },
	longitude: { label: 'Longitude' },
};

export const WELL_HEADERS_TO_MAP = [
	'abstract',
	'acre_spacing',
	'allocation_type',
	'api10',
	'api12',
	'api14',
	'aries_id',
	'azimuth',
	'basin',
	'block',
	'casing_id',
	'choke_size',
	'chosenID',
	'completion_design',
	'completion_end_date',
	'completion_start_date',
	'country',
	'county',
	'current_operator',
	'current_operator_alias',
	'current_operator_code',
	'current_operator_ticker',
	'date_rig_release',
	'distance_from_base_of_zone',
	'distance_from_top_of_zone',
	'district',
	'drill_end_date',
	'drill_start_date',
	'elevation',
	'elevation_type',
	'field',
	'first_additive_volume',
	'first_cluster_count',
	'first_fluid_volume',
	'first_frac_vendor',
	'first_max_injection_pressure',
	'first_max_injection_rate',
	'first_prod_date',
	'first_prop_weight',
	'first_stage_count',
	'first_test_flow_tbg_press',
	'first_test_gas_vol',
	'first_test_gor',
	'first_test_oil_vol',
	'first_test_water_vol',
	'first_treatment_type',
	'flow_path',
	'fluid_type',
	'footage_in_landing_zone',
	'formation_thickness_mean',
	'gas_gatherer',
	'gas_specific_gravity',
	'ground_elevation',
	'heelLatitude',
	'heelLongitude',
	'hole_direction',
	'hz_well_spacing_any_zone',
	'hz_well_spacing_same_zone',
	'initial_respress',
	'initial_restemp',
	'landing_zone',
	'landing_zone_base',
	'landing_zone_top',
	'lateral_length',
	'lease_name',
	'lease_number',
	'lower_perforation',
	'matrix_permeability',
	'measured_depth',
	'num_treatment_records',
	'oil_api_gravity',
	'oil_gatherer',
	'oil_specific_gravity',
	'pad_name',
	'parent_child_any_zone',
	'parent_child_same_zone',
	'percent_in_zone',
	'perf_lateral_length',
	'permit_date',
	'phdwin_id',
	'play',
	'porosity',
	'previous_operator',
	'previous_operator_alias',
	'previous_operator_code',
	'previous_operator_ticker',
	'primary_product',
	'prms_reserves_category',
	'prms_reserves_sub_category',
	'production_method',
	'proppant_mesh_size',
	'proppant_type',
	'range',
	'recovery_method',
	'refrac_additive_volume',
	'refrac_cluster_count',
	'refrac_date',
	'refrac_fluid_volume',
	'refrac_frac_vendor',
	'refrac_max_injection_pressure',
	'refrac_max_injection_rate',
	'refrac_prop_weight',
	'refrac_stage_count',
	'refrac_treatment_type',
	'rig',
	'section',
	'sg',
	'so',
	'spud_date',
	'stage_spacing',
	'state',
	'status',
	'subplay',
	'surfaceLatitude',
	'surfaceLongitude',
	'survey',
	'sw',
	'target_formation',
	'thickness',
	'til',
	'toeLatitude',
	'toeLongitude',
	'toe_in_landing_zone',
	'toe_up',
	'township',
	'true_vertical_depth',
	'tubing_depth',
	'tubing_id',
	'type_curve_area',
	'upper_perforation',
	'vt_well_spacing_any_zone',
	'vt_well_spacing_same_zone',
	'well_name',
	'well_number',
	'well_type',
	'custom_string_0',
	'custom_string_1',
	'custom_string_2',
	'custom_string_3',
	'custom_string_4',
	'custom_string_5',
	'custom_string_6',
	'custom_string_7',
	'custom_string_8',
	'custom_string_9',
	'custom_string_10',
	'custom_string_11',
	'custom_string_12',
	'custom_string_13',
	'custom_string_14',
	'custom_string_15',
	'custom_string_16',
	'custom_string_17',
	'custom_string_18',
	'custom_string_19',
	'custom_number_0',
	'custom_number_1',
	'custom_number_2',
	'custom_number_3',
	'custom_number_4',
	'custom_number_5',
	'custom_number_6',
	'custom_number_7',
	'custom_number_8',
	'custom_number_9',
	'custom_number_10',
	'custom_number_11',
	'custom_number_12',
	'custom_number_13',
	'custom_number_14',
	'custom_number_15',
	'custom_number_16',
	'custom_number_17',
	'custom_number_18',
	'custom_number_19',
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
	'custom_bool_0',
	'custom_bool_1',
	'custom_bool_2',
	'custom_bool_3',
	'custom_bool_4',
];

const DATE_FORMAT_DESCRIPTION = [
	{ format: 'MM/DD/YY', description: 'Month-Day-Year with leading zeros (02/17/2009)' },
	{ format: 'YY/MM/DD', description: 'Year-Month-Day with leading zeros (2009/02/17)' },
	{ format: 'Month D, Yr', description: 'Month name-Day-Year with no leading zeros (February 17, 2009)' },
	{ format: 'M/D/YY', description: 'Month-Day-Year with no leading zeros (2/17/2009)' },
	{ format: 'YY/M/D', description: 'Month-Day-Year with no leading zeros (2009/02/17)' },
	{ format: 'bM/bD/YY', description: 'Month-Day-Year with spaces instead of leading zeros ( 2/17/2009)' },
	{ format: 'YY/bM/bD', description: 'Year-Month-Day with spaces instead of leading zeros (/2009/ 2/17)' },
	{ format: 'DD/Mon/YY', description: 'Day-Month abbreviation-Year with leading zeros (17Feb2009)' },
	{ format: 'DD Month, Yr', description: 'Day-Month name-Year (17 February, 2009)' },
	{ format: 'Yr, Month DD', description: 'Year-Month name-Day (2009, February 17)' },
	{ format: 'Mon-DD-YYYY', description: 'Month abbreviation, Day with leading zeros, Year (Feb 17, 2009)' },
	{ format: 'DD-Mon-YYYY', description: 'Day with leading zeros, Month abbreviation, Year (17 Feb, 2009)' },
	{
		format: 'YYYY-Mon-DD',
		description:
			'Year, Month abbreviation, Day with leading zeros (2009, Feb 17). This format defaults to a two digit year, but can be overridden to have four digits',
	},
	{
		format: 'Mon DD, YYYY',
		description: 'Month abbreviation, Day with leading zeros, Year (Feb 17, 2014)',
	},
	{
		format: 'DD Mon, YYYY',
		description: 'Day with leading zeros, Month abbreviation, Year (17 Feb, 2014)',
	},
	{
		format: 'YYYY, Mon DD',
		description: 'Year, Month abbreviation, Day with leading zeros (17 Feb, 2014)',
	},
];

const dateFormats = (
	<div>
		Date Formats Supported:
		<ul>
			{DATE_FORMAT_DESCRIPTION.map(({ format, description }, index) => (
				// eslint-disable-next-line react/no-array-index-key
				<li key={index}>
					{format}: {description}
				</li>
			))}
		</ul>
	</div>
);

const boolNote = (
	<>
		<div>Options for import: Yes, Y, True, 1, No, N, False, 0</div>
		<div>Note: Not case sensitive, Displayed as Yes/No</div>
	</>
);

const directionalSurveyChosenIdNote = (
	<>
		Unique Identifier; headers, production data, and directional survey are mapped based on this ID.
		<br />
		In case of duplicate Chosen ID only the first instance will be loaded.
	</>
);

export const HEADER_TOOLTIP = {
	[WELL_HEADER_NAME]: {
		chosenID: 'Unique Identifier; headers, production data, and directional survey are mapped based on this ID.',
		well_name: 'Case or Lease Name',
		sg: 'Percentage',
		so: 'Percentage',
		sw: 'Percentage',
		custom_bool_0: boolNote,
		custom_bool_1: boolNote,
		custom_bool_2: boolNote,
		custom_bool_3: boolNote,
		custom_bool_4: boolNote,
	},
	[PROD_MONTHLY_NAME]: {
		chosenID: 'Unique Identifier; headers, production data, and directional survey are mapped based on this ID.',
		date: dateFormats,
		day: 'Whole number between 1 and 31',
		month: 'Whole number between 1 and 12',
		year: '<Format YYYY>',
	},
	[PROD_DAILY_NAME]: {
		chosenID: 'Unique Identifier; headers, production data, and directional survey are mapped based on this ID.',
		date: dateFormats,
		day: 'Whole number between 1 and 31',
		month: 'Whole number between 1 and 12',
		year: '<Format YYYY>',
	},
	[DIRECTIONAL_SURVEY_NAME]: {
		chosenID: directionalSurveyChosenIdNote,
		measuredDepth: 'Measured depth must be sorted incrementally for each well',
	},
};

export const BASE_REQUIRED_WELL_HEADERS = {
	chosenID: true,
	surfaceLatitude: { ifPresent: [['surfaceLongitude']] },
	surfaceLongitude: { ifPresent: [['surfaceLatitude']] },
	toeLatitude: { ifPresent: [['toeLongitude']] },
	toeLongitude: { ifPresent: [['toeLatitude']] },
	heelLatitude: { ifPresent: [['heelLongitude']] },
	heelLongitude: { ifPresent: [['heelLatitude']] },
};

const BASE_IMPORTANT_WELL_HEADERS = {
	chosenID: true,
};

export function useHeaders() {
	const { wellHeaders } = useAlfa();
	return useMemo(() => {
		const template = {};
		Object.entries(wellHeaders)
			.filter(([id]) => WELL_HEADERS_TO_MAP.includes(id))
			.forEach(([id, label]) => {
				const required = BASE_REQUIRED_WELL_HEADERS[id] ?? false;
				const important = BASE_IMPORTANT_WELL_HEADERS[id] ?? false;
				template[id] = { label, required, important };
			});
		return template;
	}, [wellHeaders]);
}
