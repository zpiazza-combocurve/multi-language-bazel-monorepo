import numpy as np
from combocurve.science.econ.escalation import apply_escalation
from combocurve.science.econ.econ_calculations.calculation import EconCalculation
from combocurve.services.feature_flags.feature_flag_list import EnabledFeatureFlags
from combocurve.services.feature_flags.feature_flags_service import evaluate_boolean_flag
from combocurve.shared.contexts import current_context


def _get_phase_revenue_data_for_products(product: str, volume_dict: dict, price_dict_by_phase: dict,
                                         price_param_by_phase: dict, price_cap_by_phase: dict,
                                         price_escalation_by_phase: dict, diff_dicts_by_phase: dict,
                                         diff_param_by_phase: dict, diff_escalation_by_phase: dict):
    """Extract the revenue data from the dictionaries for a single product

    Args:
        product: The product to extract the revenue data for
        volume_dict: The dictionary of volumes
        price_dict_by_phase: The dictionary of prices
        price_param_by_phase: The dictionary of price parameters
        price_cap_by_phase: The dictionary of price caps
        price_escalation_by_phase: The dictionary of price escalations
        diff_dicts_by_phase: The dictionary of differentials
        diff_param_by_phase: The dictionary of differential parameters
        diff_escalation_by_phase: The dictionary of differential escalations

    Returns:
        A tuple of the volumes, prices, price parameters, price caps, price escalations, differentials, differential
        parameters, and differential escalations for the product
    """
    volumes = volume_dict[product]
    prices = price_dict_by_phase[product]
    price_parameters = price_param_by_phase[product]
    price_cap = price_cap_by_phase[product]
    price_escalation = price_escalation_by_phase[product]
    differentials = dict(
        zip(list(diff_dicts_by_phase.keys()),
            [diff_dicts_by_phase.get(key, {}).get(product) for key in diff_dicts_by_phase]))
    differentials_parameters = dict(
        zip(list(diff_param_by_phase.keys()),
            [diff_param_by_phase.get(key, {}).get(product) for key in diff_param_by_phase]))
    differentials_escalation = dict(
        zip(list(diff_escalation_by_phase.keys()),
            [diff_escalation_by_phase.get(key, {}).get(product) for key in diff_escalation_by_phase]))
    return volumes, prices, price_parameters, price_cap, price_escalation, differentials, differentials_parameters, \
        differentials_escalation


class Revenue(EconCalculation):
    def __init__(self, btu_content_dict):
        organization = current_context.get().tenant_info.get('db_name')
        self.compositional_economics_enabled = evaluate_boolean_flag(
            EnabledFeatureFlags.roll_out_compositional_economics, {
                "context_name": organization,
                "context_type": "organization"
            })

        self.product_list = ['oil', 'gas', 'ngl', 'drip_condensate']
        if self.compositional_economics_enabled:
            self.product_list.append('compositionals')
        self.btu_content_dict = btu_content_dict

    def result(self, volume_dict, price, differential):
        """Organizes inputs into variables and calls _calculate_phase_revenue

        Args:
            volume_dict (dict): various volumes for each phase
            price (dict): price parameters for each phase
            differential (dict): differential parameters for each phase
            btu_content_dict (dict): BTU content for unshrunk and shrunk gas in BTU/MCF

        Returns:
            dict: original price, differentials, post-differential price, net/gross revenue, and ownership
                for all products
        """
        price_dict_by_phase = price['price_dict']
        price_param_by_phase = price['price_parameter']
        price_cap_by_phase = price['price_cap']
        price_escalation_by_phase = price['price_escalation']
        diff_dicts_by_phase = differential['diff_dict']
        diff_param_by_phase = differential['diff_parameter']
        diff_escalation_by_phase = differential['diff_escalation']

        revenue_dict = self._calculate_phase_revenue(self.product_list, volume_dict, price_dict_by_phase,
                                                     price_param_by_phase, price_cap_by_phase,
                                                     price_escalation_by_phase, diff_dicts_by_phase,
                                                     diff_param_by_phase, diff_escalation_by_phase,
                                                     self.btu_content_dict)

        return {'revenue_dict': revenue_dict}

    def _compute_phase_revenue(self, phase_revenue: dict, phase_volume: dict, phase_price: np.ndarray,
                               phase_price_parameters: str, phase_price_cap: float, phase_price_escalation: dict,
                               phase_differentials: dict, phase_differentials_parameters: dict,
                               phase_differentials_escalation: dict, btu_content: dict) -> dict:
        """Takes price parameters, differential parameters, and volumes to calculate revenue for the phase"""
        # for NGL and Drip Cond price calculation
        oil_price_array = phase_revenue.get('oil', {}).get('original_price')
        computed_phase_revenue = self._calculate_this_revenue(phase_volume, phase_price, phase_price_parameters,
                                                              phase_price_cap, phase_price_escalation,
                                                              phase_differentials, phase_differentials_parameters,
                                                              phase_differentials_escalation, btu_content,
                                                              oil_price_array)
        return computed_phase_revenue

    def _calculate_phase_revenue(
        self,
        product_list,
        volume_dict,
        price_dict_by_phase,
        price_param_by_phase,
        price_cap_by_phase,
        price_escalation_by_phase,
        diff_dicts_by_phase,
        diff_param_by_phase,
        diff_escalation_by_phase,
        btu_content_dict,
    ):
        """Takes price parameters, differential parameters, and volumes to calculate revenue for each phase

        Args:
            product_list (list): list of products and byproducts
            volume_dict (dict): various volumes for each phase
            price_dict_by_phase (dict): original price for each phase
            price_param_by_phase (dict): calculation for each phase
            price_cap_by_phase (dict): price cap for each phase, '' if N/A
            price_escalation_by_phase (dict): price escalation type and values for each phase, None if N/A
            diff_dicts_by_phase (dict): contains all differentials
            diff_param_by_phase (dict): calculation for all differentials
            diff_escalation_by_phase (dict): escalation for differentials
            btu_content_dict (dict): BTU content for unshrunk and shrunk gas in BTU/MCF

        Returns:
            dict: original price, differentials, post-differential price, net/gross revenue, and ownership
                for all products
        """
        phase_revenue_dict = {}
        for product in product_list:
            # We only get into the loop if the product 'compositional' was added in the creation - this is flagged.
            if product == "compositionals":
                # Skipping NGL for the time being, will add it when we have it in Stream properties table
                # In such case we loop over the compositionals and calculate revenue for each one in each phase
                # TODO Include gas phase revenue computation - if that's the case
                phase = 'gas'
                phase_revenue_dict['compositionals'] = {}
                phase_revenue_dict['compositionals'][phase] = {}
                comp_price_dict_by_phase = price_dict_by_phase.get('compositionals', {}).get(phase, {})
                comp_price_param_by_phase = price_param_by_phase.get('compositionals', {}).get(phase, {})
                comp_price_cap_by_phase = price_cap_by_phase.get('compositionals', {}).get(phase, {})
                comp_price_escalation_by_phase = price_escalation_by_phase.get('compositionals', {}).get(phase, {})
                for compositional in price_dict_by_phase.get('compositionals', {}).get(phase, []):
                    if compositional not in volume_dict:
                        # We have a disparity between the modeled compositionals in Stream Property and the ones
                        # modeled in Pricing. Continue not to break this.
                        continue
                    volumes, prices, price_parameters, price_cap, price_escalation, differentials, \
                        differentials_parameters, differentials_escalation = _get_phase_revenue_data_for_products(
                            compositional, volume_dict, comp_price_dict_by_phase, comp_price_param_by_phase,
                            comp_price_cap_by_phase, comp_price_escalation_by_phase, diff_dicts_by_phase,
                            diff_param_by_phase, diff_escalation_by_phase)
                    comp_phase_revenue = self._compute_phase_revenue(phase_revenue_dict, volumes, prices,
                                                                     price_parameters, price_cap, price_escalation,
                                                                     differentials, differentials_parameters,
                                                                     differentials_escalation, btu_content_dict)
                    phase_revenue_dict['compositionals'][phase][compositional] = comp_phase_revenue
            else:
                volumes, prices, price_parameters, price_cap, \
                    price_escalation, differentials, differentials_parameters, \
                    differentials_escalation = _get_phase_revenue_data_for_products(product, volume_dict,
                                                                                    price_dict_by_phase,
                                                                                    price_param_by_phase,
                                                                                    price_cap_by_phase,
                                                                                    price_escalation_by_phase,
                                                                                    diff_dicts_by_phase,
                                                                                    diff_param_by_phase,
                                                                                    diff_escalation_by_phase)
                phase_revenue = self._compute_phase_revenue(phase_revenue_dict, volumes, prices, price_parameters,
                                                            price_cap, price_escalation, differentials,
                                                            differentials_parameters, differentials_escalation,
                                                            btu_content_dict)
                phase_revenue_dict[product] = phase_revenue

        return phase_revenue_dict

    def _process_this_price(
        self,
        this_price_array,
        transform_array,
        this_price_param,
        this_price_cap,
        this_price_esca,
        btu_content_dict,
        oil_price_array,
    ):
        '''

        Args:
            this_price_array (ndarray): price timeseries for this phase
            transform_array (ndarray): array for transforming float-type price to timeseries
            this_price_param (str): calculation for this phase
            this_price_cap (float): cap for this phase, '' if N/A
            this_price_esca (dict): escalation type and values for this phase, None if N/A
            btu_content_dict (dict): BTU content for unshrunk and shrunk gas in BTU/MCF
            oil_price_array (ndarray): timeseries of original oil prices

        Raises:
            Exception: oil price must be provided to calculate ratio of oil

        Returns:
            ndarray: price timeseries for this phase
        '''
        this_price = np.multiply(this_price_array, transform_array)

        # convert pct of oil price to price (unit: $/bbl)
        if this_price_param == 'ratio_of_oil':
            if oil_price_array is not None:
                this_price = np.multiply(this_price, oil_price_array)
                this_price_param = 'number'
            else:
                raise Exception('Oil price cannot be none if using ratio of oil price')

        # escalation
        this_price = apply_escalation(this_price, this_price_esca)

        # price_cap
        if this_price_cap != '':
            this_price[this_price > this_price_cap] = np.repeat(this_price_cap, np.sum(this_price > this_price_cap))

        if this_price_param == 'number':
            pass
        elif this_price_param == 'mmbtu':
            this_price = np.multiply(this_price, btu_content_dict['shrunk_gas'])
        elif this_price_param == 'gal':
            this_price = np.multiply(this_price, 42)

        return this_price

    def _calculate_this_revenue(self,
                                this_volume_dict,
                                this_price_array,
                                this_price_param,
                                this_price_cap,
                                this_price_esca,
                                this_diff_dict,
                                this_diff_param_dict,
                                this_diff_esca_dict,
                                btu_content_dict,
                                oil_price_array=None):
        '''Calculates revenue for each phase inputted

        Args:
            this_volume_dict (ndarray): production volumes for phase
            this_price_array (ndarray): timeseries of prices for phase
            this_price_param (str): calculation for this phase
            this_price_cap (float): price cap of this phase, '' if N/A
            this_price_esca (dict): escalation type and values for this phase, None if N/A
            this_diff_dict (dict): differential values for this phase
            this_diff_param_dict (dict): calculation for all differentials
            this_diff_esca_dict (dict): escalation for all differentials
            btu_content_dict (dict): BTU content for unshrunk and shrunk gas in BTU/MCF
            oil_price_array (ndarray): timeseries of original oil prices

        Returns:
            dict: original and post-differential prices, net/gross revenues, and ownership for this phase

        '''

        this_revenue_dict = {}
        t = np.array(this_volume_dict['time'])
        transform_array = np.ones(len(t))
        this_price = self._process_this_price(this_price_array, transform_array, this_price_param, this_price_cap,
                                              this_price_esca, btu_content_dict, oil_price_array)
        this_revenue_dict['original_price'] = this_price
        this_price_updated = this_price
        # calculate and record all differentials
        phase_diff = np.zeros(len(t))
        for diff_key, one_diff_array in this_diff_dict.items():
            one_diff_para = this_diff_param_dict[diff_key]
            one_diff = np.zeros(len(t))

            if one_diff_para == 'mmbtu':
                one_diff = np.multiply(np.multiply(one_diff_array, btu_content_dict['shrunk_gas']), transform_array)
            elif one_diff_para == 'ratio':
                one_diff = -np.multiply(np.multiply(1 - one_diff_array, this_price_updated), transform_array)
            elif one_diff_para == 'gal':
                one_diff = np.multiply(np.multiply(one_diff_array, 42), transform_array)
            elif one_diff_para == 'number':
                one_diff = np.multiply(one_diff_array, transform_array)

            # escalation on differentials
            if one_diff_para != 'ratio':  # we don't apply escalation to ratio (%) for now
                one_diff = apply_escalation(one_diff, this_diff_esca_dict[diff_key])

            this_revenue_dict[diff_key] = one_diff
            phase_diff = phase_diff + one_diff
            # update the price used to calculate ratio diff
            this_price_updated = this_price + one_diff

        this_revenue_dict['differential'] = phase_diff
        this_price_after_diff = this_price + phase_diff
        this_revenue_dict['price_after_diff'] = this_price_after_diff

        # net revenue and gross revenue
        this_nri_volume = this_volume_dict['ownership']['sales']['nri']
        this_wi_volume = this_volume_dict['ownership']['sales']['wi']
        this_gross_volume = this_volume_dict['ownership']['sales']['100_pct_wi']

        this_nr = np.multiply(this_nri_volume, this_price_after_diff)
        this_gr = np.multiply(this_wi_volume, this_price_after_diff)
        this_100_pct_wi_revenue = np.multiply(this_gross_volume, this_price_after_diff)

        this_revenue_dict['net_revenue'] = this_nr
        this_revenue_dict['gross_revenue'] = this_gr
        this_revenue_dict['100_pct_wi_revenue'] = this_100_pct_wi_revenue
        this_revenue_dict['ownership'] = {}

        for this_ownership in this_volume_dict['ownership']['sales'].keys():
            this_volume = this_volume_dict['ownership']['sales'][this_ownership]
            this_revenue_dict['ownership'][this_ownership] = np.multiply(this_volume, this_price_after_diff)

        return this_revenue_dict


class GroupRevenue(EconCalculation):
    def __init__(
        self,
        group_df,
    ):
        self.group_df = group_df

    def result(self, ownership_dict_by_phase):
        revenue_dict = self.get_revenue_dict_from_group_df(ownership_dict_by_phase)

        return {'revenue_dict': revenue_dict}

    def get_revenue_dict_from_group_df(self, ownership_dict_by_phase):
        revenue_dict = {
            'oil': {},
            'gas': {},
            'ngl': {},
            'drip_condensate': {},
        }

        for phase, phase_revenue in revenue_dict.items():
            this_ownership = self._get_phase_ownership(ownership_dict_by_phase, phase)

            phase_net_revenue = self.group_df[f'{phase}_revenue'].to_numpy()
            phase_gross_revenue = self.group_df[f'gross_{phase}_revenue'].to_numpy()
            phase_100_pct_wi_revenue = self.group_df[f'100_pct_wi_{phase}_revenue'].to_numpy()

            phase_revenue['100_pct_wi_revenue'] = phase_100_pct_wi_revenue
            phase_revenue['gross_revenue'] = phase_gross_revenue
            phase_revenue['net_revenue'] = phase_net_revenue

            phase_revenue['ownership'] = {}
            '''
            revenue based on ownership other than wi, nri and 100 pct wi
            are calculated from 100 pct wi * group ownership
            '''
            for ownership, multiplier in this_ownership.items():
                if ownership == 'wi':
                    ownership_rev = phase_gross_revenue
                elif ownership == 'nri':
                    ownership_rev = phase_net_revenue
                elif ownership == '100_pct_wi':
                    ownership_rev = phase_100_pct_wi_revenue
                else:
                    ownership_rev = phase_100_pct_wi_revenue * multiplier
                phase_revenue['ownership'][ownership] = ownership_rev

        return revenue_dict
