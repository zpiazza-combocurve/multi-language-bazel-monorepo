import { FilterBar } from '@bryntum/gantt';

export class FilterBarOverride {
	static get target() {
		return {
			class: FilterBar,
			product: 'gantt',
		};
	}

	onColumnFilterFieldChange(eventData) {
		this._overridden.onColumnFilterFieldChange.call(this, eventData);
		this.grid.features.filterBar.onChange();
	}
}
