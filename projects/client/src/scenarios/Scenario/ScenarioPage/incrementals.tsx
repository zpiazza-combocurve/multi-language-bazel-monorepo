import { faChartArea, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import { keyBy } from 'lodash-es';
import { useMemo } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, alerts } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';
import * as api from '@/scenarios/api';

const MAX_SELECTED_ASSIGNMENTS_FOR_INCREMENTAL = 100;

export const CreateIncrementalDialog = ({ resolve, visible, onHide }: DialogProps<boolean>) => {
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xs' fullWidth>
			<DialogTitle>Create Incremental</DialogTitle>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					onClick={() => resolve(true)}
					color='primary'
					{...getTaggingProp('scenario', 'createIncrementals')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const getIncrementalToolTipMessage = (selectedAssignmentIds, selectedIncremental, selectedIncrementalParent) => {
	const anyIncrementalSelected = selectedIncremental.length > 0;
	const tooManyWellsSelected = selectedAssignmentIds.length > MAX_SELECTED_ASSIGNMENTS_FOR_INCREMENTAL;
	const noWellsSelected = selectedAssignmentIds.length === 0;
	const anyIncrementalParentSelected = selectedIncrementalParent.length > 0;

	if (anyIncrementalSelected) {
		return 'Select only parent wells';
	}

	if (anyIncrementalParentSelected) {
		return 'Select only parent wells without incremental';
	}

	if (tooManyWellsSelected) {
		return `Too many wells selected. The limit is ${MAX_SELECTED_ASSIGNMENTS_FOR_INCREMENTAL}`;
	}

	if (noWellsSelected) {
		return 'No wells selected';
	}

	return undefined;
};

const CreateIncrementalButton = ({
	canUpdateScenario,
	selectedAssignmentIds,
	selectedIncremental,
	selectedIncrementalParent,
	showCreateIncremental,
}) => {
	const disabledMessage = getIncrementalToolTipMessage(
		selectedAssignmentIds,
		selectedIncremental,
		selectedIncrementalParent
	);

	return (
		<Button
			disabled={(!canUpdateScenario && PERMISSIONS_TOOLTIP_MESSAGE) || disabledMessage}
			onClick={showCreateIncremental}
			tooltipTitle={canUpdateScenario ? disabledMessage : PERMISSIONS_TOOLTIP_MESSAGE} // TODO: uncomment when daniel finishes adding tooltip to MUI's Button
			startIcon={faChartArea}
		>
			Create Incremental
		</Button>
	);
};

export function useIncrementals({
	allAssignments,
	selectedAssignmentIds,
	canUpdateScenario,
	scenarioId,
	updateAssignments,
}) {
	const allAssignmentsById = useMemo(() => keyBy(allAssignments, '_id'), [allAssignments]);
	const selectedIncremental = useMemo(
		() => selectedAssignmentIds.filter((selectedAssignmentId) => allAssignmentsById[selectedAssignmentId]?.index),
		[selectedAssignmentIds, allAssignmentsById]
	);
	const selectedIncrementalParent = useMemo(() => {
		const parentWellsInc = new Set(allAssignments?.map(({ well, index }) => index && well));
		return selectedAssignmentIds.filter((selectedAssignmentId) =>
			parentWellsInc.has(allAssignmentsById[selectedAssignmentId]?.well)
		);
	}, [selectedAssignmentIds, allAssignments, allAssignmentsById]);
	const onlyIncrementalSelected =
		selectedAssignmentIds.length > 0 && selectedIncremental.length === selectedAssignmentIds.length;

	const onDeleteIncremental = async () => {
		const confirmed = await alerts.confirm({
			title: `Delete ${selectedAssignmentIds.length} incremental?`,
			confirmText: 'Delete',
			confirmColor: 'error',
		});

		if (confirmed) {
			await api.deleteIncremental(scenarioId, selectedAssignmentIds);
			updateAssignments(allAssignments.filter(({ _id }) => !selectedAssignmentIds.includes(_id)));
			confirmationAlert();
		}
	};
	const [createIncrementalDialog, showCreateIncrementalDialog] = useDialog(CreateIncrementalDialog);
	const onCreateIncremental = async () => {
		const createIncremental = await showCreateIncrementalDialog();

		if (createIncremental) {
			const newScenarioWellAssignments = await api.createIncremental(scenarioId, selectedAssignmentIds);
			updateAssignments([...allAssignments, ...newScenarioWellAssignments]);
			confirmationAlert();
		}
	};

	const createIncrementalButton = (
		<CreateIncrementalButton
			canUpdateScenario={canUpdateScenario}
			selectedAssignmentIds={selectedAssignmentIds}
			selectedIncremental={selectedIncremental}
			selectedIncrementalParent={selectedIncrementalParent}
			showCreateIncremental={onCreateIncremental}
		/>
	);

	const deleteIncrementalBtn = (
		<Button color='warning' onClick={onDeleteIncremental} startIcon={faTrash} disabled={!canUpdateScenario}>
			Delete Incremental
		</Button>
	);

	const deleteIncrementalButton = onlyIncrementalSelected && deleteIncrementalBtn;

	return { createIncrementalButton, deleteIncrementalButton, createIncrementalDialog, deleteIncrementalBtn };
}

export default CreateIncrementalDialog;
