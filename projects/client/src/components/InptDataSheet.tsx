import 'react-datasheet/lib/react-datasheet.css';

import hotkeys from 'hotkeys-js';
import produce from 'immer';
import React, { useState } from 'react';
// react-datasheet is no longer supported by its author. Please keep this library at v1.3.9
// Upgrading to latest version causes https://combocurve.atlassian.net/browse/CC-18313
import ReactDataSheet from 'react-datasheet';

import { useHotkey } from '@/components/hooks/useHotkey';
import { useId } from '@/components/hooks/useId';

import { useCallbackRef } from './hooks/useCallbackRef';

interface PasteAddition {
	row;
	col;
	value;
}
interface PasteChange {
	row;
	col;
	value;
	cell;
}

interface InptDataSheetProps<T extends ReactDataSheet.Cell<T, V>, V = string>
	extends Omit<ReactDataSheet.DataSheetProps<T, V>, 'onSelect'> {
	canPasteIn?: (selection: null | ReactDataSheet.Selection) => boolean; // is it used anywhere
	onPaste?(changes): void;
	onPasteCells?(changes: PasteChange[], additions: PasteAddition[]): void;
	selKey?: string;
	onSelect?(selection: ReactDataSheet.Selection): void;
	onSelect?(key: string, selection: ReactDataSheet.Selection): void;
}

/**
 * Will take shift key into account when handling selection, apparently latest versions have this feature but when tried
 * to upgraded page became unresponsive so applying this hack instead
 *
 * @see https://github.com/nadbm/react-datasheet/blob/master/src/DataSheet.js#L556
 */
function getExtSelection(currentSelection: null | ReactDataSheet.Selection, nextSelection: ReactDataSheet.Selection) {
	if (!currentSelection) {
		return nextSelection;
	}
	if (hotkeys.isPressed('shift')) {
		return {
			start: currentSelection.start,
			end: nextSelection.end,
		};
	}
	return nextSelection;
}

// TODO use kutsand
let lastSelected: string | null = null;

// command will be used instead of ctrl in macos
const getKeyCtrlShiftModifiers = (key: string) => [`ctrl+shift+${key}`, `command+shift+${key}`];

function getPasteChangesAditions({ originalChanges, selection, data }) {
	const additions = [] as PasteAddition[];
	const changes = [] as PasteChange[];
	originalChanges.forEach((row, dI) => {
		row.forEach((pasted, dJ) => {
			const i = selection.start.i + dI;
			const j = selection.start.j + dJ;
			const cell = data[i] && data[i][j];
			if (!cell) {
				additions.push({ row: i, col: j, value: pasted.data });
			} else if (!cell.readOnly) {
				changes.push({ cell, row: i, col: j, value: pasted.data });
			}
		});
	});

	return { changes, additions };
}

export default function InptDataSheet<T extends ReactDataSheet.Cell<T, V>, V = string>({
	canPasteIn = () => true,
	onPaste,
	onPasteCells,
	data,
	onSelect,
	selKey,
	...props
}: InptDataSheetProps<T, V>) {
	const ref = React.useRef<ReactDataSheet<T, V> | null>(null);
	const id = useId();
	const [selection_, setSelection] = useState<null | ReactDataSheet.Selection>(null);
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const selection = lastSelected !== id ? null : selection_;

	const handlePaste = useCallbackRef((originalChanges) => {
		if (!selection || !canPasteIn(selection)) {
			return;
		}
		if (onPasteCells) {
			const { changes, additions } = getPasteChangesAditions({ originalChanges, selection, data });
			onPasteCells(changes, additions);
		}
		onPaste?.(originalChanges);
	});

	const handleSelect = useCallbackRef((newSelection) => {
		lastSelected = id;
		let sel = getExtSelection(selection, newSelection);
		setIsEditing(ref?.current?.state?.forceEdit || false);
		const singleSelection = { ...newSelection, end: newSelection.start };

		// Required to fix weird bug where if you're currently editing a cell, the cell expands to a greater width and
		// when you click out of it, the "newSelection" object will include the cell you clicked on, plus any cell that
		// you're hovered over after the cell returns to the original width. Video explanation attached to ticket CC-13630.
		// Fix checks for if you were editing a field and sets it to single selection if you are.
		if (isEditing) {
			setIsEditing(false);
			sel = singleSelection;
		}

		setSelection(sel);

		if (onSelect && !selKey) {
			onSelect(sel);
		}

		if (onSelect && selKey) {
			onSelect(selKey, sel);
		}
	});

	const handleSelectAll = () => {
		if (!data || selection) {
			return;
		}

		handleSelect({ start: { i: 0, j: 0 }, end: { i: data.length - 1, j: data[data.length - 1].length - 1 } });
	};

	useHotkey('ctrl+a', () => {
		handleSelectAll();
		return false;
	});

	useHotkey(['left', 'up', 'right', 'down'].flatMap(getKeyCtrlShiftModifiers).join(','), (_ev, handler) => {
		if (!selection) {
			return undefined;
		}

		const sel = produce(selection, (draft) => {
			if (getKeyCtrlShiftModifiers('left').includes(handler.key)) {
				draft.start.j = 0;
			}
			if (getKeyCtrlShiftModifiers('up').includes(handler.key)) {
				draft.start.i = 0;
			}
			if (getKeyCtrlShiftModifiers('right').includes(handler.key)) {
				draft.end.j = data[data.length - 1].length - 1;
			}
			if (getKeyCtrlShiftModifiers('down').includes(handler.key)) {
				draft.end.i = data.length - 1;
			}
		});

		setSelection(sel);

		if (onSelect && !selKey) {
			onSelect(sel);
		}

		if (onSelect && selKey) {
			onSelect(selKey, sel);
		}
		return false;
	});

	return (
		<ReactDataSheet
			{...props}
			data={data}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			onPaste={handlePaste}
			onSelect={handleSelect}
			ref={ref}
		/>
	);
}
