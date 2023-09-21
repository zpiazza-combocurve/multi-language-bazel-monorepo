import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useMemo, useState } from 'react';

import { FreeSoloCellEditor } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/FreeSoloCellEditor';

import { LookupTableName } from './LookupTableName';

const BUILD_LT = 'Build Lookup Table';
const ASSIGN_LT = 'Assign Lookup Table';
const REMOVE_LT = 'Remove Lookup Table';

const SEPARATOR = 'SEPARATOR';

function filterByName(items, search) {
	return items.filter(({ name }) => (name as string).match(search));
}

export const DurationCellEditor = forwardRef((props: ICellEditorParams, ref: ForwardedRef<ICellEditor>) => {
	const [search, setSearch] = useState('');

	const { data, context } = props;
	const { lookupTables, buildLookupTable, assignLookupTable, removeLookupTable } = context;

	const {
		stepDuration: { useLookup },
	} = data;

	const filteredLookups = useMemo(() => filterByName(lookupTables, search), [lookupTables, search]);

	return (
		<FreeSoloCellEditor
			ref={ref}
			{...props}
			parseValue={(value) => {
				if (!value) return value;

				if (BUILD_LT.includes(value)) {
					buildLookupTable(data);
					return value;
				}
				if (REMOVE_LT.includes(value)) {
					removeLookupTable(data);
					return value;
				}
				if (ASSIGN_LT.includes(value)) {
					assignLookupTable(data);
					return value;
				}

				const item = filteredLookups.find((v) => v.name === value) ?? value;
				return item;
			}}
			value={props?.value}
			options={[
				BUILD_LT,
				...(lookupTables?.length ? [ASSIGN_LT] : []),
				...(useLookup ? [REMOVE_LT] : []),
				...(filteredLookups?.length ? [SEPARATOR] : []),
				...filteredLookups,
			]}
			formatValue={(value) => {
				return value?.name ?? value ?? '';
			}}
			onChange={setSearch}
			getOptionDisabled={(value) => {
				if (value === SEPARATOR) return true;
				return false;
			}}
			renderOption={(value) => {
				if (value === SEPARATOR)
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

				return <LookupTableName name={name} />;
			}}
		/>
	);
});
