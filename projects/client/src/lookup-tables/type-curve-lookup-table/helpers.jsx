import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { confirmationAlert, warningAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useWellHeaders } from '@/helpers/headers';
import { exportXLSX } from '@/helpers/xlsx';
import { getHeadersValues } from '@/lookup-tables/scenario-lookup-table/api';
import { CHOICE, FIXED_DATE, FIXED_NUMBER } from '@/lookup-tables/shared/constants';
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
import {
	getAssignmentValues,
	getHeaderTypes,
	saveLookupTable,
	useLookupTable as useLookupTableApi,
	validateLookupTable,
} from '@/lookup-tables/type-curve-lookup-table/api';
import { useSelectedHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';

const riskFactorTooltip = 'Applied Risk Factor is in Decimals';

const TOOLTIPS = {
	riskFactorOil: riskFactorTooltip,
	riskFactorWater: riskFactorTooltip,
	riskFactorGas: riskFactorTooltip,
};

export const INITIAL_ASSIGNMENTS = [
	'typeCurve',
	'riskFactorOil',
	'riskFactorGas',
	'riskFactorWater',
	'fpdSource',
	'fixedDateIdx',
	'applyNormalization',
];
export const INITIAL_HEADERS = ['type_curve_area', 'perf_lateral_length', 'first_prod_date'];

const ASSIGNMENTS = {
	typeCurve: 'Type Curve',
	phase: 'Phase',
	resolution: 'Resolution',
	applyNormalization: 'Apply Normalization',
	applySeries: 'Apply Series',
	riskFactorOil: 'Risk Factor Oil',
	riskFactorWater: 'Risk Factor Water',
	riskFactorGas: 'Risk Factor Gas',
	fpdSource: 'FPD Source',
	fixedDateIdx: 'Fixed Date',
};

const ASSIGNMENT_CUSTOM_TYPES = {
	riskFactorOil: FIXED_NUMBER,
	riskFactorGas: FIXED_NUMBER,
	riskFactorWater: FIXED_NUMBER,
	fixedDateIdx: FIXED_DATE,
};

export function useLookupTable(lookupTableId) {
	const {
		loading: loadingTable,
		lookupTable,
		refresh,
	} = useLookupTableApi(lookupTableId, { suspense: true, useErrorBoundary: true });

	const { wellHeaders, project } = useAlfa();

	const pchs = usePCHsForLT(project?._id);

	const { wellHeadersLabels: _wellHeadersLabels } = useWellHeaders({
		enableProjectCustomHeaders: false,
		enableScopeHeader: false,
	});

	const { data: _headerTypes } = useQuery(['forecast-lookup-table', 'header-types', lookupTableId], () =>
		getHeaderTypes()
	);

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

	const assignmentKeys = Object.keys(ASSIGNMENTS);

	const getAssignmentLabel = useCallback((key) => ASSIGNMENTS[key], []);

	// TODO merge with saveLookup
	const { isLoading: savingName, mutateAsync: saveLookupName } = useMutation(async (body) => {
		await saveLookupTable(lookupTableId, body);
		confirmationAlert('Lookup Table successfully updated');
		refresh();
	});

	const getType = useCallback((key) => ASSIGNMENT_CUSTOM_TYPES[key] ?? CHOICE, []);

	const { configuration } = lookupTable || {};

	const lookupRules = lookupTable?.rules;

	const mappedRules = useMemo(() => mapRules(lookupRules, headerTypes), [lookupRules, headerTypes]);
	const [rules, setRules] = useDerivedState(mappedRules);

	const alwaysVisibleHeaders = useMemo(() => getUsedKeysFromRules(rules), [rules]);

	const [selectedHeaders, selectHeaders] = useSelectedHeaders({
		initialHeaders: configuration?.selectedHeaders?.length ? configuration.selectedHeaders : INITIAL_HEADERS,
		allHeaders: selectableHeaders,
		getLabel: getHeaderLabel,
		maxHeaders: selectableHeaders?.length,
		alwaysVisibleHeaders,
		projectCustomHeadersKeys: pchKeys,
	});

	const [selectedAssignments, selectAssignments] = useSelectedHeaders({
		title: 'Search',
		initialHeaders: INITIAL_ASSIGNMENTS,
		allHeaders: assignmentKeys,
		getLabel: getAssignmentLabel,
		maxHeaders: assignmentKeys?.length,
		alwaysVisibleHeaders,
	});

	const projectId = project?._id;

	const { data: assignments } = useQuery(
		['forecast-lookup-table', 'assignments', lookupTableId],
		() =>
			getAssignmentValues({ projectId }).then((values) => {
				const assignmentsValues = {};
				Object.keys(values).forEach((key) => {
					assignmentsValues[key] = values[key]?.map(({ name }) => name);
				});
				return assignmentsValues;
			}),
		{
			enabled: !!projectId,
		}
	);

	const { data: headers } = useQuery(
		['forecast-lookup-table', 'headers', lookupTableId, ...selectedHeaders],
		() => getHeadersValues(selectedHeaders, projectId),
		{
			enabled: !!projectId,
		}
	);

	const headerColumns = useLookupColumnHeaders(selectedHeaders, headerTypes, headers, getHeaderLabel);
	const assignmentColumns = useLookupColumnAssignments(
		selectedAssignments,
		assignments,
		getAssignmentLabel,
		getType,
		TOOLTIPS
	);

	const lastRule = useMemo(() => rules.reduce((acc, rule, index) => (isEmpty(rule) ? acc : index), 0), [rules]);

	const validateLookup = useCallback(
		async (formattedRules) => {
			const isValid = validateRules(formattedRules, headerTypes, getType);
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
		[projectId, headerTypes, getType]
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
				selectedAssumptions: selectedAssignments,
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
		const assValues = assignments;
		const fileName = `project-${project?.name}-assignments.xlsx`;
		const assumptionKeys = [
			'typeCurve',
			'riskFactorOil',
			'riskFactorGas',
			'riskFactorWater',
			'fpdSource',
			'applyNormalization',
		];
		const assignmentMap = {
			typeCurve: 'Type Curve',
			riskFactorOil: 'Risk Factor Oil',
			riskFactorGas: 'Risk Factor Gas',
			riskFactorWater: 'Risk Factor Water',
			fpdSource: 'FPD Source',
			fixedDateIdx: 'Fixed Date',
			applyNormalization: 'Apply Normalization',
		};
		const rowCount = Math.max(...assumptionKeys.map((key) => assValues[key]?.length || 0));
		const data = [];
		for (let i = 0; i < rowCount; i++) {
			const row = {};
			assumptionKeys.forEach((key) => {
				row[assignmentMap[key]] = assValues[key]?.[i] || '';
			});
			data.push(row);
		}
		const sheets = [{ name: 'Wells', data, header: Object.values(assignmentMap) }];
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
		selectedAssignments,
		selectAssignments,
		headerTypes,
		getHeaderLabel,
		getAssignmentLabel,
		saveLookup,
		savingName,
		saveLookupName,
		headerColumns,
		assignmentColumns,
		rules,
		setRules,
		assignmentKeys,
		downloadAssumptions,
		validateLookupTable: validate,
		minRules: lastRule + 1,
		maxRules: MAX_RULES,
	};
}
