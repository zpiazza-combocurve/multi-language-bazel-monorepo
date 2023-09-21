import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { StepContent, StepLabel, useTheme } from '@material-ui/core';
import { ReactNode } from 'react';

import { Icon, Step, Stepper } from '@/components/v2';

const WarningIcon = () => (
	<Icon
		css={`
			color: #ffa726;
		`}
	>
		{faExclamationTriangle}
	</Icon>
);

export const STEPS = {
	DEFINE_PARAMETERS: 0,
	WELL_TABLE_PREVIEW: 1,
};

export enum STATE {
	LOADING,
	LOCKED,
	UNLOCKED,
	CALCULATING,
}

type NpvStepperProps = {
	steps: {
		key: string;
		stepIndex: number;
		label: string;
		content: ReactNode;
	}[];
	activeStep: number;
	hasValidationErrors: boolean;
};

export const NpvStepper = ({ steps, activeStep, hasValidationErrors }: NpvStepperProps) => {
	const theme = useTheme();

	return (
		<Stepper
			css={`
				padding: 0;

				.MuiStepContent-root {
					padding-right: 0;
				}

				.MuiStepIcon-root.MuiStepIcon-active,
				.MuiStepIcon-root.MuiStepIcon-completed {
					color: ${theme.palette.secondary.main};
				}
			`}
			activeStep={activeStep}
			orientation='vertical'
		>
			{steps.map(({ key, stepIndex, label, content }) => {
				const isActiveStepHigherOrEqual = activeStep >= stepIndex;

				return (
					<Step
						css={`
							.MuiStepIcon-root.MuiStepIcon-active {
								color: ${isActiveStepHigherOrEqual ? theme.palette.secondary.main : '#949494'};
							}
							.MuiStepLabel-label.MuiStepLabel-active {
								color: ${isActiveStepHigherOrEqual ? 'initial' : '#949494'};
							}
						`}
						key={key}
						active
					>
						<StepLabel
							StepIconComponent={
								hasValidationErrors && stepIndex === STEPS.DEFINE_PARAMETERS ? WarningIcon : undefined
							}
						>
							{label}
						</StepLabel>
						<StepContent>{content}</StepContent>
					</Step>
				);
			})}
		</Stepper>
	);
};
