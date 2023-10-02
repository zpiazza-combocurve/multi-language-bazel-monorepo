import { model, Types } from 'mongoose';
import { merge } from 'lodash';

import {
	BOOLEAN_FIELD,
	DATE_FIELD,
	getStringEnumField,
	IFieldDefinition,
	NUMBER_FIELD,
	OBJECT_ID_FIELD,
	STRING_FIELD,
} from '@src/helpers/fields';
import { COMPANY_SCOPE_FILTER, IFilter, ISort } from '@src/helpers/mongo-queries';
import { DATA_POOLS, DATA_SOURCES, IMPORT_TYPES, IWell, DataSource as ModelDataSource } from '@src/models/wells';
import {
	filterableDeleteDbFields,
	filterableReadDbFields,
	getApiDbSort,
	getApiDeleteDbFilters,
	getApiField,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IReadFieldOptions,
	readDbField,
	sortableDbFields,
	Write,
} from '@src/api/v1/fields';
import { getParseString, isString, parseString } from '@src/helpers/validation';
import { IReadWriteFieldOptions, IUpdate } from '@src/api/v1/fields';
import { isNil, isOneOf, notNil } from '@src/helpers/typing';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IStringFieldDefinition } from '@src/helpers/fields/field-definition';
import { WellSchema } from '@src/schemas';

import { validateChosenIDFormat, validateWellApiFormat } from './validation';

export const READ_RECORD_LIMIT = 1000;
export const WRITE_RECORD_LIMIT = 1000;
export const CHOSENID_MAX_LENGTH = 32;

export const defaultWell = new (model<IWell>('defaultWell', WellSchema))({});

export type IWellKey = keyof IWell;

interface IWellFieldOptions extends IReadWriteFieldOptions {
	// TODO: well is supposed to be an `ApiWell`, but it cannot be specified that way to avoid circular type definition
	requiredCondition?: (well: Record<string, unknown>) => boolean;
}

export interface IWellField<T, TParsed = IWell[keyof IWell]> extends IField<IWell, T, TParsed> {
	options?: IWellFieldOptions;
}

export interface IReplace {
	id: Types.ObjectId;
	update: Partial<IWell>;
	remove: IWellKey[];
}

const isFieldPresent = (fieldName: string) => (well: Record<string, unknown>) =>
	well[fieldName] !== null && well[fieldName] !== undefined;

const readField = <K extends keyof IWell, TParsed = IWell[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
): IWellField<IWell[K], TParsed> => readDbField<IWell, K, TParsed>(key, definition, options);

const readEmptyWriteField = <K extends keyof IWell>(
	key: K,
	definition: IFieldDefinition<IWell[K]>,
	options: IWellFieldOptions = {},
): IWellField<IWell[K]> => {
	return {
		...readField(key, definition, options),
		write: () => {
			// do nothing
		},
	};
};

const readWriteField = <K extends keyof IWell>(
	key: K,
	definition: IFieldDefinition<IWell[K]>,
	options: IWellFieldOptions = {},
): IWellField<IWell[K]> => {
	const {
		sortable = false,
		filterOption = { read: { filterValues: false }, delete: { filterValues: false } },
		isRequired = false,
		isNullable = false,
		requiredCondition,
	} = options;

	const field = readField(key, definition, { sortable, filterOption });

	return {
		...field,
		write: (well, value) => (well[key] = value),
		options: { ...field.options, isRequired, isNullable, requiredCondition },
		remove: (well) => {
			if (defaultWell[key] !== undefined) {
				well[key] = defaultWell[key];
				return [];
			}
			delete well[key];
			return [key];
		},
	};
};

const dataSourceField: IWellField<ModelDataSource> = {
	...readWriteField('dataSource', getStringEnumField(DATA_SOURCES), {
		isRequired: true,
		sortable: true,
		filterOption: { read: { filterValues: 1 }, delete: { filterValues: 1 } },
	}),
	write: (well, value) => {
		well.dataSource = value;
		well['dataPool'] = value === 'internal' ? 'internal' : 'external';
	},
};

const scopeField: IWellField<'project' | 'company'> = {
	...getStringEnumField(['project', 'company']),
	read: (well) => (well.project ? 'project' : 'company'),
};

const chosenIDFieldDefinition: IStringFieldDefinition = {
	...STRING_FIELD,
	maxLength: CHOSENID_MAX_LENGTH,
	parse: (value, location) => {
		const parsedValue = getParseString(CHOSENID_MAX_LENGTH)(value, location);
		validateChosenIDFormat(parsedValue, 'chosenID', location);
		return parsedValue;
	},
};

const api14FieldDefinition: IStringFieldDefinition = {
	...STRING_FIELD,
	parse: (value, location) => {
		const parsedValue = parseString(value, location);
		validateWellApiFormat(parsedValue, 'api14', 14, location);
		// Ensure that there is no conflict between the general format for chosenID and the particular one for api14:
		validateChosenIDFormat(parsedValue, 'api14', location);
		return parsedValue;
	},
};

const api12FieldDefinition: IStringFieldDefinition = {
	...STRING_FIELD,
	parse: (value, location) => {
		const parsedValue = parseString(value, location);
		validateWellApiFormat(parsedValue, 'api12', 12, location);
		return parsedValue;
	},
};

const api10FieldDefinition: IStringFieldDefinition = {
	...STRING_FIELD,
	parse: (value, location) => {
		const parsedValue = parseString(value, location);
		validateWellApiFormat(parsedValue, 'api10', 10, location);
		return parsedValue;
	},
};

const API_WELL_FIELDS = {
	id: readEmptyWriteField('_id', OBJECT_ID_FIELD, {
		sortable: true,
		allowCursor: true,
		filterOption: {
			delete: { filterValues: 100 },
		},
	}),

	dataPool: readField('dataPool', getStringEnumField(DATA_POOLS)),
	surfaceLatitude: readWriteField('surfaceLatitude', NUMBER_FIELD, {
		isNullable: true,
		requiredCondition: isFieldPresent('surfaceLongitude'),
	}),
	surfaceLongitude: readWriteField('surfaceLongitude', NUMBER_FIELD, {
		isNullable: true,
		requiredCondition: isFieldPresent('surfaceLatitude'),
	}),
	toeLatitude: readWriteField('toeLatitude', NUMBER_FIELD, { requiredCondition: isFieldPresent('toeLongitude') }),
	toeLongitude: readWriteField('toeLongitude', NUMBER_FIELD, { requiredCondition: isFieldPresent('toeLatitude') }),
	heelLatitude: readWriteField('heelLatitude', NUMBER_FIELD, { requiredCondition: isFieldPresent('heelLongitude') }),
	heelLongitude: readWriteField('heelLongitude', NUMBER_FIELD, { requiredCondition: isFieldPresent('heelLatitude') }),
	dataSourceCustomName: readWriteField('dataSourceCustomName', STRING_FIELD),
	abstract: readWriteField('abstract', STRING_FIELD),
	acreSpacing: readWriteField('acre_spacing', NUMBER_FIELD),
	allocationType: readWriteField('allocation_type', STRING_FIELD),
	api10: readWriteField('api10', api10FieldDefinition, {
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	api12: readWriteField('api12', api12FieldDefinition, {
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	api14: readWriteField('api14', api14FieldDefinition, {
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	ariesId: readWriteField('aries_id', STRING_FIELD),
	azimuth: readWriteField('azimuth', NUMBER_FIELD),
	basin: readWriteField('basin', STRING_FIELD),
	bg: readWriteField('bg', NUMBER_FIELD),
	block: readWriteField('block', STRING_FIELD),
	bo: readWriteField('bo', NUMBER_FIELD),
	bubblePointPress: readWriteField('bubble_point_press', NUMBER_FIELD),
	casingId: readWriteField('casing_id', NUMBER_FIELD),
	chokeSize: readWriteField('choke_size', NUMBER_FIELD),
	completionDesign: readWriteField('completion_design', STRING_FIELD),
	completionEndDate: readWriteField('completion_end_date', DATE_FIELD),
	completionStartDate: readWriteField('completion_start_date', DATE_FIELD),
	county: readWriteField('county', STRING_FIELD, { sortable: true, filterOption: { read: { filterValues: 100 } } }),
	country: readWriteField('country', STRING_FIELD),
	currentOperatorAlias: readWriteField('current_operator_alias', STRING_FIELD),
	currentOperatorCode: readWriteField('current_operator_code', STRING_FIELD),
	currentOperatorTicker: readWriteField('current_operator_ticker', STRING_FIELD),
	currentOperator: readWriteField('current_operator', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	dateRigRelease: readWriteField('date_rig_release', DATE_FIELD),
	dewPointPress: readWriteField('dew_point_press', NUMBER_FIELD),
	distanceFromBaseOfZone: readWriteField('distance_from_base_of_zone', NUMBER_FIELD),
	distanceFromTopOfZone: readWriteField('distance_from_top_of_zone', NUMBER_FIELD),
	district: readWriteField('district', STRING_FIELD),
	drainageArea: readWriteField('drainage_area', NUMBER_FIELD),
	drillEndDate: readWriteField('drill_end_date', DATE_FIELD),
	drillStartDate: readWriteField('drill_start_date', DATE_FIELD),
	drillinginfoId: readWriteField('drillinginfo_id', STRING_FIELD),
	elevationType: readWriteField('elevation_type', STRING_FIELD),
	elevation: readWriteField('elevation', NUMBER_FIELD),
	field: readWriteField('field', STRING_FIELD),
	firstAdditiveVolume: readWriteField('first_additive_volume', NUMBER_FIELD),
	firstClusterCount: readWriteField('first_cluster_count', NUMBER_FIELD),
	firstTestFlowTbgPress: readWriteField('first_test_flow_tbg_press', NUMBER_FIELD),
	firstTestGor: readWriteField('first_test_gor', NUMBER_FIELD),
	firstTestGasVol: readWriteField('first_test_gas_vol', NUMBER_FIELD),
	firstTestOilVol: readWriteField('first_test_oil_vol', NUMBER_FIELD),
	firstTestWaterVol: readWriteField('first_test_water_vol', NUMBER_FIELD),
	firstFluidVolume: readWriteField('first_fluid_volume', NUMBER_FIELD, { isNullable: true }),
	firstFracVendor: readWriteField('first_frac_vendor', STRING_FIELD),
	firstMaxInjectionPressure: readWriteField('first_max_injection_pressure', NUMBER_FIELD),
	firstMaxInjectionRate: readWriteField('first_max_injection_rate', NUMBER_FIELD),
	firstProdDate: readWriteField('first_prod_date', DATE_FIELD, { sortable: true }),
	firstPropWeight: readWriteField('first_prop_weight', NUMBER_FIELD, { isNullable: true }),
	firstStageCount: readWriteField('first_stage_count', NUMBER_FIELD),
	firstTreatmentType: readWriteField('first_treatment_type', STRING_FIELD),
	flowPath: readWriteField('flow_path', STRING_FIELD),
	fluidType: readWriteField('fluid_type', STRING_FIELD),
	footageInLandingZone: readWriteField('footage_in_landing_zone', NUMBER_FIELD),
	formationThicknessMean: readWriteField('formation_thickness_mean', NUMBER_FIELD),
	fractureConductivity: readWriteField('fracture_conductivity', NUMBER_FIELD),
	gasAnalysisDate: readWriteField('gas_analysis_date', DATE_FIELD),
	gasC1: readWriteField('gas_c1', NUMBER_FIELD),
	gasC2: readWriteField('gas_c2', NUMBER_FIELD),
	gasC3: readWriteField('gas_c3', NUMBER_FIELD),
	gasCo2: readWriteField('gas_co2', NUMBER_FIELD),
	gasGatherer: readWriteField('gas_gatherer', STRING_FIELD),
	gasH2: readWriteField('gas_h2', NUMBER_FIELD),
	gasH2o: readWriteField('gas_h2o', NUMBER_FIELD),
	gasH2s: readWriteField('gas_h2s', NUMBER_FIELD),
	gasHe: readWriteField('gas_he', NUMBER_FIELD),
	gasIc4: readWriteField('gas_ic4', NUMBER_FIELD),
	gasIc5: readWriteField('gas_ic5', NUMBER_FIELD),
	gasN2: readWriteField('gas_n2', NUMBER_FIELD),
	gasNc4: readWriteField('gas_nc4', NUMBER_FIELD),
	gasNc5: readWriteField('gas_nc5', NUMBER_FIELD),
	gasNc6: readWriteField('gas_nc6', NUMBER_FIELD),
	gasNc7: readWriteField('gas_nc7', NUMBER_FIELD),
	gasNc8: readWriteField('gas_nc8', NUMBER_FIELD),
	gasNc9: readWriteField('gas_nc9', NUMBER_FIELD),
	gasNc10: readWriteField('gas_nc10', NUMBER_FIELD),
	gasO2: readWriteField('gas_o2', NUMBER_FIELD),
	gasSpecificGravity: readWriteField('gas_specific_gravity', NUMBER_FIELD),
	grossPerforatedInterval: readWriteField('gross_perforated_interval', NUMBER_FIELD),
	groundElevation: readWriteField('ground_elevation', NUMBER_FIELD),
	holeDirection: readWriteField('hole_direction', STRING_FIELD),
	horizontalSpacing: readWriteField('horizontal_spacing', NUMBER_FIELD),
	hzWellSpacingAnyZone: readWriteField('hz_well_spacing_any_zone', NUMBER_FIELD),
	hzWellSpacingSameZone: readWriteField('hz_well_spacing_same_zone', NUMBER_FIELD),
	ihsId: readWriteField('ihs_id', STRING_FIELD),
	initialRespress: readWriteField('initial_respress', NUMBER_FIELD),
	initialRestemp: readWriteField('initial_restemp', NUMBER_FIELD),
	landingZoneBase: readWriteField('landing_zone_base', NUMBER_FIELD),
	landingZoneTop: readWriteField('landing_zone_top', NUMBER_FIELD),
	landingZone: readWriteField('landing_zone', STRING_FIELD),
	lateralLength: readWriteField('lateral_length', NUMBER_FIELD, { isNullable: true }),
	leaseName: readWriteField('lease_name', STRING_FIELD),
	leaseNumber: readWriteField('lease_number', STRING_FIELD),
	lowerPerforation: readWriteField('lower_perforation', NUMBER_FIELD),
	matrixPermeability: readWriteField('matrix_permeability', NUMBER_FIELD),
	measuredDepth: readWriteField('measured_depth', NUMBER_FIELD, { isNullable: true }),
	nglGatherer: readWriteField('ngl_gatherer', STRING_FIELD),
	numTreatmentRecords: readWriteField('num_treatment_records', NUMBER_FIELD),
	oilApiGravity: readWriteField('oil_api_gravity', NUMBER_FIELD),
	oilGatherer: readWriteField('oil_gatherer', STRING_FIELD),
	oilSpecificGravity: readWriteField('oil_specific_gravity', NUMBER_FIELD),
	padName: readWriteField('pad_name', STRING_FIELD),
	parentChildAnyZone: readWriteField('parent_child_any_zone', STRING_FIELD),
	parentChildSameZone: readWriteField('parent_child_same_zone', STRING_FIELD),
	percentInZone: readWriteField('percent_in_zone', NUMBER_FIELD),
	perfLateralLength: readWriteField('perf_lateral_length', NUMBER_FIELD, { isNullable: true }),
	permitDate: readWriteField('permit_date', DATE_FIELD),
	phdwinId: readWriteField('phdwin_id', STRING_FIELD),
	play: readWriteField('play', STRING_FIELD),
	porosity: readWriteField('porosity', NUMBER_FIELD),
	previousOperatorAlias: readWriteField('previous_operator_alias', STRING_FIELD),
	previousOperatorCode: readWriteField('previous_operator_code', STRING_FIELD),
	previousOperatorTicker: readWriteField('previous_operator_ticker', STRING_FIELD),
	previousOperator: readWriteField('previous_operator', STRING_FIELD),
	primaryProduct: readWriteField('primary_product', STRING_FIELD, { isNullable: true }),
	prmsReservesCategory: readWriteField('prms_reserves_category', STRING_FIELD),
	prmsReservesSubCategory: readWriteField('prms_reserves_sub_category', STRING_FIELD),
	prmsResourcesClass: readWriteField('prms_resources_class', STRING_FIELD),
	productionMethod: readWriteField('production_method', STRING_FIELD),
	proppantMeshSize: readWriteField('proppant_mesh_size', STRING_FIELD),
	proppantType: readWriteField('proppant_type', STRING_FIELD),
	range: readWriteField('range', STRING_FIELD),
	recoveryMethod: readWriteField('recovery_method', STRING_FIELD),
	refracAdditiveVolume: readWriteField('refrac_additive_volume', NUMBER_FIELD),
	refracClusterCount: readWriteField('refrac_cluster_count', NUMBER_FIELD),
	refracDate: readWriteField('refrac_date', DATE_FIELD),
	refracFluidVolume: readWriteField('refrac_fluid_volume', NUMBER_FIELD),
	refracFracVendor: readWriteField('refrac_frac_vendor', STRING_FIELD),
	refracMaxInjectionPressure: readWriteField('refrac_max_injection_pressure', NUMBER_FIELD),
	refracMaxInjectionRate: readWriteField('refrac_max_injection_rate', NUMBER_FIELD),
	refracPropWeight: readWriteField('refrac_prop_weight', NUMBER_FIELD),
	refracStageCount: readWriteField('refrac_stage_count', NUMBER_FIELD),
	refracTreatmentType: readWriteField('refrac_treatment_type', STRING_FIELD),
	rig: readWriteField('rig', STRING_FIELD),
	rs: readWriteField('rs', NUMBER_FIELD),
	rsegId: readWriteField('rseg_id', STRING_FIELD),
	section: readWriteField('section', STRING_FIELD),
	sg: readWriteField('sg', NUMBER_FIELD),
	so: readWriteField('so', NUMBER_FIELD),
	spudDate: readWriteField('spud_date', DATE_FIELD),
	stageSpacing: readWriteField('stage_spacing', NUMBER_FIELD),
	state: readWriteField('state', STRING_FIELD, { sortable: true, filterOption: { read: { filterValues: 100 } } }),
	status: readWriteField('status', STRING_FIELD),
	subplay: readWriteField('subplay', STRING_FIELD),
	survey: readWriteField('survey', STRING_FIELD),
	sw: readWriteField('sw', NUMBER_FIELD),
	targetFormation: readWriteField('target_formation', STRING_FIELD),
	tgsId: readWriteField('tgs_id', STRING_FIELD),
	thickness: readWriteField('thickness', NUMBER_FIELD),
	til: readWriteField('til', DATE_FIELD),
	toeInLandingZone: readWriteField('toe_in_landing_zone', STRING_FIELD),
	toeUp: readWriteField('toe_up', STRING_FIELD),
	township: readWriteField('township', STRING_FIELD),
	trueVerticalDepth: readWriteField('true_vertical_depth', NUMBER_FIELD, { isNullable: true }),
	tubingDepth: readWriteField('tubing_depth', NUMBER_FIELD),
	tubingId: readWriteField('tubing_id', NUMBER_FIELD),
	typeCurveArea: readWriteField('type_curve_area', STRING_FIELD),
	upperPerforation: readWriteField('upper_perforation', NUMBER_FIELD),
	verticalSpacing: readWriteField('vertical_spacing', NUMBER_FIELD),
	vtWellSpacingAnyZone: readWriteField('vt_well_spacing_any_zone', NUMBER_FIELD),
	vtWellSpacingSameZone: readWriteField('vt_well_spacing_same_zone', NUMBER_FIELD),
	wellName: readWriteField('well_name', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	wellNumber: readWriteField('well_number', STRING_FIELD),
	wellType: readWriteField('well_type', STRING_FIELD),
	zi: readWriteField('zi', NUMBER_FIELD),
	customString0: readWriteField('custom_string_0', STRING_FIELD),
	customString1: readWriteField('custom_string_1', STRING_FIELD),
	customString2: readWriteField('custom_string_2', STRING_FIELD),
	customString3: readWriteField('custom_string_3', STRING_FIELD),
	customString4: readWriteField('custom_string_4', STRING_FIELD),
	customString5: readWriteField('custom_string_5', STRING_FIELD),
	customString6: readWriteField('custom_string_6', STRING_FIELD),
	customString7: readWriteField('custom_string_7', STRING_FIELD),
	customString8: readWriteField('custom_string_8', STRING_FIELD),
	customString9: readWriteField('custom_string_9', STRING_FIELD),
	customString10: readWriteField('custom_string_10', STRING_FIELD),
	customString11: readWriteField('custom_string_11', STRING_FIELD),
	customString12: readWriteField('custom_string_12', STRING_FIELD),
	customString13: readWriteField('custom_string_13', STRING_FIELD),
	customString14: readWriteField('custom_string_14', STRING_FIELD),
	customString15: readWriteField('custom_string_15', STRING_FIELD),
	customString16: readWriteField('custom_string_16', STRING_FIELD),
	customString17: readWriteField('custom_string_17', STRING_FIELD),
	customString18: readWriteField('custom_string_18', STRING_FIELD),
	customString19: readWriteField('custom_string_19', STRING_FIELD),
	customNumber0: readWriteField('custom_number_0', NUMBER_FIELD),
	customNumber1: readWriteField('custom_number_1', NUMBER_FIELD),
	customNumber2: readWriteField('custom_number_2', NUMBER_FIELD),
	customNumber3: readWriteField('custom_number_3', NUMBER_FIELD),
	customNumber4: readWriteField('custom_number_4', NUMBER_FIELD),
	customNumber5: readWriteField('custom_number_5', NUMBER_FIELD),
	customNumber6: readWriteField('custom_number_6', NUMBER_FIELD),
	customNumber7: readWriteField('custom_number_7', NUMBER_FIELD),
	customNumber8: readWriteField('custom_number_8', NUMBER_FIELD),
	customNumber9: readWriteField('custom_number_9', NUMBER_FIELD),
	customNumber10: readWriteField('custom_number_10', NUMBER_FIELD),
	customNumber11: readWriteField('custom_number_11', NUMBER_FIELD),
	customNumber12: readWriteField('custom_number_12', NUMBER_FIELD),
	customNumber13: readWriteField('custom_number_13', NUMBER_FIELD),
	customNumber14: readWriteField('custom_number_14', NUMBER_FIELD),
	customNumber15: readWriteField('custom_number_15', NUMBER_FIELD),
	customNumber16: readWriteField('custom_number_16', NUMBER_FIELD),
	customNumber17: readWriteField('custom_number_17', NUMBER_FIELD),
	customNumber18: readWriteField('custom_number_18', NUMBER_FIELD),
	customNumber19: readWriteField('custom_number_19', NUMBER_FIELD),
	customDate0: readWriteField('custom_date_0', DATE_FIELD),
	customDate1: readWriteField('custom_date_1', DATE_FIELD),
	customDate2: readWriteField('custom_date_2', DATE_FIELD),
	customDate3: readWriteField('custom_date_3', DATE_FIELD),
	customDate4: readWriteField('custom_date_4', DATE_FIELD),
	customDate5: readWriteField('custom_date_5', DATE_FIELD),
	customDate6: readWriteField('custom_date_6', DATE_FIELD),
	customDate7: readWriteField('custom_date_7', DATE_FIELD),
	customDate8: readWriteField('custom_date_8', DATE_FIELD),
	customDate9: readWriteField('custom_date_9', DATE_FIELD),
	customBool0: readWriteField('custom_bool_0', BOOLEAN_FIELD),
	customBool1: readWriteField('custom_bool_1', BOOLEAN_FIELD),
	customBool2: readWriteField('custom_bool_2', BOOLEAN_FIELD),
	customBool3: readWriteField('custom_bool_3', BOOLEAN_FIELD),
	customBool4: readWriteField('custom_bool_4', BOOLEAN_FIELD),
	dataSource: dataSourceField,
	chosenKeyID: readWriteField('chosenKeyID', STRING_FIELD),

	chosenID: readWriteField('chosenID', chosenIDFieldDefinition, {
		sortable: true,
		filterOption: {
			read: { filterValues: 100 },
			delete: { filterValues: 100 },
		},
	}),

	inptID: readField('inptID', STRING_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),
	copied: readField('copied', BOOLEAN_FIELD),
	generic: readField('generic', BOOLEAN_FIELD),
	copiedFrom: readField('copiedFrom', OBJECT_ID_FIELD),
	mostRecentImportDesc: readField('mostRecentImportDesc', STRING_FIELD),
	mostRecentImportType: readField('mostRecentImportType', getStringEnumField(IMPORT_TYPES)),
	mostRecentImportDate: readField('mostRecentImportDate', DATE_FIELD, { sortable: true }),
	firstProppantPerFluid: readField('first_proppant_per_fluid', NUMBER_FIELD),
	refracProppantPerPerforatedInterval: readField('refrac_proppant_per_perforated_interval', NUMBER_FIELD),
	refracFluidPerPerforatedInterval: readField('refrac_fluid_per_perforated_interval', NUMBER_FIELD),
	refracProppantPerFluid: readField('refrac_proppant_per_fluid', NUMBER_FIELD),
	totalAdditiveVolume: readField('total_additive_volume', NUMBER_FIELD),
	totalClusterCount: readField('total_cluster_count', NUMBER_FIELD),
	totalFluidVolume: readField('total_fluid_volume', NUMBER_FIELD),
	totalPropWeight: readField('total_prop_weight', NUMBER_FIELD),
	totalProppantPerFluid: readField('total_proppant_per_fluid', NUMBER_FIELD),
	cumBoe: readField('cum_boe', NUMBER_FIELD),
	cumOil: readField('cum_oil', NUMBER_FIELD),
	cumGas: readField('cum_gas', NUMBER_FIELD),
	cumGor: readField('cum_gor', NUMBER_FIELD),
	cumWater: readField('cum_water', NUMBER_FIELD),
	cumMmcfge: readField('cum_mmcfge', NUMBER_FIELD),
	cumBoePerPerforatedInterval: readField('cum_boe_per_perforated_interval', NUMBER_FIELD),
	cumGasPerPerforatedInterval: readField('cum_gas_per_perforated_interval', NUMBER_FIELD),
	cumOilPerPerforatedInterval: readField('cum_oil_per_perforated_interval', NUMBER_FIELD),
	cumWaterPerPerforatedInterval: readField('cum_water_per_perforated_interval', NUMBER_FIELD),
	cumMmcfgePerPerforatedInterval: readField('cum_mmcfge_per_perforated_interval', NUMBER_FIELD),
	first12Boe: readField('first_12_boe', NUMBER_FIELD),
	first12BoePerPerforatedInterval: readField('first_12_boe_per_perforated_interval', NUMBER_FIELD),
	first12Gas: readField('first_12_gas', NUMBER_FIELD),
	first12GasPerPerforatedInterval: readField('first_12_gas_per_perforated_interval', NUMBER_FIELD),
	first12Gor: readField('first_12_gor', NUMBER_FIELD),
	first12Oil: readField('first_12_oil', NUMBER_FIELD),
	first12OilPerPerforatedInterval: readField('first_12_oil_per_perforated_interval', NUMBER_FIELD),
	first12Water: readField('first_12_water', NUMBER_FIELD),
	first12WaterPerPerforatedInterval: readField('first_12_water_per_perforated_interval', NUMBER_FIELD),
	first12Mmcfge: readField('first_12_mmcfge', NUMBER_FIELD),
	first12MmcfgePerPerforatedInterval: readField('first_12_mmcfge_per_perforated_interval', NUMBER_FIELD),
	first6Boe: readField('first_6_boe', NUMBER_FIELD),
	first6BoePerPerforatedInterval: readField('first_6_boe_per_perforated_interval', NUMBER_FIELD),
	first6Gas: readField('first_6_gas', NUMBER_FIELD),
	first6GasPerPerforatedInterval: readField('first_6_gas_per_perforated_interval', NUMBER_FIELD),
	first6Gor: readField('first_6_gor', NUMBER_FIELD),
	first6Mmcfge: readField('first_6_mmcfge', NUMBER_FIELD),
	first6MmcfgePerPerforatedInterval: readField('first_6_mmcfge_per_perforated_interval', NUMBER_FIELD),
	first6Oil: readField('first_6_oil', NUMBER_FIELD),
	first6OilPerPerforatedInterval: readField('first_6_oil_per_perforated_interval', NUMBER_FIELD),
	first6Water: readField('first_6_water', NUMBER_FIELD),
	first6WaterPerPerforatedInterval: readField('first_6_water_per_perforated_interval', NUMBER_FIELD),
	last12Boe: readField('last_12_boe', NUMBER_FIELD),
	last12BoePerPerforatedInterval: readField('last_12_boe_per_perforated_interval', NUMBER_FIELD),
	last12Gas: readField('last_12_gas', NUMBER_FIELD),
	last12GasPerPerforatedInterval: readField('last_12_gas_per_perforated_interval', NUMBER_FIELD),
	last12Gor: readField('last_12_gor', NUMBER_FIELD),
	last12Mmcfge: readField('last_12_mmcfge', NUMBER_FIELD),
	last12MmcfgePerPerforatedInterval: readField('last_12_mmcfge_per_perforated_interval', NUMBER_FIELD),
	last12Oil: readField('last_12_oil', NUMBER_FIELD),
	last12OilPerPerforatedInterval: readField('last_12_oil_per_perforated_interval', NUMBER_FIELD),
	last12Water: readField('last_12_water', NUMBER_FIELD),
	last12WaterPerPerforatedInterval: readField('last_12_water_per_perforated_interval', NUMBER_FIELD),
	lastMonthBoe: readField('last_month_boe', NUMBER_FIELD),
	lastMonthBoePerPerforatedInterval: readField('last_month_boe_per_perforated_interval', NUMBER_FIELD),
	lastMonthGas: readField('last_month_gas', NUMBER_FIELD),
	lastMonthGasPerPerforatedInterval: readField('last_month_gas_per_perforated_interval', NUMBER_FIELD),
	lastMonthGor: readField('last_month_gor', NUMBER_FIELD),
	lastMonthMmcfge: readField('last_month_mmcfge', NUMBER_FIELD),
	lastMonthMmcfgePerPerforatedInterval: readField('last_month_mmcfge_per_perforated_interval', NUMBER_FIELD),
	lastMonthOil: readField('last_month_oil', NUMBER_FIELD),
	lastMonthOilPerPerforatedInterval: readField('last_month_oil_per_perforated_interval', NUMBER_FIELD),
	lastMonthWater: readField('last_month_water', NUMBER_FIELD),
	lastMonthWaterPerPerforatedInterval: readField('last_month_water_per_perforated_interval', NUMBER_FIELD),
	firstProppantPerPerforatedInterval: readField('first_proppant_per_perforated_interval', NUMBER_FIELD),
	firstFluidPerPerforatedInterval: readField('first_fluid_per_perforated_interval', NUMBER_FIELD),
	totalFluidPerPerforatedInterval: readField('total_fluid_per_perforated_interval', NUMBER_FIELD),
	totalProppantPerPerforatedInterval: readField('total_proppant_per_perforated_interval', NUMBER_FIELD),
	totalStageCount: readField('total_stage_count', NUMBER_FIELD),
	hasDaily: readField('has_daily', BOOLEAN_FIELD),
	hasMonthly: readField('has_monthly', BOOLEAN_FIELD),
	firstProdDateDailyCalc: readField('first_prod_date_daily_calc', DATE_FIELD, { sortable: true }),
	firstProdDateMonthlyCalc: readField('first_prod_date_monthly_calc', DATE_FIELD, { sortable: true }),
	lastProdDateMonthly: readField('last_prod_date_monthly', DATE_FIELD, { sortable: true }),
	lastProdDateDaily: readField('last_prod_date_daily', DATE_FIELD, { sortable: true }),
	monthsProduced: readField('month_produced', NUMBER_FIELD),
	createdAt: readField('createdAt', DATE_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),
	updatedAt: readField('updatedAt', DATE_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),

	scope: scopeField,
};

export default API_WELL_FIELDS;

export type ApiWellKey = keyof typeof API_WELL_FIELDS;

export type WellField = (typeof API_WELL_FIELDS)[ApiWellKey];

type TypeOfField<FT> = FT extends IWellField<infer T> ? T : never;

export type ApiWell = { [key in ApiWellKey]?: TypeOfField<(typeof API_WELL_FIELDS)[key]> };

type DataSource = TypeOfField<typeof API_WELL_FIELDS.dataSource>;

// TODO: check which id we should use for ihs, aries and phdwin
export const chosenIdPerDataSource = {
	di: 'api14',
	ihs: 'chosenID',
	aries: 'chosenID',
	phdwin: 'chosenID',
	internal: 'chosenID',
	other: 'chosenID',
} as const;
export type PotentialChosenId = 'chosenID' | (typeof chosenIdPerDataSource)[DataSource];
export const potentialChosenIds = [
	...new Set<PotentialChosenId>(['chosenID', ...Object.values(chosenIdPerDataSource)]),
];

const getChosenIdFieldName = (well: Pick<ApiWell, 'dataSource' | PotentialChosenId>): ApiWellKey => {
	const actualChosenId = well.chosenID;
	if (isString(actualChosenId)) {
		return 'chosenID';
	}
	const alternateChosenIdName = chosenIdPerDataSource[well.dataSource ?? 'other'];
	if (isString(well[alternateChosenIdName])) {
		return alternateChosenIdName;
	}
	return 'chosenID';
};

export const toApiWell = (well: IWell): ApiWell => {
	const apiWell: Record<string, ApiWell[ApiWellKey]> = {};
	Object.entries(API_WELL_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiWell[field] = read(well);
		}
	});
	return apiWell;
};

export type ApiWellWithId = ApiWell & { id: Types.ObjectId };

export const toIReplace = (apiWell: ApiWellWithId): IReplace => {
	const well: Partial<IWell> = {};
	const { id } = apiWell;

	const chosenIdFieldName = getChosenIdFieldName(apiWell);

	const writeableFields = Object.entries(API_WELL_FIELDS)
		.map(
			([fieldName, field]) =>
				[
					fieldName as ApiWellKey,
					fieldName === chosenIdFieldName
						? makeChosenId(fieldName, field as IWellField<string | undefined>)
						: field,
				] as const,
		)
		.filter(([, { write }]) => write);

	const toRemove = writeableFields
		.filter(([fieldName]) => isNil(apiWell[fieldName]))
		.reduce<IWellKey[]>((removedFields, [, { remove }]) => [...removedFields, ...(remove ? remove(well) : [])], []);

	writeableFields
		.filter(([fieldName]) => notNil(apiWell[fieldName]))
		.forEach(([fieldName, { write }]) => {
			const value = apiWell[fieldName];
			const uWrite = write as Write<IWell, unknown>;
			uWrite(well, value);
		});

	// This is for cases were a field changes the value of another. If the field was marked for removal (because it
	// wasn't present in the input), but another field wrote to it, then it should be updated and not removed.
	const toUpdateSet = new Set(Object.keys(well).filter((k) => notNil(well[k as keyof IWell])));
	const toRemoveFinal = toRemove.filter((f) => !toUpdateSet.has(f));

	return { id, update: well, remove: toRemoveFinal };
};

export const toPartialWell = (apiWell: ApiWell, id: Types.ObjectId): IUpdate<IWell> => {
	const well: Partial<IWell> = {};
	let toRemove: IWellKey[] = [];

	Object.entries(apiWell).forEach(([field, value]) => {
		const apiWellField = getWellField(field, apiWell);

		if (apiWellField) {
			const { write, remove, options: { isNullable } = {} } = apiWellField;

			if (!isNullable && isNil(value)) {
				toRemove = [...toRemove, ...(remove ? remove(well) : [])];
			} else if (write) {
				const coercedWrite = write as (well: Partial<IWell>, value: unknown) => void;
				coercedWrite(well, value);
			}
		}
	});

	const toUpdateSet = new Set(Object.keys(well).map((k) => well[k as keyof IWell]));
	const toRemoveFinal = toRemove.filter((f) => !toUpdateSet.has(f));

	return { id, update: well, remove: toRemoveFinal };
};

export const getRequiredFields = ({
	dataSource,
	...rest
}: { dataSource?: string } & Pick<ApiWell, PotentialChosenId>): ApiWellKey[] => {
	const alwaysRequired = Object.entries(API_WELL_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiWellKey);

	if (dataSource === undefined || !isOneOf(dataSource, DATA_SOURCES)) {
		return [...alwaysRequired, 'chosenID'];
	}
	const chosenIdField = getChosenIdFieldName({ dataSource, ...rest });
	return [...alwaysRequired, chosenIdField];
};

export const getConditionallyRequiredFields = (well: ApiWell): ApiWellKey[] =>
	Object.entries(API_WELL_FIELDS)
		.filter(([, field]) => !!field?.options?.requiredCondition?.(well))
		.map(([key]) => key as ApiWellKey);

export const readOnlyFields = Object.entries(API_WELL_FIELDS)
	.filter(([, field]) => field.read && !field.write)
	.map(([key]) => key);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_WELL_FIELDS, getWellFieldAdditionalLogic, cursor);

export const sortableFields = sortableDbFields(API_WELL_FIELDS);

export const getDeleteFilters = (
	filters: ApiQueryFilters,
	scopeFilter: { [K in '_id' | 'project']?: unknown } = COMPANY_SCOPE_FILTER,
): IFilter =>
	getApiDeleteDbFilters(
		filters,
		API_WELL_FIELDS,
		{ value: { ...scopeFilter }, override: false },
		getWellFieldAdditionalLogic,
	);

export const getReadFilters = (
	filters: ApiQueryFilters,
	cursor?: IFilter,
	scopeFilter: { [K in '_id' | 'project']?: unknown } = COMPANY_SCOPE_FILTER,
): IFilter =>
	getApiReadDbFilters(
		filters,
		API_WELL_FIELDS,
		{ value: merge({ ...scopeFilter }, cursor || {}) },
		getWellFieldAdditionalLogic,
	);

export const filterableDeleteFields = filterableDeleteDbFields(API_WELL_FIELDS);

export const filterableReadFields = filterableReadDbFields(API_WELL_FIELDS);

const getWellFieldAdditionalLogic = (
	fieldName: string,
	field: (typeof API_WELL_FIELDS)[ApiWellKey],
	data?: ApiWell,
): (typeof API_WELL_FIELDS)[ApiWellKey] | undefined => {
	if (
		data &&
		isString(data.dataSource) &&
		isOneOf(data.dataSource, DATA_SOURCES) &&
		fieldName === getChosenIdFieldName(data)
	) {
		return makeChosenId(fieldName, field as IWellField<string | undefined>);
	}

	return undefined;
};

export const getWellField = (fieldName: string, data?: ApiWell): (typeof API_WELL_FIELDS)[ApiWellKey] | null =>
	getApiField(fieldName, API_WELL_FIELDS, (fieldName, field) => getWellFieldAdditionalLogic(fieldName, field, data));

const makeChosenId = (
	fieldName: ApiWellKey,
	{ write, ...rest }: IWellField<string | undefined>,
): IWellField<string | undefined> => ({
	...rest,
	write: (well, value) => {
		if (write) {
			write(well, value);
		}
		well.chosenID = value;
		well.chosenKeyID = well.chosenKeyID ?? fieldName;
	},
	remove: () => [],
	options: { isRequired: true },
});

export const getChosenId = (apiWell: ApiWell): string | undefined => {
	const chosenIdFieldName = getChosenIdFieldName(apiWell);
	const res = apiWell[chosenIdFieldName];
	return isString(res) ? res : undefined;
};
