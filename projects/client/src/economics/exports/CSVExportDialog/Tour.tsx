import { TourButton } from '@/components/shepherd';

import { csvExportTour } from './Tour/steps';

export function Tour() {
	return (
		<div
			css={`
				flex: 0 0 auto;
			`}
		>
			<TourButton trackingId='Custom CSV Editor Tour' steps={csvExportTour} />
		</div>
	);
}
