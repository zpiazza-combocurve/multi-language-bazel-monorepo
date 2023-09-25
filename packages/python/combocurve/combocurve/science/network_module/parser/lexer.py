import re
from combocurve.science.network_module.parser.tokens import (Token, TokenType, STR_TO_TOKEN_MAP, StreamToken,
                                                             NumberToken, FunctionHandleToken)

WHITESPACE = ' \n\t'
DIGITS = '0123456789'
letter_re = re.compile('[a-zA-Z]')


def match_whitespace(char: str):
    return char in WHITESPACE


def match_number(char: str):
    return char in (DIGITS + '.')


def match_stream(char: str):
    return letter_re.fullmatch(char)


def match_function_start(char: str):
    return char == '@'


def match_operand(char: str):
    return char in STR_TO_TOKEN_MAP


class Lexer:
    '''
    Lexer class will take raw string input and give tokens output
    '''
    def __init__(self, text: str):
        self.text: str = text
        self.current_index: int = -1
        self.current_char: None | str = None
        self.advance()

    def advance(self):
        self.current_index += 1
        if self.current_index < len(self.text):
            self.current_char = self.text[self.current_index]
        else:
            self.current_char = None

    def generate_tokens(self):
        ret: list[Token] = []
        while self.current_char is not None:
            if match_whitespace(self.current_char):
                self.advance()
            elif match_number(self.current_char):
                ret += [self.generate_number()]
            elif match_function_start(self.current_char):
                ret += [self.generate_function_handle()]
            elif match_stream(self.current_char):
                ret += [self.generate_stream()]
            elif match_operand(self.current_char):
                ret += [self.generate_operand()]
            else:
                raise ValueError(f"Illegal character '{self.current_char}'")

        return ret

    def generate_operand(self) -> Token:
        start_index: int = self.current_index

        operand_str: str = self.current_char
        self.advance()
        return Token(start_index, self.current_index, STR_TO_TOKEN_MAP[operand_str])

    def generate_stream(self) -> StreamToken:
        start_index: int = self.current_index
        stream_str: str = self.current_char
        self.advance()
        while self.current_char is not None and letter_re.fullmatch(self.current_char):
            stream_str += self.current_char
            self.advance()

        return StreamToken(start_index, self.current_index, TokenType.STREAM, stream_str)

    def generate_function_handle(self):
        start_index: int = self.current_index
        function_handle_str: str = self.current_char

        self.advance()
        while self.current_char is not None and letter_re.fullmatch(self.current_char):
            function_handle_str += self.current_char
            self.advance()

        return FunctionHandleToken(start_index, self.current_index, TokenType.FUNCTION_HANDLE, function_handle_str)

    def generate_number(self):
        start_index: int = self.current_index
        number_str: str = self.current_char
        self.advance()

        while self.current_char is not None and match_number(self.current_char):
            number_str += self.current_char
            self.advance()

        ## TODO: delete these lines, python float() can work with ".3" and "3."
        ## do not ned to convert them to a more human-read format
        # if number_str.startswith('.'):
        #     number_str = '0' + number_str

        # if number_str.endswith('.'):
        #     number_str += '0'

        return NumberToken(start_index, self.current_index, TokenType.NUMBER, number_str)
