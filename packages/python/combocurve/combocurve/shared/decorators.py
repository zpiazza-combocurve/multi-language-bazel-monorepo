import warnings


def filter_warnings(f):
    def wrapper(*args, **kwargs):
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore')
            return f(*args, **kwargs)

    return wrapper
