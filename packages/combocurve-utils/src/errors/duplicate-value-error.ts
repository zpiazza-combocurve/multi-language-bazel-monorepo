export class DuplicateValueError extends Error {
	expected: boolean;
	internalMessage?: string;
	friendlyMessage?: string;
	constructor(message?: string, internalMessage?: string) {
		super(message);
		this.name = DuplicateValueError.name;
		this.expected = true;
		this.internalMessage = internalMessage;
		this.friendlyMessage = message;
	}
}
