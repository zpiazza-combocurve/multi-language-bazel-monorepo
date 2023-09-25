from enum import Enum
from typing import Union


class TokenType(Enum):
    NUMBER = 'number'
    PLUS = 'plus'
    MINUS = 'minus'
    MULTIPLY = 'multiply'
    DIVIDE = 'divide'
    LPAREN = 'lparen'
    RPAREN = 'rparen'
    FUNCTION_HANDLE = 'function_handle'
    STREAM = 'stream'


STR_TO_TOKEN_MAP = {
    '+': TokenType.PLUS,
    '-': TokenType.MINUS,
    '*': TokenType.MULTIPLY,
    '/': TokenType.DIVIDE,
    '(': TokenType.LPAREN,
    ')': TokenType.RPAREN,
}

TOKEN_TO_STR_MAP = {value: key for key, value in STR_TO_TOKEN_MAP.items()}


class Token:
    start_index: int
    end_index: int
    token_type: TokenType
    value: Union[str, None]

    def __init__(self, start_index: int, end_index: int, token_type: TokenType, value=None):
        if type(start_index) != int or type(end_index) != int or type(token_type) != TokenType:
            raise TypeError('Invalid input type!')

        if token_type in STR_TO_TOKEN_MAP.values():
            if value is not None:
                raise ValueError(f'Value input must be None for token: {token_type.name}!')

            if end_index != start_index + 1:
                raise ValueError(
                    f'Difference between start_index and end_index must be 1 for token: {token_type.name}!')
        else:
            if end_index - start_index != len(value):
                raise ValueError('Length of value input does not match end_index - start_index!')

        self.start_index = start_index
        self.end_index = end_index
        self.token_type = token_type
        self.value = value

    def to_string(self) -> str:
        return '<' + f'{self.start_index}-{self.end_index};{self.token_type.name};{self.value}' + '>'

    def to_symbol(self) -> str:
        if self.token_type in TOKEN_TO_STR_MAP:
            return TOKEN_TO_STR_MAP[self.token_type]

        return self.value

    def is_valid(self, stream_inputs: dict, functions: dict) -> bool:
        return True


class NumberToken(Token):
    def is_valid(self, stream_inputs: dict, functions: dict):
        ## only 1 decimal point is allowed in number token
        decimal_point_count = 0
        for v in self.value:
            if v == '.':
                decimal_point_count += 1

        return decimal_point_count <= 1


class StreamToken(Token):
    def is_valid(self, stream_inputs: dict, functions: dict):
        ## check if this stream is in the input name list
        return self.value in stream_inputs


class FunctionHandleToken(Token):
    def is_valid(self, stream_inputs: dict, functions: dict):
        ## check if this function handle is supported
        return self.value in functions
