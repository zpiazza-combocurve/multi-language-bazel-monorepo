import { checkAddDeleteRow } from './PriceModel';

describe('checkAddDeleteRow', () => {
	test('returns the correct add and delete properties based on the price model', () => {
		const priceModel = {
			oil: {
				subItems: { row_view: { rows: [{ price: 100, criteria: { start_date: '2023-01-01', period: 12 } }] } },
			},
			gas: {
				subItems: {
					row_view: {
						rows: [
							{ price: 50, criteria: { start_date: '2023-01-01', period: 12 } },
							{ price: 0, criteria: { start_date: '2024-01-01' } },
						],
					},
				},
			},
			ngl: {
				subItems: {
					row_view: {
						rows: [
							{ price: 0, criteria: { start_date: '2023-01-01' } },
							{ price: 25, criteria: { period: 6 } },
						],
					},
				},
			},
			drip_condensate: {
				subItems: { row_view: { rows: [{ price: 75, criteria: { start_date: '2023-01-01', period: 12 } }] } },
			},
		};

		const expectedResult = {
			oil: { add: true, delete: false, showBtn: true },
			gas: { add: true, delete: true, showBtn: true },
			ngl: { add: true, delete: true, showBtn: true },
			drip_condensate: { add: true, delete: false, showBtn: true },
			showAdd: true,
			showDel: true,
		};

		expect(checkAddDeleteRow(priceModel)).toEqual(expectedResult);
	});

	test('returns correct values for empty rows and missing criteria', () => {
		const priceModel = {
			oil: { subItems: { row_view: { rows: [{}] } } },
			gas: { subItems: { row_view: { rows: [{ price: 50, criteria: {} }] } } },
			ngl: { subItems: { row_view: { rows: [{ price: 25, criteria: { period: 6 } }] } } },
			drip_condensate: { subItems: { row_view: { rows: [{ price: 75 }] } } },
		};

		const expectedResult = {
			oil: { add: false, delete: false, showBtn: false },
			gas: { add: false, delete: false, showBtn: false },
			ngl: { add: true, delete: false, showBtn: true },
			drip_condensate: { add: false, delete: false, showBtn: false },
			showAdd: true,
		};

		expect(checkAddDeleteRow(priceModel)).toEqual(expectedResult);
	});
});
