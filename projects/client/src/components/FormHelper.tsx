import { useField } from 'formik';
import { isValidElement } from 'react';
import * as React from 'react';
import styled from 'styled-components';

import { ifProp } from '@/helpers/styled';
import { useWellColumns } from '@/well-sort/WellSort';

import {
	FormikAsyncSelectField,
	FormikCheckbox,
	FormikDatePicker,
	FormikTextField,
	FormikSelectField as RawFormikSelectField,
} from './formik-helpers';
import { addHOCName, getValidateFn, withDefaultProps } from './shared';
import { TooltipedLabel } from './tooltipped';
import { AutoComplete } from './v2/formik-fields';

const FormikSelectField = styled(RawFormikSelectField).attrs({
	simplifiedMenu: false,
	fullWidth: true,
})`
	.md-select-field__toggle {
		width: 100%;
		.md-icon-separator.md-text-field.md-select-field--btn .md-icon-text {
			justify-content: start;
			align-items: baseline;
		}
	}
`;

const Row = styled.div<{ $halved?: boolean; $center?: boolean; $grow?: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: ${ifProp('$center', 'center', 'baseline')};
	flex-grow: ${ifProp('$grow', '1', 'unset')};
	${ifProp('$halved', 'flex-basis: 50%; min-width: 20rem;', 'flex-basis: 100%;')}
	& > *:not(:first-child) {
		margin: 0 0.5rem;
	}
`;

const DateRangeField = ({ name, ...props }: React.ComponentProps<typeof FormikDatePicker>) => (
	<>
		<FormikDatePicker {...props} name={`${name}.0`} />
		<FormikDatePicker {...props} name={`${name}.1`} />
	</>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const HeaderRangeField = ({ name, ...props }: any) => {
	const { required } = props;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const columns = useWellColumns() as Record<string, any>; // TODO fix types
	const availableColumnsKey = Object.entries(columns)
		.filter(([, v]) => v.type === 'date')
		.map(([k]) => k);

	return (
		<>
			<AutoComplete
				{...props}
				name={`${name}.0`}
				options={availableColumnsKey}
				getOptionLabel={(columnKey) => columns[columnKey].label}
				disableClearable
				fullWidth
				validate={getValidateFn({ required })}
			/>
			<AutoComplete
				{...props}
				name={`${name}.1`}
				options={availableColumnsKey}
				getOptionLabel={(columnKey) => columns[columnKey].label}
				disableClearable
				fullWidth
				validate={getValidateFn({ required })}
			/>
		</>
	);
};

const FormikRangeField = ({ name, dif = 0, max, min, ...props }) => {
	// HACK clean this up
	const [{ value: minValue }] = useField(`${name}.0`);
	const [{ value: maxValue }] = useField(`${name}.1`);

	return (
		<>
			<FormikTextField
				{...props}
				name={`${name}.0`}
				type='number'
				min={min}
				max={Math.min(maxValue - dif, max ?? Number.POSITIVE_INFINITY)}
			/>
			<FormikTextField
				{...props}
				name={`${name}.1`}
				type='number'
				min={Math.max(minValue + dif, min ?? Number.NEGATIVE_INFINITY)}
				max={max}
			/>
		</>
	);
};

const FormikCustomField = ({ fields, disabled, readOnly, namePrefix = '' }) => {
	return (
		<>
			{fields.map((field) => {
				if (isValidElement(field)) {
					return field;
				}

				if (!field) {
					return null;
				}

				let { type } = field;
				const { name: name_, menuItems } = field;

				const name = `${namePrefix}${name_}`;

				const shared = { disabled, readOnly, name };

				if (!type) {
					if (menuItems) {
						type = 'select';
					} else {
						type = 'text';
					}
				}

				switch (type) {
					case 'number':
						return <FormikTextField key={name} {...shared} type='number' />;
					case 'select':
						return <FormikSelectField key={name} {...shared} menuItems={menuItems} />;
					case 'boolean':
						return <FormikCheckbox key={name} plain {...shared} />;
					case 'date':
						return <FormikDatePicker key={name} {...shared} />;
					default:
						return <FormikTextField key={name} {...shared} />;
				}
			})}
		</>
	);
};

function withRow<P>(
	Component: React.ComponentType<P>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	{ $center = false, as, noLabel = false }: { $center?: boolean; as?: any; noLabel?: boolean } = {}
) {
	type WithRowProps = P & {
		$grow?: boolean;
		$halved?: boolean;
		labelTooltip?: string;
		label?: string;
	};
	function ComponentEx({ $grow = true, $halved = false, label, labelTooltip, ...props }: WithRowProps, ref) {
		return (
			<Row $halved={$halved} $center={$center} $grow={$grow} as={as}>
				{!noLabel && <TooltipedLabel labelTooltip={labelTooltip}>{label}</TooltipedLabel>}
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				<Component ref={ref} {...props} label={noLabel ? label : undefined} />
			</Row>
		);
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withRow', Component);
}

const DateRangeFieldRow = withRow(DateRangeField, { $center: true });

const HeaderRangeFieldRow = withRow(HeaderRangeField, { $center: true });

const DatePickerFieldRow = withRow(FormikDatePicker, { as: 'label', $center: true });

const CheckboxFieldRow = withRow(withDefaultProps(FormikCheckbox, { plain: true }), {
	$center: true,
	as: 'label',
});

const SelectFieldRow = withRow(FormikSelectField, { as: 'label', $center: true });

const RangeFieldRow = withRow(FormikRangeField);

const TextFieldRow = withRow(FormikTextField, { as: 'label' });

const AsyncSelectFieldRow = withRow(FormikAsyncSelectField, {
	as: 'label',
	$center: true,
	noLabel: true,
});

const CustomFieldRow = withRow(FormikCustomField);

const Container = styled.div`
	display: flex;
	flex-wrap: wrap;
`;

interface Field {
	/** Optional key, otherwise name will be used */
	key?: string;
	/** Required field name */
	name: string;
	/** Field label */
	label?: string;
	/** Optional min values for numbers */
	min?: number;
	/** Optional max values for numbers */
	max?: number;
	dif?: number;
	required?: boolean;
	/** Validate function for formik, used in the select async input */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	validate?: (value: any) => string | undefined;
	/** Optional select function used for async-select, returns the field value */
	select?: <T>() => T | Promise<T>;
	type?:
		| 'custom'
		| 'date'
		| 'date-range'
		| 'boolean'
		| 'number'
		| 'text'
		| 'range'
		| 'select'
		| 'async-select'
		| 'header-range-date';
	/** If the field has room for another in the same line */
	compact?: boolean;
	/** Items used for select fields */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	menuItems?: { label: string; value: any }[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fields?: any[];
}

/**
 * Data oriented form builder, uses formik
 *
 * @deprecated Just use the inner componnets for more flexibility, this component is mostly a .map()
 */
export function Form({
	namePrefix = '',
	compact: compact_ = false,
	disabled = false,
	readOnly = false,
	fields = [],
	filter = () => true,
}: {
	fields: (React.ReactElement | Field)[];
	namePrefix: string;
	compact: boolean;
	disabled: boolean;
	readOnly: boolean;
	filter: (field: Field) => boolean;
}) {
	return (
		<Container>
			{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				fields.map((section: any) => {
					if (isValidElement(section)) {
						return section;
					}

					if (!section) {
						return null;
					}

					if (!filter(section)) {
						return null;
					}

					let { type } = section;
					const {
						key,
						name: name_,
						label,
						fields: innerFields,
						compact = compact_,
						menuItems,
						min,
						max,
						select,
						required,
						validate,
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						type: _type,
						dif,
						...rest
					} = section;

					const name = `${namePrefix}${name_}`;

					const shared = {
						key: key ?? name,
						disabled,
						readOnly,
						name,
						label,
						$halved: !!compact,
						min,
						max,
						validate,
						required,
						dif,
						...rest,
					};

					if (!type) {
						if (menuItems) {
							type = 'select';
						} else if (innerFields) {
							type = 'custom';
						} else {
							type = 'text';
						}
					}

					switch (type) {
						case 'number':
							return <TextFieldRow {...shared} type='number' />;
						case 'select':
							return <SelectFieldRow {...shared} menuItems={menuItems} />;
						case 'range':
							return <RangeFieldRow {...shared} />;
						case 'boolean':
							return <CheckboxFieldRow {...shared} $halved $grow={compact} />;
						case 'date':
							return <DatePickerFieldRow {...shared} />;
						case 'date-range':
							return <DateRangeFieldRow {...shared} />;
						case 'header-range-date':
							return <HeaderRangeFieldRow {...shared} smaller={compact} />;
						case 'async-select':
							return <AsyncSelectFieldRow {...shared} select={select} />;
						case 'custom':
							return <CustomFieldRow {...shared} fields={innerFields} namePrefix={namePrefix} />;
						default:
							return <TextFieldRow {...shared} />;
					}
				})
			}
		</Container>
	);
}
