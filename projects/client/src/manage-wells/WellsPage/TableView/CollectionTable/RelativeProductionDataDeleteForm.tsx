import { useState } from 'react';

import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	ReactDatePicker,
	TextField,
	Typography,
} from '@/components/v2';
import Autocomplete from '@/components/v2/misc/Autocomplete';
import { pluralize } from '@/helpers/text';
import { IDeleteWithInputProductionData } from '@/manage-wells/shared/utils';

const METHODS = {
	relative: 'relative',
	range: 'range',
};

const METHOD_OPTIONS = [
	{
		label: 'Relative',
		value: METHODS.relative,
	},
	{
		label: 'Range',
		value: METHODS.range,
	},
];

const UNIT_OPTIONS = [
	{ label: 'Day', value: 'day' },
	{ label: 'Month', value: 'month' },
	{ label: 'Year', value: 'year' },
];

const RELATIVE_START_OPTIONS = [
	{
		wellHeaderField: 'first_prod_date',
		label: 'First Prod Date',
	},
	{
		wellHeaderField: 'first_prod_date_monthly_calc',
		label: 'Monthly First Prod Date',
	},
	{
		wellHeaderField: 'first_prod_date_daily_calc',
		label: 'Daily First Prod Date',
	},
	{
		wellHeaderField: 'last_prod_date_monthly',
		label: 'Monthly Last Prod Date',
	},
	{
		wellHeaderField: 'last_prod_date_daily',
		label: 'Daily Last Prod Date',
	},
];

const fieldMarginRight = 'margin-right: 30px;';
const autocompleteCSS = `
.MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"] .MuiAutocomplete-input {
    padding: 1.5px 5px;
}
`;
const textFieldCSS = `
.MuiOutlinedInput-input {
	padding: 10.5px 14px;
}
.MuiInputLabel-outlined {
	transform: translate(14px, 12px) scale(1);

	&.MuiInputLabel-shrink {
		transform: translate(14px, -6px) scale(0.75);
	}
}
`;

interface RelativeDeleteFormProps {
	visible: boolean;
	wells: string[];
	onCancel: () => void;
	onDelete: (IDeleteWithInputProductionData) => void;
}

const RelativeProductionDataDeleteForm = ({ visible, wells, onCancel, onDelete }: RelativeDeleteFormProps) => {
	const [daily, setDaily] = useState(false);
	const [monthly, setMonthly] = useState(false);
	const [method, setMethod] = useState<{ label: string; value: string }>(METHOD_OPTIONS[0]);
	// range
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	// relative
	const [wellHeader, setWellHeader] = useState<{ label: string; wellHeaderField: string }>(RELATIVE_START_OPTIONS[0]);
	const [offset, setOffset] = useState<string>('10');
	const [units, setUnits] = useState<{ label: string; value: string }>(UNIT_OPTIONS[1]);

	const handleDelete = () => {
		const body: IDeleteWithInputProductionData = {
			daily,
			monthly,
			wells,
		};

		if (method.value === METHODS.range) {
			body.range = {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				start: startDate!,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				end: endDate!,
			};
		} else {
			body.relative = {
				offset: parseInt(offset),
				units: units.value,
				wellHeaderField: wellHeader.wellHeaderField,
			};
		}

		onDelete(body);
	};

	const deleteEnabled =
		(monthly || daily) && ((method.value === METHODS.relative && offset) || (startDate && endDate));

	return (
		<Dialog open={visible} onClose={onCancel} maxWidth='md' fullWidth>
			<DialogTitle>
				Delete Production Data for {pluralize(wells.length, 'selected well', 'selected wells')}
			</DialogTitle>
			<DialogContent css='min-height: 320px;'>
				<div>
					<Typography display='inline' css={fieldMarginRight}>
						Resolution:
					</Typography>
					<CheckboxField label='Monthly' checked={monthly} onChange={(ev) => setMonthly(ev.target.checked)} />
					<CheckboxField label='Daily' checked={daily} onChange={(ev) => setDaily(ev.target.checked)} />
				</div>
				<div css='display: flex; justify-content: space-between; margin-top: 30px;'>
					<Autocomplete
						label='Method'
						css={`
							${fieldMarginRight}
							${autocompleteCSS}
						`}
						fullWidth
						options={METHOD_OPTIONS}
						disableClearable
						value={method}
						onChange={(e, value) => setMethod(value)}
						getOptionLabel={(o) => o.label}
						variant='outlined'
					/>
					{method.value === METHODS.relative && (
						<>
							<Autocomplete
								label='Well Header'
								css={`
									${fieldMarginRight}
									${autocompleteCSS}
								`}
								fullWidth
								options={RELATIVE_START_OPTIONS}
								disableClearable
								value={wellHeader}
								onChange={(e, value) => setWellHeader(value)}
								getOptionLabel={(o) => o.label}
								variant='outlined'
							/>
							<TextField
								label='Offset (+/-Time Units)'
								css={`
									${fieldMarginRight}
									${textFieldCSS}
								`}
								fullWidth
								type='number'
								value={offset}
								onChange={(e) => setOffset(e.target.value)}
								variant='outlined'
							/>
							<Autocomplete
								label='Units'
								css={autocompleteCSS}
								fullWidth
								options={UNIT_OPTIONS}
								disableClearable
								value={units}
								onChange={(e, value) => setUnits(value)}
								getOptionLabel={(o) => o.label}
								variant='outlined'
							/>
						</>
					)}
					{method.value === METHODS.range && (
						<>
							<ReactDatePicker
								asUtc
								css={`
									${fieldMarginRight}
									${textFieldCSS}
								`}
								fullWidth
								label='Start Date'
								onChange={(value) => {
									setStartDate(value);
								}}
								selected={startDate}
								variant='outlined'
							/>
							<ReactDatePicker
								asUtc
								fullWidth
								css={textFieldCSS}
								label='End Date'
								onChange={(value) => {
									setEndDate(value);
								}}
								selected={endDate}
								variant='outlined'
							/>
						</>
					)}
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel}>Cancel</Button>
				<Button color='error' css='margin-right: 7px;' onClick={handleDelete} disabled={!deleteEnabled}>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default RelativeProductionDataDeleteForm;
