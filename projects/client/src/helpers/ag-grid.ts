import { GridApi } from 'ag-grid-community';
import _ from 'lodash';

export function getNodesIdsInRange(api: GridApi, start: number, end: number) {
	const model = api.getModel();
	// sort indexes
	[start, end] = [Math.min(start, end), Math.max(start, end)];
	const ids = [] as string[];
	for (const i of _.range(start, end + 1)) {
		const node = model.getRow(i);
		if (node?.id) {
			ids.push(node.id);
		}
	}
	return ids;
}

/**
 * Will delete all selected cells data in ag grid table
 *
 * @returns Emptied rows data
 * @note only for cell range selection
 */
export function handleAgGridDeleteRangeSelectedCells(
	api: GridApi,
	{
		ignoreColumns = [],
		includeColumnsWithoutModification = [],
	}: { ignoreColumns?: string[]; includeColumnsWithoutModification?: string[] } = {}
) {
	const newData: Record<string, object> = {};
	const ranges = api.getCellRanges();
	if (!ranges) {
		return undefined;
	}
	ranges.forEach((range) => {
		if (!range.startRow || !range.endRow) {
			return;
		}
		const emptyCols = _.transform(
			range.columns,
			(acc, col) => {
				const id = col.getId();
				if (ignoreColumns.includes(id)) {
					return;
				}
				acc[id] = null;
			},
			{}
		);
		if (Object.keys(emptyCols).length === 0) {
			return;
		}
		const model = api.getModel();
		const [start, end] = [range.startRow.rowIndex, range.endRow.rowIndex].sort((a, b) => a - b);
		_.range(start, end + 1).forEach((i) => {
			const node = model.getRow(i);
			if (node && node.id) {
				newData[node.id] ??= {};
				newData[node.id] = { ...emptyCols };

				if (includeColumnsWithoutModification.length > 0) {
					includeColumnsWithoutModification.forEach((c) => {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						newData[node.id!][c] = node.data[c];
					});
				}
			}
		});
	});
	if (Object.keys(newData).length === 0) {
		return undefined;
	}
	return newData;
}
