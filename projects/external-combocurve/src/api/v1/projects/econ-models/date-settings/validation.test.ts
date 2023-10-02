/* eslint-disable @typescript-eslint/no-explicit-any */
import { MultipleValidationError } from '@src/api/v1/multi-error';
import { TypeError } from '@src/helpers/validation';

import { checkModelDuplicates, parseApiDateSettings } from './validation';

describe('v1/projects/econ-models/date-settings/validation.test', () => {
	describe('dateSetting and cutOff', () => {
		let validData: Record<string, any>;

		beforeEach(() => {
			validData = {
				id: '643438ed6c2cf900126a673f',
				name: 'jdh-risking-test1',
				unique: false,
				dateSetting: {
					maxWellLife: 50,
					asOfDate: { date: '2023-06-19' },
					discountDate: { dynamic: 'first_of_next_month' },
					cashFlowPriorAsOfDate: true,
					productionDataResolution: 'monthly',
					fpdSourceHierarchy: {
						firstFpdSource: { date: '2023-06-20' },
						secondFpdSource: { wellHeader: true },
						thirdFpdSource: { forecast: true },
						fourthFpdSource: { linkToWells: 'INPT.JNE6xtYFJd' },
						useForecastSchedule: false,
					},
				},
				cutOff: {
					maxCumCashFlow: true,
					minLife: { date: '2023-06-19' },
					triggerEclCapex: true,
					includeCapex: false,
					discount: 10,
					econLimitDelay: 20,
					alignDependentPhases: true,
				},
			};
		});

		it('should validate maxWellLife data type', () => {
			validData.dateSetting.maxWellLife = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate asOfDate data type', () => {
			validData.dateSetting.asOfDate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `asOfDate`: `invalid`. `asOfDate` must be an object',
			);
		});

		it('should validate discountDate data type', () => {
			validData.dateSetting.discountDate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `discountDate`: `invalid`. `discountDate` must be an object',
			);
		});

		it('should validate cashFlowPriorAsOfDate data type', () => {
			validData.dateSetting.cashFlowPriorAsOfDate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate productionDataResolution data type', () => {
			validData.dateSetting.productionDataResolution = '123';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'`dateSetting.productionDataResolution` must be one of the following values: same_as_forecast, monthly, daily',
			);
		});

		it('should validate fpdSourceHierarchy.firstFpdSource data type', () => {
			validData.dateSetting.fpdSourceHierarchy.firstFpdSource = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `firstFpdSource`: `invalid`. `firstFpdSource` must be an object.',
			);
		});

		it('should validate fpdSourceHierarchy.secondFpdSource data type', () => {
			validData.dateSetting.fpdSourceHierarchy.secondFpdSource = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `secondFpdSource`: `invalid`. `secondFpdSource` must be an object.',
			);
		});

		it('should validate fpdSourceHierarchy.thirdFpdSource data type', () => {
			validData.dateSetting.fpdSourceHierarchy.thirdFpdSource = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `thirdFpdSource`: `invalid`. `thirdFpdSource` must be an object.',
			);
		});

		it('should validate fpdSourceHierarchy.fourthFpdSource data type', () => {
			validData.dateSetting.fpdSourceHierarchy.fourthFpdSource = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `fourthFpdSource`: `invalid`. `fourthFpdSource` must be an object.',
			);
		});

		it('should validate fpdSourceHierarchy.useForecastSchedule data type', () => {
			validData.dateSetting.fpdSourceHierarchy.useForecastSchedule = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should throw error for missing required field: `dateSetting.maxWellLife`', () => {
			delete validData.dateSetting.maxWellLife;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `dateSetting.maxWellLife`');
		});

		it('should throw error for missing required field: `dateSetting.asOfDate`', () => {
			delete validData.dateSetting.asOfDate;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `dateSetting.asOfDate`');
		});

		it('should throw error for missing required field: `dateSetting.discountDate`', () => {
			delete validData.dateSetting.discountDate;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `dateSetting.discountDate`');
		});

		it('should throw error for missing required field: `dateSetting.cashFlowPriorAsOfDate`', () => {
			delete validData.dateSetting.cashFlowPriorAsOfDate;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.cashFlowPriorAsOfDate`',
			);
		});

		it('should throw error for missing required field: `dateSetting.productionDataResolution`', () => {
			delete validData.dateSetting.productionDataResolution;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.productionDataResolution`',
			);
		});

		it('should throw error for missing required field: `dateSetting.fpdSourceHierarchy.firstFpdSource`', () => {
			delete validData.dateSetting.fpdSourceHierarchy.firstFpdSource;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.fpdSourceHierarchy.firstFpdSource`',
			);
		});

		it('should throw error for missing required field: `dateSetting.fpdSourceHierarchy.secondFpdSource`', () => {
			delete validData.dateSetting.fpdSourceHierarchy.secondFpdSource;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.fpdSourceHierarchy.secondFpdSource`',
			);
		});

		it('should throw error for missing required field: `dateSetting.fpdSourceHierarchy.thirdFpdSource`', () => {
			delete validData.dateSetting.fpdSourceHierarchy.thirdFpdSource;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.fpdSourceHierarchy.thirdFpdSource`',
			);
		});

		it('should throw error for missing required field: `dateSetting.fpdSourceHierarchy.fourthFpdSource`', () => {
			delete validData.dateSetting.fpdSourceHierarchy.fourthFpdSource;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.fpdSourceHierarchy.fourthFpdSource`',
			);
		});

		it('should throw error for missing required field: `dateSetting.fpdSourceHierarchy.useForecastSchedule`', () => {
			delete validData.dateSetting.fpdSourceHierarchy.useForecastSchedule;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `dateSetting.fpdSourceHierarchy.useForecastSchedule`',
			);
		});

		it('should validate maxCumCashFlow data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.maxCumCashFlow = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate firstNegativeCashFlow data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.tolerateNegativeCF = 0;
			validData.cutOff.firstNegativeCashFlow = 'invalid';

			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate tolerateNegativeCF is firstNegativeCashFlow is set', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.firstNegativeCashFlow = true;

			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `cutOff.tolerateNegativeCF`',
			);
		});

		it('should validate lastPositiveCashFlow data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.lastPositiveCashFlow = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate noCutOff data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.noCutOff = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate oilRate data type', () => {
			delete validData.cutOff.maxCumCashFlow;
			validData.cutOff.oilRate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate gasRate data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.gasRate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate waterRate data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.waterRate = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate date data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.date = 123;
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate yearsFromAsOf data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.yearsFromAsOf = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate linkToWells data type', () => {
			delete validData.cutOff.maxCumCashFlow;

			validData.cutOff.linkToWells = 123;
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate minLife data type', () => {
			validData.cutOff.minLife = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Invalid value for `minLife`: `invalid`. `minLife` must be an object.',
			);
		});

		it('should validate triggerEclCapex data type', () => {
			validData.cutOff.triggerEclCapex = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate includeCapex data type', () => {
			validData.cutOff.includeCapex = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate discount data type', () => {
			validData.cutOff.discount = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate econLimitDelay data type', () => {
			validData.cutOff.econLimitDelay = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should validate alignDependentPhases data type', () => {
			validData.cutOff.alignDependentPhases = 'invalid';
			expect(() => parseApiDateSettings(validData)).toThrow(TypeError);
		});

		it('should throw error if either `maxCumCashFlow`, `firstNegativeCashFlow`, `lastPositiveCashFlow`, `noCutOff`, `oilGas`, `oilWater`, `oilRate`, `date`, `yearsFromAsOf` or `linkToWells` are NOT specified`', () => {
			delete validData.cutOff.maxCumCashFlow;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'either `maxCumCashFlow`, `firstNegativeCashFlow`, `lastPositiveCashFlow`, `noCutOff`, `oilGas`, `oilWater`, `oilRate`, `date`, `yearsFromAsOf` or `linkToWells` MUST be specified',
			);
		});

		it('should throw error for missing required field: `cutOff.minLife`', () => {
			delete validData.cutOff.minLife;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `cutOff.minLife`');
		});

		it('should throw error for missing required field: `cutOff.triggerEclCapex`', () => {
			delete validData.cutOff.triggerEclCapex;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `cutOff.triggerEclCapex`');
		});

		it('should throw error for missing required field: `cutOff.includeCapex`', () => {
			delete validData.cutOff.includeCapex;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `cutOff.includeCapex`');
		});

		it('should throw error for missing required field: `cutOff.discount`', () => {
			delete validData.cutOff.discount;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `cutOff.discount`');
		});

		it('should throw error for missing required field: `cutOff.econLimitDelay`', () => {
			delete validData.cutOff.econLimitDelay;
			expect(() => parseApiDateSettings(validData)).toThrow('Missing required field: `cutOff.econLimitDelay`');
		});

		it('should throw error for missing required field: `cutOff.alignDependentPhases`', () => {
			delete validData.cutOff.alignDependentPhases;
			expect(() => parseApiDateSettings(validData)).toThrow(
				'Missing required field: `cutOff.alignDependentPhases`',
			);
		});
	});

	describe('checkModelDuplicates', () => {
		it('returns the original array if there are no duplicates', () => {
			const input = [{ name: 'Model1' }, { name: 'Model2' }, { name: 'Model3' }];

			const output = checkModelDuplicates(input);

			expect(output).toEqual(input);
		});

		it('filters out duplicate elements and throws a MultipleValidationError', () => {
			const input = [
				{ name: 'Model1' },
				{ name: 'Model2' },
				{ name: 'Model1' },
				{ name: 'Model3' },
				{ name: 'Model2' },
			];

			expect(() => checkModelDuplicates(input)).toThrow(MultipleValidationError);
		});
	});
});
