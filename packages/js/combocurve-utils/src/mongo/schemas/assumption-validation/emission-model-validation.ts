enum CarbonEmissionProduct {
	co2e = 'co2e',
	co2 = 'co2',
	ch4 = 'ch4',
	n2o = 'n2o',
}

enum EmissionCategory {
	associated_gas = 'associated_gas',
	acid_gas_removal_units = 'acid_gas_removal_units',
	centrifugal_compressor = 'centrifugal_compressor',
	eor_hydrocarbon_liquids = 'eor_hydrocarbon_liquids',
	eor_injection_pumps = 'eor_injection_pumps',
	liquids_unloading = 'liquids_unloading',
	pneumatic_device = 'pneumatic_device',
	dehydrators = 'dehydrators',
	equipment_leaks = 'equipment_leaks',
	atmospheric_tank = 'atmospheric_tank',
	reciprocating_compressor = 'reciprocating_compressor',
	completions_with_fracturing = 'completions_with_fracturing',
	completions_without_fracturing = 'completions_without_fracturing',
	drilling = 'drilling',
	completion = 'completion',
	combustion = 'combustion',
	pneumatic_pump = 'pneumatic_pump',
	well_testing = 'well_testing',
	blowdown_vent_stacks = 'blowdown_vent_stacks',
	flare = 'flare',
	scope2 = 'scope2',
	scope3 = 'scope3',
}

enum EmissionUnitKey {
	mt_per_mbbl = 'mt_per_mbbl',
	mt_per_mmcf = 'mt_per_mmcf',
	mt_per_mboe = 'mt_per_mboe',
	mt_per_well_per_year = 'mt_per_well_per_year',
	mt_per_new_well = 'mt_per_new_well',
}

interface EmissionRowData {
	selected: boolean;
	category: EmissionCategory;
	[CarbonEmissionProduct.co2e]: number;
	[CarbonEmissionProduct.co2]: number;
	[CarbonEmissionProduct.ch4]: number;
	[CarbonEmissionProduct.n2o]: number;
	unit: EmissionUnitKey;
	/** Either the escalation model id or `EMISSION_ROW_DATA_EMISSION_NONE` */
	escalation_model: string;
}

type EmissionTableData = EmissionRowData[];

interface EmissionData {
	table: EmissionTableData;
}

const NUMBER_MIN = -1e10;
const NUMBER_MAX = 1e10;

function checkNumberValid(num: number) {
	return Number.isFinite(num) && num >= NUMBER_MIN && num <= NUMBER_MAX;
}

function checkRowDataTypeValid(rowData: EmissionRowData) {
	return (
		typeof rowData.selected === 'boolean' && // selected
		Object.keys(EmissionCategory).includes(rowData.category) && // category
		checkNumberValid(rowData[CarbonEmissionProduct.co2e]) && // co2e
		checkNumberValid(rowData[CarbonEmissionProduct.co2]) && // co2
		checkNumberValid(rowData[CarbonEmissionProduct.ch4]) && // ch4
		checkNumberValid(rowData[CarbonEmissionProduct.n2o]) && // n2o
		Object.keys(EmissionUnitKey).includes(rowData.unit) && // unit
		typeof rowData.escalation_model === 'string' // escalation_model
	);
}

function checkRowWarning(rowData: EmissionRowData) {
	const hasCo2e = !!rowData[CarbonEmissionProduct.co2e];
	const hasOtherProducts =
		!!rowData[CarbonEmissionProduct.co2] ||
		!!rowData[CarbonEmissionProduct.ch4] ||
		!!rowData[CarbonEmissionProduct.n2o];
	return (hasCo2e && hasOtherProducts) || !checkRowDataTypeValid(rowData);
}

export function checkEmissionModelDataValid(data: EmissionData) {
	for (const row of data.table) {
		if (checkRowWarning(row)) return false;
	}

	return true;
}
