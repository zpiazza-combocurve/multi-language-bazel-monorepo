import produce from 'immer';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Sortable } from '@/components';
import { Button, InfoTooltipWrapper } from '@/components/v2';
import { FieldHeader } from '@/components/v2/misc';
import { useWellColumns } from '@/well-sort/WellSort';

import ForecastFormControl, { FormControlRangeField } from '../ForecastFormControl';
import { FormCollapse, SectionContainer } from '../phase-form/layout';
import ProximityOptionsItem from './ProximityOptionsItem';

const PROXIMITY_HEADER_TYPES = ['multi-select', 'string', 'date', 'number'];

const ProximityOptionsFields = () => {
	const [open, setOpen] = useState(true);

	const { getValues, reset, setValue, watch } = useFormContext();
	const selectedCriteria = watch('selectedCriteria');

	const wellColumns = useWellColumns();
	const columns = useMemo(
		() =>
			_.mapValues(
				_.reduce(
					wellColumns,
					(result, value, key) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						if (PROXIMITY_HEADER_TYPES.includes((value as any)?.type)) {
							result[key] = value;
						}
						return result;
					},
					{}
				),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				(value, key) => ({ ...(value as any), value: key })
			),
		[wellColumns]
	);

	const availableOptions: Array<{ label: string; type: string; value: string }> = useMemo(
		() => _.filter(columns, (_v, key) => selectedCriteria.findIndex((value) => value === key) < 0),
		[columns, selectedCriteria]
	);

	const addField = useCallback(() => {
		const curValues = getValues();
		reset(
			produce(curValues, (draft) => {
				const field = availableOptions[0].value;
				draft.selectedCriteria.push(field);
			}),
			{ keepErrors: true }
		);
	}, [availableOptions, getValues, reset]);

	const removeField = useCallback(
		(field) => {
			const curValues = getValues();
			reset(
				produce(curValues, (draft) => {
					_.remove(draft.selectedCriteria, (value) => value === field);
				}),
				{ keepErrors: true }
			);
		},
		[getValues, reset]
	);

	const reorderFields = useCallback((newFields) => setValue('selectedCriteria', newFields), [setValue]);

	const applyFieldChange = useCallback(
		(fieldKey, newField) => {
			const curValues = getValues();
			reset(
				produce(curValues, (draft) => {
					const idx = draft.selectedCriteria.findIndex((value) => value === fieldKey);
					draft.selectedCriteria[idx] = newField.value;
				}),
				{ keepErrors: true }
			);
		},
		[getValues, reset]
	);

	return (
		<>
			<FieldHeader label='Proximity Options' open={open} toggleOpen={() => setOpen((p) => !p)} />

			<FormCollapse in={open}>
				<div
					css={`
						display: flex;
						flex-direction: column;
						row-gap: 0.5rem;
					`}
				>
					<SectionContainer columns={3}>
						<ForecastFormControl
							inlineLabel='Miles'
							label='Search Radius'
							name='searchRadius'
							rules={{ min: { value: 0, message: 'Value must be greater than or equal to 0' } }}
							tooltip='Measured from surface hole location'
							type='number'
						/>

						<FormControlRangeField
							dif={0}
							endLabel='Max'
							label='Well Count Range'
							max={25}
							min={1}
							name='wellCount'
							startLabel='Min'
							type='number'
							isInteger
						/>
					</SectionContainer>

					<SectionContainer>
						<InfoTooltipWrapper tooltipTitle='Drag criteria with the highest priority to the top'>
							Criteria
						</InfoTooltipWrapper>

						<div css='display: flex; justify-content: flex-end'>
							<Button color='secondary' onClick={addField} variant='outlined'>
								Add Criteria
							</Button>
						</div>
					</SectionContainer>

					{Boolean(selectedCriteria?.length) && (
						<Sortable<string>
							items={selectedCriteria}
							onSort={reorderFields}
							renderItem={({ item: criteriaKey, dragRef, dropRef }) => (
								<ProximityOptionsItem
									applyFieldChange={applyFieldChange}
									availableOptions={availableOptions}
									dragRef={dragRef}
									dropRef={dropRef}
									item={columns[criteriaKey]}
									removeField={removeField}
								/>
							)}
						/>
					)}
				</div>
			</FormCollapse>
		</>
	);
};

export default ProximityOptionsFields;
