interface PowerBIErrorDetails {
	method: string;
	url: string;
	status: number;
	requestId: string | null;
	response: string;
	pbiErrorInfo: string | null;
}

export class PBIRequestError extends Error {
	details: PowerBIErrorDetails;

	constructor(details: PowerBIErrorDetails) {
		super(`PowerBI API returned status code ${details.status}`);

		this.name = PBIRequestError.name;
		this.details = details;
	}
}
