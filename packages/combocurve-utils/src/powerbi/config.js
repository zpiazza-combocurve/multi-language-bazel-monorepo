const AZURE_AD_TENANT_ID = 'e3906142-939f-47dd-93ac-b60f3ac61b39';
const API_URL = 'https://api.powerbi.com/v1.0/myorg/';
const AUTHORITY_URL = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/`;
const AUTH_RESOURCE_URI = 'https://analysis.windows.net/powerbi/api';

module.exports = {
	API_URL,
	AUTHORITY_URL,
	AUTH_RESOURCE_URI,
};
