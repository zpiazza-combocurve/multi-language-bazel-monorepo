import { faTimes } from '@fortawesome/pro-regular-svg-icons';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton, ReactDatePicker } from '@/components/v2';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { Exclude, IncludeNull } from '@/well-filter/well-header-input-types';

import {
	FilterAccordion,
	FilterAccordionDetails,
	FilterAccordionSummary,
	FilterAccordionSummaryNameContainer,
	FilterName,
} from '../FilterAccordion';
import { FilterTypeProps } from '../shared';

interface FilterDateRangeProps extends FilterTypeProps {
	start_date: string;
	end_date: string;
}

export function FilterDateRange(props: FilterDateRangeProps) {
	const {
		inputName,
		start_date,
		end_date,
		exclude,
		showNull,
		neverNull,
		onChange,
		inputKey,
		projectHeader,
		removeHeaderType,
	} = props;

	const value = { start: start_date, end: end_date, exclude, showNull, neverNull };

	const endChange = (val) => onChange({ ...value, end: val }, inputKey);
	const startChange = (val) => {
		onChange({ ...value, start: val }, inputKey);
	};

	const start = new Date(start_date);
	const end = new Date(end_date);

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
					<ReactDatePicker
						id='date-filter-min'
						className='date-input start-date'
						color='secondary'
						onChange={(d) => startChange(d)}
						label='Start'
						placeholder='Start'
						selected={start}
						variant='outlined'
						asUtc
					/>
					<ReactDatePicker
						id='date-filter-max'
						className='date-input'
						color='secondary'
						onChange={(d) => endChange(d)}
						label='End'
						placeholder='End'
						variant='outlined'
						selected={end}
						asUtc
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
