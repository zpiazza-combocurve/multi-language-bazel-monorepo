import { assign } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { IS_NESTED_ROW_KEY, ROW_ID_KEY, TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';

import { DeckProduct, RowStructure } from './types';

export const convertCmeDate = (cmeDate) => {
	if (cmeDate === 'Econ Limit') return cmeDate;
	// Expects date in format YYYY-MM-DD
	const x = cmeDate.split('-');
	if (x && x.length !== 3) {
		return 'Invalid Date';
	}
	// Returns date in format MM/YYYY
	return `${x[1]}/${x[0]}`;
};

/**
 * Converts price decks to rows for the advanced table
 *
 * @param productEntries - Price decks
 * @param headerRowStructure - The header row structure for each product
 * @returns Rows for the advanced table
 */
export const priceDecksToRows = (
	productEntries: DeckProduct[],
	headerRowStructure: RowStructure[]
): AdvancedTableRowWithPeriod[] => {
	const rows: AdvancedTableRowWithPeriod[] = [];
	if (!productEntries || !productEntries.length || !headerRowStructure || !headerRowStructure.length) {
		return rows;
	}
	let currentProdIx = 0;
	for (const productEntry of productEntries) {
		if (!productEntry.settlements || !productEntry.settlements.length) {
			continue;
		}
		const rowsForProduct: AdvancedTableRowWithPeriod[] = [];
		let parentId: string | undefined = undefined;
		for (const settlement of productEntry.settlements) {
			// Generate a unique ID for the row and check for the Parent ID
			const rowId = uuidv4();
			if (!parentId) {
				parentId = rowId;
			}
			// Get the data from the row
			const { date, settle } = settlement;
			const period = convertCmeDate(date);
			const isNestedRowKey = Boolean(rowsForProduct.length);
			// Add the row to the rows array
			rowsForProduct.push({
				period,
				value: settle,
				[ROW_ID_KEY]: rowId,
				[IS_NESTED_ROW_KEY]: isNestedRowKey,
				[TREE_DATA_KEY]: isNestedRowKey ? [parentId, rowId] : [rowId],
			});
		}
		if (!rowsForProduct.length) {
			continue;
		}
		// Setup the first row details.
		assign(rowsForProduct[0], headerRowStructure[currentProdIx]);
		rows.push(...rowsForProduct);
		// Update the current product index so we get the correct header row structure
		currentProdIx++;
	}
	return rows;
};
