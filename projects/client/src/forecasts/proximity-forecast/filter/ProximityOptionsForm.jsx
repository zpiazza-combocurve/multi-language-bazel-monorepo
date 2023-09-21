import { cloneDeep } from 'lodash';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Sortable } from '@/components';
import { Box, Button, InfoTooltipWrapper, ListItem } from '@/components/v2';
import { fields as wellHeaderTypeTemplate } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as wellHeaderUnitsTemplate } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { fields as wellHeadersAbbreviatedTemplate } from '@/inpt-shared/display-templates/wells/well_headers_abbreviated.json';

import { FormField, RequiredFields } from '../fieldProperties';

export const DEFAULT_FIELD_VALUES = {
	'multi-select': { mandatory: false },
	string: { mandatory: false },
	date: {
		mandatory: false,
		absoluteRange: { start: null, end: null },
		relativePercentage: null,
		relativeValue: null,
	},
	number: {
		mandatory: false,
		absoluteRange: { start: null, end: null },
		relativePercentage: null,
		relativeValue: null,
	},
};

export const getFieldItems = (headers) =>
	headers.map((header) => ({
		label: wellHeadersAbbreviatedTemplate[header],
		operationField: false,
		type: wellHeaderTypeTemplate[header].type,
		units: wellHeaderUnitsTemplate[header] ?? null,
		value: header,
	}));

const maxCriteriaFields = 15;

const ProximityOptionsForm = ({ selectedFields, setSelectedFields, availableFieldsKey, allFields }) => {
	const [allCollapsed, setAllCollapsed] = useState(false);

	const { unregister, register } = useFormContext();

	const addField = useCallback(
		(availableFieldsKey) => {
			const field = availableFieldsKey[0];
			// need to disable addColumn button when availabelColumnsKey is empty arr
			setSelectedFields(selectedFields.concat(availableFieldsKey[0]));
			register(field, {
				value: cloneDeep(DEFAULT_FIELD_VALUES[wellHeaderTypeTemplate[field].type]),
			});
		},
		[register, selectedFields, setSelectedFields]
	);

	const changeField = useCallback(
		(index, field) => {
			const newSelectedFields = cloneDeep(selectedFields);
			newSelectedFields[index] = field;
			unregister(selectedFields[index]);
			register(field, {
				value: cloneDeep(DEFAULT_FIELD_VALUES[wellHeaderTypeTemplate[field].type]),
			});
			setSelectedFields(newSelectedFields);
		},
		[selectedFields, setSelectedFields, register, unregister]
	);

	const removeField = useCallback(
		(value) => {
			setSelectedFields([...selectedFields.filter((field) => field !== value)]);
			unregister(value);
		},
		[setSelectedFields, selectedFields, unregister]
	);

	const reorderFields = useCallback(
		(newFields) => {
			setSelectedFields(newFields);
		},
		[setSelectedFields]
	);

	const newFieldItems = getFieldItems(Object.keys(allFields));

	return (
		<>
			<RequiredFields />
			<Box css='display: flex; justify-content: space-between; align-items: center'>
				{/* TODO: make the tooltip look better */}
				<InfoTooltipWrapper tooltipTitle='Drag criteria with the highest priority to the top'>
					<Box css='font-size: 1rem'>Criteria</Box>
				</InfoTooltipWrapper>

				<Box>
					<Button css='margin-right:0.3rem' onClick={() => setAllCollapsed(!allCollapsed)}>
						{allCollapsed ? 'Expand' : 'Collapse'} All
					</Button>
					<Button
						variant='outlined'
						color='secondary'
						onClick={() => addField(availableFieldsKey)}
						css='margin:0'
						disabled={
							selectedFields.length < maxCriteriaFields
								? null
								: `Only ${maxCriteriaFields} criteria are allowed`
						}
					>
						Add Criteria
					</Button>
				</Box>
			</Box>

			<Box display='flex' flexDirection='column' css='padding:0; margin: 1rem 0 0 0 ;'>
				<Sortable
					items={selectedFields}
					onSort={reorderFields}
					renderItem={({ item, dragRef, dropRef, index }) => {
						const fieldItem = Object.values(newFieldItems).find((i) => i.value === item);

						return (
							<ListItem
								css='width: 100%;margin: 0;padding: 0;'
								ref={dropRef}
								key={fieldItem.label}
								disableGutters
							>
								<FormField
									columns={allFields}
									availableColumnsKey={[item, ...availableFieldsKey]}
									changeField={changeField}
									removeField={removeField}
									key={fieldItem.label}
									fieldItem={fieldItem}
									itemIdx={selectedFields.indexOf(fieldItem.value)}
									isExpanded={!allCollapsed}
									dragRef={dragRef}
									index={index}
								/>
							</ListItem>
						);
					}}
				/>
			</Box>
		</>
	);
};

export { ProximityOptionsForm };
