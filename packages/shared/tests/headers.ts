import { ITenantHeaderInfo, TENANT_HEADER_MAPPINGS } from '../src/helpers/tenant';

export const getTestHeaders = (): ITenantHeaderInfo => {
	const baseHeader = {};
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
	for (const [_, value] of Object.entries(TENANT_HEADER_MAPPINGS)) {
		baseHeader[value] = value;
	}
	return baseHeader as ITenantHeaderInfo;
};
