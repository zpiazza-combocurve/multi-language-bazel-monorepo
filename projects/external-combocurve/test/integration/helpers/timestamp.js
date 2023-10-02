/**
 * @typedef {Object} WithTimestamp
 * @property {Date} updatedAt
 * @property {Date} createdAt
 */

/**
 * @template {WithTimestamp} T
 * @param {T[]} daily
 */
const splitTimestamp = (daily) => {
	return daily.map(({ createdAt, updatedAt, ...withoutTimestamp }) => ({
		withoutTimestamp: { ...withoutTimestamp },
		timestamp: {
			createdAt: typeof createdAt == 'string' ? new Date(createdAt) : createdAt,
			updatedAt: typeof updatedAt == 'string' ? new Date(updatedAt) : updatedAt,
		},
	}));
};

/**
 *
 * @param {WithTimestamp} expected
 * @param {WithTimestamp} received
 * @param {number} milliseconds
 * @returns
 */
const expectToBeCloseTimestamp = (
	received,
	expected = { createdAt: new Date(), updatedAt: new Date() },
	milliseconds = 10000,
) => {
	expect(expected.createdAt).toBeTruthy();
	expect(received.createdAt).toBeTruthy();
	expect(Math.abs(expected.createdAt.getTime() - received.createdAt.getTime())).toBeLessThan(milliseconds);

	expect(expected.updatedAt).toBeTruthy();
	expect(received.updatedAt).toBeTruthy();
	expect(Math.abs(expected.updatedAt.getTime() - received.updatedAt.getTime())).toBeLessThan(milliseconds);
};

module.exports = {
	expectToBeCloseTimestamp,
	splitTimestamp,
};
