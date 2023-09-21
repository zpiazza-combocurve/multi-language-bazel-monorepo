import { faTimes } from '@fortawesome/pro-regular-svg-icons';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { CheckboxField, IconButton, TextField } from '@/components/v2';
import { warningAlert } from '@/helpers/alerts';
import { getPastedText } from '@/helpers/browser';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { CHARACTER_ABSOLUTE_LIMIT, CHARACTER_WARNING_LIMIT } from '@/well-filter/shared';
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

interface FilterStringProps extends FilterTypeProps {
	value: string;
	exact: boolean;
}

export function FilterString(props: FilterStringProps) {
	const {
		inputName,
		value,
		exact,
		exclude,
		showNull,
		neverNull,
		onChange,
		inputKey,
		projectHeader,
		removeHeaderType,
	} = props;

	const fullValue = { value, exclude, exact, showNull, neverNull };

	const changeText = (val) => {
		val = (val || '').replace(/[\t\n\r]+/g, ',').toLowerCase();
		if (val.length > CHARACTER_ABSOLUTE_LIMIT) {
			val = val.substr(0, CHARACTER_ABSOLUTE_LIMIT);
			warningAlert(`Filter is too large. Limited to ${CHARACTER_ABSOLUTE_LIMIT} characters.`);
		} else if (val.length > CHARACTER_WARNING_LIMIT) {
			warningAlert(`Large filter value. Might be slow or even cause a timeout error.`);
		}
		onChange({ ...fullValue, value: val }, inputKey);
	};

	const changeExact = () => {
		onChange({ ...fullValue, exact: !exact }, inputKey);
	};

	const onPaste = (event) => {
		event.preventDefault();
		const pastedValue = getPastedText(event);
		changeText(`${value}${value && ','}${pastedValue.trim()}`);
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
				<TextField
					css={textFieldCSS}
					variant='outlined'
					fullWidth
					placeholder='Enter Text Filter'
					value={value}
					onChange={(e) => changeText(e.target.value)}
					onPaste={onPaste}
				/>
				<div
					css={`
						margin-top: 1rem;
						display: flex;
						flex-direction: column;
					`}
				>
					<CheckboxField
						color='secondary'
						id={`${inputName}-filter-string-exact`}
						className='filter-exact-checkbox'
						onChange={changeExact}
						checked={exact}
						name='exact'
						label='Match Exact Name'
					/>
					<Exclude value={fullValue} inputName={inputKey} onChange={onChange} label='Exclude' />
					{!neverNull && <IncludeNull value={fullValue} inputName={inputKey} onChange={onChange} />}
				</div>
			</FilterAccordionDetails>
		</FilterAccordion>
	);
}
