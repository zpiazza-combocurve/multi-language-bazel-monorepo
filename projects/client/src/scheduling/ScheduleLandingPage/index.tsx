import { faTimes, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Placeholder } from '@/components';
import { AgGridSSRMRef } from '@/components/AgGrid.ssrm';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useHotkeyScope } from '@/components/hooks';
import { IconButton } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { ActivityStep } from '@/inpt-shared/scheduling/shared';
import { CardsLayout } from '@/layouts/CardsLayout';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { URLS } from '@/urls';

import CacheContext from '../ScheduleCacheContext';
import { Card } from '../components/Card';
import { Layout } from '../components/Layout';
import { useFilteredWells } from '../hooks/useFilteredWells';
import { invalidateSchedule } from '../shared';
import { WELL_HEADER_COLUMNS_WITH_ORDER } from '../shared/columns';
import { LookupTableBuilder } from './LookupTable';
import { ScheduleLookupTableContext, ScheduleLookupTableProvider } from './LookupTable/ScheduleLookupTableContext';
import { ScheduleSettingTable } from './Settings';
import { SettingsDialog } from './Settings/SettingsDialog';
import { Toolbar } from './Toolbar/index';
import { MemoizedWellTableGrid } from './WellTable';
import { AssignmentsApi } from './WellTable/api/AssignmentsApi';
import { SelectionProvider } from './WellTable/hooks/useWellTableSelection';
import { Chip } from './components/Chip';
import { useScheduleSettings } from './hooks/useScheduleSettings';
import { useScheduleSettingsForm } from './hooks/useScheduleSettingsForm';
import { SCOPES } from './shared/hotkeys';

const SCHEDULE_FILTERS_STORAGE_KEY = 'SCHEDULE_FILTERS_STORAGE_KEY';

const BottomCard = ({ scheduleSettings, isDraft, hasCyclicSteps, setIsSettingsDialogOpen, setHotkeyScope }) => {
	const { isBuilderOpen, setIsBuilderOpen } = useContext(ScheduleLookupTableContext);

	if (isBuilderOpen)
		return (
			<Card
				title='Scheduling Look-Up Table'
				rightHeader={
					<IconButton
						onClick={() => {
							setIsBuilderOpen(false);
						}}
						size='small'
						iconSize='small'
					>
						{faTimes}
					</IconButton>
				}
				forceHideToggleButton
			>
				<LookupTableBuilder hasCyclicSteps={hasCyclicSteps} />
			</Card>
		);

	return (
		<Card
			title='Configurations'
			rightHeader={
				<>
					<Chip name={scheduleSettings.settingData?.name} isDraft={isDraft} />
					<IconButton
						css={{ marginRight: '0.5rem' }}
						onClick={() => setIsSettingsDialogOpen(true)}
						size='small'
						iconSize='small'
					>
						{faUserCog}
					</IconButton>
				</>
			}
		>
			<ScheduleSettingTable setHotkeyScope={setHotkeyScope} hasCyclicSteps={hasCyclicSteps} />
		</Card>
	);
};

export const ScheduleLandingPage = ({ scheduleId, scheduleQuery, constructionQuery }) => {
	const agGridRef = useRef<AgGridSSRMRef>(null);
	const { clearCache } = useContext(CacheContext);

	const { project } = useAlfa();
	const projectId = project?._id as Inpt.ObjectId;

	const { data: schedule, isLoading: loading } = scheduleQuery;
	const reload = useCallback(() => invalidateSchedule(scheduleId), [scheduleId]);

	const settingId = schedule?.setting?._id as Inpt.ObjectId;
	const scheduleName = schedule?.name;

	const scheduleSettings = useScheduleSettings({
		currentSettingId: settingId,
		projectId,
		scheduleId,
	});

	const construction = constructionQuery.data;
	const startProgram = construction?.scheduleSettings?.startProgram;

	const { methods, hasCyclicSteps, unassignedSteps, stepsWithResourceInactive, isDraft } = useScheduleSettingsForm({
		settingName: `${scheduleName || 'Schedule'} Config`,
		settingData: scheduleSettings.settingData,
		startProgram,
	});
	const {
		formState: { errors },
		getValues,
	} = methods;

	const { canUpdate: canUpdateSchedule } = usePermissions(SUBJECTS.Schedules, projectId);

	const wellIds: string[] = useMemo(() => schedule?.wells ?? [], [schedule?.wells]);

	const [isRunning, setRunning] = useState(false);

	useEffect(() => {
		setRunning(construction ? construction.run.status === 'running' : false);
	}, [construction]);

	const updateAssignments = useCallback(
		(wellIds?: string[], headers?: string[]) => {
			agGridRef.current?.invalidateRows(wellIds, headers);
		},
		[agGridRef]
	);

	const reloadSchedule = useCallback(
		async (settings = false) => {
			if (settings) {
				await scheduleSettings.refetchSetting();
				clearCache();
			}

			reload();
		},
		[reload, clearCache, scheduleSettings]
	);

	const navigate = useNavigate();

	const notificationCallback = useCallback(
		async (notification) => {
			setRunning(notification.status === TaskStatus.QUEUED || notification.status === TaskStatus.RUNNING);
			if (notification.status === TaskStatus.COMPLETED && project?._id) {
				reload();
				navigate(URLS.project(project._id).schedule(scheduleId).output);
			}
		},
		[project?._id, reload, navigate, scheduleId]
	);

	useUserNotificationCallback(NotificationType.SCHEDULE_RUN, notificationCallback);

	const getUnassignedStepsMessage = (unassignedSteps: ActivityStep[]) => {
		const stepNames = unassignedSteps.map((step) => step.name).join(', ');
		return `No resource assigned for ${stepNames}.`;
	};

	const getStepsWithResourceInactiveMessage = (stepsWithResourceInactive: ActivityStep[]) => {
		const stepNames = stepsWithResourceInactive.map((step) => step.name).join(', ');
		return `${stepNames} require(s) resources but there is no resource active for it.`;
	};

	const errorsLength = Object.keys(errors).length;
	const { activitySteps } = getValues();
	const disabledMessage = (() => {
		if (!canUpdateSchedule) return PERMISSIONS_TOOLTIP_MESSAGE;
		if (isRunning) return 'Schedule Running';
		if (loading) return 'Loading settings.';
		if (errors && errorsLength > 0)
			return Object.values(errors)
				.map(({ message }) => message)
				.join('.');
		if (hasCyclicSteps) return 'Please ensure Activity Steps contains no cycles.';
		if (unassignedSteps.length) return getUnassignedStepsMessage(unassignedSteps);
		if (stepsWithResourceInactive.length) return getStepsWithResourceInactiveMessage(stepsWithResourceInactive);
		if (activitySteps.length === 0) return 'Must have at least one activity step.';
	})();

	const [hotkeyScope, setHotkeyScope] = useState(SCOPES.wellTable);
	useHotkeyScope(hotkeyScope);

	const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

	const { filters, setHeaderFilters, filteredWellIds } = useFilteredWells(
		scheduleId,
		wellIds,
		SCHEDULE_FILTERS_STORAGE_KEY
	);

	const [currentSort, setCurrentSort] = useState<{ field: string; direction: 'desc' | 'asc' }>({
		field: 'priority',
		direction: 'asc',
	});

	const [sortedWellIds, setSortedWellIds] = useState<string[]>(wellIds);
	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);

	const fetchIds = useCallback(
		async (wellIds) => {
			setSortedWellIds([]);
			const data = await assignmentsApi.getIds({ wellIds, sort: currentSort });
			setSortedWellIds(data);
		},
		[assignmentsApi, currentSort]
	);

	useEffect(() => {
		fetchIds(wellIds);
	}, [currentSort, fetchIds, wellIds]);

	const sortedFilteredWells = useMemo(() => {
		const idsSet = new Set(filteredWellIds);

		return sortedWellIds.filter((well) => idsSet.has(well));
	}, [filteredWellIds, sortedWellIds]);

	return (
		<ErrorBoundary>
			<Layout>
				<FormProvider {...methods}>
					<Placeholder loading={scheduleSettings.loading}>
						<SettingsDialog
							visible={isSettingsDialogOpen}
							onHide={() => {
								setIsSettingsDialogOpen(false);
							}}
							projectId={projectId}
							scheduleId={scheduleId}
							settingId={schedule?.setting?._id}
							reload={reloadSchedule}
							methods={methods}
							disabledMessage={disabledMessage}
							isDraft={isDraft}
						/>
						<SelectionProvider ids={sortedFilteredWells}>
							<Toolbar
								schedule={schedule}
								updateAssignments={updateAssignments}
								wellIds={wellIds}
								disabledMessage={disabledMessage}
								methods={methods}
								canUpdateSchedule={canUpdateSchedule}
								setCurrentSort={setCurrentSort}
							/>
							<CardsLayout halfHeight inverted count={2}>
								<Card title='Wells in Schedule'>
									<div
										css={`
											height: 100%;
										`}
										onClick={() => setHotkeyScope(SCOPES.wellTable)}
									>
										<MemoizedWellTableGrid
											agGridRef={agGridRef}
											updateAssignments={updateAssignments}
											reloadSchedule={reloadSchedule}
											projectId={projectId}
											scheduleId={scheduleId}
											columns={WELL_HEADER_COLUMNS_WITH_ORDER}
											wellIds={sortedFilteredWells}
											assumptions={schedule?.assumptions}
											canUpdateSchedule={canUpdateSchedule}
											filters={filters}
											setHeaderFilters={setHeaderFilters}
											currentSort={currentSort}
											setCurrentSort={setCurrentSort}
										/>
									</div>
								</Card>
								<ScheduleLookupTableProvider>
									<BottomCard
										scheduleSettings={scheduleSettings}
										isDraft={isDraft}
										hasCyclicSteps={hasCyclicSteps}
										setIsSettingsDialogOpen={setIsSettingsDialogOpen}
										setHotkeyScope={setHotkeyScope}
									/>
								</ScheduleLookupTableProvider>
							</CardsLayout>
						</SelectionProvider>
					</Placeholder>
				</FormProvider>
			</Layout>
		</ErrorBoundary>
	);
};
