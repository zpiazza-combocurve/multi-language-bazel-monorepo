import { faGripVertical, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { ListItem } from '@material-ui/core';
import { useMemo } from 'react';

import { Autocomplete, IconButton } from '@/components/v2';

import ForecastFormControl, { FormControlRangeField } from '../ForecastFormControl';
import { SectionContainer } from '../phase-form/layout';

const RELATIVE_VALUE_LABEL = 'Relative Value ∆ +/-';

const RELATIVE_PERCENTAGE_LABEL = 'Relative Percentage ∆ +/- (%)';

const ProximityOptionsItem = ({ applyFieldChange, availableOptions, dragRef, dropRef, item, removeField }) => {
	const { label: fieldLabel, value: fieldKey, type } = item;
	const basePath = `criteriaValues.${fieldKey}`;

	const fieldRender = useMemo(() => {
		if (type === 'string' || type === 'multi-select') {
			return <div>{`Match the target well's ${fieldLabel}`}</div>;
		}
		if (type === 'date') {
			return (
				<SectionContainer columns={3}>
					<ForecastFormControl
						label={RELATIVE_VALUE_LABEL}
						name={`${basePath}.relativeValue`}
						type='number'
					/>

					<FormControlRangeField
						endLabel='End Date'
						endName={`${basePath}.absoluteRange.end`}
						label='Absolute Range'
						startLabel='Start Date'
						startName={`${basePath}.absoluteRange.start`}
						type='date'
					/>
				</SectionContainer>
			);
		}
		if (type === 'number') {
			return (
				<SectionContainer>
					<ForecastFormControl
						label={RELATIVE_VALUE_LABEL}
						name={`${basePath}.relativeValue`}
						type='number'
					/>

					<ForecastFormControl
						label={RELATIVE_PERCENTAGE_LABEL}
						name={`${basePath}.relativePercentage`}
						type='number'
					/>

					<FormControlRangeField
						endLabel='Max'
						endName={`${basePath}.absoluteRange.end`}
						label='Absolute Range'
						startLabel='Min'
						startName={`${basePath}.absoluteRange.start`}
						type='number'
					/>
				</SectionContainer>
			);
		}
	}, [basePath, fieldLabel, type]);

	return (
		<ListItem ref={dropRef}>
			<section
				css={`
					display: flex;
					flex-direction: column;
					border-radius: 5px;
					border: 1px solid black;
					padding: 0.75rem 0.5rem 0.5rem 0.5rem;
					row-gap: 0.5rem;
					width: 100%;
				`}
			>
				<div
					css={`
						align-items: center;
						display: flex;
						justify-content: space-between;
					`}
				>
					<div
						css={`
							align-items: center;
							column-gap: 0.5rem;
							display: flex;
							flex-grow: 1;
						`}
					>
						<div ref={dragRef}>
							<IconButton size='small' iconSize='small'>
								{faGripVertical}
							</IconButton>
						</div>

						<Autocomplete
							disableClearable
							getOptionLabel={(option) => option?.label ?? fieldLabel}
							label='Field'
							onChange={(_ev, newValue) => applyFieldChange(fieldKey, newValue)}
							options={availableOptions}
							size='small'
							value={fieldKey}
							fullWidth
							variant='outlined'
						/>
					</div>

					<div
						css={`
							align-items: center;
							display: flex;
						`}
					>
						<ForecastFormControl
							label='Mandatory?'
							name={`${basePath}.mandatory`}
							type='boolean'
							inForm={false}
						/>

						<IconButton size='small' iconSize='small' onClick={() => removeField(fieldKey)}>
							{faTrash}
						</IconButton>
					</div>
				</div>

				{fieldRender}
			</section>
		</ListItem>
	);
};

export default ProximityOptionsItem;
