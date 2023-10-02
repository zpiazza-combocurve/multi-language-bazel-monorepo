const testDeleteMethod = async (app, baseUrl, requestHeaders, expectCount) => {
	const deleteResponse = await app.delete(`${baseUrl}`).set(requestHeaders);
	expect(deleteResponse.status).toBe(204);
	expect(deleteResponse.body).toMatchObject({});
	expect(deleteResponse.headers['x-delete-count']).toBe(`${expectCount}`);
};
module.exports = {
	testDeleteMethod,
};
