import _ from 'lodash';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FieldHeader } from '@/components/v2/misc';
import normalizationTemplate from '@/inpt-shared/type-curves/normalization-template';
import {
	NORMALIZATION_TYPE,
	TYPE_OPTIONS,
	getBaseKey,
	getChainUnits,
	getLabel,
	getNumericalHeaders,
} from '@/type-curves/shared/utils';

import ForecastFormControl, { FormControlRangeField } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, SectionContainer } from '../phase-form/layout';

const baseMenuItems = _.map(normalizationTemplate.steps[0].bases, (b) => ({
	label: `${getChainUnits(b.y).label} vs. ${getChainUnits(b.x).label}`,
	value: getBaseKey(b),
}));

const numericalHeaderMenuItems = _.map(getNumericalHeaders(), (header) => ({
	label: getLabel(header),
	value: header,
}));

const NormalizationFields = ({ phase }: { phase: FormPhase }) => {
	const [open, setOpen] = useState(false);

	const { watch } = useFormContext();
	const [phaseType, normalizationType, baseKey] = watch([
		`${phase}.fit.phaseType`,
		`${phase}.normalization.normalizationType`,
		`${phase}.normalization.baseKey`,
	]);

	const disabled = phase !== 'shared' && phaseType === 'ratio';

	return (
		<>
			<FieldHeader
				disabled={disabled && 'Cannot use normalization with ratio fit type'}
				label='Normalize'
				open={open}
				toggleOpen={() => setOpen((p) => !p)}
			/>

			<FormCollapse in={!disabled && open}>
				<SectionContainer>
					<ForecastFormControl
						label='Normalization Type'
						menuItems={_.filter(TYPE_OPTIONS, ({ value }) => value !== 'two_factor')}
						name={`${phase}.normalization.normalizationType`}
						required
						type='select'
					/>

					<ForecastFormControl
						label='Base'
						disabled={normalizationType === NORMALIZATION_TYPE.no_normalization.value}
						menuItems={baseMenuItems}
						name={`${phase}.normalization.baseKey`}
						required
						type='select'
					/>

					{baseKey === '$NUMERICAL_HEADER_$PHASE_EUR' && (
						<ForecastFormControl
							label='Numerical Header'
							name={`${phase}.normalization.numericalHeader`}
							menuItems={numericalHeaderMenuItems}
							type='select'
						/>
					)}

					<FormControlRangeField
						dif={0.01}
						endLabel='P Max'
						label='Keep data between:'
						max={1}
						min={0}
						name={`${phase}.normalization.pValues`}
						startLabel='P Min'
						type='number'
					/>
				</SectionContainer>
			</FormCollapse>
		</>
	);
};

export default NormalizationFields;
