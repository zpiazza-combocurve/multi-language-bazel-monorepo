import type Shepherd from 'shepherd.js';

export type Step = Omit<Shepherd.Step.StepOptions, 'text'> & {
	text: string | JSX.Element;
};
