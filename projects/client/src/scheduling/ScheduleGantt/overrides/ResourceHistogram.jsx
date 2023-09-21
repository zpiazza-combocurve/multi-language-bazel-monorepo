import { ResourceHistogram as BryntumResourceHistogram } from '@bryntum/gantt';

import { ResourceAllocationInfo } from './ResourceAllocationInfo';

export class ResourceHistogram extends BryntumResourceHistogram {
	onRecordAllocationCalculated(record, allocation) {
		super.onRecordAllocationCalculated(record, allocation);

		if (this.masked) {
			this.unmask();
		}
	}

	buildResourceAllocationReport(resource) {
		this.mask({
			useTransition: false,
			text: 'Calculating allocation...',
		});

		return ResourceAllocationInfo.new({
			includeInactiveEvents: this.includeInactiveEvents,
			ticks: this.ticksIdentifier,
			resource,
		});
	}
}

ResourceHistogram.initClass();
