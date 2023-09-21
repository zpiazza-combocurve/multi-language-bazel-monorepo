import { timestamp } from './timestamp';

test('should work', () => {
	expect(timestamp(new Date('December 17, 1995 03:24:00'))).toBe('19951217t032400');
});
