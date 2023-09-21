import { Combo, DateHelper, SchedulerExportDialog } from '@bryntum/gantt';

import { getTaggingValue } from '@/analytics/tagging';

const MAX_RANGE_YEARS = 1;

const ScheduleRange = {
	currentview: 'currentview',
	daterange: 'daterange',
};

export class ExportDialogOverride {
	static get target() {
		return {
			class: SchedulerExportDialog,
		};
	}

	static get configurable() {
		return {
			defaults: {
				localeClass: this,
			},
			items: {
				scheduleRangeField: {
					type: 'schedulerangecombooverride',
					label: 'L{Schedule range}',
					value: 'daterange',
					weight: 150,
					onChange({ value }) {
						this.parent.widgetMap.rangesContainer.hidden = value !== ScheduleRange.daterange;
					},
				},
				rangesContainer: {
					type: 'container',
					flex: '1 0 100%',
					weight: 151,
					hidden: true,
					defaults: {
						localeClass: this,
					},
					items: {
						filler: {
							// Filler widget to align date fields
							weight: 0,
							type: 'widget',
						},
						rangeStartField: {
							type: 'datefield',
							label: 'L{Export from}',
							labelWidth: '3em',
							flex: '1 0 25%',
							weight: 10,
							onChange({ value: startDate }) {
								const endDate = this.parent.widgetMap.rangeEndField.value;
								const comparison = DateHelper.compare(startDate, endDate, 'd');
								if (comparison > 0)
									this.parent.widgetMap.rangeEndField.value = DateHelper.add(startDate, 1, 'd');
							},
						},
						filler2: {
							// Another filler to move label further from previous field
							type: 'widget',
							weight: 20,
							width: '0.5em',
						},
						rangeEndField: {
							type: 'datefield',
							label: 'L{Export to}',
							labelWidth: '1em',
							flex: '1 0 25%',
							weight: 30,
							onChange({ value: endDate }) {
								const startDate = this.parent.widgetMap.rangeStartField.value;
								const comparison = DateHelper.compare(endDate, startDate, 'd');
								if (comparison < 0)
									this.parent.widgetMap.rangeStartField.value = DateHelper.add(endDate, -1, 'd');
							},
						},
					},
				},
				exporterTypeField: {
					type: 'combo',
					label: 'L{ExportDialog.exporterType}',
					editable: false,
					displayField: 'text',
					buildItems() {
						const dialog = this.parent;

						return dialog.exporters.map((exporter) => ({
							id: exporter.type,
							text: dialog.optionalL(exporter.title.replace('(vertical)', ''), this),
						}));
					},
					onChange({ value }) {
						this.owner.widgetMap.alignRowsField.hidden = value === 'singlepage';
						this.owner.widgetMap.repeatHeaderField.hidden = value !== 'multipagevertical';
					},
					weight: 300,
				},
				fileFormatField: false,
			},
			bbar: {
				items: {
					exportButton: { dataset: { tid: getTaggingValue('schedule', 'exportGantt') } },
				},
			},
		};
	}

	applyInitialValues(config) {
		this._overridden.applyInitialValues.call(this, config);

		const {
			items: { scheduleRangeField, rangesContainer },
		} = config;

		scheduleRangeField.value = ScheduleRange.daterange;
		rangesContainer.hidden = false;
	}

	onBeforeShow() {
		const { columnsField, alignRowsField, exporterTypeField, repeatHeaderField, rangeStartField, rangeEndField } =
			this.widgetMap;

		if (this.autoSelectVisibleColumns) {
			columnsField.value = this.columnsStore.query((c) => !c.hidden);
		}
		alignRowsField.hidden = exporterTypeField.value === 'singlepage';
		repeatHeaderField.hidden = exporterTypeField.value !== 'multipagevertical';

		rangeStartField.value = this.client.startDate;
		rangeEndField.value = DateHelper.add(rangeStartField.value, MAX_RANGE_YEARS, 'y');

		super.onBeforeShow?.();
	}
}

export class ScheduleRangeComboOverride extends Combo {
	static get $name() {
		return 'ScheduleRangeCombo';
	}

	static get type() {
		return 'schedulerangecombooverride';
	}

	static get defaultConfig() {
		return {
			editable: false,
			localizeDisplayFields: true,
			displayField: 'text',
			buildItems() {
				return Object.entries(ScheduleRange).map(([id, text]) => ({ value: id, text: 'L{' + text + '}' }));
			},
		};
	}
}
