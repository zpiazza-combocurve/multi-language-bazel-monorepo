import Shepherd from 'shepherd.js';

enum CLASSES {
	primary = 'MuiButtonBase-root MuiButton-root MuiButton-secondary MuiButton-sizeSmall',
	primaryContained = 'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedSecondary MuiButton-containedSizeSmall MuiButton-sizeSmall',
}

function footerButton({
	text,
	action,
	classes = CLASSES.primary,
}: Shepherd.Step.StepOptionsButton): Shepherd.Step.StepOptionsButton {
	return { text, action, classes };
}

export const start = footerButton({
	text: 'START',
	action() {
		this.next();
	},
	classes: CLASSES.primaryContained,
});

export const back = footerButton({
	text: 'BACK',
	action() {
		this.back();
	},
});
export const next = footerButton({
	text: 'NEXT',
	action() {
		this.next();
	},
});

export const done = footerButton({
	text: 'DONE',
	action() {
		this.complete();
	},
	classes: CLASSES.primaryContained,
});
