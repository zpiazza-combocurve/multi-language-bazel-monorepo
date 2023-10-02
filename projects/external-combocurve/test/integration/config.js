const {
	API_TESTS_KEY,
	API_TESTS_TOKEN,
	API_TESTS_WRITER_CS,
	API_URL,
	FLEX_SERVER_URL,
	GCP_REGIONAL_PROJECT_ID,
	TENANT_NAME,
} = process.env;

const config = {
	apiUrl: API_URL.replace(/\/$/g, ''),
	dbConnectionString: API_TESTS_WRITER_CS,
	flexServerUrl: FLEX_SERVER_URL || `https://flex-cc-dot-${GCP_REGIONAL_PROJECT_ID}.appspot.com`,
	headers: { 'X-API-Key': API_TESTS_KEY, Authorization: `Bearer ${API_TESTS_TOKEN}` },
	tenantName: TENANT_NAME,
};

module.exports = config;
