import { cloneDeep } from 'lodash';

export const initInitialOwnership = {
	working_interest: 0,
	original_ownership: {
		net_revenue_interest: 0,
		lease_net_revenue_interest: 0,
	},
	oil_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	gas_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	ngl_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	drip_condensate_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	net_profit_interest_type: 'expense',
	net_profit_interest: 0,
};

export const initReversion = {
	no_reversion: '',
	balance: 'gross',
	include_net_profit_interest: 'yes',
	working_interest: 0,
	original_ownership: {
		net_revenue_interest: 0,
		lease_net_revenue_interest: 0,
	},
	oil_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	gas_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	ngl_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	drip_condensate_ownership: {
		net_revenue_interest: '',
		lease_net_revenue_interest: '',
	},
	net_profit_interest: 0,
};

const initOwnership = {
	assumptionKey: 'ownership_reversion',
	assumptionName: 'Ownership and Reversion',
	econ_function: {
		ownership: {
			initial_ownership: cloneDeep(initInitialOwnership),
			first_reversion: cloneDeep(initReversion),
			second_reversion: cloneDeep(initReversion),
			third_reversion: cloneDeep(initReversion),
			fourth_reversion: cloneDeep(initReversion),
			fifth_reversion: cloneDeep(initReversion),
			sixth_reversion: cloneDeep(initReversion),
			seventh_reversion: cloneDeep(initReversion),
			eighth_reversion: cloneDeep(initReversion),
			ninth_reversion: cloneDeep(initReversion),
			tenth_reversion: cloneDeep(initReversion),
		},
	},
	name: 'ownership',
	options: {},
};

export const defaultOwnershipQualifier = {
	ownership: initOwnership,
};

export type DefaultOwnershipQualifier = typeof defaultOwnershipQualifier;
