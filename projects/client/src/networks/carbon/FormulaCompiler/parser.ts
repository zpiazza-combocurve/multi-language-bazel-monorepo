import { assert } from '@/helpers/utilities';

import { SyntaxError } from './helpers';
import {
	AddNode,
	AnyNode,
	DivideNode,
	FunctionCallNode,
	MinusNode,
	MultiplyNode,
	NumberNode,
	PlusNode,
	StreamNode,
	SubtractNode,
} from './nodes';
import { Token, TokenType } from './tokens';

export class Parser {
	currentToken: Token | null;
	currentIndex: number;
	strIndex: number;
	lParenPos: number;
	constructor(public tokens: Token[]) {
		this.strIndex = 0;
		this.lParenPos = -1;
		this.tokens = tokens;
		this.currentIndex = -1;
		this.currentToken = null;
		this.advance();
	}

	advance() {
		this.currentIndex++;
		if (this.currentIndex < this.tokens.length) {
			this.strIndex += (this.tokens[this.currentIndex].value ?? ' ').length;
			this.currentToken = this.tokens[this.currentIndex];
		} else {
			this.currentToken = null;
		}
	}

	parse(): AnyNode | null {
		const result = this.expr();

		if (this.currentToken !== null) {
			if (this.currentToken.tokenType === TokenType.RPAREN) {
				throw new SyntaxError(`Opening parenthesis not found`, {
					startIndex: this.currentToken.startIndex,
					endIndex: this.currentToken.endIndex,
					value: this.currentToken.value,
				});
			}
			throw new SyntaxError(undefined, {
				startIndex: this.currentToken.startIndex,
				endIndex: this.currentToken.endIndex,
				value: '',
			});
		}

		return result;
	}

	expr() {
		let result: AnyNode = this.term();
		while (
			this.currentToken !== null &&
			this.currentToken?.tokenType &&
			[TokenType.PLUS, TokenType.MINUS].includes(this.currentToken.tokenType)
		) {
			if (this.currentToken.tokenType === TokenType.PLUS) {
				this.advance();
				if ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken?.tokenType)) {
					throw new SyntaxError(undefined, {
						startIndex: this.currentIndex,
						endIndex: this.currentIndex + 1,
						value: '',
					});
				}
				result = new AddNode(result, this.term());
			} else if (this.currentToken.tokenType === TokenType.MINUS) {
				this.advance();
				if ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken?.tokenType)) {
					throw new SyntaxError(undefined, {
						startIndex: this.currentIndex,
						endIndex: this.currentIndex + 1,
						value: '',
					});
				}
				result = new SubtractNode(result, this.term());
			}
		}
		return result;
	}

	term() {
		let result: AnyNode = this.factor();
		while (
			this.currentToken !== null &&
			[TokenType.MULTIPLY, TokenType.DIVIDE].includes(this.currentToken.tokenType as TokenType)
		) {
			if (this.currentToken.tokenType === TokenType.MULTIPLY) {
				this.advance();
				result = new MultiplyNode(result, this.factor());
			} else if (this.currentToken.tokenType === TokenType.DIVIDE) {
				this.advance();
				result = new DivideNode(result, this.factor());
			}
		}
		return result;
	}

	factor() {
		const token = this.currentToken;
		if (token === null)
			throw new SyntaxError(undefined, {
				startIndex: this.tokens[this.currentIndex - 1].startIndex,
				endIndex: this.tokens[this.currentIndex - 1].endIndex,
				value: '',
			});
		if (token.tokenType === TokenType.LPAREN) {
			this.advance();
			const result = this.expr();
			if (this.currentToken?.tokenType !== TokenType.RPAREN) {
				throw new SyntaxError(`Closing parenthesis not found`, {
					startIndex: token.startIndex,
					endIndex: token.endIndex,
					value: token.value,
				});
			}
			this.advance();
			return result;
		} else if (token.tokenType === TokenType.FUNCTION_HANDLE) {
			return this.functionCallFactor();
		} else if (token.tokenType === TokenType.STREAM) {
			this.advance();
			assert(token.value !== null, 'Token value is null');
			return new StreamNode(token.value);
		} else if (token.tokenType === TokenType.NUMBER) {
			this.advance();
			assert(token.value !== null, 'Token value is null');
			return new NumberNode(token.value);
		} else if (token?.tokenType === TokenType.PLUS) {
			this.advance();
			return new PlusNode(this.factor());
		} else if (token?.tokenType === TokenType.MINUS) {
			this.advance();
			return new MinusNode(this.factor());
		} else if (token?.tokenType === TokenType.RPAREN) {
			throw new SyntaxError(`Opening parenthesis not found`, {
				startIndex: token.startIndex,
				endIndex: token.endIndex,
				value: token.value,
			});
		}
		throw new SyntaxError(undefined, {
			startIndex: token.startIndex,
			endIndex: token.endIndex,
			value: token.value,
		});
	}

	functionCallFactor(): FunctionCallNode {
		const functionHandleToken = this.currentToken;
		assert(functionHandleToken !== null, 'Token value is null');
		this.advance();
		if (!this.currentToken) {
			throw new SyntaxError(undefined, {
				startIndex: this.currentIndex,
				endIndex: this.currentIndex + 1,
				value: '',
			});
		}
		if (this.currentToken.tokenType !== TokenType.LPAREN) {
			throw new SyntaxError(`Expected opening parenthesis`, {
				startIndex: this.currentToken.startIndex,
				endIndex: this.currentToken.endIndex,
				value: this.currentToken.value,
			});
		}
		this.lParenPos = this.strIndex;
		this.advance();
		const functionInputNode = this.functionInput();
		this.advance();

		//@ts-expect-error NOTE: The advance() call above will update this.currentToken, but TS doesn't know that
		if (this.currentToken?.tokenType !== TokenType.RPAREN) {
			throw new SyntaxError(`Expected closing parenthesis`, {
				startIndex: this.lParenPos - 1 ?? this.strIndex,
				endIndex: this.lParenPos ?? this.strIndex + 1,
				value: '',
			});
		}

		this.advance();
		assert(functionHandleToken.value !== null, 'Token value is null');
		return new FunctionCallNode(functionHandleToken.value, functionInputNode);
	}

	functionInput(): NumberNode {
		if (this.currentToken?.tokenType === TokenType.NUMBER) {
			assert(this.currentToken.value !== null, 'Token value is null');
			return new NumberNode(this.currentToken.value);
		}
		throw new SyntaxError(`Function input not found`, {
			startIndex: this.strIndex - (this.tokens[this.currentIndex - 1].value ?? ' ').length,
			endIndex: this.strIndex,
			value: '',
		});
	}
}
