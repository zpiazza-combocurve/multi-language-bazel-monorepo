# https://stackoverflow.com/questions/5478351/python-time-measure-function/5478448#5478448

import time
from contextlib import contextmanager
import logging
import functools


def log_message(message, elapsed_time_in_s):
    '''
    Log the time taken for a function with given message to the console
    '''
    logging.warning(f'{message} ({elapsed_time_in_s} s)')


def print_message(message, elapsed_time_in_s):
    '''
    Similar to log_message but for local use
    '''
    print(f'{message} ({elapsed_time_in_s} s)')  # noqa


def timeit(fn, message=''):
    def wrap(*args, **kwargs):
        time1 = time.time()
        ret = fn(*args, **kwargs)
        time2 = time.time()
        log_message(message, time2 - time1)
        return ret

    return wrap


@contextmanager
def timeit_context(message):
    time1 = time.time()
    yield
    time2 = time.time()
    log_message(message, time2 - time1)


def time_func_cloud(msg):
    '''
    return a warpper that allows taking message from the outmost decorator
    '''
    def outer_wrapper(fn):
        @functools.wraps(fn)
        def inner_wrapper(*args, **kwargs):
            time1 = time.time()
            ret = fn(*args, **kwargs)
            time2 = time.time()
            log_message(msg, time2 - time1)
            return ret

        return inner_wrapper

    return outer_wrapper


def time_func_local(msg):
    '''
    Similar to time_func_cloud but for local use
    '''
    def outer_wrapper(fn):
        @functools.wraps(fn)
        def inner_wrapper(*args, **kwargs):
            time1 = time.time()
            ret = fn(*args, **kwargs)
            time2 = time.time()
            print_message(msg, time2 - time1)
            return ret

        return inner_wrapper

    return outer_wrapper
