import { faker } from '@faker-js/faker/locale/en_US';

import { DailyProductionServiceUpsertRequest } from './gen/combocurve/dal/v1/daily_production';
import { ExternalDailyProductionServiceUpsertRequest } from './gen/combocurve/external/v1/daily_production';

type DailyProduction = Required<Omit<DailyProductionServiceUpsertRequest, 'fieldMask'>>;

const FIELD_MASK_VALUES = [
	'well',
	'date',
	'project',
	'bottom_hole_pressure',
	'casing_head_pressure',
	'choke',
	'co2_injection',
	'flowline_pressure',
	'gas',
	'gas_injection',
	'gas_lift_injection_pressure',
	'hours_on',
	'ngl',
	'oil',
	'steam_injection',
	'tubing_head_pressure',
	'vessel_separator_pressure',
	'water',
	'water_injection',
	'custom_number_0',
	'custom_number_1',
	'custom_number_2',
	'custom_number_3',
	'custom_number_4',
	'operational_tag',
] as const;

export const generateDailyProduction = (): DailyProduction => ({
	bottomHolePressure: faker.datatype.float({ min: 0, max: 1000 }),
	casingHeadPressure: faker.datatype.float({ min: 0, max: 10000 }),
	choke: faker.datatype.float({ min: 0, max: 3000 }),
	co2Injection: faker.datatype.float({ min: 0, max: 1000 }),
	customNumber0: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber1: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber2: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber3: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber4: faker.datatype.float({ min: 0, max: 10000 }),
	date: faker.date.past(40),
	flowlinePressure: faker.datatype.float({ min: 0, max: 5000 }),
	gas: faker.datatype.float({ min: 0, max: 15000 }),
	gasInjection: faker.datatype.float({ min: 0, max: 1000 }),
	gasLiftInjectionPressure: faker.datatype.float({ min: 0, max: 1000 }),
	hoursOn: faker.datatype.float({ min: 0, max: 23, precision: 1 }),
	ngl: faker.datatype.float({ min: 0, max: 8000 }),
	oil: faker.datatype.float({ min: 0, max: 150000 }),
	operationalTag: faker.datatype.string(),
	project: faker.database.mongodbObjectId(),
	steamInjection: faker.datatype.float({ min: 0, max: 1000 }),
	tubingHeadPressure: faker.datatype.float({ min: 0, max: 4500 }),
	vesselSeparatorPressure: faker.datatype.float({ min: 0, max: 4500 }),
	water: faker.datatype.float({ min: 0, max: 40000 }),
	waterInjection: faker.datatype.float({ min: 0, max: 1000 }),
	well: faker.database.mongodbObjectId(),
});

export const generateDailyProductionPerWell = function* (wellId: string, n: number): Generator<DailyProduction> {
	for (let i = 0; i < n; i++) {
		yield {
			...generateDailyProduction(),
			well: wellId,
		} satisfies DailyProduction;
	}
};

export const generateDailyProductionRequest = ():
	| DailyProductionServiceUpsertRequest
	| ExternalDailyProductionServiceUpsertRequest =>
	({
		...generateDailyProduction(),
		fieldMask: faker.helpers.maybe(() => faker.helpers.arrayElements(FIELD_MASK_VALUES), { probability: 0.3 }),
	} satisfies ExternalDailyProductionServiceUpsertRequest);
