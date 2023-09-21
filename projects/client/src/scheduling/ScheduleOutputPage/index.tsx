import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, usePermissionsBuilder } from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { AgGridRef } from '@/components/AgGrid';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button, IconButton } from '@/components/v2';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { formatIdx } from '@/helpers/utilities';
import { exportXLSX } from '@/helpers/xlsx';
import { CardsLayout } from '@/layouts/CardsLayout';

import { Card } from '../components/Card';
import { Layout } from '../components/Layout';
import { useFilteredWells } from '../hooks/useFilteredWells';
import { WELL_HEADER_COLUMNS_WITH_ORDER } from '../shared/columns';
import { GraphCard } from './ScheduleOutputGraphs/components/GraphCard';
import ScheduleOutputTable from './ScheduleOutputTable';
import { EditTableModifiedValues } from './ScheduleOutputTable/EditTableModifiedValues';
import { getWellOutputs } from './api';

const SCHEDULE_OUTPUT_FILTERS_STORAGE_KEY = 'SCHEDULE_OUTPUT_FILTERS_STORAGE_KEY';

const HEADER_COLUMNS_BY_KEY = _.keyBy(WELL_HEADER_COLUMNS_WITH_ORDER, 'key');

export type Validation = { message: string; affectedDates: { [key: string]: number } };

export default function ScheduleOutputPage({ scheduleId, scheduleQuery, constructionQuery }) {
	const [editing, setEditing] = useState(false);
	const [hasModifiedData, setHasModifiedData] = useState(false);
	const [refetchGraphs, setRefetchGraphs] = useState(false);

	const agGridRef = useRef<AgGridRef>(null);
	const modifiedRowsRef = useRef<EditTableModifiedValues>(new EditTableModifiedValues());

	const { data: schedule } = scheduleQuery;

	const { filters, setHeaderFilters, filteredWellIds } = useFilteredWells(
		scheduleId,
		schedule?.wells,
		SCHEDULE_OUTPUT_FILTERS_STORAGE_KEY
	);

	const canUpdateSchedule = usePermissionsBuilder(SUBJECTS.Schedules).canUpdate(schedule);

	const handleDownload = useCallback(async () => {
		const fileName = `Schedule-Wells.xlsx`;

		const { wells } = await getWellOutputs(scheduleId, schedule?.wells ?? []);

		const sheets = [
			{
				name: 'Wells',
				data: wells.map(({ well, output }) => {
					const { events, FPD } = output;
					const orderedEvents = _.orderBy(events, 'activityStepIdx');
					const row = {};

					orderedEvents.forEach((event) => {
						const { activityStepName: stepName, mob, work, demob, resourceName } = event;
						const { start: mobStart, end: mobEnd } = mob;
						const { start: workStart, end: workEnd } = work;
						const { start: demobStart, end: demobEnd } = demob;

						row[`${stepName} Mob Start`] = formatIdx(mobStart);
						row[`${stepName} Mob End`] = formatIdx(mobEnd);

						row[`${stepName} Work Start`] = formatIdx(workStart);
						row[`${stepName} Work End`] = formatIdx(workEnd);

						row[`${stepName} Demob Start`] = formatIdx(demobStart);
						row[`${stepName} Demob End`] = formatIdx(demobEnd);

						row[`${stepName} Resource`] = resourceName;
					});

					row['First Production Date'] = formatIdx(FPD);
					row['First Prod Year'] = FPD === null ? 'N/A' : convertIdxToDate(FPD).getFullYear();

					Object.keys(well).forEach((header) => {
						row[HEADER_COLUMNS_BY_KEY[header]?.title ?? header] = well[header];
					});

					return row;
				}),
				header: [...WELL_HEADER_COLUMNS_WITH_ORDER.map(({ title }) => title)],
			},
		];

		exportXLSX({ sheets, fileName });
	}, [scheduleId, schedule?.wells]);

	const handleToggleEditing = () => {
		setEditing((p) => !p);
		setHasModifiedData(false);
		modifiedRowsRef.current = new EditTableModifiedValues();
		agGridRef.current?.api.refreshCells();
	};

	const saveMutation = useMutation(
		async () => {
			const outputs = modifiedRowsRef.current?.getModifiedData();
			await postApi(`/schedules/${scheduleId}/outputs`, { outputs });
		},
		{
			onError: (error: Error) => {
				const messages = error.message.split(',');
				messages.forEach((message) => failureAlert(message, 10000));
			},
			onSuccess: () => {
				modifiedRowsRef.current = new EditTableModifiedValues();
				setHasModifiedData(false);
				confirmationAlert('Saved!');
				agGridRef.current?.api.refreshServerSideStore({ purge: true });
				setRefetchGraphs(true);
			},
		}
	);

	const handleSave = () => saveMutation.mutateAsync().then(() => setEditing(false));

	return (
		<ErrorBoundary>
			<Layout>
				<CardsLayout>
					<Card
						title='Output'
						fullWidth
						leftHeader={
							<>
								<Button
									css={`
										margin-right: 0.5rem;
										text-transform: unset;
									`}
									onClick={handleToggleEditing}
									disabled={!canUpdateSchedule && PERMISSIONS_TOOLTIP_MESSAGE}
								>
									{editing ? 'Cancel' : 'Edit'}
								</Button>

								{editing && (
									<Button
										css={`
											margin-right: 0.5rem;
											text-transform: unset;
										`}
										color='secondary'
										variant='contained'
										disabled={!hasModifiedData || saveMutation.isLoading}
										onClick={handleSave}
									>
										Save
									</Button>
								)}
							</>
						}
						rightHeader={
							<IconButton
								css='margin-right: 0.5rem'
								iconSize='small'
								size='small'
								onClick={handleDownload}
								aria-label='Download Table Button'
								{...getTaggingProp('schedule', 'downloadOutput')}
							>
								{faDownload}
							</IconButton>
						}
					>
						<div
							css={`
								height: 100%;
							`}
						>
							<ScheduleOutputTable
								editing={editing}
								scheduleId={scheduleId}
								agGridRef={agGridRef}
								modifiedRowsRef={modifiedRowsRef}
								filters={filters}
								setHeaderFilters={setHeaderFilters}
								wellIds={filteredWellIds}
								hasModifiedData={hasModifiedData}
								setHasModifiedData={setHasModifiedData}
								scheduleSettings={constructionQuery?.data?.scheduleSettings}
							/>
						</div>
					</Card>
					<GraphCard
						scheduleId={scheduleId}
						wellIds={filteredWellIds}
						refetch={refetchGraphs}
						setRefetch={setRefetchGraphs}
						position='left'
						defaultChart='well-delivery-chart'
					/>
					<GraphCard
						scheduleId={scheduleId}
						wellIds={filteredWellIds}
						refetch={refetchGraphs}
						setRefetch={setRefetchGraphs}
						position='right'
						defaultChart='map'
					/>
				</CardsLayout>
			</Layout>
		</ErrorBoundary>
	);
}
