import { faker } from '@faker-js/faker/locale/en_US';

import { MonthlyProductionServiceUpsertRequest } from './gen/combocurve/dal/v1/monthly_production';
import { ExternalMonthlyProductionServiceUpsertRequest } from './gen/combocurve/external/v1/monthly_production';

type MonthlyProduction = Required<Omit<MonthlyProductionServiceUpsertRequest, 'fieldMask'>>;

const FIELD_MASK_VALUES = [
	'well',
	'date',
	'project',
	'choke',
	'co2_injection',
	'days_on',
	'gas',
	'gas_injection',
	'ngl',
	'oil',
	'steam_injection',
	'water',
	'water_injection',
	'custom_number_0',
	'custom_number_1',
	'custom_number_2',
	'custom_number_3',
	'custom_number_4',
	'operational_tag',
] as const;

export const generateMonthlyProduction = (): MonthlyProduction => ({
	choke: faker.datatype.float({ min: 0, max: 1000 }),
	co2Injection: faker.datatype.float({ min: 0, max: 1000 }),
	customNumber0: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber1: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber2: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber3: faker.datatype.float({ min: 0, max: 10000 }),
	customNumber4: faker.datatype.float({ min: 0, max: 10000 }),
	date: faker.date.past(40),
	daysOn: faker.datatype.float({ min: 0, max: 30, precision: 1 }),
	gas: faker.datatype.float({ min: 0, max: 15000 }),
	gasInjection: faker.datatype.float({ min: 0, max: 1000 }),
	ngl: faker.datatype.float({ min: 0, max: 8000 }),
	oil: faker.datatype.float({ min: 0, max: 150000 }),
	operationalTag: faker.datatype.string(),
	project: faker.database.mongodbObjectId(),
	steamInjection: faker.datatype.float({ min: 0, max: 1000 }),
	water: faker.datatype.float({ min: 0, max: 40000 }),
	waterInjection: faker.datatype.float({ min: 0, max: 1000 }),
	well: faker.database.mongodbObjectId(),
});

export const generateMonthlyProductionPerWell = function* (wellId: string, n: number): Generator<MonthlyProduction> {
	for (let i = 0; i < n; i++) {
		yield {
			...generateMonthlyProduction(),
			well: wellId,
		} satisfies MonthlyProduction;
	}
};

export const generateMonthlyProductionRequest = ():
	| MonthlyProductionServiceUpsertRequest
	| ExternalMonthlyProductionServiceUpsertRequest =>
	({
		...generateMonthlyProduction(),
		fieldMask: faker.helpers.maybe(() => faker.helpers.arrayElements(FIELD_MASK_VALUES), { probability: 0.3 }),
	} satisfies ExternalMonthlyProductionServiceUpsertRequest);
