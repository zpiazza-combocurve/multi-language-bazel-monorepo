import { faChevronDown, faChevronUp, faPercent, faSearch } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	Button,
	CheckboxField as Checkbox,
	Chip,
	Collapse,
	List,
	ListItem,
	ListItemText,
	ReactDatePicker,
	TextField,
} from '@/components/v2';
import { iconAdornment } from '@/components/v2/helpers';
import { difference, intersection, union } from '@/helpers/sets';

import { warningAlert } from '../helpers/alerts';
import { getPastedText } from '../helpers/browser';
import { CHARACTER_ABSOLUTE_LIMIT, CHARACTER_WARNING_LIMIT, MAX_AMOUNT_OF_VALUES } from './shared';

export function FilterNumber(props) {
	const { inputName, minValue, maxValue, exclude, showNull, neverNull, onChange } = props;

	const value = { start: minValue, end: maxValue, exclude, showNull, neverNull };

	const change = (val, dir) => {
		val = val === '' ? '' : Number(val);
		if (!Number.isNaN(val)) {
			const newValue = dir === 'start' ? { ...value, start: val } : { ...value, end: val };
			onChange(newValue, inputName);
		}
	};

	return (
		<>
			<div id='filter-range' className='filter-input exclude'>
				<TextField
					id={`${inputName}-filter-number-min`}
					className='filter-input-start'
					type='number'
					placeholder='Range Start'
					value={minValue || minValue === 0 ? minValue : ''}
					onChange={(ev) => change(ev.target.value, 'start')}
				/>
				<TextField
					id={`${inputName}-filter-number-max`}
					className='filter-input-end'
					type='number'
					placeholder='Range End'
					value={maxValue || maxValue === 0 ? maxValue : ''}
					onChange={(ev) => change(ev.target.value, 'end')}
				/>
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Exclude value={value} inputName={inputName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={value} inputName={inputName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

export function FilterPercent(props) {
	const { inputName, minValue, maxValue, exclude, showNull, neverNull, onChange } = props;

	const value = { start: minValue, end: maxValue, exclude, showNull, neverNull };

	const change = (val, dir) => {
		val = val === '' ? '' : Number(val);
		if (!Number.isNaN(val)) {
			const newValue = dir === 'start' ? { ...value, start: val } : { ...value, end: val };
			onChange(newValue, inputName);
		}
	};

	return (
		<>
			<div id='filter-range' className='filter-input exclude'>
				<TextField
					id={`${inputName}-filter-number-min`}
					className='filter-input-start'
					type='number'
					placeholder='Range Start'
					value={minValue || minValue === 0 ? minValue : ''}
					onChange={(ev) => change(ev.target.value, 'start')}
					InputProps={{ endAdornment: iconAdornment(faPercent) }}
				/>
				<TextField
					id={`${inputName}-filter-number-max`}
					className='filter-input-end'
					type='number'
					placeholder='Range End'
					value={maxValue || maxValue === 0 ? maxValue : ''}
					onChange={(ev) => change(ev.target.value, 'end')}
					InputProps={{ endAdornment: iconAdornment(faPercent) }}
				/>
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Exclude value={value} inputName={inputName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={value} inputName={inputName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

export function FilterString(props) {
	const { inputName, value, exact, exclude, showNull, neverNull, onChange } = props;

	const fullValue = { value, exclude, exact, showNull, neverNull };

	const changeText = (val) => {
		val = (val || '').replace(/[\t\n\r]+/g, ',').toLowerCase();
		if (val.length > CHARACTER_ABSOLUTE_LIMIT) {
			val = val.substr(0, CHARACTER_ABSOLUTE_LIMIT);
			warningAlert(`Filter is too large. Limited to ${CHARACTER_ABSOLUTE_LIMIT} characters.`);
		} else if (val.length > CHARACTER_WARNING_LIMIT) {
			warningAlert(`Large filter value. Might be slow or even cause a timeout error.`);
		}
		onChange({ ...fullValue, value: val }, inputName);
	};

	const changeExact = () => {
		onChange({ ...fullValue, exact: !exact }, inputName);
	};

	const onPaste = (event) => {
		event.preventDefault();
		const pastedValue = getPastedText(event);
		changeText(`${value}${value && ','}${pastedValue.trim()}`);
	};

	return (
		<>
			<div className='exclude'>
				<TextField
					id={`${inputName}-filter-string`}
					className='filter-input'
					type='text'
					value={value}
					onChange={(ev) => changeText(ev.target.value)}
					onPaste={onPaste}
					placeholder='Enter Text Filter'
				/>
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Checkbox
						color='secondary'
						id={`${inputName}-filter-string-exact`}
						className='filter-exact-checkbox'
						onChange={changeExact}
						checked={exact}
						name='exact'
						label='Exact'
					/>
					<Exclude value={fullValue} inputName={inputName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={fullValue} inputName={inputName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

export function FilterDateRange(props) {
	const { dateName, start_date, end_date, exclude, showNull, neverNull, onChange } = props;

	const value = { start: start_date, end: end_date, exclude, showNull, neverNull };

	const endChange = (val) => onChange({ ...value, end: val }, dateName);
	const startChange = (val) => {
		onChange({ ...value, start: val }, dateName);
	};

	const start = new Date(start_date);
	const end = new Date(end_date);

	return (
		<>
			<div id='date-filter-range' className='filter-input filter-search-item, exclude'>
				<ReactDatePicker
					id='date-filter-min'
					className='date-input start-date'
					color='secondary'
					onChange={(d) => startChange(d)}
					placeholder='From Date'
					selected={start}
					asUtc
				/>
				<ReactDatePicker
					id='date-filter-max'
					className='date-input'
					color='secondary'
					onChange={(d) => endChange(d)}
					placeholder='To Date'
					selected={end}
					asUtc
				/>
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Exclude value={value} inputName={dateName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={value} inputName={dateName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

const convertMultiSelect = (array) => {
	if (array.length > 3) {
		return `${array[0]}, ${array[1]} ... ${array[array.length - 1]}`;
	}
	return array.join(', ');
};

export function FilterMultiSelect(props) {
	const {
		inputName,
		inputValue,
		values,
		collapsed,
		searchMultiSelect,
		results,
		exclude,
		showNull,
		neverNull,
		onChange,
	} = props;

	const fullValue = { values, collapsed, results, value: inputValue, exclude, showNull, neverNull };

	const valuesArr = [...values];

	const changeInput = (val) => {
		onChange({ ...fullValue, value: val.toLowerCase() }, inputName);
	};
	const collapse = () => {
		onChange({ ...fullValue, collapsed: !collapsed }, inputName);
	};
	const addOrRemoveValues = (vals) => {
		let newValues = difference(union(values, vals), intersection(values, vals));
		if (newValues.size > MAX_AMOUNT_OF_VALUES) {
			newValues = new Set([...newValues].slice(0, MAX_AMOUNT_OF_VALUES));
			warningAlert(`Too many values to filter. Limited to ${MAX_AMOUNT_OF_VALUES}.`);
		}
		onChange({ ...fullValue, values: newValues }, inputName);
	};
	const addOrRemoveSingleValue = (val) => addOrRemoveValues(new Set([val]));
	const paste = (event) => {
		event.preventDefault();
		const pasteList = getPastedText(event)
			.split(/[,\s]+/)
			.filter((s) => s);
		addOrRemoveValues(new Set(pasteList));
	};

	return (
		<>
			<div id='filter-multi-select' className='filter-input'>
				<div className='exclude'>
					<span
						className='filter-inline-indicator'
						onClick={() => searchMultiSelect(inputName, inputValue)}
						role='button'
						tabIndex={0}
					>
						<FontAwesomeIcon className='themeMe' icon={faSearch} />
					</span>
					<TextField
						id={`${inputName}-filter-number`}
						placeholder={convertMultiSelect(valuesArr) || 'Enter Filter for Choices'}
						value={inputValue}
						onChange={(ev) => changeInput(ev.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && searchMultiSelect(inputName, inputValue)}
						onPaste={paste}
					/>
				</div>
				{results || values.size ? (
					<div id='filter-multi-select-chips'>
						{valuesArr.map((v, i) => {
							if (i === 2 && valuesArr.length > 3) {
								return <Chip key={i + 1} label='...' className='secondary-chip' />;
							}
							if (i < 2 || i === valuesArr.length - 1) {
								return (
									<Chip
										key={v}
										label={v}
										className='secondary-chip'
										onClick={() => addOrRemoveSingleValue(v)}
									/>
								);
							}
							return '';
						})}
					</div>
				) : (
					''
				)}
				{results && (
					<div id='filter-multi-select-search-results' className='on-hover-paper-1'>
						<Button color='secondary' className='results-btn secondary-bot-border' onClick={collapse}>
							<FontAwesomeIcon
								className='left-btn-icon'
								css={`
									margin-right: 0.5rem;
								`}
								icon={collapsed ? faChevronDown : faChevronUp}
							/>
							{`Results for: ${results.search || 'All'}`}
						</Button>
						<Collapse in={!collapsed}>
							<List className='multi-search-results-list'>
								{results.results
									.filter((f) => !values.has(f) && !!f)
									.map((r) => (
										<ListItem
											key={r}
											css={`
												cursor: pointer;
											`}
											onClick={() => addOrRemoveSingleValue(r)}
											className='multi-search-results-list-item on-hover-background-secondary-opaque on-hover-paper-1'
										>
											<ListItemText
												style={{
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
												primary={r}
												disableTypography
											/>
										</ListItem>
									))}
							</List>
						</Collapse>
					</div>
				)}
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Exclude value={fullValue} inputName={inputName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={fullValue} inputName={inputName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

export function FilterMultiCheckbox(props) {
	const { inputName, values, options, exclude, showNull, neverNull, onChange } = props;

	const fullValue = { values, options, exclude, showNull, neverNull };

	const change = (key, checked) => {
		key = key.toLowerCase();
		const newValues = checked ? new Set([...values, key]) : new Set([...values].filter((v) => v !== key));
		onChange({ ...fullValue, values: newValues }, inputName);
	};

	return (
		<>
			<div className='exclude'>
				<div id='filter-checks' className='filter-input'>
					{options.map((opt) => {
						const value = opt.value;
						const label = opt.label;
						const checked = values.has(value.toLowerCase()); // yes value/label is backwards. im too lazy to fix it in the db
						return (
							<Checkbox
								color='secondary'
								id={`${`${inputName}-${label}`}-filter-checks`}
								key={label}
								className='filter-checks'
								onChange={() => change(value, !checked)}
								label={value}
								checked={checked}
								name={value}
							/>
						);
					})}
				</div>
			</div>
			<div className='filter-bottom'>
				<div className='filter-bottom-left'>
					<Exclude value={fullValue} inputName={inputName} onChange={onChange} />
				</div>
				{!neverNull && (
					<div className='filter-bottom-right'>
						<IncludeNull value={fullValue} inputName={inputName} onChange={onChange} />
					</div>
				)}
			</div>
		</>
	);
}

export function FilterBoolean(props) {
	const { inputName, value, options, showNull, neverNull, onChange } = props;

	const fullValue = { value, showNull, neverNull };

	const changeValue = (yesCheck, noCheck) => {
		let newValue;
		if (yesCheck && noCheck) {
			newValue = 'both';
		} else if (yesCheck) {
			newValue = true;
		} else if (noCheck) {
			newValue = false;
		} else {
			newValue = 'none';
		}
		onChange({ ...fullValue, value: newValue }, inputName);
	};

	const yesChecked = value === true || value === 'both';
	const noChecked = value === false || value === 'both';

	return (
		<>
			<div id='filter-checks' className='yesNo-filter-check'>
				<Checkbox
					color='secondary'
					label={options?.find(({ value: v }) => v === true)?.label || 'Yes'}
					name='filter-boolean'
					id={`${inputName}-filter-boolean-yes`}
					checked={yesChecked}
					onChange={() => changeValue(!yesChecked, noChecked)}
				/>
				<Checkbox
					color='secondary'
					label={options?.find(({ value: v }) => v === false)?.label || 'No'}
					name='filter-boolean'
					id={`${inputName}-filter-boolean-no`}
					checked={noChecked}
					onChange={() => changeValue(yesChecked, !noChecked)}
				/>
			</div>
			{!neverNull && (
				<div className='filter-bottom'>
					<div className='filter-bottom-left' />
					<div className='filter-bottom-right'>
						<IncludeNull value={fullValue} inputName={inputName} onChange={onChange} />
					</div>
				</div>
			)}
		</>
	);
}

export function Exclude(props) {
	const { onChange, value, inputName, label } = props;

	const handleExclude = () => {
		onChange({ ...value, exclude: !value.exclude }, inputName);
	};

	return (
		<Checkbox
			color='secondary'
			id={`exclude-${inputName}`}
			className='filter-checks'
			onChange={handleExclude}
			checked={value.exclude}
			name='exclude-all-option'
			label={label ?? 'Exc'}
		/>
	);
}

export function IncludeNull(props) {
	const { inputName, value, onChange } = props;

	const handleNullChange = (nullValue) => {
		onChange({ ...value, showNull: nullValue }, inputName);
	};

	return (
		<Checkbox
			color='secondary'
			id={`show-null-${inputName}`}
			className='filter-checks'
			label='Include N/A'
			checked={value.showNull}
			onChange={({ target }) => handleNullChange(target.checked)}
		/>
	);
}
