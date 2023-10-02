import { IBaseEconModel } from './econ-models';

export const PRMS_RESOURCES_CLASS = ['reserves', 'contingent', 'prospective'] as const;
export const PRMS_RESERVES_CATEGORY = ['proved', 'probable', 'possible', 'c1', 'c2', 'c3'] as const;
export const PRMS_RESERVES_SUB_CATEGORY = [
	'producing',
	'non_producing',
	'shut_in',
	'temp_aband',
	'p&a',
	'behind_pipe',
	'injection',
	'undeveloped',
	'need_workover',
] as const;

export type PrmsResourcesClass = (typeof PRMS_RESOURCES_CLASS)[number];
export type PrmsReservesCategory = (typeof PRMS_RESERVES_CATEGORY)[number];
export type PrmsReservesSubCategory = (typeof PRMS_RESERVES_SUB_CATEGORY)[number];

export const RESERVES_CATEGORY_KEY = 'reserves_category';
export const RESERVES_CATEGORY_NAME = 'Reserves Category';

export type ReservesCategoryKey = typeof RESERVES_CATEGORY_KEY;
type ReservesCategoryName = typeof RESERVES_CATEGORY_NAME;

export interface IReservesCategory extends IBaseEconModel {
	assumptionKey: ReservesCategoryKey;
	assumptionName: ReservesCategoryName;
	econ_function: {
		reserves_category: IReservesCategoryEconFunction;
	};
}

export interface IReservesCategoryEconFunction {
	prms_resources_class: PrmsResourcesClass;
	prms_reserves_category: PrmsReservesCategory;
	prms_reserves_sub_category: PrmsReservesSubCategory;
}

export const defaultReservesCategoryEconFunction: IReservesCategoryEconFunction = {
	prms_resources_class: 'reserves',
	prms_reserves_category: 'proved',
	prms_reserves_sub_category: 'producing',
};
