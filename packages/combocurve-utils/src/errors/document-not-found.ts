export class DocumentNotFoundError extends Error {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	details: any;
	expected: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	constructor(message?: string, details?: any) {
		super(message);
		this.name = DocumentNotFoundError.name;
		this.details = details;
		this.expected = true;
	}
}
