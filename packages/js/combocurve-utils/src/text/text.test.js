// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { escapeRegExp } = require('./text');

describe('utilities/text', () => {
	test('escapeRegExp()', () => {
		expect(escapeRegExp('CLC 34-12184')).toEqual('CLC 34\\-12184');
		expect(escapeRegExp('BURNS [HORIZONTAL]')).toEqual('BURNS \\[HORIZONTAL\\]');
		expect(escapeRegExp('*MATTIE (MAE) SMITH {2006}')).toEqual('\\*MATTIE \\(MAE\\) SMITH \\{2006\\}');
	});
});
