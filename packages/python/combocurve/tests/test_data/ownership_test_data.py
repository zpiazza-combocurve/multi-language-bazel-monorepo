import numpy as np
import datetime

PHASES = ['oil', 'gas', 'ngl', 'drip_condensate', 'original']

OWNERSHIP_INPUT = {
    'working_interest': np.array([.7]),
    'net_profit_interest': np.array([.8]),
    'net_profit_interest_type': 'type',
    'oil_ownership': {'net_revenue_interest': np.array([.65]), 'lease_net_revenue_interest': np.array([.55])},
    'gas_ownership': {'net_revenue_interest': np.array([.64]), 'lease_net_revenue_interest': np.array([.54])},
    'ngl_ownership': {'net_revenue_interest': np.array([.63]), 'lease_net_revenue_interest': np.array([.53])},
    'drip_condensate_ownership': {'net_revenue_interest': np.array([.62]), 'lease_net_revenue_interest': np.array([.52])},
    'original_ownership': {'net_revenue_interest': np.array([.61]), 'lease_net_revenue_interest': np.array([.51])}
}


OWNERSHIP_DICT = {
    'oil': {
        'wi': np.array([.7]),
        'nri': np.array([.65]),
        'lease_nri': np.array([.55]),
        'one_minus_wi': np.array([.3]),
        'one_minus_nri': np.array([.35]),
        'one_minus_lease_nri': np.array([.45]),
        'wi_minus_one': np.array([-.3]),
        'nri_minus_one': np.array([-.35]),
        'lease_nri_minus_one': np.array([-.45]),
        '100_pct_wi': np.array([1])
    },
    'gas': {
        'wi': np.array([.7]),
        'nri': np.array([.64]),
        'lease_nri': np.array([.54]),
        'one_minus_wi': np.array([.3]),
        'one_minus_nri': np.array([.36]),
        'one_minus_lease_nri': np.array([.46]),
        'wi_minus_one': np.array([-.3]),
        'nri_minus_one': np.array([-.36]),
        'lease_nri_minus_one': np.array([-.46]),
        '100_pct_wi': np.array([1])
    },
    'ngl': {
        'wi': np.array([.7]),
        'nri': np.array([.63]),
        'lease_nri': np.array([.53]),
        'one_minus_wi': np.array([.3]),
        'one_minus_nri': np.array([.37]),
        'one_minus_lease_nri': np.array([.47]),
        'wi_minus_one': np.array([-.3]),
        'nri_minus_one': np.array([-.37]),
        'lease_nri_minus_one': np.array([-.47]),
        '100_pct_wi': np.array([1])
    },
    'drip_condensate': {
        'wi': np.array([.7]),
        'nri': np.array([.62]),
        'lease_nri': np.array([.52]),
        'one_minus_wi': np.array([.3]),
        'one_minus_nri': np.array([.38]),
        'one_minus_lease_nri': np.array([.48]),
        'wi_minus_one': np.array([-.3]),
        'nri_minus_one': np.array([-.38]),
        'lease_nri_minus_one': np.array([-.48]),
        '100_pct_wi': np.array([1])
    },
    'original': {
        'wi': np.array([.7]),
        'nri': np.array([.61]),
        'lease_nri': np.array([.51]),
        'one_minus_wi': np.array([.3]),
        'one_minus_nri': np.array([.39]),
        'one_minus_lease_nri': np.array([.49]),
        'wi_minus_one': np.array([-.3]),
        'nri_minus_one': np.array([-.39]),
        'lease_nri_minus_one': np.array([-.49]),
        '100_pct_wi': np.array([1])
    }
}

OWNERSHIP_INPUT_DAILY = {
    'oil': {
        'wi': np.array([.7, .5, .5, .5, .5]),
        'nri': np.array([.65, .5, .5, .5, .5]),
        'lease_nri': np.array([.55, .5, .5, .5, .5]),
        'one_minus_wi': np.array([.3, .5, .5, .5, .5]),
        'one_minus_nri': np.array([.35, .5, .5, .5, .5]),
        'one_minus_lease_nri': np.array([.45, .5, .5, .5, .5]),
        'wi_minus_one': np.array([-.3, .5, .5, .5, .5]),
        'nri_minus_one': np.array([-.35, .5, .5, .5, .5]),
        'lease_nri_minus_one': np.array([-.45, .5, .5, .5, .5]),
        '100_pct_wi': np.array([1, .5, .5, .5, .5])
    },
    'gas': {
        'wi': np.array([.7, .5, .5, .5, .5]),
        'nri': np.array([.64, .5, .5, .5, .5]),
        'lease_nri': np.array([.54, .5, .5, .5, .5]),
        'one_minus_wi': np.array([.3, .5, .5, .5, .5]),
        'one_minus_nri': np.array([.36, .5, .5, .5, .5]),
        'one_minus_lease_nri': np.array([.46, .5, .5, .5, .5]),
        'wi_minus_one': np.array([-.3, .5, .5, .5, .5]),
        'nri_minus_one': np.array([-.36, .5, .5, .5, .5]),
        'lease_nri_minus_one': np.array([-.46, .5, .5, .5, .5]),
        '100_pct_wi': np.array([1, .5, .5, .5, .5])
    },
    'ngl': {
        'wi': np.array([.7, .5, .5, .5, .5]),
        'nri': np.array([.63, .5, .5, .5, .5]),
        'lease_nri': np.array([.53, .5, .5, .5, .5]),
        'one_minus_wi': np.array([.3, .5, .5, .5, .5]),
        'one_minus_nri': np.array([.37, .5, .5, .5, .5]),
        'one_minus_lease_nri': np.array([.47, .5, .5, .5, .5]),
        'wi_minus_one': np.array([-.3, .5, .5, .5, .5]),
        'nri_minus_one': np.array([-.37, .5, .5, .5, .5]),
        'lease_nri_minus_one': np.array([-.47, .5, .5, .5, .5]),
        '100_pct_wi': np.array([1, .5, .5, .5, .5])
    },
    'drip_condensate': {
        'wi': np.array([.7, .5, .5, .5, .5]),
        'nri': np.array([.62, .5, .5, .5, .5]),
        'lease_nri': np.array([.52, .5, .5, .5, .5]),
        'one_minus_wi': np.array([.3, .5, .5, .5, .5]),
        'one_minus_nri': np.array([.38, .5, .5, .5, .5]),
        'one_minus_lease_nri': np.array([.48, .5, .5, .5, .5]),
        'wi_minus_one': np.array([-.3, .5, .5, .5, .5]),
        'nri_minus_one': np.array([-.38, .5, .5, .5, .5]),
        'lease_nri_minus_one': np.array([-.48, .5, .5, .5, .5]),
        '100_pct_wi': np.array([1, .5, .5, .5, .5])
    },
    'original': {
        'wi': np.array([.7, .5, .5, .5, .5]),
        'nri': np.array([.61, .5, .5, .5, .5]),
        'lease_nri': np.array([.51, .5, .5, .5, .5]),
        'one_minus_wi': np.array([.3, .5, .5, .5, .5]),
        'one_minus_nri': np.array([.39, .5, .5, .5, .5]),
        'one_minus_lease_nri': np.array([.49, .5, .5, .5, .5]),
        'wi_minus_one': np.array([-.3, .5, .5, .5, .5]),
        'nri_minus_one': np.array([-.39, .5, .5, .5, .5]),
        'lease_nri_minus_one': np.array([-.49, .5, .5, .5, .5]),
        '100_pct_wi': np.array([1, .5, .5, .5, .5])
    }
}

OWNERSHIP_DICT_DAILY = {
    'oil': {
        'wi': np.repeat(np.array([.7, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri': np.repeat(np.array([.65, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri': np.repeat(np.array([.55, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_wi': np.repeat(np.array([.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_nri': np.repeat(np.array([.35, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_lease_nri': np.repeat(np.array([.45, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'wi_minus_one': np.repeat(np.array([-.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri_minus_one': np.repeat(np.array([-.35, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri_minus_one': np.repeat(np.array([-.45, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        '100_pct_wi': np.repeat(np.array([1, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15]))
    },
    'gas': {
        'wi': np.repeat(np.array([.7, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri': np.repeat(np.array([.64, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri': np.repeat(np.array([.54, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_wi': np.repeat(np.array([.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_nri': np.repeat(np.array([.36, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_lease_nri': np.repeat(np.array([.46, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'wi_minus_one': np.repeat(np.array([-.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri_minus_one': np.repeat(np.array([-.36, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri_minus_one': np.repeat(np.array([-.46, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        '100_pct_wi': np.repeat(np.array([1, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15]))
    },
    'ngl': {
        'wi': np.repeat(np.array([.7, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri': np.repeat(np.array([.63, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri': np.repeat(np.array([.53, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_wi': np.repeat(np.array([.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_nri': np.repeat(np.array([.37, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_lease_nri': np.repeat(np.array([.47, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'wi_minus_one': np.repeat(np.array([-.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri_minus_one': np.repeat(np.array([-.37, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri_minus_one': np.repeat(np.array([-.47, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        '100_pct_wi': np.repeat(np.array([1, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15]))
    },
    'drip_condensate': {
        'wi': np.repeat(np.array([.7, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri': np.repeat(np.array([.62, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri': np.repeat(np.array([.52, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_wi': np.repeat(np.array([.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_nri': np.repeat(np.array([.38, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_lease_nri': np.repeat(np.array([.48, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'wi_minus_one': np.repeat(np.array([-.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri_minus_one': np.repeat(np.array([-.38, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri_minus_one': np.repeat(np.array([-.48, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        '100_pct_wi': np.repeat(np.array([1, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15]))
    },
    'original': {
        'wi': np.repeat(np.array([.7, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri': np.repeat(np.array([.61, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri': np.repeat(np.array([.51, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_wi': np.repeat(np.array([.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_nri': np.repeat(np.array([.39, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'one_minus_lease_nri': np.repeat(np.array([.49, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'wi_minus_one': np.repeat(np.array([-.3, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'nri_minus_one': np.repeat(np.array([-.39, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        'lease_nri_minus_one': np.repeat(np.array([-.49, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15])),
        '100_pct_wi': np.repeat(np.array([1, .5, .5, .5, .5]), np.array([30, 30, 31, 30, 15]))
    }
}

OWNERSHIP_DICT_DAILY_SINGLE_MONTH = {
    'oil': {
        'wi': np.repeat(np.array([.7]), np.array([15])),
        'nri': np.repeat(np.array([.65]), np.array([15])),
        'lease_nri': np.repeat(np.array([.55]), np.array([15])),
        'one_minus_wi': np.repeat(np.array([.3]), np.array([15])),
        'one_minus_nri': np.repeat(np.array([.35]), np.array([15])),
        'one_minus_lease_nri': np.repeat(np.array([.45]), np.array([15])),
        'wi_minus_one': np.repeat(np.array([-.3]), np.array([15])),
        'nri_minus_one': np.repeat(np.array([-.35]), np.array([15])),
        'lease_nri_minus_one': np.repeat(np.array([-.45]), np.array([15])),
        '100_pct_wi': np.repeat(np.array([1]), np.array([15])),
    },
    'gas': {
        'wi': np.repeat(np.array([.7]), np.array([15])),
        'nri': np.repeat(np.array([.64]), np.array([15])),
        'lease_nri': np.repeat(np.array([.54]), np.array([15])),
        'one_minus_wi': np.repeat(np.array([.3]), np.array([15])),
        'one_minus_nri': np.repeat(np.array([.36]), np.array([15])),
        'one_minus_lease_nri': np.repeat(np.array([.46]), np.array([15])),
        'wi_minus_one': np.repeat(np.array([-.3]), np.array([15])),
        'nri_minus_one': np.repeat(np.array([-.36]), np.array([15])),
        'lease_nri_minus_one': np.repeat(np.array([-.46]), np.array([15])),
        '100_pct_wi': np.repeat(np.array([1]), np.array([15])),
    },
    'ngl': {
        'wi': np.repeat(np.array([.7]), np.array([15])),
        'nri': np.repeat(np.array([.63]), np.array([15])),
        'lease_nri': np.repeat(np.array([.53]), np.array([15])),
        'one_minus_wi': np.repeat(np.array([.3]), np.array([15])),
        'one_minus_nri': np.repeat(np.array([.37]), np.array([15])),
        'one_minus_lease_nri': np.repeat(np.array([.47]), np.array([15])),
        'wi_minus_one': np.repeat(np.array([-.3]), np.array([15])),
        'nri_minus_one': np.repeat(np.array([-.37]), np.array([15])),
        'lease_nri_minus_one': np.repeat(np.array([-.47]), np.array([15])),
        '100_pct_wi': np.repeat(np.array([1]), np.array([15])),
    },
    'drip_condensate': {
        'wi': np.repeat(np.array([.7]), np.array([15])),
        'nri': np.repeat(np.array([.62]), np.array([15])),
        'lease_nri': np.repeat(np.array([.52]), np.array([15])),
        'one_minus_wi': np.repeat(np.array([.3]), np.array([15])),
        'one_minus_nri': np.repeat(np.array([.38]), np.array([15])),
        'one_minus_lease_nri': np.repeat(np.array([.48]), np.array([15])),
        'wi_minus_one': np.repeat(np.array([-.3]), np.array([15])),
        'nri_minus_one': np.repeat(np.array([-.38]), np.array([15])),
        'lease_nri_minus_one': np.repeat(np.array([-.48]), np.array([15])),
        '100_pct_wi': np.repeat(np.array([1]), np.array([15])),
    },
    'original': {
        'wi': np.repeat(np.array([.7]), np.array([15])),
        'nri': np.repeat(np.array([.61]), np.array([15])),
        'lease_nri': np.repeat(np.array([.51]), np.array([15])),
        'one_minus_wi': np.repeat(np.array([.3]), np.array([15])),
        'one_minus_nri': np.repeat(np.array([.39]), np.array([15])),
        'one_minus_lease_nri': np.repeat(np.array([.49]), np.array([15])),
        'wi_minus_one': np.repeat(np.array([-.3]), np.array([15])),
        'nri_minus_one': np.repeat(np.array([-.39]), np.array([15])),
        'lease_nri_minus_one': np.repeat(np.array([-.49]), np.array([15])),
        '100_pct_wi': np.repeat(np.array([1]), np.array([15])),
    }
}

DATE_DICT = {
    'cf_start_date': datetime.date(2000, 1, 1),
    'cf_end_date': datetime.date(2000, 5, 15)
}

DATE_DICT_SINGLE_MONTH = {
    'cf_start_date': datetime.date(2000, 1, 1),
    'cf_end_date': datetime.date(2000, 1, 15)
}
