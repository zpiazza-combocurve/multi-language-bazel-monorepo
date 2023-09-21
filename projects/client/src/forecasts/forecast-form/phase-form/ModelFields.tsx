import _ from 'lodash-es';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Divider, InfoTooltipWrapper } from '@/components/v2';
import { FieldHeader } from '@/components/v2/misc';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';

import ForecastFormControl, { FormControlRangeField, getFormControlRules } from '../ForecastFormControl';
import { ForecastType, FormPhase } from '../automatic-form/types';
import { FieldsContainer, FormCollapse, SectionContainer } from './layout';

const wellLifeMethodItems: Array<MenuItem> = [
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

const peakPreferenceItems: Array<MenuItem> = [
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

const peakSensitivityItems: Array<MenuItem> = [
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

export type WellLifeFieldItem = {
	label?: string;
	max?: number;
	menuItems?: Array<MenuItem>;
	min?: number;
	name: string;
	required?: boolean;
	tooltip?: string;
	type: 'select' | 'date' | 'number';
};

export const getWellLifeFields = ({ wellLifeMethod, wellLifeMin = 1 }): Array<WellLifeFieldItem> => [
	{
		name: 'well_life_dict.well_life_method',
		tooltip:
			'Restricts the total life of the well. The well will be considered shut-in when either the selected duration has elapsed or the provided production rate is reached.',
		label: 'Well Life',
		menuItems: wellLifeMethodItems,
		type: 'select',
		required: true,
	},
	wellLifeMethod === 'fixed_date'
		? { name: 'well_life_dict.fixed_date', label: 'Value', type: 'date', required: true }
		: { name: 'well_life_dict.num', label: 'Years', type: 'number', min: wellLifeMin, required: true },
];

const ModelFields = ({
	forecastType,
	open,
	phase,
	toggleOpen,
}: {
	open?: boolean;
	forecastType: ForecastType;
	phase: FormPhase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
}) => {
	const {
		clearErrors,
		formState: { errors },
		trigger,
		watch,
	} = useFormContext();

	const [axisCombo, modelName, wellLifeMethod, peakPreference] = watch([
		`${phase}.axis_combo`,
		`${phase}.model_name`,
		`${phase}.well_life_dict.well_life_method`,
		`${phase}.peak_preference`,
	]);

	const { params, viewOrder } = useMemo(() => formTemplates?.[axisCombo]?.[modelName], [axisCombo, modelName]);
	const parametersRender = useMemo(
		() =>
			viewOrder.map((param) => {
				const { dif, fieldDep, isInteger, label, labelTooltip, max, maxDep, menuItems, min, minDep, type } =
					params[param];
				const name = `${phase}.${param}`;

				const rules =
					minDep || maxDep
						? _.merge(getFormControlRules({ min, max, required: type !== 'boolean', isInteger }), {
								validate: {
									...(minDep?.length && {
										minDep: (value) => {
											const minName = `${phase}.${minDep}`;
											const minValue = watch(minName);
											if (Number(value) < minValue) {
												return `Value must not be less than ${minValue}`;
											}

											clearErrors(name);
											if (_.get(errors, minName)) {
												trigger(minName);
											}
										},
									}),
									...(maxDep?.length && {
										maxDep: (value) => {
											const maxName = `${phase}.${maxDep}`;
											const maxValue = watch(maxName);
											if (Number(value) > maxValue) {
												return `Value must not be greater than ${maxValue}`;
											}

											clearErrors(name);
											if (_.get(errors, maxName)) {
												trigger(maxName);
											}
										},
									}),
								},
						  })
						: getFormControlRules({ min, max, required: type !== 'boolean', isInteger });

				if (type === 'div') return <Divider css='grid-column: 1/ -1' />;

				return type === 'range' ? (
					<FormControlRangeField
						dif={dif}
						fieldDep={fieldDep?.length && `${phase}.${fieldDep}`}
						isInteger={isInteger}
						key={name}
						label={label}
						max={max}
						min={min}
						name={name}
						required
						tooltip={labelTooltip}
						type='number'
					/>
				) : (
					<ForecastFormControl
						key={name}
						label={label}
						menuItems={_.map(menuItems, (item) => ({ label: item, value: item }))}
						name={name}
						rules={rules}
						tooltip={labelTooltip}
						type={type}
					/>
				);
			}),
		[clearErrors, errors, params, phase, trigger, viewOrder, watch]
	);

	return (
		<>
			<FieldHeader label='Model Fields' open={open} toggleOpen={toggleOpen} />

			<FormCollapse in={open}>
				<FieldsContainer>
					<SectionContainer>{parametersRender}</SectionContainer>

					<Divider />

					<SectionContainer>
						{getWellLifeFields({ wellLifeMethod }).map((field) => {
							const { label, menuItems, min, name, required, tooltip, type } = field;
							const phaseName = `${phase}.${name}`;
							return (
								<ForecastFormControl
									key={phaseName}
									label={label}
									menuItems={menuItems}
									name={phaseName}
									rules={getFormControlRules({ min, required })}
									tooltip={tooltip}
									type={type}
								/>
							);
						})}

						{axisCombo === 'rate' && (
							<ForecastFormControl
								label='q Final'
								name={`${phase}.q_final`}
								rules={getFormControlRules({ min: 0, required: true })}
								type='number'
							/>
						)}
					</SectionContainer>

					<Divider />

					<SectionContainer>
						{forecastType === 'probabilistic' && (
							<ForecastFormControl
								label='Dispersion'
								name={`${phase}.dispersion`}
								rules={getFormControlRules({ min: 0.001, max: 10, required: true })}
								type='number'
							/>
						)}

						{axisCombo === 'rate' && (
							<ForecastFormControl
								label='Peak Preference'
								menuItems={peakPreferenceItems}
								name={`${phase}.peak_preference`}
								required
								tooltip='The method for selecting the peak production rate of the forecast.'
								type='select'
							/>
						)}

						{peakPreference === 'last' && (
							<ForecastFormControl
								label='Peak Sensitivity'
								menuItems={peakSensitivityItems}
								name={`${phase}.peak_sensitivity`}
								required
								tooltip='Affects how large a jump in production values is required before a peak is identified. Use Low sensitivity for noisy data and High sensitivity for clean data.'
								type='select'
							/>
						)}

						<ForecastFormControl
							label='Zero Forecast (Days from Today)'
							name={`${phase}.flat_forecast_thres`}
							rules={getFormControlRules({ min: 0, required: true })}
							tooltip='If there is no production data over this range, calculated from the date the autoforecast is run, then the well will be considered shut-in.'
							type='number'
						/>
					</SectionContainer>
				</FieldsContainer>
			</FormCollapse>
		</>
	);
};

export default ModelFields;
