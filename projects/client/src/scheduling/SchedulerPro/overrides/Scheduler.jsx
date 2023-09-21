import { DateHelper, Override, SchedulerPro, StringHelper } from '@bryntum/schedulerpro';

import { AjaxHelperOverride } from './AjaxHelper';
import PdfExportOverride from './PdfExport';

Override.apply(AjaxHelperOverride);
Override.apply(PdfExportOverride);

export class Scheduler extends SchedulerPro {
	static get $name() {
		return 'Schedule';
	}

	static get defaultConfig() {
		return {
			rowHeight: 80,
			barMargin: 10,
			createEventOnDblClick: false,
			enableDeleteKey: false,
			displaySchedulingIssueResolutionPopup: false,
			infiniteScroll: true,
			maxZoomLevel: 10,
			minZoomLevel: 4,
			viewPreset: {
				id: 'month',
				name: 'Monthly view',
				base: 'weekAndMonth',
				timeResolution: {
					unit: 'day',
					increment: 1,
				},
				tickWidth: 300,
				headers: [
					{
						increment: 1,
						unit: 'month',
						dateFormat: 'MMM YYYY',
						originalDateFormat: 'MMM YYYY',
					},
				],
			},

			listeners: {
				beforeEventDropFinalize: ({ context }) => {
					context.valid =
						context.newResource.isWorkingTime(context.startDate) &&
						context.newResource.isWorkingTime(context.endDate);

					if (!context.valid) {
						context.startDate = context.origStart;
						context.endDate = context.origEnd;
					}
				},
				beforeEventResizeFinalize: ({ context }) => {
					context.valid =
						context.resourceRecord.isWorkingTime(context.startDate) &&
						context.resourceRecord.isWorkingTime(context.endDate);

					if (!context.valid) {
						context.startDate = context.originalStartDate;
						context.endDate = context.originalEndDate;
					}
				},
				beforeTaskEdit(event) {
					const {
						taskEdit: { editor },
						taskRecord,
					} = event;
					editor.widgetMap.endDateField.on('change', (props) => {
						props.valid = !DateHelper.isEqual(taskRecord.startDate, props.value);
					});
				},
			},
			eventRenderer({ eventRecord }) {
				const wellName = eventRecord.parent.well?.well_name ?? '';
				const wellNumber = eventRecord.parent.well?.well_number
					? ` - ${eventRecord.parent.well.well_number}`
					: '';

				return {
					children: [
						{
							text: `${wellName}${wellNumber}`,
						},
						{
							html: StringHelper.xss`<div class="b-sch-event-title">${eventRecord.name}</div>`,
						},
					],
				};
			},
			columns: [
				{
					type: 'resourceInfo',
					text: 'Resources',
					width: 170,
					field: 'name',
					readOnly: true,
					showEventCount: false,
					showImage: false,
				},
				{
					type: 'template',
					field: 'steps',
					width: 150,
					text: 'Steps',
					readOnly: true,
					template: ({ record }) => {
						if (!record.data.steps || record.data.steps.length === 0) return '';

						return `${record.data.steps.map((step) => `${step.name}<br>`).join('')}`;
					},
					filterable: ({ value, record }) => {
						return Boolean(
							record.data.steps.find((step) => step.name.toLowerCase().includes(value.toLowerCase()))
						);
					},
					sortable(resource1, resource2) {
						const firstStep = resource1.data.steps?.[0];
						const secondStep = resource2.data.steps?.[0];
						return firstStep?.name < secondStep?.name ? -1 : 1;
					},
				},
			],
		};
	}
}
