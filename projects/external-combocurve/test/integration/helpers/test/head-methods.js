const qs = require('qs');

const testHeadMethod = async (app, baseUrl, requestHeaders, expectCount, queryStringObj) => {
	const queryString = qs.stringify(queryStringObj, { addQueryPrefix: true });
	const headResponse = await app.head(`${baseUrl}${queryString}`).set(requestHeaders);

	expect(headResponse.status).toBe(200);
	expect(headResponse.body).toMatchObject({});
	expect(headResponse.headers['x-query-count']).toBe(`${expectCount}`);

	const getHeadResponse = await app.get(`${baseUrl}/head${queryString}`).set(requestHeaders);

	expect(headResponse.status).toEqual(getHeadResponse.status);
	expect(headResponse.body).toMatchObject(getHeadResponse.body);
	expect(headResponse.headers['x-query-count']).toEqual(getHeadResponse.headers['x-query-count']);
};

module.exports = {
	testHeadMethod,
};
