import { escapeRegExp } from 'lodash';

import {
	camelizeObjectKeys,
	capitalize,
	hasNonWhitespace,
	hexToRgba,
	isEmail,
	replaceVars,
	snakelizeObjectKeys,
	titleize,
} from './text';

describe('helpers/text', () => {
	test('capitalize()', () => {
		expect(capitalize('')).toEqual('');
		expect(capitalize('stream')).toEqual('Stream');
		expect(capitalize('stream properties')).toEqual('Stream Properties');
		expect(capitalize(' stream  properties ')).toEqual('Stream Properties');
		expect(capitalize('stream-properties')).toEqual('Stream Properties');
		expect(capitalize('stream_properties')).toEqual('Stream Properties');
		expect(capitalize('STREAM_PROPERTIES')).toEqual('Stream Properties');
		expect(capitalize('pricing and differentials')).toEqual('Pricing And Differentials');
		expect(capitalize('pricing & differentials')).toEqual('Pricing & Differentials');
	});

	test('titleize()', () => {
		expect(titleize('')).toEqual('');
		expect(titleize('Invalid Params')).toEqual('Invalid Params');
		expect(titleize('Invalid-Params')).toEqual('Invalid Params');
		expect(titleize('Invalid_Params')).toEqual('Invalid Params');
		expect(titleize('Invalid.Params')).toEqual('Invalid Params');
		expect(titleize('InvalidParams')).toEqual('Invalid Params');
		expect(titleize('InvalidAPICall')).toEqual('Invalid API Call');
	});

	test('escapeRegExp()', () => {
		expect(escapeRegExp('CLC 34-12184')).toEqual('CLC 34-12184');
		expect(escapeRegExp('BURNS [HORIZONTAL]')).toEqual('BURNS \\[HORIZONTAL\\]');
		expect(escapeRegExp('*MATTIE (MAE) SMITH {2006}')).toEqual('\\*MATTIE \\(MAE\\) SMITH \\{2006\\}');
	});

	test('hexToRgba()', () => {
		expect(hexToRgba('#fff')).toEqual('rgba(255,255,255,1)');
		expect(hexToRgba('#000', 0.5)).toEqual('rgba(0,0,0,0.5)');
		expect(hexToRgba('#fbafff')).toEqual('rgba(251,175,255,1)');
		expect(hexToRgba('#fbafff', 0.3)).toEqual('rgba(251,175,255,0.3)');
		expect(hexToRgba('rgba(200,200,200,0.5)')).toEqual('rgba(200,200,200,0.5)');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		expect(() => hexToRgba('#f00', 'A')).toThrow();
	});

	test('isEmail()', () => {
		expect(isEmail('a@b.c')).toEqual(true);
		expect(isEmail('è@è.è')).toEqual(true); // Thanks Carlos Antonio Peña Ramón for this one
		expect(isEmail('a@b.c.d')).toEqual(true);
		expect(isEmail(' a@b.c')).toEqual(true);
		expect(isEmail('a @b.c')).toEqual(false);
		expect(isEmail('a@ b.c')).toEqual(false);
		expect(isEmail('a@b .c')).toEqual(false);
		expect(isEmail('a@b. c')).toEqual(false);
		expect(isEmail('a@b.c ')).toEqual(true);
		expect(isEmail('')).toEqual(false);
		expect(isEmail(' ')).toEqual(false);
		expect(isEmail('a@')).toEqual(false);
		expect(isEmail('a')).toEqual(false);
		expect(isEmail('a@v')).toEqual(false);
		expect(isEmail('a@.com')).toEqual(false);
		expect(isEmail('a@a@b.c')).toEqual(false);
		expect(isEmail('a@b.a@c')).toEqual(false);
		expect(isEmail('a@ab.@c')).toEqual(false);
	});

	test('hasNonWhitespace()', () => {
		expect(hasNonWhitespace('a')).toEqual(true);
		expect(hasNonWhitespace(' a')).toEqual(true);
		expect(hasNonWhitespace('a ')).toEqual(true);
		expect(hasNonWhitespace(' a ')).toEqual(true);
		expect(hasNonWhitespace('')).toEqual(false);
		expect(hasNonWhitespace(' ')).toEqual(false);
		expect(hasNonWhitespace('	')).toEqual(false);
	});

	test('replaceVars()', () => {
		expect(replaceVars('$EUR_UNIT', { EUR_UNIT: 'cumsum_oil' })).toEqual('cumsum_oil');
		expect(replaceVars('$PHASE_EUR_UNIT/FT', { PHASE_EUR: 'cumsum_oil' })).toEqual('$PHASE_EUR_UNIT/FT');
	});

	test('snakelizeObjectKeys()', () => {
		expect(snakelizeObjectKeys({ firstKey: 1, secondKey: 2, thirdKey: 3 })).toEqual({
			first_key: 1,
			second_key: 2,
			third_key: 3,
		});
		expect(snakelizeObjectKeys({ FirstKey: 1, SecondKey: 2, ThirdKey: 3 })).toEqual({
			first_key: 1,
			second_key: 2,
			third_key: 3,
		});
	});

	test('camelizeObjectKeys()', () => {
		expect(
			camelizeObjectKeys({
				first_key: 1,
				second_key: 2,
				third_key: 3,
			})
		).toEqual({ firstKey: 1, secondKey: 2, thirdKey: 3 });
		expect(camelizeObjectKeys({ FirstKey: 1, SecondKey: 2, ThirdKey: 3 })).toEqual({
			firstKey: 1,
			secondKey: 2,
			thirdKey: 3,
		});
	});
});
