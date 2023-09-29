import pytest
from combocurve.science.network_module.parser.tokens import (TokenType, Token, NumberToken, StreamToken,
                                                             FunctionHandleToken)
from .test_data.test_shared_data import stream_inputs, functions

@pytest.mark.unittest
def test_valid_token_initialization():
    assert Token(0, 1, TokenType.PLUS).to_string() == '<0-1;PLUS;None>'
    assert Token(0, 1, TokenType.PLUS).to_symbol() == '+'
    assert Token(0, 1, TokenType.MINUS).to_string() == '<0-1;MINUS;None>'
    assert Token(0, 1, TokenType.MINUS).to_symbol() == '-'
    assert Token(0, 1, TokenType.MULTIPLY).to_string() == '<0-1;MULTIPLY;None>'
    assert Token(0, 1, TokenType.MULTIPLY).to_symbol() == '*'
    assert Token(0, 1, TokenType.DIVIDE).to_string() == '<0-1;DIVIDE;None>'
    assert Token(0, 1, TokenType.DIVIDE).to_symbol() == '/'
    assert Token(0, 1, TokenType.LPAREN).to_string() == '<0-1;LPAREN;None>'
    assert Token(0, 1, TokenType.LPAREN).to_symbol() == '('
    assert Token(0, 1, TokenType.RPAREN).to_string() == '<0-1;RPAREN;None>'
    assert Token(0, 1, TokenType.RPAREN).to_symbol() == ')'
    assert NumberToken(0, 5, TokenType.NUMBER, '12.32').to_string() == '<0-5;NUMBER;12.32>'
    assert NumberToken(0, 5, TokenType.NUMBER, '12.32').to_symbol() == '12.32'
    assert StreamToken(0, 3, TokenType.STREAM, 'Oil').to_string() == '<0-3;STREAM;Oil>'
    assert StreamToken(0, 3, TokenType.STREAM, 'Oil').to_symbol() == 'Oil'
    assert FunctionHandleToken(0, 4, TokenType.FUNCTION_HANDLE, '@FPD').to_string() == '<0-4;FUNCTION_HANDLE;@FPD>'
    assert FunctionHandleToken(0, 4, TokenType.FUNCTION_HANDLE, '@FPD').to_symbol() == '@FPD'


@pytest.mark.unittest
def test_invalid_token_initialization():
    ## input type error
    with pytest.raises(TypeError, match='Invalid input type!'):
        Token('0', 1, TokenType.PLUS)
    with pytest.raises(TypeError, match='Invalid input type!'):
        Token(0, '1', TokenType.PLUS)
    with pytest.raises(TypeError, match='Invalid input type!'):
        Token(0, 1, 'PLUS')

    ## invalid value
    with pytest.raises(ValueError, match='Value input must be None for token: PLUS!'):
        Token(0, 1, TokenType.PLUS, 'random_value')
    with pytest.raises(ValueError, match='Value input must be None for token: MINUS!'):
        Token(0, 1, TokenType.MINUS, 'random_value')
    with pytest.raises(ValueError, match='Value input must be None for token: MULTIPLY!'):
        Token(0, 1, TokenType.MULTIPLY, 'random_value')
    with pytest.raises(ValueError, match='Value input must be None for token: DIVIDE!'):
        Token(0, 1, TokenType.DIVIDE, 'random_value')
    with pytest.raises(ValueError, match='Value input must be None for token: LPAREN!'):
        Token(0, 1, TokenType.LPAREN, 'random_value')
    with pytest.raises(ValueError, match='Value input must be None for token: RPAREN!'):
        Token(0, 1, TokenType.RPAREN, 'random_value')

    ## start_index and end_index not matching value error
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: PLUS!'):
        Token(0, 2, TokenType.PLUS)
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: MINUS!'):
        Token(0, 2, TokenType.MINUS)
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: MULTIPLY!'):
        Token(0, 2, TokenType.MULTIPLY)
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: DIVIDE!'):
        Token(0, 2, TokenType.DIVIDE)
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: LPAREN!'):
        Token(0, 2, TokenType.LPAREN)
    with pytest.raises(ValueError, match='Difference between start_index and end_index must be 1 for token: RPAREN!'):
        Token(0, 2, TokenType.RPAREN)

    with pytest.raises(ValueError, match='Length of value input does not match end_index - start_index!'):
        NumberToken(3, 7, TokenType.NUMBER, '12.34')
    with pytest.raises(ValueError, match='Length of value input does not match end_index - start_index!'):
        NumberToken(0, 4, TokenType.NUMBER, '12.')

    with pytest.raises(ValueError, match='Length of value input does not match end_index - start_index!'):
        StreamToken(0, 2, TokenType.STREAM, 'Gas')

    with pytest.raises(ValueError, match='Length of value input does not match end_index - start_index!'):
        FunctionHandleToken(6, 7, TokenType.FUNCTION_HANDLE, '@FPD')


@pytest.mark.unittest
def test_token_check_invalid():
    assert Token(0, 1, TokenType.PLUS).is_valid(stream_inputs, functions)
    assert Token(0, 1, TokenType.MINUS).is_valid(stream_inputs, functions)
    assert Token(0, 1, TokenType.MULTIPLY).is_valid(stream_inputs, functions)
    assert Token(0, 1, TokenType.DIVIDE).is_valid(stream_inputs, functions)
    assert Token(0, 1, TokenType.LPAREN).is_valid(stream_inputs, functions)
    assert Token(0, 1, TokenType.RPAREN).is_valid(stream_inputs, functions)

    assert NumberToken(0, 5, TokenType.NUMBER, '12.32').is_valid(stream_inputs, functions)
    assert not NumberToken(0, 8, TokenType.NUMBER, '12.32.32').is_valid(stream_inputs, functions)

    assert StreamToken(0, 3, TokenType.STREAM, 'Oil').is_valid(stream_inputs, functions)
    assert StreamToken(0, 3, TokenType.STREAM, 'Gas').is_valid(stream_inputs, functions)
    assert not StreamToken(0, 5, TokenType.STREAM, 'Water').is_valid(stream_inputs, functions)

    assert FunctionHandleToken(0, 4, TokenType.FUNCTION_HANDLE, '@FPD').is_valid(stream_inputs, functions)
    assert not FunctionHandleToken(0, 4, TokenType.FUNCTION_HANDLE, '@Fpd').is_valid(stream_inputs, functions)
    assert not FunctionHandleToken(3, 8, TokenType.FUNCTION_HANDLE, '@FQD1').is_valid(stream_inputs, functions)
