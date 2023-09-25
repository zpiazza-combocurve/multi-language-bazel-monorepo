from typing import Optional

import numpy as np
from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.science.econ.schemas.compositional_economics import Compositional
from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.services.feature_flags.feature_flags_service import evaluate_boolean_flag
from combocurve.shared.contexts import current_context
from combocurve.shared.econ_tools.econ_model_tools import ALL_PHASES, BYPRODUCTS
from combocurve.science.econ.econ_input.stream import Stream
from combocurve.science.econ.econ_input.byproduct import Byproduct


def get_ownership_volumes_by_category(volume_dict):
    '''Turns a dict of volumes and ownership into a dict with production
        for many scenarios for all phases and equivalents

    Args:
        volume_dict:
            A dict of dicts containing production values for each product

    Returns:
        A dict containing dicts representing well head, unshrunk, and sales volumes of different products
        and their respective production for each ownership,
        (WI, NRI, Lease NRI, and other scenarios i.e. one - WI).
        Moreover, some equivalent values are returned in the form of BOE and MCFE
        Each production is given as an array of floats, for example:

        {'well_head':
            {'time': [0., 1., 2., 3.],
                'oil':
                    {'wi': [0., 0., 0., 0.],
                    'nri': [0., 0., 0., 0.],
                    'lease_nri': [0., 0., 0., 0.],
                    'one_minus_wi': [0., 0., 0., 0.],
                    'one_minus_nri': [0., 0., 0., 0.],
                    'one_minus_lease_nri': [0., 0., 0., 0.],
                    'wi_minus_one': [0., 0., 0., 0.],
                    'nri_minus_one': [0., 0., 0., 0.],
                    'lease_nri_minus_one': [0., 0., 0., 0.],
                    '100_pct_wi': [0., 0., 0., 0.]}
                'gas': see oil above
                'water': see oil above},
            'unshrunk': see well_head above
            'sales': see well_head above
            'boe':
            {'well_head_boe':
                {'total': [0., 0., 0., 0.],
                    'wi': [0., 0., 0., 0.],
                    'nri': [0., 0., 0., 0.],
                    'lease_nri': [0., 0., 0., 0.],
                    'one_minus_wi': [0., 0., 0., 0.],
                    'one_minus_nri': [0., 0., 0., 0.],
                    'one_minus_lease_nri': [0., 0., 0., 0.],
                    'wi_minus_one': [0., 0., 0., 0.],
                    'nri_minus_one': [0., 0., 0., 0.],
                    'lease_nri_minus_one': [0., 0., 0., 0.],
                    '100_pct_wi': [0., 0., 0., 0.]},
                'sales_boe': see well_head_boe above,
                'unshrunk_boe': see well_head_boe above
            }
            'mcfe':
            {'well_head_mcfe':
                {'total': [0., 0., 0., 0.],
                    'wi': [0., 0., 0., 0.],
                    'nri': [0., 0., 0., 0.],
                    'lease_nri': [0., 0., 0., 0.],
                    'one_minus_wi': [0., 0., 0., 0.],
                    'one_minus_nri': [0., 0., 0., 0.],
                    'one_minus_lease_nri': [0., 0., 0., 0.],
                    'wi_minus_one': [0., 0., 0., 0.],
                    'nri_minus_one': [0., 0., 0., 0.],
                    'lease_nri_minus_one': [0., 0., 0., 0.],
                    '100_pct_wi': [0., 0., 0., 0.]}
                'sales_mcfe': see well_head_mcfe above,
                'unshrunk_mcfe': see well_head_boe above
        }

    '''

    ownership_volume_dict = {
        'well_head': {},
        'unshrunk': {},
        'sales': {},
        'boe': {
            'well_head_boe': {},
            'unshrunk_boe': {},
            'sales_boe': {}
        },
        'mcfe': {
            'well_head_mcfe': {},
            'unshrunk_mcfe': {},
            'sales_mcfe': {}
        },
    }
    for cat in ['well_head', 'unshrunk', 'sales']:
        if cat == 'sales':
            for phase in ALL_PHASES + BYPRODUCTS:
                ownership_volume_dict[cat]['time'] = volume_dict[phase]['time']
                ownership_volume_dict[cat][phase] = volume_dict[phase]['ownership'][cat]
        else:
            for phase in ALL_PHASES:
                ownership_volume_dict[cat]['time'] = volume_dict[phase]['time']
                ownership_volume_dict[cat][phase] = volume_dict[phase]['ownership'][cat]
    for volume_equivalent in ['boe', 'mcfe']:
        for cat in ['well_head', 'unshrunk', 'sales']:
            ownership_volume_dict[volume_equivalent][f'{cat}_{volume_equivalent}'] = volume_dict[volume_equivalent][cat]
    return ownership_volume_dict


class Volume(EconCalculation):
    def _equivalent_calculations(self, volume_dict, boe_conversion_dict, ownerships, equivalents_list):
        '''calculate BOE and MCFE equivalents

        Args:
            volume_dict (dict): wellhead, pre-risk, unshrunk, sales, ownership volumes of products
            boe_conversion_dict (dict): conversion factor for different products to BOE
            ownerships (dict): various ownership ratios for each phase
            equivalents_list (list): ['boe', 'mcfe']

        Returns:
            dict: inputted volume_dict with BOE and MCFE equivalents calculated using product volumes
                and conversions
        '''

        duration_len = len(volume_dict['oil']['time'])
        ownership_types = ['total'] + list(ownerships['oil'].keys())

        for equivalent in equivalents_list:
            volume_dict.update({equivalent: {'well_head': {}, 'unshrunk': {}, 'sales': {}}})

        # calculate well_head, unshrunk, and sales equivalent volumes
        for shrinkage in ['well_head', 'unshrunk', 'sales']:
            volume_dict['boe'][shrinkage] = {item: np.zeros(duration_len) for item in ownership_types}

            phase_list = ['oil', 'gas']
            if shrinkage == 'sales':
                phase_list += ['ngl', 'drip_condensate']

            for phase in phase_list:

                if phase not in volume_dict.keys():
                    continue

                if phase != 'gas':
                    conv_factor = boe_conversion_dict.get(phase)
                elif phase == 'gas':
                    conv_factor = (boe_conversion_dict['dry_gas']
                                   if shrinkage == 'sales' else boe_conversion_dict['wet_gas'])

                for owner in ownership_types:
                    if owner == 'total':
                        volume = np.multiply(volume_dict[phase][shrinkage], 1 / conv_factor)
                    else:
                        volume = np.multiply(np.multiply(volume_dict[phase][shrinkage], ownerships[phase][owner]),
                                             1 / conv_factor)
                    volume[np.isnan(volume)] = 0
                    volume_dict['boe'][shrinkage][owner] += volume

            mcfe_conv_factor = (boe_conversion_dict['dry_gas']
                                if shrinkage == 'sales' else boe_conversion_dict['wet_gas'])
            volume_dict['mcfe'][shrinkage] = {
                item: volume_dict['boe'][shrinkage][item] * mcfe_conv_factor
                for item in ownership_types
            }

        return volume_dict

    def _calculate_stream_volumes(self, stream: Stream, this_gross_wh_volume, phase_ownership, stream_property_dict):
        '''calculate various volumes for this product

        Args:
            stream (Stream): product and its production data
            this_gross_wh_volume (dict): gross wellhead and prerisk volume for this product
            phase_ownership (dict): various ownership ratios for this product
            stream_property_dict (dict): shrinkage, yield, and flare loss parameters

        Returns:
            dict: calculated various volume (wellhead, pre-risk, pre-flare, unshrunk, sales
                pre-risk & pre-flare, pre-risk & unshrunk, pre-risk sales) timeseries for this product
        '''

        gross_sales_volume_dict = stream.get_gross_sales_volume(this_gross_wh_volume, stream_property_dict)
        ownership_volume_dict = stream.get_ownership_volume(this_gross_wh_volume, gross_sales_volume_dict,
                                                            phase_ownership)
        this_volume_dict = {
            **this_gross_wh_volume,
            **gross_sales_volume_dict,
            'ownership': ownership_volume_dict,
        }
        return this_volume_dict


class VolumeMonthly(Volume):
    def __init__(self, date_dict, boe_conversion_dict, risk_model, products, byproducts, feature_flags=None):
        self.products = products
        self.byproducts = byproducts
        self.date_dict = date_dict
        self.boe_conversion_dict = boe_conversion_dict
        self.risk_model = risk_model
        organization = current_context.get().tenant_info.get('db_name')

        self.compositional_economics_enabled = evaluate_boolean_flag(
            EnabledFeatureFlags.roll_out_compositional_economics, {
                "context_name": organization,
                "context_type": "organization"
            })

    def result(
        self,
        ownership_dict_by_phase,
        gross_wh_volume_dict,
        stream_property_dict,
    ):
        '''calculate various volumes for products, byproducts, and equivalents

        Args:
            ownerships (dict): various ownership ratios for each phase
            gross_wh_volume_dict (dict): gross wellhead volume timeseries for oil, gas, water
            products (dict): products and respective stream objects
            byproducts (dict): byproducts and respective stream objects
            self.risk_model (dict): risking parameters for each product
            date_dict (dict): dictionary of dates

        Returns:
            dict: timeseries of wellhead, pre-risk, unshrunk, sales, ownership volumes for each
                product, byproduct, and equivalent (BOE & MCFE)
        '''
        streams_list = list(self.products.keys())
        byproducts_list = list(self.byproducts.keys())
        equivalents_list = ['boe', 'mcfe']  # define it elsewhere
        volume_dict = {}
        use_risked_parent_volume = self.risk_model.get('risk_ngl_drip_cond_via_gas_risk', 'yes')
        compositionals = stream_property_dict.get('yield', {}).get('compositionals', [])
        for stream_name in streams_list:
            this_stream = self.products[stream_name]
            this_ownership = self._get_phase_ownership(ownership_dict_by_phase, stream_name)
            this_gross_wh_volume = gross_wh_volume_dict.get(stream_name, {})
            volume_dict[stream_name] = self._calculate_stream_volumes(this_stream, this_gross_wh_volume, this_ownership,
                                                                      stream_property_dict)
        for byproduct_name in byproducts_list:
            if self.compositional_economics_enabled and Compositional.has_value(byproduct_name) \
                    and (compositionals is None or byproduct_name not in compositionals):
                # Skip volume calculation for compositionals that are not in the yield table
                continue
            this_byproduct = self.byproducts[byproduct_name]
            parent_volume_dict = volume_dict[this_byproduct.get_parent_name()]
            # Falling back the ownership to ngl if the byproduct is not found in the ownership dict, temporary fix until
            # we implement ownership for compositionals
            this_ownership = ownership_dict_by_phase.get(byproduct_name, ownership_dict_by_phase.get('ngl'))
            # Hardcoded risk model for now until we implement risking for compositionals
            this_risk_model = self.risk_model.get(byproduct_name, {
                'risk_prod': 'yes',
                'rows': [{
                    'entire_well_life': "Flat",
                    "multiplier": 100
                }]
            })

            volume_dict[byproduct_name] = self._calculate_byproduct_volumes(this_byproduct, parent_volume_dict,
                                                                            this_ownership, stream_property_dict,
                                                                            this_risk_model, self.date_dict,
                                                                            use_risked_parent_volume, compositionals)
        volume_equivalent_dict = self._equivalent_calculations(volume_dict, self.boe_conversion_dict,
                                                               ownership_dict_by_phase, equivalents_list)

        volume_dict.update(**volume_equivalent_dict)
        ownership_volume_dict = get_ownership_volumes_by_category(volume_dict)  # convert to old version

        # TODO: check if volume_dict can be removed and use ownership_volume_dict instead
        return {'volume_dict': volume_dict, 'ownership_volume_dict': ownership_volume_dict}

    def _calculate_byproduct_volumes(
        self,
        byproduct: Byproduct,
        parent_volume_dict,
        phase_ownership,
        stream_property_dict,
        risk_model,
        date_dict,
        use_risked_parent_volume,
        compositionals=None,
    ):
        '''calculate various volumes for this byproduct

        Args:
            byproduct (Byproduct): byproduct and its associated parent product
            parent_volume_dict (dict): volume_dict (dictionary of various volumes) of parent product
            phase_ownership (dict): various ownership ratios for this byproduct
            stream_property_dict (dict): shrinkage, yield, and flare loss parameters
            this_self.risk_model (dict): risking model parameters for this byproduct
            date_dict (dict): dictionary of dates
            use_risked_parent_volume (str): 'yes' if use risked parent volume for calculation

        Returns:
            dict: calculated pre-risk and sales volume timeseries for this byproduct
        '''
        if compositionals is None:
            compositionals = []
        if self.compositional_economics_enabled and byproduct.name in compositionals:
            this_yield_dict = compositionals[byproduct.name]
        else:
            this_yield_dict = stream_property_dict['yield'][byproduct.name]
        gross_sales_volume_dict = byproduct.get_gross_sales_volume(
            parent_volume_dict,
            this_yield_dict,
            risk_model,
            date_dict,
            use_risked_parent_volume,
        )
        ownership_volume_dict = byproduct.get_ownership_sales_volume(gross_sales_volume_dict, phase_ownership)
        this_volume_dict = {
            'date': parent_volume_dict['date'],
            'time': parent_volume_dict['time'],
            **gross_sales_volume_dict,
            'ownership': ownership_volume_dict,
        }
        return this_volume_dict


class VolumeDaily(Volume):
    def __init__(self,
                 products,
                 byproducts,
                 date_dict,
                 risk_model,
                 boe_conversion_dict,
                 feature_flags: Optional[dict[str, bool]] = None):
        self.date_dict = date_dict
        self.products = products
        self.byproducts = byproducts
        self.risk_model = risk_model
        self.boe_conversion_dict = boe_conversion_dict
        organization = current_context.get().tenant_info.get('db_name')

        self.compositional_economics_enabled = evaluate_boolean_flag(
            EnabledFeatureFlags.roll_out_compositional_economics, {
                "context_name": organization,
                "context_type": "organization"
            })

    def result(
        self,
        ownership_dict_by_phase_daily,
        gross_wh_volume_dict_daily,
        stream_property_dict_daily,
    ):
        '''calculate various daily volumes for products, byproducts, and equivalents

        Args:
            ownerships (dict): various ownership ratios for each phase
            gross_wh_volume_dict (dict): gross wellhead volume timeseries for oil, gas, water
            stream_property_dict_daily (dict): shrinkage, yield, and flare loss parameters
            boe_conversion_dict (dict): conversion factor for different products to BOE
            products (dict): products and respective stream objects
            byproducts (dict): byproducts and respective stream objects
            self.risk_model (dict): risking parameters for each product
            date_dict (dict): dictionary of dates

        Returns:
            dict: timeseries of wellhead, pre-risk, unshrunk, sales, ownership volumes for each
                product, byproduct, and equivalent (BOE & MCFE)
        '''
        streams_list = list(self.products.keys())
        byproducts_list = list(self.byproducts.keys())
        equivalents_list = ['boe', 'mcfe']  # define it elsewhere
        volume_dict = {}
        use_risked_parent_volume = self.risk_model.get('risk_ngl_drip_cond_via_gas_risk', 'yes')
        for stream_name in streams_list:
            this_stream = self.products[stream_name]
            this_ownership = self._get_phase_ownership(ownership_dict_by_phase_daily, stream_name)
            this_gross_wh_volume = gross_wh_volume_dict_daily.get(stream_name, {})
            volume_dict[stream_name] = self._calculate_stream_volumes(this_stream, this_gross_wh_volume, this_ownership,
                                                                      stream_property_dict_daily)
        for byproduct_name in byproducts_list:
            this_byproduct = self.byproducts[byproduct_name]
            parent_volume_dict = volume_dict[this_byproduct.get_parent_name()]
            this_ownership = ownership_dict_by_phase_daily.get(byproduct_name)
            this_risk_model = self.risk_model[byproduct_name]

            volume_dict[byproduct_name] = self._calculate_byproduct_volumes_daily(
                this_byproduct,
                parent_volume_dict,
                this_ownership,
                stream_property_dict_daily,
                this_risk_model,
                self.date_dict,
                use_risked_parent_volume,
            )
        volume_equivalent_dict = self._equivalent_calculations(volume_dict, self.boe_conversion_dict,
                                                               ownership_dict_by_phase_daily, equivalents_list)

        volume_dict.update(**volume_equivalent_dict)

        return {'volume_dict_daily': volume_dict}

    def _calculate_byproduct_volumes_daily(
        self,
        byproduct: Byproduct,
        parent_volume_dict,
        phase_ownership,
        stream_property_dict,
        risk_model,
        date_dict,
        use_risked_parent_volume,
    ):
        '''calculate various daily volumes for this byproduct

        Args:
            byproduct (Byproduct): byproduct and its associated parent product
            parent_volume_dict (dict): volume_dict (dictionary of various volumes) of parent product
            phase_ownership (dict): various ownership ratios for this byproduct
            stream_property_dict (dict): shrinkage, yield, and flare loss parameters
            this_self.risk_model (dict): risking model parameters for this byproduct
            date_dict (dict): dictionary of dates
            use_risked_parent_volume (str): 'yes' if use risked parent volume for calculation

        Returns:
            dict: calculated pre-risk and sales volume timeseries for this byproduct
        '''
        this_yield_dict = stream_property_dict['yield'][byproduct.name]
        gross_sales_volume_dict = byproduct.get_gross_sales_volume_daily(
            parent_volume_dict,
            this_yield_dict,
            risk_model,
            date_dict,
            use_risked_parent_volume,
        )
        ownership_volume_dict = byproduct.get_ownership_sales_volume(gross_sales_volume_dict, phase_ownership)
        this_volume_dict = {
            'date': parent_volume_dict['date'],
            'time': parent_volume_dict['time'],
            **gross_sales_volume_dict,
            'ownership': ownership_volume_dict,
        }
        return this_volume_dict


class GroupVolume(Volume):
    def __init__(
        self,
        date_dict,
        boe_conversion_dict,
        group_df,
    ):
        self.date_dict = date_dict
        self.boe_conversion_dict = boe_conversion_dict
        self.group_df = group_df

    def result(
        self,
        ownership_dict_by_phase,
        t_all,
    ):
        volume_dict = self.get_volume_dict_from_group_df(ownership_dict_by_phase, t_all)
        volume_equivalent_dict = self._equivalent_calculations(volume_dict, self.boe_conversion_dict,
                                                               ownership_dict_by_phase, ['boe', 'mcfe'])

        volume_dict.update(**volume_equivalent_dict)
        ownership_volume_dict = get_ownership_volumes_by_category(volume_dict)  # convert to old version

        return {'volume_dict': volume_dict, 'ownership_volume_dict': ownership_volume_dict}

    def get_volume_dict_from_group_df(self, ownership_dict_by_phase, t_all):
        volume_dict = {
            'oil': {
                'time': t_all,
                'ownership': {},
            },
            'gas': {
                'time': t_all,
                'ownership': {},
            },
            'water': {
                'time': t_all,
                'ownership': {},
            },
            'ngl': {
                'time': t_all,
                'ownership': {},
            },
            'drip_condensate': {
                'time': t_all,
                'ownership': {},
            },
        }

        for phase in ALL_PHASES + BYPRODUCTS:
            for volume_type in ['well_head', 'unshrunk', 'sales']:
                if volume_type == 'well_head':
                    if phase in BYPRODUCTS:
                        continue
                    phase_volume = self.group_df[f'gross_{phase}_well_head_volume'].to_numpy()
                elif volume_type == 'shrunk':
                    if phase in BYPRODUCTS:
                        continue
                    if phase == 'water':
                        phase_volume = self.group_df[f'gross_{phase}_well_head_volume'].to_numpy()
                    else:
                        phase_volume = self.group_df[f'unshrunk_{phase}_volume'].to_numpy()
                else:
                    if phase == 'water':
                        phase_volume = self.group_df[f'gross_{phase}_well_head_volume'].to_numpy()
                    else:
                        phase_volume = self.group_df[f'gross_{phase}_sales_volume'].to_numpy()

                volume_dict[phase][volume_type] = phase_volume

                this_ownership = self._get_phase_ownership(ownership_dict_by_phase, phase)
                volume_dict[phase]['ownership'][volume_type] = {}
                for ownership, multiplier in this_ownership.items():
                    volume_dict[phase]['ownership'][volume_type][ownership] = phase_volume * multiplier

        return volume_dict
