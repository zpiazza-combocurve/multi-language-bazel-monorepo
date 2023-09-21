import * as React from 'react';

import { useCallbackRef } from '@/components/hooks';
import { Selection } from '@/components/hooks/useSelection';
import { addHOCName } from '@/components/shared';
import { zingchart } from '@/helpers/zing';

function useZingchartSelection({
	plotId: selectionPlot,
	ids,
	selection,
}: {
	plotId?: string;
	ids: string[];
	selection: Selection | undefined;
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const chartRef = React.useRef<any>(null); // TODO properly type later

	const updateSelection = useCallbackRef(() => {
		if (!chartRef.current || !selection || !ids?.length) {
			return;
		}

		const nodesindexes = ids.map((_, i) => i).filter((i) => selection.selectedSet.has(ids[i]));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const result = [] as any[];
		result[0] = nodesindexes;
		zingchart.exec(chartRef.current.id, 'setselection', { selection: result });
	});

	const events = {
		click: ({ target }) => {
			if (!selection) {
				return true;
			}
			if (target === 'none') {
				selection.deselectAll();
			}
			return true;
		},
		node_click: ({ plotid, selected, nodeindex }) => {
			if (!selection) {
				return true;
			}
			const nodeid = ids?.[nodeindex];
			if ((selectionPlot !== undefined && plotid !== selectionPlot) || !nodeid) {
				return false;
			}
			if (selected) {
				selection.select(nodeid);
			} else {
				selection.deselect(nodeid);
			}
			return true;
		},
		'zingchart.plugins.selection-tool.selection': ({ selection: eventSelection }) => {
			if (!selection) {
				return true;
			}
			// TODO should find out which is the plotindex and use that one for the selection instead of the first plot selection
			const selectedNodes = eventSelection[0];
			if (!selectedNodes) {
				return false;
			}
			const selectedIds = selectedNodes.map((i) => ids[i]);
			selection.select(selectedIds);
			return true;
		},
		// TODO make sure selection is kept in sync, check 'reload' and other events, perhaps modify and render
	};
	return { updateSelection, events, chartRef };
}

export function useZingchartFastlineSelection({ selection, ids }: { ids: string[]; selection: Selection | undefined }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const chartRef = React.useRef<any>(null);

	const updateSelection = useCallbackRef(() => {
		if (!chartRef.current || !selection) {
			return;
		}
		zingchart.plugins.fastline.setSelection({
			id: chartRef.current.id,
			plotindexes: ids
				.map((id, index) => ({ id, index }))
				.filter(({ id }) => Boolean(id) && selection.selectedSet.has(id))
				.map(({ index }) => index),
		});
	});

	const events = {
		click: ({ target }) => {
			if (target === 'none') {
				selection?.deselectAll();
				return true;
			}
			return true;
		},
		'zingchart.plugins.fastline.selection': ({ selection: eventSelection }) => {
			selection?.select(eventSelection.map((plotindex) => ids[plotindex]).filter(Boolean));
			return true;
		},
		'zingchart.plugins.fastline.click': ({ plotindex, selection: eventSelection }) => {
			const plotId = ids[plotindex];
			if (!plotId) {
				return false;
			}

			const isSelected = eventSelection.includes(plotindex);
			// TODO enable this check back again if it fails
			// if (!plotId) {
			// 	return false;
			// }
			if (isSelected) {
				selection?.select(plotId);
			} else {
				selection?.deselect(plotId);
			}
			return true;
		},
	};

	return { updateSelection, events, chartRef };
}

function useScatterMultiplePlotSelection({
	plotIdLists,
	selection,
}: {
	plotIdLists: string[][];
	selection: Selection | undefined;
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const chartRef = React.useRef<any>(null); // TODO properly type later

	const updateSelection = useCallbackRef(() => {
		if (!chartRef.current || !selection) {
			return;
		}

		const result = plotIdLists.map((plotIds) =>
			plotIds.map((_, i) => i).filter((i) => selection.selectedSet.has(plotIds[i]))
		);

		zingchart.exec(chartRef.current.id, 'setselection', { selection: result });
	});

	const events = {
		click: ({ target }) => {
			if (!selection) {
				return true;
			}
			if (target === 'none') {
				selection.deselectAll();
			}
			return true;
		},
		node_click: ({ selected, plotindex, nodeindex }) => {
			if (!selection) {
				return true;
			}

			const nodeid = plotIdLists?.[plotindex]?.[nodeindex];
			if (!nodeid) {
				return false;
			}
			if (selected) {
				selection.select(nodeid);
			} else {
				selection.deselect(nodeid);
			}
			return true;
		},
		'zingchart.plugins.selection-tool.selection': ({ selection: eventSelection }) => {
			if (!selection) {
				return true;
			}

			const selectedIds = eventSelection.reduce((acc, plotSelectedNodes, plotId) => {
				acc.push(...plotSelectedNodes.map((i) => plotIdLists?.[plotId]?.[i]).filter(Boolean));
				return acc;
			}, []);
			selection.select(selectedIds);
			return true;
		},
		// TODO make sure selection is kept in sync, check 'reload' and other events, perhaps modify and render
	};
	return { updateSelection, events, chartRef };
}

type FastlineSelectionProps<P> = P & {
	selection: Selection;
	/** Plots to use for selection, use this for fastline charts instead of `selectionPlotId` and `selectionNodesIds` */
	selectionPlotsIds: string[];
};
type NormalSelectionProps<P> = P & {
	selection: Selection;
	/** Plot id to use for selection */
	selectionPlotId?: string;
	/**
	 * Ids of the nodes in the `selectionPlotId` to use for selection, should be in order with the nodes in the plot,
	 * each one representing the id in the corresponding selection/plot
	 */
	selectionNodesIds: string[];
};
type ScatterMultiplePlotSelectionProps<P> = P & {
	selection: Selection;
	/**
	 * List of list, can work with multiple plots, make sure the outer list is in the order of plots, and inner list is
	 * in the order of nodes being plotted
	 */
	selectionPlotsNodesIds: string[][];
};

export type WithZingchartSelection<P> =
	| (P & { selection?: never; selectType?: never })
	| NormalSelectionProps<P>
	| FastlineSelectionProps<P>
	| ScatterMultiplePlotSelectionProps<P>;

/**
 * Will add selection property to zingchart componnet
 *
 * @example
 * 	import Zingchart_ from '@/components/Zingchart';
 * 	import { withSelection } from '@/components/Zingchart/selection';
 *
 * 	const Zingchart = withZingchartSelection(Zingchart);
 *
 * 	const selection = useSelection();
 * 	<Zingchart selection={selection} {...restOfTheProps} />;
 */
export function withZingchartSelection<P extends { data?; events? }>(ZingchartComponent: React.ComponentType<P>) {
	function WithFastlineSelection({
		selection,
		selectionPlotsIds,
		events,
		data,
		...props
	}: FastlineSelectionProps<P>) {
		const {
			updateSelection,
			events: selectionEvents,
			chartRef,
		} = useZingchartFastlineSelection({
			selection,
			ids: selectionPlotsIds,
		});

		React.useEffect(() => {
			updateSelection(); // TODO improve performance, chat with zingchart team to see we can we do about it. Also comparing the data property as we do in the Zingchart component might help shave off some updates
		}, [selection?.selectedSet, updateSelection, data]);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <ZingchartComponent ref={chartRef} data={data} {...props} events={{ ...events, ...selectionEvents }} />;
	}
	function WithNormalSelection({
		selection,
		events,
		selectionNodesIds,
		selectionPlotId,
		...props
	}: NormalSelectionProps<P>) {
		const {
			updateSelection,
			events: selectionEvents,
			chartRef,
		} = useZingchartSelection({
			selection,
			ids: selectionNodesIds,
			plotId: selectionPlotId,
		});

		React.useEffect(() => {
			updateSelection();
		}, [selection?.selectedSet, updateSelection, selectionNodesIds]);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <ZingchartComponent ref={chartRef} {...props} events={{ ...events, ...selectionEvents }} />;
	}
	function WithScatterMultiplePlotSelection({
		selection,
		events,
		selectionPlotsNodesIds,
		...props
	}: ScatterMultiplePlotSelectionProps<P>) {
		const {
			updateSelection,
			events: selectionEvents,
			chartRef,
		} = useScatterMultiplePlotSelection({
			selection,
			plotIdLists: selectionPlotsNodesIds,
		});

		React.useEffect(() => {
			updateSelection();
		}, [selection?.selectedSet, updateSelection, selectionPlotsNodesIds]);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <ZingchartComponent ref={chartRef} {...props} events={{ ...events, ...selectionEvents }} />;
	}
	function WithSelection(props: WithZingchartSelection<P>) {
		const { data, selection } = props;
		if (selection) {
			if (data?.type === 'fastline') {
				return <WithFastlineSelection {...(props as FastlineSelectionProps<P>)} />;
			}

			if (data.selectType === 'multi-select') {
				return <WithScatterMultiplePlotSelection {...(props as ScatterMultiplePlotSelectionProps<P>)} />;
			}
			return <WithNormalSelection {...(props as NormalSelectionProps<P>)} />;
		}
		return <ZingchartComponent {...props} />;
	}
	return addHOCName(WithSelection, 'withSelection', ZingchartComponent);
}
