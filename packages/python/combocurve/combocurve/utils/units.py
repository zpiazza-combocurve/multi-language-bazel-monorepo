from functools import reduce
'''
same functionality as main-combocurve\\internal-api\\src\\inpt-shared\\helpers\\units.js
'''

UNIT_MULTIPLIERS = {
    'mmbbl': {
        'multiplier': 1000 * 1000,
        'base': 'bbl',
    },
    'mbbl': {
        'multiplier': 1000,
        'base': 'bbl',
    },
    'bbl': {
        'multiplier': 1,
        'base': 'bbl',
    },
    'gal': {
        'multiplier': 1 / 42,
        'base': 'bbl',
    },
    'mmcf': {
        'multiplier': 1000 * 1000,
        'base': 'cf',
    },
    'mcf': {
        'multiplier': 1000,
        'base': 'cf',
    },
    'cf': {
        'multiplier': 1,
        'base': 'cf',
    },
    'mmboe': {
        'multiplier': 1000 * 1000,
        'base': 'boe',
    },
    'mboe': {
        'multiplier': 1000,
        'base': 'boe',
    },
    'boe': {
        'multiplier': 1,
        'base': 'boe',
    },
    'mmcfe': {
        'multiplier': 1000 * 1000,
        'base': 'cfe',
    },
    'mcfe': {
        'multiplier': 1000,
        'base': 'cfe',
    },
    'cfe': {
        'multiplier': 1,
        'base': 'cfe',
    },
    'lb': {
        'multiplier': 1,
        'base': 'lb',
    },
    '1000ft': {
        'multiplier': 1000,
        'base': 'ft',
    },
    'acre': {
        'multiplier': 1,
        'base': 'acre',
    },
    'in': {
        'multiplier': 1 / 12,
        'base': 'ft',
    },
    'ft': {
        'multiplier': 1,
        'base': 'ft',
    },
    'y': {
        'multiplier': 365.25,
        'base': 'd',
    },
    'm': {
        'multiplier': 30.4375,
        'base': 'd',
    },
    'd': {
        'multiplier': 1,
        'base': 'd',
    },
}


def compare_arrays(arr1: list, arr2: list) -> bool:
    if len(arr1) != len(arr2):
        return False

    for i in range(len(arr1)):
        if arr1[i] != arr2[i]:
            return False

    return True


def get_unit_nom_denom_lists(unit: str):
    mult = unit.split('*')
    div = list(map(lambda m: m.split('/'), mult))

    nominators = list(map(lambda l: l[0], div))
    denominators = reduce(lambda l1, l2: l1 + l2[1:], div, [])

    return nominators, denominators


def get_base_multiplier(unit: str):
    nominators, denominators = get_unit_nom_denom_lists(unit)

    ret = 1

    for u in nominators:
        if UNIT_MULTIPLIERS.get(u):
            ret *= UNIT_MULTIPLIERS.get(u)['multiplier']

    for u in denominators:
        if UNIT_MULTIPLIERS.get(u):
            ret /= UNIT_MULTIPLIERS.get(u)['multiplier']

    return ret


def get_bases(units: list):
    return list(map(lambda x: UNIT_MULTIPLIERS.get(x)['base'] if UNIT_MULTIPLIERS.get(x) else x, units))


def check_valid_conversion(orig_unit: str, target_unit: str):
    orig_nom, orig_denom = get_unit_nom_denom_lists(orig_unit)
    target_nom, target_denom = get_unit_nom_denom_lists(target_unit)

    orig_nom_base = sorted(get_bases(orig_nom))
    orig_denom_base = sorted(get_bases(orig_denom))
    target_nom_base = sorted(get_bases(target_nom))
    target_denom_base = sorted(get_bases(target_denom))

    return compare_arrays(orig_nom_base, target_nom_base) & compare_arrays(orig_denom_base, target_denom_base)


def get_multiplier(orig_unit: str, target_unit: str):
    if orig_unit == target_unit:
        return 1

    if check_valid_conversion(orig_unit, target_unit):
        orig_base_multipier = get_base_multiplier(orig_unit)
        target_base_multiplier = get_base_multiplier(target_unit)

        return orig_base_multipier / target_base_multiplier

    raise Exception(f'Not a valid conversion from {orig_unit} to {target_unit}')
