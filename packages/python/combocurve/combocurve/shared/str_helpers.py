import re


def titleize(value: str):
    trimmed = value.strip()
    no_dashes = re.sub('[_-]+', ' ', trimmed)
    single_spaces = re.sub(r'\s+', ' ', no_dashes)
    words = re.split(r'\s', single_spaces)
    return ' '.join((w.capitalize() for w in words))


def pluralize(amount: int, singular: str, plural: str):
    if amount == 1:
        return f'{amount} {singular}'

    return f'{amount} {plural}'
