import { faPercent, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { InputAdornment, Slider } from '@material-ui/core';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { Icon, IconButton, TextField } from '@/components/v2';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { Exclude, IncludeNull } from '@/well-filter/well-header-input-types';

import {
	FilterAccordion,
	FilterAccordionDetails,
	FilterAccordionSummary,
	FilterAccordionSummaryNameContainer,
	FilterName,
	textFieldCSS,
} from '../FilterAccordion';
import { FilterTypeProps } from '../shared';

interface FilterPercentProps extends FilterTypeProps {
	minValue: number | string;
	maxValue: number | string;
}

export function FilterPercent(props: FilterPercentProps) {
	const {
		inputName,
		minValue,
		maxValue,
		exclude,
		showNull,
		neverNull,
		onChange,
		inputKey,
		projectHeader,
		removeHeaderType,
	} = props;

	const value = { start: minValue, end: maxValue, exclude, showNull, neverNull };

	const change = (val, dir) => {
		val = val === '' ? '' : Number(val);
		if (!Number.isNaN(val)) {
			const newValue = dir === 'start' ? { ...value, start: val } : { ...value, end: val };
			onChange(newValue, inputKey);
		}
	};

	const handleSliderChange = (event, newValue) => {
		const start = newValue[0] === '' ? '' : Number(newValue[0]);
		const end = newValue[1] === '' ? '' : Number(newValue[1]);
		if (!Number.isNaN(start) && !Number.isNaN(end)) {
			const valueToSave = { ...value, start, end };
			onChange(valueToSave, inputKey);
		}
	};

	return (
		<FilterAccordion>
			<FilterAccordionSummary>
				<FilterAccordionSummaryNameContainer>
					<FilterName>
						{projectHeader && <ColoredCircle $color={projectCustomHeaderColor} />}
						{inputName}
					</FilterName>
					<IconButton
						size='small'
						onClick={(e) => {
							e.stopPropagation();
							removeHeaderType(inputKey, projectHeader);
						}}
					>
						{faTimes}
					</IconButton>
				</FilterAccordionSummaryNameContainer>
			</FilterAccordionSummary>
			<FilterAccordionDetails>
				{minValue !== '' && maxValue !== '' && (
					<Slider
						color='secondary'
						value={[minValue as number, maxValue as number]}
						valueLabelDisplay='auto'
						max={100}
						min={0}
						onChange={handleSliderChange}
					/>
				)}
				<div
					css={`
						display: flex;
					`}
				>
					<TextField
						id={`${inputKey}-filter-number-min`}
						css={`
							margin-right: 5px;
							${textFieldCSS}
						`}
						type='number'
						variant='outlined'
						placeholder='Range Start'
						value={minValue || minValue === 0 ? minValue : ''}
						onChange={(ev) => change(ev.target.value, 'start')}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Icon>{faPercent}</Icon>
								</InputAdornment>
							),
						}}
					/>
					<TextField
						id={`${inputKey}-filter-number-max`}
						type='number'
						css={textFieldCSS}
						variant='outlined'
						placeholder='Range End'
						value={maxValue || maxValue === 0 ? maxValue : ''}
						onChange={(ev) => change(ev.target.value, 'end')}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Icon>{faPercent}</Icon>
								</InputAdornment>
							),
						}}
					/>
				</div>
				<div
					css={`
						margin-top: 1rem;
						display: flex;
						flex-direction: column;
					`}
				>
					<Exclude value={value} inputName={inputKey} onChange={onChange} label='Exclude' />
					{!neverNull && (
						<div className='filter-bottom-right'>
							<IncludeNull value={value} inputName={inputKey} onChange={onChange} />
						</div>
					)}
				</div>
			</FilterAccordionDetails>
		</FilterAccordion>
	);
}
