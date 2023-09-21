import { fields as wellHeaders } from '@/inpt-shared/display-templates/wells/well_headers.json';

export function getWellHeaders(header) {
	return wellHeaders[header];
}
