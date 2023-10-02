import { FieldNameError, RequiredFieldError, TypeError, ValueError } from '@src/helpers/validation';

import { MultipleValidationError } from '../multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS, NonNullableFieldError, parseApiWell, ReadOnlyFieldError } from './validation';
import { readOnlyFields } from './fields';

describe('v1/wells/validation', () => {
	test('parseApiWell', () => {
		if (ERROR_ON_EXTRANEOUS_FIELDS) {
			// eslint-disable-next-line jest/no-conditional-expect
			expect(() => parseApiWell({ api14: '11111111111111', extraneousField: 'test', dataSource: 'di' })).toThrow(
				FieldNameError,
			);
		}

		expect(() => parseApiWell({ chosenID: 1, dataSource: 'di' })).toThrow(TypeError);
		expect(() => parseApiWell({ chosenID: '11111111111111', dataSource: 'error' })).toThrow(ValueError);
		expect(() => parseApiWell({ api14: '11111111111111', dataSource: 'di', dataPool: 'external' })).toThrow(
			ReadOnlyFieldError,
		);
		expect(() => parseApiWell({ chosenID: '11111111111111' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'di' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'other' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'internal' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'di' })).toThrow(
			new RequiredFieldError('Missing required field: `chosenID`'),
		);
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111' })).not.toThrow();
		expect(() => parseApiWell({ dataSource: 'di', api14: '11111111111111' })).not.toThrow();
		expect(() => parseApiWell({ dataSource: 'other', api14: '11111111111111' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'other', chosenID: '11111111111111' })).not.toThrow();
		expect(() => parseApiWell({ dataSource: 'internal', api14: '11111111111111' })).toThrow(RequiredFieldError);
		expect(() => parseApiWell({ dataSource: 'internal', chosenID: '11111111111111' })).not.toThrow();
		expect(() => parseApiWell({})).toThrow(MultipleValidationError);

		const readOnlyField = readOnlyFields.find((field) => field !== 'id') ?? '';
		expect(() => parseApiWell({ api14: '11111111111111', dataSource: 'di', [readOnlyField]: 'test' })).toThrow(
			ReadOnlyFieldError,
		);

		expect(() => parseApiWell({ dataSource: 'di', api14: '11111111111111', azimuth: '9999' })).toThrow(TypeError);
		expect(() => parseApiWell({ dataSource: 'di', api14: '11111111111111', tubingId: '9999' })).toThrow(TypeError);

		expect(() => parseApiWell({ dataSource: null, chosenID: '11111111111111' }, undefined, true)).toThrow(
			NonNullableFieldError,
		);
		expect(() => parseApiWell({ dataSource: 'di', chosenID: null }, undefined, true)).toThrow(
			NonNullableFieldError,
		);

		expect(() => parseApiWell({ dataSource: 'internal', chosenID: 'INPTNFAZw0YUZN100000000' })).not.toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ dataSource: 'di', api14: '00000000000014' })).not.toThrow(ValueError);

		expect(() => parseApiWell({ dataSource: 'di', api14: '00000000000abc' })).toThrow(ValueError);

		expect(() => parseApiWell({ dataSource: 'di', api14: '00000000000-14' })).toThrow(ValueError);

		expect(() => parseApiWell({ dataSource: 'di', api14: '0123456789' })).toThrow(ValueError);

		expect(() => parseApiWell({ dataSource: 'di', api14: '0000000000001400' })).toThrow(ValueError);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '000000000012' })).not.toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '000000000abc' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '000000000-12' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '000000-000012' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '0123456789' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api12: '00000000000014' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '0000000010' })).not.toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '0000000abc' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '0000000-10' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '00000-00010' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '012345678' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ chosenID: '21312335', dataSource: 'internal', api10: '000000000012' })).toThrow(
			ValueError,
		);

		expect(() => parseApiWell({ dataSource: 'internal', chosenID: 'abcdefghij_123456789' })).toThrow(ValueError);

		expect(() =>
			parseApiWell({
				dataSource: 'internal',
				chosenID: 'veryLongPhraseThatExceedsMaxAllowedLengthForChosenIDValue',
			}),
		).toThrow(ValueError);

		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', surfaceLongitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', surfaceLatitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() =>
			parseApiWell({ dataSource: 'di', chosenID: '11111111111111', surfaceLongitude: 45, surfaceLatitude: 45 }),
		).not.toThrow();
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', toeLongitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', toeLatitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() =>
			parseApiWell({ dataSource: 'di', chosenID: '11111111111111', toeLongitude: 45, toeLatitude: 45 }),
		).not.toThrow();
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', heelLongitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() => parseApiWell({ dataSource: 'di', chosenID: '11111111111111', heelLatitude: 45 })).toThrow(
			RequiredFieldError,
		);
		expect(() =>
			parseApiWell({ dataSource: 'di', chosenID: '11111111111111', heelLongitude: 45, heelLatitude: 45 }),
		).not.toThrow();
	});
});
