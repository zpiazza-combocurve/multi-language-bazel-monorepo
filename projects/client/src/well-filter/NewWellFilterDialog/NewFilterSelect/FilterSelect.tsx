import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useMemo } from 'react';

import { Button, IconButton } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { Filter } from '@/inpt-shared/filters/shared';

interface FilterSelectProps {
	savedFilters: Filter[];
	selectFilter: (filterId: Inpt.ObjectId) => void;
	resetFilter: () => void;
	selectedSavedFilter: Filter;
	deleteFilter: (id: string | number | undefined) => void;
	canDeleteFilter: boolean;
}

export const FilterSelect = ({
	savedFilters,
	selectFilter,
	selectedSavedFilter,
	resetFilter,
	deleteFilter,
	canDeleteFilter,
}: FilterSelectProps) => {
	const handleSelectFilter = (filter) => {
		selectFilter(filter);
	};

	const handleDeleteFilter = useCallback(
		(id: string | number | undefined) => {
			deleteFilter(id);
		},
		[deleteFilter]
	);

	const filterMenuItems = useMemo(() => {
		return savedFilters?.map((savedFilter) => ({
			value: savedFilter?._id ?? '',
			label: (
				<div
					css={`
						max-width: 400px;
						overflow: hidden;
						white-space: nowrap;
						text-overflow: ellipsis;
					`}
				>
					{savedFilter?.name ?? ''}
				</div>
			),
			css: `display: flex; justify-content: space-between`,
			icon: (
				<IconButton
					css={`
						order: 2;
						margin-left: 10px;
					`}
					onClick={(e) => {
						e.stopPropagation();
						handleDeleteFilter(savedFilter?._id);
					}}
					iconSize='small'
					color='warning'
					disabled={!canDeleteFilter}
				>
					{faTrash}
				</IconButton>
			),
		}));
	}, [savedFilters, handleDeleteFilter, canDeleteFilter]);

	return (
		<div
			css={`
				width: 100%;
				display: flex;
				margin-bottom: 10px;
				align-items: flex-end;
				.MuiSelect-select {
					.MuiButtonBase-root {
						display: none;
					}
				}
			`}
		>
			<SelectField
				value={selectedSavedFilter?._id || ''}
				menuItems={filterMenuItems}
				label={`Filters (${filterMenuItems.length})`}
				fullWidth
				onChange={(ev) => handleSelectFilter(ev.target.value)}
			/>
			<Button
				css={`
					height: 20px;
					margin: 0 0 5px 30px;
				`}
				color='secondary'
				onClick={resetFilter}
			>
				Reset
			</Button>
		</div>
	);
};
