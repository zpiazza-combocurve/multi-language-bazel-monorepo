import { fuzzySearch, matchText } from './regexp';

describe('fuzzySearch', () => {
	test('regexp', () => {
		expect('state').toMatch(fuzzySearch('sat'));
		expect('state').toMatch(fuzzySearch('sat '));
	});
});

describe('matchText', () => {
	it('should not break with parenthesis', () => {
		expect(matchText('text', '(')).toBeFalsy();
	});

	it('works', () => {
		expect(matchText('text', 'ex')).toBeTruthy();
	});
});
