import { SyntaxError } from './helpers';
import {
	FunctionHandleToken,
	NumberToken,
	StreamToken,
	Token,
	TokenCharacters,
	TokenType,
	getTokenTypeFromCharacter,
} from './tokens';

// Type Checking Functions
const isNumber = (char: string) => '0123456789'.includes(char) || char === '.';
const isWhitespace = (char: string) => ' \t\n'.includes(char);
const isLetter = (char: string) => /[a-zAZ]/i.test(char);
const isFunctionHandle = (char: string) => char === '@';
const isStream = isLetter;
const isOperand = (char: string) => Object.values(TokenCharacters).includes(char);
export class Lexer {
	currentIndex: number;
	currentCharacter: string | null;

	constructor(public text: string) {
		this.text = text;
		this.currentIndex = -1;
		this.currentCharacter = '';
		this.advance();
	}

	advance() {
		this.currentIndex++;
		if (this.currentIndex < this.text.length) {
			this.currentCharacter = this.text[this.currentIndex];
		} else {
			this.currentCharacter = null;
		}
	}

	generateTokens() {
		const ret: Token[] = [];

		while (this.currentCharacter !== null) {
			if (isWhitespace(this.currentCharacter)) {
				this.advance();
			} else if (isNumber(this.currentCharacter)) {
				ret.push(this.generateNumber());
			} else if (isFunctionHandle(this.currentCharacter)) {
				ret.push(this.generateFunctionHandle());
			} else if (isStream(this.currentCharacter)) {
				ret.push(this.generateStream());
			} else if (isOperand(this.currentCharacter)) {
				ret.push(this.generateOperand());
			} else {
				throw new SyntaxError(`Invalid character: ${this.currentCharacter}`, {
					startIndex: this.currentIndex,
					endIndex: this.currentIndex + 1,
					value: this.currentCharacter,
				});
			}
		}
		return ret;
	}

	generateNumber(): NumberToken {
		const startIndex = this.currentIndex;
		let numberString = this.currentCharacter;
		if (numberString === null)
			throw new SyntaxError(undefined, {
				startIndex: this.currentIndex,
				endIndex: this.currentIndex + 1,
				value: '',
			});
		this.advance();

		while (this.currentCharacter !== null && isNumber(this.currentCharacter)) {
			numberString += this.currentCharacter;
			this.advance();
		}

		return new NumberToken({
			startIndex,
			endIndex: this.currentIndex,
			tokenType: TokenType.NUMBER,
			value: numberString,
		});
	}

	generateFunctionHandle(): FunctionHandleToken {
		const startIndex = this.currentIndex;
		let functionHandleString = this.currentCharacter;
		if (functionHandleString === null)
			throw new SyntaxError(undefined, {
				startIndex: this.currentIndex,
				endIndex: this.currentIndex + 1,
				value: '',
			});
		this.advance();

		while (this.currentCharacter !== null && isLetter(this.currentCharacter)) {
			functionHandleString += this.currentCharacter;
			this.advance();
		}

		return new FunctionHandleToken({
			startIndex,
			endIndex: this.currentIndex,
			tokenType: TokenType.FUNCTION_HANDLE,
			value: functionHandleString,
		});
	}

	generateStream(): StreamToken {
		const startIndex = this.currentIndex;
		let streamString = this.currentCharacter;
		if (streamString === null)
			throw new SyntaxError(undefined, {
				startIndex: this.currentIndex,
				endIndex: this.currentIndex + 1,
				value: '',
			});
		this.advance();

		while (this.currentCharacter !== null && isStream(this.currentCharacter)) {
			streamString += this.currentCharacter;
			this.advance();
		}

		return new StreamToken({
			startIndex,
			endIndex: this.currentIndex,
			tokenType: TokenType.STREAM,
			value: streamString,
		});
	}

	generateOperand(): Token {
		const startIndex = this.currentIndex;
		const operandString = this.currentCharacter;
		if (operandString === null)
			throw new SyntaxError(undefined, {
				startIndex: this.currentIndex,
				endIndex: this.currentIndex + 1,
				value: '',
			});
		this.advance();

		return new Token({
			startIndex,
			endIndex: this.currentIndex,
			tokenType: getTokenTypeFromCharacter(operandString) as TokenType,
		});
	}
}
