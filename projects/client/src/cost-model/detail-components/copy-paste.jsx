import { groupBy, max } from 'lodash-es';

const DATE_OR_DATE_RANGE_REGEX = /(\d\d?\/\d\d?\/\d{4})(\s*-\s*\d\d?\/\d\d?\/\d{4})?/;

// Updated DateWithoutDay Regex to use a lookbehind and lookahead to ensure that the provided string is at most of format MM/YYYY
// Negative Lookbehind: (?>!\d) ensures that there are no three digits before the month
// Negative Lookahead: (?!\d) ensures that there are no three digits after the year
// Unit tests for default use-cases are in copy-paste.test.js and are passing
const DATE_WITHOUT_DAY_REGEX = /(?<!\d)(\d\d?\/\d{4})(\s*-\s*\d\d?\/\d{4})?(?!\d)/;

export function getDateRangeStart(value) {
	const match = DATE_OR_DATE_RANGE_REGEX.exec((value || '').trim());
	if (!match) {
		// checks to see if the date format is actually MM/YYYY and returns a date thats accepted (MM/DD/YYYY)
		const matchWithoutDay = DATE_WITHOUT_DAY_REGEX.exec((value || '').trim());
		if (matchWithoutDay && matchWithoutDay.length >= 2 && matchWithoutDay[1]) {
			const dateToChange = matchWithoutDay[1];
			const indexOfSlash = dateToChange.indexOf('/');
			if (indexOfSlash > -1) {
				const newDate = `${dateToChange.slice(0, indexOfSlash)}/01${dateToChange.slice(indexOfSlash)}`;
				return newDate;
			}
		}
	}
	return match ? match[1] : '';
}

const NUM_OR_NUM_RANGE_REGEX = /(\d+)(\s*-\s*(\d+))?/;

export function getNumberRangeValue(value) {
	const match = NUM_OR_NUM_RANGE_REGEX.exec((value || '').trim());

	if (!match) {
		return '';
	}
	const start = match[1];
	const end = match[3];

	if (end) {
		return parseInt(end, 10) - parseInt(start, 10) + 1;
	}
	return parseInt(start, 10);
}

export function getNumberRangeRateValue(value) {
	const match = NUM_OR_NUM_RANGE_REGEX.exec((value || '').trim());

	if (!match) {
		return '';
	}
	const start = match[1];

	return parseInt(start, 10);
}

export function parseValue(meta, value) {
	switch (meta.fieldType) {
		case 'date-range':
			// can keep the mm/dd/yyyy format to prevent time zone conversion issue
			return getDateRangeStart(value);
		case 'number-range':
			return getNumberRangeValue(value);
		case 'number-range-rate':
			return getNumberRangeRateValue(value);
		case 'number':
			if (meta.valType === 'dollars') {
				return parseFloat(value.replace(/[$,]/g, ''), 10);
			}
			if (meta.valType === 'percentage') {
				return parseFloat(value.replace(/[%,]/g, '').replace(',', ''), 10);
			}
			return parseFloat(value.replace(',', ''), 10);
		default:
			return value;
	}
}

const rowKeyToIndex = (key) => parseInt(key, 10);

/** Generic `onPasteCells` handler for `<InptDataSheet />` */
export function defaultHandlePasteCells({ changes, additions, addRow, changeCell, onlyFirstRow }) {
	/* changes */
	changes.forEach(({ cell, value }, idx) => {
		if (cell.meta) {
			if (onlyFirstRow && idx > 0) {
				return;
			}
			if (idx === changes.length - 1 && value === '') {
				// prevent paste clear the value of next row of the last pasted row
				return;
			}
			changeCell(cell.meta, value);
		}
	});

	/* insertions */
	if (onlyFirstRow) {
		return;
	}

	const maxCol = changes.reduce((last, { col }) => (col > last ? col : last), -1);
	const lastRow = changes.reduce((last, { row }) => (row > last ? row : last), -1);
	const lastRowCells = changes.filter(({ row }) => row === lastRow);

	if (!lastRowCells.length) {
		return;
	}
	const lastRowArrayIndex = lastRowCells[0].cell.meta && lastRowCells[0].cell.meta.index;

	if (!(lastRowArrayIndex || lastRowArrayIndex === 0)) {
		// can only insert new rows after a row that is part of an array
		return;
	}
	const additionsByRow = groupBy(additions, 'row');

	const lastValueRow = max(
		Object.keys(additionsByRow)
			.filter((key) => additionsByRow[key].find((cell) => cell.value))
			.map(rowKeyToIndex)
	);
	if (!lastValueRow) {
		// no new rows with values
		return;
	}

	Object.keys(additionsByRow).forEach((key) => {
		if (rowKeyToIndex(key) > lastValueRow) {
			// trailing empty row
			return;
		}
		let rowInserted = false;
		additionsByRow[key].forEach((cell) => {
			if (cell.row > lastRow && cell.col <= maxCol) {
				// ignoring cells outside table limits (extra cells to the right) and
				// empty changes caused by merged-cells previous to the current row
				if (!rowInserted) {
					// create the new row before applying changes, but only if there's at least one relevant cell
					addRow();
					rowInserted = true;
				}
				const referenceCell = lastRowCells.find(({ col }) => col === cell.col);
				if (referenceCell && referenceCell.cell.meta) {
					const { meta } = referenceCell.cell;
					changeCell({ ...meta, index: meta.index + (cell.row - referenceCell.row) }, cell.value);
				}
			}
		});
	});
}

export function getSelectValueProps(meta, value) {
	if (meta.fullMenuItems) {
		const index = meta.fullMenuItems.findIndex((item) => item.value === value || item.label === value);
		const fullMenuItem = meta.fullMenuItems[index];
		const itemValue = meta.menuItems[index];

		if (fullMenuItem && itemValue) {
			return {
				fullMenuItem,
				value: itemValue,
			};
		}
	}

	return null;
}
