import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import React, { useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { AgGridRef } from '@/components/AgGrid';
import { Selection } from '@/components/hooks/useSelection';
import { ButtonItem, MenuButton, Tooltip } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';
import {
	IDeleteAllProductionData,
	IDeleteSelectedProductionData,
	IDeleteWithInputProductionData,
	ROW_ID_SPLITTER,
	deleteProduction,
} from '@/manage-wells/shared/utils';
import { DeleteDialog } from '@/module-list/ModuleList/components';

import RelativeProductionDataDeleteForm from './RelativeProductionDataDeleteForm';

const DELETE_PRODUCTION_DATA_MODES = {
	ALL: 'all',
	SELECTED: 'selected',
	INPUT: 'input',
};

const useDeleteProductionData = (
	resolution: 'daily' | 'monthly',
	wellsSelection: Selection | undefined,
	productionsSelection: Selection,
	agGridRef: React.MutableRefObject<AgGridRef | null>,
	invalidateProductionCount: () => void,
	singleWellView: boolean,
	invalidateMapData: () => void
) => {
	const [deleting, setDeleting] = useState(false);
	const [relativeDeleteVisible, setRelativeDeleteVisible] = useState(false);
	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog);

	const { isDALEnabled } = useLDFeatureFlags();

	const onDeleteSuccess = (deletedCount: number) => {
		setDeleting(false);
		confirmationAlert(
			isDALEnabled
				? 'Production data rows were successfully removed'
				: `Removed ${pluralize(deletedCount, 'production data row', 'production data rows')} successfully`
		);
		invalidateProductionCount();
		productionsSelection.deselectAll();

		if (singleWellView) {
			invalidateMapData();
		}
	};

	const onDeleteError = (error: Error) => {
		setDeleting(false);
		genericErrorAlert(error);
	};

	const deleteAllMutation = useMutation(
		async (deleteNotChosenResolution: boolean) => {
			setDeleting(true);
			const monthly = resolution === 'monthly' ? true : deleteNotChosenResolution ? true : false;
			const daily = resolution === 'daily' ? true : deleteNotChosenResolution ? true : false;

			const body: IDeleteAllProductionData = {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				wells: [...wellsSelection!.selectedSet],
				monthly,
				daily,
			};

			const deletedCount = await deleteProduction(DELETE_PRODUCTION_DATA_MODES.ALL, body);
			return deletedCount;
		},
		{
			onError: onDeleteError,
			onSuccess: onDeleteSuccess,
		}
	);

	const deleteWithInputMutation = useMutation(
		async (body: IDeleteWithInputProductionData) => {
			setDeleting(true);
			setRelativeDeleteVisible(false);

			const deletedCount = await deleteProduction(DELETE_PRODUCTION_DATA_MODES.INPUT, body);
			return deletedCount;
		},
		{
			onError: onDeleteError,
			onSuccess: onDeleteSuccess,
		}
	);

	const deleteSelectedMutation = useMutation(
		async () => {
			setDeleting(true);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const gridApi = agGridRef.current!.api;
			const nodeIds = [...productionsSelection.selectedSet];
			const deletions: {
				[key: string]: number[];
			} = {};

			nodeIds.forEach((id) => {
				const rowData = gridApi.getRowNode(id)?.data;
				const wellId = id.split(ROW_ID_SPLITTER)[0];

				if (rowData) {
					deletions[wellId] = deletions[wellId] || [];
					deletions[wellId].push(rowData.index);
				}
			});

			const body: IDeleteSelectedProductionData = {
				resolution,
				deletions,
			};

			const deletedCount = await deleteProduction(DELETE_PRODUCTION_DATA_MODES.SELECTED, body);
			return deletedCount;
		},
		{
			onError: onDeleteError,
			onSuccess: onDeleteSuccess,
		}
	);

	const handleRemove = (mode) => {
		switch (mode) {
			case DELETE_PRODUCTION_DATA_MODES.ALL: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				const wells = pluralize(wellsSelection!.selectedSet.size, 'well', 'wells');

				promptDeleteDialog({
					onDelete: (deleteNotChosenResolution: boolean) =>
						deleteAllMutation.mutateAsync(deleteNotChosenResolution).then(() => setDeleting(false)),
					awaitAction: false,
					name: `Delete all ${resolution} production data for ${wells}`,
					feat: `all for ${wells}`,
					title: `Delete all ${resolution} production data?`,
					requireName: true,
					extraOption: {
						enabled: true,
						info: `Delete corresponding ${resolution === 'daily' ? 'monthly' : 'daily'} production data`,
					},
				});

				break;
			}

			case DELETE_PRODUCTION_DATA_MODES.SELECTED: {
				const feat = pluralize(productionsSelection.selectedSet.size, 'record', 'records');

				promptDeleteDialog({
					onDelete: () => deleteSelectedMutation.mutateAsync().then(() => setDeleting(false)),
					awaitAction: false,
					name: `Delete ${feat}`,
					feat,
					title: 'Delete production data?',
					requireName: true,
				});

				break;
			}

			case DELETE_PRODUCTION_DATA_MODES.INPUT: {
				setRelativeDeleteVisible(true);
				break;
			}

			default:
				break;
		}
	};

	const deleteOptions = [
		{
			additionalInfo: `Delete production data for ${pluralize(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				wellsSelection!.selectedSet.size,
				'selected well',
				'selected wells'
			)} by Relative Time`,
			disabled: deleting,
			onClick: () => handleRemove(DELETE_PRODUCTION_DATA_MODES.INPUT),
			primaryText: 'Delete by Relative Time',
		},
		{
			additionalInfo: `Delete only selected ${pluralize(
				productionsSelection.selectedSet.size,
				'production data record',
				'production data records'
			)}`,
			disabled: deleting || !productionsSelection.selectedSet.size,
			onClick: () => handleRemove(DELETE_PRODUCTION_DATA_MODES.SELECTED),
			primaryText: 'Delete Selected',
		},
		{
			additionalInfo: `Delete all ${resolution} production data for ${pluralize(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				wellsSelection!.selectedSet.size,
				'selected well',
				'selected wells'
			)}`,
			disabled: deleting,
			onClick: () => handleRemove(DELETE_PRODUCTION_DATA_MODES.ALL),
			primaryText: 'Delete All',
		},
	];

	const deleteFromInputForm = useMemo(() => {
		const wells = wellsSelection?.selectedSet ? [...wellsSelection.selectedSet] : [];

		return (
			<RelativeProductionDataDeleteForm
				visible={relativeDeleteVisible}
				wells={wells}
				onCancel={() => setRelativeDeleteVisible(false)}
				onDelete={(body: IDeleteWithInputProductionData) =>
					deleteWithInputMutation.mutateAsync(body).then(() => setDeleting(false))
				}
			/>
		);
	}, [relativeDeleteVisible, wellsSelection?.selectedSet, deleteWithInputMutation]);

	const deleteMenuButton = (
		<MenuButton
			css='margin-right: 4px; text-transform: unset;'
			label='Delete'
			endIcon={faChevronDown}
			disabled={deleting}
		>
			{deleteOptions.map(({ additionalInfo, disabled, onClick, primaryText }) => (
				<Tooltip placement='bottom' title={disabled ? 'No production records selected' : ''} key={primaryText}>
					<div>
						<ButtonItem
							key={primaryText}
							additionalInfo={additionalInfo}
							disabled={disabled}
							label={primaryText}
							onClick={onClick}
							placeInfoAfter={false}
						/>
					</div>
				</Tooltip>
			))}
		</MenuButton>
	);

	return {
		deleting,
		deleteMenuButton,
		deleteDialogForSelectedOrAll: deleteDialog,
		deleteFromInputForm,
	};
};

export default useDeleteProductionData;
