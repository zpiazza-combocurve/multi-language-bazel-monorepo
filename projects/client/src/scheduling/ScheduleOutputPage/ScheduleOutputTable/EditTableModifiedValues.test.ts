import { EditTableModifiedValues } from './EditTableModifiedValues';

describe('EditTableModifiedValues', () => {
	let editTableModifiedValues: EditTableModifiedValues;

	beforeEach(() => {
		editTableModifiedValues = new EditTableModifiedValues();
	});

	it('should return undefined if the modified value is not set for the given id and field', () => {
		const result = editTableModifiedValues.getModifiedValue({ id: '1', field: 'testField' });
		expect(result).toBeUndefined();
	});

	it('should set the modified FPD and the FPY value', () => {
		editTableModifiedValues.setModifiedValue({
			id: '1',
			field: 'FPD',
			value: 45055,
			originalField: 'originalField',
			wellName: 'testWell',
			originalData: {},
		});

		const result = editTableModifiedValues.getModifiedValue({ id: '1', field: 'FPD' });
		expect(result).toEqual({
			value: 45055,
			originalField: 'originalField',
		});

		const fpyResult = editTableModifiedValues.getModifiedValue({ id: '1', field: 'FPY' });
		expect(fpyResult).toEqual({
			value: 2023,
		});
	});

	it('should unset the FPD and the FPY value', () => {
		editTableModifiedValues.setModifiedValue({
			id: '1',
			field: 'FPD',
			value: null,
			originalField: 'originalField',
			wellName: 'testWell',
			originalData: {},
		});

		const result = editTableModifiedValues.getModifiedValue({ id: '1', field: 'FPD' });
		expect(result).toEqual({
			value: null,
			originalField: 'originalField',
		});

		const fpyResult = editTableModifiedValues.getModifiedValue({ id: '1', field: 'FPY' });
		expect(fpyResult).toEqual({
			value: 'N/A',
		});
	});

	it('should set the modified field value', () => {
		editTableModifiedValues.setModifiedValue({
			id: '1',
			value: 45054,
			originalField: 'originalField',
			stepIdx: 1,
			field: 'testField',
			wellName: 'testWell',
			originalData: {},
		});

		const result = editTableModifiedValues.getModifiedValue({ id: '1', field: 'testField' });
		expect(result).toEqual({
			field: 'testField',
			value: 45054,
			originalField: 'originalField',
			stepIdx: 1,
		});
	});
});
