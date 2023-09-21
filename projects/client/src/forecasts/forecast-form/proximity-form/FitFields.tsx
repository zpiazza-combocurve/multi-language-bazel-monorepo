import _ from 'lodash-es';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Divider } from '@/components/v2';
import { FieldHeader } from '@/components/v2/misc';
import { phases } from '@/helpers/zing';
import AddSeriesFields from '@/type-curves/TypeCurveIndex/fit/AddSeriesFIelds';
import BuildupFields from '@/type-curves/TypeCurveIndex/fit/BuildupFields';
import ModelFields from '@/type-curves/TypeCurveIndex/fit/ModelFields';
import { TC_MODELS } from '@/type-curves/TypeCurveIndex/fit/helpers';
import { FieldSection } from '@/type-curves/TypeCurveIndex/shared/formLayout';

import ForecastFormControl, { CustomSelectField } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, ProximityFormContent } from '../phase-form/layout';
import { UseProximityForecastReturn } from './useProximityForecast';

const availableModels = {
	...TC_MODELS,
	rate: _.filter(TC_MODELS?.rate, (model) => model.value !== 'flat_arps_modified'),
};

const FitFields = ({
	handlePhaseTypeChange,
	phase: phaseIn,
}: Pick<UseProximityForecastReturn, 'handlePhaseTypeChange'> & { phase: FormPhase }) => {
	const [open, setOpen] = useState(false);

	const { watch } = useFormContext();

	const phase = phaseIn === 'shared' ? 'oil' : phaseIn;
	const baseFormPath = `${phaseIn}.fit`;
	const [phaseType, tcModel] = watch([`${baseFormPath}.phaseType`, `${baseFormPath}.TC_model`]);

	return (
		<>
			<FieldHeader label='Fit' open={open} toggleOpen={() => setOpen((p) => !p)} />

			<FormCollapse in={open}>
				<ProximityFormContent>
					<FieldSection columns={2}>
						<CustomSelectField
							fullWidth={phaseType === 'rate'}
							label='Fit Type'
							menuItems={[
								{ label: 'Rate', value: 'rate' },
								{ label: 'Ratio', value: 'ratio' },
							]}
							name={`${baseFormPath}.phaseType`}
							onChange={(value) => handlePhaseTypeChange(phaseIn, value)}
							type='select'
						/>

						{phaseType === 'ratio' && (
							<ForecastFormControl
								label='Base Phase'
								menuItems={phases}
								name={`${baseFormPath}.basePhase`}
								type='select'
							/>
						)}
					</FieldSection>

					<ForecastFormControl
						fullWidth
						label='Model'
						menuItems={availableModels[phaseType]}
						name={`${baseFormPath}.TC_model`}
						type='select'
					/>

					<ForecastFormControl
						inForm={false}
						label='Match Production Data'
						name={`${baseFormPath}.fitToTargetData`}
						type='boolean'
					/>

					<Divider />

					<ModelFields
						basePath={baseFormPath}
						hasRepWells
						phase={phase}
						phaseType={phaseType}
						tcModel={tcModel}
					/>

					<Divider />

					<BuildupFields basePath={baseFormPath} hasRepWells phase={phase} />

					<Divider />

					<AddSeriesFields basePath={baseFormPath} hasRepWells phase={phase} phaseType={phaseType} />
				</ProximityFormContent>
			</FormCollapse>
		</>
	);
};

export default FitFields;
