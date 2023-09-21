import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useMemo, useState } from 'react';

import { assert } from '@/helpers/utilities';
import { FreeSoloCellEditor } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/FreeSoloCellEditor';
import { ValueFormatter } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/shared';

const CHOOSE_MODEL = 'Choose Model';
const REMOVE_ASSIGNMENT = 'Remove Assignment';
const NOT_MODELS = [CHOOSE_MODEL, REMOVE_ASSIGNMENT];

const SEPARATOR = 'SEPARATOR';

function filterByName(items, search) {
	return items.filter(({ name }) => (name as string).match(search));
}

export const EconGroupCellEditor = forwardRef((props: ICellEditorParams, ref: ForwardedRef<ICellEditor>) => {
	const [search, setSearch] = useState('');

	const { econGroups } = props.context;

	const items = useMemo(() => filterByName(econGroups, search), [econGroups, search]);

	assert(items);

	return (
		<FreeSoloCellEditor
			ref={ref}
			{...props}
			parseValue={(value) => {
				if (NOT_MODELS.includes(value)) return value;
				const item = items.find((v) => v.name === value) ?? value;
				return item;
			}}
			value={props?.value}
			options={[REMOVE_ASSIGNMENT, ...(items?.length ? [SEPARATOR] : []), ...items]}
			formatValue={(value) => {
				return value?.name ?? value ?? '';
			}}
			onChange={setSearch}
			getOptionDisabled={(value) => {
				if (value === 'SEPARATOR') return true;
				return false;
			}}
			renderOption={(value) => {
				if (value === 'SEPARATOR')
					return (
						<div
							css={`
								border-top: 1px solid black;
								width: calc(100% + 2rem);
								margin: 0 -1rem;
							`}
						/>
					);
				const name = value?.name;
				if (!name) return value;
				return <ValueFormatter value={name} type='header' />;
			}}
		/>
	);
});
