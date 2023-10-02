import { Types } from 'mongoose';

import {
	isValidObjectId,
	OperatorError,
	parseNumber,
	parseNumberStrict,
	parseQueryIsoDate,
	parseQueryIsoDateElement,
	TypeError,
	ValueError,
} from './validation';

describe('v1/validation', () => {
	test('isValidObjectId', () => {
		expect(isValidObjectId('a')).toBe(false);
		expect(isValidObjectId('10')).toBe(false);
		expect(isValidObjectId('12345')).toBe(false);
		expect(isValidObjectId('5e272d38b78910dd2a1bd695')).toBe(true);
		expect(isValidObjectId('5e272d38b78910dd2a1bd696')).toBe(true);
		expect(isValidObjectId(Types.ObjectId('5e272d38b78910dd2a1bd695'))).toBe(true);
		expect(isValidObjectId('5e272d38b78910dd2a1bd69')).toBe(false);
		expect(isValidObjectId('5e272d38b78910dd2a1bd6951')).toBe(false);
	});

	test('parseNumber', () => {
		expect(parseNumber('123')).toBe(123);
		expect(parseNumber(456)).toBe(456);
		expect(parseNumber('789', undefined, 700, 900)).toBe(789);
		expect(parseNumber(567, undefined, 567, 900)).toBe(567);
		expect(parseNumber(556, undefined, 500, 556)).toBe(556);
		expect(parseNumber(523, undefined, 523, 523)).toBe(523);

		expect(() => parseNumber({})).toThrow(TypeError);
		expect(() => parseNumber('string')).toThrow(TypeError);
		expect(() => parseNumber('789', undefined, 800, 900)).toThrow(ValueError);
	});

	test('parseNumberStrict', () => {
		expect(parseNumberStrict(456)).toBe(456);
		expect(parseNumberStrict(567, undefined, 567, 900)).toBe(567);
		expect(parseNumberStrict(556, undefined, 500, 556)).toBe(556);
		expect(parseNumberStrict(523, undefined, 523, 523)).toBe(523);

		expect(() => parseNumberStrict('123')).toThrow(TypeError);
		expect(() => parseNumberStrict({})).toThrow(TypeError);
		expect(() => parseNumberStrict('string')).toThrow(TypeError);
		expect(() => parseNumberStrict(789, undefined, 800, 900)).toThrow(ValueError);
	});

	test('parseQueryIsoDateElement', () => {
		expect(parseQueryIsoDateElement('2020-07-30T23:22:50.390Z')).toEqual({
			value: new Date('2020-07-30T23:22:50.390+0000'),
		});
		expect(parseQueryIsoDateElement('2020-07-30')).toEqual({
			value: new Date('2020-07-30'),
		});
		expect(parseQueryIsoDateElement({ gt: '2020-07-30' })).toEqual({
			operator: 'gt',
			value: new Date('2020-07-30'),
		});
		expect(parseQueryIsoDateElement({ gt: '2020-07-30T23:22:50.390Z' })).toEqual({
			operator: 'gt',
			value: new Date('2020-07-30T23:22:50.390+0000'),
		});
		expect(parseQueryIsoDateElement({ ge: '2020-07-30T23:22:50.390Z' })).toEqual({
			operator: 'ge',
			value: new Date('2020-07-30T23:22:50.390+0000'),
		});
		expect(parseQueryIsoDateElement({ lt: '2020-07-30T23:22:50.390Z' })).toEqual({
			operator: 'lt',
			value: new Date('2020-07-30T23:22:50.390+0000'),
		});
		expect(parseQueryIsoDateElement({ le: '2020-07-30T23:22:50.390Z' })).toEqual({
			operator: 'le',
			value: new Date('2020-07-30T23:22:50.390+0000'),
		});
		expect(() => parseQueryIsoDateElement({ unknown: '2020-07-30T23:22:50.390Z' })).toThrow(OperatorError);
	});

	test('parseQueryIsoDate', () => {
		expect(parseQueryIsoDate(['2020-07-30T23:22:50.390Z'])).toEqual([
			{
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
		]);
		expect(parseQueryIsoDate(['2020-07-30'])).toEqual([
			{
				value: new Date('2020-07-30'),
			},
		]);
		expect(parseQueryIsoDate([{ gt: '2020-07-30' }])).toEqual([
			{
				operator: 'gt',
				value: new Date('2020-07-30'),
			},
		]);
		expect(parseQueryIsoDate([{ gt: '2020-07-30T23:22:50.390Z' }])).toEqual([
			{
				operator: 'gt',
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
		]);
		expect(parseQueryIsoDate([{ ge: '2020-07-30T23:22:50.390Z' }])).toEqual([
			{
				operator: 'ge',
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
		]);
		expect(parseQueryIsoDate([{ lt: '2020-07-30T23:22:50.390Z' }])).toEqual([
			{
				operator: 'lt',
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
		]);
		expect(parseQueryIsoDate([{ le: '2020-07-30T23:22:50.390Z' }])).toEqual([
			{
				operator: 'le',
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
		]);
		expect(() => parseQueryIsoDate([{ unknown: '2020-07-30T23:22:50.390Z' }])).toThrow(OperatorError);

		expect(parseQueryIsoDate(['2020-07-30T23:22:50.390Z', '2020-07-30'])).toEqual([
			{
				value: new Date('2020-07-30T23:22:50.390+0000'),
			},
			{
				value: new Date('2020-07-30'),
			},
		]);
	});
});
