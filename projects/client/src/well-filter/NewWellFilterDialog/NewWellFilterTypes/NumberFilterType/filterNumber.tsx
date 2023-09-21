import { faTimes } from '@fortawesome/pro-regular-svg-icons';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton, TextField } from '@/components/v2';
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

interface FilterNumberProps extends FilterTypeProps {
	minValue: number | string;
	maxValue: number | string;
}

export function FilterNumber(props: FilterNumberProps) {
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
					/>
					<TextField
						id={`${inputKey}-filter-number-max`}
						type='number'
						css={textFieldCSS}
						variant='outlined'
						placeholder='Range End'
						value={maxValue || maxValue === 0 ? maxValue : ''}
						onChange={(ev) => change(ev.target.value, 'end')}
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
