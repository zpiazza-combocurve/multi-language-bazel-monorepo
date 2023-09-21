import { TextFieldProps, useTheme } from '@material-ui/core';
import _ from 'lodash-es';
import { useContext, useEffect, useMemo } from 'react';
import { FieldValues, UseControllerProps, useController, useFormContext } from 'react-hook-form';

import { isValidInteger } from '@/components';
import {
	InfoTooltipWrapper as BaseTooltipWrapper,
	CheckboxField,
	RHFAutocomplete,
	RHFCheckboxField,
	RHFNumberField,
	RHFReactDatePicker,
	RHFSelectField,
} from '@/components/v2';
import { CheckboxFieldProps } from '@/components/v2/CheckboxField';
import { LabeledFieldContainer, SelectField } from '@/components/v2/misc';
import { InfoTooltipWrapperProps } from '@/components/v2/misc/InfoIcon';
import { MenuItem, SelectFieldProps } from '@/components/v2/misc/SelectField';
import { FieldLabel } from '@/forecasts/forecast-form/phase-form/layout';
import { numberWithCommas } from '@/helpers/utilities';

import { EnforcedForecastSettingsContext } from './EnforcedForecastSettings';

export type ControlType = 'autocomplete' | 'boolean' | 'date' | 'number' | 'select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface ForecastFormControlProps<T extends FieldValues = any> extends Omit<UseControllerProps<T>, 'control'> {
	disabled?: boolean;
	fieldColumnSpan?: number;
	fullWidth?: boolean;
	getOptionLabel?: (value) => string;
	inForm?: boolean;
	inlineLabel?: string;
	label?: string | JSX.Element;
	menuItems?: Array<MenuItem>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: Array<any>;
	required?: boolean;
	size?: TextFieldProps['size'];
	tooltip?: string;
	type: ControlType;
}

const getMaxRule = (value: number) => ({
	max: { value, message: `Value must be less than ${numberWithCommas(value)}` },
});
const getMinRule = (value: number) => ({ min: { value, message: `Value must be greater than ${value}` } });
const getIsIntegerRule = (required?: boolean) => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	isInteger: (value: any) => {
		const ret = isValidInteger(Number(value), required);
		return ret?.length ? ret : true;
	},
});

const REQUIRED_RULE = { required: { value: true, message: 'This field is required' } };

const getFormControlRules = ({
	isInteger,
	min,
	max,
	required,
}: {
	isInteger?: boolean;
	min?: number;
	max?: number;
	required?: boolean;
}) => {
	return {
		...(min && getMinRule(min)),
		...(max && getMaxRule(max)),
		...(required && REQUIRED_RULE),
		validate: {
			...(isInteger && getIsIntegerRule(required)),
		},
	};
};

const InfoTooltipWrapper = ({ type, ...rest }: InfoTooltipWrapperProps & { type?: string }) => {
	const theme = useTheme();

	const color = useMemo(() => {
		if (type === 'boolean') {
			return theme.palette.text.primary;
		}
		if (theme.palette.type === 'light') {
			return 'rgba(0, 0, 0, 0.75)';
		}
		return theme.palette.text.secondary;
	}, [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.type, type]);

	return <BaseTooltipWrapper {...rest} iconColor={color} />;
};

const CustomBooleanField = ({
	label,
	name: nameInput,
	onChange,
	...rest
}: Omit<CheckboxFieldProps, 'onChange'> & {
	name: string;
	onChange?: (value: boolean) => void;
}) => {
	const { control } = useFormContext();
	const {
		field: { name, onChange: fieldOnChange, ref, value },
	} = useController({ name: nameInput, control });

	return (
		<CheckboxField
			checked={value}
			inputRef={ref}
			label={label}
			labelPlacement='end'
			name={name}
			onChange={(_ev, newValue) => (onChange ?? fieldOnChange)(newValue)}
			size='small'
			{...rest}
		/>
	);
};

const CustomSelectField = ({
	fullWidth,
	label,
	menuItems,
	name: nameInput,
	onChange,
	tooltip,
	disabled,
	...rest
}: Omit<SelectFieldProps, 'onChange'> & {
	fullWidth?: boolean;
	name: string;
	onChange?: (value) => void;
	disabled?: boolean;
	tooltip?: string;
}) => {
	const { control, unregister } = useFormContext();
	const {
		field: { name, onChange: fieldOnChange, ref, value },
	} = useController({
		name: nameInput,
		control,
		rules: { ...REQUIRED_RULE },
	});

	useEffect(() => {
		if (disabled) {
			unregister(name);
		}
	}, [disabled, name, unregister]);

	return (
		<LabeledFieldContainer fullWidth={fullWidth}>
			<InfoTooltipWrapper tooltipTitle={tooltip}>
				<FieldLabel>{label}</FieldLabel>
			</InfoTooltipWrapper>

			<SelectField
				inputRef={ref}
				menuItems={menuItems}
				name={name}
				onChange={(ev) => (onChange ?? fieldOnChange)(ev.target.value)}
				size='small'
				value={value}
				variant='outlined'
				{...rest}
			/>
		</LabeledFieldContainer>
	);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function ForecastFormControl<T extends FieldValues = any>({
	disabled,
	fieldColumnSpan,
	fullWidth,
	getOptionLabel,
	inForm = true,
	inlineLabel,
	label,
	menuItems,
	name,
	options,
	required,
	rules,
	size = 'small',
	tooltip,
	type,
}: ForecastFormControlProps<T>) {
	const { enforcedPathsArray } = useContext(EnforcedForecastSettingsContext);
	const defaultRules = type === 'number' ? { max: 1e9 } : null;

	const sharedProps = _.pickBy(
		{
			disabled: (enforcedPathsArray?.includes(name) && 'This field is company enforced') || disabled,
			label: inlineLabel,
			name,
			rules: _.merge(getFormControlRules({ required, ...defaultRules }), rules),
			size,
			variant: 'outlined',
		},
		(prop) => prop !== null
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) as any;

	const { unregister } = useFormContext();
	useEffect(() => {
		if (disabled) {
			unregister(name, { keepValue: true });
		}
	}, [disabled, unregister, name]);

	const labelRender = label ? (
		<InfoTooltipWrapper type={type} tooltipTitle={tooltip}>
			<FieldLabel type={type}>{label}</FieldLabel>
		</InfoTooltipWrapper>
	) : (
		<span
			css={`
				height: ${inForm ? '1rem' : 'unset'};
			`}
		/>
	);

	switch (type) {
		case 'boolean':
			return (
				<LabeledFieldContainer fullWidth={fullWidth} fieldColumnSpan={fieldColumnSpan}>
					{inForm && <span css='height: 1rem' />}
					<RHFCheckboxField {...sharedProps} label={labelRender} />
				</LabeledFieldContainer>
			);
		case 'number':
			return (
				<LabeledFieldContainer fullWidth={fullWidth} fieldColumnSpan={fieldColumnSpan}>
					{labelRender}
					<RHFNumberField {...sharedProps} blurOnEnter />
				</LabeledFieldContainer>
			);
		case 'date':
			return (
				<LabeledFieldContainer fullWidth={fullWidth} fieldColumnSpan={fieldColumnSpan}>
					{labelRender}
					<RHFReactDatePicker {...sharedProps} asUtc />
				</LabeledFieldContainer>
			);
		case 'select':
			return (
				<LabeledFieldContainer fullWidth={fullWidth} fieldColumnSpan={fieldColumnSpan}>
					{labelRender}
					<RHFSelectField {...sharedProps} menuItems={menuItems} />
				</LabeledFieldContainer>
			);
		case 'autocomplete':
			return (
				<LabeledFieldContainer fullWidth={fullWidth} fieldColumnSpan={fieldColumnSpan}>
					{labelRender}
					<RHFAutocomplete
						{...sharedProps}
						blurOnEnter
						disableClearable
						options={options}
						getOptionLabel={getOptionLabel}
					/>
				</LabeledFieldContainer>
			);
		default:
			return null;
	}
}

function FormControlRangeField({
	fieldColumnSpan = 1,
	dif,
	disabled,
	endLabel,
	endName: inputEndName,
	fieldDep,
	isInteger,
	label,
	max,
	min,
	name,
	required,
	startLabel,
	startName: inputStartName,
	tooltip,
	type,
	...rest
}: {
	dif?: number;
	disabled?: boolean;
	endLabel?: string;
	endName?: string;
	fieldColumnSpan?: number;
	fieldDep?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getOptionLabel?: any;
	isInteger?: boolean;
	label?: string;
	max?: number;
	min?: number;
	name?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options?: any;
	required?: boolean;
	startLabel?: string;
	startName?: string;
	tooltip?: string;
	type: ControlType;
}) {
	const {
		clearErrors,
		formState: { errors },
		trigger,
		watch,
	} = useFormContext();

	const startName = useMemo(() => inputStartName ?? `${name}.0`, [inputStartName, name]);
	const endName = useMemo(() => inputEndName ?? `${name}.1`, [inputEndName, name]);

	const rulesProps = useMemo(() => {
		if (type === 'number') {
			return { isInteger, min, max, required };
		}
		return { required };
	}, [isInteger, max, min, required, type]);

	const minRules = useMemo(
		() =>
			_.merge(getFormControlRules(rulesProps), {
				validate: {
					minValue: (value) => {
						if (type === 'number') {
							if (typeof min !== 'undefined' && value < min) {
								return `Value must be greater than ${min === 0 ? '0.00001' : min}`;
							}
						}
					},
					maxRange: (value) => {
						const endValue = watch(endName);
						if (type === 'number') {
							const startNumber = Number(value);
							const endNumber = Number(endValue);
							if (startNumber > endNumber) {
								return 'Value must be less than max';
							}
							if (Number.isFinite(dif) && startNumber + Number(dif) > endNumber) {
								return `Min must be less than max by at least ${Number(dif)}`;
							}
						}
						if (type === 'date' && new Date(value) > new Date(endValue)) {
							return 'Start date must be before end date';
						}

						// clear errors on self
						clearErrors(startName);
						if (_.get(errors, endName)) {
							trigger(endName);
						}
					},
					...(type === 'number' &&
						fieldDep?.length && {
							fieldDep: (value) => {
								const fieldValue = watch(fieldDep);
								if (Number(value) > fieldValue) {
									return `Value must not be greater than ${fieldValue}`;
								}

								clearErrors(startName);
								if (_.get(errors, fieldDep)) {
									trigger(fieldDep);
								}
							},
						}),
				},
			}),
		[clearErrors, dif, endName, errors, min, fieldDep, rulesProps, startName, trigger, type, watch]
	);

	const maxRules = useMemo(
		() =>
			_.merge(getFormControlRules(rulesProps), {
				validate: {
					minValue: (value) => {
						if (type === 'number') {
							if (typeof min !== 'undefined' && value < min) {
								return `Value must be greater than ${min === 0 ? '0.00001' : min}`;
							}
						}
					},

					minRange: (value) => {
						const startValue = watch(startName);
						if (type === 'number') {
							const startNumber = Number(startValue);
							const endNumber = Number(value);
							if (startNumber > endNumber) {
								return 'Value must be greater than min';
							}
							if (Number.isFinite(dif) && startNumber + Number(dif) > endNumber) {
								return `Max must be greater than min by at least ${Number(dif)}`;
							}
						}
						if (type === 'date' && new Date(value) < new Date(startValue)) {
							return 'End date must be after start date';
						}

						// clear errors on self
						clearErrors(endName);

						if (_.get(errors, startName)) {
							trigger(startName);
						}
					},
					...(type === 'number' &&
						fieldDep?.length && {
							fieldDep: (value) => {
								const fieldValue = watch(fieldDep);
								if (Number(value) < fieldValue) {
									return `Value must not be less than ${fieldValue}`;
								}

								clearErrors(endName);
								if (_.get(errors, fieldDep)) {
									trigger(fieldDep);
								}
							},
						}),
				},
			}),
		[clearErrors, dif, min, endName, errors, fieldDep, rulesProps, startName, trigger, type, watch]
	);

	return (
		<LabeledFieldContainer
			css={`
				grid-column: span ${fieldColumnSpan * 2};
				width: 100% !important;
			`}
		>
			{label && (
				<InfoTooltipWrapper tooltipTitle={tooltip}>
					<FieldLabel>{label}</FieldLabel>
				</InfoTooltipWrapper>
			)}

			<span
				css={`
					align-items: flex-start;
					column-gap: 1rem;
					display: flex;
					justify-content: flex-start;
					& > * {
						flex-grow: 1;
						flex-basis: 48%;
						row-gap: unset;
					}
				`}
			>
				<ForecastFormControl
					key={startName}
					disabled={disabled}
					fieldColumnSpan={fieldColumnSpan}
					inForm={false}
					inlineLabel={startLabel}
					name={startName}
					rules={minRules}
					type={type}
					{...rest}
				/>
				<ForecastFormControl
					key={endName}
					disabled={disabled}
					fieldColumnSpan={fieldColumnSpan}
					inForm={false}
					inlineLabel={endLabel}
					name={endName}
					rules={maxRules}
					type={type}
					{...rest}
				/>
			</span>
		</LabeledFieldContainer>
	);
}

export default ForecastFormControl;
export { CustomSelectField, CustomBooleanField, FormControlRangeField, getFormControlRules };
