import { faQuestion } from '@fortawesome/pro-solid-svg-icons';

import { IconButton } from '@/components/v2';

import { runTour } from './runTour';
import { Step } from './types';

export function TourButton({ trackingId, steps }: { trackingId?: string; steps: Step[] | (() => Step[]) }) {
	const getSteps = typeof steps === 'function' ? steps : () => steps;
	return <IconButton onClick={() => runTour({ trackingId, steps: getSteps() })}>{faQuestion}</IconButton>;
}
