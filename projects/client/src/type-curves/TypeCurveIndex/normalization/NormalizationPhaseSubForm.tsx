import { InputLabel } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';

import ForecastFormControl, { FormControlRangeField } from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { useDebounce, useDebouncedValue } from '@/helpers/debounce';
import { NORMALIZATION_TYPE, TYPE_OPTIONS, getChainUnits } from '@/type-curves/shared/utils';

import { FieldSection, FormButton, FormInfoText } from '../shared/formLayout';
import { formatWithUnits } from './helpers';
import { NormalizationTypes } from './types';

function NormalizationPhaseSubForm({
	autoFit,
	form,
	handleFitTrim,
	phase,
	phaseFormProps,
	normType = 'eur',
	disabled = false,
	title = 'Eur',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	autoFit: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handleFitTrim: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	phaseFormProps: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	form: any;
	phase: Phase;
	normType: NormalizationTypes;
	title: string;
	disabled: boolean;
}) {
	const {
		aValue: aValue_,
		averageY,
		base,
		baseKey,
		bValue: bValue_,
		numericalHeader,
		points,
		targetX: targetX_,
		yUnits,
	} = phaseFormProps[phase][normType];

	const [aValue, bValue, targetX] = useDebouncedValue([aValue_, bValue_, targetX_], 500);

	const { watch } = form;
	const [normalizationType] = watch([`${phase}.${normType}.type`]);

	const [targetY, deltaY] = useMemo(() => {
		const validFunction = Number.isFinite(aValue) && Number.isFinite(bValue);
		const validTarget = base && targetX;

		if (!(validFunction || validTarget)) {
			return [undefined, undefined];
		}

		const targetY_ = aValue * targetX + bValue;
		return [targetY_, targetY_ - averageY];
	}, [aValue, averageY, bValue, base, targetX]);

	const debouncedAutoFit = useDebounce(autoFit, 500);

	useEffect(() => {
		if (
			normalizationType === NORMALIZATION_TYPE.linear.value ||
			normalizationType === NORMALIZATION_TYPE.power_law.value
		) {
			debouncedAutoFit({ checkSaved: true, phase, normType });
		}
	}, [baseKey, debouncedAutoFit, normType, normalizationType, numericalHeader, phase, points]);

	return (
		<div>
			<h4 css='margin-bottom: 0'>{title}</h4>
			<ForecastFormControl
				label='Normalization Type'
				menuItems={_.filter(
					TYPE_OPTIONS,
					({ value }) => value !== 'two_factor' && value !== 'no_normalization'
				)}
				name={`${phase}.${normType}.type`}
				required
				type='select'
			/>
			{(normalizationType === NORMALIZATION_TYPE.linear.value ||
				normalizationType === NORMALIZATION_TYPE.power_law.value) && (
				<FieldSection>
					<FormControlRangeField
						dif={0.01}
						endLabel='P Max'
						endName={`${phase}.${normType}.bases.${baseKey}.rangeEnd`}
						label='Keep data between:'
						max={1}
						min={0}
						startLabel='P Min'
						startName={`${phase}.${normType}.bases.${baseKey}.rangeStart`}
						disabled={disabled}
						type='number'
					/>

					<FormButton
						css='height: 2rem'
						color='secondary'
						onClick={() => handleFitTrim(phase, normType)}
						size='small'
						variant='outlined'
					>
						Trim
					</FormButton>
					<InputLabel css='grid-column: 1 / -1;'>{`Fit Function: (y = ${
						normalizationType === NORMALIZATION_TYPE.linear.value ? 'mx + b' : 'mx^b'
					})`}</InputLabel>
					<div
						css={`
							align-items: flex-end;
							column-gap: 1rem;
							display: flex;
							grid-column: 1 / 3;
							align-items: center;
							margin-top: -1.25rem;
						`}
					>
						<ForecastFormControl
							key={`bases.${normType}${baseKey}.aValue`}
							inlineLabel='m'
							name={`${phase}.${normType}.bases.${baseKey}.aValue`}
							required
							disabled={disabled}
							type='number'
						/>

						<ForecastFormControl
							key={`bases.${baseKey}.bValue`}
							inlineLabel='b'
							name={`${phase}.${normType}.bases.${baseKey}.bValue`}
							required
							disabled={disabled}
							type='number'
						/>
					</div>

					<FormButton
						color='secondary'
						onClick={() => autoFit({ phase, normType })}
						variant='outlined'
						size='small'
					>
						Auto Fit
					</FormButton>
					{yUnits && (
						<FieldSection columns={1} css='grid-column: 1 / -1; & > * {margin: .5rem 0}'>
							<FormInfoText label={`Average ${yUnits.label}`} value={formatWithUnits(averageY, yUnits)} />
						</FieldSection>
					)}
					{yUnits && normalizationType === NORMALIZATION_TYPE.linear.value && (
						<FieldSection columns={1} css='grid-column: 1 / -1; & > * {margin: .5rem 0}'>
							<FormInfoText
								label={`Target ${getChainUnits(base.y).label}`}
								value={formatWithUnits(targetY, yUnits)}
							/>
							<FormInfoText
								label={`Delta ${getChainUnits(base.y).label}`}
								value={formatWithUnits(deltaY, yUnits)}
							/>
						</FieldSection>
					)}
				</FieldSection>
			)}
		</div>
	);
}

export default NormalizationPhaseSubForm;
