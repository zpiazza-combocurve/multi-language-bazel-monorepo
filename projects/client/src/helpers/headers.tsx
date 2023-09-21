import _ from 'lodash';
import { forwardRef, useEffect, useMemo } from 'react';
import { UseQueryOptions, useQuery } from 'react-query';

import { useAlfa } from '@/helpers/alfa';
import { getApi, postApi } from '@/helpers/routing';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as WELL_HEADERS_UNITS } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { fields as WELL_HEADERS } from '@/inpt-shared/display-templates/wells/well_headers.json';

import { makeLocal } from './date';
import { extractProjectCustomHeadersInfo, useProjectCustomHeadersQuery } from './project-custom-headers';
import { queryClient } from './query-cache';
import { numberDisplay } from './text';

export const EDITABLE_ID_HEADERS = ['api10', 'api12', 'api14', 'aries_id', 'phdwin_id'];

export const NON_EDITABLE_HEADERS = [
	'chosenID',
	'chosenKeyID',
	'copied',
	'createdAt',
	'dataPool',
	'dataSource',
	'generic',
	'has_daily',
	'has_monthly',
	'inptID',
	'mostRecentImportDesc',
	'mostRecentImportType',
	'updatedAt',
	// NOT EDITABLE
	'total_prop_weight',
	'total_fluid_volume',
	'first_proppant_per_perforated_interval',
	'first_fluid_per_perforated_interval',
	'first_proppant_per_fluid',
	'refrac_proppant_per_perforated_interval',
	'refrac_fluid_per_perforated_interval',
	'refrac_proppant_per_fluid',
	'total_proppant_per_perforated_interval',
	'total_fluid_per_perforated_interval',
	'total_proppant_per_fluid',
	'total_additive_volume',
	'total_cluster_count',
	'total_stage_count',
	'first_prod_date_monthly_calc',
	'last_prod_date_monthly',
	'first_prod_date_daily_calc',
	'last_prod_date_daily',
	'mostRecentImportDate',

	// Econ Well Calcs
	'combo_name',
	'econ_run_date',
	'wi_oil',
	'nri_oil',
	'before_income_tax_cash_flow',
	'first_discount_cash_flow',
	'econ_first_production_date',
	'undiscounted_roi',
	'irr',
	'payout_duration',
	'oil_breakeven',
	'gas_breakeven',
	'oil_shrunk_eur',
	'gas_shrunk_eur',
	'ngl_shrunk_eur',
	'oil_shrunk_eur_over_pll',
	'gas_shrunk_eur_over_pll',
	'ngl_shrunk_eur_over_pll',

	// Production Well Calcs
	'cum_boe',
	'cum_oil',
	'cum_gas',
	'cum_gor',
	'cum_water',
	'cum_mmcfge',
	'cum_boe_per_perforated_interval',
	'cum_gas_per_perforated_interval',
	'cum_oil_per_perforated_interval',
	'cum_water_per_perforated_interval',
	'cum_mmcfge_per_perforated_interval',
	'first_12_boe',
	'first_12_boe_per_perforated_interval',
	'first_12_gas',
	'first_12_gas_per_perforated_interval',
	'first_12_gor',
	'first_12_oil',
	'first_12_oil_per_perforated_interval',
	'first_12_water',
	'first_12_water_per_perforated_interval',
	'first_12_mmcfge',
	'first_12_mmcfge_per_perforated_interval',
	'first_6_boe',
	'first_6_boe_per_perforated_interval',
	'first_6_gas',
	'first_6_gas_per_perforated_interval',
	'first_6_gor',
	'first_6_mmcfge',
	'first_6_mmcfge_per_perforated_interval',
	'first_6_oil',
	'first_6_oil_per_perforated_interval',
	'first_6_water',
	'first_6_water_per_perforated_interval',
	'last_12_boe',
	'last_12_boe_per_perforated_interval',
	'last_12_gas',
	'last_12_gas_per_perforated_interval',
	'last_12_gor',
	'last_12_mmcfge',
	'last_12_mmcfge_per_perforated_interval',
	'last_12_oil',
	'last_12_oil_per_perforated_interval',
	'last_12_water',
	'last_12_water_per_perforated_interval',
	'last_month_boe',
	'last_month_boe_per_perforated_interval',
	'last_month_gas',
	'last_month_gas_per_perforated_interval',
	'last_month_gor',
	'last_month_mmcfge',
	'last_month_mmcfge_per_perforated_interval',
	'last_month_oil',
	'last_month_oil_per_perforated_interval',
	'last_month_water',
	'last_month_water_per_perforated_interval',
	'month_produced',

	// calculated header
	'scope',
	'wells_collection',

	// well spacing
	'closest_well_any_zone',
	'closest_well_same_zone',
];

const ECON_MODEL_HEADERS = [
	'wi_oil',
	'nri_oil',
	'before_income_tax_cash_flow',
	'first_discount_cash_flow',
	'econ_first_production_date',
	'undiscounted_roi',
	'irr',
	'payout_duration',
	'oil_breakeven',
	'gas_breakeven',
	'oil_shrunk_eur',
	'gas_shrunk_eur',
	'ngl_shrunk_eur',
	'oil_shrunk_eur_over_pll',
	'gas_shrunk_eur_over_pll',
	'ngl_shrunk_eur_over_pll',
];
type ChipObject = Record<string, string>;

/**
 * Used to create an object that contains the chip information for an array of similar headers
 *
 * @param headers
 * @param chipHeader
 * @returns
 */
function createChipObject(headers: string[], chipHeader: string): ChipObject {
	const chipObject = {};
	headers.forEach((header) => (chipObject[header] = chipHeader));

	return chipObject;
}

const WELL_HEADERS_QUERY_KEY = 'custom-well-headers';

type WellHeaders = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useWellHeadersQuery<T = WellHeaders>(options?: UseQueryOptions<WellHeaders, any, T, any>) {
	return useQuery([WELL_HEADERS_QUERY_KEY], () => getApi('/dt/getCustomHeaders') as Promise<WellHeaders>, options);
}

interface UseWellHeadersOptions {
	enableProjectCustomHeaders?: boolean;
	enableScopeHeader?: boolean;
	enableWellsCollectionHeader?: boolean;
	enableCompanyCustomHeaders?: boolean;
}

export const SCOPE_KEY = 'scope';

const SCOPE_HEADER_LABEL = { [SCOPE_KEY]: 'Scope' };

const SCOPE_HEADER_TYPE = {
	[SCOPE_KEY]: {
		options: [
			{
				label: 'Company',
				value: false,
			},
			{
				label: 'Project',
				value: true,
			},
		],
		type: 'multi-select',
	},
};

export const WELLS_COLLECTION_KEY = 'wells_collection';

const WELLS_COLLECTION_LABEL = { [WELLS_COLLECTION_KEY]: 'Wells Collection' };

const WELLS_COLLECTION_TYPE = {
	[WELLS_COLLECTION_KEY]: {
		options: [
			{
				label: 'No',
				value: false,
			},
			{
				label: 'Yes',
				value: true,
			},
		],
		type: 'multi-select',
	},
};

export type WellHeadersUnits = {
	[key: string]: string;
};

export function useWellHeaders({
	enableProjectCustomHeaders = false,
	enableScopeHeader = false,
	enableWellsCollectionHeader = false,
	enableCompanyCustomHeaders = false,
}: UseWellHeadersOptions = {}) {
	const { project } = useAlfa();
	const { data: projectCustomHeadersData, isFetching: fetchingPCHsData } = useProjectCustomHeadersQuery(
		project?._id,
		{
			enabled: enableProjectCustomHeaders,
			select: (projectHeaders) => extractProjectCustomHeadersInfo(projectHeaders),
		}
	);
	const { data: companyCustomHeadersData } = useCompanyHeaders({
		enabled: enableCompanyCustomHeaders,
	}) as { data: Record<string, string> };
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const globalHeaders = useWellHeadersQuery({
		placeholderData: WELL_HEADERS,
		select: (custom) => ({ ...WELL_HEADERS, ...custom }),
	}).data!;

	return useMemo(
		() => ({
			wellHeadersLabels: {
				...globalHeaders,
				...(enableProjectCustomHeaders ? projectCustomHeadersData?.projectHeaders : {}),
				...(enableCompanyCustomHeaders ? companyCustomHeadersData : {}),
				...(enableScopeHeader ? SCOPE_HEADER_LABEL : {}),
				...(enableWellsCollectionHeader ? WELLS_COLLECTION_LABEL : {}),
			},
			wellHeadersTypes: {
				...WELL_HEADER_TYPES,
				...(enableProjectCustomHeaders ? projectCustomHeadersData?.projectHeadersTypes : {}),
				...(enableScopeHeader ? SCOPE_HEADER_TYPE : {}),
				...(enableWellsCollectionHeader ? WELLS_COLLECTION_TYPE : {}),
			},
			wellHeadersUnits: {
				...WELL_HEADERS_UNITS,
			},
			wellHeadersKeys: [
				...Object.keys(globalHeaders),
				enableScopeHeader && SCOPE_KEY,
				enableWellsCollectionHeader && WELLS_COLLECTION_KEY,
			].filter(Boolean) as string[],
			projectCustomHeadersKeys: enableProjectCustomHeaders
				? Object.keys(projectCustomHeadersData?.projectHeaders ?? {})
				: [],
			companyCustomHeadersKeys: enableCompanyCustomHeaders ? Object.keys(companyCustomHeadersData ?? {}) : [],

			wellHeadersChipDescriptions: {
				...createChipObject(ECON_MODEL_HEADERS, 'econ_run'),
			},
			fetchingPCHsData,
		}),
		[
			globalHeaders,
			enableProjectCustomHeaders,
			projectCustomHeadersData?.projectHeaders,
			projectCustomHeadersData?.projectHeadersTypes,
			enableCompanyCustomHeaders,
			companyCustomHeadersData,
			enableScopeHeader,
			enableWellsCollectionHeader,
			fetchingPCHsData,
		]
	);
}

export function withWellHeaders(Component) {
	// TODO add types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	function WithWellHeadersWrapper(props: any, ref) {
		const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys } = useWellHeaders({
			enableProjectCustomHeaders: true,
		});

		return (
			<Component
				{...props}
				ref={ref}
				wellHeadersLabels={wellHeadersLabels}
				wellHeadersTypes={wellHeadersTypes}
				projectCustomHeadersKeys={projectCustomHeadersKeys}
			/>
		);
	}
	return forwardRef(WithWellHeadersWrapper);
}

/** @note some differences from alfa.wellHeaders is this will not include units */
export function getWellHeaders(): WellHeaders {
	return {
		...WELL_HEADERS,
		...(queryClient.getQueryCache().find([WELL_HEADERS_QUERY_KEY])?.state.data as WellHeaders | undefined),
	};
}

export function getWellHeaderTypes() {
	return _.mapValues(getWellHeaders(), (_value, key) => WELL_HEADER_TYPES?.[key]);
}

export function SyncWellHeaders() {
	const { wellHeaders } = useAlfa();

	useWellHeadersQuery();

	useEffect(() => {
		queryClient.invalidateQueries([WELL_HEADERS_QUERY_KEY]);
	}, [wellHeaders]);

	return null;
}

interface StringHeaderType {
	type: 'string' | 'multi-checkbox' | 'multi-select';
}
interface NumberHeaderType {
	type: 'number' | 'percent' | 'integer';
	digits?: number;
}
interface DateHeaderType {
	type: 'date';
	kind?: 'date' | 'timestamp';
}
interface BooleanHeaderTypeOption {
	value: boolean;
	label: 'string';
}
interface BooleanHeaderType {
	type: 'boolean';
	options?: BooleanHeaderTypeOption[];
}

type HeaderType = StringHeaderType | NumberHeaderType | DateHeaderType | BooleanHeaderType;

export function getValueDisplay(value: unknown, type: HeaderType) {
	switch (type?.type) {
		case 'date': {
			if (!value) {
				return 'N/A';
			}
			let date = new Date(`${value}`);
			const { kind = 'date' } = type;
			if (kind === 'date') {
				date = makeLocal(date) ?? date;
			}
			return date.toLocaleDateString();
		}
		case 'number':
		case 'percent': {
			return numberDisplay(value, type?.digits ?? 2);
		}
		case 'integer':
			return numberDisplay(value, 0);
		case 'boolean': {
			const options = type.options || [
				{ value: true, label: 'Yes' as string },
				{ value: false, label: 'No' as string },
			];
			return options.find(({ value: optionValue }) => value === optionValue)?.label || 'N/A';
		}
		case 'multi-checkbox':
		case 'multi-select':
		default:
			return value ? `${value}` : 'N/A';
	}
}

export function getHeaderValueDisplay(well, header, wellHeaderTypes = WELL_HEADER_TYPES) {
	return getValueDisplay(well?.[header], wellHeaderTypes?.[header]);
}

export function useCustomFields(collection, queryOptions?) {
	return useQuery(['custom-headers', collection], () => getApi('/dt/getCustomHeaders', { collection }), queryOptions);
}

export function useMultipleCustomFields(collections = ['wells', 'monthly-productions', 'daily-productions']) {
	return useQuery(['custom-headers', collections], () => postApi('/dt/getMultipleCustomHeaders', { collections }));
}

export function useCompanyHeaders(queryOptions?) {
	return useCustomFields('wells', queryOptions);
}
