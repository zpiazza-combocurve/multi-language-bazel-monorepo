def equal(value):
    return value


def not_equal(value):
    return f'ne({value})'


def greater_than(value):
    return f'gt({value})'


def greater_than_equal(value):
    return f'ge({value})'


def less_than(value):
    return f'lt({value})'


def less_than_equal(value):
    return f'le({value})'


def in_(value):
    _value = ','.join(map(str, value))
    return f'in({_value})'


def not_in(value):
    _value = ','.join(map(str, value))
    return f'not(in({_value}))'


def between(start, end):
    return f'btw({start},{end})'
