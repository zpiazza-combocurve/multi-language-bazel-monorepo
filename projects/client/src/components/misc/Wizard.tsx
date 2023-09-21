import _ from 'lodash';
import { useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { SyncResolver, resolveSyncValue } from '@/helpers/promise';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface Step<T = any, S = any, C = any> {
	key: string;
	children: SyncResolver<C, [{ state: S; setState(newState: S): void; values: T; select(newState: S): void }]>;
	/** Validate function returns true if invalid, false if valid, possibly string with error message for invalid */
	validate?: (value: S) => boolean;
}

const defaultValidate = (value) => (_.isObject(value) ? _.isEmpty(value) : value == null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useWizard<T = any>({
	steps,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initialValues = {} as any,
}: {
	steps: Step<T>[];
	initialValues: Partial<T>;
}): {
	key: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	children: any;
	isFirstStep: boolean;
	isLastStep: boolean;
	isDisabled: boolean;
	values: T;
	setValues(any): void;
	resetSteps(): void;
	next(): void;
	prev(): void;
} {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [values, setValues] = useState<T>(initialValues as any);
	const [key, setKey] = useState(() => steps[0].key);

	const currentStepIndex = steps.findIndex((step) => step.key === key);
	const currentStep = steps[currentStepIndex];

	const getRelativeStep = (pos: number) => steps[_.clamp(currentStepIndex + pos, 0, steps.length - 1)];

	const validateFn = currentStep.validate ?? defaultValidate;

	return {
		values,
		setValues,
		isDisabled: !!validateFn(values[currentStep.key]),
		isFirstStep: currentStepIndex === 0,
		isLastStep: currentStepIndex === steps.length - 1,
		key,
		resetSteps: () => {
			setKey(steps[0].key);

			const initialKeyValues = steps.reduce(
				(obj, step) => ({
					...obj,
					[step.key]: initialValues?.[step.key],
				}),
				{}
			);

			setValues((p) => ({
				...p,
				...initialKeyValues,
			}));
		},
		children: resolveSyncValue(
			currentStep.children,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			{
				values,
				state: values[currentStep.key],
				setState: (newState) => setValues((p) => ({ ...p, [currentStep.key]: newState })),
				select: (newState) => {
					setValues((p) => ({ ...p, [currentStep.key]: newState }));
					if (!validateFn(newState)) {
						setKey(getRelativeStep(1).key);
					}
				},
			}
		),
		prev: () => {
			const prevStep = getRelativeStep(-1);
			setKey(prevStep.key);
			setValues((p) => ({
				...p,
				[prevStep.key]: initialValues?.[prevStep.key],
				[currentStep.key]: initialValues?.[currentStep.key],
			}));
		},
		next: () => setKey(getRelativeStep(1).key),
	};
}

/**
 * Experimental component for wizard like functionality
 *
 * @example
 * 	import Wizard from '@/components/misc/Wizard';
 *
 * 	<Wizard
 * 		title='Import Qualifier'
 * 		visible
 * 		resolve={(values) => {
 * 			console.log(values); // { project, qualifier }
 * 		}}
 * 		steps={[
 * 			{
 * 				key: 'project',
 * 				children: ({ state, select }) => (
 * 					<SelectList label='Select Project' onChange={select} value={state} listItems={projectItems} />
 * 				),
 * 			},
 * 			{
 * 				key: 'qualifier',
 * 				children: ({ state, select, values }) => (
 * 					<SelectList
 * 						label='Select Qualifier'
 * 						onChange={select}
 * 						value={state}
 * 						listItems={getProjectQualifiers(values.project._id)}
 * 					/>
 * 				),
 * 			},
 * 		]}
 * 	/>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export default function Wizard<T = any>({
	resolve,
	visible,
	onHide,
	initialValues,
	steps,
	title,
	confirmText = 'Apply',
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
DialogProps & { steps: Step<T>[]; title: string; confirmText?: string; initialValues?: any }) {
	const { next, prev, children, isDisabled, isFirstStep, isLastStep, values } = useWizard({ steps, initialValues });
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent css='height: 100vh;'>{children}</DialogContent>
			<DialogActions>
				{isFirstStep ? <Button onClick={onHide}>Cancel</Button> : <Button onClick={prev}>Back</Button>}
				{isLastStep ? (
					<Button disabled={isDisabled} onClick={() => resolve(values)} color='primary' variant='contained'>
						{confirmText}
					</Button>
				) : (
					<Button disabled={isDisabled} onClick={next} color='primary' variant='contained'>
						Next
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
