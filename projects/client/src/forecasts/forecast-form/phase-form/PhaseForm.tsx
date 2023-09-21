import { useTheme } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash-es';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { Divider, InfoTooltipWrapper } from '@/components/v2';
import { FieldHeader } from '@/components/v2/misc';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { local } from '@/helpers/storage';
import { phases } from '@/helpers/zing';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

import ForecastFormControl, { CustomSelectField } from '../ForecastFormControl';
import { COLLAPSED_STATE_KEY } from '../automatic-form/config';
import { CollapsedSectionState, CollapsedState, ForecastType, FormPhase } from '../automatic-form/types';
import { UseAutomaticForecastReturn, axisComboItems, getShowMatchEur } from '../automatic-form/useAutomaticForecast';
import FilterFields from './FilterFields';
import LowDataFields from './LowDataFields';
import MatchEurFields from './MatchEurFields';
import ModelFields from './ModelFields';
import WeightedDataFields from './WeightedDataFields';
import { FormCollapse, SectionContainer, scrollBarStyles } from './layout';

const BAYESIAN_MODELS = [
	'arps_fulford',
	'arps_modified_fulford',
	'arps_linear_flow_fulford',
	'arps_modified_fp_fulford',
];

const generateBasePhaseItems = (curPhase) =>
	curPhase === 'shared' ? [] : _.filter(phases, (phase) => phase.value !== curPhase);

const getModelItems = ({ forecastType = 'probabilistic', axisCombo }): Array<MenuItem> => {
	if (!axisCombo) {
		return [];
	}
	// hard-coding this exclusionary array for now. these models cause weird forecasts to be generated
	const toExclude = ['exp', 'exp_incline', 'exp_decline', 'flat_arps_modified'];
	return (
		Object.entries(formTemplates[axisCombo])
			.filter(([key]) => !toExclude.includes(key)) // temporary exclude
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			.filter(([, value]: [string, any]) => value.allowedTypes.includes(forecastType)) // filter based on forecastType
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			.map(([key, value]: [string, any]) => ({
				value: key,
				label: <InfoTooltipWrapper tooltipTitle={value.labelTooltip}>{value.label}</InfoTooltipWrapper>,
				key,
			}))
	);
};

const PhaseForm = ({
	collapsedState,
	forecastId,
	forecastType = 'probabilistic',
	handleAxisComboChange,
	handleModelChange,
	phase,
	setCollapsedState,
}: Pick<UseAutomaticForecastReturn, 'handleAxisComboChange' | 'handleModelChange'> & {
	collapsedState: CollapsedState;
	forecastId: string;
	forecastType?: ForecastType;
	phase: FormPhase;
	setCollapsedState: Dispatch<SetStateAction<CollapsedState>>;
}) => {
	const { openArticle } = useZoho();
	const theme = useTheme();

	const { watch } = useFormContext();
	const [axisCombo, modelName] = watch([`${phase}.axis_combo`, `${phase}.model_name`]);
	const showMatchEur = getShowMatchEur({ axisCombo, forecastType, modelName });

	const toggleCollapsedState = useCallback(
		(section: keyof CollapsedSectionState) => {
			setCollapsedState(
				produce((draft) => {
					draft[phase][section] = !draft[phase][section];
					local.setItem(COLLAPSED_STATE_KEY, draft);
				})
			);
		},
		[phase, setCollapsedState]
	);

	const getOpenState = (section: keyof CollapsedSectionState) => ({
		open: collapsedState[phase][section],
		toggleOpen: () => toggleCollapsedState(section),
	});

	return (
		<section
			css={`
				display: flex;
				flex-direction: column;
				flex: 1 1 0;
			`}
		>
			{phase !== 'shared' && (
				<ForecastFormControl
					css={`
						align-self: flex-end;
					`}
					inForm={false}
					label={_.capitalize(phase)}
					name={`phases.${phase}`}
					type='boolean'
				/>
			)}

			<Divider css='margin-bottom: 0.5rem;' />

			<section
				css={`
					border-radius: 5px;
					display: flex;
					flex-direction: column;
					flex-grow: 1;
					row-gap: 1rem;
					// overflow-x: hidden;
					// overflow-y: auto;
					// padding-right: 0.5rem;
					// padding-bottom: 1rem;
					// ${scrollBarStyles({ theme, width: '10px' })}
				`}
			>
				<FieldHeader label='Model Selection' {...getOpenState('general')} />

				<FormCollapse in={collapsedState[phase].general}>
					<SectionContainer>
						<CustomSelectField
							label='Forecast Type'
							menuItems={axisComboItems}
							name={`${phase}.axis_combo`}
							onChange={(value) => handleAxisComboChange(phase, value)}
							tooltip='Choose whether to forecast directly from production rates or from a ratio of two production streams. When using a ratio forecast, the base stream should be given a rate forecast.'
						/>

						<CustomSelectField
							label='Model Name'
							menuItems={getModelItems({ forecastType: 'deterministic', axisCombo })}
							name={`${phase}.model_name`}
							onChange={(value) => handleModelChange(phase, value)}
						/>

						{axisCombo === 'ratio' && (
							<ForecastFormControl
								label='Base Phase'
								menuItems={generateBasePhaseItems(phase)}
								name={`${phase}.base_phase`}
								type='select'
							/>
						)}

						{BAYESIAN_MODELS.includes(modelName) && (
							<InstructionsBanner
								css={`
									font-size: 14px;
									font-weight: 500;
								`}
								onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.BayesianInfo })}
							>
								Learn more about the new Bayesian forecast models!
							</InstructionsBanner>
						)}
					</SectionContainer>
				</FormCollapse>

				<ModelFields forecastType={forecastType} phase={phase} {...getOpenState('model')} />

				<FilterFields phase={phase} {...getOpenState('filter')} />

				{forecastType === 'deterministic' && (
					<WeightedDataFields phase={phase} {...getOpenState('weightedData')} />
				)}

				{showMatchEur && <MatchEurFields forecastId={forecastId} phase={phase} {...getOpenState('matchEur')} />}

				<LowDataFields phase={phase} showMatchEur={showMatchEur} {...getOpenState('lowData')} />
			</section>
		</section>
	);
};

export default PhaseForm;
