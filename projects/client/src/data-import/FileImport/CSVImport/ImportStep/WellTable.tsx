import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@material-ui/data-grid';
import { useMemo, useState } from 'react';

import { useBool } from '@/components/hooks';
import { Checkbox } from '@/components/v2';

const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 52;
const ROW_HEIGHT = 52;
const ROW_NUMBER = 8;
const TABLE_HEIGHT = HEADER_HEIGHT + ROW_NUMBER * ROW_HEIGHT + FOOTER_HEIGHT;

const wellColumns = [
	{ field: 'chosenID', headerName: 'Chosen ID', width: 200 },
	{ field: 'well_name', headerName: 'Well Name', width: 200 },
	{ field: 'well_number', headerName: 'Well Number', width: 200 },
];

const IMPORT_MODE = {
	NEW_ONLY: { value: 'create', label: 'New Wells' },
	UPDATE: { value: 'update', label: 'Update Existing' },
	BOTH: { value: 'both', label: 'Both' },
};

const PRODUCTION_IMPORT_MODE = {
	REPLACE: { value: 'replace', label: 'Overwrite all existing production data' },
	UPDATE: { value: 'update', label: 'Append new production data and overwrite on overlap' },
};

function getImportMode(importNew, updateExisting) {
	if (importNew && updateExisting) {
		return IMPORT_MODE.BOTH.value;
	}
	if (importNew) {
		return IMPORT_MODE.NEW_ONLY.value;
	}
	if (updateExisting) {
		return IMPORT_MODE.UPDATE.value;
	}
	return null;
}

function getSelectedOptions(mode): [boolean, boolean] {
	if (mode === IMPORT_MODE.NEW_ONLY.value) {
		return [true, false];
	}
	if (mode === IMPORT_MODE.UPDATE.value) {
		return [false, true];
	}
	if (mode === IMPORT_MODE.BOTH.value) {
		return [true, true];
	}
	return [false, false];
}

export function useImportModeSelection(initialImportMode = IMPORT_MODE.BOTH.value) {
	const [initialOnlyNews, initialExisting] = getSelectedOptions(initialImportMode);
	const [importNew, , , toggleNew, setImportNew] = useBool(initialOnlyNews);
	const [updateExisting, , , toggleExisting, setUpdateExisting] = useBool(initialExisting);
	const { BOTH, NEW_ONLY, UPDATE } = IMPORT_MODE;
	const importMode = getImportMode(importNew, updateExisting);
	const handleImportModeChange = (event) => {
		const {
			target: { value: newImportMode },
		} = event;
		const [onlyNews, existing] = getSelectedOptions(newImportMode);
		setImportNew(onlyNews);
		setUpdateExisting(existing);
	};
	return {
		importOptions: [NEW_ONLY, UPDATE, BOTH],
		importMode,
		handleImportModeChange,
		toggleNew,
		importNew,
		toggleExisting,
		updateExisting,
	};
}

export function useProductionImportModeSelection(initialReplaceProduction = true, importMode = IMPORT_MODE.BOTH.value) {
	const [replaceProduction, setReplaceProduction] = useState(initialReplaceProduction);
	const { REPLACE, UPDATE } = PRODUCTION_IMPORT_MODE;
	const handleProductionImportModeChange = (event) => {
		setReplaceProduction(event.target.value === REPLACE.value);
	};
	return {
		productionImportOptions: importMode === IMPORT_MODE.NEW_ONLY.value ? null : [REPLACE, UPDATE],
		productionImportMode: replaceProduction ? REPLACE.value : UPDATE.value,
		replaceProduction,
		handleProductionImportModeChange,
	};
}

function wellToRow({ chosenID = 'N/A', well_name = 'N/A', well_number = 'N/A' }) {
	return { id: chosenID, chosenID, well_name, well_number };
}

export function getNewRows(wellsToCreate = []) {
	return wellsToCreate.map(wellToRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getUpdatedRows(wellsToUpdate: any[] = []) {
	let duplicatedWellCount = 0;
	return [
		wellsToUpdate?.map(({ wells, ...well }) => {
			duplicatedWellCount += wells.length - 1;
			return wellToRow(well);
		}) || [],
		duplicatedWellCount,
	];
}

export function useWellRows(wellsToCreate, wellsToUpdate) {
	const newRows = useMemo(() => getNewRows(wellsToCreate), [wellsToCreate]);
	const [updatedRows, duplicatedWells] = useMemo(() => getUpdatedRows(wellsToUpdate), [wellsToUpdate]);
	return [newRows, updatedRows, duplicatedWells];
}

function CustomToolbar({ label, selected, handleToggle, disabled }) {
	return (
		<GridToolbarContainer
			css={`
				display: flex;
				justify-content: space-between;
				// increase specificity;
				&&& {
					padding-left: 0.5rem;
					padding-right: 0.5rem;
				}
			`}
		>
			<div
				css={`
					display: flex;
					align-items: center;
					font-size: 1.25rem;
				`}
			>
				<Checkbox
					checked={selected}
					onChange={(event) => handleToggle(event.target.checked)}
					inputProps={{ 'aria-label': 'primary checkbox' }}
					disabled={disabled}
				/>
				<span>{label}</span>
			</div>
			<GridToolbarExport />
		</GridToolbarContainer>
	);
}

export function WellTable({ rows, label, className, selected, handleToggle, disabled, loading, duplicatedCount }) {
	const text = `${label}: ${rows.length}`;
	const toolbarLabel = duplicatedCount ? `${text} (${duplicatedCount} duplicated)` : text;
	return (
		<div
			css={`
				height: ${TABLE_HEIGHT}px;
			`}
			className={className}
		>
			<DataGrid
				rows={rows}
				columns={wellColumns}
				disableMultipleSelection
				loading={loading}
				components={{
					// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
					Toolbar: () => (
						<CustomToolbar
							label={toolbarLabel}
							selected={selected}
							handleToggle={handleToggle}
							disabled={disabled}
						/>
					),
				}}
			/>
		</div>
	);
}
