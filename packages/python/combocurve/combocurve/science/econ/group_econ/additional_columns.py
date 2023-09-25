GROUP_ECON_COLUMNS = [
    {
        'key': 'gross_oil_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'gross_gas_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'gross_ngl_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'gross_drip_condensate_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'total_gross_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': '100_pct_wi_oil_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': '100_pct_wi_gas_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': '100_pct_wi_ngl_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': '100_pct_wi_drip_condensate_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'total_100_pct_wi_revenue',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'net_boe_well_head_volume',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
    {
        'key': 'net_mcfe_well_head_volume',
        'selected_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        }
    },
]

GROUP_ECON_COLUMN_FIELDS = {
    'gross_oil_revenue': {
        'type': 'number',
        'label': 'Gross Oil Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'gross_gas_revenue': {
        'type': 'number',
        'label': 'Gross Gas Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'gross_ngl_revenue': {
        'type': 'number',
        'label': 'Gross NGL Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'gross_drip_condensate_revenue': {
        'type': 'number',
        'label': 'Gross Drip Condensate Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'total_gross_revenue': {
        'type': 'number',
        'label': 'Total Gross Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    '100_pct_wi_oil_revenue': {
        'type': 'number',
        'label': '100% WI Oil Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    '100_pct_wi_gas_revenue': {
        'type': 'number',
        'label': '100% WI Gas Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    '100_pct_wi_ngl_revenue': {
        'type': 'number',
        'label': '100% WI NGL Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    '100_pct_wi_drip_condensate_revenue': {
        'type': 'number',
        'label': '100% WI Drip Condensate Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'total_100_pct_wi_revenue': {
        'type': 'number',
        'label': 'Total 100% WI Revenue',
        'category': 'Revenue',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': True,
            'aggregate': False,
            'one_liner': True
        },
        'unit_key': 'cash'
    },
    'net_boe_well_head_volume': {
        'type': 'number',
        'label': 'Net BOE Well Head Volume',
        'category': 'Net Volumes',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        },
        'unit_key': 'cash'
    },
    'net_mcfe_well_head_volume': {
        'type': 'number',
        'label': 'Net MCFE Well Head Volume',
        'category': 'Net Volumes',
        'hide': False,
        'options': {
            'monthly': True,
            'aggregate': True,
            'one_liner': True
        },
        'default_options': {
            'monthly': False,
            'aggregate': False,
            'one_liner': False
        },
        'unit_key': 'cash'
    },
}
