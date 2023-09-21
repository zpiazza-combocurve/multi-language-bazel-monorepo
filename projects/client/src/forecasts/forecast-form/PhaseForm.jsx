/* eslint-disable complexity */
import { useFormikContext } from 'formik';
import _, { get } from 'lodash-es';
import { isValidElement } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { Centered, Divider, Toolbar } from '@/components';
import { Form } from '@/components/FormHelper';
import { SimpleSelectDialog } from '@/components/SimpleSelectDialog';
import { FormikCheckboxButton } from '@/components/formik-helpers';
import { InfoTooltipWrapper } from '@/components/v2';
import { fetchProjectForecasts } from '@/forecasts/api';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';
import { capitalize } from '@/helpers/text';
import { phases } from '@/helpers/zing';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';
import { fields as units } from '@/inpt-shared/display-templates/units/default-units.json';

import { axisComboItems as axisComboOptions, getModelItems } from './GeneralForm';
import { PhaseFormFields, useEnforcedSettings } from './shared';

export const wellLifeMethodOptions = [
	{
		label: 'From First Prod Date',
		value: 'duration_from_first_data',
	},
	{
		label: 'From Last Prod Date',
		value: 'duration_from_last_data',
	},
	{
		label: 'From Today',
		value: 'duration_from_today',
	},
	{
		label: 'Fixed End Date',
		value: 'fixed_date',
	},
];

export const wellLifeUnitOptions = [
	{
		label: 'Years',
		value: 'year',
	},
	{
		label: 'Months',
		value: 'month',
	},
	{
		label: 'Days',
		value: 'day',
	},
];

export const modeOptionsDate = [
	{
		label: 'First',
		value: 'first',
	},
	{
		label: 'Last',
		value: 'last',
	},
	{
		label: 'Absolute Range',
		value: 'absolute_range',
	},
	{
		label: 'All',
		value: 'all',
	},
	{
		label: 'Range from Header',
		value: 'header_range',
	},
];

export const modeOptionsWeight = [
	{
		label: 'First',
		value: 'first',
	},
	{
		label: 'Last',
		value: 'last',
	},
	{
		label: 'Absolute Range',
		value: 'absolute_range',
	},
	{
		label: 'No Weighting Applied',
		value: 'all',
	},
];

export const peakPreferenceArr = [
	{
		label: (
			<InfoTooltipWrapper tooltipTitle='Peak rate assigned to the first point in the forecast data set.'>
				Beginning Point
			</InfoTooltipWrapper>
		),
		value: 'start_point',
	},
	{
		label: (
			<InfoTooltipWrapper tooltipTitle='Detects step changes such as frac hits and shut-ins and sets the peak rate as the last step change in the forecast data set.'>
				Last Peak
			</InfoTooltipWrapper>
		),
		value: 'last',
	},
	{
		label: (
			<InfoTooltipWrapper tooltipTitle='Peak rate assigned to the maximum data point in the forecast data set.'>
				Max
			</InfoTooltipWrapper>
		),
		value: 'max',
	},
	{
		label: (
			<InfoTooltipWrapper tooltipTitle='Identifies the end of a constant production regime and sets the peak forecast rate to be that point.'>
				End Flat Point
			</InfoTooltipWrapper>
		),
		value: 'end_flat',
	},
	{
		label: (
			<InfoTooltipWrapper tooltipTitle='Combines Last Peak and End Flat Point to automatically identify the start of the final production regime, and sets the peak rate to be that point.'>
				Automatic (Beta)
			</InfoTooltipWrapper>
		),
		value: 'auto',
	},
];

export const peakSensitivityOptions = [
	{
		label: 'Low',
		value: 'low',
	},
	{
		label: 'Medium',
		value: 'mid',
	},
	{
		label: 'High',
		value: 'high',
	},
];

export const internalFilterOptions = [
	{
		label: 'None',
		value: 'none',
	},
	{
		label: 'Low',
		value: 'low',
	},
	{
		label: 'Medium',
		value: 'mid',
	},
	{
		label: 'High',
		value: 'high',
	},
	{
		label: 'Very High',
		value: 'very_high',
	},
];

const BORDER_COLOR = {
	oil: theme.oilColor,
	gas: theme.gasColor,
	water: theme.waterColor,
};

const Container = styled.div`
	width: 100%;
	border-radius: 5px;
	border: 1px solid;
	margin: 0.375rem 0;
	padding: 0.5rem;
	${({ $phase }) => `border-color: ${BORDER_COLOR[$phase] ?? theme.textColor};`}
`;

const PhaseDivider = styled(Divider)`
	width: 100%;
	margin: 0.25rem 0;
	background: ${({ phase }) => (phase === 'shared' ? theme.textColor : `var(--${phase}-color)`)};
`;

const rateUnit = '$PHASE';
const ratioUnit = '$PHASE/$BASEPHASE';

export function getDefaultUnit(unit, { values, phase }) {
	if (phase === 'shared') {
		return `${units.oil} & ${units.gas}`;
	}
	const { base_phase } = values;
	const header = unit.replace('$PHASE', phase).replace('$BASEPHASE', base_phase);
	return units[header];
}

function withUnit(phase, { oil, gas, water }) {
	if (phase === 'shared') {
		return ` (${oil} & ${gas})`;
	}
	return ` (${{ oil, gas, water }[phase]})`;
}

function adjustLabelWithUnit(label, unit, { values, phase }) {
	const defaultUnit = getDefaultUnit(unit, { values, phase });
	if (!defaultUnit) {
		// this shouldn't happen
		return label;
	}

	if (label === 'Flat Range') {
		return `${label} (${defaultUnit}):`;
	}
	return `${label} (${defaultUnit})`;
}

function getPhaseUnit({ values = {}, phase }) {
	const { axis_combo } = values;
	if (axis_combo === 'rate') {
		return getDefaultUnit(rateUnit, { values, phase });
	}
	return getDefaultUnit(ratioUnit, { values, phase });
}

function getFormField(param, { phase, values, applyAll }) {
	const { label: label_, dif, invalid, max, min, value: name, type, unit, requiresUnitTransform, ...rest } = param;

	const required = true;
	const label = requiresUnitTransform && unit ? adjustLabelWithUnit(label_, unit, { phase, values }) : label_;

	switch (type) {
		case 'range':
			return {
				type,
				label,
				name,
				min,
				max,
				invalid,
				dif,
				required,
				...rest,
			};
		case 'number':
			if (name === 'b_prior') {
				return {
					type,
					label,
					name,
					min: values.b[0] < 0 ? Math.abs(values.b[1]) : values.b[0],
					max: values.b[1] < 0 ? Math.abs(values.b[0]) : values.b[1],
					invalid,
					dif,
					required,
					...rest,
				};
			}

			return {
				type,
				label,
				name,
				min,
				max,
				invalid,
				dif,
				required,
				...rest,
			};
		case 'boolean':
			return { type, label, name, compact: !applyAll, ...rest };
		case 'select':
			return {
				type,
				label,
				name,
				min,
				max,
				invalid,
				dif,
				required,
				...rest,
			};
		default:
			return null;
	}
}

const HeaderContainer = styled.h3`
	font-size: 1.25rem;
	margin: 0;
`;

const Header = (props) => <Centered horizontal as={HeaderContainer} {...props} />;

export const getWellLifeFields = ({ well_life_dict, passedWellLifeMethodOptions = null, wellLifeMin = 1 }) => [
	{
		name: 'well_life_dict.well_life_method',
		labelTooltip:
			'Restricts the total life of the well. The well will be considered shut-in when either the selected duration has elapsed or the provided production rate is reached.',
		label: 'Well Life:',
		menuItems: passedWellLifeMethodOptions ?? wellLifeMethodOptions,
		required: true,
	},
	well_life_dict?.well_life_method === 'fixed_date'
		? { name: 'well_life_dict.fixed_date', label: 'Value:', type: 'date', required: true }
		: { name: 'well_life_dict.num', label: 'Years:', type: 'number', min: wellLifeMin },
];

function ninjaOptions({ values, phaseValues, phase }) {
	function lossFunction() {
		return [
			{
				label: 'Loss Function:',
				name: 'ninja.loss_function',
				menuItems: ['RMSE', 'R2', 'Relative Error', 'dq/ave q'],
				defaultValue: 'RMSE',
			},
		];
	}

	function proximityForecast() {
		const thresPercent = (label) => ({
			label: `${label}(%)`,
			name: `ninja-${label}`,
			type: 'range',
			min: -100,
			max: 100,
		});
		const thresValue = (label) => ({
			label: 'Value',
			name: `ninja-${label}-value`,
			type: 'range',
			min: -100000,
			max: 100000,
			defaultValue: 0,
		});
		const threshold = (label) => [thresPercent(label), thresValue(label)];
		if (!phaseValues.ninja_enable_proximity) {
			return [
				{
					label: 'Enable Proximity',
					name: 'ninja_enable_proximity',
					type: 'boolean',
					compact: false,
				},
			];
		}

		return [
			{
				label: 'Enable Proximity',
				name: 'ninja_enable_proximity',
				type: 'boolean',
				compact: false,
			},
			{
				label: 'Min Neighbor Well',
				name: 'ninja_min_neighbor_well',
				type: 'number',
				defaultValue: 1,
				min: 1,
				max: 20,
				compact: false,
			},
			...threshold('Perf Lateral Length Threshold'),
			...threshold('Prop/Pll Threshold'),
			...threshold('Fluid/Pll Threshold'),
			...threshold('TVD Threshold'),
			...threshold('Same Zone HR Well Spacing Threshold'),
			...threshold('Same Zone VR Well Spacing Threshold'),
			thresPercent('Landing Zone Text Similarity Threshold'),
		];
	}

	function autoTypeCurve() {
		return [
			{
				label: 'Enable Auto Type Curve:',
				name: 'ninja.enable_auto_type_curve_model',
				type: 'boolean',
				defaultValue: false,
				compact: values.applyAll,
			},
			{
				label: 'Auto Type Curve Model:',
				name: 'ninja.auto_type_curve_model',
				menuItems: [
					'Exp Incline + Arps (b = 2) + M Arps',
					'Exp Incline + Arps + M Arps',
					'Arps Incline + Arps + M Arps',
					'Exp Incline + M Arps',
					'Exp Incline + Exp Decline',
					'Arps Incline',
				],
				defaultValue: 'Exp Incline + Arps + M Arps',
				compact: values.applyAll,
			},
		];
	}

	function machineLearningForecast() {
		return [
			{
				label: 'Enable Machine Learning:',
				name: 'ninja.enable_forecast_machine_learning',
				type: 'boolean',
				compact: values.applyAll,
			},
			{
				label: 'Machine Learning Forecast Model',
				name: 'ninja.machine_learning_forecast_model',
				menuItems: ['Random Forecast v1', 'Random Forecast v2', 'Neural Net v1', 'Neural Net v2'],
				defaultValue: 'Random Forecast v1',
				compact: values.applyAll,
			},
		];
	}

	return [
		<PhaseDivider key='weight-fn-divider' phase={phase} />,
		<Header key='weight-fn-header'>Weight Function</Header>,
		<PhaseDivider key='weight-fn-divider-last' phase={phase} />,
		lossFunction(),
		<PhaseDivider key='proximity-forecast-divider' phase={phase} />,
		<Header key='proximity-forecast-header'>Proximity Forecast</Header>,
		proximityForecast(),
		<PhaseDivider key='proximity-forecast-divider-last' phase={phase} />,
		autoTypeCurve(),
		<PhaseDivider key='ninja-type-curve' phase={phase} />,
		machineLearningForecast(),
	]
		.flat()
		.filter(Boolean);
}

/**
 * @typedef Props
 * @property {string} phase
 * @property {'probabilistic' | 'deterministic'} forecastType
 * @property {boolean} [disableFilter]
 * @property {boolean} [rateOnly]
 * @property {boolean} [readOnly]
 * @property {boolean} [showType]
 * @property {boolean} [showModel]
 * @property {boolean} [showAdvanced]
 * @property {boolean} [showNinja] Advanced hidden options only for showing off
 * @param {Props} props
 */
export function PhaseForm({
	forecastType,
	phase,
	disableFilter = false,
	rateOnly = false,
	readOnly = false,
	showType = false,
	showModel = false,
	showAdvanced = false,
	showNinja = false,
}) {
	const { project } = useAlfa();
	const { values } = useFormikContext();
	const { advanced, [phase]: phaseValues = {} } = values;
	const { axis_combo, model_name, well_life_dict, peak_preference, time_dict } = phaseValues ?? {};

	const enforcedSettingsQuery = useEnforcedSettings(project._id);

	const { data: sameProjectForecasts } = useQuery(['forecast', 'all-forecast-in-project', project?._id], () =>
		fetchProjectForecasts(project?._id)
	);

	const availableFields = PhaseFormFields[axis_combo] ?? [];

	const { params, viewOrder } = formTemplates?.[axis_combo]?.[model_name] ?? {};

	const filterProps = { disabled: readOnly || disableFilter };

	const renderTimePeriod = () => {
		const mode = time_dict?.mode;
		return [
			{
				label: 'Date:',
				name: 'time_dict.mode',
				menuItems: modeOptionsDate,
				labelTooltip: 'Date range considered in forecast.',
				required: true,
				...filterProps,
			},
			(mode === 'first' || mode === 'last') && {
				label: mode === 'last' ? 'Last Duration (Months):' : 'First Duration (Months):',
				type: 'range',
				name: 'time_dict.num_range',
				dif: 0,
				max: time_dict?.unit === 'percent' ? 100 : Infinity,
				min: 1,
				required: true,
				...filterProps,
			},
			mode === 'absolute_range' && {
				type: 'date-range',
				name: 'time_dict.absolute_range',
				required: true,
			},
			mode === 'header_range' && {
				type: 'header-range-date',
				name: 'time_dict.header_range',
				required: true,
				labelTooltip: 'Choose 2 date headers and use data between the 2 dates.',
			},
		];
	};

	const [forecastDialog, selectForecast] = useDialog(SimpleSelectDialog);

	const showMatchEur =
		advanced &&
		axis_combo === 'rate' &&
		['arps_modified_wp', 'arps_modified_free_peak', 'arps_modified_fulford', 'arps_modified_fp_fulford'].includes(
			model_name
		) &&
		forecastType === 'deterministic';

	const renderMatchEUR = () => {
		if (!showMatchEur) {
			return [];
		}
		const { match_eur: { match_type } = {} } = phaseValues ?? {};
		const checkForecastId = get(phaseValues, 'match_eur.match_forecast_id');
		const selectedForecastId = sameProjectForecasts?.find(({ _id }) => _id === checkForecastId)
			? checkForecastId
			: null;
		return [
			{
				label: `Match EUR${withUnit(phase, {
					oil: units.oil_eur,
					gas: units.gas_eur,
					water: units.water_eur,
				})}`,
				name: 'match_eur.match_type',
				labelTooltip: match_type === 'forecast' && 'Match a previously forecasted EUR.',
				menuItems: [
					{ label: 'No Match', value: 'no_match' },
					{ label: 'Match Forecast', value: 'forecast' },
					{ label: 'Fixed Value', value: 'number' },
				],
				required: true,
				...filterProps,
			},
			match_type === 'number' && {
				type: 'number',
				name: 'match_eur.match_eur_num',
				required: true,
				...filterProps,
			},
			match_type === 'forecast' && {
				name: 'match_eur.match_forecast_id',
				type: 'async-select',
				label: selectedForecastId
					? `Forecast (${sameProjectForecasts?.find(({ _id }) => _id === selectedForecastId)?.name})`
					: 'Forecast',
				validate: (value) =>
					sameProjectForecasts?.find(({ _id }) => _id === value)?.name ? undefined : 'Must select a Forecast',
				checkValue: selectedForecastId,
				select: async () => {
					const selectedForecast = await selectForecast({
						title: 'Select Forecast',
						value: selectedForecastId,
						items: sameProjectForecasts.map((forecast) => ({
							value: forecast._id,
							key: forecast._id,
							primaryText: _.truncate(forecast.name, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }),
						})),
					});
					if (!selectedForecast) {
						return null;
					}
					return selectedForecast;
				},
			},
			match_type === 'forecast' && {
				label: 'Increase/Decrease EUR by Delta %',
				name: 'match_eur.match_percent_change',
				labelTooltip: 'Specify preferred increase or decrease (eg: -5% reduces EUR by 5 percent).',
				type: 'number',
				compact: true,
				required: true,
			},
			match_type === 'forecast' && {
				label: 'Match EUR Tolerance Window (+/- % EUR)',
				name: 'match_eur.error_percentage',
				labelTooltip:
					'Forecast will be within [Window]% of the matched EUR. Lower values will result in a closer EUR match at the expense of a weaker match to production data.',
				type: 'number',
				max: '100',
				min: '1',
				compact: true,
				required: true,
				default: 5,
			},
			match_type === 'number' && {
				label: 'Match EUR Tolerance Window (+/- % EUR)',
				name: 'match_eur.error_percentage',
				labelTooltip:
					'Forecast will be within [Window]% of the matched EUR. Lower values will result in a closer EUR match at the expense of a weaker match to production data.',
				type: 'number',
				max: '100',
				min: '1',
				compact: true,
				required: true,
				default: 5,
			},
		];
	};
	const renderLowData = () => {
		const lowDataFields = [
			{
				label: 'Require Minimum Amount of Data To Forecast',
				name: 'use_minimum_data',
				type: 'boolean',
				compact: 'true',
				required: 'true',
				labelTooltip:
					'If checked, forecast generation requires the indicated number of data points within the entire production history. Lower amounts of production data will generate a warning, and no forecast will be given.',
			},
			{
				label: 'Minimum Production Data (# of Data Points)',
				name: 'short_prod_threshold',
				type: 'number',
				compact: true,
				required: true,
				isInteger: true,
				min: 0,
			},
			{
				label: 'Enable Historically Informed Forecast',
				name: 'use_low_data_forecast',
				type: 'boolean',
				compact: true,
				required: true,
				labelTooltip:
					'If checked, forecasts with low amounts of production data after the identified peak will be matched to the historical trend. The identified range and up to 5 years of history will be used to inform the forecast. If unchecked, forecasts will not be generated from fewer than two data points.',
			},
			{
				label: 'Low Data Threshold (# of Data Points)',
				name: 'low_data_threshold',
				type: 'number',
				compact: true,
				required: false,
				isInteger: true,
				labelTooltip:
					'If the number of data points from the identified peak to the end of production data is equal to or smaller than the Low Data Threshold, then the Historically Informed Forecast is used. E.g., at a Low Data Threshold of 4, the Historically Informed Forecast will be used for 4 data points, but not 5. If no value is given, defaults to a threshold of 3 data points for monthly data and 32 data points for daily data.',
			},
		];
		if (!showMatchEur) {
			return lowDataFields.slice(0, 2);
		} else {
			return lowDataFields;
		}
	};
	const showWeight = advanced && forecastType === 'deterministic';
	const renderWeight = () => {
		if (!showWeight) {
			return [];
		}
		const { weight_dict: weightDict } = phaseValues ?? {};
		const mode = weightDict?.mode;
		return [
			{
				label: 'Weighting Date Range:',
				name: 'weight_dict.mode',
				menuItems: modeOptionsWeight,
				labelTooltip: 'Choose the range of data to weight.',
				required: true,
				defaultValue: 'all',
			},
			(mode === 'first' || mode === 'last') && {
				label: mode === 'last' ? 'Last Duration (Months):' : 'First Duration (Months):',
				type: 'range',
				name: 'weight_dict.num_range',
				dif: 0,
				max: weightDict?.unit === 'percent' ? 100 : Infinity,
				min: 1,
				required: true,
			},
			mode === 'absolute_range' && {
				type: 'date-range',
				name: 'weight_dict.absolute_range',
				required: true,
			},
			mode !== 'all' && {
				type: 'number',
				required: true,
				label: 'Value:',
				name: 'weight_dict.value',
				defaultValue: 1,
				labelTooltip:
					'Choose a value for weighting the regression. Use a value of 10 to honor the selected range more than the remaining data. Use a value of 0.1 to honor the remaining data more than the selected range. A value equal to 1 will have no affect on the regression.',
				min: 0.01,
				max: 100,
			},
		];
	};

	const advancedFields = [
		'match_eur.match_type',
		'match_eur.match_forecast_id',
		'match_eur.match_percent_change',
		'match_eur.match_eur_num',
		'well_life_dict.well_life_method',
		'well_life_dict.fixed_date',
		'well_life_dict.num',
		'weight_dict.mode',
		'weight_dict.num_range',
		'weight_dict.absolute_range',
		'weight_dict.value',
		'D_lim_eff',
		'enforce_sw',
		'q_final',
		'flat_forecast_thres',
		'percentile_range',
		'value_range',
		'moving_average_days',
		'dispersion',
	];

	const phaseUnit = getPhaseUnit({ values: phaseValues, phase });

	return (
		<Container $phase={phase}>
			<Toolbar
				center={<HeaderContainer>{phase === 'shared' ? 'All Phases' : capitalize(phase)}</HeaderContainer>}
				right={
					showAdvanced && (
						<FormikCheckboxButton name='advanced' offLabel='Simple' onLabel='Advanced' plain raised />
					)
				}
			/>
			<Form
				namePrefix={`${phase}.`}
				compact
				disabled={readOnly}
				filter={({ name }) => (advanced ? true : !advancedFields.includes(name))}
				fields={[
					!rateOnly &&
						showType && {
							name: 'axis_combo',
							label: 'Forecast Type',
							menuItems: axisComboOptions,
							compact: true,
							required: true,
							labelTooltip:
								'Choose whether to forecast directly from production rates or from a ratio of two production streams. When using a ratio forecast, the base stream should be given a rate forecast.',
						},
					showModel && {
						name: 'model_name',
						label: 'Model:',
						menuItems: getModelItems({
							forecastType,
							formTemplates,
							axisCombo: axis_combo,
						}),
						compact: true,
						required: true,
					},
					availableFields.includes('base_phase') && {
						name: 'base_phase',
						label: 'Base Phase:',
						labelTooltip: 'The forecast will be made from the ratio of production data with this stream.',
						menuItems: phases.filter((p) => p.value !== phase),
						required: true,
					},
					availableFields.includes('base_phase') && <PhaseDivider key='base-phase-divider' phase={phase} />,
					...(viewOrder?.map?.((param) =>
						getFormField(params[param], { phase, values: phaseValues, applyAll: values?.applyAll })
					) ?? []),
					advanced && <PhaseDivider key='view-order-divider' phase={phase} />,
					// well life
					...getWellLifeFields({ well_life_dict }),
					availableFields.includes('q_final') && {
						name: 'q_final',
						label: `q Final (${phaseUnit}):`,
						type: 'number',
						min: 0,
						required: true,
						compact: false,
					},
					advanced && <PhaseDivider key='well-life-divider' phase={phase} />,
					rateOnly &&
						availableFields.includes('dispersion') && {
							label: 'Dispersion:',
							name: 'dispersion',
							type: 'number',
							max: 10,
							min: 0.001,
							required: true,
						},
					availableFields.includes('peak_preference') && {
						label: 'Peak Preference:',
						name: 'peak_preference',
						menuItems: peakPreferenceArr,
						required: true,
						labelTooltip: 'The method for selecting the peak production rate of the forecast.',
					},
					peak_preference === 'last' && {
						labelTooltip:
							'Affects how large a jump in production values is required before a peak is identified. Use Low sensitivity for noisy data and High sensitivity for clean data.',
						label: 'Peak Sensitivity:',
						name: 'peak_sensitivity',
						menuItems: peakSensitivityOptions,
						required: true,
					},
					availableFields.includes('flat_forecast_thres') && {
						label: 'Zero Forecast (Days from Today):',
						name: 'flat_forecast_thres',
						type: 'number',
						min: 0,
						required: true,
						labelTooltip:
							'If there is no production data over this range, calculated from the date the autoforecast is run, then the well will be considered shut-in.',
					},
					<PhaseDivider key='filters-divider' phase={phase} />,
					<Header key='filter-option-header'>
						<InfoTooltipWrapper tooltipTitle='Filtering data is done prior to finding peak and determines what data is used for curve fitting.'>
							Filter Options
						</InfoTooltipWrapper>
					</Header>,
					availableFields.includes('internal_filter') && {
						label: 'Data Density:',
						name: 'internal_filter',
						menuItems: internalFilterOptions,
						compact: true,
						required: true,
						labelTooltip:
							'Filter to remove outliers. Use higher filter levels for noisier data, and lower levels for cleaner data.',
						...filterProps,
					},
					availableFields.includes('remove_0') && {
						label: 'Remove zero values',
						name: 'remove_0',
						type: 'boolean',
						compact: true,
						required: true,
						labelTooltip: 'If checked, zero production values are removed prior to generating forecast.',
						...filterProps,
					},
					...renderTimePeriod(),
					availableFields.includes('value_range') && {
						name: 'value_range',
						type: 'range',
						labelTooltip: 'Data outside the specified range are ignored.',
						label: `Value (${phaseUnit}):`,
						dif: 0.01,
						min: 0,
						required: true,
						...filterProps,
					},
					availableFields.includes('percentile_range') && {
						labelTooltip: 'Retains data within the specified percentile range.',
						label: 'Percentile(%):',
						name: 'percentile_range',
						type: 'range',
						dif: 0.01,
						max: 100,
						min: 0,
						required: true,
						...filterProps,
					},
					availableFields.includes('moving_average_days') && {
						label: 'Moving Average (Days)',
						name: 'moving_average_days',
						type: 'number',
						compact: true,
						required: true,
						min: 0,
						isInteger: true,
						default: 0,
						labelTooltip:
							'Used to improve fit for infrequent sales data or erratic production. Prior to fit, this function averages each production value landing in the preceding number of days to smooth the data. For monthly data, use a conversion factor of 30 days to 1 month. E.g., use 90 days to smooth three months of monthly data, or 10 days to smooth daily data. A setting of 0 days preserves the original data.',
						...filterProps,
					},
					showWeight && <PhaseDivider key='weight-divider' phase={phase} />,
					showWeight && (
						<Header key='weight-header'>
							<InfoTooltipWrapper tooltipTitle='Uses weighted regression to fit the forecast model to production data. Useful for forecasting wells with multiple production regimes. Place a high weight on a production regime to cause the forecast to honor those data. Or, place a low weight on noisy data to cause the forecast to honor the remaining data.'>
								Weighting Data
							</InfoTooltipWrapper>
						</Header>
					),
					renderWeight(),
					showMatchEur && <PhaseDivider key='match-eur-header-divider' phase={phase} />,
					showMatchEur && (
						<Header key='match-eur-header'>
							<InfoTooltipWrapper tooltipTitle='Forecast will be made to match the production data, while also fitting the supplied EUR.'>
								EUR Restrictions
							</InfoTooltipWrapper>
						</Header>
					),
					...renderMatchEUR(),
					advanced && <PhaseDivider key='low-data-divider' phase={phase} />,

					advanced && (
						<Header key='low-data-header'>
							<InfoTooltipWrapper tooltipTitle='Modify thresholds for forecasting low amounts of production data.'>
								Low Data Forecast Settings
							</InfoTooltipWrapper>
						</Header>
					),
					advanced && renderLowData(),
					showNinja && ninjaOptions({ phaseValues, phase, values }),
				]
					.flat()
					.map((el) => {
						if (isValidElement(el)) {
							return el;
						}
						if (!el?.name) {
							return el;
						}
						return {
							...el,
							disabled: get(enforcedSettingsQuery.data, `${phase}.${el.name}`) !== undefined,
						};
					})}
			/>
			{forecastDialog}
		</Container>
	);
}
