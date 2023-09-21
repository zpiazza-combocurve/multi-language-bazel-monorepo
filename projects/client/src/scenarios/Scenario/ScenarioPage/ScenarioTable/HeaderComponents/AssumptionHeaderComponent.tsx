import { IHeaderParams } from 'ag-grid-community';
import { createContext, useContext } from 'react';

import { ContextMenu, SEPARATOR } from '@/components/ContextMenu';
import { assert } from '@/helpers/utilities';
import { WarningIcon } from '@/scenarios/shared';

import { useColumnOptions } from './useColumnOptions';
import { useSorting } from './useSorting';

export const ColumnsContext = createContext<Record<string, { activeQualifier; qualifiers }> | null>(null);

export const RequiredFieldsContext = createContext<Record<string, boolean> | null>(null);

export const AssumptionHeaderComponent = (props: IHeaderParams) => {
	const assumptionKey = props.column.getColId();
	const assumptionItems = () => props.context.getAssumptionMenuItems(assumptionKey);
	const qualifierItems = () => props.context.getQualifiersMenuItems(assumptionKey);
	const columns = useContext(ColumnsContext);
	assert(columns);
	const column = columns[assumptionKey];
	const { activeQualifier, qualifiers } = column;
	const qualifier = qualifiers[activeQualifier];

	const requiredFields = useContext(RequiredFieldsContext);

	const missingValues = requiredFields?.[assumptionKey];

	const { sortDirectionIndicator, sortIndexIndicator, onSortChange } = useSorting(props);

	const { pinMenuItem, autoSizeMenuItems, groupMenuItems } = useColumnOptions(props);

	return (
		<div
			css={`
				height: 100%;
				width: calc(100% + 2rem);
				display: flex;
				flex-direction: column;
				margin: 0 -1rem;
				& > * {
					flex: 1;
					display: flex;
					align-items: center;
					&:not(:first-child) {
						border-width: 1px;
						border-color: #dde2eb;
						border-top-style: solid;
					}
				}
			`}
		>
			<div>
				<div
					onClick={onSortChange}
					css={`
						flex: 1;
						padding: 0 1rem;
						display: flex;
						overflow: hidden;
						& > * {
							flex: 0 0 auto;
						}
					`}
				>
					<div
						css={`
							flex: 1 1 0;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						`}
					>
						{missingValues && <WarningIcon />}
						{props.displayName}
					</div>
					{sortIndexIndicator}
					{sortDirectionIndicator}
				</div>
				<ContextMenu
					items={() => [
						pinMenuItem,
						SEPARATOR,
						...assumptionItems(),
						SEPARATOR,
						...autoSizeMenuItems,
						...(groupMenuItems ? [SEPARATOR, ...groupMenuItems] : []),
					]}
				/>
			</div>
			<div>
				<div
					css={`
						flex: 1;
						overflow: hidden;
						padding: 0 1rem;
					`}
				>
					{qualifier.name}
				</div>
				<ContextMenu items={qualifierItems} />
			</div>
		</div>
	);
};
