import _ from 'lodash-es';
import { useMemo, useState } from 'react';

import { RHFForm } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { local } from '@/helpers/storage';

import ForecastFormControl from '../ForecastFormControl';
import PhaseForm from '../phase-form/PhaseForm';
import { FieldLabel, FormContent, FormHeader } from '../phase-form/layout';
import { COLLAPSED_STATE_KEY } from './config';
import { CollapsedSectionState, CollapsedState, FormPhase } from './types';
import { UseAutomaticForecastReturn } from './useAutomaticForecast';

const DEFAULT_COLLASPED_SECTION_STATE: CollapsedSectionState = {
	general: true,
	model: true,
	filter: true,
	weightedData: true,
	matchEur: true,
	lowData: true,
};

const DEFAULT_COLLAPSED_STATE: CollapsedState = {
	shared: { ...DEFAULT_COLLASPED_SECTION_STATE },
	oil: { ...DEFAULT_COLLASPED_SECTION_STATE },
	gas: { ...DEFAULT_COLLASPED_SECTION_STATE },
	water: { ...DEFAULT_COLLASPED_SECTION_STATE },
};

const AutomaticForecastForm = ({
	forecastId,
	form,
	handleAxisComboChange,
	handleModelChange,
}: UseAutomaticForecastReturn & {
	forecastId: string;
	disabled?: boolean | string;
	onClose?: () => void;
	wellIds?: Array<string>;
}) => {
	const { watch } = form;

	const applyAll = watch('applyAll');

	const [collapsedState, setCollapsedState] = useState<CollapsedState>(
		local.getItem(COLLAPSED_STATE_KEY) ?? DEFAULT_COLLAPSED_STATE
	);

	const phaseStreams: Array<FormPhase> = useMemo(() => (applyAll ? ['shared'] : VALID_PHASES), [applyAll]);

	return (
		<RHFForm
			css={`
				display: flex;
				flex-direction: column;
				row-gap: 0.5rem;
				width: 100%;
			`}
			form={form}
		>
			<FormHeader asRow={applyAll}>
				<div
					css={`
						display: flex;
						flex-direction: column;
						flex-basis: 48%;
					`}
				>
					<FieldLabel>Select Phases to Forecast:</FieldLabel>

					{!!applyAll && (
						<div
							css={`
								display: flex;
								justify-content: space-between;
								width: 100%;
							`}
						>
							{VALID_PHASES.map((phaseStream) => (
								<ForecastFormControl
									key={`enable-phase-boolean__${phaseStream}`}
									inForm={false}
									label={_.capitalize(phaseStream)}
									name={`phases.${phaseStream}`}
									type='boolean'
								/>
							))}
						</div>
					)}
				</div>
			</FormHeader>

			<FormContent>
				{phaseStreams.map((phaseStream) => (
					<PhaseForm
						key={`${phaseStream}-phase-form`}
						collapsedState={collapsedState}
						forecastId={forecastId}
						forecastType='deterministic'
						handleAxisComboChange={handleAxisComboChange}
						handleModelChange={handleModelChange}
						phase={phaseStream}
						setCollapsedState={setCollapsedState}
					/>
				))}
			</FormContent>
		</RHFForm>
	);
};

export default AutomaticForecastForm;
