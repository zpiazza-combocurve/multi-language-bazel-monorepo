import { fullNameAndLocalDate } from '@/helpers/user';

const DEFAULT_TIMEZONE = 'America/New_York';

const inTZ = (date: Date, tz: string = DEFAULT_TIMEZONE) => date.toLocaleString('en-US', { timeZone: tz });

const TEST_DATE = inTZ(new Date('2020-01-01T08:00:00+00:00'));

describe('fullNameAndLocalDate', () => {
	it('returns N/A and date when user is missing', () => {
		const resultBlankUser = fullNameAndLocalDate('', TEST_DATE);
		expect(resultBlankUser).toEqual('N/A  |  1/1/2020');

		const resultNullUser = fullNameAndLocalDate(null, TEST_DATE);
		expect(resultNullUser).toEqual('N/A  |  1/1/2020');
	});

	it('returns N/A and date when firstName and lastName are missing', () => {
		const result = fullNameAndLocalDate({ firstName: '', lastName: '' }, TEST_DATE);
		expect(result).toEqual('N/A  |  1/1/2020');
	});

	it('returns both full name and date', () => {
		const result = fullNameAndLocalDate({ firstName: 'First', lastName: 'Last' }, TEST_DATE);
		expect(result).toEqual('First Last  |  1/1/2020');
	});

	it('returns full name and N/A when date is missing', () => {
		const resultBlankDate = fullNameAndLocalDate({ firstName: 'First', lastName: 'Last' }, '');
		expect(resultBlankDate).toEqual('First Last  |  N/A');

		const resultNullDate = fullNameAndLocalDate({ firstName: 'First', lastName: 'Last' }, null);
		expect(resultNullDate).toEqual('First Last  |  N/A');
	});
});
