import { faChevronDown, faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { useEffect } from 'react';

import { useDerivedState } from '@/components/hooks';
import { IconButton } from '@/components/v2';

export function useGroup(params: ICellRendererParams) {
	const {
		context: { openEconGroups = {} },
		node,
	} = params;
	const isGrouped = node.group;
	const nodeId = node.id as string;

	const isGroupColumn = node.rowGroupColumn?.getColId() === params.column?.getColId();

	const [expanded, setExpanded] = useDerivedState(node.expanded);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (openEconGroups[nodeId]) {
			// this timeout is necessary due to
			// how Ag-Grid handles re-renders and
			// tends from time to time to trigger
			// more than one child hook at a time
			timeoutId = setTimeout(() => {
				node.setExpanded(true);
				setExpanded(true);
			}, 50);
		}

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const iconButton = isGrouped && isGroupColumn && (
		<div>
			<IconButton
				onClick={() => {
					const newExpandedState = !node.expanded;
					node.setExpanded(newExpandedState);
					setExpanded(newExpandedState);

					if (newExpandedState) {
						openEconGroups[nodeId] = true;
					} else {
						delete openEconGroups[nodeId];
					}
				}}
				size='small'
				iconSize='small'
			>
				{expanded ? faChevronDown : faChevronRight}
			</IconButton>
		</div>
	);

	const groupCaseCount = params.data?.children?.filter(({ isGroupCase }) => isGroupCase).length;
	const count = isGrouped && isGroupColumn && <div>({params.data?.children?.length - groupCaseCount})</div>;

	return { isGrouped, iconButton, count };
}

export default useGroup;
