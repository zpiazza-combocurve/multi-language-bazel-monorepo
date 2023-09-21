import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SetNameDialog } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { getWellHeaders, useWellHeaders } from '@/helpers/headers';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as types } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { getAssumptionLabel } from '@/scenarios/shared';

import { ManageSortingsDialog } from './WellSort/ManageSortingsDialog';
import { WellSortingButton, WellSortingDialog, api } from './WellSort/index';

const HEADERS_WITH_CHIPS = ['prms_reserves_category', 'prms_reserves_sub_category'];

export function useWellColumns(excludeFieldCriteria?) {
	const columns = useMemo(
		() =>
			_.transform(
				getWellHeaders(),
				(acc, label, field) => {
					if (excludeFieldCriteria?.(field)) {
						return;
					}

					acc[field] = {
						label,
						type: types[field].type,
					};
					if (HEADERS_WITH_CHIPS.includes(field)) {
						acc[field].headerType = 'well_header';
					}
				},
				{}
			),
		[excludeFieldCriteria]
	);

	return columns;
}

export function useProjectWellColumns() {
	const { projectCustomHeadersKeys, wellHeadersLabels, wellHeadersTypes } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});

	const columns = useMemo(
		() =>
			_.reduce(
				projectCustomHeadersKeys,
				(obj, key) => {
					obj[key] = { label: wellHeadersLabels[key], type: wellHeadersTypes[key].type };
					return obj;
				},
				{}
			),
		[projectCustomHeadersKeys, wellHeadersLabels, wellHeadersTypes]
	);

	return columns;
}

export function useWellSort({
	columns,
	currentSorting,
	getSorting,
	onApplySorting,
	onDeleteSorting,
	onEditSorting,
	onSort,
	onSortSave,
	onUpdateDefaultSorting,
	sortList,
	usesGrouping = false,
	...theme
}) {
	const { project } = useAlfa();

	assert(project, 'Expected project to be in context');

	const [saveWellSortingDialog, promptSaveSortingDialog] = useDialog(SetNameDialog);
	const [wellSortingDialog, promptSortingDialog] = useDialog(WellSortingDialog);
	const [manageSortingsVisible, setManageSortingsVisible] = useState(false);

	const saveSortings = useCallback(async () => {
		const name = await promptSaveSortingDialog({ label: 'Sort' });
		if (name) {
			onSortSave(name);
		}
	}, [onSortSave, promptSaveSortingDialog]);

	const changeOrUpdateSorting = useCallback(
		async (sortingToUpdate?) => {
			const sortedColumns = sortingToUpdate?.fields || currentSorting;

			const config = await promptSortingDialog({
				sortedColumns,
				columns,
				usesGrouping,
				editSortingName: sortingToUpdate?.name,
			});

			if (config) {
				if (sortingToUpdate) {
					onEditSorting(sortingToUpdate._id, { name: sortingToUpdate.name, fields: config });
				} else {
					onSort(config);
				}
			}
		},
		[columns, currentSorting, onEditSorting, onSort, promptSortingDialog, usesGrouping]
	);

	const onRequestEditSorting = useCallback(
		async (id) => {
			const sorting = await getSorting(id);
			changeOrUpdateSorting(sorting);
		},
		[changeOrUpdateSorting, getSorting]
	);

	const manageSortingsDialogRender = useMemo(
		() => (
			<ManageSortingsDialog
				visible={manageSortingsVisible}
				onClose={() => setManageSortingsVisible(false)}
				sortings={sortList}
				onEdit={onRequestEditSorting}
				onDelete={onDeleteSorting}
				onSetDefault={onUpdateDefaultSorting}
				projectId={project._id}
			/>
		),
		[manageSortingsVisible, onDeleteSorting, onRequestEditSorting, onUpdateDefaultSorting, project._id, sortList]
	);

	const wellSortingButtonRender = useMemo(
		() => (
			<WellSortingButton
				sortList={sortList}
				onChangeOrUpdateSorting={changeOrUpdateSorting}
				onSortSave={saveSortings}
				onManageSortings={() => setManageSortingsVisible(true)}
				onApplySorting={onApplySorting}
				onSortDelete={onDeleteSorting}
				{...theme}
			/>
		),
		[changeOrUpdateSorting, onApplySorting, onDeleteSorting, saveSortings, sortList, theme]
	);

	return {
		manageSortingsDialogRender,
		manageSortingsVisible,
		onRequestEditSorting,
		saveSortings,
		saveWellSortingDialog,
		setManageSortingsVisible,
		wellSortingButtonRender,
		wellSortingDialog,
	};
}

export function WellSort(props) {
	const { wellSortingDialog, saveWellSortingDialog, manageSortingsDialogRender, wellSortingButtonRender } =
		useWellSort(props);

	return (
		<>
			{wellSortingDialog}
			{saveWellSortingDialog}
			{manageSortingsDialogRender}
			{wellSortingButtonRender}
		</>
	);
}

const NO_SORTING = [];

export function useHeadersSort({ onSorted, currentSorting }) {
	const {
		project: { _id: projectId } = {},
		user: { _id: userId },
	} = useAlfa();
	const [_currentSorting, setCurrentSorting] = useDerivedState(currentSorting);
	const [defaultSortingApplied, setDefaultSortingApplied] = useState(false);

	const onWellsSorted = useCallback(
		(sortings) => {
			setCurrentSorting(sortings);
			onSorted?.(sortings);
		},
		[onSorted, setCurrentSorting]
	);

	const { sortings, onSortSave, onSortGet, onSortDelete, onSortUpdate, onUpdateDefaultSorting, isLoading } =
		api.useSortings(projectId);

	const getSorting = useCallback(
		(id) => {
			return onSortGet(id);
		},
		[onSortGet]
	);

	const applySorting = useCallback(
		async (id) => {
			const sorting = await getSorting(id);
			onWellsSorted(sorting.fields);
		},
		[getSorting, onWellsSorted]
	);

	useEffect(() => {
		if (!isLoading && sortings?.length > 0 && !defaultSortingApplied) {
			const defaultSorting = sortings.find((s) => s.isDefault);

			if (defaultSorting) {
				applySorting(defaultSorting._id);
			}

			setDefaultSortingApplied(true);
		}
	}, [applySorting, defaultSortingApplied, isLoading, sortings]);

	const saveSort = async (name) => {
		try {
			await onSortSave({
				name,
				fields: _currentSorting,
				createdBy: userId,
				project: projectId,
			});
			confirmationAlert(`Sorting "${name}" successfully saved`);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const deleteSorting = async ({ id, label }) => {
		await onSortDelete(id);
		confirmationAlert(`Sorting "${label}" successfully deleted`);
	};

	const updateSorting = async (id, model) => {
		await onSortUpdate(id, model);
		confirmationAlert(`Sorting "${model.name}" successfully updated`);
	};

	const updateDefaultSorting = async ({ id, label }, remove) => {
		await onUpdateDefaultSorting(id, remove);
		confirmationAlert(`Sorting "${label}" ${remove ? 'is not default anymore' : 'set as default'}`);
	};

	return {
		currentSorting: _currentSorting,
		onSort: onWellsSorted,
		onSortSave: saveSort,
		onApplySorting: applySorting,
		onDeleteSorting: deleteSorting,
		onEditSorting: updateSorting,
		onUpdateDefaultSorting: updateDefaultSorting,
		getSorting,
		sortList: sortings?.map(({ _id, name, isDefault }) => ({ id: _id, label: name, isDefault })) || [],
	};
}

export function WellHeadersSort({ onSorted, currentSorting = NO_SORTING, ...rest }) {
	const props = useHeadersSort({ onSorted, currentSorting });
	const columns = useWellColumns();

	return <WellSort {...props} columns={columns} {...rest} />;
}

// const excludedAssumptions = ['forecast', 'schedule'];
// const assumptionColumns = allAssumptionKeys
// 	.filter((key) => !excludedAssumptions.includes(key))
// 	.reduce((acc, key) => {
// 		acc[key] = {
// 			label: getAssumptionLabel(key),
// 			type: 'string',
// 		};
// 		return acc;
// 	}, {});

const assumptionColumns = {
	[AssumptionKey.reservesCategory]: {
		label: getAssumptionLabel(AssumptionKey.reservesCategory),
		type: 'string',
		headerType: 'assigned_model',
	},
};

export function ScenarioHeadersSort({ onSorted, currentSorting = NO_SORTING, ...rest }) {
	const props = useHeadersSort({ onSorted, currentSorting });
	const wellColumns = useWellColumns();
	const columns = useMemo(
		() => ({
			...assumptionColumns,
			...wellColumns,
		}),
		[wellColumns]
	);
	return <WellSort {...props} columns={columns} {...rest} />;
}
