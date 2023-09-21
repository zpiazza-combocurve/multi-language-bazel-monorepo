import { reduce } from 'lodash';
import { renderToStaticMarkup } from 'react-dom/server';
import Shepherd from 'shepherd.js';

import { analytics } from '@/analytics/analytics';

import { getStepNumber, showProgress } from './progress';
import { Step } from './types';

function elementToHTMLElement({ type, props: { children } }: JSX.Element) {
	const htmlElement = document.createElement(type);
	htmlElement.innerHTML = renderToStaticMarkup(children);
	return htmlElement;
}

function textOrHTML(text) {
	if (!text || typeof text === 'string') return text;
	return elementToHTMLElement(text);
}

export function tourOptions({ modalContainer }: Partial<Shepherd.Tour.TourOptions> = {}): Shepherd.Tour.TourOptions {
	return {
		modalContainer,
		defaultStepOptions: {
			cancelIcon: {
				enabled: true,
			},
		},
		exitOnEsc: true,
		useModalOverlay: true,
	};
}

export function runTour({ trackingId, steps }: { trackingId?: string; steps: Step[] }) {
	const tr = new Shepherd.Tour({
		...tourOptions(),
		steps: steps.map(({ text, ...step }) => ({
			...step,
			text: textOrHTML(text),
			when: {
				...reduce(
					['cancel', 'complete'],
					(acc, action) => ({
						...acc,
						[action](this: { tour: Shepherd.Tour }) {
							if (trackingId) {
								analytics.track(trackingId, { action, step: getStepNumber(this.tour) });
							}
						},
					}),
					{}
				),
				show() {
					if (trackingId && getStepNumber() === 1) analytics.track(trackingId, { action: 'show' });
					showProgress();
				},
			},
		})),
	});
	tr.start();
}
