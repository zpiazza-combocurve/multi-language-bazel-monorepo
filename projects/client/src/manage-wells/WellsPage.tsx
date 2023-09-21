import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelection } from '@/components/hooks/useSelection';
import SelectedCount from '@/components/misc/SelectedCount';
import { Button, Divider, Paper } from '@/components/v2';
import CreateWellsDialog from '@/create-wells/CreateWellsDialog';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { DialogHandler } from '@/helpers/dialog';
import { Notification, NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { useLightFilterTotalQuery, useLightFilterWellIdsQuery, useLightWellFilter } from '@/well-filter/hooks';
import WellsCollectionsButton from '@/wells-collections/WellsCollectionsButton';

import { TableView } from './WellsPage/TableView';
import CustomColumnsButton from './WellsPage/TableView/CollectionTable/CustomColumnsButton';
import { WellsPageContext } from './shared/WellsPageContext';
import { WellsPageBaseProps } from './shared/types';

export { WellsPageContext };

export interface WellsPageProps extends WellsPageBaseProps {
	viewWell?: (wellId: string) => void;
	isWellsCollectionWells?: boolean;
}

export function WellsPage({
	wellIds,
	padded,
	companyOnly,
	addWellsProps,
	createWellsProps,
	removeWellsProps,
	operations: _operations,
	operationsProps,
	wellsCollectionsProps,
	viewWell,
	isWellsCollectionWells = false,
	manageWellsCollections = false,
	addRemoveWellsCollectionWells = false,
}: WellsPageProps) {
	const { project } = useCurrentProject();
	const [totalWells, setTotalWells] = useState(0);
	const [editingWells, setEditingWells] = useState(false);

	const { isWellsCollectionsEnabled: wellsCollectionsFeatureEnabled } = useLDFeatureFlags();

	const { filter, filtered, reset, filters, getWellIds, setFilters } = useLightWellFilter({
		wells: wellIds,
		companyOnly,
	});

	const hasInitialFilterInformation = wellIds && !filtered; // doesn't need to fetch initial data info if has wells and is not filtered
	const wellIdsQuery = useLightFilterWellIdsQuery(
		{ filters, companyOnly },
		{ enabled: !hasInitialFilterInformation }
	);

	const totalQuery = useLightFilterTotalQuery({ filters, companyOnly }, { enabled: !hasInitialFilterInformation });

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const filteredWellIds = hasInitialFilterInformation ? wellIds! : wellIdsQuery.data;

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const totalWellCount = hasInitialFilterInformation ? wellIds!.length : totalQuery.data;
		setTotalWells(totalWellCount || 0);
	}, [wellIds, hasInitialFilterInformation, totalQuery]);

	const selection = useSelection(filteredWellIds);
	const nodeIdsSelection = useSelection(selection.all);

	// HACK: it is done in this way to not break the existing logic which depends on the selection and include only
	// the wells that are existing in the module
	const selectedCount = useMemo(() => {
		const topLevelAllSelection = [...selection.all];
		return [...selection.selectedSet].filter(
			(id) => topLevelAllSelection.includes(id) && nodeIdsSelection.isSelected(id)
		).length;
	}, [nodeIdsSelection, selection.all, selection.selectedSet]);

	const wellsActionNotificationCallback = useCallback(
		async (notification: Notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				const total = await totalQuery.refetch();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				const totalWellCount = hasInitialFilterInformation ? wellIds!.length : total.data;
				setTotalWells(totalWellCount || 0);
			}
		},
		[totalQuery, hasInitialFilterInformation, wellIds]
	);

	useUserNotificationCallback(NotificationType.DELETE_WELLS, wellsActionNotificationCallback);
	useUserNotificationCallback(NotificationType.CREATE_WELLS, wellsActionNotificationCallback);

	return (
		<WellsPageContext.Provider
			// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
			value={{
				wellIds: filteredWellIds,
				getWellIds,
				allWellCount: totalWells,
				selection,
				nodeIdsSelection,
				filters,
				companyOnly: !!companyOnly,
				editingWells,
				setEditingWells,
			}}
		>
			<div
				css={`
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
					gap: 1rem;
					${padded &&
					`
					margin: 1rem;
					height: calc(100% - 2rem);
					width: calc(100% - 2rem);
					 `}
				`}
			>
				{!isWellsCollectionWells && (
					<Paper
						css={`
							padding: 0.5rem;
							display: flex;
							gap: 1rem;
							align-items: center;
							background-color: var(--background-opaque);
						`}
					>
						<SelectedCount count={selectedCount} total={totalWells ?? 0} />
						<Divider orientation='vertical' flexItem />
						<WellFilterButton
							wellsPage
							wellIds={filteredWellIds}
							onFilterWells={filter}
							onQuickFilter={setFilters}
							disableQuickFilter={companyOnly}
							returnFilter
						/>
						{filtered && (
							<Button css='text-transform: unset;' onClick={reset}>
								Reset Filter
							</Button>
						)}
						<Divider orientation='vertical' flexItem />
						{addWellsProps && (
							<Button
								css='text-transform: unset;'
								onClick={async () => addWellsProps.onAdd(await getWellIds())}
								disabled={addWellsProps.disabled}
								{...addWellsProps.restButtonProps}
							>
								Add Wells
							</Button>
						)}
						{createWellsProps && (
							<DialogHandler dialog={CreateWellsDialog}>
								{(openCreateWellsDialog) => (
									<Button
										css='text-transform: unset;'
										onClick={() =>
											openCreateWellsDialog({ projectId: companyOnly ? undefined : project?._id })
										}
										disabled={createWellsProps.disabled}
										{...createWellsProps.restButtonProps}
									>
										Create Wells
									</Button>
								)}
							</DialogHandler>
						)}
						{removeWellsProps && (
							<Button
								css='text-transform: unset;'
								onClick={() =>
									removeWellsProps.onRemove([...selection.selectedSet], getWellIds, totalWells)
								}
								tooltipTitle={removeWellsProps.getTooltipTitle?.([...selection.selectedSet])}
								disabled={removeWellsProps.disabled?.([...selection.selectedSet], totalWells)}
								{...removeWellsProps.restButtonProps}
							>
								Remove Wells
							</Button>
						)}
						{viewWell &&
							(wellsCollectionsFeatureEnabled ? (
								<Button
									css='text-transform: unset;'
									onClick={() => viewWell(selection.selectedSet.values().next().value)}
									tooltipTitle='View header and production information of a single well or a wells collection'
									disabled={selection.selectedSet.size !== 1}
								>
									View
								</Button>
							) : (
								<Button
									css='text-transform: unset;'
									onClick={() => viewWell(selection.selectedSet.values().next().value)}
									tooltipTitle='View headers and production info of a single well'
									disabled={selection.selectedSet.size !== 1}
								>
									View Well
								</Button>
							))}

						{_operations ? (
							<_operations getWellIds={getWellIds} selection={selection} {...(operationsProps ?? {})} />
						) : null}
						{manageWellsCollections && wellsCollectionsProps && (
							<WellsCollectionsButton
								{...wellsCollectionsProps}
								idsSelection={selection}
								nodeIdsSelection={nodeIdsSelection}
							/>
						)}
						{!companyOnly && project && <CustomColumnsButton projectId={project._id} />}
					</Paper>
				)}
				<TableView
					css='flex: 1;'
					manageWellsCollections={wellsCollectionsFeatureEnabled && manageWellsCollections}
					addRemoveWellsCollectionWells={wellsCollectionsFeatureEnabled && addRemoveWellsCollectionWells}
					isWellsCollectionWells={isWellsCollectionWells}
				/>
			</div>
		</WellsPageContext.Provider>
	);
}
