from typing import Union
from dataclasses import dataclass
import numpy as np
from copy import deepcopy

from combocurve.science.network_module.nodes.shared.type_hints import Float_Or_StreamDateAndValue
from combocurve.science.network_module.nodes.shared.helper import (sum_stream_date_and_value_for_2,
                                                                   multiply_stream_and_value_for_2,
                                                                   divide_stream_and_value_for_2)


def _enclosing_string_by_braces(string: str):
    return '[' + string + ']'


@dataclass
class NumberNode:
    value: str

    def to_string(self):
        return _enclosing_string_by_braces(self.value)

    def eval(self, inputs, functions) -> float:
        return float(self.value)


@dataclass
class AddNode:
    node_a: any
    node_b: any

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.node_a.to_string()}+{self.node_b.to_string()}")

    def eval(self, inputs, functions):
        return self._add(self.node_a.eval(inputs, functions), self.node_b.eval(inputs, functions))

    def _add(self, a_result: Float_Or_StreamDateAndValue, b_result: Float_Or_StreamDateAndValue):
        if type(a_result) is float and type(b_result) is float:
            return a_result + b_result

        if type(a_result) is float and type(b_result) is dict:
            b_result['value'] += a_result
            return b_result

        if type(a_result) is dict and type(b_result) is float:
            a_result['value'] += b_result
            return a_result

        if type(a_result) is dict and type(b_result) is dict:
            return sum_stream_date_and_value_for_2(a_result, b_result)


@dataclass
class SubtractNode:
    node_a: any
    node_b: any

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.node_a.to_string()}-{self.node_b.to_string()}")

    def eval(self, inputs, functions):
        return self._minus(self.node_a.eval(inputs, functions), self.node_b.eval(inputs, functions))

    def _minus(self, a_result: Float_Or_StreamDateAndValue, b_result: Float_Or_StreamDateAndValue):
        if type(a_result) is float and type(b_result) is float:
            return a_result - b_result

        if type(a_result) is float and type(b_result) is dict:
            b_result['value'] = a_result - b_result['value']
            return b_result

        if type(a_result) is dict and type(b_result) is float:
            a_result['value'] -= b_result
            return a_result

        if type(a_result) is dict and type(b_result) is dict:
            b_result['value'] = -b_result['value']
            return sum_stream_date_and_value_for_2(a_result, b_result)


@dataclass
class MultiplyNode:
    node_a: any
    node_b: any

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.node_a.to_string()}*{self.node_b.to_string()}")

    def eval(self, inputs, functions):
        return self._multiply(self.node_a.eval(inputs, functions), self.node_b.eval(inputs, functions))

    def _multiply(self, a_result, b_result):
        if type(a_result) is float and type(b_result) is float:
            return a_result * b_result

        if type(a_result) is float and type(b_result) is dict:
            b_result['value'] *= a_result
            return b_result

        if type(a_result) is dict and type(b_result) is float:
            a_result['value'] *= b_result
            return a_result

        if type(a_result) is dict and type(b_result) is dict:
            return multiply_stream_and_value_for_2(a_result, b_result)


@dataclass
class DivideNode:
    node_a: any
    node_b: any

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.node_a.to_string()}/{self.node_b.to_string()}")

    def eval(self, inputs, functions):
        return self._divide(self.node_a.eval(inputs, functions), self.node_b.eval(inputs, functions))

    def _divide(self, a_result, b_result):
        if type(a_result) is float and type(b_result) is float:
            if b_result == 0:
                return 0
            return a_result / b_result

        if type(a_result) is float and type(b_result) is dict:
            b_value = b_result['value']
            b_eq_0_mask = b_value == 0
            b_value[~b_eq_0_mask] = a_result / b_value[~b_eq_0_mask]
            return b_result

        if type(a_result) is dict and type(b_result) is float:
            if b_result == 0:
                a_result['value'] = np.zeros_like(a_result['value'])
            else:
                a_result['value'] /= b_result
            return a_result

        if type(a_result) is dict and type(b_result) is dict:
            return divide_stream_and_value_for_2(a_result, b_result)


@dataclass
class PositiveNode:
    node: any

    def to_string(self):
        return _enclosing_string_by_braces(f"+{self.node.to_string()}")

    def eval(self, inputs, functions):
        return self.node.eval(inputs, functions)


@dataclass
class NegativeNode:
    node: any

    def to_string(self):
        return _enclosing_string_by_braces(f"-{self.node.to_string()}")

    def eval(self, inputs, functions):
        return self._negate(self.node.eval(inputs, functions))

    def _negate(self, node_val: Float_Or_StreamDateAndValue):
        if type(node_val) is float:
            return -node_val

        node_val['value'] *= -1
        return node_val


@dataclass
class StreamNode:
    value: str

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.value}")

    def eval(self, inputs, functions) -> Float_Or_StreamDateAndValue:
        if self.value in inputs:
            return deepcopy(inputs[self.value])

        return float(0)


@dataclass
class FunctionCallNode:
    function_handle: str
    ## extend input to be list of inputs
    function_input_node: NumberNode

    def to_string(self):
        return _enclosing_string_by_braces(f"{self.function_handle}({self.function_input_node.to_string()})")

    def eval(self, inputs, functions):
        if self.function_handle not in functions:
            raise ValueError('Function handle is not valid!')

        return functions[self.function_handle](value=self.function_input_node.eval(inputs, functions))


AllNodesTyping = Union[NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PositiveNode, NegativeNode,
                       StreamNode, FunctionCallNode]
