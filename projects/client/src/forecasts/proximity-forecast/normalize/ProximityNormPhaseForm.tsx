import { Divider } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';

import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import ForecastFormControl, {
	CustomSelectField,
	FormControlRangeField,
} from '@/forecasts/forecast-form/ForecastFormControl';
import { useDebounce, useDebouncedValue } from '@/helpers/debounce';
import { formatValue } from '@/helpers/utilities';
import { formatWithUnits } from '@/type-curves/TypeCurveIndex/normalization/helpers';
import {
	FieldSection,
	FormButton,
	FormInfoText,
	PhaseFormContainer,
} from '@/type-curves/TypeCurveIndex/shared/formLayout';
import {
	NORMALIZATION_TYPE,
	TYPE_OPTIONS,
	getBaseKey,
	getChainUnits,
	getLabel,
	getNumericalHeaders,
} from '@/type-curves/shared/utils';

function NormalizationPhaseForm({
	autoFit,
	bases,
	form,
	handleFitTrim,
	handleNormalizeFilter,
	phase,
	phaseFormProps,
	selection,
}) {
	const {
		aValue: aValue_,
		averageX,
		averageY,
		base,
		baseKey,
		bValue: bValue_,
		numericalHeader,
		points,
		r2Coefficient,
		targetX: targetX_,
		xUnits,
		yUnits,
	} = phaseFormProps[phase].eur;

	const [aValue, bValue, targetX] = useDebouncedValue([aValue_, bValue_, targetX_], 500);

	const { watch } = form;
	const [normalizationType] = watch([`${phase}.eur.type`]);

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
			debouncedAutoFit({ checkSaved: true, phase, normType: 'eur' });
		}
	}, [baseKey, debouncedAutoFit, normalizationType, numericalHeader, phase, points]);

	// remove when two factor norm is supported in proximity
	const typeOptions = TYPE_OPTIONS.filter((option) => option.value !== NORMALIZATION_TYPE.two_factor.value);

	return (
		<ForecastToolbarTheme>
			<PhaseFormContainer>
				<CustomSelectField
					label='Normalization Type'
					menuItems={typeOptions}
					name={`${phase}.eur.type`}
					required
					type='select'
				/>
				{![NORMALIZATION_TYPE.no_normalization.value, NORMALIZATION_TYPE.two_factor.value].includes(
					normalizationType
				) && (
					<>
						<ForecastFormControl
							label='Base'
							menuItems={_.map(bases, (b) => ({
								label: `${getChainUnits(b.y).label} vs. ${getChainUnits(b.x).label}`,
								value: getBaseKey(b),
							}))}
							name={`${phase}.eur.baseKey`}
							required
							type='select'
						/>

						{bases?.find((b) => getBaseKey(b) === baseKey)?.x.startFeature === '$NUMERICAL_HEADER' && (
							<ForecastFormControl
								label='Numerical Header'
								name={`${phase}.eur.bases.${baseKey}.numericalHeader`}
								menuItems={_.map(getNumericalHeaders(), (header) => ({
									label: getLabel(header),
									value: header,
								}))}
								type='select'
							/>
						)}
					</>
				)}

				{(normalizationType === NORMALIZATION_TYPE.linear.value ||
					normalizationType === NORMALIZATION_TYPE.power_law.value) && (
					<FieldSection>
						<FormControlRangeField
							dif={0.01}
							endLabel='P Max'
							endName={`${phase}.eur.bases.${baseKey}.rangeEnd`}
							label='Keep data between:'
							max={1}
							min={0}
							startLabel='P Min'
							startName={`${phase}.eur.bases.${baseKey}.rangeStart`}
							type='number'
						/>

						<FormButton
							color='secondary'
							onClick={() => handleFitTrim(phase, 'eur')}
							size='small'
							variant='outlined'
						>
							Trim
						</FormButton>

						<div
							css={`
								align-items: flex-end;
								column-gap: 1rem;
								display: flex;
								grid-column: 1 / 3;
							`}
						>
							<ForecastFormControl
								key={`eur.bases.${baseKey}.aValue`}
								inlineLabel='m'
								label={`Fit Function: (y = ${
									normalizationType === NORMALIZATION_TYPE.linear.value ? 'mx + b' : 'mx^b'
								})`}
								name={`${phase}.eur.bases.${baseKey}.aValue`}
								required
								type='number'
							/>

							<ForecastFormControl
								key={`eur.bases.${baseKey}.bValue`}
								inlineLabel='b'
								name={`${phase}.eur.bases.${baseKey}.bValue`}
								required
								type='number'
							/>
						</div>

						<FormButton
							color='secondary'
							onClick={() => autoFit({ phase, normType: 'eur' })}
							variant='outlined'
							size='small'
						>
							Auto Fit
						</FormButton>
					</FieldSection>
				)}

				{![NORMALIZATION_TYPE.no_normalization.value, NORMALIZATION_TYPE.two_factor.value].includes(
					normalizationType
				) && (
					<>
						<Divider />

						<FieldSection columns={2}>
							<div
								css={`
									align-items: center;
									display: flex;
								`}
							>
								Fit using {points.length} / {selection.allSize}
							</div>

							<FormButton
								color='secondary'
								onClick={selection.resetFilter}
								size='small'
								variant='outlined'
							>
								Reset
							</FormButton>

							{(normalizationType === NORMALIZATION_TYPE.power_law.value ||
								normalizationType === NORMALIZATION_TYPE.linear.value) && (
								<span>R2: {formatValue(r2Coefficient, 'number')}</span>
							)}
						</FieldSection>

						<Divider />

						{xUnits && yUnits && (
							<FieldSection columns={2}>
								<FormInfoText
									label={`Average ${xUnits.label}`}
									value={formatWithUnits(averageX, xUnits)}
								/>

								<FormInfoText
									label={`Average ${yUnits.label}`}
									value={formatWithUnits(averageY, yUnits)}
								/>
							</FieldSection>
						)}

						<Divider />

						{xUnits && (
							<FieldSection>
								<ForecastFormControl
									key={`eur.target.${xUnits.key}`}
									label={`Target ${xUnits.label}`}
									name={`${phase}.eur.target.${xUnits.key}`}
									required
									type='number'
								/>

								{_.map(base.x.opChain, ({ opFeature }) => (
									<ForecastFormControl
										key={`eur.target.${opFeature}`}
										label={`Target ${getLabel(opFeature)}`}
										name={`${phase}.eur.target.${opFeature}`}
										type='number'
									/>
								))}
							</FieldSection>
						)}

						{yUnits && normalizationType === NORMALIZATION_TYPE.linear.value && (
							<FieldSection columns={2}>
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

						<Divider />

						<FieldSection>
							<FormControlRangeField
								endLabel='Max'
								endName={`${phase}.eur.bases.${baseKey}.normalizationMax`}
								label={`Normalize wells with ${getChainUnits(base.x).label} between`}
								startLabel='Min'
								startName={`${phase}.eur.bases.${baseKey}.normalizationMin`}
								type='number'
							/>

							<FormButton
								color='secondary'
								onClick={() => handleNormalizeFilter(phase, 'eur')}
								variant='outlined'
								size='small'
							>
								Filter
							</FormButton>
						</FieldSection>
					</>
				)}
			</PhaseFormContainer>
		</ForecastToolbarTheme>
	);
}

export default NormalizationPhaseForm;
