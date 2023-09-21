import { useFormContext } from 'react-hook-form';

import ForecastFormControl, { getFormControlRules } from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';

import { FieldSection } from '../shared/formLayout';

function BuildupFields({
	basePath: basePathIn,
	hasRepWells,
	phase,
}: {
	basePath?: string;
	hasRepWells: boolean;
	phase: Phase;
}) {
	const basePath = `${basePathIn ?? phase}.buildup`;

	const { watch } = useFormContext();
	const [applyBuildup, applyBuildupRatio] = watch([`${basePath}.apply`, `${basePath}.apply_ratio`]);

	return (
		<FieldSection columns={2}>
			<ForecastFormControl
				label={`${applyBuildup ? 'Manual' : 'Automatic'} Buildup`}
				name={`${basePath}.apply`}
				type='boolean'
			/>

			<ForecastFormControl
				disabled={!applyBuildup}
				label='Days'
				name={`${basePath}.days`}
				rules={getFormControlRules({ min: 0, isInteger: true, required: applyBuildup && hasRepWells })}
				type='number'
			/>

			{applyBuildup && (
				<>
					<ForecastFormControl
						label={`${applyBuildup ? 'Manual' : 'Automatic'} Ratio`}
						name={`${basePath}.apply_ratio`}
						type='boolean'
					/>

					<ForecastFormControl
						disabled={!applyBuildupRatio}
						name={`${basePath}.buildup_ratio`}
						rules={getFormControlRules({ min: 1e-5, max: 1, required: applyBuildupRatio && hasRepWells })}
						type='number'
					/>
				</>
			)}
		</FieldSection>
	);
}

export default BuildupFields;
