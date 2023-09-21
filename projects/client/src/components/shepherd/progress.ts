import Shepherd from 'shepherd.js';

import { assert } from '@/helpers/utilities';

function getCurrentStep(tour = Shepherd.activeTour) {
	assert(tour);
	const currentStep = tour.getCurrentStep();
	assert(currentStep);
	return currentStep;
}

function getTotalSteps() {
	return Shepherd.activeTour?.steps.length;
}
export function getStepNumber(tour = Shepherd.activeTour) {
	assert(tour);
	const currentStep = getCurrentStep(tour);
	assert(currentStep);
	const currentStepNumber = tour.steps.indexOf(currentStep) ?? 0;
	return currentStepNumber + 1;
}

function getProgressElement(current, total) {
	const progress = document.createElement('span');
	progress.style['margin'] = '0 1rem';
	progress.innerText = `${current}/${total}`;
	return progress;
}

export function showProgress() {
	const currentStepElement = getCurrentStep().getElement();
	assert(currentStepElement);
	const header = currentStepElement.querySelector('.shepherd-header');
	assert(header);

	const progress = getProgressElement(getStepNumber(), getTotalSteps());

	header.insertBefore(progress, currentStepElement.querySelector('.shepherd-cancel-icon'));
}
