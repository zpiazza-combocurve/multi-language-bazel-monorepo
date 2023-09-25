import pytest
import numpy as np
import datetime

from combocurve.science.network_module.parser.test_shared_data import stream_inputs, functions
from combocurve.science.network_module.parser.nodes import (NumberNode, StreamNode, FunctionCallNode, PositiveNode,
                                                            NegativeNode, AddNode, SubtractNode, MultiplyNode,
                                                            DivideNode)


def compare_stream(stream_a, stream_b):
    return (stream_a['date'] == stream_b['date']).all() and (stream_a['value'] == stream_b['value']).all()


@pytest.mark.unittest
def test_number_node():
    assert NumberNode('1').to_string() == '[1]'
    assert NumberNode('.3').to_string() == '[.3]'
    assert NumberNode('12.').to_string() == '[12.]'

    assert NumberNode('1').eval(stream_inputs, functions) == 1.0
    assert NumberNode('3.254').eval(stream_inputs, functions) == 3.254


@pytest.mark.unittest
def test_stream_node():
    assert StreamNode('Oil').to_string() == '[Oil]'
    assert StreamNode('Gas').to_string() == '[Gas]'
    assert StreamNode('Water').to_string() == '[Water]'

    assert compare_stream(
        StreamNode('Oil').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float)
        })

    assert compare_stream(
        StreamNode('Gas').eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([5, 6, 7], dtype=float)
        })
    assert StreamNode('Water').eval(stream_inputs, functions) == 0.


@pytest.mark.unittest
def test_function_call_node():
    assert FunctionCallNode('@FPD', NumberNode('123')).to_string() == '[@FPD([123])]'

    compare_stream(
        FunctionCallNode('@FPD', NumberNode('123')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([123], dtype=float)
        })

    with pytest.raises(ValueError, match='Function handle is not valid!'):
        FunctionCallNode('@Fpd', NumberNode('123')).eval(stream_inputs, functions)


@pytest.mark.unittest
def test_positive_node():
    assert PositiveNode(NumberNode('123')).to_string() == '[+[123]]'
    assert PositiveNode(StreamNode('Oil')).to_string() == '[+[Oil]]'

    assert PositiveNode(NumberNode('123')).eval(stream_inputs, functions) == float(123)
    compare_stream(
        PositiveNode(StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float)
        })

    compare_stream(
        PositiveNode(FunctionCallNode('@FPD', NumberNode('123'))).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([123], dtype=float)
        })


@pytest.mark.unittest
def test_negative_node():
    assert NegativeNode(NumberNode('123')).to_string() == '[-[123]]'
    assert NegativeNode(StreamNode('Oil')).to_string() == '[-[Oil]]'

    assert NegativeNode(NumberNode('123')).eval(stream_inputs, functions) == float(-123)
    compare_stream(
        NegativeNode(StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([-1, -2, -3], dtype=float)
        })

    compare_stream(
        NegativeNode(FunctionCallNode('@FPD', NumberNode('123'))).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1)]),
            'value': np.array([-123], dtype=float)
        })


@pytest.mark.unittest
def test_add_node():
    assert AddNode(NumberNode('123'), NumberNode('12')).to_string() == '[[123]+[12]]'
    assert AddNode(StreamNode('Oil'), NumberNode('123')).to_string() == '[[Oil]+[123]]'
    assert AddNode(NumberNode('123'), StreamNode('Oil')).to_string() == '[[123]+[Oil]]'
    assert AddNode(StreamNode('Gas'), StreamNode('Oil')).to_string() == '[[Gas]+[Oil]]'
    assert AddNode(FunctionCallNode('@FPD', NumberNode('123')),
                   StreamNode('Oil')).to_string() == '[[@FPD([123])]+[Oil]]'

    assert AddNode(NumberNode('123'), NumberNode('12')).eval(stream_inputs, functions) == float(135)
    compare_stream(
        AddNode(StreamNode('Oil'), NumberNode('123')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 123 + np.array([1, 2, 3], dtype=float)
        })

    compare_stream(
        AddNode(NumberNode('123'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 123 + np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        AddNode(StreamNode('Gas'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([6, 8, 10], dtype=float)
        })

    compare_stream(
        AddNode(FunctionCallNode('@FPD', NumberNode('123')), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([124, 2, 3], dtype=float)
        })


@pytest.mark.unittest
def test_subtract_node():
    assert SubtractNode(NumberNode('123'), NumberNode('12')).to_string() == '[[123]-[12]]'
    assert SubtractNode(StreamNode('Oil'), NumberNode('123')).to_string() == '[[Oil]-[123]]'
    assert SubtractNode(NumberNode('123'), StreamNode('Oil')).to_string() == '[[123]-[Oil]]'
    assert SubtractNode(StreamNode('Gas'), StreamNode('Oil')).to_string() == '[[Gas]-[Oil]]'
    assert SubtractNode(FunctionCallNode('@FPD', NumberNode('123')),
                        StreamNode('Oil')).to_string() == '[[@FPD([123])]-[Oil]]'

    assert SubtractNode(NumberNode('123'), NumberNode('12')).eval(stream_inputs, functions) == float(111)
    compare_stream(
        SubtractNode(StreamNode('Oil'), NumberNode('123')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) - 123
        })

    compare_stream(
        SubtractNode(NumberNode('123'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 123 - np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        SubtractNode(StreamNode('Gas'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([4, 4, 4], dtype=float)
        })

    compare_stream(
        SubtractNode(FunctionCallNode('@FPD', NumberNode('123')), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([122, -2, -3], dtype=float)
        })


@pytest.mark.unittest
def test_multiply_node():
    assert MultiplyNode(NumberNode('123'), NumberNode('12')).to_string() == '[[123]*[12]]'
    assert MultiplyNode(StreamNode('Oil'), NumberNode('123')).to_string() == '[[Oil]*[123]]'
    assert MultiplyNode(NumberNode('123'), StreamNode('Oil')).to_string() == '[[123]*[Oil]]'
    assert MultiplyNode(StreamNode('Gas'), StreamNode('Oil')).to_string() == '[[Gas]*[Oil]]'
    assert MultiplyNode(FunctionCallNode('@FPD', NumberNode('123')),
                        StreamNode('Oil')).to_string() == '[[@FPD([123])]*[Oil]]'

    assert MultiplyNode(NumberNode('123'), NumberNode('12')).eval(stream_inputs, functions) == float(123 * 12)
    compare_stream(
        MultiplyNode(StreamNode('Oil'), NumberNode('123')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) * 123
        })

    compare_stream(
        MultiplyNode(NumberNode('123'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 123 * np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        MultiplyNode(StreamNode('Gas'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1 * 5, 2 * 6, 3 * 7], dtype=float)
        })

    compare_stream(
        MultiplyNode(FunctionCallNode('@FPD', NumberNode('123')), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([123, 0, 0], dtype=float)
        })


@pytest.mark.unittest
def test_divide_node():
    assert DivideNode(NumberNode('123'), NumberNode('12')).to_string() == '[[123]/[12]]'
    assert DivideNode(StreamNode('Oil'), NumberNode('123')).to_string() == '[[Oil]/[123]]'
    assert DivideNode(NumberNode('123'), StreamNode('Oil')).to_string() == '[[123]/[Oil]]'
    assert DivideNode(StreamNode('Gas'), StreamNode('Oil')).to_string() == '[[Gas]/[Oil]]'
    assert DivideNode(FunctionCallNode('@FPD', NumberNode('123')),
                      StreamNode('Oil')).to_string() == '[[@FPD([123])]/[Oil]]'

    assert DivideNode(NumberNode('123'), NumberNode('12')).eval(stream_inputs, functions) == float(123 / 12)
    compare_stream(
        DivideNode(StreamNode('Oil'), NumberNode('123')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1, 2, 3], dtype=float) / 123
        })

    compare_stream(
        DivideNode(NumberNode('123'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': 123 / np.array([1, 2, 3], dtype=float)
        })
    compare_stream(
        DivideNode(StreamNode('Gas'), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([1 / 5, 2 / 6, 3 / 7], dtype=float)
        })

    compare_stream(
        DivideNode(FunctionCallNode('@FPD', NumberNode('123')), StreamNode('Oil')).eval(stream_inputs, functions), {
            'date': np.array([datetime.date(2000, 1, 1),
                              datetime.date(2000, 2, 1),
                              datetime.date(2000, 3, 1)]),
            'value': np.array([123, 0, 0], dtype=float)
        })
