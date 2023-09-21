import { useFormikContext } from 'formik';
import styled from 'styled-components';

import { FormikCheckbox, FormikSelectField } from '@/components';
import { TooltipedLabel } from '@/components/tooltipped';
import { phases } from '@/helpers/zing';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';

export const axisComboItems = [
	{ label: 'Rate', value: 'rate' },
	{ label: 'Ratio', value: 'ratio' },
];

export const resolutionItems = [
	{ label: 'Daily Only', value: 'daily_only' },
	{ label: 'Monthly Only', value: 'monthly_only' },
	{ label: 'Daily Preference', value: 'daily_preference' },
	{ label: 'Monthly Preference', value: 'monthly_preference' },
];

const Container = styled.div`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
`;

const PhasesContainer = styled.div`
	align-items: center;
	display: flex;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
	& > *:first-child {
		justify-content: space-between;
	}
`;

const PhaseDiv = styled.div`
	display: flex;
	width: 100%;
	justify-content: flex-end;
	align-items: center;
	font-size: 1rem;
	& span {
		font-size: 1rem;
	}
`;

export const getModelItems = ({ forecastType = 'probabilistic', axisCombo }) => {
	if (!axisCombo) {
		return [];
	}
	// hard-coding this exclusionary array for now. these models cause weird forecasts to be generated
	const toExclude = ['exp', 'exp_incline', 'exp_decline', 'flat_arps_modified'];

	return Object.entries(formTemplates[axisCombo])
		.filter(([key]) => !toExclude.includes(key)) // temporary exclude
		.filter(([, value]) => value.allowedTypes.includes(forecastType)) // filter based on forecastType
		.map(([key, value]) => ({
			value: key,
			label: <TooltipedLabel labelTooltip={value.labelTooltip}>{value.label}</TooltipedLabel>,
			key,
		}));
};

export function GeneralForm({
	rateOnly = false,
	readOnly = false,
	showType = false,
	showModel = false,
	includePhases = false,
	showAdvanced = false,
	forecastType = 'probabilistic',
	className = '',
}) {
	const { values } = useFormikContext();

	return (
		<>
			<Container className={className}>
				{showAdvanced && <FormikCheckbox name='advanced' label='Advanced Options' plain />}
				<FormikSelectField
					name='shared.resolution'
					label='Data Resolution'
					placeholder='Select A Resolution'
					menuItems={resolutionItems}
					disabled={readOnly}
					inlineLabel
					inlineTooltip='Select data resolution for forecast. If Monthly Only is selected, then daily data will not be used. If Monthly Preference is selected, then daily data will be used if a well lacks monthly data. The settings for Daily Only and Daily Preference behave similarly.'
				/>
				{!rateOnly && showType && (
					<FormikSelectField
						name='shared.axisCombo'
						label='Forecast Type'
						placeholder='Select A Type'
						disabled={readOnly}
						menuItems={axisComboItems}
						inlineLabel
					/>
				)}
				{!rateOnly && showModel && (
					<FormikSelectField
						name='shared.model'
						label='Model'
						placeholder='Select A Model'
						disabled={readOnly}
						menuItems={getModelItems({ forecastType, axisCombo: values?.shared?.axisCombo })}
						inlineLabel
					/>
				)}
			</Container>
			{includePhases && (
				<PhasesContainer>
					{phases.map(({ label, value }, index) => (
						<PhaseDiv key={value}>
							{index === 0 && 'Phases:'}
							<FormikCheckbox
								id={`general-form-phases-${value}`}
								name={`phases.${value}`}
								label={label}
								plain
							/>
						</PhaseDiv>
					))}
				</PhasesContainer>
			)}
		</>
	);
}
