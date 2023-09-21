import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { useMemo } from 'react';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton } from '@/components/v2';
import CheckboxField from '@/components/v2/CheckboxField';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { IncludeNull } from '@/well-filter/well-header-input-types';

import {
	FilterAccordion,
	FilterAccordionDetails,
	FilterAccordionSummary,
	FilterAccordionSummaryNameContainer,
	FilterName,
} from '../FilterAccordion';
import { FilterTypeProps } from '../shared';

interface FilterBooleanProps extends FilterTypeProps {
	value: string | boolean;
	options: { label: string; value: boolean }[];
}

export function FilterBoolean(props: FilterBooleanProps) {
	const { inputName, value, options, showNull, neverNull, onChange, inputKey, projectHeader, removeHeaderType } =
		props;

	const yesChecked = useMemo(() => value === true || value === 'both', [value]);
	const noChecked = useMemo(() => value === false || value === 'both', [value]);

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
		onChange({ ...fullValue, value: newValue }, inputKey);
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
						margin-top: 1rem;
						display: flex;
						flex-direction: column;
					`}
				>
					<CheckboxField
						color='secondary'
						label={options?.find(({ value: v }) => v === true)?.label || 'Yes'}
						name='filter-boolean'
						id={`${inputName}-filter-boolean-yes`}
						checked={yesChecked}
						value={yesChecked}
						onChange={() => changeValue(!yesChecked, noChecked)}
					/>
					<CheckboxField
						color='secondary'
						label={options?.find(({ value: v }) => v === false)?.label || 'No'}
						name='filter-boolean'
						id={`${inputName}-filter-boolean-no`}
						checked={noChecked}
						value={noChecked}
						onChange={() => changeValue(yesChecked, !noChecked)}
					/>
					{!neverNull && <IncludeNull value={fullValue} inputName={inputKey} onChange={onChange} />}
				</div>
			</FilterAccordionDetails>
		</FilterAccordion>
	);
}
