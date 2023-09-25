from functools import reduce


def identity(param):
    return param


def _compose(f, g):
    return lambda *args, **kwargs: f(g(*args, **kwargs))


def compose(*functions):
    """compose(f, g, h)(x) is equivalent to f(g(h(x)))"""
    return reduce(_compose, functions)
