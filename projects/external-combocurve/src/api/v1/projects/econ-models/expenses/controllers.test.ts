import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	FieldNameError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { CursorType } from '@src/api/v1/pagination';
import { generateBoolean } from '@src/helpers/test/data-generation';
import { IExpenses } from '@src/models/econ/expenses';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { ApiExpenses, READ_RECORD_LIMIT, toExpenses, WRITE_RECORD_LIMIT } from './fields/expenses';
import { DuplicateExpensesError, ExpensesCollisionError, ExpensesNotFoundError } from './validation';
import { getExpenses, getExpensesById, getExpensesHead, postExpenses, putExpenses } from './controllers';
import { ApiCarbonExpensesEconFunction } from './fields/carbon-expenses-econ-function';
import { ApiExpensesFields } from './fields/expenses-fields';
import { ApiFixedExpensesEconFunction } from './fields/fixed-expenses-econ-function';
import { ApiVariableExpensesEconFunction } from './fields/variable-expenses-econ-function';

import { mockExpress } from '@test/express-mocks';

const { CREATED, MULTI_STATUS, OK } = StatusCodes;

const getExpensesArray = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
	}));

const getValidExpensesModel = (): {
	variableExpenses: ApiVariableExpensesEconFunction;
	fixedExpenses: ApiFixedExpensesEconFunction;
	waterDisposal: ApiExpensesFields;
	carbonExpenses: ApiCarbonExpensesEconFunction;
} => ({
	variableExpenses: {
		oil: {
			gathering: {
				shrinkageCondition: 'shrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				cap: 45,
				dealTerms: 23,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			marketing: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				cap: 89,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			transportation: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			processing: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			other: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
		},
		gas: {
			gathering: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			marketing: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			transportation: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			processing: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			other: {
				shrinkageCondition: 'unshrunk',
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
		},
		ngl: {
			gathering: {
				description: 'lol',
				escalationModel: '642f2f56670d176d8558ef7b',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: true,
				deductBeforeAdValTax: true,
				dealTerms: 32,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						pctOfOilRev: 23,
						totalFluidRate: 23,
					},
					{
						pctOfOilRev: 23,
						totalFluidRate: 25,
					},
				],
			},
			marketing: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			transportation: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			processing: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			other: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
		},
		dripCondensate: {
			gathering: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			marketing: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			transportation: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			processing: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			other: {
				description: 'test',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						dollarPerBbl: 0,
						entireWellLife: 'Flat',
					},
				],
			},
		},
	},
	fixedExpenses: {
		monthlyWellCost: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 2,
				},
			],
		},
		otherMonthlyCost1: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 2,
				},
			],
		},
		otherMonthlyCost2: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost3: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost4: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost5: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost6: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost7: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
		otherMonthlyCost8: {
			stopAtEconLimit: true,
			expenseBeforeFpd: false,
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					fixedExpense: 0,
				},
			],
		},
	},
	waterDisposal: {
		escalationModel: 'none',
		calculation: 'wi',
		description: '',
		affectEconLimit: true,
		deductBeforeSeveranceTax: false,
		deductBeforeAdValTax: false,
		cap: 78,
		dealTerms: 1,
		rateType: 'gross_well_head',
		rowsCalculationMethod: 'non_monotonic',
		rows: [
			{
				dollarPerBbl: 0,
				entireWellLife: 'Flat',
			},
		],
	},
	carbonExpenses: {
		category: 'ch4',
		ch4: {
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					carbonExpense: 0,
				},
			],
		},
		co2: {
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					carbonExpense: 0,
				},
			],
		},
		co2E: {
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					carbonExpense: 0,
				},
			],
		},
		n2O: {
			description: 'test',
			escalationModel: 'none',
			calculation: 'wi',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					entireWellLife: 'Flat',
					carbonExpense: 0,
				},
			],
		},
	},
});

const getExpensesArrayWithPayload = (n = 1, { name, unique }: { name?: string; unique?: boolean } = {}) =>
	[...Array(n).keys()].map((_, i) => ({
		name: name ?? 'test' + i.toString(),
		unique: unique ?? generateBoolean(i),
		...getValidExpensesModel(),
	}));

const getCreatedStatus = ({ name }: ApiExpenses) => ({
	status: 'Created',
	code: CREATED,
	name,
});

const getOkStatus = ({ name }: ApiExpenses) => ({
	status: 'OK',
	code: OK,
	name,
});

describe('v1/projects/econ-models/expenses/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	it('getExpensesHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'projects/5e272bed4b97ed00132f2271/econ-models/expenses';

		res.locals = {
			service: {
				getExpensesCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getExpensesHead, READ_RECORD_LIMIT);
	});

	it('getExpensesHead runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/expenses`;
		req.originalUrl = originalUrl;

		let count = 0;
		const getExpensesCount = jest.fn(() => count);

		res.locals = {
			service: {
				getExpensesCount: getExpensesCount,
			},
			project,
		};
		res.set = jest.fn(() => res);

		await getExpensesHead(req, res);
		expect(getExpensesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="last"`,
			'X-Query-Count': '0',
		});

		count = 51;
		await getExpensesHead(req, res);
		expect(getExpensesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getExpensesHead(req, res);
		expect(getExpensesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="last"`,
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getExpensesHead(req, res);
		expect(getExpensesCount).toHaveBeenLastCalledWith({}, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		count = 35;
		await getExpensesHead(req, res);
		expect(getExpensesCount).toHaveBeenLastCalledWith({ name: ['default1'] }, project);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${originalUrl}?skip=30&take=10>;rel="last"`,
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getExpensesCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
		count = 35;
		await expect(getExpensesHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getExpensesCount.mock.calls.length).toBe(serviceCallTimes);
	});

	it('getExpenses throws validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		req.originalUrl = `projects/${project._id}/econ-models/expenses`;

		res.locals = {
			service: {
				getExpenses: () => ({ result: [], hasNext: false }),
			},
			project,
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getExpenses, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['name'] };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=name' };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>name' };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+name' };
		await expect(getExpenses(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getExpenses(req, res)).rejects.toThrow(ValidationError);
	});

	it('getExpenses runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const originalUrl = `projects/${project._id}/econ-models/expenses`;

		req.originalUrl = originalUrl;

		let result: ApiExpenses[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceEscalation = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getExpenses: serviceEscalation,
			},
			project,
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getExpensesArray(3);
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getExpensesArray(3));

		result = getExpensesArray(25);
		hasNext = true;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getExpensesArray(25));

		req.query = { skip: '25' };
		result = getExpensesArray(25);
		hasNext = true;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=25>;rel="first"`,
		});
		expect(res.json).toHaveBeenLastCalledWith(getExpensesArray(25));

		req.query = { skip: '30', take: '10' };
		result = getExpensesArray(5);
		hasNext = false;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1' };
		result = getExpensesArray(5);
		hasNext = false;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			30,
			10,
			{ id: -1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };
		result = getExpensesArray(5);
		hasNext = false;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			30,
			10,
			{ name: -1 },
			{ name: ['default1'], unique: ['false'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getExpensesArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, project, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getExpensesArray(15);
		hasNext = true;
		cursor = null;
		await getExpenses(req, res);
		expect(serviceEscalation).toHaveBeenLastCalledWith(
			0,
			10,
			{ name: 1 },
			{ name: ['default1'] },
			project,
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/${originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${originalUrl}?skip=0&take=10>;rel="first"`,
		});
	});

	it('getExpensesById', async () => {
		const { req, res } = mockExpress();
		req.params = { id: Types.ObjectId().toString() };

		res.locals = {
			service: {
				getById: () => null,
			},
			project: { _id: Types.ObjectId() },
		};

		res.sendStatus = jest.fn();

		await expect(getExpensesById(req, res)).rejects.toThrow(ExpensesNotFoundError);
	});

	it('postExpenses causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		let names: string[] = [];

		res.locals = {
			service: {
				create: (Expenses: Array<IExpenses | undefined>) => ({
					results: Expenses.map((r) => r && getCreatedStatus(toExpenses(r, project._id))),
				}),
				checkWells: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				checkScenarios: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				getExistingNames: jest.fn(() => names),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(postExpenses(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `variableExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `fixedExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `waterDisposal`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `carbonExpenses`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `variableExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `fixedExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `waterDisposal`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `carbonExpenses`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getExpensesArrayWithPayload(1, { name, unique: false }),
			...getExpensesArrayWithPayload(1, { name, unique: false }),
		];
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateExpensesError.name,
					`More than one Expenses data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateExpensesError.name,
					`More than one Expenses data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});

		req.body = getExpensesArrayWithPayload(1, { name, unique: false });
		names = [name];
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					ExpensesCollisionError.name,
					`Expenses with name \`${name}\` already exists in project \`${project._id}\``,
					'[0]',
				),
			],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('postExpenses runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const create = jest.fn((Expenses: Array<IExpenses | undefined>) => ({
			results: Expenses.map((r) => r && getCreatedStatus(toExpenses(r, project._id))),
		}));

		res.locals = {
			service: {
				create,
				checkWells: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				checkScenarios: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				getExistingNames: jest.fn(() => []),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const name = 'test';
		const data = { ...getExpensesArrayWithPayload(1, { name, unique: false })[0] };
		const dataApi = {
			...getExpensesArrayWithPayload(1, { name, unique: false })[0],
		} as ApiExpenses;
		req.body = data;
		await postExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getCreatedStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getExpensesArrayWithPayload(10, { unique: false });
		await postExpenses(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getExpensesArrayWithPayload(10).map(getCreatedStatus),
			successCount: 10,
			failedCount: 0,
		});
	});

	it('putExpenses causes validation error', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		res.locals = {
			service: {
				upsert: (Expenses: Array<IExpenses | undefined>) => ({
					results: Expenses.map((r) => r && getOkStatus(toExpenses(r, project._id))),
				}),
				checkWells: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				checkScenarios: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		req.body = 1;
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [[]];
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [true];
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getErrorStatus(RequestStructureError.name, 'Invalid Expenses model data structure', '[0]')],
			successCount: 0,
			failedCount: 1,
		});

		req.body = [...Array(WRITE_RECORD_LIMIT + 1).keys()].map(() => ({}));
		await expect(putExpenses(req, res)).rejects.toThrow(RecordCountError);

		req.body = { name: 'test', a: 'b' };
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `variableExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `fixedExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `waterDisposal`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `carbonExpenses`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		req.body = {};
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getMultiErrorStatus([
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `name`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `unique`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `variableExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `fixedExpenses`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `waterDisposal`',
						location: '[0]',
					},
					{
						name: RequiredFieldError.name,
						message: 'Missing required field: `carbonExpenses`',
						location: '[0]',
					},
				]),
			],
			successCount: 0,
			failedCount: 1,
		});

		const name = 'test';
		req.body = [
			...getExpensesArrayWithPayload(1, { name, unique: false }),
			...getExpensesArrayWithPayload(1, { name, unique: false }),
		];
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [
				getErrorStatus(
					DuplicateExpensesError.name,
					`More than one Expenses data supplied with name \`${name}\``,
					'[0], [1]',
				),
				getErrorStatus(
					DuplicateExpensesError.name,
					`More than one Expenses data supplied with name \`${name}\``,
					'[0], [1]',
				),
			],
			successCount: 0,
			failedCount: 2,
		});
	});

	it('putExpenses runs correctly', async () => {
		const { req, res } = mockExpress();

		const project = { _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const upsert = jest.fn((Expenses: Array<IExpenses | undefined>) => ({
			results: Expenses.map((r) => r && getOkStatus(toExpenses(r, project._id))),
		}));

		res.locals = {
			service: {
				upsert,
				checkWells: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
				checkScenarios: jest.fn((Expenses: Array<IExpenses | undefined>) => Expenses),
			},
			project,
		};
		res.status = jest.fn(() => res);
		res.json = jest.fn();

		const data = { ...getExpensesArrayWithPayload(1, { unique: false })[0] };
		const dataApi = {
			...getExpensesArrayWithPayload(1, { unique: false })[0],
		} as ApiExpenses;
		req.body = data;
		await putExpenses(req, res);
		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: [getOkStatus(dataApi)],
			successCount: 1,
			failedCount: 0,
		});

		req.body = getExpensesArrayWithPayload(10, { unique: false });
		await putExpenses(req, res);

		expect(res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
		expect(res.json).toHaveBeenLastCalledWith({
			results: getExpensesArrayWithPayload(10).map(getOkStatus),
			successCount: 10,
			failedCount: 0,
		});
	});
});
