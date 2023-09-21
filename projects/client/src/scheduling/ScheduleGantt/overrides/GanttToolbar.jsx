import { Toolbar } from '@bryntum/gantt';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';

export class GanttToolbar extends Toolbar {
	static get type() {
		return 'gantttoolbar';
	}

	static get $name() {
		return 'GanttToolbar';
	}

	static get configurable() {
		return {
			items: [
				{
					type: 'button',
					ref: 'selectHeaders',
					icon: 'b-fa b-fa-list',
					onClick: 'up.selectHeaders',
				},
				{
					type: 'buttonGroup',
					ref: 'paginationButtons',
					items: [
						{
							type: 'numberfield',
							ref: 'pageNumber',
							value: 1,
							min: 1,
							required: true,
							keyStrokeChangeDelay: 200,
							onChange: 'up.onSelectPage',
							width: 190,
							height: 48,
						},
						{
							ref: 'previousButton',
							icon: 'b-fa b-fa-angle-left',
							tooltip: 'Previous page',
							onAction: 'up.onShiftPreviousClick',
						},
						{
							ref: 'nextButton',
							icon: 'b-fa b-fa-angle-right',
							tooltip: 'Next page',
							onAction: 'up.onShiftNextClick',
						},
					],
				},
				'->',
				{
					type: 'undoredo',
					items: {
						transactionsCombo: null,
					},
				},
				{
					type: 'slideToggle',
					text: 'Resource',
					onClick: 'up.onResourceToggle',
				},
				{
					type: 'button',
					ref: 'exportButton',
					icon: 'b-fa-file-export',
					text: 'Export Gantt to PDF',
					tooltip: 'You can export only the page that is being displayed',
					onClick: 'up.exportPDF',
				},
				{
					type: 'button',
					ref: 'featuresButton',
					icon: 'b-fa b-fa-tasks',
					menu: {
						onBeforeShow: 'up.onFeaturesButtonShow',
						onItem: 'up.onFeaturesClick',
						items: [
							{
								type: 'datefield',
								ref: 'startDateField',
								label: 'Schedule start',
								listeners: {
									change: 'up.onStartDateChange',
								},
							},
							{
								text: 'Collapse all',
								checked: false,
								feature: 'collapseAll',
								onClick: 'up.onCollapseAllClick',
							},
						],
					},
				},
			],
		};
	}

	exportPDF() {
		this.gantt.features.pdfExport.showExportDialog();
	}

	updateParent(parent, was) {
		super.updateParent(parent, was);

		this.gantt = parent;
	}

	onFeaturesButtonShow({ source: menu }) {
		const { gantt } = this;
		const { startDateField } = menu.widgetMap;

		startDateField.value = gantt.startDate;
		startDateField.required = true;
		startDateField.disabled = !this.gantt.canUpdateSchedule;
		startDateField.tooltip = startDateField.disabled ? PERMISSIONS_TOOLTIP_MESSAGE : '';
	}

	onStartDateChange({ value, userAction }) {
		if (userAction && value) {
			this.gantt.startDate = value;
			this.gantt.project.setStartDate(value);
		}
	}

	selectHeaders() {
		this.gantt.selectHeaders();
	}

	onFeaturesClick({ source }) {
		const { feature, checked } = source;

		if (feature === 'collapseAll') {
			if (checked) this.gantt.collapseAll();
			else this.gantt.expandAll();
		}
	}

	async onResourceToggle({ event }) {
		if (event.target.checked) {
			await this.gantt.partners[0].show();
		} else await this.gantt.partners[0].hide(true);
	}

	onShiftPreviousClick() {
		this.gantt.pagination.onPrevPage();
	}

	onShiftNextClick() {
		this.gantt.pagination.onNextPage();
	}

	onSelectPage({ value }) {
		this.gantt.pagination.onChangePage(value - 1);
	}
}
