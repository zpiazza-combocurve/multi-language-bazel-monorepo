import { IDAL } from '@combocurve/dal-client';
import { BaseContext, beginningOfTime, endOfTime } from '@combocurve/shared';
import { setupTestDbManager } from '@combocurve/shared/tests';

import { WellService } from './wells';

describe('shared well service deleteProductions daily', () => {
	const testDbManager = setupTestDbManager();
	let service: WellService;
	let context: BaseContext;
	let dailyDeleteByWellMock: jest.Mock;
	let dailyDeleteByManyWellsMock: jest.Mock;
	let dailyFetchMock: jest.Mock;
	let monthlyDeleteByWellMock: jest.Mock;
	let monthlyDeleteByManyWellsMock: jest.Mock;
	let monthlyFetchMock: jest.Mock;
	let wellBulkWriteMock: jest.SpyInstance<void>;

	function arrayToAsyncIterable<T>(array: T[]): AsyncIterable<T> {
		return {
			[Symbol.asyncIterator]() {
				let i = 0;
				return {
					next() {
						if (i < array.length) {
							return Promise.resolve({ done: false, value: array[i++] });
						}

						return Promise.resolve({ done: true, value: undefined });
					},
				};
			},
		};
	}

	beforeAll(() => {
		context = testDbManager.context;

		service = new WellService(context);

		wellBulkWriteMock = jest.spyOn(context.models.WellModel, 'bulkWrite');
	});

	beforeEach(() => {
		dailyDeleteByWellMock = jest.fn();
		dailyDeleteByManyWellsMock = jest.fn();
		dailyFetchMock = jest.fn().mockImplementation(() => arrayToAsyncIterable([]));
		monthlyDeleteByWellMock = jest.fn();
		monthlyDeleteByManyWellsMock = jest.fn();
		monthlyFetchMock = jest.fn().mockImplementation(() => arrayToAsyncIterable([]));

		wellBulkWriteMock.mockReset();

		context.dal = {
			dailyProduction: {
				deleteByManyWells: dailyDeleteByManyWellsMock,
				deleteByWell: dailyDeleteByWellMock,
				fetch: dailyFetchMock,
			},
			monthlyProduction: {
				deleteByManyWells: monthlyDeleteByManyWellsMock,
				deleteByWell: monthlyDeleteByWellMock,
				fetch: monthlyFetchMock,
			},
		} as unknown as IDAL;
	});

	test('updateProdCalcFields daily should call well model bulkWrite with correct operations', async () => {
		const wellIds = ['well1', 'well2'];
		const startDate = new Date('2020-03-01');
		const endDate = new Date('2020-03-05');

		dailyFetchMock.mockImplementationOnce(() =>
			arrayToAsyncIterable([
				{ _id: 'well1', date: endDate },
				{ _id: 'well1', date: startDate },
			])
		);

		await service.updateProdCalcFields(wellIds, 'daily');

		const well1ExpectedOperation = {
			updateOne: {
				filter: {
					_id: 'well1',
				},
				update: {
					$set: {
						first_prod_date_daily_calc: startDate,
						has_daily: true,
						last_prod_date_daily: endDate,
					},
				},
			},
		};

		// Well2 has no daily production so its calcs should be reset
		const well2ExpectedOperation = {
			updateOne: {
				filter: {
					_id: 'well2',
				},
				update: {
					$set: {
						first_prod_date_daily_calc: undefined,
						has_daily: false,
						last_prod_date_daily: undefined,
					},
				},
			},
		};

		expect(wellBulkWriteMock).toHaveBeenCalledWith([well1ExpectedOperation, well2ExpectedOperation], {
			ordered: false,
		});
	});

	test('updateProdCalcFields monthly should call well model bulkWrite with correct operations', async () => {
		const wellIds = ['well1', 'well2'];
		const startDate = new Date('2020-03-15');
		const endDate = new Date('2020-06-15');

		monthlyFetchMock.mockImplementationOnce(() =>
			arrayToAsyncIterable([
				{ _id: 'well1', date: endDate },
				{ _id: 'well1', date: startDate },
			])
		);

		await service.updateProdCalcFields(wellIds, 'monthly');

		const well1ExpectedOperation = {
			updateOne: {
				filter: {
					_id: 'well1',
				},
				update: {
					$set: {
						first_prod_date_monthly_calc: startDate,
						has_monthly: true,
						last_prod_date_monthly: endDate,
					},
				},
			},
		};

		// Well2 has no daily production so its calcs should be reset
		const well2ExpectedOperation = {
			updateOne: {
				filter: {
					_id: 'well2',
				},
				update: {
					$set: {
						first_prod_date_monthly_calc: undefined,
						has_monthly: false,
						last_prod_date_monthly: undefined,
					},
				},
			},
		};

		expect(wellBulkWriteMock).toHaveBeenCalledWith([well1ExpectedOperation, well2ExpectedOperation], {
			ordered: false,
		});
	});

	test('daily should call dal deleteByWell when start date provided', async () => {
		const deletedProductionPerWell = 5;
		dailyDeleteByWellMock.mockImplementation(() => Promise.resolve({ deleted: deletedProductionPerWell }));

		const wells = ['well1', 'well2'];
		const startDate = new Date('2020-01-01');

		const result = await service.deleteProductions('daily', wells, startDate);

		const expectedRequests = [
			{ dateRange: { endDate: endOfTime, startDate }, well: 'well1' },
			{ dateRange: { endDate: endOfTime, startDate }, well: 'well2' },
		];

		expect(result).toEqual({ successCount: wells.length * deletedProductionPerWell, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.dailyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[0]);
		expect(context.dal.dailyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[1]);
	});

	test('daily should call dal deleteByWell when end date provided', async () => {
		const deletedProductionPerWell = 5;
		dailyDeleteByWellMock.mockImplementation(() => Promise.resolve({ deleted: deletedProductionPerWell }));

		const wells = ['well1', 'well2'];
		const endDate = new Date('2020-01-01');

		const result = await service.deleteProductions('daily', wells, undefined, endDate);

		const expectedRequests = [
			{ dateRange: { endDate, startDate: beginningOfTime }, well: 'well1' },
			{ dateRange: { endDate, startDate: beginningOfTime }, well: 'well2' },
		];

		expect(result).toEqual({ successCount: wells.length * deletedProductionPerWell, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.dailyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[0]);
		expect(context.dal.dailyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[1]);
	});

	test('daily should call dal deleteByManyWells when no dates provided', async () => {
		const deleteProductionCount = 5;
		dailyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: deleteProductionCount }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('daily', wells);

		expect(result).toEqual({ successCount: deleteProductionCount, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.dailyProduction.deleteByManyWells).toHaveBeenCalledWith({ wells });
	});

	test('daily should call well calcs after delete operation', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		dailyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('daily', wells);

		expect(result).toEqual({ successCount: 5, serviceResponse: 'ok' });

		expect(updateProdCalcFieldsMock).toHaveBeenCalledTimes(1);
		updateProdCalcFieldsMock.mockRestore();
	});

	test('daily should not call well calcs if no wells provided', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		dailyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const result = await service.deleteProductions('daily', []);

		expect(result).toEqual({ successCount: 0, serviceResponse: 'ok' });

		expect(updateProdCalcFieldsMock).not.toHaveBeenCalled();
		updateProdCalcFieldsMock.mockRestore();
	});

	test('daily should return well calcs errors in service response', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		updateProdCalcFieldsMock.mockImplementationOnce(() => Promise.reject(Error('errorMessage')));
		dailyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('daily', wells);

		expect(result).toEqual({
			successCount: 5,
			serviceResponse: `Error updating production calc fields. Error: errorMessage`,
		});

		expect(updateProdCalcFieldsMock).toHaveBeenCalledTimes(1);
		updateProdCalcFieldsMock.mockRestore();
	});

	test('daily should reject when errors thrown from dal', async () => {
		dailyDeleteByManyWellsMock.mockImplementation(() => Promise.reject(Error('errorMessage')));

		const wells = ['well1', 'well2'];

		await expect(service.deleteProductions('daily', wells)).rejects.toThrow('errorMessage');
	});

	test('should not call dal if no wells provided', async () => {
		const result = await service.deleteProductions('daily', []);

		expect(result).toEqual({ successCount: 0, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.dailyProduction.deleteByManyWells).not.toHaveBeenCalled();
		expect(context.dal.dailyProduction.deleteByWell).not.toHaveBeenCalled();
	});

	test('monthly should call dal deleteByWell when start date provided', async () => {
		const deletedProductionPerWell = 5;
		monthlyDeleteByWellMock.mockImplementation(() => Promise.resolve({ deleted: deletedProductionPerWell }));

		const wells = ['well1', 'well2'];
		const startDate = new Date('2020-01-01');

		const result = await service.deleteProductions('monthly', wells, startDate);

		const expectedRequests = [
			{ dateRange: { endDate: endOfTime, startDate }, well: 'well1' },
			{ dateRange: { endDate: endOfTime, startDate }, well: 'well2' },
		];

		expect(result).toEqual({ successCount: wells.length * deletedProductionPerWell, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.monthlyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[0]);
		expect(context.dal.monthlyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[1]);
	});

	test('monthly should call dal deleteByWell when end date provided', async () => {
		const deletedProductionPerWell = 5;
		monthlyDeleteByWellMock.mockImplementation(() => Promise.resolve({ deleted: deletedProductionPerWell }));

		const wells = ['well1', 'well2'];
		const endDate = new Date('2020-01-01');

		const result = await service.deleteProductions('monthly', wells, undefined, endDate);

		const expectedRequests = [
			{ dateRange: { endDate, startDate: beginningOfTime }, well: 'well1' },
			{ dateRange: { endDate, startDate: beginningOfTime }, well: 'well2' },
		];

		expect(result).toEqual({ successCount: wells.length * deletedProductionPerWell, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.monthlyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[0]);
		expect(context.dal.monthlyProduction.deleteByWell).toHaveBeenCalledWith(expectedRequests[1]);
	});

	test('monthly should call dal deleteByManyWells when no dates provided', async () => {
		const deleteProductionCount = 5;
		monthlyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: deleteProductionCount }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('monthly', wells);

		expect(result).toEqual({ successCount: deleteProductionCount, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.monthlyProduction.deleteByManyWells).toHaveBeenCalledWith({ wells });
	});

	test('monthly should call well calcs after delete operation', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		monthlyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('monthly', wells);

		expect(result).toEqual({ successCount: 5, serviceResponse: 'ok' });

		expect(updateProdCalcFieldsMock).toHaveBeenCalledTimes(1);
		updateProdCalcFieldsMock.mockRestore();
	});

	test('monthly should not call well calcs if no wells provided', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		monthlyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const result = await service.deleteProductions('monthly', []);

		expect(result).toEqual({ successCount: 0, serviceResponse: 'ok' });

		expect(updateProdCalcFieldsMock).not.toHaveBeenCalled();
		updateProdCalcFieldsMock.mockRestore();
	});

	test('monthly should return well calcs errors in service response', async () => {
		const updateProdCalcFieldsMock = jest.spyOn(service, 'updateProdCalcFields');
		updateProdCalcFieldsMock.mockReset();
		updateProdCalcFieldsMock.mockImplementationOnce(() => Promise.reject(Error('errorMessage')));
		monthlyDeleteByManyWellsMock.mockImplementation(() => Promise.resolve({ deleted: 5 }));

		const wells = ['well1', 'well2'];

		const result = await service.deleteProductions('monthly', wells);

		expect(result).toEqual({
			successCount: 5,
			serviceResponse: `Error updating production calc fields. Error: errorMessage`,
		});

		expect(updateProdCalcFieldsMock).toHaveBeenCalledTimes(1);
		updateProdCalcFieldsMock.mockRestore();
	});

	test('monthly should reject when errors thrown from dal', async () => {
		monthlyDeleteByManyWellsMock.mockImplementation(() => Promise.reject(Error('errorMessage')));

		const wells = ['well1', 'well2'];

		await expect(service.deleteProductions('monthly', wells)).rejects.toThrow('errorMessage');
	});

	test('monthly should not call dal if no wells provided', async () => {
		const result = await service.deleteProductions('monthly', []);

		expect(result).toEqual({ successCount: 0, serviceResponse: 'ok' });

		if (!context.dal) throw new Error('DAL not initialized');

		expect(context.dal.monthlyProduction.deleteByManyWells).not.toHaveBeenCalled();
		expect(context.dal.monthlyProduction.deleteByWell).not.toHaveBeenCalled();
	});
});
