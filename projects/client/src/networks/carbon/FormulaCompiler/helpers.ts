import { Lexer } from './lexer';
import { Parser } from './parser';
import { FunctionHandle, StreamInput } from './types';

interface ErrorData {
	startIndex?: number;
	endIndex?: number;
	value?: string | null;
}

export class RichError extends Error {
	public errorData: ErrorData | null;
	constructor(message = 'Error: ', errorData: ErrorData | null = null) {
		super(message);
		this.errorData = errorData;
	}
}
export class ValueError extends RichError {
	constructor(message, errorData: ErrorData | null = null) {
		super(message, errorData);
		this.name = 'ValueError';
	}
}

export class SyntaxError extends RichError {
	constructor(message = 'Syntax Error', errorData: ErrorData | null = null) {
		super(message, errorData);
		this.name = 'SyntaxError';
	}
}

export class MathError extends RichError {
	constructor(message, errorData: ErrorData | null = null) {
		super(`Runtime math error: ${message}`, errorData);
		this.name = 'MathError';
	}
}

export type AnyRichError = ValueError | SyntaxError | MathError;

function getAvailableFunctions(inputs: StreamInput[]) {
	const available: FunctionHandle[] = [];

	if (inputs.length > 0) {
		available.push(FunctionHandle.FPD);
	}
	return available;
}

export function formulaHasError(formula: string, inputs: StreamInput[] = []): false | string | AnyRichError {
	try {
		const lexer = new Lexer(formula);
		const tokens = lexer.generateTokens();
		for (const token of tokens) {
			const functions = getAvailableFunctions(inputs);
			const result = token.isValid(inputs, functions);
			if (result !== true) {
				return new ValueError(result, {
					startIndex: token.startIndex,
					endIndex: token.endIndex,
					value: token.value,
				});
			}
		}
		const parser = new Parser(tokens);
		const tree = parser.parse();
		if (tree === null) return false;
		tree.toString();
		return false;
	} catch (error) {
		if ([ValueError, SyntaxError, MathError].includes(error.constructor) && error.errorData) {
			return error as AnyRichError;
		}
		return error.message;
	}
}
