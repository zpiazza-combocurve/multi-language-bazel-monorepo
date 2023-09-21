import { faChevronDown, faChevronUp, faGripVertical, faTrashAlt } from '@fortawesome/pro-light-svg-icons';
import { Box, Card, Collapse } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import { useDerivedState } from '@/components/hooks';
import { withRHFControl } from '@/components/react-hook-form-helpers';
import { Chip, IconButton, InfoTooltipWrapper, TextField, Typography } from '@/components/v2';
import { RHFCheckboxField, RHFReactDatePicker, RHFTextField } from '@/components/v2/react-hook-form-fields';
import { labelWithUnit, titleize } from '@/helpers/text';

const MAX_FIELD_WIDTH_VALUE = 20;

const MAX_FIELD_WIDTH = `${MAX_FIELD_WIDTH_VALUE}rem`;

const RANGE_FIELD_WIDTH = `${(MAX_FIELD_WIDTH_VALUE - 0.5) / 2}rem`;

const RELATIVE_VALUE_LABEL = 'Relative Value ∆ +/-';

const RELATIVE_PERCENTAGE_LABEL = 'Relative Percentage ∆ +/- (%)';

const FieldContainer = ({ children, className = undefined }) => (
	<Card css='width: 100%; height: auto; margin: .25rem 0; box-shadow: none' className={className}>
		<Box alignItems='flex-start' display='flex' justifyContent='flex-start' flexDirection='column' width='100%'>
			{children}
		</Box>
	</Card>
);

const FieldRow = ({ children }) => (
	<Box alignItems='center' display='flex' justifyContent='space-between' width='100%'>
		{children}
	</Box>
);

const FieldItem = ({ children, width }) => (
	<Box alignItems='center' display='flex' justifyContent='flex-start' width={width}>
		{children}
	</Box>
);

const InputContainer = ({ children, width }) => (
	<Box width={width ?? `${MAX_FIELD_WIDTH_VALUE + 0.5}rem`}>{children}</Box>
);

// only allow ints
// include mui error messages
const RHFIntField = withRHFControl(TextField, {
	getPropsFromField: (field) => ({
		...field,
		onChange: (ev) => {
			const { value } = ev.target;

			let isInt = /^[0-9\b]+$/.test(value);
			if (isInt || value === '') {
				field.onChange(value);
			}
		},
	}),
	getPropsFromFieldState: (fieldState) => ({
		error: !!fieldState.error,
		helperText: fieldState.error?.message,
	}),
});

// allows numbers
const RHFNumberField = withRHFControl(TextField, {
	getPropsFromField: (field) => ({
		...field,
		onChange: (ev) => {
			return field.onChange(Number.isFinite(ev.target.value) ? Number(ev.target.value) : ev.target.value);
		},
	}),
	getPropsFromFieldState: (fieldState) => ({
		error: !!fieldState.error,
		helperText: fieldState.error?.message,
	}),
});

const LabeledTextField = ({ label, name, units, width, tooltip, altSize, rules, intOnly = false }) => {
	const labelItem = label ? (
		<Typography variant={altSize ? 'subtitle2' : 'caption'}>{labelWithUnit(label, units)}</Typography>
	) : null;

	return (
		<InputContainer width={width}>
			<InfoTooltipWrapper tooltipTitle={tooltip}>{labelItem}</InfoTooltipWrapper>
			<Box maxWidth={MAX_FIELD_WIDTH} height={altSize ? '3.25rem' : undefined}>
				{intOnly ? (
					<RHFIntField name={name} placeholder='Input Value' rules={rules} />
				) : (
					<RHFNumberField name={name} placeholder='Input Value' rules={rules} />
				)}
			</Box>
		</InputContainer>
	);
};

const RangeField = ({
	component: Component,
	componentProps = {},
	label,
	max = Infinity,
	min = -Infinity,
	name,
	units,
	altSize,
	validate = true,
}) => {
	const { getValues } = useFormContext();
	const startName = `${name}.start`;
	const endName = `${name}.end`;

	const validateMin = useCallback(() => {
		const startValue = getValues(startName);
		const endValue = getValues(endName);
		const startNumber = Number(startValue);
		const endNumber = Number(endValue);

		let error;
		if (!validate) return error;
		if (startNumber > endNumber) {
			error = 'Max is less than min';
		}
		if (startNumber < min) {
			error = `Min value is ${min}`;
		}
		if (startValue === '') {
			error = 'This field required';
		}

		return error;
	}, [getValues, min, endName, startName, validate]);

	const validateMax = useCallback(() => {
		const startValue = getValues(startName);
		const endValue = getValues(endName);
		const startNumber = Number(startValue);
		const endNumber = Number(endValue);
		let error;
		if (!validate) return error;
		if (startNumber > endNumber) {
			error = 'Max is less than min';
		}
		if (endValue > max) {
			error = `Max value is ${max}`;
		}
		if (endValue === '') {
			error = 'This field required';
		}

		return error;
	}, [getValues, max, endName, startName, validate]);

	return (
		<InputContainer width='100%'>
			<Typography variant={altSize ? 'subtitle2' : 'caption'}>{labelWithUnit(label, units)}</Typography>

			<Box display='flex' alignItems='baseline' height={altSize ? '3.25rem' : undefined}>
				<Box maxWidth={RANGE_FIELD_WIDTH}>
					<Component
						{...{
							...componentProps,
							placeholder: 'Min',
							name: startName,
							rules: { validate: validateMin },
						}}
						InputProps={{ endAdornment: null }}
					/>
				</Box>

				<Box marginLeft='0.5rem' maxWidth={RANGE_FIELD_WIDTH}>
					<Component
						{...{
							...componentProps,
							placeholder: 'Max',
							name: endName,
							rules: { validate: validateMax },
						}}
						InputProps={{ endAdornment: null }}
					/>
				</Box>
			</Box>
		</InputContainer>
	);
};

const RequiredFields = () => (
	<div css='margin-top: .25rem'>
		<FieldRow>
			<FieldItem width='50%'>
				<LabeledTextField
					label='Search Radius'
					name='searchRadius'
					units='Miles'
					width='100%'
					tooltip='Measured from surface hole location'
					altSize
					rules={{
						required: { value: true, message: 'This field is required' },
						min: { value: 1, message: 'Minimum value is 1' },
					}}
				/>
			</FieldItem>
			<FieldItem width='50%'>
				<RangeField
					component={LabeledTextField}
					componentProps={{ inputProps: { step: 1 }, type: 'number', width: '95%', intOnly: true }}
					label='Well Count Range (Min, Max)'
					min={1}
					max={25}
					name='wellCountRange'
					altSize
				/>
			</FieldItem>
		</FieldRow>
	</div>
);

const OptionFieldContainer = styled(FieldContainer)`
	border: 1px solid gray;
	padding: 0.25rem;
`;
const IndexDiv = ({ value }) => (
	<div css='display: flex; justify-content: center; align-items: center'>
		<h3 css='margin:0 0.25rem 0 .25rem; text-align: center;'>{value}.</h3>
	</div>
);

const StyledCheckbox = styled(RHFCheckboxField)`
	margin-right: 0;
	& .MuiCheckbox-root {
		padding: 0;
		margin-right: 0.2rem;
	}
`;

const FormField = ({
	fieldItem,
	itemIdx,
	removeField,
	dragRef,
	isExpanded,
	availableColumnsKey,
	columns,
	changeField,
	index,
	// ...rest
}) => {
	const { label: fieldLabel, value: fieldKey, type, units } = fieldItem;

	const [expanded, setExpanded] = useDerivedState(isExpanded, [isExpanded]);

	const fieldRender = useMemo(() => {
		if (type === 'date') {
			return (
				<FieldRow>
					<FieldItem width='50%'>
						<LabeledTextField
							label={RELATIVE_VALUE_LABEL}
							name={`${fieldKey}.relativeValue`}
							units='Months'
							width='100%'
						/>
					</FieldItem>
					<FieldItem width='50%'>
						<RangeField
							id={`${itemIdx}.${fieldLabel}`}
							component={RHFReactDatePicker}
							label='Absolute Range'
							name={`${fieldKey}.absoluteRange`}
							units={units}
							validate={false}
						/>
					</FieldItem>
				</FieldRow>
			);
		}

		if (type === 'number') {
			return (
				<FieldRow>
					<FieldItem width='32%'>
						<LabeledTextField
							label={RELATIVE_VALUE_LABEL}
							name={`${fieldKey}.relativeValue`}
							units={units}
							width='100%'
						/>
					</FieldItem>
					<FieldItem width='32%'>
						<LabeledTextField
							label={RELATIVE_PERCENTAGE_LABEL}
							name={`${fieldKey}.relativePercentage`}
							width='100%'
						/>
					</FieldItem>
					<FieldItem width='30%'>
						<RangeField
							id={`${itemIdx}.${fieldLabel}`}
							component={RHFTextField}
							componentProps={{ inputProps: { step: 1 }, type: 'number' }}
							label='Absolute Range'
							name={`${fieldKey}.absoluteRange`}
							units={units}
							validate={false}
						/>
					</FieldItem>
				</FieldRow>
			);
		}

		if (type === 'string' || type === 'multi-select') {
			return <Box mt='.25rem' fontSize='.85rem'>{`Match the target well's ${fieldLabel}`}</Box>;
		}
		return null;
	}, [type, fieldKey, itemIdx, fieldLabel, units]);

	return (
		<OptionFieldContainer>
			<FieldRow>
				<Box alignItems='center' display='flex' width='100%'>
					<IconButton css='padding: 0' ref={dragRef}>
						{faGripVertical}
					</IconButton>
					<IndexDiv value={itemIdx + 1} />
					<Box alignItems='center' display='flex' flexBasis='60%' marginRight='1rem'>
						<Autocomplete
							css={`
								width: 100%;
								& .MuiInputBase-root {
									padding: 0;
								}
							`}
							options={availableColumnsKey}
							getOptionLabel={(columnKey) => columns?.[columnKey]?.label ?? ''}
							renderOption={(columnKey) => {
								const { label = '', headerType } = columns?.[columnKey] ?? {};
								if (!headerType) {
									return label;
								}
								return (
									<>
										{label}{' '}
										<Chip css='margin-left: 0.5rem;' label={titleize(`From ${headerType}`)} />
									</>
								);
							}}
							renderInput={(params) => <TextField {...params} variant='outlined' width='100%' />}
							disableClearable
							value={fieldKey}
							onChange={(_event, newValue) => {
								changeField(index, newValue);
							}}
						/>
					</Box>
					<Box flexBasis='40%'>
						<Box display='flex' justifyContent='space-around' alignItems='center'>
							<StyledCheckbox label='Mandatory' name={`${fieldKey}.mandatory`} plain />

							<IconButton onClick={() => removeField(fieldKey)} color='error' size='small'>
								{faTrashAlt}
							</IconButton>

							<IconButton onClick={() => setExpanded(!expanded)} size='small'>
								{expanded ? faChevronUp : faChevronDown}
							</IconButton>
						</Box>
					</Box>
				</Box>
			</FieldRow>
			<Collapse in={expanded} timeout='auto' unmountOnExit css='width: 100%'>
				{fieldRender}
			</Collapse>
		</OptionFieldContainer>
	);
};

export { FormField, RequiredFields };
