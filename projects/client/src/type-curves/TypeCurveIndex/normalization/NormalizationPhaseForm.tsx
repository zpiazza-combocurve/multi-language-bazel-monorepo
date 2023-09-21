import { faCopy } from '@fortawesome/pro-regular-svg-icons';
import { Divider } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { SelectionFilter } from '@/components/hooks';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton, InfoTooltipWrapper } from '@/components/v2';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import ForecastFormControl, {
	CustomSelectField,
	FormControlRangeField,
} from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { useDebounce, useDebouncedValue } from '@/helpers/debounce';
import { calculateR2Coefficient } from '@/helpers/math';
import { formatValue } from '@/helpers/utilities';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import SelectionActions from '@/type-curves/TypeCurveNormalization/SelectionActions';
import {
	EUR_HEADERS,
	NORMALIZATION_TYPE,
	PEAK_RATE_HEADERS,
	TYPE_OPTIONS,
	backwardcalculateChain,
	createFitPoints,
	getBaseKey,
	getChainUnits,
	getLabel,
	getNumericalHeaders,
	replaceVarsInAxis,
} from '@/type-curves/shared/utils';

import {
	FieldSection,
	FormButton,
	FormInfoText,
	PhaseFormCollapse,
	PhaseFormContainer,
	PhaseHeader,
} from '../shared/formLayout';
import { PhaseType } from '../types';
import NormalizationPhaseSubForm from './NormalizationPhaseSubForm';
import { useTypeCurveNormalization } from './TypeCurveNormalization';
import { formatWithUnits } from './helpers';
import useNormalizationForm from './useNormalizationForm';

export const replaceVarsInBase = (base, vars) => {
	return {
		...base,
		x: replaceVarsInAxis(base.x, vars),
		y: replaceVarsInAxis(base.y, vars),
	};
};

const usePhaseFormProps = ({
	bases,
	form,
	headersData,
	normType,
	phase,
	selectionFilters,
	wellsData,
	wellsNormalizationData,
}) => {
	const { watch } = form;
	const [baseKey, target_, type, parentType] = watch([
		`${phase}.${normType}.baseKey`,
		`${phase}.${normType}.target`,
		`${phase}.${normType}.type`,
		`${phase}.type`,
	]);

	const baseValues = watch(`${phase}.${normType}.bases.${baseKey}`);
	const [aValue, bValue, numericalHeader] = watch([
		`${phase}.${normType}.bases.${baseKey}.aValue`,
		`${phase}.${normType}.bases.${baseKey}.bValue`,
		`${phase}.${normType}.bases.${baseKey}.numericalHeader`,
	]);

	const rawBase = bases?.find((b) => getBaseKey(b) === baseKey) ?? bases?.[0];
	const base = useMemo(
		() =>
			rawBase &&
			replaceVarsInBase(rawBase, {
				PHASE_EUR: EUR_HEADERS[phase],
				NUMERICAL_HEADER: numericalHeader,
				PHASE_PEAK_RATE: PEAK_RATE_HEADERS[phase],
			}),
		[phase, rawBase, numericalHeader]
	);

	const xUnits = useMemo(() => (base ? getChainUnits(base.x) : undefined), [base]);
	const yUnits = useMemo(() => (base ? getChainUnits(base.y) : undefined), [base]);

	const target = useMemo(
		() => (!base ? target_ : { ...target_, [base.x.startFeature]: backwardcalculateChain(base.x)(target_ ?? {}) }),
		[target_, base]
	);

	const { averageX, averageY, points } = useMemo(
		() =>
			!(base && headersData && wellsData)
				? { averageX: 0, averageY: 0, points: [] }
				: createFitPoints({
						wellIds: selectionFilters[phase]?.filteredArray ?? [],
						getHeader: (wellId) => ({
							...(headersData.get(wellId) ?? {}),
							[EUR_HEADERS[phase]]: wellsData.get(wellId)?.eur?.[phase] ?? 0,
							[PEAK_RATE_HEADERS[phase]]: wellsData?.get(wellId)?.peak_rate?.[phase] ?? 0,
						}),
						base,
				  }),
		[base, headersData, phase, selectionFilters, wellsData]
	);

	const targetXPath =
		parentType === 'two_factor'
			? `${phase}.shared.target.${xUnits?.key}`
			: `${phase}.${normType}.target.${xUnits?.key}`;
	const targetX = watch(targetXPath);

	const r2Coefficient = useMemo(() => {
		if (aValue === undefined || bValue === undefined) {
			return undefined;
		}
		const yTrue = points.map((v) => v.point[1]);
		const yPred = points.map(
			(v) => (type === 'linear' ? aValue * v.point[0] + bValue : aValue * v.point[0] ** bValue)
			// TODO: make calculation more programmatic
		);

		return calculateR2Coefficient(yTrue, yPred);
	}, [points, aValue, bValue, type]);

	const wellsMultipliers = useMemo(
		() =>
			_.mapValues(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				_.keyBy((wellsNormalizationData as any)?.[phase], 'well') ?? {},
				(d) => d.multipliers?.[normType]
			),
		[normType, phase, wellsNormalizationData]
	);

	const wellsNominalMultipliers = useMemo(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		() => _.mapValues(_.keyBy((wellsNormalizationData as any)?.[phase], 'well') ?? {}, (d) => d.nominalMultipliers),
		[phase, wellsNormalizationData]
	);

	return {
		aValue,
		averageX,
		averageY,
		base,
		baseKey,
		baseValues,
		bValue,
		numericalHeader,
		points,
		r2Coefficient,
		target,
		targetX,
		type,
		wellsMultipliers,
		wellsNominalMultipliers,
		xUnits,
		yUnits,
	};
};

function NormalizationPhaseForm({
	autoFit,
	bases,
	form,
	handleAdjustType,
	handleCopyPhase,
	handleFitTrim,
	handleNormalizeFilter,
	phase,
	phaseFormProps,
	phaseType,
	customNumericalHeaders,
	selection,
}: Pick<
	ReturnType<typeof useTypeCurveNormalization>,
	'autoFit' | 'bases' | 'handleCopyPhase' | 'handleFitTrim' | 'handleNormalizeFilter' | 'phaseFormProps'
> &
	Pick<ReturnType<typeof useNormalizationForm>, 'handleAdjustType'> & {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		form: any;
		phase: Phase;
		phaseType: PhaseType;
		selection: SelectionFilter;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		customNumericalHeaders: any[];
	}) {
	const [open, setOpen] = useState<boolean>(true);
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
	const [normalizationType, formPhases] = watch([`${phase}.type`, 'phases']);

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

	const isTwoFactorNorm = useMemo(
		() => normalizationType === NORMALIZATION_TYPE.two_factor.value,
		[normalizationType]
	);

	const customHeaders = useMemo(() => {
		const oldHeaders = _.map(getNumericalHeaders(), (header) => ({
			label: getLabel(header),
			value: header,
		}));
		const projectCustomHeaders = customNumericalHeaders.map((el) => ({
			value: el.key,
			label: el.value,
			icon: <ColoredCircle $color={projectCustomHeaderColor} />,
		}));
		return oldHeaders.concat(projectCustomHeaders);
	}, [customNumericalHeaders]);

	return (
		<ForecastToolbarTheme>
			<PhaseHeader
				additionalActions={
					<SelectionActions
						clearCurrentActive
						disableActionsWithoutSelection
						iconsOnly={false}
						selection={selection}
						small
					/>
				}
				disabled={phaseType === 'ratio' && 'Normalization not available for ratio fits'}
				label={`${_.capitalize(phase)} (${_.capitalize(phaseType)})`}
				phase={phase}
				open={open}
				toggleOpen={() => setOpen((u) => !u)}
			/>

			<PhaseFormCollapse in={phaseType === 'rate' && formPhases[phase] && open}>
				{formPhases[phase] && (
					<PhaseFormContainer>
						<CustomSelectField
							label='Normalization Type'
							menuItems={TYPE_OPTIONS}
							name={`${phase}.type`}
							onChange={(value) => handleAdjustType({ phase, type: value })}
							required
							disabled={!formPhases[phase]}
							type='select'
						/>

						{NORMALIZATION_TYPE.two_factor.value === normalizationType && (
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
										// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
										onClick={selection.resetFilter}
										size='small'
										variant='outlined'
									>
										Reset
									</FormButton>
								</FieldSection>
								<Divider />
							</>
						)}

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
									disabled={!formPhases[phase]}
									type='select'
								/>

								{bases?.find((b) => getBaseKey(b) === baseKey)?.x.startFeature ===
									'$NUMERICAL_HEADER' && (
									<ForecastFormControl
										label='Numerical Header'
										name={`${phase}.eur.bases.${baseKey}.numericalHeader`}
										menuItems={customHeaders}
										disabled={!formPhases[phase]}
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
									disabled={!formPhases[phase]}
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
										disabled={!formPhases[phase]}
										type='number'
									/>

									<ForecastFormControl
										key={`eur.bases.${baseKey}.bValue`}
										inlineLabel='b'
										name={`${phase}.eur.bases.${baseKey}.bValue`}
										required
										disabled={!formPhases[phase]}
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
										// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
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
											disabled={!formPhases[phase]}
											type='number'
										/>

										{_.map(base.x.opChain, ({ opFeature }) => (
											<ForecastFormControl
												key={`eur.target.${opFeature}`}
												label={`Target ${getLabel(opFeature)}`}
												name={`${phase}.eur.target.${opFeature}`}
												disabled={!formPhases[phase]}
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
										disabled={!formPhases[phase]}
										type='number'
									/>

									<FormButton
										color='secondary'
										onClick={() => handleNormalizeFilter(phase, 'eur')}
										variant='outlined'
										disabled={!formPhases[phase]}
										size='small'
									>
										Filter
									</FormButton>
								</FieldSection>
							</>
						)}

						{isTwoFactorNorm && (
							<div>
								{xUnits && (
									<FieldSection columns={2}>
										<FormInfoText
											label={`Average ${xUnits.label}`}
											value={formatWithUnits(averageX, xUnits)}
										/>
										<ForecastFormControl
											inForm={false}
											key={`shared.target.${xUnits.key}`}
											name={`${phase}.shared.target.${xUnits.key}`}
											required
											disabled={!formPhases[phase]}
											inlineLabel={`Target ${xUnits.label}`}
											type='number'
										/>
									</FieldSection>
								)}
								<div
									css={`
										display: grid;
										grid-template-columns: calc(50% - 0.5rem) 1rem calc(50% - 0.5rem);
										padding-top: 1.5rem;
									`}
								>
									<NormalizationPhaseSubForm
										autoFit={autoFit}
										form={form}
										handleFitTrim={handleFitTrim}
										phase={phase}
										phaseFormProps={phaseFormProps}
										normType='qPeak'
										disabled={!formPhases[phase]}
										title='Peak Rate'
									/>
									<div css='display: flex; justify-content: center'>
										<Divider orientation='vertical' />
									</div>
									<NormalizationPhaseSubForm
										autoFit={autoFit}
										form={form}
										handleFitTrim={handleFitTrim}
										phase={phase}
										phaseFormProps={phaseFormProps}
										disabled={!formPhases[phase]}
										normType='eur'
										title='EUR'
									/>
								</div>
							</div>
						)}

						{normalizationType !== NORMALIZATION_TYPE.no_normalization.value && (
							<>
								<Divider />

								<section
									css={`
										align-items: center;
										column-gap: 0.5rem;
										display: flex;
									`}
								>
									<IconButton onClick={() => handleCopyPhase(phase)}>{faCopy}</IconButton>
									<InfoTooltipWrapper
										placeIconAfter
										tooltipTitle='Copies all settings to all phases except for values in the fit function'
									>
										<span
											css={`
												cursor: pointer;
											`}
											onClick={() => handleCopyPhase(phase)}
										>
											Copy Settings To All Phases
										</span>
									</InfoTooltipWrapper>
								</section>
							</>
						)}
					</PhaseFormContainer>
				)}
			</PhaseFormCollapse>
		</ForecastToolbarTheme>
	);
}

export default NormalizationPhaseForm;
export { usePhaseFormProps };
