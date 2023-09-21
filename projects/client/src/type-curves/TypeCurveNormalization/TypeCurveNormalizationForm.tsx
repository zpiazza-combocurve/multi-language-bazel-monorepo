import { faExclamation } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box } from '@material-ui/core';
import { FormikProvider } from 'formik';
import _ from 'lodash';
import { transform } from 'lodash-es';
import { useMemo } from 'react';
import { css } from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Divider, FormikFields, InfoTooltipWrapper, MenuItem } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { PhaseSelectField } from '@/forecasts/manual/EditingLayout';
import { theme } from '@/helpers/styled';
import { unsavedWorkContinue, useUnsavedWork } from '@/helpers/unsaved-work';
import { formatValue } from '@/helpers/utilities';
import { getConvertFunc } from '@/inpt-shared/helpers/units';

import {
	NORMALIZATION_TYPE,
	NUMERICAL_HEADERS as NUMERICAL_HEADERS_INCLUDING_PLL,
	TYPE_OPTIONS,
	getBaseKey,
	getChainUnits,
	getLabel,
	getUnitsFromHeader,
	invertChain,
} from '../shared/utils';
import { TypeCurveStep } from '../types';

const NORM_OPTIONS = _.filter(TYPE_OPTIONS, ({ value }) => value !== 'two_factor');
// HACK perf_lateral_length belongs to eur vs pll base and will be excluded from eur vs numerical
const NUMERICAL_HEADERS = NUMERICAL_HEADERS_INCLUDING_PLL.filter((key) => key !== 'perf_lateral_length');

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const isTargetValid = (target: Record<string, any>, axis: TypeCurveStep.Base.Axis) =>
	target &&
	[axis.startFeature, ...axis.opChain.map(({ opFeature }) => opFeature)].every((key) => Number.isFinite(target[key]));

const Info = ({ label, value }) => (
	<Box display='flex' alignItems='baseline' justifyContent='space-between'>
		<span>{label}</span>
		<span>{value}</span>
	</Box>
);

const formStyles = css`
	& > *:not(:first-child) {
		margin-top: 16px;
	}
`;

const RangeField = ({ label, startInput, startLabel = '', endInput, endLabel = '', action }) => (
	<Box>
		{label}
		<Box display='flex' alignItems='baseline'>
			{startLabel && <Box mr={1}>{startLabel}</Box>}
			<Box maxWidth='7rem' clone>
				{startInput}
			</Box>
			{endLabel && <Box mx={1}>{endLabel}</Box>}
			<Box maxWidth='7rem' clone>
				{endInput}
			</Box>
			<Box ml='auto' clone>
				{action}
			</Box>
		</Box>
	</Box>
);

export function NormalizationForm({
	points,
	phaseType,
	fitSelectionFilter,

	handleReset = _.noop,
	handleNormalize = _.noop,
	handleSave = _.noop,
	handleAutoFit = _.noop,
	handleFitTrim = _.noop,
	handleNormalizeFilter = _.noop,

	base,
	bases,

	phase,
	onChangePhase,
	// disabledPhases = false,

	formik,

	target,
	targetX,
	averageX,
	averageY,
	r2Coefficient,
	hasChanged,
	disabled,
	isProximity = false,
}) {
	const { values } = formik;
	const { type, baseKey } = values;
	const baseValues = values.bases?.[baseKey] ?? {};

	const xUnits = getChainUnits(base.x);
	const yUnits = getChainUnits(base.y);

	const formatWithUnits = (value, units: typeof xUnits) => {
		if (!Number.isFinite(value)) {
			return 'N/A';
		}
		const { appUnit, userUnit } = units;
		const convert = getConvertFunc(appUnit, userUnit);
		const adjustedValue = formatValue(convert(value));
		const adjustedUnit = userUnit?.toUpperCase();
		if (!adjustedUnit) {
			return adjustedValue;
		}
		return `${adjustedValue} ${adjustedUnit}`;
	};

	const { aValue, bValue } = baseValues;
	const validFunction = Number.isFinite(aValue) && Number.isFinite(bValue);
	const validTarget = isTargetValid(target, base.x);

	const targetY = validFunction && validTarget ? aValue * targetX + bValue : undefined;
	const deltaY = validFunction && validTarget ? targetY - averageY : undefined;

	const isValid = type === NORMALIZATION_TYPE['1_to_1'].value || (validFunction && validTarget);

	const disabledPhases = useMemo(
		() =>
			transform(
				VALID_PHASES,
				(result, p) => {
					result[p] = phaseType[p] === 'ratio' && 'Normalization disabled for ratio';
				},
				{}
			),
		[phaseType]
	);

	const getAValueUnits = () => {
		if (type !== NORMALIZATION_TYPE.linear.value) {
			return undefined;
		}
		const invertedXUnits = getChainUnits(invertChain(base.x));
		if (!invertedXUnits.userUnit) {
			return yUnits;
		}
		return {
			appUnit: `${yUnits.appUnit}/${invertedXUnits.appUnit}`,
			userUnit: `${yUnits.userUnit}/${invertedXUnits.userUnit}`,
		};
	};

	useUnsavedWork(hasChanged);

	return (
		<FormikProvider value={formik}>
			{phaseType[phase] === 'rate' ? (
				<Box height='100%' display='flex' flexDirection='column' overflow='auto'>
					<div css={formStyles}>
						{!isProximity && (
							<PhaseSelectField
								value={phase as Phase}
								onChange={async (newPhase) => {
									if (await unsavedWorkContinue()) {
										onChangePhase(newPhase);
									}
								}}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
								disabledPhases={disabledPhases as any}
							/>
						)}
						<FormikFields.TextField
							name='type'
							label='Normalization Type'
							disabled={disabled}
							select
							fullWidth
						>
							{NORM_OPTIONS.map(({ label, value, tooltipTitle }) => (
								<MenuItem key={value} value={value}>
									<InfoTooltipWrapper tooltipTitle={tooltipTitle}>{label}</InfoTooltipWrapper>
								</MenuItem>
							))}
						</FormikFields.TextField>
						{type !== NORMALIZATION_TYPE.no_normalization.value && (
							<>
								<FormikFields.TextField
									name='baseKey'
									label='Base'
									disabled={disabled}
									select
									fullWidth
								>
									{bases.map((b) => {
										const key = getBaseKey(b);
										return (
											<MenuItem key={key} value={key}>
												{getChainUnits(b.y).label} vs. {getChainUnits(b.x).label}
											</MenuItem>
										);
									})}
								</FormikFields.TextField>
								{bases.find((b) => getBaseKey(b) === baseKey)?.x.startFeature ===
									'$NUMERICAL_HEADER' && (
									<FormikFields.TextField
										name={`bases.${baseKey}.numericalHeader`}
										label='Numerical Header'
										disabled={disabled}
										select
										fullWidth
									>
										{NUMERICAL_HEADERS.map((header) => (
											<MenuItem key={header} value={header}>
												{getLabel(header)}
											</MenuItem>
										))}
									</FormikFields.TextField>
								)}
							</>
						)}
					</div>
					<Box css={formStyles} flexGrow='1'>
						<Divider />
						{(type === NORMALIZATION_TYPE.linear.value || type === NORMALIZATION_TYPE.power_law.value) && (
							<>
								<RangeField
									label='Keep data between:'
									startLabel='P'
									startInput={
										<FormikFields.TextField
											nativeOnChange
											type='number'
											placeholder='From'
											inputProps={{ min: 0, step: 0.01 }} // TODO make sure this works, and use formik for errors
											name={`bases.${baseKey}.rangeStart`}
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									endLabel=' and '
									endInput={
										<FormikFields.TextField
											nativeOnChange
											name={`bases.${baseKey}.rangeEnd`}
											type='number'
											placeholder='To'
											inputProps={{ max: 1, step: 0.01 }}
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									action={
										<Button color='secondary' disabled={disabled} onClick={handleFitTrim}>
											Trim
										</Button>
									}
								/>
								<RangeField
									label='Fit Function:'
									startLabel='y = '
									startInput={
										<FormikFields.TextField
											nativeOnChange
											convert={getAValueUnits()}
											name={`bases.${baseKey}.aValue`}
											type='number'
											placeholder='a'
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									endLabel={type === NORMALIZATION_TYPE.linear.value ? ' x + ' : ' x ^ '}
									endInput={
										<FormikFields.TextField
											nativeOnChange
											convert={type === NORMALIZATION_TYPE.linear.value && yUnits}
											name={`bases.${baseKey}.bValue`}
											type='number'
											placeholder='b'
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									action={
										<Button color='secondary' disabled={disabled} onClick={handleAutoFit}>
											Auto Fit
										</Button>
									}
								/>
							</>
						)}
						{type !== 'no_normalization' && (
							<>
								<Box display='flex' alignItems='baseline'>
									Fit using {points.length} /{' '}
									{fitSelectionFilter.all.length -
										(fitSelectionFilter.filteredArray.length - points.length)}{' '}
									wells
									<Box ml='auto' clone>
										{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
										<Button disabled={disabled} onClick={fitSelectionFilter.resetFilter}>
											Reset
										</Button>
									</Box>
								</Box>
								{(type === NORMALIZATION_TYPE.power_law.value ||
									type === NORMALIZATION_TYPE.linear.value) && (
									<Info label='R2' value={formatValue(r2Coefficient, 'number')} />
								)}
								<Divider />
								<Info label={`Average ${xUnits.label}`} value={formatWithUnits(averageX, xUnits)} />
								<Info label={`Average ${yUnits.label}`} value={formatWithUnits(averageY, yUnits)} />
								<Divider />
								<Info
									label={`Target ${xUnits.label}`}
									value={
										<FormikFields.TextField
											nativeOnChange
											convert={xUnits}
											name={`target.${xUnits.key}`}
											type='number'
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
								/>
								{base.x.opChain.map(({ opFeature }) => (
									<Info
										key={opFeature}
										label={`Target ${getLabel(opFeature)}`}
										value={
											<FormikFields.TextField
												nativeOnChange
												convert={getUnitsFromHeader(opFeature)}
												name={`target.${opFeature}`}
												type='number'
												disabled={disabled}
												roundValue={isProximity}
											/>
										}
									/>
								))}
								{type === NORMALIZATION_TYPE.linear.value && (
									<>
										<Info
											label={`Target ${getChainUnits(base.y).label}`}
											value={formatWithUnits(targetY, yUnits)}
										/>
										<Info
											label={`Delta ${getChainUnits(base.y).label}`}
											value={formatWithUnits(deltaY, yUnits)}
										/>
									</>
								)}
								<Divider />
								<RangeField
									label={`Normalize wells with ${getChainUnits(base.x).label} between`}
									startInput={
										<FormikFields.TextField
											nativeOnChange
											name={`bases.${baseKey}.normalizationMin`}
											type='number'
											placeholder='Min'
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									endLabel=' and '
									endInput={
										<FormikFields.TextField
											nativeOnChange
											name={`bases.${baseKey}.normalizationMax`}
											type='number'
											placeholder='Max'
											disabled={disabled}
											roundValue={isProximity}
										/>
									}
									action={
										<Button color='secondary' disabled={disabled} onClick={handleNormalizeFilter}>
											Filter
										</Button>
									}
								/>
							</>
						)}
					</Box>
					<Box
						display='flex'
						justifyContent={isProximity ? 'flex-end' : 'space-around'}
						borderTop={`1px solid ${theme.borderColor}`}
						pb={1}
						pt={2}
						mt={isProximity ? 'auto' : undefined}
						width='100%'
					>
						{type === 'no_normalization' && (
							<Button
								variant={isProximity ? 'outlined' : undefined}
								color={isProximity ? 'secondary' : 'primary'}
								disabled={disabled || !isValid}
								onClick={handleReset}
							>
								Reset
							</Button>
						)}
						{type !== 'no_normalization' && (
							<Button
								variant={isProximity ? 'outlined' : undefined}
								color={isProximity ? 'secondary' : 'primary'}
								disabled={disabled || !isValid}
								onClick={handleNormalize}
								{...getTaggingProp('forecast', 'editingNormalizeProximity')}
							>
								Normalize
							</Button>
						)}
						{!isProximity && (
							<Button color='primary' disabled={disabled || !hasChanged} onClick={handleSave}>
								{hasChanged && (
									<span
										css={`
											color: ${theme.warningAlternativeColor};
											margin-right: 0.5rem;
										`}
									>
										<FontAwesomeIcon icon={faExclamation} />
									</span>
								)}
								Save
							</Button>
						)}
					</Box>
				</Box>
			) : (
				<div css='font-size:1rem'>Normalization not available for ratio forecast</div>
			)}
		</FormikProvider>
	);
}
