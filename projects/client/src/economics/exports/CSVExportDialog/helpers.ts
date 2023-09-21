import { capitalize, groupBy } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';

import { useConfigurations, useDefaultConfiguration } from '@/components/hooks';
import {
	COMPOSITIONAL_ECONOMICS_CATEGORIES,
	COMPOSITIONAL_ECONOMICS_COMPONENTS,
} from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/CompositionalEconomics/constants';
import {
	AGG_HEADERS,
	ALL_CUSTOM_HEADERS,
	BY_WELL_HEADERS,
	MAX_ECON_LIFE,
	MIN_ECON_LIFE,
	PDF_ADDITIONAL_HEADERS,
} from '@/economics/Economics/shared/constants';
import { getColumnsByReportType } from '@/economics/exports/shared/helpers';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useWellHeaders } from '@/helpers/headers';
import {
	COMPANY_CUSTOM_HEADER_KEY_PREFIX,
	PROJECT_CUSTOM_HEADER_KEY_PREFIX,
} from '@/inpt-shared/project/project-custom-headers/constants';
import { useCurrentProjectId } from '@/projects/routes';

import {
	createTemplate,
	deleteTemplate,
	getDefaultTemplate,
	getSuggestedTemplates,
	getTemplates,
	setDefaultTemplate,
	updateTemplate,
} from './api';
import {
	CSVExportTemplate,
	CSVExportTemplateDB,
	CashflowOptions,
	HeadersByReportTypeArgs,
	Option,
	ReportType,
	ScenarioTableColumn,
	SelectedOption,
	SuggestedTemplateSymbol,
} from './types';

export const getHeadersByReportType = ({ reportType, customWellHeaderLabels }: Partial<HeadersByReportTypeArgs>) => {
	switch (reportType) {
		case 'cashflow-agg-csv': {
			return {
				...AGG_HEADERS,
			};
		}
		case 'oneLiner':
		case 'cashflow-csv':
		default:
			return {
				...BY_WELL_HEADERS,
				...(customWellHeaderLabels ?? {}),
			};
	}
};

export const isPeriodInRange = (timePeriod: number | null | undefined, min: number, max: number): boolean => {
	if (!timePeriod && timePeriod !== 0) return false;
	if (timePeriod < min) return false;
	if (timePeriod > max) return false;
	return true;
};

export const getExportButtonStatus = (
	selectedReportType: ReportType,
	cashflowOptions: CashflowOptions | null | undefined,
	selectedItems: Array<SelectedOption>
): string => {
	if (!selectedItems?.length) return 'Please select at least one column';

	if (selectedReportType === 'oneLiner') return '';

	if (!cashflowOptions?.type) return 'Please select a cash flow report type';

	const timePeriods = cashflowOptions?.timePeriods;
	const useTimePeriods = cashflowOptions?.useTimePeriods;
	const isDisabledByTimePeriods =
		useTimePeriods && (timePeriods === null || !isPeriodInRange(timePeriods, MIN_ECON_LIFE, MAX_ECON_LIFE));

	if (isDisabledByTimePeriods) return 'Please select a valid time period';

	if (cashflowOptions?.type === 'hybrid') {
		if (!cashflowOptions.hybridOptions) return 'Please select valid hybrid reporting options';
		if (!cashflowOptions.hybridOptions.yearType) return 'Please select calendar or fiscal';
		if (!isPeriodInRange(cashflowOptions.hybridOptions.months, MIN_ECON_LIFE, MAX_ECON_LIFE))
			return 'Please enter a valid number of months';
	}

	return '';
};

export const getSaveButtonStatus = ({ isNameReserved, isNameBlank }) => {
	if (isNameReserved) return 'Please rename template, this name is reserved.';

	if (isNameBlank) return 'Template name cannot be blank.';

	return '';
};

export function isProjectCustomHeaderKey(key) {
	return key.includes(PROJECT_CUSTOM_HEADER_KEY_PREFIX);
}

export function isCompanyCustomHeaderKey(key) {
	if (isProjectCustomHeaderKey(key)) return false;
	return key.includes(COMPANY_CUSTOM_HEADER_KEY_PREFIX);
}

export function useAllPossibleHeaders() {
	const { wellHeadersLabels } = useWellHeaders({ enableProjectCustomHeaders: true });

	// We need to filter received from BE wellHeadersLabels because some of them we need to put in columns instead
	const customHeadersLabels = useMemo(() => {
		const customHeadersKeys = Object.keys(ALL_CUSTOM_HEADERS);
		const projectCustomHeadersKeys = Object.keys(wellHeadersLabels).filter((key) => {
			return isProjectCustomHeaderKey(key);
		});

		const allCustomHeadersKeys = [...customHeadersKeys, ...projectCustomHeadersKeys];

		return Object.fromEntries(allCustomHeadersKeys.map((key) => [key, wellHeadersLabels[key]]));
	}, [wellHeadersLabels]);

	const allPossibleHeaders = useMemo(
		() => ({
			...BY_WELL_HEADERS,
			...AGG_HEADERS,
			...customHeadersLabels,
		}),
		[customHeadersLabels]
	);

	return {
		customHeadersLabels,
		allPossibleHeaders,
		allPDFHeaders: {
			...allPossibleHeaders,
			...PDF_ADDITIONAL_HEADERS,
		},
	};
}
/**
 * Filters =scenarioTableHeaders= based on =allPossibleHeaders= and sets direction and priority correctly if headers
 * removed were sorted
 *
 * @param allPossibleHeaders
 * @param scenarioTableHeaders
 * @returns
 */
export function adjustScenarioTableHeaders(allPossibleHeaders, scenarioTableHeaders) {
	let index = 1;
	return scenarioTableHeaders
		.filter(({ key }) => allPossibleHeaders[key] != null)
		.reduce((acc, { key, direction }) => {
			acc.push({
				key,
				direction,
				priority: direction ? index : undefined,
			});
			if (direction) index++;
			return acc;
		}, [] as ScenarioTableColumn[]);
}

const userTemplatesKey = 'csv-report-template';

export function useUserTemplates({ project, type }: { project?; type? } = {}) {
	const currentProjectId = useCurrentProjectId();
	return useConfigurations({
		queryKey: [...userTemplatesKey, project, type],
		createConfiguration: (template: CSVExportTemplate) =>
			createTemplate({ ...template, project: currentProjectId }),
		deleteConfiguration: deleteTemplate,
		getConfigurations: () => getTemplates({ project, type }),
		updateConfiguration: updateTemplate,
	});
}

export function useDefaultTemplate(project: string, type: ReportType, queryOptions?) {
	return useDefaultConfiguration(
		{
			getDefaultConfiguration: () => getDefaultTemplate({ project, type }),
			queryKey: [...userTemplatesKey, project, type, 'default'],
			updateDefaultConfiguration: (template) =>
				setDefaultTemplate({
					_id: template?._id ?? null,
					project,
					type,
				}),
		},
		queryOptions
	);
}

export function useCurrentProjectDefaultTemplate(reportType?) {
	const currentProjectId = useCurrentProjectId();
	return useDefaultTemplate(currentProjectId, reportType);
}

const suggestedTemplatesKey = [...userTemplatesKey, 'suggested'];

function adjustSuggestedTemplate(template) {
	return { [SuggestedTemplateSymbol]: true, _id: `${template.type}-${template.name}`, ...template };
}

export function useHeaderOptions(reportType, isItemSelected) {
	const { customHeadersLabels } = useAllPossibleHeaders();
	return useMemo<Option[]>(() => {
		const wellHeadersLabelsByType = getHeadersByReportType({
			reportType,
			customWellHeaderLabels: customHeadersLabels,
		});

		return [
			...Object.keys(wellHeadersLabelsByType).map(
				(key): Option => ({
					key,
					label: wellHeadersLabelsByType[key],
					selected: isItemSelected(key),
					keyType: 'header',
					withCircle: isProjectCustomHeaderKey(key),
				})
			),
		];
	}, [isItemSelected, reportType, customHeadersLabels]);
}

function getColumnsOptions(reportType, cashflowType, isItemSelected, compositionalColumns) {
	const currentColumns = {
		...getColumnsByReportType({
			reportType,
		}),
		...compositionalColumns,
	};
	const columns = Object.keys(currentColumns);
	return columns.map((key) => ({
		key,
		label: currentColumns[key]?.label ?? currentColumns[key],
		selected: isItemSelected(key),
		keyType: 'column' as const,
	}));
}

const formatCompositionalColumnLabel = (columnKey: string) => {
	const [prefix, compositionalKey, phase, ...rest] = columnKey.split('_');
	const formattedCompositional =
		COMPOSITIONAL_ECONOMICS_CATEGORIES[compositionalKey.toUpperCase()] ?? capitalize(compositionalKey);
	const formattedPhase = phase === 'ngl' ? 'NGL' : 'Gas';
	const formattedRest = rest.map((word) => (word === '100-pct-wi' ? '100% WI' : capitalize(word))).join(' ');
	return `${capitalize(prefix)} ${formattedCompositional} ${formattedPhase} ${formattedRest}`.trimEnd();
};

const getCompositionalColumns = () => {
	const availableColumns = {};
	const parameterTypes = {
		volume: ['sales', 'pre_risk', 'ownership'],
		revenue: ['revenue', '100-pct-wi_revenue', 'gross_revenue'],
		price: ['input', 'realized'],
	};
	const phases = ['ngl', 'gas'];
	for (const compositional of COMPOSITIONAL_ECONOMICS_COMPONENTS) {
		const compositionalKey = compositional.toLowerCase();
		for (const phase of phases) {
			for (const parameterType of Object.keys(parameterTypes)) {
				for (const parameter of parameterTypes[parameterType]) {
					// Revenue isn't usually set as net/gross but just revenue/gross_revenue
					const key =
						parameterType === 'revenue'
							? `comp_${compositionalKey}_${phase}_${parameter}`
							: `comp_${compositionalKey}_${phase}_${parameter}_${parameterType}`;
					const label = formatCompositionalColumnLabel(key);
					availableColumns[key] = {
						category: 'Compositional',
						type: 'number',
						label,
					};
				}
			}
		}
	}
	return availableColumns;
};

export function useColumnsOptions(reportType, cashflowType, isItemSelected) {
	const { isCompositionalEconomicsEnabled } = useLDFeatureFlags();

	return useMemo<Option[]>(() => {
		return getColumnsOptions(
			reportType,
			cashflowType,
			isItemSelected,
			isCompositionalEconomicsEnabled ? getCompositionalColumns() : []
		);
	}, [reportType, cashflowType, isItemSelected, isCompositionalEconomicsEnabled]);
}

function adjustHeaders(template: CSVExportTemplateDB, headersOptions, columnsOptions): CSVExportTemplateDB {
	const headers = groupBy(headersOptions, 'key');
	const columns = groupBy(columnsOptions, 'key');
	return {
		...template,
		// remove invalid columns and headers
		columns: template?.columns
			?.filter(({ key, keyType }) => {
				switch (keyType) {
					case 'header':
						return headers[key]?.[0];
					case 'column':
						return columns[key]?.[0];
					default:
						return false;
				}
			})
			.map((column) => ({
				...column,
				label: headers?.[column?.key]?.[0]?.label ?? columns?.[column?.key]?.[0]?.label,
				selected: true,
			})),
	};
}

export function useSuggestedTemplates(runId, scenarioTableHeaders, type: ReportType) {
	const {
		data: allSuggestedTemplates,
		isLoading: isLoadingSuggestedTemplates,
		isFetching: isFetchingSuggestedTemplates,
	} = useQuery(
		[...suggestedTemplatesKey, runId, ...scenarioTableHeaders, type],
		() => getSuggestedTemplates(runId, scenarioTableHeaders),
		{ enabled: !!runId && !!scenarioTableHeaders }
	);

	return {
		suggestedTemplates: allSuggestedTemplates?.[type]?.map(
			adjustSuggestedTemplate
		) as Required<CSVExportTemplate>[],
		isLoadingSuggestedTemplates,
		isFetchingSuggestedTemplates,
	};
}

export function useTemplates(project, runId, scenarioTableHeaders, reportType) {
	const {
		configurations: userTemplates,
		isLoadingConfigurations,
		...restQueryUserTemplates
	} = useUserTemplates({
		project,
		type: reportType,
	});

	const { suggestedTemplates, isLoadingSuggestedTemplates, ...restQuerySuggestedTemplates } = useSuggestedTemplates(
		runId,
		scenarioTableHeaders,
		reportType
	);

	const isLoading = isLoadingConfigurations || isLoadingSuggestedTemplates;

	const isItemSelected = useCallback(() => true, []);
	const headersOptions = useHeaderOptions(reportType, isItemSelected);

	const { isCompositionalEconomicsEnabled } = useLDFeatureFlags();

	const templates = useMemo(
		() =>
			[...(suggestedTemplates ?? []), ...(userTemplates ?? [])].map((t) =>
				adjustHeaders(
					t,
					headersOptions,
					getColumnsOptions(
						t.type,
						t?.cashflowOptions?.type,
						isItemSelected,
						isCompositionalEconomicsEnabled ? getCompositionalColumns() : []
					)
				)
			),
		[suggestedTemplates, userTemplates, headersOptions, isItemSelected, isCompositionalEconomicsEnabled]
	);

	return {
		templates,
		isLoading,
		...restQueryUserTemplates,
		...restQuerySuggestedTemplates,
	};
}
