import { IHeaderParams } from 'ag-grid-community';
import { useContext, useRef } from 'react';

import { ContextMenu, SEPARATOR } from '@/components/ContextMenu';
import { assert } from '@/helpers/utilities';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';
import { useSorting } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/useSorting';

import { useColumnOptions } from './useColumnOptions';

export const WellHeaderComponent = (props: IHeaderParams) => {
	const colId = props.column.getColId();
	const colDef = props.column.getColDef();

	const showFilter = !!colDef?.filter?.render;
	const filterParams = colDef?.filterParams;
	const FilterComponent = colDef?.filter;

	const filterRef = useRef<{ getModel; setModel }>();

	const { filters } = useContext(FilterContext);

	assert(filters);

	const value = filters?.[colId];

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
						overflow: hidden;
						padding: 0 1rem;
						display: flex;
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
						{props.displayName}
					</div>
					{sortIndexIndicator}
					{sortDirectionIndicator}
				</div>
				{colId !== 'index' && (
					<ContextMenu
						items={() => [
							pinMenuItem,
							SEPARATOR,
							...autoSizeMenuItems,
							...(groupMenuItems ? [SEPARATOR, ...groupMenuItems] : []),
						]}
					/>
				)}
			</div>
			<div>
				<div
					css={`
						flex: 1;
						overflow: hidden;
					`}
				>
					{showFilter && (
						<FilterComponent
							{...(filterParams ?? {})}
							ref={filterRef}
							value={value}
							filterChangedCallback={(newValue) => {
								const currentFilterModel = props.api.getFilterModel() ?? {};
								const newFilterModel = {
									...currentFilterModel,
									[colId]: newValue,
								};
								props.api.setFilterModel(newFilterModel);
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
