import {
	ColumnStore,
	DomHelper,
	Exporter,
	FilterBarConfig,
	Gantt,
	GanttConfig,
	Model,
	MultiPageVerticalExporter,
	Override,
	ProjectModel,
	ProjectModelConfig,
	SinglePageExporter,
	Splitter,
	Widget,
} from '@bryntum/gantt';
import { useTheme } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';

import { SUBJECTS } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { Doggo } from '@/components';
import { useChooseWellHeaders } from '@/components/hooks/useChooseWellHeaders';
import { genericErrorAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { useWellHeaders } from '@/helpers/headers';
import { formatValue } from '@/helpers/utilities';
import { useCurrentProject } from '@/projects/api';

import { getGanttData, updateGanttData } from './api';
import { TaskTooltip } from './components/TaskTooltip';
import { usePagination } from './hooks/usePagination';
import { convertDateColumns } from './mappers';
import { AjaxHelperOverride } from './overrides/AjaxHelper';
import { ExportDialogOverride, ScheduleRangeComboOverride } from './overrides/ExportDialog';
import { FilterBarOverride } from './overrides/FilterBarOverride';
import { GanttToolbar } from './overrides/GanttToolbar';
import PdfExportOverride from './overrides/PdfExport';
import { ResourceHistogram } from './overrides/ResourceHistogram';

GanttToolbar.initClass();
ScheduleRangeComboOverride.initClass();

Override.apply(FilterBarOverride);
Override.apply(AjaxHelperOverride);
Override.apply(PdfExportOverride);
Override.apply(ExportDialogOverride);

type ExtraGanttConfig = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDataChange: (params: any) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	selectHeaders: () => any;
	pagination: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onPrevPage: () => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onNextPage: () => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onChangePage: (page: number) => any;
	};
	canUpdateSchedule: boolean;
};

type FilterBarType = Partial<FilterBarConfig> & {
	onChange: () => void;
};

type GanttConfigType = Partial<GanttConfig> &
	ExtraGanttConfig & {
		features: {
			filterBar: FilterBarType;
		};
	};

type GanttColumnType = Model & {
	originalData: {
		field: string;
		type: string;
		text: string;
		width: boolean;
	};
};

const DEFAULT_GANTT_COLUMNS = [
	{ field: 'well.priority', text: '#', editor: false, type: 'number', width: 60 },
	{ type: 'name', editor: false },
	{ type: 'startdate', text: 'Start Date', format: 'MM/DD/YYYY' },
	{
		field: 'resourceName',
		text: 'Resource name',
		width: 90,
		editor: false,
	},
];

export const GanttChart = ({ scheduleId, scheduleQuery }) => {
	const ganttRef = useRef<Gantt>();
	const histogramRef = useRef<ResourceHistogram>();
	const splitterRef = useRef<Splitter>();
	const projectRef = useRef<ProjectModel>();
	const pagination = usePagination({ scheduleId });
	const {
		isReady,
		startIndex,
		endIndex,
		numberOfPages,
		numberOfWells,
		currentPage,
		onPrevPage,
		onNextPage,
		onChangePage,
	} = pagination;

	const {
		palette: { type: theme },
	} = useTheme();

	const { project } = useCurrentProject();
	const { data: schedule } = scheduleQuery;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const canUpdateSchedule = usePermissionsBuilder(SUBJECTS.Schedules).canUpdate({ project: project!._id });

	const exportPdfFileName = schedule ? `Gantt Chart ${schedule.name}` : '';

	const [isLoading, setIsLoading] = useState<boolean>();

	const { wellHeadersLabels, wellHeadersTypes } = useWellHeaders({
		enableProjectCustomHeaders: false,
		enableScopeHeader: true,
	});

	const ganttHeadersStorage = {
		version: 1,
		getKey: (project: Inpt.ObjectId<'project'> | undefined) => `INPT_MANAGE_WELL_HEADERS_TABLE_GANTT_${project}`,
	};

	const { selectItems: selectHeaders, selectedKeys: selectedHeaders } = useChooseWellHeaders({
		storageKey: ganttHeadersStorage.getKey(project?._id),
		storageVersion: ganttHeadersStorage.version,
	});

	const update = useDebounce(async ({ scheduleId, changes }) => {
		const request = {
			records: changes,
		};
		await updateGanttData(scheduleId, request).then(() => {
			projectRef.current?.acceptChanges();
		});
	}, 1000);

	useEffect(() => {
		DomHelper.setTheme(`classic-${theme}`);
	}, [theme]);

	useEffect(() => {
		if (!isReady || !ganttRef.current) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const toolbarItems = ganttRef.current.tbar.items as any[];
		const paginationButtons = toolbarItems?.find((item) => item.ref === 'paginationButtons');

		const label = `Displaying: ${startIndex + 1} — ${endIndex} of ${numberOfWells}`;

		const field = paginationButtons.items.find((item: Widget) => item.ref === 'pageNumber');
		field.label = label;
		field.max = numberOfPages;
		field.value = currentPage + 1;
		field.inputWrap.style.maxWidth = '70px';
		field.inputWrap.querySelector('[data-ref=spin]')?.remove();

		const previousButton = paginationButtons.items.find((item: Widget) => item.ref === 'previousButton');
		if (startIndex === 0) previousButton.disable();
		else previousButton.enable();

		const nextButton = paginationButtons.items.find((item: Widget) => item.ref === 'nextButton');
		if (endIndex >= numberOfWells) nextButton.disable();
		else nextButton.enable();
	}, [isReady, startIndex, endIndex, numberOfWells, numberOfPages, currentPage, projectRef.current?.isLoaded]);

	const customWellHeadersFilter = (filter) => {
		const [well, property] = filter.property.split('.');

		const hasParentData = _.has(filter.record._parent.originalData, `${well}.${property}`);
		const filteredField = hasParentData
			? filter.record._parent.originalData[well][property]
			: filter.record.originalData[well][property];

		if (!filteredField) return false;
		if (typeof filteredField === 'string') return filteredField.toLowerCase().includes(filter.value.toLowerCase());
		if (typeof filteredField === 'object')
			return filteredField.toLocaleDateString() === filter.value.toLocaleDateString();

		return false;
	};

	useEffect(() => {
		const currentColumns = (ganttRef.current?.columns as ColumnStore)?.allRecords;

		const replaceWellObjectFromStringField = (field: string) => field?.replace('well.', '');

		const updatedColumns = currentColumns?.filter((column) => {
			const ganttColumn = column as GanttColumnType;

			const isNotTimeAxis = ganttColumn.originalData.type !== 'timeAxis';
			const isNotStartDate = ganttColumn.originalData.type !== 'startdate';
			const isNotName = ganttColumn.originalData.type !== 'name';
			const notRemovableFields = ['well.priority', 'resourceName'];

			const isRemovableField =
				isNotTimeAxis &&
				isNotStartDate &&
				isNotName &&
				!notRemovableFields.includes(ganttColumn.originalData.field);
			const isFieldDeselected = !selectedHeaders.includes(
				replaceWellObjectFromStringField(ganttColumn.originalData.field)
			);

			return !(isRemovableField && isFieldDeselected);
		});

		// ganttRef can become de-synced due to column update from pdf export.
		// In this case, we need to replace all column data instead of using the remove method.
		if (ganttRef.current?.columns) {
			(ganttRef.current.columns as ColumnStore).data = updatedColumns;
		}

		selectedHeaders.forEach((header) => {
			const isColumnAlreadySelected = currentColumns?.some(
				(column) => replaceWellObjectFromStringField((column as GanttColumnType).originalData.field) === header
			);
			if (!isColumnAlreadySelected) {
				(ganttRef.current?.columns as ColumnStore)?.add({
					field: `well.${header}`,
					text: wellHeadersLabels[header],
					width: 90,
					type: ['number', 'date'].includes(wellHeadersTypes[header].type)
						? wellHeadersTypes[header].type
						: undefined,
					editor: false,
					filterable: {
						filterFn: customWellHeadersFilter,
					},
					renderer({ value }) {
						const headerType = wellHeadersTypes[header].type;
						if (!value) return '';
						return formatValue(value, headerType as string);
					},
				});
			}
		});

		document.querySelectorAll('.b-datefield').forEach((element) => {
			const input = element.querySelector('.b-filter-bar-field-input') as HTMLInputElement;
			const calendar = element.querySelector('.b-icon-calendar') as HTMLElement;

			if (!input) return;

			input.setAttribute('readonly', '');
			input.onclick = () => {
				calendar?.click();
			};
		});
	}, [selectedHeaders, wellHeadersLabels, wellHeadersTypes, projectRef.current?.isLoaded]);

	useEffect(() => {
		if (!isReady) return;

		const ganttConfig: GanttConfigType = {
			readOnly: !canUpdateSchedule,
			columns: DEFAULT_GANTT_COLUMNS,
			scrollTaskIntoViewOnCellClick: true,
			maxZoomLevel: 9,
			minZoomLevel: 4,
			features: {
				projectLines: false,
				treeGroup: true,
				percentBar: false,
				sort: 'well.priority',
				filterBar: {
					keyStrokeFilterDelay: 100,
					onChange: () => histogramRef.current?.refreshRows(),
				},
				taskEdit: {
					items: {
						generalTab: {
							items: {
								name: {
									readOnly: true,
								},
								effort: false,
								percentDone: false,
							},
						},
						predecessorsTab: false,
						successorsTab: false,
						resourcesTab: { readOnly: true },
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
				taskTooltip: {
					template: new TaskTooltip().template,
				},
				taskMenu: {
					items: {
						add: false,
						cut: false,
						copy: false,
						paste: false,
						convertToMilestone: false,
						indent: false,
						outdent: false,
						splitTask: false,
						deleteTask: false,
					},
				},
				pdfExport: {
					fileName: exportPdfFileName,
					orientation: 'landscape',
					exporters: [
						MultiPageVerticalExporter as unknown as Exporter,
						SinglePageExporter as unknown as Exporter,
					],
					exporterType: 'multipagevertical',
					exportServer: `/api/schedules/${scheduleId}/gantt/export`,
					fetchOptions: {
						credentials: 'same-origin' as unknown as object,
						queryParams: {
							projectId: project?._id,
						},
					},
				},
			},
			tbar: { type: 'gantttoolbar' },
			onDataChange(params) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const changes: any = projectRef.current?.changes;
				if (params.action === 'update' && changes !== null && changes.tasks) {
					update({ scheduleId, changes });
				}
			},
			selectHeaders,
			pagination: {
				onPrevPage,
				onNextPage,
				onChangePage,
			},
			canUpdateSchedule,
		};

		const projectModelConfig: Partial<ProjectModelConfig> = {
			calendar: 'general',
			hoursPerDay: 23,
			stm: { autoRecord: true },
		};

		projectRef.current = new ProjectModel(projectModelConfig);
		ganttRef.current = new Gantt({ appendTo: 'project-gantt', project: projectRef.current, ...ganttConfig });
		splitterRef.current = new Splitter({ appendTo: 'project-gantt' });
		histogramRef.current = new ResourceHistogram({
			appendTo: 'project-gantt',
			project: projectRef.current,
			partner: ganttRef.current,
			hideHeaders: true,
			hidden: true,
			showMaxEffort: false,
			columns: [
				{ type: 'resourceInfo', field: 'name', flex: 1, showImage: false },
				{
					type: 'scale',
					hidden: true,
				},
			],
		});

		return () => {
			ganttRef.current?.destroy();
			splitterRef.current?.destroy();
			histogramRef.current?.destroy();
		};
	}, [
		scheduleId,
		update,
		selectHeaders,
		onPrevPage,
		onNextPage,
		onChangePage,
		isReady,
		project?._id,
		exportPdfFileName,
		canUpdateSchedule,
	]);

	useEffect(() => {
		if (!isReady) return;

		const getData = async () => {
			try {
				const hasNoRows = endIndex === 0;
				if (hasNoRows) return;

				const request = {
					startRow: startIndex,
					endRow: endIndex,
					rowGroupCols: [],
					valueCols: [],
					pivotCols: [],
					pivotMode: false,
					groupKeys: [],
					filterModel: {},
					sortModel: [
						{ colId: 'priority', sort: 'asc' as 'asc' | 'desc' },
						{ colId: 'FPD', sort: 'asc' as 'asc' | 'desc' },
					],
				};

				setIsLoading(true);
				const ganttData = await getGanttData(scheduleId, request);

				await ganttRef.current?.scrollToTop();
				await projectRef.current?.loadInlineData({
					tasksData: convertDateColumns(ganttData.tasks, wellHeadersTypes),
					dependenciesData: ganttData.dependencies,
					resourcesData: ganttData.resources,
					assignmentsData: ganttData.assignments,
					calendarsData: ganttData.calendars,
				});

				if (!isNaN(Date.parse(ganttData.startDate)) && !isNaN(Date.parse(ganttData.endDate)))
					setTimeout(() => {
						ganttRef.current?.setStartDate(ganttData.startDate);

						if (projectRef.current) {
							const project = projectRef.current;
							project.stm.disable();
							project.stm.resetQueue();
							project.stm.enable();
						}
					});

				await ganttRef.current?.expandAll();
			} catch (error) {
				genericErrorAlert(error, 'Failed to retrieve the data');
			} finally {
				setIsLoading(false);
			}
		};

		getData();
	}, [scheduleId, isReady, startIndex, endIndex, wellHeadersTypes]);

	return (
		<>
			{(isLoading || !isReady) && <Doggo overlay small underDog='Fetching the data...' />}
			<div id='project-gantt' style={{ display: 'flex', flexDirection: 'column', height: '100%' }} />
		</>
	);
};
