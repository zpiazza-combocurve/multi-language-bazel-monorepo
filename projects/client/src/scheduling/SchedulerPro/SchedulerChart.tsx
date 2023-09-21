import {
	DomHelper,
	EventModel,
	MultiPageVerticalExporter,
	SchedulerPro,
	SinglePageExporter,
	StringHelper,
} from '@bryntum/schedulerpro';
import { convertDateToIdx, convertDateToIdxFloor, convertIdxToDate } from '@combocurve/forecast/helpers';
import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ErrorBoundary from '@/components/ErrorBoundary';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Button, Icon, MenuItem, ReactDatePicker, TextField } from '@/components/v2';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDebounce } from '@/helpers/debounce';
import { SCHEDULING_NOTIFICATION_UPDATE_EVENT_NAME } from '@/notifications/constants';
import { useCurrentProject } from '@/projects/api';

import { getSchedulerData, updateSchedulerData } from '../ScheduleGantt/api';
import { Layout } from '../components/Layout';
import { ToolbarPaper } from '../components/ToolbarPaper';
import { Scheduler } from './overrides/Scheduler';

const zoom = {
	weekly: 'weekAndMonth',
	monthly: 'month',
	quarterly: 'year',
};

export const SchedulerChart = ({ scheduleId, constructionQuery }) => {
	const schedulerRef = useRef<SchedulerPro>();
	const { project } = useCurrentProject();

	const {
		palette: { type: theme },
	} = useTheme();

	const [isLoading, setIsLoading] = useState(false);
	useLoadingBar(isLoading);

	useEffect(() => {
		DomHelper.setTheme(`classic-${theme}`);
	}, [theme]);

	const loadDate = useDebounce(async (start, end) => {
		try {
			if (!schedulerRef.current) return;

			const startDate = convertDateToIdx(start);
			const endDate = convertDateToIdx(end);

			setIsLoading(true);
			schedulerRef.current.readOnly = true;
			const data = await getSchedulerData(scheduleId, { startDate, endDate });

			const dependencies = data.dependencies.map((dep) => {
				const isToFPD = dep.toTask.includes('FPD');
				return {
					from: dep.fromTask,
					to: dep.toTask,
					fromSide: 'bottom',
					toSide: isToFPD ? 'bottom' : 'top',
				};
			});

			const isDestroying = schedulerRef.current.isDestroying;
			if (isDestroying) return;

			// @ts-expect-error - Bryntum types are wrong
			await schedulerRef.current.project.clear();
			await schedulerRef.current.project.loadInlineData({
				eventsData: data.tasks,
				dependenciesData: dependencies,
				resourcesData: data.resources,
				assignmentsData: data.assignments,
				calendarsData: data.calendars,
			});
		} catch (error) {
			genericErrorAlert(error, 'Failed to retrieve the data');
		} finally {
			if (schedulerRef.current) schedulerRef.current.readOnly = false;
			setIsLoading(false);
		}
	}, 1000);

	const loadDateRange = useCallbackRef(async ({ new: { startDate: start, endDate: end }, changed }) => {
		if (changed) loadDate(start, end);
	});

	const construction = constructionQuery.data;
	const hasConstruction = Boolean(construction?.scheduleSettings?.startProgram);
	const visibleDate = useMemo(
		() => (hasConstruction ? convertIdxToDate(construction.scheduleSettings.startProgram) : new Date()),
		[construction, hasConstruction]
	);

	const { Pusher: userPusherChannel } = useAlfa();

	const wrappedCallback = useCallbackRef(async (updates) => {
		for (const update of updates) {
			const event = schedulerRef.current?.project.eventStore.getById(update.id) as EventModel;

			if (event) {
				const startDate = convertIdxToDate(update.startDate);
				const endDate = convertIdxToDate(update.endDate);

				startDate.setHours(0, 0, 0);
				endDate.setHours(23, 0, 0);

				await event.setStartDate(startDate);
				await event.setEndDate(endDate);
			}
		}
		if (schedulerRef.current) {
			schedulerRef.current.readOnly = false;
			schedulerRef.current.project.acceptChanges();
		}
	});

	useEffect(() => {
		userPusherChannel.bind(SCHEDULING_NOTIFICATION_UPDATE_EVENT_NAME, wrappedCallback);

		return () => {
			userPusherChannel.unbind(SCHEDULING_NOTIFICATION_UPDATE_EVENT_NAME, wrappedCallback);
		};
	}, [userPusherChannel, wrappedCallback]);

	const onEventEdit = useCallback(
		({ eventRecord, resourceRecord }) => {
			if (schedulerRef.current) schedulerRef.current.readOnly = true;

			const event = eventRecord;
			const well = event.well ? event.well : event.parent.well;
			const resourceId = resourceRecord.id;

			event.startDate.setHours(0, 0, 0);
			event.endDate.setHours(23, 0, 0);

			const workStartDate = convertDateToIdx(event.startDate);
			const workEndDate = convertDateToIdxFloor(event.endDate);
			const mobDuration = event.preamble?.magnitude ?? 0;
			const demobDuration = event.postamble?.magnitude ?? 0;

			const changes = {
				startDate: workStartDate - mobDuration,
				endDate: workEndDate + demobDuration,
				id: event.id,
				wellId: well._id,
				resourceId,
			};
			updateSchedulerData(scheduleId, changes).catch((error) => {
				if (schedulerRef.current) {
					schedulerRef.current.readOnly = false;
					schedulerRef.current.project.revertChanges();
				}

				genericErrorAlert(error, 'Failed to update the data');
			});
		},
		[scheduleId]
	);

	const onEventDrop = useCallback(
		({ eventRecords, targetResourceRecord }) => {
			const [event] = eventRecords;
			onEventEdit({ eventRecord: event, resourceRecord: targetResourceRecord });
		},
		[onEventEdit]
	);

	const onEventResizeEnd = useCallback(
		({ eventRecord, resourceRecord }) => {
			const event = eventRecord;
			onEventEdit({ eventRecord: event, resourceRecord });
		},
		[onEventEdit]
	);

	const onAfterEventEdit = useCallback(
		({ eventRecord }) => {
			const event = eventRecord;
			const hasChanges = Boolean(Object.keys(event.meta.modified).length);
			if (!hasChanges) return;

			onEventEdit({ eventRecord: event, resourceRecord: eventRecord.getResource() });
		},
		[onEventEdit]
	);

	useEffect(() => {
		schedulerRef.current = new Scheduler({
			visibleDate: { date: visibleDate, block: 'start' },
			eventStore: {
				listeners: {
					loadDateRange,
				},
			},
			onEventDrop,
			onEventResizeEnd,
			onAfterEventEdit,
			features: {
				timeRanges: {
					showHeaderElements: true,
					showCurrentTimeLine: {
						name: new Date().toLocaleDateString(),
					},
				},
				cellMenu: {
					items: {
						removeRow: false,
					},
				},
				eventDragCreate: false,
				eventDrag: {
					...(hasConstruction
						? {
								validatorFn({ eventRecords, newResource }) {
									const hasNotEnoughData = newResource.data.steps === null;
									const task = eventRecords[0];
									const isValid = hasNotEnoughData
										? true
										: Boolean(
												newResource.data.steps.find((step) => {
													return step.name === task.data.name;
												})
										  );

									return {
										valid: isValid,
										message: !isValid
											? `${task.data.name} cannot be done by ${newResource.data.name}`
											: '',
									};
								},
						  }
						: {}),
				},
				...(hasConstruction
					? {
							calendarHighlight: {
								calendar: 'resource',
								collectAvailableResources({ scheduler, eventRecords }) {
									const task = eventRecords[0];

									return scheduler.resourceStore.query((resource) => {
										const hasNotEnoughData = resource.data.steps === null;
										if (hasNotEnoughData) return true;

										return Boolean(resource.data.steps.find((step) => step.name === task.name));
									});
								},
							},
					  }
					: {}),
				dependencies: { highlightDependenciesOnEventHover: true, allowCreate: false },
				dependencyEdit: false,
				nonWorkingTime: true,
				resourceNonWorkingTime: {
					maxTimeAxisUnit: 'quarter',
				},
				eventBuffer: true,
				filter: true,
				delete: false,
				scheduleMenu: {
					items: { addEvent: false },
				},
				taskEdit: {
					items: {
						generalTab: {
							items: {
								nameField: {
									readOnly: true,
								},
								resourcesField: {
									readOnly: true,
								},
								startDateField: {
									timeField: { hidden: true, value: '00:00' },
									dateField: {
										required: true,
										revertOnEscape: true,
									},
									keepTime: '00:00',
								},
								endDateField: {
									timeField: { hidden: true, value: '23:00' },
									dateField: {
										required: true,
										revertOnEscape: true,
									},
									keepTime: '23:00',
								},
								percentDoneField: false,
								effortField: false,
								durationField: {
									min: '1d',
								},
								preambleField: false,
								postambleField: false,
							},
						},
						predecessorsTab: false,
						successorsTab: false,
						advancedTab: false,
						notesTab: false,
					},
					editorConfig: {
						bbar: {
							items: {
								deleteButton: false,
							},
						},
					},
				},
				eventMenu: {
					items: {
						addEvent: false,
						cutEvent: false,
						copyEvent: false,
						editEvent: false,
						splitEvent: false,
						deleteEvent: false,
						unassignEvent: false,
					},
				},
				eventTooltip: {
					template: (data) => {
						const wellName = data.eventRecord.parent.well?.well_name ?? '';
						const wellNumber = data.eventRecord.parent.well?.well_number
							? ` - ${data.eventRecord.parent.well.well_number}`
							: '';

						return `
								${StringHelper.xss`<div>${wellName}${wellNumber}</div>`}
								${StringHelper.xss`<div class="b-sch-event-title">${data.eventRecord.name}</div>`}
								${data.startClockHtml}
								${data.endClockHtml}
							`;
					},
				},
				pdfExport: {
					orientation: 'landscape',
					// @ts-expect-error - Bryntum types are wrong
					exporters: [MultiPageVerticalExporter, SinglePageExporter],
					exporterType: 'multipagevertical',
					exportServer: `/api/schedules/${scheduleId}/gantt/export`,
					fetchOptions: {
						credentials: 'same-origin',
						queryParams: {
							projectId: project?._id,
						},
					},
				},
			},
			project: {
				calendar: 'general',
				hoursPerDay: 23,
				calendars: [
					{
						id: 'general',
						name: 'General',
						unspecifiedTimeIsWorking: false,
						intervals: [
							{
								recurrentStartDate: 'at 00:00',
								recurrentEndDate: 'at 23:00',
								isWorking: true,
							},
						],
					},
				],
			},
			appendTo: 'project-scheduler-chart',
		});

		// @ts-expect-error - Only for development purposes
		window.scheduler = schedulerRef.current;

		schedulerRef.current.project.loadInlineData({
			resourcesData: Array.from({ length: 1 }, (_, index) => ({ id: index + 1, name: 'Loading...' })),
		});

		return () => {
			schedulerRef.current?.destroy();
		};
	}, [
		construction,
		hasConstruction,
		loadDateRange,
		onAfterEventEdit,
		onEventDrop,
		onEventResizeEnd,
		project,
		scheduleId,
		visibleDate,
	]);

	const [zoomLevel, setZoomLevel] = useState('monthly');
	const [currentDate, setCurrentDate] = useDerivedState<string>(visibleDate.toString());

	return (
		<ErrorBoundary>
			<Layout>
				<ToolbarPaper>
					<ReactDatePicker
						label='Go to'
						variant='outlined'
						color='secondary'
						size='small'
						name='start'
						css={`
							width: 170px;
						`}
						value={currentDate}
						onChange={(date) => {
							if (!date) return;

							setCurrentDate(date.toString() ?? '');
							schedulerRef.current?.scrollToDate(date, { block: 'start' });
						}}
						required
					/>
					<div
						css={`
							margin-left: auto;
							display: flex;
							gap: 1rem;
							align-items: center;
						`}
					>
						<TextField
							select
							size='small'
							variant='outlined'
							color='secondary'
							value={zoomLevel}
							css={`
								width: 150px;
							`}
							onChange={(event) => {
								schedulerRef.current?.zoomTo(zoom[event.target.value]);
								setZoomLevel(event.target.value);
							}}
						>
							<MenuItem value='weekly'>Weekly</MenuItem>
							<MenuItem value='monthly'>Monthly</MenuItem>
							<MenuItem value='quarterly'>Quarterly</MenuItem>
						</TextField>

						<Button
							css={`
								min-width: initial;
							`}
							aria-label='Export'
							onClick={() => {
								schedulerRef.current?.features.pdfExport.showExportDialog();
							}}
						>
							<Icon>{faDownload}</Icon>
						</Button>
					</div>
				</ToolbarPaper>
				<div
					id='project-scheduler-chart'
					style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
					css={`
						.b-sch-dependency {
							display: none;

							&-over {
								display: block !important;
							}
						}

						.b-sch-dependency-arrow {
							display: none;

							&-over {
								display: block !important;
							}
						}

						.non-working-time {
							background: transparent
								repeating-linear-gradient(
									-40deg,
									rgba(221, 221, 221, 0.6),
									rgba(221, 221, 221, 0.6) 10px,
									rgba(238, 238, 238, 0.6) 5px,
									rgba(238, 238, 238, 0.6) 20px
								);

							opacity: ${theme === 'dark' ? '20%' : '100%'};
						}
					`}
				/>
			</Layout>
		</ErrorBoundary>
	);
};
