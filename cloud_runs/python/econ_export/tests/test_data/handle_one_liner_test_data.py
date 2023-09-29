import datetime
import pandas as pd
import os
from bson import ObjectId

dir_path = os.path.dirname(os.path.realpath(__file__))

RUN_DOC = {
    '_id': '6476538eeb4e3086a82b991e',
    'project': 'a',
    'runDate': datetime.datetime(2023, 5, 30, 19, 50, 38, 421000),
    'outputParams': {
        'timeZone':
        'America/Chicago',
        'columnFields': {
            'date': {
                'type': 'date',
                'label': 'Date',
                'category': '',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': True,
                    'one_liner': False
                },
                'default_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'pre_yield_gas_volume_drip_condensate': {
                'type': 'number',
                'label': 'Pre Yield Gas Volume Drip Condensate',
                'category': '',
                'hide': 'yes',
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
                'unit': 'gas'
            },
            'pre_yield_gas_volume_ngl': {
                'type': 'number',
                'label': 'Pre Yield Gas Volume NGL',
                'category': '',
                'hide': 'yes',
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
                'unit': 'gas'
            },
            'pre_risk_oil_volume': {
                'type': 'number',
                'label': 'Pre Risk Oil Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'oil'
            },
            'pre_risk_gas_volume': {
                'type': 'number',
                'label': 'Pre Risk Gas Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'gas'
            },
            'pre_risk_water_volume': {
                'type': 'number',
                'label': 'Pre Risk Water Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'water'
            },
            'pre_risk_drip_condensate_volume': {
                'type': 'number',
                'label': 'Pre Risk Drip Condensate Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'drip_condensate'
            },
            'pre_risk_ngl_volume': {
                'type': 'number',
                'label': 'Pre Risk NGL Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'ngl'
            },
            'unshrunk_oil_volume': {
                'type': 'number',
                'label': 'Unshurnk Oil Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'oil'
            },
            'unshrunk_gas_volume': {
                'type': 'number',
                'label': 'Unshrunk Gas Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'gas'
            },
            'pre_flare_gas_volume': {
                'type': 'number',
                'label': 'Pre Flare Gas Volume',
                'category': '',
                'hide': True,
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
                'unit_key': 'gas'
            },
            'gross_oil_well_head_volume': {
                'type': 'number',
                'label': 'Gross Oil Well Head Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'oil'
            },
            'gross_gas_well_head_volume': {
                'type': 'number',
                'label': 'Gross Gas Well Head Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'gas'
            },
            'gross_boe_well_head_volume': {
                'type': 'number',
                'label': 'Gross BOE Well Head Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'boe'
            },
            'gross_mcfe_well_head_volume': {
                'type': 'number',
                'label': 'Gross MCFE Well Head Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'mcfe'
            },
            'gross_water_well_head_volume': {
                'type': 'number',
                'label': 'Gross Water Well Head Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'water'
            },
            'gross_oil_sales_volume': {
                'type': 'number',
                'label': 'Gross Oil Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'oil'
            },
            'gross_gas_sales_volume': {
                'type': 'number',
                'label': 'Gross Gas Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'gas'
            },
            'gross_ngl_sales_volume': {
                'type': 'number',
                'label': 'Gross NGL Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'ngl'
            },
            'gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': 'Gross Drip Condensate Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'drip_condensate'
            },
            'gross_boe_sales_volume': {
                'type': 'number',
                'label': 'Gross BOE Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'boe'
            },
            'gross_mcfe_sales_volume': {
                'type': 'number',
                'label': 'Gross MCFE Sales Volume',
                'category': 'Gross Volumes',
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
                'unit_key': 'mcfe'
            },
            'ownership_reversion_model_name': {
                'type': 'str',
                'label': 'Ownership and Reversion Model Name',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'wi_oil': {
                'type': 'number',
                'label': 'WI Oil',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'wi_oil_sales_volume',
                    'denominator': 'gross_oil_sales_volume'
                },
                'unit': '%'
            },
            'wi_gas': {
                'type': 'number',
                'label': 'WI Gas',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'wi_gas_sales_volume',
                    'denominator': 'gross_gas_sales_volume'
                },
                'unit': '%'
            },
            'wi_ngl': {
                'type': 'number',
                'label': 'WI NGL',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'wi_ngl_sales_volume',
                    'denominator': 'gross_ngl_sales_volume'
                },
                'unit': '%'
            },
            'wi_drip_condensate': {
                'type': 'number',
                'label': 'WI Drip Condensate',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'wi_drip_condensate_sales_volume',
                    'denominator': 'gross_drip_condensate_sales_volume'
                },
                'unit': '%'
            },
            'first_reversion_wi_oil': {
                'type': 'number',
                'label': 'First Reversion WI Oil',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_wi_gas': {
                'type': 'number',
                'label': 'First Reversion WI Gas',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_wi_ngl': {
                'type': 'number',
                'label': 'First Reversion WI NGL',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_wi_drip_condensate': {
                'type': 'number',
                'label': 'First Reversion WI Drip Condensate',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'nri_oil': {
                'type': 'number',
                'label': 'NRI Oil',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'net_oil_sales_volume',
                    'denominator': 'gross_oil_sales_volume'
                },
                'unit': '%'
            },
            'nri_gas': {
                'type': 'number',
                'label': 'NRI Gas',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'net_gas_sales_volume',
                    'denominator': 'gross_gas_sales_volume'
                },
                'unit': '%'
            },
            'nri_ngl': {
                'type': 'number',
                'label': 'NRI NGL',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'net_ngl_sales_volume',
                    'denominator': 'gross_ngl_sales_volume'
                },
                'unit': '%'
            },
            'nri_drip_condensate': {
                'type': 'number',
                'label': 'NRI Drip Condensate',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'net_drip_condensate_sales_volume',
                    'denominator': 'gross_drip_condensate_sales_volume'
                },
                'unit': '%'
            },
            'first_reversion_nri_oil': {
                'type': 'number',
                'label': 'First Reversion NRI Oil',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_nri_gas': {
                'type': 'number',
                'label': 'First Reversion NRI Gas',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_nri_ngl': {
                'type': 'number',
                'label': 'First Reversion NRI NGL',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'first_reversion_nri_drip_condensate': {
                'type': 'number',
                'label': 'First Reversion NRI Drip Condensate',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'lease_nri': {
                'type': 'number',
                'label': 'Lease NRI',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'net_oil_sales_volume',
                    'denominator': 'wi_oil_sales_volume'
                },
                'unit': '%'
            },
            'original_lease_nri': {
                'type': 'number',
                'label': 'Original Lease NRI',
                'category': 'Ownership',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'gross_co2e_mass_emission': {
                'type': 'number',
                'label': 'Gross CO2e Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'gross_co2_mass_emission': {
                'type': 'number',
                'label': 'Gross CO2 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'gross_ch4_mass_emission': {
                'type': 'number',
                'label': 'Gross CH4 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'gross_n2o_mass_emission': {
                'type': 'number',
                'label': 'Gross N2O Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'wi_co2e_mass_emission': {
                'type': 'number',
                'label': 'WI CO2e Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'wi_co2_mass_emission': {
                'type': 'number',
                'label': 'WI CO2 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'wi_ch4_mass_emission': {
                'type': 'number',
                'label': 'WI CH4 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'wi_n2o_mass_emission': {
                'type': 'number',
                'label': 'WI N2O Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'nri_co2e_mass_emission': {
                'type': 'number',
                'label': 'NRI CO2e Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'nri_co2_mass_emission': {
                'type': 'number',
                'label': 'NRI CO2 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'nri_ch4_mass_emission': {
                'type': 'number',
                'label': 'NRI CH4 Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'nri_n2o_mass_emission': {
                'type': 'number',
                'label': 'NRI N2O Mass Emitted',
                'category': 'Carbon',
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
                'unit': 'MT'
            },
            'wi_oil_sales_volume': {
                'type': 'number',
                'label': 'WI Oil Sales Volume',
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
                'unit_key': 'oil'
            },
            'wi_gas_sales_volume': {
                'type': 'number',
                'label': 'WI Gas Sales Volume',
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
                'unit_key': 'gas'
            },
            'wi_ngl_sales_volume': {
                'type': 'number',
                'label': 'WI NGL Sales Volume',
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
                'unit_key': 'ngl'
            },
            'wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': 'WI Drip Condensate Sales Volume',
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
                'unit_key': 'drip_condensate'
            },
            'wi_boe_sales_volume': {
                'type': 'number',
                'label': 'WI BOE Sales Volume',
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
                'unit_key': 'boe'
            },
            'wi_mcfe_sales_volume': {
                'type': 'number',
                'label': 'WI MCFE Sales Volume',
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
                'unit_key': 'mcfe'
            },
            'wi_water_sales_volume': {
                'type': 'number',
                'label': 'WI Water Sales Volume',
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
                'unit_key': 'water'
            },
            'net_oil_sales_volume': {
                'type': 'number',
                'label': 'Net Oil Sales Volume',
                'category': 'Net Volumes',
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
                'unit_key': 'oil'
            },
            'net_gas_sales_volume': {
                'type': 'number',
                'label': 'Net Gas Sales Volume',
                'category': 'Net Volumes',
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
                'unit_key': 'gas'
            },
            'net_ngl_sales_volume': {
                'type': 'number',
                'label': 'Net NGL Sales Volume',
                'category': 'Net Volumes',
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
                'unit_key': 'ngl'
            },
            'net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': 'Net Drip Condensate Sales Volume',
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
                'unit_key': 'drip_condensate'
            },
            'net_boe_sales_volume': {
                'type': 'number',
                'label': 'Net BOE Sales Volume',
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
                'unit_key': 'boe'
            },
            'net_mcfe_sales_volume': {
                'type': 'number',
                'label': 'Net MCFE Sales Volume',
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
                'unit_key': 'mcfe'
            },
            'net_water_sales_volume': {
                'type': 'number',
                'label': 'Net Water Sales Volume',
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
                'unit_key': 'water'
            },
            'net_oil_well_head_volume': {
                'type': 'number',
                'label': 'Net Oil Well Head Volume',
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
                'unit_key': 'oil'
            },
            'net_gas_well_head_volume': {
                'type': 'number',
                'label': 'Net Gas Well Head Volume',
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
                'unit_key': 'gas'
            },
            'net_water_well_head_volume': {
                'type': 'number',
                'label': 'Net Water Well Head Volume',
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
                'unit_key': 'water'
            },
            'stream_properties_model_name': {
                'type': 'str',
                'label': 'Stream Properties Model Name',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'ngl_yield': {
                'type': 'number',
                'label': 'NGL Yield',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'pre_yield_gas_volume_ngl'
                },
                'unit': 'BBL/MMCF'
            },
            'drip_condensate_yield': {
                'type': 'number',
                'label': 'Drip Condensate Yield',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'pre_yield_gas_volume_drip_condensate'
                },
                'unit': 'BBL/MMCF'
            },
            'oil_shrinkage': {
                'type': 'number',
                'label': 'Oil Shrinkage',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'gross_oil_sales_volume',
                    'denominator': 'unshrunk_oil_volume'
                },
                'unit': '%'
            },
            'gas_shrinkage': {
                'type': 'number',
                'label': 'Gas Shrinkage',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'gross_gas_sales_volume',
                    'denominator': 'unshrunk_gas_volume'
                },
                'unit': '%'
            },
            'oil_loss': {
                'type': 'number',
                'label': 'Oil Loss',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'unshrunk_oil_volume',
                    'denominator': 'gross_oil_well_head_volume'
                },
                'unit': '%'
            },
            'gas_loss': {
                'type': 'number',
                'label': 'Gas Loss',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'pre_flare_gas_volume',
                    'denominator': 'gross_gas_well_head_volume'
                },
                'unit': '%'
            },
            'gas_flare': {
                'type': 'number',
                'label': 'Gas Flare',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'numerator': 'unshrunk_gas_volume',
                    'denominator': 'pre_flare_gas_volume'
                },
                'unit': '%'
            },
            'unshrunk_gas_btu': {
                'type': 'number',
                'label': 'Unshrunk Gas BTU',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'MBTU/MCF'
            },
            'shrunk_gas_btu': {
                'type': 'number',
                'label': 'Shrunk Gas BTU',
                'category': 'Stream Properties',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'MBTU/MCF'
            },
            'differentials_model_name': {
                'type': 'str',
                'label': 'Differentials Model Name',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'input_oil_price': {
                'type': 'number',
                'label': 'Input Oil Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_oil_sales_volume'
                },
                'unit_key': 'oil_price'
            },
            'input_gas_price': {
                'type': 'number',
                'label': 'Input Gas Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_gas_sales_volume'
                },
                'unit_key': 'gas_price'
            },
            'input_ngl_price': {
                'type': 'number',
                'label': 'Input NGL Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_ngl_sales_volume'
                },
                'unit_key': 'ngl_price'
            },
            'input_drip_condensate_price': {
                'type': 'number',
                'label': 'Input Drip Condensate Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_drip_condensate_sales_volume'
                },
                'unit_key': 'drip_condensate_price'
            },
            'oil_differentials_1': {
                'type': 'number',
                'label': 'Oil Differential 1',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_oil_sales_volume'
                },
                'unit_key': 'oil_price'
            },
            'gas_differentials_1': {
                'type': 'number',
                'label': 'Gas Differential 1',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_gas_sales_volume'
                },
                'unit_key': 'gas_price'
            },
            'ngl_differentials_1': {
                'type': 'number',
                'label': 'NGL Differential 1',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_ngl_sales_volume'
                },
                'unit_key': 'ngl_price'
            },
            'drip_condensate_differentials_1': {
                'type': 'number',
                'label': 'Drip Condensate Differential 1',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_drip_condensate_sales_volume'
                },
                'unit_key': 'drip_condensate_price'
            },
            'oil_differentials_2': {
                'type': 'number',
                'label': 'Oil Differential 2',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_oil_sales_volume'
                },
                'unit_key': 'oil_price'
            },
            'gas_differentials_2': {
                'type': 'number',
                'label': 'Gas Differential 2',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_gas_sales_volume'
                },
                'unit_key': 'gas_price'
            },
            'ngl_differentials_2': {
                'type': 'number',
                'label': 'NGL Differential 2',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_ngl_sales_volume'
                },
                'unit_key': 'ngl_price'
            },
            'drip_condensate_differentials_2': {
                'type': 'number',
                'label': 'Drip Condensate Differential 2',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_drip_condensate_sales_volume'
                },
                'unit_key': 'drip_condensate_price'
            },
            'oil_differentials_3': {
                'type': 'number',
                'label': 'Oil Differential 3',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_oil_sales_volume'
                },
                'unit_key': 'oil_price'
            },
            'gas_differentials_3': {
                'type': 'number',
                'label': 'Gas Differential 3',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_gas_sales_volume'
                },
                'unit_key': 'gas_price'
            },
            'ngl_differentials_3': {
                'type': 'number',
                'label': 'NGL Differential 3',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_ngl_sales_volume'
                },
                'unit_key': 'ngl_price'
            },
            'drip_condensate_differentials_3': {
                'type': 'number',
                'label': 'Drip Condensate Differential 3',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_drip_condensate_sales_volume'
                },
                'unit_key': 'drip_condensate_price'
            },
            'oil_price': {
                'type': 'number',
                'label': 'Realized Oil Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_oil_sales_volume'
                },
                'unit_key': 'oil_price'
            },
            'gas_price': {
                'type': 'number',
                'label': 'Realized Gas Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_gas_sales_volume'
                },
                'unit_key': 'gas_price'
            },
            'ngl_price': {
                'type': 'number',
                'label': 'Realized NGL Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_ngl_sales_volume'
                },
                'unit_key': 'ngl_price'
            },
            'drip_condensate_price': {
                'type': 'number',
                'label': 'Realized Drip Condensate Price',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'net_drip_condensate_sales_volume'
                },
                'unit_key': 'drip_condensate_price'
            },
            'oil_differentials_input': {
                'type': 'number',
                'label': 'Oil Differentials Input ($/BBL)',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_differentials_input': {
                'type': 'number',
                'label': 'Gas Differentials Input ($/MMBTU)',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'ngl_differentials_input': {
                'type': 'number',
                'label': 'NGL Differentials Input ($/BBL)',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'drip_condensate_differentials_input': {
                'type': 'number',
                'label': 'Drip Condensate Differentials Input ($/BBL)',
                'category': 'Price',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'pricing_model_name': {
                'type': 'str',
                'label': 'Pricing Model Name',
                'category': 'Revenue',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_revenue': {
                'type': 'number',
                'label': 'Net Oil Revenue',
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
            'gas_revenue': {
                'type': 'number',
                'label': 'Net Gas Revenue',
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
            'ngl_revenue': {
                'type': 'number',
                'label': 'Net NGL Revenue',
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
            'drip_condensate_revenue': {
                'type': 'number',
                'label': 'Net Drip Condensate Revenue',
                'category': 'Revenue',
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
            'total_revenue': {
                'type': 'number',
                'label': 'Total Net Revenue',
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
            'expenses_model_name': {
                'type': 'str',
                'label': 'Expense Model Name',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'expenses_description': {
                'type': 'str',
                'label': 'Expense Description',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_gathering_expense': {
                'type': 'number',
                'label': 'Oil G & P Expense',
                'category': 'Expense',
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
            'oil_processing_expense': {
                'type': 'number',
                'label': 'Oil OPC Expense',
                'category': 'Expense',
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
            'oil_transportation_expense': {
                'type': 'number',
                'label': 'Oil TRN Expense',
                'category': 'Expense',
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
            'oil_marketing_expense': {
                'type': 'number',
                'label': 'Oil MKT Expense',
                'category': 'Expense',
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
            'oil_other_expense': {
                'type': 'number',
                'label': 'Oil Other Expense',
                'category': 'Expense',
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
            'total_oil_variable_expense': {
                'type': 'number',
                'label': 'Total Oil Variable Expense',
                'category': 'Expense',
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
            'gas_gathering_expense': {
                'type': 'number',
                'label': 'Gas G & P Expense',
                'category': 'Expense',
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
            'gas_processing_expense': {
                'type': 'number',
                'label': 'Gas OPC Expense',
                'category': 'Expense',
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
            'gas_transportation_expense': {
                'type': 'number',
                'label': 'Gas TRN Expense',
                'category': 'Expense',
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
            'gas_marketing_expense': {
                'type': 'number',
                'label': 'Gas MKT Expense',
                'category': 'Expense',
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
            'gas_other_expense': {
                'type': 'number',
                'label': 'Gas Other Expense',
                'category': 'Expense',
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
            'total_gas_variable_expense': {
                'type': 'number',
                'label': 'Total Gas Variable Expense',
                'category': 'Expense',
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
            'ngl_gathering_expense': {
                'type': 'number',
                'label': 'NGL G & P Expense',
                'category': 'Expense',
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
            'ngl_processing_expense': {
                'type': 'number',
                'label': 'NGL OPC Expense',
                'category': 'Expense',
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
            'ngl_transportation_expense': {
                'type': 'number',
                'label': 'NGL TRN Expense',
                'category': 'Expense',
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
            'ngl_marketing_expense': {
                'type': 'number',
                'label': 'NGL MKT Expense',
                'category': 'Expense',
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
            'ngl_other_expense': {
                'type': 'number',
                'label': 'NGL Other Expense',
                'category': 'Expense',
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
            'total_ngl_variable_expense': {
                'type': 'number',
                'label': 'Total NGL Variable Expense',
                'category': 'Expense',
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
            'drip_condensate_gathering_expense': {
                'type': 'number',
                'label': 'Drip Condensate G & P Expense',
                'category': 'Expense',
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
            'drip_condensate_processing_expense': {
                'type': 'number',
                'label': 'Drip Condensate OPC Expense',
                'category': 'Expense',
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
            'drip_condensate_transportation_expense': {
                'type': 'number',
                'label': 'Drip Condensate TRN Expense',
                'category': 'Expense',
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
            'drip_condensate_marketing_expense': {
                'type': 'number',
                'label': 'Drip Condensate MKT Expense',
                'category': 'Expense',
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
            'drip_condensate_other_expense': {
                'type': 'number',
                'label': 'Drip Condensate Other Expense',
                'category': 'Expense',
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
            'total_drip_condensate_variable_expense': {
                'type': 'number',
                'label': 'Total Drip Condensate Variable Expense',
                'category': 'Expense',
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
            'water_disposal': {
                'type': 'number',
                'label': 'Water Disposal Expense',
                'category': 'Expense',
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
            'co2e_expense': {
                'type': 'number',
                'label': 'CO2e Expense',
                'category': 'Expense',
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
            'co2_expense': {
                'type': 'number',
                'label': 'CO2 Expense',
                'category': 'Expense',
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
            'ch4_expense': {
                'type': 'number',
                'label': 'CH4 Expense',
                'category': 'Expense',
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
            'n2o_expense': {
                'type': 'number',
                'label': 'N2O Expense',
                'category': 'Expense',
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
            'total_carbon_expense': {
                'type': 'number',
                'label': 'Total Carbon Expense',
                'category': 'Expense',
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
            'total_variable_expense': {
                'type': 'number',
                'label': 'Total Variable Expense',
                'category': 'Expense',
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
            'monthly_well_cost': {
                'type': 'number',
                'label': 'Fixed Expense 1',
                'category': 'Expense',
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
            'other_monthly_cost_1': {
                'type': 'number',
                'label': 'Fixed Expense 2',
                'category': 'Expense',
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
            'other_monthly_cost_2': {
                'type': 'number',
                'label': 'Fixed Expense 3',
                'category': 'Expense',
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
            'other_monthly_cost_3': {
                'type': 'number',
                'label': 'Fixed Expense 4',
                'category': 'Expense',
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
            'other_monthly_cost_4': {
                'type': 'number',
                'label': 'Fixed Expense 5',
                'category': 'Expense',
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
            'other_monthly_cost_5': {
                'type': 'number',
                'label': 'Fixed Expense 6',
                'category': 'Expense',
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
            'other_monthly_cost_6': {
                'type': 'number',
                'label': 'Fixed Expense 7',
                'category': 'Expense',
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
            'other_monthly_cost_7': {
                'type': 'number',
                'label': 'Fixed Expense 8',
                'category': 'Expense',
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
            'other_monthly_cost_8': {
                'type': 'number',
                'label': 'Fixed Expense 9',
                'category': 'Expense',
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
            'total_fixed_expense': {
                'type': 'number',
                'label': 'Total Fixed Expense',
                'category': 'Expense',
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
            'total_expense': {
                'type': 'number',
                'label': 'Total Expense',
                'category': 'Expense',
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
            'total_oil_variable_expense_input': {
                'type': 'number',
                'label': 'Total Oil Variable Expense Input ($/BBL)',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'total_gas_variable_expense_input': {
                'type': 'number',
                'label': 'Total Gas Variable Expense Input ($/MCF)',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'total_water_variable_expense_input': {
                'type': 'number',
                'label': 'Total Water Variable Expense Input ($/BBL)',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'total_ngl_variable_expense_input': {
                'type': 'number',
                'label': 'Total NGL Variable Expense Input ($/BBL)',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'total_drip_condensate_variable_expense_input': {
                'type': 'number',
                'label': 'Total Drip Condensate Variable Expense Input ($/BBL)',
                'category': 'Expense',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'production_taxes_model_name': {
                'type': 'str',
                'label': 'Production Taxes Model Name',
                'category': 'Production Tax',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_severance_tax': {
                'type': 'number',
                'label': 'Oil Severance Tax',
                'category': 'Production Tax',
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
            'gas_severance_tax': {
                'type': 'number',
                'label': 'Gas Severance Tax',
                'category': 'Production Tax',
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
            'ngl_severance_tax': {
                'type': 'number',
                'label': 'NGL Severance Tax',
                'category': 'Production Tax',
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
            'drip_condensate_severance_tax': {
                'type': 'number',
                'label': 'Drip Condensate Severance Tax',
                'category': 'Production Tax',
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
            'total_severance_tax': {
                'type': 'number',
                'label': 'Total Severance Tax',
                'category': 'Production Tax',
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
            'ad_valorem_tax': {
                'type': 'number',
                'label': 'Ad Valorem Tax',
                'category': 'Production Tax',
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
            'total_production_tax': {
                'type': 'number',
                'label': 'Total Production Tax',
                'category': 'Production Tax',
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
            'capex_model_name': {
                'type': 'str',
                'label': 'CAPEX Model Name',
                'category': 'CAPEX',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'capex_description': {
                'type': 'str',
                'label': 'CAPEX Description',
                'category': 'CAPEX',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'tangible_drilling': {
                'type': 'number',
                'label': 'Net Tangible Drilling',
                'category': 'CAPEX',
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
            'intangible_drilling': {
                'type': 'number',
                'label': 'Net Intangible Drilling',
                'category': 'CAPEX',
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
            'total_drilling': {
                'type': 'number',
                'label': 'Total Net Drilling',
                'category': 'CAPEX',
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
            'tangible_completion': {
                'type': 'number',
                'label': 'Net Tangible Completion',
                'category': 'CAPEX',
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
            'intangible_completion': {
                'type': 'number',
                'label': 'Net Intangible Completion',
                'category': 'CAPEX',
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
            'total_completion': {
                'type': 'number',
                'label': 'Total Net Completion',
                'category': 'CAPEX',
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
            'tangible_legal': {
                'type': 'number',
                'label': 'Net Tangible Legal',
                'category': 'CAPEX',
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
            'intangible_legal': {
                'type': 'number',
                'label': 'Net Intangible Legal',
                'category': 'CAPEX',
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
            'total_legal': {
                'type': 'number',
                'label': 'Total Net Legal',
                'category': 'CAPEX',
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
            'tangible_pad': {
                'type': 'number',
                'label': 'Net Tangible Pad',
                'category': 'CAPEX',
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
            'intangible_pad': {
                'type': 'number',
                'label': 'Net Intangible Pad',
                'category': 'CAPEX',
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
            'total_pad': {
                'type': 'number',
                'label': 'Total Net Pad',
                'category': 'CAPEX',
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
            'tangible_facilities': {
                'type': 'number',
                'label': 'Net Tangible Facilities',
                'category': 'CAPEX',
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
            'intangible_facilities': {
                'type': 'number',
                'label': 'Net Intangible Facilities',
                'category': 'CAPEX',
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
            'total_facilities': {
                'type': 'number',
                'label': 'Total Net Facilities',
                'category': 'CAPEX',
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
            'tangible_artificial_lift': {
                'type': 'number',
                'label': 'Net Tangible Artificial Lift',
                'category': 'CAPEX',
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
            'intangible_artificial_lift': {
                'type': 'number',
                'label': 'Net Intangible Artificial Lift',
                'category': 'CAPEX',
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
            'total_artificial_lift': {
                'type': 'number',
                'label': 'Total Net Artificial Lift',
                'category': 'CAPEX',
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
            'tangible_workover': {
                'type': 'number',
                'label': 'Net Tangible Workover',
                'category': 'CAPEX',
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
            'intangible_workover': {
                'type': 'number',
                'label': 'Net Intangible Workover',
                'category': 'CAPEX',
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
            'total_workover': {
                'type': 'number',
                'label': 'Total Net Workover',
                'category': 'CAPEX',
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
            'tangible_leasehold': {
                'type': 'number',
                'label': 'Net Tangible Leasehold',
                'category': 'CAPEX',
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
            'intangible_leasehold': {
                'type': 'number',
                'label': 'Net Intangible Leasehold',
                'category': 'CAPEX',
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
            'total_leasehold': {
                'type': 'number',
                'label': 'Total Net Leasehold',
                'category': 'CAPEX',
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
            'tangible_development': {
                'type': 'number',
                'label': 'Net Tangible Development',
                'category': 'CAPEX',
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
            'intangible_development': {
                'type': 'number',
                'label': 'Net Intangible Development',
                'category': 'CAPEX',
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
            'total_development': {
                'type': 'number',
                'label': 'Total Net Development',
                'category': 'CAPEX',
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
            'tangible_pipelines': {
                'type': 'number',
                'label': 'Net Tangible Pipelines',
                'category': 'CAPEX',
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
            'intangible_pipelines': {
                'type': 'number',
                'label': 'Net Intangible Pipelines',
                'category': 'CAPEX',
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
            'total_pipelines': {
                'type': 'number',
                'label': 'Total Net Pipelines',
                'category': 'CAPEX',
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
            'tangible_exploration': {
                'type': 'number',
                'label': 'Net Tangible Exploration',
                'category': 'CAPEX',
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
            'intangible_exploration': {
                'type': 'number',
                'label': 'Net Intangible Exploration',
                'category': 'CAPEX',
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
            'total_exploration': {
                'type': 'number',
                'label': 'Total Net Exploration',
                'category': 'CAPEX',
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
            'tangible_waterline': {
                'type': 'number',
                'label': 'Net Tangible Waterline',
                'category': 'CAPEX',
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
            'intangible_waterline': {
                'type': 'number',
                'label': 'Net Intangible Waterline',
                'category': 'CAPEX',
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
            'total_waterline': {
                'type': 'number',
                'label': 'Total Net Waterline',
                'category': 'CAPEX',
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
            'tangible_appraisal': {
                'type': 'number',
                'label': 'Net Tangible Appraisal',
                'category': 'CAPEX',
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
            'intangible_appraisal': {
                'type': 'number',
                'label': 'Net Intangible Appraisal',
                'category': 'CAPEX',
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
            'total_appraisal': {
                'type': 'number',
                'label': 'Total Net Appraisal',
                'category': 'CAPEX',
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
            'tangible_other_investment': {
                'type': 'number',
                'label': 'Net Tangible Other Investment',
                'category': 'CAPEX',
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
            'intangible_other_investment': {
                'type': 'number',
                'label': 'Net Intangible Other Investment',
                'category': 'CAPEX',
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
            'total_other_investment': {
                'type': 'number',
                'label': 'Total Net Other Investment',
                'category': 'CAPEX',
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
            'tangible_abandonment': {
                'type': 'number',
                'label': 'Net Tangible Abandonment',
                'category': 'CAPEX',
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
            'intangible_abandonment': {
                'type': 'number',
                'label': 'Net Intangible Abandonment',
                'category': 'CAPEX',
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
            'total_abandonment': {
                'type': 'number',
                'label': 'Total Net Abandonment',
                'category': 'CAPEX',
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
            'tangible_salvage': {
                'type': 'number',
                'label': 'Net Tangible Salvage',
                'category': 'CAPEX',
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
            'intangible_salvage': {
                'type': 'number',
                'label': 'Net Intangible Salvage',
                'category': 'CAPEX',
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
            'total_salvage': {
                'type': 'number',
                'label': 'Total Net Salvage',
                'category': 'CAPEX',
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
            'total_tangible_capex': {
                'type': 'number',
                'label': 'Total Net Tangible Investment',
                'category': 'CAPEX',
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
            'total_intangible_capex': {
                'type': 'number',
                'label': 'Total Net Intangible Investment',
                'category': 'CAPEX',
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
            'total_capex': {
                'type': 'number',
                'label': 'Total Net Investment',
                'category': 'CAPEX',
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
            'first_discounted_capex': {
                'type': 'number',
                'label': 'First Discount Total Net Investment',
                'category': 'CAPEX',
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
            'second_discounted_capex': {
                'type': 'number',
                'label': 'Second Discount Total Net Investment',
                'category': 'CAPEX',
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
            'total_gross_capex': {
                'type': 'number',
                'label': 'Total Gross Investment',
                'category': 'CAPEX',
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
            'net_profit': {
                'type': 'number',
                'label': 'NPI Cash Flow',
                'category': 'Cash Flow',
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
            'net_income': {
                'type': 'number',
                'label': 'Net Operating Income',
                'category': 'Cash Flow',
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
            'first_discount_net_income': {
                'type': 'number',
                'label': 'First Discount Net Operating Income',
                'category': 'Cash Flow',
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
            'second_discount_net_income': {
                'type': 'number',
                'label': 'Second Discount Net Operating Income',
                'category': 'Cash Flow',
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
            'before_income_tax_cash_flow': {
                'type': 'number',
                'label': 'Before Income Tax Cash Flow',
                'category': 'Cash Flow',
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
            'bfit_first_reversion_amount': {
                'type': 'number',
                'label': 'Reversion Amount',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'first_discount_cash_flow': {
                'type': 'number',
                'label': 'First Discount Cash Flow',
                'category': 'Cash Flow',
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
            'second_discount_cash_flow': {
                'type': 'number',
                'label': 'Second Discount Cash Flow',
                'category': 'Cash Flow',
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
            'tax_credit': {
                'type': 'number',
                'label': 'Tax Credit',
                'category': 'AFIT Economics',
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
            'tangible_depreciation': {
                'type': 'number',
                'label': 'Tangible Depreciation',
                'category': 'AFIT Economics',
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
            'intangible_depreciation': {
                'type': 'number',
                'label': 'Intangible Depreciation',
                'category': 'AFIT Economics',
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
            'depreciation': {
                'type': 'number',
                'label': 'Total Depreciation',
                'category': 'AFIT Economics',
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
            'depletion': {
                'type': 'number',
                'label': 'Total Depletion',
                'category': 'AFIT Economics',
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
            'tangible_depletion': {
                'type': 'number',
                'label': 'Tangible Cost Depletion',
                'category': 'AFIT Economics',
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
            'intangible_depletion': {
                'type': 'number',
                'label': 'Intangible Cost Depletion',
                'category': 'AFIT Economics',
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
            'percentage_depletion': {
                'type': 'number',
                'label': 'Percentage Depletion',
                'category': 'AFIT Economics',
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
            'total_deductions': {
                'type': 'number',
                'label': 'Total Deductions',
                'category': 'AFIT Economics',
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
            'taxable_income': {
                'type': 'number',
                'label': 'Taxable Income',
                'category': 'AFIT Economics',
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
            'state_tax_rate': {
                'type': 'number',
                'label': 'State Tax Rate',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'before_income_tax_cash_flow'
                },
                'unit': '%'
            },
            'state_income_tax': {
                'type': 'number',
                'label': 'State Income Tax',
                'category': 'AFIT Economics',
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
            'federal_tax_rate': {
                'type': 'number',
                'label': 'Federal Tax Rate',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': False
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'reliance': {
                    'method': 'average',
                    'weight': 'before_income_tax_cash_flow'
                },
                'unit': '%'
            },
            'federal_income_tax': {
                'type': 'number',
                'label': 'Federal Income Tax',
                'category': 'AFIT Economics',
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
            'after_income_tax_cash_flow': {
                'type': 'number',
                'label': 'After Income Tax Cash Flow',
                'category': 'AFIT Economics',
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
            'afit_first_discount_cash_flow': {
                'type': 'number',
                'label': 'AFIT First Discount Cash Flow',
                'category': 'AFIT Economics',
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
            'afit_second_discount_cash_flow': {
                'type': 'number',
                'label': 'AFIT Second Discount Cash Flow',
                'category': 'AFIT Economics',
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
            'afit_discount_table_cash_flow_1': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 1',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_2': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 2',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_3': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 3',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_4': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 4',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_5': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 5',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_6': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 6',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_7': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 7',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_8': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 8',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_9': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 9',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_10': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 10',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_11': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 11',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_12': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 12',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_13': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 13',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_14': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 14',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_15': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 15',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_discount_table_cash_flow_16': {
                'type': 'number',
                'label': 'AFIT Discount Table Cum CF 16',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'afit_undiscounted_roi': {
                'type': 'number',
                'label': 'After Tax Income Undiscounted ROI',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'afit_first_discount_roi': {
                'type': 'number',
                'label': 'After Tax Income First Discount ROI (Discounted CAPEX)',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'afit_second_discount_roi': {
                'type': 'number',
                'label': 'After Tax Income Second Discount ROI (Discounted CAPEX)',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'afit_first_discount_roi_undiscounted_capex': {
                'type': 'number',
                'label': 'After Tax Income First Discount ROI (Undiscounted CAPEX)',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'afit_second_discount_roi_undiscounted_capex': {
                'type': 'number',
                'label': 'After Tax Income Second Discount ROI (Undiscounted CAPEX)',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'afit_irr': {
                'type': 'number',
                'label': 'After Tax Income IRR',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'afit_undiscounted_payout': {
                'type': 'string',
                'label': 'After Income Tax Undiscounted Payout Date',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'afit_payout_duration': {
                'type': 'number',
                'label': 'After Income Tax Payout Duration',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'afit_first_discount_payout': {
                'type': 'string',
                'label': 'After Income Tax First Discount Payout Date',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'afit_first_discount_payout_duration': {
                'type': 'number',
                'label': 'After Income Tax First Discount Payout Duration',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'afit_second_discount_payout': {
                'type': 'string',
                'label': 'After Income Tax Second Discount Payout Date',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'afit_second_discount_payout_duration': {
                'type': 'number',
                'label': 'After Income Tax Second Discount Payout Duration',
                'category': 'AFIT Economics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'econ_first_production_date': {
                'type': 'date',
                'label': 'Econ First Prod Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'forecast_name': {
                'type': 'str',
                'label': 'Forecast Name',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'dates_model_name': {
                'type': 'str',
                'label': 'Dates Model Name',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'risking_model_name': {
                'type': 'str',
                'label': 'Risking Model Name',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'as_of_date': {
                'type': 'date',
                'label': 'As Of Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'discount_date': {
                'type': 'date',
                'label': 'Discount Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'well_life': {
                'type': 'number',
                'label': 'Econ Well Life',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'years'
            },
            'abandonment_date': {
                'type': 'date',
                'label': 'Abandonment Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'reversion_date': {
                'type': 'str',
                'label': 'Interest Reversion Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'oil_start_using_forecast_date': {
                'type': 'date',
                'label': 'Oil Forecast Volumes Start Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'gas_start_using_forecast_date': {
                'type': 'date',
                'label': 'Gas Forecast Volumes Start Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'water_start_using_forecast_date': {
                'type': 'date',
                'label': 'Water Forecast Volumes Start Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'oil_risk': {
                'type': 'number',
                'label': 'Oil Scenario Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'reliance': {
                    'numerator': 'gross_oil_well_head_volume',
                    'denominator': 'pre_risk_oil_volume'
                },
                'unit': '%'
            },
            'gas_risk': {
                'type': 'number',
                'label': 'Gas Scenario Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'reliance': {
                    'numerator': 'gross_gas_well_head_volume',
                    'denominator': 'pre_risk_gas_volume'
                },
                'unit': '%'
            },
            'ngl_risk': {
                'type': 'number',
                'label': 'NGL Scenario Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'reliance': {
                    'numerator': 'gross_ngl_sales_volume',
                    'denominator': 'pre_risk_ngl_volume'
                },
                'unit': '%'
            },
            'drip_condensate_risk': {
                'type': 'number',
                'label': 'Drip Condensate Scenario Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'reliance': {
                    'numerator': 'gross_drip_condensate_sales_volume',
                    'denominator': 'pre_risk_drip_condensate_volume'
                },
                'unit': '%'
            },
            'water_risk': {
                'type': 'number',
                'label': 'Water Scenario Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': True,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'reliance': {
                    'numerator': 'gross_water_well_head_volume',
                    'denominator': 'pre_risk_water_volume'
                },
                'unit': '%'
            },
            'oil_tc_risk': {
                'type': 'number',
                'label': 'Oil Forecast Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'gas_tc_risk': {
                'type': 'number',
                'label': 'Gas Forecast Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'water_tc_risk': {
                'type': 'number',
                'label': 'Water Forecast Risk Factor',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'apply_normalization': {
                'type': 'string',
                'label': 'TC Normalization Applied',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'y/n'
            },
            'oil_boe_conversion': {
                'type': 'number',
                'label': 'Oil BOE Conversion',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'BBL/BOE'
            },
            'wet_gas_boe_conversion': {
                'type': 'number',
                'label': 'Wet Gas BOE Conversion',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'MCF/BOE'
            },
            'dry_gas_boe_conversion': {
                'type': 'number',
                'label': 'Dry Gas BOE Conversion',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'MCF/BOE'
            },
            'ngl_boe_conversion': {
                'type': 'number',
                'label': 'NGL BOE Conversion',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'BBL/BOE'
            },
            'drip_condensate_boe_conversion': {
                'type': 'number',
                'label': 'Drip Condensate BOE Conversion',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'BBL/BOE'
            },
            'oil_production_as_of_date': {
                'type': 'number',
                'label': 'Oil Production to As Of Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit_key': 'oil'
            },
            'gas_production_as_of_date': {
                'type': 'number',
                'label': 'Gas Production to As Of Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit_key': 'gas'
            },
            'water_production_as_of_date': {
                'type': 'number',
                'label': 'Water Production to As Of Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit_key': 'water'
            },
            'undiscounted_roi': {
                'type': 'number',
                'label': 'Undiscounted ROI',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'first_discount_roi': {
                'type': 'number',
                'label': 'First Discount ROI (Discounted CAPEX)',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'second_discount_roi': {
                'type': 'number',
                'label': 'Second Discount ROI (Discounted CAPEX)',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'first_discount_roi_undiscounted_capex': {
                'type': 'number',
                'label': 'First Discount ROI (Undiscounted CAPEX)',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'second_discount_roi_undiscounted_capex': {
                'type': 'number',
                'label': 'Second Discount ROI (Undiscounted CAPEX)',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'ratio'
            },
            'irr': {
                'type': 'number',
                'label': 'IRR',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'undiscounted_payout': {
                'type': 'string',
                'label': 'Undiscounted Payout Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'payout_duration': {
                'type': 'number',
                'label': 'Payout Duration',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'first_discount_payout': {
                'type': 'string',
                'label': 'First Discount Payout Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'first_discount_payout_duration': {
                'type': 'number',
                'label': 'First Discount Payout Duration',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'second_discount_payout': {
                'type': 'string',
                'label': 'Second Discount Payout Date',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': ''
            },
            'second_discount_payout_duration': {
                'type': 'number',
                'label': 'Second Discount Payout Duration',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'months'
            },
            'gor': {
                'type': 'number',
                'label': 'GOR',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'CF/BBL'
            },
            'wor': {
                'type': 'number',
                'label': 'WOR',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': 'BBL/BBL'
            },
            'water_cut': {
                'type': 'number',
                'label': 'Water Cut',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'unit': '%'
            },
            'oil_breakeven': {
                'type': 'number',
                'label': 'Oil Break Even',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil_breakeven'
            },
            'gas_breakeven': {
                'type': 'number',
                'label': 'Gas Break Even',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas_breakeven'
            },
            'original_wi_oil': {
                'type': 'number',
                'label': 'Original WI Oil',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_wi_gas': {
                'type': 'number',
                'label': 'Original WI Gas',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_wi_ngl': {
                'type': 'number',
                'label': 'Original WI NGL',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_wi_drip_condensate': {
                'type': 'number',
                'label': 'Original WI Drip Condensate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_nri_oil': {
                'type': 'number',
                'label': 'Original NRI Oil',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_nri_gas': {
                'type': 'number',
                'label': 'Original NRI Gas',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_nri_ngl': {
                'type': 'number',
                'label': 'Original NRI NGL',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'original_nri_drip_condensate': {
                'type': 'number',
                'label': 'Original NRI Drip Condensate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'consecutive_negative_cash_flow_months': {
                'type': 'string',
                'label': 'Consecutive Negative Cash Flow Months',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'first_consecutive_negative_cash_flow_month': {
                'type': 'string',
                'label': 'First Consecutive Negative Cash Flow Month',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'last_consecutive_negative_cash_flow_month': {
                'type': 'string',
                'label': 'Last Consecutive Negative Cash Flow Month',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'consecutive_negative_cash_flow_month_count': {
                'type': 'number',
                'label': 'Consecutive Negative Cash Flow Month Count',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'total_negative_cash_flow_month_count': {
                'type': 'number',
                'label': 'Total Negative Cash Flow Month Count',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'first_discount_rate': {
                'type': 'number',
                'label': 'First Discount Rate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'second_discount_rate': {
                'type': 'number',
                'label': 'Second Discount Rate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'discount_table_rate_1': {
                'type': 'number',
                'label': 'Third Discount Rate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'discount_table_rate_2': {
                'type': 'number',
                'label': 'Fourth Discount Rate',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': '%'
            },
            'one_year_capital_efficiency_attribute': {
                'type': 'number',
                'label': '1 Year Capital Efficiency Attribute',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'three_years_capital_efficiency_attribute': {
                'type': 'number',
                'label': '3 Year Capital Efficiency Attribute',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'well_life_capital_efficiency_attribute': {
                'type': 'number',
                'label': 'Well Life Capital Efficiency Attribute',
                'category': 'Additional Oneline Summary Options',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'one_month_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '1 Month Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_month_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '3 Month Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'six_month_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '6 Month Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_year_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '1 Year Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'two_year_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '2 Year Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_year_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '3 Year Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'five_year_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '5 Year Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'ten_year_gross_oil_well_head_volume': {
                'type': 'number',
                'label': '10 Year Gross Oil Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_month_gross_oil_sales_volume': {
                'type': 'number',
                'label': '1 Month Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_month_gross_oil_sales_volume': {
                'type': 'number',
                'label': '3 Month Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'six_month_gross_oil_sales_volume': {
                'type': 'number',
                'label': '6 Month Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_year_gross_oil_sales_volume': {
                'type': 'number',
                'label': '1 Year Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'two_year_gross_oil_sales_volume': {
                'type': 'number',
                'label': '2 Year Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_year_gross_oil_sales_volume': {
                'type': 'number',
                'label': '3 Year Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'five_year_gross_oil_sales_volume': {
                'type': 'number',
                'label': '5 Year Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'ten_year_gross_oil_sales_volume': {
                'type': 'number',
                'label': '10 Year Gross Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_month_wi_oil_sales_volume': {
                'type': 'number',
                'label': '1 Month WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_month_wi_oil_sales_volume': {
                'type': 'number',
                'label': '3 Month WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'six_month_wi_oil_sales_volume': {
                'type': 'number',
                'label': '6 Month WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_year_wi_oil_sales_volume': {
                'type': 'number',
                'label': '1 Year WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'two_year_wi_oil_sales_volume': {
                'type': 'number',
                'label': '2 Year WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_year_wi_oil_sales_volume': {
                'type': 'number',
                'label': '3 Year WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'five_year_wi_oil_sales_volume': {
                'type': 'number',
                'label': '5 Year WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'ten_year_wi_oil_sales_volume': {
                'type': 'number',
                'label': '10 Year WI Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_month_net_oil_sales_volume': {
                'type': 'number',
                'label': '1 Month Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_month_net_oil_sales_volume': {
                'type': 'number',
                'label': '3 Month Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'six_month_net_oil_sales_volume': {
                'type': 'number',
                'label': '6 Month Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_year_net_oil_sales_volume': {
                'type': 'number',
                'label': '1 Year Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'two_year_net_oil_sales_volume': {
                'type': 'number',
                'label': '2 Year Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'three_year_net_oil_sales_volume': {
                'type': 'number',
                'label': '3 Year Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'five_year_net_oil_sales_volume': {
                'type': 'number',
                'label': '5 Year Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'ten_year_net_oil_sales_volume': {
                'type': 'number',
                'label': '10 Year Net Oil Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'one_month_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '1 Month Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_month_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '3 Month Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'six_month_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '6 Month Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_year_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '1 Year Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'two_year_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '2 Year Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_year_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '3 Year Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'five_year_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '5 Year Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'ten_year_gross_gas_well_head_volume': {
                'type': 'number',
                'label': '10 Year Gross Gas Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_month_gross_gas_sales_volume': {
                'type': 'number',
                'label': '1 Month Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_month_gross_gas_sales_volume': {
                'type': 'number',
                'label': '3 Month Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'six_month_gross_gas_sales_volume': {
                'type': 'number',
                'label': '6 Month Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_year_gross_gas_sales_volume': {
                'type': 'number',
                'label': '1 Year Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'two_year_gross_gas_sales_volume': {
                'type': 'number',
                'label': '2 Year Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_year_gross_gas_sales_volume': {
                'type': 'number',
                'label': '3 Year Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'five_year_gross_gas_sales_volume': {
                'type': 'number',
                'label': '5 Year Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'ten_year_gross_gas_sales_volume': {
                'type': 'number',
                'label': '10 Year Gross Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_month_wi_gas_sales_volume': {
                'type': 'number',
                'label': '1 Month WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_month_wi_gas_sales_volume': {
                'type': 'number',
                'label': '3 Month WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'six_month_wi_gas_sales_volume': {
                'type': 'number',
                'label': '6 Month WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_year_wi_gas_sales_volume': {
                'type': 'number',
                'label': '1 Year WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'two_year_wi_gas_sales_volume': {
                'type': 'number',
                'label': '2 Year WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_year_wi_gas_sales_volume': {
                'type': 'number',
                'label': '3 Year WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'five_year_wi_gas_sales_volume': {
                'type': 'number',
                'label': '5 Year WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'ten_year_wi_gas_sales_volume': {
                'type': 'number',
                'label': '10 Year WI Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_month_net_gas_sales_volume': {
                'type': 'number',
                'label': '1 Month Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_month_net_gas_sales_volume': {
                'type': 'number',
                'label': '3 Month Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'six_month_net_gas_sales_volume': {
                'type': 'number',
                'label': '6 Month Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_year_net_gas_sales_volume': {
                'type': 'number',
                'label': '1 Year Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'two_year_net_gas_sales_volume': {
                'type': 'number',
                'label': '2 Year Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'three_year_net_gas_sales_volume': {
                'type': 'number',
                'label': '3 Year Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'five_year_net_gas_sales_volume': {
                'type': 'number',
                'label': '5 Year Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'ten_year_net_gas_sales_volume': {
                'type': 'number',
                'label': '10 Year Net Gas Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'one_month_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '1 Month Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_month_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '3 Month Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'six_month_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '6 Month Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_year_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '1 Year Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'two_year_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '2 Year Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_year_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '3 Year Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'five_year_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '5 Year Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'ten_year_gross_boe_well_head_volume': {
                'type': 'number',
                'label': '10 Year Gross BOE Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_month_gross_boe_sales_volume': {
                'type': 'number',
                'label': '1 Month Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_month_gross_boe_sales_volume': {
                'type': 'number',
                'label': '3 Month Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'six_month_gross_boe_sales_volume': {
                'type': 'number',
                'label': '6 Month Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_year_gross_boe_sales_volume': {
                'type': 'number',
                'label': '1 Year Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'two_year_gross_boe_sales_volume': {
                'type': 'number',
                'label': '2 Year Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_year_gross_boe_sales_volume': {
                'type': 'number',
                'label': '3 Year Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'five_year_gross_boe_sales_volume': {
                'type': 'number',
                'label': '5 Year Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'ten_year_gross_boe_sales_volume': {
                'type': 'number',
                'label': '10 Year Gross BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_month_wi_boe_sales_volume': {
                'type': 'number',
                'label': '1 Month WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_month_wi_boe_sales_volume': {
                'type': 'number',
                'label': '3 Month WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'six_month_wi_boe_sales_volume': {
                'type': 'number',
                'label': '6 Month WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_year_wi_boe_sales_volume': {
                'type': 'number',
                'label': '1 Year WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'two_year_wi_boe_sales_volume': {
                'type': 'number',
                'label': '2 Year WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_year_wi_boe_sales_volume': {
                'type': 'number',
                'label': '3 Year WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'five_year_wi_boe_sales_volume': {
                'type': 'number',
                'label': '5 Year WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'ten_year_wi_boe_sales_volume': {
                'type': 'number',
                'label': '10 Year WI BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_month_net_boe_sales_volume': {
                'type': 'number',
                'label': '1 Month Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_month_net_boe_sales_volume': {
                'type': 'number',
                'label': '3 Month Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'six_month_net_boe_sales_volume': {
                'type': 'number',
                'label': '6 Month Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_year_net_boe_sales_volume': {
                'type': 'number',
                'label': '1 Year Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'two_year_net_boe_sales_volume': {
                'type': 'number',
                'label': '2 Year Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'three_year_net_boe_sales_volume': {
                'type': 'number',
                'label': '3 Year Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'five_year_net_boe_sales_volume': {
                'type': 'number',
                'label': '5 Year Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'ten_year_net_boe_sales_volume': {
                'type': 'number',
                'label': '10 Year Net BOE Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'one_month_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Month Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_month_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Month Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'six_month_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '6 Month Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_year_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Year Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'two_year_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '2 Year Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_year_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Year Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'five_year_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '5 Year Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'ten_year_gross_ngl_sales_volume': {
                'type': 'number',
                'label': '10 Year Gross NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_month_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Month WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_month_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Month WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'six_month_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '6 Month WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_year_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Year WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'two_year_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '2 Year WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_year_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Year WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'five_year_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '5 Year WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'ten_year_wi_ngl_sales_volume': {
                'type': 'number',
                'label': '10 Year WI NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_month_net_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Month Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_month_net_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Month Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'six_month_net_ngl_sales_volume': {
                'type': 'number',
                'label': '6 Month Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_year_net_ngl_sales_volume': {
                'type': 'number',
                'label': '1 Year Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'two_year_net_ngl_sales_volume': {
                'type': 'number',
                'label': '2 Year Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'three_year_net_ngl_sales_volume': {
                'type': 'number',
                'label': '3 Year Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'five_year_net_ngl_sales_volume': {
                'type': 'number',
                'label': '5 Year Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'ten_year_net_ngl_sales_volume': {
                'type': 'number',
                'label': '10 Year Net NGL Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'one_month_gross_water_well_head_volume': {
                'type': 'number',
                'label': '1 Month Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'three_month_gross_water_well_head_volume': {
                'type': 'number',
                'label': '3 Month Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'six_month_gross_water_well_head_volume': {
                'type': 'number',
                'label': '6 Month Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'one_year_gross_water_well_head_volume': {
                'type': 'number',
                'label': '1 Year Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'two_year_gross_water_well_head_volume': {
                'type': 'number',
                'label': '2 Year Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'three_year_gross_water_well_head_volume': {
                'type': 'number',
                'label': '3 Year Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'five_year_gross_water_well_head_volume': {
                'type': 'number',
                'label': '5 Year Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'ten_year_gross_water_well_head_volume': {
                'type': 'number',
                'label': '10 Year Gross Water Well Head Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'one_month_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Month Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_month_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Month Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'six_month_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '6 Month Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'one_year_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Year Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'two_year_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '2 Year Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_year_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Year Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'five_year_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '5 Year Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'ten_year_gross_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '10 Year Gross Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'one_month_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Month WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_month_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Month WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'six_month_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '6 Month WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'one_year_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Year WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'two_year_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '2 Year WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_year_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Year WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'five_year_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '5 Year WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'ten_year_wi_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '10 Year WI Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'one_month_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Month Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_month_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Month Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'six_month_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '6 Month Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'one_year_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '1 Year Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'two_year_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '2 Year Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'three_year_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '3 Year Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'five_year_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '5 Year Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'ten_year_net_drip_condensate_sales_volume': {
                'type': 'number',
                'label': '10 Year Net Drip Condensate Sales Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'last_one_month_oil_average': {
                'type': 'number',
                'label': 'Last 1 Month Oil Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'last_three_month_oil_average': {
                'type': 'number',
                'label': 'Last 3 Month Oil Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'last_one_month_gas_average': {
                'type': 'number',
                'label': 'Last 1 Month Gas Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'last_three_month_gas_average': {
                'type': 'number',
                'label': 'Last 3 Month Gas Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'last_one_month_boe_average': {
                'type': 'number',
                'label': 'Last 1 Month BOE Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'last_three_month_boe_average': {
                'type': 'number',
                'label': 'Last 3 Month BOE Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'boe'
            },
            'last_one_month_mcfe_average': {
                'type': 'number',
                'label': 'Last 1 Month MCFE Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'mcfe'
            },
            'last_three_month_mcfe_average': {
                'type': 'number',
                'label': 'Last 3 Month MCFE Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'mcfe'
            },
            'last_one_month_water_average': {
                'type': 'number',
                'label': 'Last 1 Month Water Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'last_three_month_water_average': {
                'type': 'number',
                'label': 'Last 3 Month Water Gross Well Head Average Volume',
                'category': 'Production Analytics',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'discount_table_cash_flow_1': {
                'type': 'number',
                'label': 'Discount Table Cum CF 1',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_2': {
                'type': 'number',
                'label': 'Discount Table Cum CF 2',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_3': {
                'type': 'number',
                'label': 'Discount Table Cum CF 3',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_4': {
                'type': 'number',
                'label': 'Discount Table Cum CF 4',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_5': {
                'type': 'number',
                'label': 'Discount Table Cum CF 5',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_6': {
                'type': 'number',
                'label': 'Discount Table Cum CF 6',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_7': {
                'type': 'number',
                'label': 'Discount Table Cum CF 7',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_8': {
                'type': 'number',
                'label': 'Discount Table Cum CF 8',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_9': {
                'type': 'number',
                'label': 'Discount Table Cum CF 9',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_10': {
                'type': 'number',
                'label': 'Discount Table Cum CF 10',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_11': {
                'type': 'number',
                'label': 'Discount Table Cum CF 11',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_12': {
                'type': 'number',
                'label': 'Discount Table Cum CF 12',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_13': {
                'type': 'number',
                'label': 'Discount Table Cum CF 13',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_14': {
                'type': 'number',
                'label': 'Discount Table Cum CF 14',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_15': {
                'type': 'number',
                'label': 'Discount Table Cum CF 15',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'discount_table_cash_flow_16': {
                'type': 'number',
                'label': 'Discount Table Cum CF 16',
                'category': 'Cash Flow',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'cash'
            },
            'oil_assigned_p_series_first_segment': {
                'type': 'group',
                'label': 'Oil Assigned P Series First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_assigned_p_series_last_segment': {
                'type': 'group',
                'label': 'Oil Assigned P Series Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p10_first_segment': {
                'type': 'group',
                'label': 'Oil P10 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p10_last_segment': {
                'type': 'group',
                'label': 'Oil P10 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p50_first_segment': {
                'type': 'group',
                'label': 'Oil P50 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p50_last_segment': {
                'type': 'group',
                'label': 'Oil P50 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p90_first_segment': {
                'type': 'group',
                'label': 'Oil P90 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_p90_last_segment': {
                'type': 'group',
                'label': 'Oil P90 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_best_fit_first_segment': {
                'type': 'group',
                'label': 'Oil Best Fit First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_best_fit_last_segment': {
                'type': 'group',
                'label': 'Oil Best Fit Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_assigned_p_series_first_segment': {
                'type': 'group',
                'label': 'Gas Assigned P Series First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_assigned_p_series_last_segment': {
                'type': 'group',
                'label': 'Gas Assigned P Series Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p10_first_segment': {
                'type': 'group',
                'label': 'Gas P10 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p10_last_segment': {
                'type': 'group',
                'label': 'Gas P10 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p50_first_segment': {
                'type': 'group',
                'label': 'Gas P50 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p50_last_segment': {
                'type': 'group',
                'label': 'Gas P50 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p90_first_segment': {
                'type': 'group',
                'label': 'Gas P90 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_p90_last_segment': {
                'type': 'group',
                'label': 'Gas P90 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_best_fit_first_segment': {
                'type': 'group',
                'label': 'Gas Best Fit First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'gas_best_fit_last_segment': {
                'type': 'group',
                'label': 'Gas Best Fit Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_assigned_p_series_first_segment': {
                'type': 'group',
                'label': 'Water Assigned P Series First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_assigned_p_series_last_segment': {
                'type': 'group',
                'label': 'Water Assigned P Series Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p10_first_segment': {
                'type': 'group',
                'label': 'Water P10 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p10_last_segment': {
                'type': 'group',
                'label': 'Water P10 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p50_first_segment': {
                'type': 'group',
                'label': 'Water P50 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p50_last_segment': {
                'type': 'group',
                'label': 'Water P50 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p90_first_segment': {
                'type': 'group',
                'label': 'Water P90 First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_p90_last_segment': {
                'type': 'group',
                'label': 'Water P90 Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_best_fit_first_segment': {
                'type': 'group',
                'label': 'Water Best Fit First Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'water_best_fit_last_segment': {
                'type': 'group',
                'label': 'Water Best Fit Last Segment',
                'category': 'Forecast Parameters',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': ''
            },
            'oil_well_head_eur': {
                'type': 'number',
                'label': 'Oil Well Head EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'gas_well_head_eur': {
                'type': 'number',
                'label': 'Gas Well Head EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'water_well_head_eur': {
                'type': 'number',
                'label': 'Water Well Head EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'water'
            },
            'oil_shrunk_eur': {
                'type': 'number',
                'label': 'Oil Shrunk EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'oil'
            },
            'gas_shrunk_eur': {
                'type': 'number',
                'label': 'Gas Shrunk EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'gas'
            },
            'ngl_shrunk_eur': {
                'type': 'number',
                'label': 'NGL EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'ngl'
            },
            'drip_condensate_shrunk_eur': {
                'type': 'number',
                'label': 'Drip Condensate EUR',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit_key': 'drip_condensate'
            },
            'oil_well_head_eur_over_pll': {
                'type': 'number',
                'label': 'Oil Well Head EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'BBL/FT'
            },
            'gas_well_head_eur_over_pll': {
                'type': 'number',
                'label': 'Gas Well Head EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'MCF/FT'
            },
            'water_well_head_eur_over_pll': {
                'type': 'number',
                'label': 'Water Well Head EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'BBL/FT'
            },
            'oil_shrunk_eur_over_pll': {
                'type': 'number',
                'label': 'Oil Shrunk EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'BBL/FT'
            },
            'gas_shrunk_eur_over_pll': {
                'type': 'number',
                'label': 'Gas Shrunk EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'MCF/FT'
            },
            'ngl_shrunk_eur_over_pll': {
                'type': 'number',
                'label': 'NGL EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'BBL/FT'
            },
            'drip_condensate_shrunk_eur_over_pll': {
                'type': 'number',
                'label': 'Drip Condensate EUR/PLL',
                'category': '8/8ths EUR Econ Limit Applied',
                'hide': False,
                'options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': True
                },
                'default_options': {
                    'monthly': False,
                    'aggregate': False,
                    'one_liner': False
                },
                'unit': 'BBL/FT'
            }
        },
        'columns': [{
            'key': 'gross_oil_well_head_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_gas_well_head_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gross_mcfe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gross_water_well_head_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_oil_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_gas_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_ngl_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gross_mcfe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ownership_reversion_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_wi_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_wi_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_wi_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_wi_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'nri_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'nri_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'nri_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'nri_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_nri_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_nri_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_nri_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_reversion_nri_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'lease_nri',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_lease_nri',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gross_co2e_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_co2_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_ch4_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gross_n2o_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wi_co2e_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wi_co2_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wi_ch4_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wi_n2o_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'nri_co2e_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'nri_co2_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'nri_ch4_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'nri_n2o_mass_emission',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_mcfe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'wi_water_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_oil_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'net_gas_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'net_ngl_sales_volume',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_mcfe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_water_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'stream_properties_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_yield',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_yield',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_shrinkage',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_shrinkage',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_loss',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_loss',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_flare',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'unshrunk_gas_btu',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'shrunk_gas_btu',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'differentials_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'input_oil_price',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'input_gas_price',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'input_ngl_price',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'input_drip_condensate_price',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_differentials_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_differentials_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_differentials_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_differentials_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_differentials_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_differentials_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_differentials_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_differentials_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_differentials_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_differentials_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_differentials_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_differentials_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_price',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_price',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_price',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_price',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_differentials_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_differentials_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_differentials_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_differentials_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pricing_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_revenue',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_revenue',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'ngl_revenue',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'drip_condensate_revenue',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_revenue',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'expenses_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'expenses_description',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_gathering_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_processing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_transportation_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_marketing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_other_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_oil_variable_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_gathering_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_processing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_transportation_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_marketing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_other_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_gas_variable_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_gathering_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_processing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_transportation_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_marketing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_other_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_ngl_variable_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_gathering_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_processing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_transportation_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_marketing_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_other_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_drip_condensate_variable_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'water_disposal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'co2e_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'co2_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ch4_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'n2o_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_carbon_expense',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_variable_expense',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'monthly_well_cost',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_4',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_5',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_6',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_7',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'other_monthly_cost_8',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_fixed_expense',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'total_expense',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'total_oil_variable_expense_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_gas_variable_expense_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_water_variable_expense_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_ngl_variable_expense_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_drip_condensate_variable_expense_input',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'production_taxes_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_severance_tax',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_severance_tax',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_severance_tax',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_severance_tax',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_severance_tax',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'ad_valorem_tax',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'total_production_tax',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'capex_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'capex_description',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_drilling',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_drilling',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_drilling',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_completion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_completion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_completion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_legal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_legal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_legal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_pad',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_pad',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_pad',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_facilities',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_facilities',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_facilities',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_artificial_lift',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_artificial_lift',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_artificial_lift',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_workover',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_workover',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_workover',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_leasehold',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_leasehold',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_leasehold',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_development',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_development',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_development',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_pipelines',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_pipelines',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_pipelines',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_exploration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_exploration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_exploration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_waterline',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_waterline',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_waterline',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_appraisal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_appraisal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_appraisal',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_other_investment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_other_investment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_other_investment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_abandonment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_abandonment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_abandonment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_salvage',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_salvage',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_salvage',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_tangible_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_intangible_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discounted_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'second_discounted_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_gross_capex',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'net_profit',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'net_income',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discount_net_income',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_net_income',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'before_income_tax_cash_flow',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'bfit_first_reversion_amount',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_discount_cash_flow',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_cash_flow',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'tax_credit',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_depreciation',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_depreciation',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'depreciation',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'depletion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'tangible_depletion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'intangible_depletion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'percentage_depletion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_deductions',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'taxable_income',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'state_tax_rate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'state_income_tax',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'federal_tax_rate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'federal_income_tax',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'after_income_tax_cash_flow',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_first_discount_cash_flow',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_second_discount_cash_flow',
            'selected_options': {
                'monthly': True,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_discount_table_cash_flow_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_4',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_5',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_6',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_7',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_8',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_9',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_10',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_11',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_12',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_13',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_14',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_15',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_discount_table_cash_flow_16',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'afit_undiscounted_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_first_discount_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_second_discount_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_first_discount_roi_undiscounted_capex',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_second_discount_roi_undiscounted_capex',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_irr',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_undiscounted_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_first_discount_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_first_discount_payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_second_discount_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'afit_second_discount_payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'econ_first_production_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'forecast_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'dates_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'risking_model_name',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'as_of_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'discount_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'well_life',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'abandonment_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'reversion_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_start_using_forecast_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_start_using_forecast_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_start_using_forecast_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'ngl_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'drip_condensate_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_tc_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_tc_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_tc_risk',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'apply_normalization',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_boe_conversion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wet_gas_boe_conversion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'dry_gas_boe_conversion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'ngl_boe_conversion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'drip_condensate_boe_conversion',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_production_as_of_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_production_as_of_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_production_as_of_date',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'undiscounted_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discount_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_roi',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discount_roi_undiscounted_capex',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_roi_undiscounted_capex',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'irr',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'undiscounted_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discount_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'first_discount_payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_payout',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'second_discount_payout_duration',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gor',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'wor',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_cut',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_breakeven',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_breakeven',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_wi_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_wi_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_wi_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_wi_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_nri_oil',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_nri_gas',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_nri_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'original_nri_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'consecutive_negative_cash_flow_months',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_consecutive_negative_cash_flow_month',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_consecutive_negative_cash_flow_month',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'consecutive_negative_cash_flow_month_count',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'total_negative_cash_flow_month_count',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'first_discount_rate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'second_discount_rate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_rate_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_rate_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_capital_efficiency_attribute',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_years_capital_efficiency_attribute',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'well_life_capital_efficiency_attribute',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_oil_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_wi_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_net_oil_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_gas_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_wi_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_net_gas_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_boe_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_wi_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_net_boe_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_wi_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_net_ngl_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_water_well_head_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_gross_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_wi_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_month_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_month_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'six_month_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'one_year_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'two_year_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'three_year_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'five_year_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ten_year_net_drip_condensate_sales_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_one_month_oil_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_three_month_oil_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_one_month_gas_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_three_month_gas_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_one_month_boe_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_three_month_boe_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_one_month_mcfe_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_three_month_mcfe_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_one_month_water_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'last_three_month_water_average',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_1',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_2',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_3',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_4',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_5',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_6',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_7',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_8',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_9',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_10',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_11',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_12',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_13',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_14',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_15',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'discount_table_cash_flow_16',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_assigned_p_series_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_assigned_p_series_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p10_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p10_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p50_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p50_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p90_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_p90_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_best_fit_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_best_fit_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_assigned_p_series_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_assigned_p_series_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p10_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p10_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p50_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p50_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p90_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_p90_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_best_fit_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'gas_best_fit_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_assigned_p_series_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_assigned_p_series_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p10_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p10_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p50_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p50_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p90_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_p90_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_best_fit_first_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'water_best_fit_last_segment',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': True
            }
        }, {
            'key': 'oil_well_head_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_well_head_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'water_well_head_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_shrunk_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_shrunk_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_shrunk_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_shrunk_eur',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_well_head_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_well_head_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'water_well_head_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'oil_shrunk_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'gas_shrunk_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'ngl_shrunk_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'drip_condensate_shrunk_eur_over_pll',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_yield_gas_volume_drip_condensate',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_yield_gas_volume_ngl',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_risk_oil_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_risk_gas_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_risk_water_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_risk_drip_condensate_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_risk_ngl_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'unshrunk_oil_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'unshrunk_gas_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }, {
            'key': 'pre_flare_gas_volume',
            'selected_options': {
                'monthly': False,
                'aggregate': False,
                'one_liner': False
            }
        }],
        'generalOptions': {
            'discount_table': {
                'first_discount':
                10,
                'second_discount':
                15,
                'rows': [{
                    'discount_table': 0
                }, {
                    'discount_table': 2
                }, {
                    'discount_table': 5
                }, {
                    'discount_table': 8
                }, {
                    'discount_table': 10
                }, {
                    'discount_table': 12
                }, {
                    'discount_table': 15
                }, {
                    'discount_table': 20
                }, {
                    'discount_table': 25
                }, {
                    'discount_table': 30
                }, {
                    'discount_table': 40
                }, {
                    'discount_table': 50
                }, {
                    'discount_table': 60
                }, {
                    'discount_table': 70
                }, {
                    'discount_table': 80
                }, {
                    'discount_table': 100
                }]
            },
            'reporting_units': {
                'oil': 'MBBL',
                'gas': 'MMCF',
                'ngl': 'MBBL',
                'drip_condensate': 'MBBL',
                'water': 'MBBL',
                'pressure': 'PSI',
                'cash': 'M$',
                'water_cut': 'BBL/BOE',
                'gor': 'CF/BBL',
                'condensate_gas_ratio': 'BBL/MMCF',
                'drip_condensate_yield': 'BBL/MMCF',
                'ngl_yield': 'BBL/MMCF'
            }
        }
    }
}

CUSTOM_CONFIGURATION = {
    'custom_string_0': 'PS comp text 1',
    'custom_string_1': 'Biodiversity',
    'custom_string_2': 'Sub Type Curve Area',
    'custom_string_3': 'LPI random Header',
    'custom_string_4': 'CustomHeaderNew',
    'custom_string_5': 'Congo Region DK',
    'custom_string_6': 'US NAVY BASE',
    'custom_string_7': 'Scout',
    'custom_string_8': 'new new name for Text Header 9',
    'custom_string_9': 'text header ten new name',
    'custom_string_10': '1-ThankYou',
    'custom_string_11': 'Custom Text Header 12',
    'custom_string_12': 'Custom Text Header 13',
    'custom_string_13': 'new name for Text Header 14',
    'custom_string_14': 'On-Site Fuel Type',
    'custom_string_15': 'Facility Type',
    'custom_string_16': 'Facility Name',
    'custom_string_17': 'Facility Design Version',
    'custom_string_18': 'Surface/Pad ID',
    'custom_string_19': 'Surface/Pad Location Name',
    'custom_number_0': 'PS Comp Number 1',
    'custom_number_1': 'Shota Header2',
    'custom_number_2': 'EXETAT DK',
    'custom_number_3': 'Employees size',
    'custom_number_4': 'QA Smoke Test Number 5',
    'custom_number_5': 'Custom Number Header 6',
    'custom_number_6': 'Custom Number Header 7',
    'custom_number_7': 'Custom Number Header 8',
    'custom_number_8': 'Custom Number Header 9',
    'custom_number_9': 'Custom Number Header 10',
    'custom_number_10': 'umer_heat map',
    'custom_number_11': 'Custom Number Header 12',
    'custom_number_12': 'Custom Number Header 13',
    'custom_number_13': 'jhjhjhj',
    'custom_number_14': 'Custom Number Header 15',
    'custom_number_15': 'Custom Number Header 16',
    'custom_number_16': 'Custom Number Header 17',
    'custom_number_17': 'Custom Number Header 18',
    'custom_number_18': 'Pneumatic Device Count 2021',
    'custom_number_19': 'Pneumatic Device Count 2018',
    'custom_date_0': 'PS Comp Date 1',
    'custom_date_1': 'Inauguration Date',
    'custom_date_2': 'Custom Date Header 3',
    'custom_date_3': 'Custom Date Header 4',
    'custom_date_4': 'Custom Date Header 5',
    'custom_date_5': 'Custom Date Header 6',
    'custom_date_6': 'Custom Date Header 7',
    'custom_date_7': 'Custom Date Header 8',
    'custom_date_8': 'Custom Date Header 9',
    'custom_date_9': 'Custom Date Header 10',
    'custom_bool_0': 'PS Comp Boolean 1',
    'custom_bool_1': 'Ecole DK',
    'custom_bool_2': 'Electric Compressor',
    'custom_bool_3': 'Tankless',
    'custom_bool_4': 'Custom Boolean Header 5',
}

BIGQUERY_ONE_LINER_DATA = pd.read_pickle(dir_path + '/bigquery_one_liner_query.pkl')
with open(dir_path + '/one_liner_basic_header.txt', 'r') as f:
    ONE_LINER_BASIC_HEADER_EXPORT = f.read()
with open(dir_path + '/one_liner_all_header.txt', 'r') as f:
    ONE_LINER_ALL_HEADER_EXPORT = f.read()
with open(dir_path + '/one_liner_scenario_table_header.txt', 'r') as f:
    ONE_LINER_SCENARIO_TABLE_HEADER_EXPORT = f.read()
