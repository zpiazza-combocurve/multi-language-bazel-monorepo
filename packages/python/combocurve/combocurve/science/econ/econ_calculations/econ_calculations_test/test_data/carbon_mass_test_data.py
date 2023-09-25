import datetime
import numpy as np

BASE_OWNERSHIP_KEYS = ['wi', 'nri', 'lease_nri']
ONE_MINUS_OWNERSHIP_KEYS = [
    'one_minus_wi',
    'one_minus_nri',
    'one_minus_lease_nri',
]
MINUS_ONE_OWNERSHIP_KEYS = [
    'wi_minus_one',
    'nri_minus_one',
    'lease_nri_minus_one',
]
PCT_100_KEY = ['100_pct_wi']

date_dict = {'first_production_date': datetime.date(2000, 1, 1)}

carbon_production_generator = {
    'on_fpd': {
        'dates': np.array([np.datetime64(f'2000-0{i}') for i in range(1, 6)]),
        'co2': np.array([1, 2, 3, 4, 5]),
        'ch4': np.array([1, 2, 3, 4, 5]),
        'n2o': np.array([1, 2, 3, 4, 5]),
        'co2e': np.array([1, 2, 3, 4, 5]),
    },
    'before_fpd': {
        'dates': np.array([np.datetime64(f'1999-0{i}') for i in range(1, 6)]),
        'co2': np.array([1, 2, 3, 4, 5]),
        'ch4': np.array([1, 2, 3, 4, 5]),
        'n2o': np.array([1, 2, 3, 4, 5]),
        'co2e': np.array([1, 2, 3, 4, 5]),
    },
    'after_fpd': {
        'dates': np.array([np.datetime64(f'2001-0{i}') for i in range(1, 6)]),
        'co2': np.array([1, 2, 3, 4, 5]),
        'ch4': np.array([1, 2, 3, 4, 5]),
        'n2o': np.array([1, 2, 3, 4, 5]),
        'co2e': np.array([1, 2, 3, 4, 5]),
    },
    'no_carbon': None,
}

ownership_dict_by_phase_generator = {
    'normal': {
        'original': {key: 0.7 for key in BASE_OWNERSHIP_KEYS}
        | {key: 0.3 for key in ONE_MINUS_OWNERSHIP_KEYS}
        | {key: -0.3 for key in MINUS_ONE_OWNERSHIP_KEYS}
        | {key: 1 for key in PCT_100_KEY}
    },
    'zeros': {
        'original': {key: 0 for key in BASE_OWNERSHIP_KEYS}
        | {key: 0 for key in ONE_MINUS_OWNERSHIP_KEYS}
        | {key: -1 for key in MINUS_ONE_OWNERSHIP_KEYS}
        | {key: 1 for key in PCT_100_KEY}
    },
    'ones': {
        'original': {key: 1 for key in BASE_OWNERSHIP_KEYS}
        | {key: 0 for key in ONE_MINUS_OWNERSHIP_KEYS}
        | {key: 0 for key in MINUS_ONE_OWNERSHIP_KEYS}
        | {key: 1 for key in PCT_100_KEY}
    },
}
