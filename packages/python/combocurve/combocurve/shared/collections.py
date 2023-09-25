'''
dict and list utilities
'''
from typing import TypeVar, Callable, Any
from collections.abc import Iterable, Iterator, Mapping
from itertools import groupby
from collections import defaultdict

TK = TypeVar('TK')
TV = TypeVar('TV')

T = TypeVar('T')
TR = TypeVar('TR')


def pick(source: Mapping[TK, TV], keys: Iterable[TK]) -> Mapping[TK, TV]:
    return {k: source[k] for k in keys if k in source}


def get_values(source: dict, keys: Iterable[str]):
    return [source[k] for k in keys]


def split_in_chunks_lazy(iterable, batch_size):
    groups = groupby(enumerate(iterable), lambda t: t[0] // batch_size)
    return ((elem for (i, elem) in g) for (k, g) in groups)


def split_in_chunks(iterable, batch_size):
    return (list(chunk) for chunk in split_in_chunks_lazy(iterable, batch_size))


def identity(x):
    return x


def group_by(values: Iterable[T],
             key_selector: Callable[[T], str],
             value_selector: Callable[[T], TR] = identity) -> Mapping[str, list[TR]]:
    res = defaultdict(list)
    for v in values:
        res[key_selector(v)].append(value_selector(v))
    return res


def aggregate_dicts(dicts: Iterable[Mapping], base=None):
    res = base if base is not None else {}
    for d in dicts:
        for k, v in d.items():
            if k in res:
                # this is intentionally done like this instead of using +=
                # because I want it to work for lists without mutating them
                res[k] = res[k] + v
            else:
                res[k] = v
    return res


def first_increasing_sequence(it: Iterator[T], key: Callable[[T], Any] = identity):
    try:
        prev = next(it)
    except StopIteration:
        return

    yield prev

    for value in it:
        if key(value) <= key(prev):
            break
        yield value
        prev = value
