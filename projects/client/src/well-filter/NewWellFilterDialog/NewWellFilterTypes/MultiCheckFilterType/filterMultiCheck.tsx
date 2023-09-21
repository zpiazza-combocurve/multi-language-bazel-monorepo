import { faTimes } from '@fortawesome/pro-regular-svg-icons';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton } from '@/components/v2';
import CheckboxField from '@/components/v2/CheckboxField';
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

interface FilterMultiCheckboxProps extends FilterTypeProps {
	values: Set<string>;
	options: { label: string; value: string }[];
}

export function FilterMultiCheckbox(props: FilterMultiCheckboxProps) {
	const {
		inputName,
		values,
		options,
		exclude,
		showNull,
		neverNull,
		onChange,
		inputKey,
		projectHeader,
		removeHeaderType,
	} = props;

	const fullValue = { values, options, exclude, showNull, neverNull };

	const change = (key, checked) => {
		key = key.toLowerCase();
		const newValues = checked ? new Set([...values, key]) : new Set([...values].filter((v) => v !== key));
		onChange({ ...fullValue, values: newValues }, inputKey);
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
					{options.map((opt) => {
						const value = opt.value;
						const label = opt.label;
						const checked = values.has(value.toLowerCase()); // yes value/label is backwards. im too lazy to fix it in the db
						return (
							<CheckboxField
								color='secondary'
								id={`${`${inputKey}-${label}`}-filter-checks`}
								key={label}
								className='filter-checks'
								onChange={() => change(value, !checked)}
								label={value}
								checked={checked}
								name={value}
							/>
						);
					})}
					<Exclude value={fullValue} inputName={inputKey} onChange={onChange} label='Exclude' />
					{!neverNull && <IncludeNull value={fullValue} inputName={inputKey} onChange={onChange} />}
				</div>
			</FilterAccordionDetails>
		</FilterAccordion>
	);
}
