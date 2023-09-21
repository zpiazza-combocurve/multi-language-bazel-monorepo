import { ValueError } from './helpers';
import { FunctionHandle, StreamInput } from './types';

export const TOKEN_ERROR_MESSAGES = {
	invalidInputType: 'Invalid input type!',
	invalidValue: (tokenType: TokenType, expectedValue: string) =>
		`Value input must be ${expectedValue} for token: ${tokenType}!`,
	indexDifference: (tokenType: TokenType) =>
		`Difference between start_index and end_index must be 1 for token: ${tokenType}!`,
	invalidLength: `Length of value input does not match end_index - start_index!`,
	unknownTokenType: (char: string) => `Character does not have an assigned TokenType: ${char}`,
};
export enum TokenType {
	NUMBER = 'NUMBER',
	PLUS = 'PLUS',
	MINUS = 'MINUS',
	MULTIPLY = 'MULTIPLY',
	DIVIDE = 'DIVIDE',
	LPAREN = 'LPAREN',
	RPAREN = 'RPAREN',
	FUNCTION_HANDLE = 'FUNCTION_HANDLE',
	STREAM = 'STREAM',
}

export const TokenCharacters: Partial<Record<TokenType, string>> = {
	[TokenType.PLUS]: '+',
	[TokenType.MINUS]: '-',
	[TokenType.MULTIPLY]: '*',
	[TokenType.DIVIDE]: '/',
	[TokenType.LPAREN]: '(',
	[TokenType.RPAREN]: ')',
};

export function getTokenTypeFromCharacter(char: string) {
	const result = Object.keys(TokenCharacters).find((key) => TokenCharacters[key] === (char as TokenType));
	if (!result) throw new TypeError(TOKEN_ERROR_MESSAGES.unknownTokenType(char));
	return result;
}

const VALID_STREAM_INPUTS = [StreamInput.GAS, StreamInput.OIL, StreamInput.WATER];
const VALID_FUNCTION_HANDLES = [FunctionHandle.FPD];

export interface ExternalSettings {
	streams: StreamInput[];
	functionHandles: FunctionHandle[];
}

const DEFAULT_TOKEN_PROPS = {
	value: null,
};
export interface TokenConstructorProps {
	startIndex: number;
	endIndex: number;
	tokenType: TokenType;
	value?: string;
}
export class Token {
	tokenType: TokenType;
	value: string | null;
	startIndex: number;
	endIndex: number;
	constructor(props: TokenConstructorProps) {
		const { startIndex, endIndex, tokenType, value } = {
			...props,
			value: props.value || DEFAULT_TOKEN_PROPS.value,
		};
		if (
			typeof startIndex !== 'number' ||
			typeof endIndex !== 'number' ||
			!Object.values(TokenType).includes(tokenType)
		) {
			throw new Error(TOKEN_ERROR_MESSAGES.invalidInputType);
		}

		if (Object.keys(TokenCharacters).includes(tokenType)) {
			if (value !== null) throw new ValueError(TOKEN_ERROR_MESSAGES.invalidValue(tokenType, 'null'));
			if (endIndex !== startIndex + 1) {
				throw new ValueError(TOKEN_ERROR_MESSAGES.indexDifference(tokenType), {
					startIndex,
					endIndex,
					value,
				});
			}
		} else if (endIndex - startIndex !== value?.length) {
			throw new ValueError(TOKEN_ERROR_MESSAGES.invalidLength, {
				startIndex,
				endIndex,
				value,
			});
		}
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.tokenType = tokenType;
		this.value = value ?? null;
	}

	toString(): string {
		return `<${this.startIndex}-${this.endIndex};${this.tokenType};${this.value}>`;
	}

	toSymbol(): string | null {
		if (Object.keys(TokenCharacters).includes(this.tokenType)) {
			return TokenCharacters[this.tokenType] || null;
		}
		return this.value;
	}

	isValid(
		_streamInputs: ExternalSettings['streams'] = VALID_STREAM_INPUTS,
		_functions: ExternalSettings['functionHandles'] = VALID_FUNCTION_HANDLES
	): boolean | string {
		return true;
	}
}

export class NumberToken extends Token {
	public value: string;

	constructor(props: TokenConstructorProps) {
		super(props);
		this.value = props.value as string;
	}

	isValid(
		_streamInputs: ExternalSettings['streams'] = VALID_STREAM_INPUTS,
		_functions: ExternalSettings['functionHandles'] = [FunctionHandle.FPD]
	) {
		let decimalPointCount = 0;
		let i = 0;
		// assert(this.value !== null, 'Token value is null');
		while (i < this.value.length) {
			if (this.value[i] === '.') {
				decimalPointCount++;
			}
			i++;
		}
		return decimalPointCount <= 1;
	}
}

export class StreamToken extends Token {
	isValid(
		streamInputs: ExternalSettings['streams'] = VALID_STREAM_INPUTS,
		_functions: ExternalSettings['functionHandles'] = VALID_FUNCTION_HANDLES
	) {
		if (streamInputs.includes(this.value as StreamInput)) return true;
		else if (VALID_STREAM_INPUTS.includes(this.value as StreamInput))
			return `${this.value} stream needs to be selected as an input to be used`;
		else return `Invalid value: ${this.value}`;
	}
}

export class FunctionHandleToken extends Token {
	isValid(
		_streamInputs: ExternalSettings['streams'] = VALID_STREAM_INPUTS,
		functions: ExternalSettings['functionHandles'] = VALID_FUNCTION_HANDLES
	) {
		return functions.includes(this.value as FunctionHandle) ? true : `${this.value} function is not available`;
	}
}

export function getTokenByType(tokenType, props) {
	if (tokenType === TokenType.NUMBER) return new NumberToken(props);
	else if (tokenType === TokenType.STREAM) return new StreamToken(props);
	else if (tokenType === TokenType.FUNCTION_HANDLE) return new FunctionHandleToken(props);
	else return new Token(props);
}
