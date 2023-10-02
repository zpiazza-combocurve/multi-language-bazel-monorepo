/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeError, ValueError } from '@src/helpers/validation';
import { MultipleValidationError } from '@src/api/v1/multi-error';

import { parseApiOwnershipReversion } from './validation';

const fakeObjectId = '641de2bef473bc00120fd714';

function getValidOwnershipReversion(): Record<string, any> {
	return {
		id: '641de2bef473bc00120fd714',
		name: 'own1 1',
		unique: false,
		ownership: {
			initialOwnership: {
				workingInterest: 0,
				netProfitInterestType: 'expense',
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
				oilNetRevenueInterest: 78,
				gasNetRevenueInterest: 78,
				nglNetRevenueInterest: 78,
				dripCondensateNetRevenueInterest: 78,
			},
			firstReversion: {
				reversionType: 'Irr',
				reversionValue: 10,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			secondReversion: {
				reversionType: 'PayoutWithInvestment',
				reversionValue: 10,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			thirdReversion: {
				reversionType: 'PayoutWithoutInvestment',
				reversionValue: 10,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			fourthReversion: {
				reversionType: 'UndiscRoi',
				reversionValue: 10,
				balance: 'net',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			fifthReversion: {
				reversionType: 'AsOf',
				reversionValue: 2,
				balance: 'gross',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			sixthReversion: {
				reversionType: 'Date',
				reversionValue: '2020-12-03',
				balance: 'gross',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			seventhReversion: {
				reversionType: 'WhCumOil',
				reversionValue: 10,
				balance: 'gross',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			eighthReversion: {
				reversionType: 'WhCumGas',
				reversionValue: 10,
				balance: 'gross',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			ninthReversion: {
				reversionType: 'WhCumBoe',
				reversionValue: 10,
				balance: 'gross',
				includeNetProfitInterest: 'yes',
				workingInterest: 10,
				netProfitInterest: 0,
				netRevenueInterest: 0,
				leaseNetRevenueInterest: 78,
			},
			tenthReversion: null,
		},
	};
}

describe('v1/ownership-reversions/validation/parseApiOwnershipReversion', () => {
	describe('ownership reversion', () => {
		// base contract
		test('should parse valid ownership reversion', () => {
			const input = getValidOwnershipReversion();

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on extra properties', () => {
			const input = getValidOwnershipReversion();

			input.invalidProperty = 'test';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		// name
		test('should throw validation exception on missing name field', () => {
			const input = getValidOwnershipReversion();

			delete input.name;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('Missing required field: `name`');
		});

		test('should throw validation exception on invalid name field', () => {
			const input = getValidOwnershipReversion();

			input.name = 2;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`2` is not a string');

			input.name = {};

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`[object Object]` is not a string');

			input.name = [1, 2];

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`1,2` is not a string');
		});

		// unique
		test('should throw validation exception on missing unique field', () => {
			const input = getValidOwnershipReversion();

			delete input.unique;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('Missing required field: `unique`');
		});

		// id
		test('should not throw validation exception on missing id field', () => {
			const input = getValidOwnershipReversion();

			delete input.id;

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on invalid id field', () => {
			const input = getValidOwnershipReversion();

			input.id = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid ObjectId');

			input.id = 2;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`2` is not a valid ObjectId');
		});

		// well
		test('should not throw validation exception on missing well field when not unique', () => {
			const input = getValidOwnershipReversion();

			delete input.well;

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on well field when not unique', () => {
			const input = getValidOwnershipReversion();

			input.well = fakeObjectId;

			delete input.scenario;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'The following fields cannot be present when econ-model is not unique: `well`, `scenario`',
			);
		});

		test('should throw validation exception on missing well field when unique', () => {
			const input = getValidOwnershipReversion();

			input.unique = true;
			input.scenario = fakeObjectId;

			delete input.well;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('Missing required field: `well`');
		});

		test('should throw validation exception on invalid well field when unique', () => {
			const input = getValidOwnershipReversion();

			input.unique = true;
			input.scenario = fakeObjectId;
			input.well = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid ObjectId');
		});

		// scenario
		test('should not throw validation exception on missing scenario field when not unique', () => {
			const input = getValidOwnershipReversion();

			delete input.scenario;

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception on scenario field when not unique', () => {
			const input = getValidOwnershipReversion();

			input.scenario = fakeObjectId;

			delete input.well;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'The following fields cannot be present when econ-model is not unique: `well`, `scenario`',
			);
		});

		test('should throw validation exception on missing scenario field when unique', () => {
			const input = getValidOwnershipReversion();

			input.unique = true;
			input.well = fakeObjectId;

			delete input.scenario;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('Missing required field: `scenario`');
		});

		test('should throw validation exception on invalid scenario field', () => {
			const input = getValidOwnershipReversion();

			input.unique = true;
			input.well = fakeObjectId;
			input.scenario = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid ObjectId');
		});
	});

	describe('ownership', () => {
		test('should throw validation exception on extra ownership properties', () => {
			const input = getValidOwnershipReversion();

			input.ownership.invalidProperty = 'test';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});
	});

	describe('initial ownership', () => {
		// base
		test('should throw validation exception on missing initial ownership field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership`',
			);
		});

		test('should throw validation exception on extra properties', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.invalidProperty = 'test';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		// workingInterest
		test('should throw validation exception on missing initial ownership working interest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership.workingInterest`',
			);
		});

		test('should throw validation exception when initial ownership workingInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.workingInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.workingInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership workingInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.workingInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.workingInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership workingInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.workingInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');

			input.ownership.initialOwnership.workingInterest = null;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`null` is not a valid number');
		});

		// netProfitInterestType
		test('should throw validation exception on missing initial ownership netProfitInterestType field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership.netProfitInterestType;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership.netProfitInterestType`',
			);
		});

		test('should throw validation exception when initial ownership net profit interest type field invalid value', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netProfitInterestType = 'test';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.netProfitInterestType` must be one of the following values: expense, revenue',
			);
		});

		test('should throw validation exception when initial ownership netProfitInterestType field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netProfitInterestType = 2;

			const expectedErrors = [
				new TypeError('`2` is not a string', '[1].ownership.initialOwnership.netProfitInterestType'),
				new ValueError(
					'`ownership.initialOwnership.netProfitInterestType` must be one of the following values: expense, revenue',
					'[1]',
				),
			];

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(new MultipleValidationError(expectedErrors));
		});

		// netProfitInterest
		test('should throw validation exception on missing initial ownership netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial ownership netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.netProfitInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership netProfitInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netProfitInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');

			input.ownership.initialOwnership.netProfitInterest = null;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`null` is not a valid number');
		});

		// netRevenueInterest
		test('should throw validation exception on missing initial ownership netRevenueInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership.netRevenueInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership.netRevenueInterest`',
			);
		});

		test('should throw validation exception when initial ownership netRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.netRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership netRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.netRevenueInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership netRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.netRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');

			input.ownership.initialOwnership.netRevenueInterest = null;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`null` is not a valid number');
		});

		//leaseNetRevenueInterest
		test('should throw validation exception on missing initial ownership leaseNetRevenueInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.initialOwnership.leaseNetRevenueInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.initialOwnership.leaseNetRevenueInterest`',
			);
		});

		test('should throw validation exception when initial ownership leaseNetRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.leaseNetRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.leaseNetRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership leaseNetRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.leaseNetRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.leaseNetRevenueInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership leaseNetRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.leaseNetRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');

			input.ownership.initialOwnership.leaseNetRevenueInterest = null;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`null` is not a valid number');
		});

		// oilNetRevenueInterest
		test('should throw validation exception when initial ownership oilNetRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.oilNetRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.oilNetRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership oilNetRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.oilNetRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.oilNetRevenueInterest` must be <= 100',
			);
		});

		test('should not throw validation exception when initial ownership oilNetRevenueInterest null', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.oilNetRevenueInterest = null;

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});

		test('should throw validation exception when initial ownership oilNetRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.oilNetRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');
		});

		// gasNetRevenueInterest
		test('should throw validation exception when initial ownership gasNetRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.gasNetRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.gasNetRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership gasNetRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.gasNetRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.gasNetRevenueInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership gasNetRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.gasNetRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');
		});

		// nglNetRevenueInterest
		test('should throw validation exception when initial ownership nglNetRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.nglNetRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.nglNetRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership nglNetRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.nglNetRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.nglNetRevenueInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership nglNetRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.nglNetRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');
		});

		// dripCondensateNetRevenueInterest
		test('should throw validation exception when initial ownership dripCondensateNetRevenueInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.dripCondensateNetRevenueInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.dripCondensateNetRevenueInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial ownership dripCondensateNetRevenueInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.dripCondensateNetRevenueInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.initialOwnership.dripCondensateNetRevenueInterest` must be <= 100',
			);
		});

		test('should throw validation exception when initial ownership dripCondensateNetRevenueInterest field invalid type', () => {
			const input = getValidOwnershipReversion();

			input.ownership.initialOwnership.dripCondensateNetRevenueInterest = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid number');
		});
	});

	describe('IRR', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing IRR reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.firstReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.firstReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing IRR workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.firstReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.firstReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing IRR netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.firstReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.firstReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial IRR reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.firstReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial IRR reversionValue field greater than 10000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.reversionValue = 10001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.firstReversion.reversionValue` must be <= 10000',
			);
		});

		test('should throw validation exception when initial IRR netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.firstReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial IRR netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.firstReversion.netProfitInterest` must be <= 100',
			);
		});

		test('should not throw validation exception when oilNetRevenueInterest null', () => {
			const input = getValidOwnershipReversion();

			input.ownership.firstReversion.oilNetRevenueInterest = null;

			const result = parseApiOwnershipReversion(input, 1);

			expect(result).not.toBeNull();
		});
	});

	describe('PayoutWithInvestmentType', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.secondReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing PayoutWithInvestmentType reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.secondReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.secondReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing PayoutWithInvestmentType workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.secondReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.secondReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing PayoutWithInvestmentType netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.secondReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.secondReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial PayoutWithInvestmentType reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.secondReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.secondReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial PayoutWithInvestmentType reversionValue field greater than 10000000000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.secondReversion.reversionValue = 10000000001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.secondReversion.reversionValue` must be <= 10000000000',
			);
		});

		test('should throw validation exception when initial PayoutWithInvestmentType netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.secondReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.secondReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial PayoutWithInvestmentType netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.secondReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.secondReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('PayoutWithoutInvestmentType', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.thirdReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing PayoutWithoutInvestmentType reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.thirdReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.thirdReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing PayoutWithoutInvestmentType workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.thirdReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.thirdReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing PayoutWithoutInvestmentType netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.thirdReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.thirdReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial PayoutWithoutInvestmentType reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.thirdReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.thirdReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial PayoutWithoutInvestmentType reversionValue field greater than 10000000000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.thirdReversion.reversionValue = 10000000001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.thirdReversion.reversionValue` must be <= 10000000000',
			);
		});

		test('should throw validation exception when initial PayoutWithoutInvestmentType netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.thirdReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.thirdReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial PayoutWithoutInvestmentType netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.thirdReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.thirdReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('UndiscRoi', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fourthReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing UndiscRoi reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fourthReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fourthReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing UndiscRoi workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fourthReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fourthReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing UndiscRoi netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fourthReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fourthReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial UndiscRoi reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fourthReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fourthReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial UndiscRoi reversionValue field greater than 1000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fourthReversion.reversionValue = 1001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fourthReversion.reversionValue` must be <= 1000',
			);
		});

		test('should throw validation exception when initial UndiscRoi netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fourthReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fourthReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial UndiscRoi netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fourthReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fourthReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('AsOf', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fifthReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing AsOf reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fifthReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fifthReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing AsOf workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fifthReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fifthReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing AsOf netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.fifthReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.fifthReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial AsOf netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fifthReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fifthReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial AsOf netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.fifthReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.fifthReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('Date', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.sixthReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing Date reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.sixthReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.sixthReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing Date workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.sixthReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.sixthReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing Date netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.sixthReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.sixthReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial Date reversionValue field not a date string', () => {
			const input = getValidOwnershipReversion();

			input.ownership.sixthReversion.reversionValue = 'asdf';

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`asdf` is not a valid ISO date');
		});

		test('should throw validation exception when initial Date reversionValue field not a string', () => {
			const input = getValidOwnershipReversion();

			input.ownership.sixthReversion.reversionValue = 1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`1` is not a string');
		});

		test('should throw validation exception when initial Date netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.sixthReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.sixthReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial Date netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.sixthReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.sixthReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('WhCumOil', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.seventhReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing WhCumOil reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.seventhReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.seventhReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing WhCumOil workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.seventhReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.seventhReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing WhCumOil netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.seventhReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.seventhReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial WhCumOil reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.seventhReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.seventhReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumOil reversionValue field greater than 10000000000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.seventhReversion.reversionValue = 10000000001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.seventhReversion.reversionValue` must be <= 10000000000',
			);
		});

		test('should throw validation exception when initial WhCumOil netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.seventhReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.seventhReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumOil netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.seventhReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.seventhReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('WhCumGas', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.eighthReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing WhCumGas reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.eighthReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.eighthReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing WhCumGas workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.eighthReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.eighthReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing WhCumGas netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.eighthReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.eighthReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial WhCumGas reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.eighthReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.eighthReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumGas reversionValue field greater than 10000000000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.eighthReversion.reversionValue = 10000000001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.eighthReversion.reversionValue` must be <= 10000000000',
			);
		});

		test('should throw validation exception when initial WhCumGas netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.eighthReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.eighthReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumGas netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.eighthReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.eighthReversion.netProfitInterest` must be <= 100',
			);
		});
	});

	describe('WhCumBoe', () => {
		test('should throw validation exception on inclusion of invalid fields', () => {
			const input = getValidOwnershipReversion();

			input.ownership.ninthReversion.invalidProperty = true;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow('`invalidProperty` is not a valid field name');
		});

		test('should throw validation exception on missing WhCumBoe reversionValue field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.ninthReversion.reversionValue;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.ninthReversion.reversionValue`',
			);
		});

		test('should throw validation exception on missing WhCumBoe workingInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.ninthReversion.workingInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.ninthReversion.workingInterest`',
			);
		});

		test('should throw validation exception on missing WhCumBoe netProfitInterest field', () => {
			const input = getValidOwnershipReversion();

			delete input.ownership.ninthReversion.netProfitInterest;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'Missing required field: `ownership.ninthReversion.netProfitInterest`',
			);
		});

		test('should throw validation exception when initial WhCumBoe reversionValue field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.ninthReversion.reversionValue = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.ninthReversion.reversionValue` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumBoe reversionValue field greater than 10000000000', () => {
			const input = getValidOwnershipReversion();

			input.ownership.ninthReversion.reversionValue = 10000000001;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.ninthReversion.reversionValue` must be <= 10000000000',
			);
		});

		test('should throw validation exception when initial WhCumBoe netProfitInterest field less than 0', () => {
			const input = getValidOwnershipReversion();

			input.ownership.ninthReversion.netProfitInterest = -1;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.ninthReversion.netProfitInterest` must be >= 0',
			);
		});

		test('should throw validation exception when initial WhCumBoe netProfitInterest field greater than 100', () => {
			const input = getValidOwnershipReversion();

			input.ownership.ninthReversion.netProfitInterest = 101;

			expect(() => parseApiOwnershipReversion(input, 1)).toThrow(
				'`ownership.ninthReversion.netProfitInterest` must be <= 100',
			);
		});
	});
});
