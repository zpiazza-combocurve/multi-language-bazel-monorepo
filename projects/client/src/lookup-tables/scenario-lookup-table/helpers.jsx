import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { confirmationAlert, warningAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useWellHeaders } from '@/helpers/headers';
import { exportXLSX } from '@/helpers/xlsx';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import {
	getAssumptionsValues,
	getHeaderTypes,
	getHeadersValues,
	saveLookupTable,
	useLookupTable as useLookupTableApi,
	validateLookupTable,
} from '@/lookup-tables/scenario-lookup-table/api';
import {
	MAX_RULES,
	formatRules,
	getUsedKeysFromRules,
	isRuleEmpty as isEmpty,
	mapRules,
	useLookupColumnAssignments,
	useLookupColumnHeaders,
	usePCHsForLT,
	validateRules,
} from '@/lookup-tables/shared/utils';
import { useSelectedHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';
import { CARBON_RELATED_ASSUMPTION_KEYS } from '@/scenarios/shared';

export const INITIAL_ASSUMPTIONS = [AssumptionKey.capex];
export const INITIAL_HEADERS = ['type_curve_area', 'perf_lateral_length', 'first_prod_date'];

export const EXTRA_ASSUMPTIONS = {
	[AssumptionKey.forecast]: 'Forecast',
	[AssumptionKey.schedule]: 'Schedule',
};

const DONT_WANT_ASSUMPTIONS = [
	AssumptionKey.escalation,
	AssumptionKey.depreciation,
	AssumptionKey.generalOptions,
	'pricing_diferentials',
	...CARBON_RELATED_ASSUMPTION_KEYS,
];

function mappedAssumptions(values) {
	if (!values) return undefined;

	const assumptionValues = {};
	Object.keys(values).forEach((key) => {
		assumptionValues[key] = values[key]?.map(({ name }) => name);
	});
	return assumptionValues;
}

export function useLookupTable(lookupTableId) {
	const {
		loading: loadingTable,
		lookupTable,
		refresh,
	} = useLookupTableApi(lookupTableId, {
		suspense: true,
		useErrorBoundary: true,
	});

	const sideBar = ASSUMPTION_LABELS;

	const { wellHeaders, project } = useAlfa();

	const pchs = usePCHsForLT(project?._id);

	const { wellHeadersLabels: _wellHeadersLabels } = useWellHeaders({
		enableProjectCustomHeaders: false,
		enableScopeHeader: false,
	});

	const { data: _headerTypes } = useQuery(['lookup-table', 'header-types', lookupTableId], () => getHeaderTypes());

	const { wellHeadersLabels, headerTypes, pchKeys } = useMemo(() => {
		const pchLabels = {};
		const pchTypes = {};

		Object.entries(pchs).forEach(([key, { label, type }]) => {
			pchLabels[key] = label;
			pchTypes[key] = type;
		});

		return {
			wellHeadersLabels: { ...(wellHeaders ?? {}), ...(_wellHeadersLabels ?? {}), ...pchLabels },
			headerTypes: { ...(_headerTypes ?? {}), ...pchTypes },
			pchKeys: Object.keys(pchs),
		};
	}, [wellHeaders, _headerTypes, _wellHeadersLabels, pchs]);

	const headerKeys = useMemo(() => Object.keys(headerTypes), [headerTypes]);

	// Don't show header without labels
	const selectableHeaders = useMemo(
		() => headerKeys.filter((header) => !!wellHeadersLabels[header]),
		[headerKeys, wellHeadersLabels]
	);

	// TODO find out where to get the keys
	const getHeaderLabel = useCallback((key) => wellHeadersLabels[key], [wellHeadersLabels]);

	const assumptionKeys = useMemo(
		() =>
			(sideBar &&
				[...Object.keys(EXTRA_ASSUMPTIONS), ...Object.keys(sideBar)].filter(
					(key) => !DONT_WANT_ASSUMPTIONS.includes(key)
				)) ||
			[],
		[sideBar]
	);

	const getAssumptionLabel = useCallback((key) => sideBar?.[key] || EXTRA_ASSUMPTIONS[key] || '', [sideBar]);

	// TODO merge with saveLookup
	const { isLoading: savingName, mutateAsync: saveLookupName } = useMutation(async (body) => {
		await saveLookupTable(lookupTableId, body);
		confirmationAlert('Lookup Table successfully updated');
		refresh();
	});

	const { configuration } = lookupTable ?? {};

	const lookupRules = lookupTable?.rules;

	const mappedRules = useMemo(() => mapRules(lookupRules, headerTypes), [lookupRules, headerTypes]);
	const [rules, setRules] = useDerivedState(mappedRules);

	const alwaysVisibleHeaders = useMemo(() => getUsedKeysFromRules(rules), [rules]);

	const [selectedHeaders, selectHeaders] = useSelectedHeaders({
		initialHeaders: configuration?.selectedHeaders?.length ? configuration.selectedHeaders : INITIAL_HEADERS,
		allHeaders: selectableHeaders,
		getLabel: getHeaderLabel,
		maxHeaders: headerKeys?.length,
		alwaysVisibleHeaders,
		projectCustomHeadersKeys: pchKeys,
	});

	const [selectedAssumptions, selectAssumptions] = useSelectedHeaders({
		title: 'Search Assumption',
		initialHeaders: configuration?.selectedAssumptions?.length
			? configuration.selectedAssumptions
			: INITIAL_ASSUMPTIONS,
		allHeaders: assumptionKeys,
		getLabel: getAssumptionLabel,
		maxHeaders: assumptionKeys?.length,
		alwaysVisibleHeaders,
	});

	const projectId = project?._id;

	const { data: headers } = useQuery(
		['lookup-table', 'headers', lookupTableId, ...selectedHeaders],
		() => getHeadersValues(selectedHeaders, projectId),
		{
			enabled: !!projectId,
		}
	);

	const { data: assumptions } = useQuery(
		['lookup-table', 'assumptions', lookupTableId],
		() => getAssumptionsValues(projectId),
		{
			select: (values) => mappedAssumptions(values),
			enabled: !!projectId,
		}
	);

	const headerColumns = useLookupColumnHeaders(selectedHeaders, headerTypes, headers, getHeaderLabel);
	const assumptionColumns = useLookupColumnAssignments(selectedAssumptions, assumptions, getAssumptionLabel);

	const lastRule = useMemo(() => rules.reduce((acc, rule, index) => (isEmpty(rule) ? acc : index), 0), [rules]);

	const validateLookup = useCallback(
		async (formattedRules) => {
			const isValid = validateRules(formattedRules, headerTypes);
			if (isValid) {
				const { valid, error } = await validateLookupTable({ rules: formattedRules, project: projectId });
				if (valid) {
					return true;
				}
				const newInvalid = {};
				error.details.forEach(({ field, name }) => {
					newInvalid[field] = { ...(newInvalid[field] || {}), [name]: true };
				});
			}
			return false;
		},
		[projectId, headerTypes]
	);

	const { isLoading: validatingLookupTable, mutateAsync: validate } = useMutation(async () => {
		const formattedRules = formatRules(rules, headerTypes);
		const isValid = await validateLookup(formattedRules, headerTypes);
		if (isValid) {
			confirmationAlert('Lookup Table rules are valid');
			return;
		}
		warningAlert('Lookup Table rules are invalid');
	});

	const { isLoading: savingLookup, mutateAsync: saveLookup } = useMutation(async () => {
		const formattedRules = formatRules(rules, headerTypes);
		const isValid = await validateLookup(formattedRules, headerTypes);
		if (isValid) {
			const updatedConfiguration = {
				...configuration,
				selectedHeaders,
				selectedAssumptions,
			};
			await saveLookupTable(lookupTableId, {
				rules: formattedRules,
				project: projectId,
				configuration: updatedConfiguration,
			});
			confirmationAlert('Lookup Table rules successfully updated');
			return;
		}
		warningAlert('Validation error with Lookup Table rules');
	});

	const { isLoading: downloadingAssumptions, mutateAsync: downloadAssumptions } = useMutation(async () => {
		const assValues = assumptions;
		const fileName = `project-${project?.name}-assumptions.xlsx`;
		const sheetHeaders = assumptionKeys.map(getAssumptionLabel);
		const rowCount = Math.max(...assumptionKeys.map((key) => assValues[key]?.length || 0));
		const data = [];
		for (let i = 0; i < rowCount; i++) {
			const row = {};
			assumptionKeys.forEach((key) => {
				row[getAssumptionLabel(key)] = assValues[key]?.[i] || '';
			});
			data.push(row);
		}
		const sheets = [{ name: 'Wells', data, header: sheetHeaders }];
		exportXLSX({ sheets, fileName });
	});

	const loading = loadingTable;
	const saving = savingLookup || savingName || validatingLookupTable || downloadingAssumptions;

	return {
		lookupTable,
		loading,
		saving,
		selectedHeaders,
		selectHeaders,
		selectedAssumptions,
		selectAssumptions,
		headerTypes,
		getHeaderLabel,
		getAssumptionLabel,
		saveLookup,
		savingName,
		saveLookupName,
		headerColumns,
		assumptionColumns,
		rules,
		setRules,
		assumptionKeys,
		validateLookupTable: validate,
		downloadAssumptions,
		configuration,
		minRules: lastRule + 1,
		maxRules: MAX_RULES,
		alwaysVisibleHeaders,
	};
}
