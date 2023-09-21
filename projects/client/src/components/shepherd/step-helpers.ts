import { offset } from '@floating-ui/dom';
import Shepherd from 'shepherd.js';

export function attachTo({ id, on = 'right' }: { id: string; on?: Shepherd.Step.StepOptionsAttachTo['on'] }) {
	const uiOffset = offset({ mainAxis: 14 });
	return {
		arrow: true,
		attachTo: { element: `#${id}`, on },
		floatingUIOptions: {
			middleware: [uiOffset],
		},
	};
}
export function advanceOn({
	id,
	event = 'click',
}: {
	id: string;
	event?: Shepherd.Step.StepOptionsAdvanceOn['event'];
}) {
	return { advanceOn: { selector: `#${id}`, event } };
}

export function waitFor(id: string, minDuration?: number) {
	return {
		beforeShowPromise(this) {
			return new Promise((resolve, reject) => {
				function waitForElement() {
					const getElement = () => document.body.querySelector(`#${id}`) as HTMLElement;
					const interval = window.setInterval(() => {
						if (getElement()) {
							window.clearInterval(interval);
							resolve(null);
						}
					}, 30);
					window.setTimeout(() => {
						window.clearInterval(interval);
						if (getElement()) return resolve(null);
						reject(new Error()); // TODO: error description
					}, 1000);
				}
				if (minDuration) window.setTimeout(() => waitForElement(), minDuration);
				else waitForElement();
			});
		},
	};
}

export function highlightOn({
	id,
	on,
	minDuration,
}: {
	id: string;
	on?: Shepherd.Step.StepOptionsAttachTo['on'];
	minDuration?: number;
}) {
	return {
		...waitFor(id, minDuration),
		...attachTo({ id, on }),
	};
}

export function waitForClickOn({
	id,
	on,
	event,
	minDuration,
}: {
	id: string;
	on?: Shepherd.Step.StepOptionsAttachTo['on'];
	event?: Shepherd.Step.StepOptionsAdvanceOn['event'];
	minDuration?: number;
}) {
	return {
		...highlightOn({ id, minDuration, on }),
		...advanceOn({ id, event }),
	};
}

export function waitBeforeShow(duration) {
	return {
		beforeShowPromise(this) {
			return new Promise((resolve) => {
				window.setTimeout(() => resolve(null), duration);
			});
		},
	};
}
