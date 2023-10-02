/* eslint-disable camelcase */
import { Document, Types } from 'mongoose';

import { DATA_SOURCES, DataSource } from '@src/models/wells';

export { OwnershipQualifierSchema } from '../../schemas';

export { DataSource, DATA_SOURCES };

export const NPI_TYPE = ['expense', 'revenue'] as const;
export const BALANCE = ['net', 'gross'] as const;
export const INCLUDE_NET_PROFIT_INTEREST = ['yes', 'no'] as const;

export type NpiType = (typeof NPI_TYPE)[number];
export type BalanceType = (typeof BALANCE)[number];
export type IncludeNetProfitInterestType = (typeof INCLUDE_NET_PROFIT_INTEREST)[number];

export interface InitialOwnership {
	working_interest: number;
	original_ownership: { net_revenue_interest: number; lease_net_revenue_interest: number };
	net_profit_interest_type: NpiType;
	net_profit_interest: number;
	oil_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	gas_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	ngl_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	drip_condensate_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
}

interface BaseReversion {
	balance: BalanceType;
	include_net_profit_interest: IncludeNetProfitInterestType;
	working_interest: number | '';
	original_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	net_profit_interest: number;
	oil_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	gas_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	ngl_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
	drip_condensate_ownership: { net_revenue_interest: number | ''; lease_net_revenue_interest: number | '' };
}

export interface NoReversion extends BaseReversion {
	no_reversion?: '';
}

export interface IrrReversion extends BaseReversion {
	irr?: number;
}

interface PayoutWithInvestmentReversion extends BaseReversion {
	payout_with_investment?: number;
}

interface PayoutWithOutInvestmentReversion extends BaseReversion {
	payout_without_investment?: number;
}

interface RoiUndiscReversion extends BaseReversion {
	roi_undisc?: number;
}

interface OffsetToAsOfDateReversion extends BaseReversion {
	offset_to_as_of_date?: Date;
}

interface DateReversion extends BaseReversion {
	date?: Date;
}

interface WellHeadOilCumReversion extends BaseReversion {
	well_head_oil_cum?: number;
}

interface WellHeadGasCumReversion extends BaseReversion {
	well_head_gas_cum?: number;
}

interface WellHeadBoeCumReversion extends BaseReversion {
	well_head_boe_cum?: number;
}

export type Reversion = NoReversion &
	IrrReversion &
	PayoutWithInvestmentReversion &
	PayoutWithOutInvestmentReversion &
	RoiUndiscReversion &
	OffsetToAsOfDateReversion &
	DateReversion &
	WellHeadOilCumReversion &
	WellHeadGasCumReversion &
	WellHeadBoeCumReversion;

export interface Ownership {
	name?: string;
	assumptionKey: 'ownership_reversion';
	assumptionName: 'Ownership and Reversion';
	econ_function: {
		ownership: {
			initial_ownership: InitialOwnership;
			first_reversion: Reversion;
			second_reversion: Reversion;
			third_reversion: Reversion;
			fourth_reversion: Reversion;
			fifth_reversion: Reversion;
			sixth_reversion: Reversion;
			seventh_reversion: Reversion;
			eighth_reversion: Reversion;
			ninth_reversion: Reversion;
			tenth_reversion: Reversion;
		};
	};
	options: Record<string, unknown>;
}

export interface IOwnershipQualifier extends Document {
	_id: Types.ObjectId;
	well: Types.ObjectId;
	chosenID: string;
	dataSource: DataSource;
	qualifierKey: string;
	ownership: Ownership;
	createdAt?: Date;
	updatedAt?: Date;
}
