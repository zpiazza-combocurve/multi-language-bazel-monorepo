from combocurve.science.network_module.parser.lexer import Lexer
import pytest


def compare(input_str, expected_arr):
    assert list(map(lambda x: x.to_symbol(), Lexer(input_str).generate_tokens())) == expected_arr


@pytest.mark.unittest
def test_lexer():
    compare('Gas + 2', ['Gas', '+', '2'])
    compare('@FPD(123)', ['@FPD', '(', '123', ')'])
    compare('(Gas + 2) * 3 + @FPD(123)', ['(', 'Gas', '+', '2', ')', '*', '3', '+', '@FPD', '(', '123', ')'])

    compare('2 + 1', ['2', '+', '1'])
    compare('2 - 1', ['2', '-', '1'])
    compare('2 * 1', ['2', '*', '1'])
    compare('2 / 1', ['2', '/', '1'])

    compare('Gas + 1', ['Gas', '+', '1'])
    compare('Gas - 1', ['Gas', '-', '1'])
    compare('Gas * 1', ['Gas', '*', '1'])
    compare('Gas / 1', ['Gas', '/', '1'])

    compare('1 + Gas', ['1', '+', 'Gas'])
    compare('1 - Gas', ['1', '-', 'Gas'])
    compare('1 * Gas', ['1', '*', 'Gas'])
    compare('1 / Gas', ['1', '/', 'Gas'])
