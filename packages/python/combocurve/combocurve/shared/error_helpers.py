from typing import Iterable, Callable, Any

from .logging_helpers import log_error


def execute_all(funcs: Iterable[Callable[[], Any]]):
    for f in funcs:
        try:
            f()
        except Exception as e:
            log_error(e)
