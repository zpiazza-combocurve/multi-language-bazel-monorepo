import pytest
import numpy as np
import datetime

from .test_data.test_shared_data import stream_inputs, functions
from combocurve.science.network_module.parser.lexer import Lexer
from combocurve.science.network_module.parser.parser import Parser


def compare_stream(stream_a, stream_b):
    return (stream_a['date'] == stream_b['date']).all() and (stream_a['value'] == stream_b['value']).all()


def get_ast(input_str):
    tokens = Lexer(input_str).generate_tokens()
    return Parser(tokens).parse()


@pytest.mark.unittest
def test_parser_to_string():
    ## factors
    assert get_ast('123').to_string() == '[123]'
    assert get_ast('Oil').to_string() == '[Oil]'
    assert get_ast('@FPD(123)').to_string() == '[@FPD([123])]'

    ## Positive and Negative node
    assert get_ast('+123').to_string() == '[+[123]]'
    assert get_ast('+Oil').to_string() == '[+[Oil]]'
    assert get_ast('+@FPD(123)').to_string() == '[+[@FPD([123])]]'
    assert get_ast('-123').to_string() == '[-[123]]'
    assert get_ast('-Oil').to_string() == '[-[Oil]]'
    assert get_ast('-@FPD(123)').to_string() == '[-[@FPD([123])]]'

    ## Plus
    assert get_ast('1 + 2').to_string() == '[[1]+[2]]'
    assert get_ast('Oil + 1').to_string() == '[[Oil]+[1]]'
    assert get_ast('1 + Oil').to_string() == '[[1]+[Oil]]'
    assert get_ast('Gas + Oil').to_string() == '[[Gas]+[Oil]]'
    assert get_ast('Gas + @FPD(123)').to_string() == '[[Gas]+[@FPD([123])]]'

    ## Subtract
    assert get_ast('1 - 2').to_string() == '[[1]-[2]]'
    assert get_ast('Oil - 1').to_string() == '[[Oil]-[1]]'
    assert get_ast('1 - Oil').to_string() == '[[1]-[Oil]]'
    assert get_ast('Gas - Oil').to_string() == '[[Gas]-[Oil]]'
    assert get_ast('Gas - @FPD(123)').to_string() == '[[Gas]-[@FPD([123])]]'

    ## Multiply
    assert get_ast('1 * 2').to_string() == '[[1]*[2]]'
    assert get_ast('Oil * 1').to_string() == '[[Oil]*[1]]'
    assert get_ast('1 * Oil').to_string() == '[[1]*[Oil]]'
    assert get_ast('Gas * Oil').to_string() == '[[Gas]*[Oil]]'
    assert get_ast('Gas * @FPD(123)').to_string() == '[[Gas]*[@FPD([123])]]'

    ## Divide
    assert get_ast('1 / 2').to_string() == '[[1]/[2]]'
    assert get_ast('Oil / 1').to_string() == '[[Oil]/[1]]'
    assert get_ast('1 / Oil').to_string() == '[[1]/[Oil]]'
    assert get_ast('Gas / Oil').to_string() == '[[Gas]/[Oil]]'
    assert get_ast('Gas / @FPD(123)').to_string() == '[[Gas]/[@FPD([123])]]'

    ## Combination
    assert get_ast('Oil / 2 + @FPD(123)').to_string() == '[[[Oil]/[2]]+[@FPD([123])]]'
    assert get_ast('- (Oil * 2 + Gas / 3) / (Oil - @FPD(123))').to_string(
    ) == '[[-[[[Oil]*[2]]+[[Gas]/[3]]]]/[[Oil]-[@FPD([123])]]]'


@pytest.mark.unittest
def test_parser_eval():
    ## factors
    assert get_ast('123').eval(stream_inputs, functions) == float(123)
    compare_stream(
        get_ast('Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float)
        })

    compare_stream(
        get_ast('@FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([123], dtype=float)
        })

    ## Positive and Negative node
    assert get_ast('+123').eval(stream_inputs, functions) == float(123)
    compare_stream(
        get_ast('+Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float)
        })

    compare_stream(
        get_ast('+@FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([123], dtype=float)
        })
    assert get_ast('-123').eval(stream_inputs, functions) == float(-123)
    compare_stream(
        get_ast('-Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([-1, -2, -3], dtype=float)
        })
    compare_stream(
        get_ast('-@FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([-123], dtype=float)
        })

    ## Plus
    assert get_ast('1 + 2').eval(stream_inputs, functions) == float(3)
    compare_stream(
        get_ast('Oil + 1').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) + 1
        })
    compare_stream(
        get_ast('1 + Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 1 + np.array([1, 2, 3], dtype=float)
        })

    compare_stream(
        get_ast('Gas + Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([6, 8, 10], dtype=float)
        })

    compare_stream(
        get_ast('Gas + @FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([128, 6, 7], dtype=float)
        })

    ## Subtract
    assert get_ast('1 - 2').eval(stream_inputs, functions) == float(-1)
    compare_stream(
        get_ast('Oil - 1').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) - 1
        })

    compare_stream(
        get_ast('1 - Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 1 - np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        get_ast('Gas - Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([4, 4, 4], dtype=float)
        })
    compare_stream(
        get_ast('Gas - @FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([-118, 6, 7], dtype=float)
        })

    # ## Multiply
    assert get_ast('1 * 2').eval(stream_inputs, functions) == float(2)
    compare_stream(
        get_ast('Oil * 2').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) * 2
        })
    compare_stream(
        get_ast('2 * Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 2 * np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        get_ast('Gas * Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1 * 5, 2 * 6, 3 * 7], dtype=float)
        })
    compare_stream(
        get_ast('Gas * @FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([5 * 123, 0, 0], dtype=float)
        })

    ## Divide
    assert get_ast('1 / 2').eval(stream_inputs, functions) == 0.5
    compare_stream(
        get_ast('Oil / 2').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) / 2
        })
    compare_stream(
        get_ast('2 / Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 2 / np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        get_ast('Gas / Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([5 / 1, 6 / 2, 7 / 3], dtype=float)
        })
    compare_stream(
        get_ast('Gas / @FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([5 / 123, 0, 0], dtype=float)
        })

    # ## Combination
    compare_stream(
        get_ast('Oil / 2 + @FPD(123)').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1 / 2 + 123, 0, 0], dtype=float)
        })
    compare_stream(
        get_ast('- (Oil * 2 + Gas / 3) / (Oil - @FPD(123))').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': -np.array([(1 * 2 + 5 / 3) / (1 - 123), (2 * 2 + 6 / 3) / 2, (3 * 2 + 7 / 3) / 3], dtype=float)
        })
