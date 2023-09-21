import { faChevronDown, faFilter, faTrash } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useMutation } from 'react-query';

import { SUBJECTS } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { Button, ButtonItem, Divider, Icon, IconButton, MenuButton } from '@/components/v2';
import { CustomColorsProps } from '@/components/v2/helpers';
import { useDoggo } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';
import { deleteApi, postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { Polygon } from '@/map/shared';

import { useSavedFilters } from './hooks';
import { WELL_FILTERS_QUERY_KEY, useSaveWellIdsAsFilter } from './utils';

interface Filter {
	name?: string;
	geo?: Polygon[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headers?: { op: 'and' | 'or'; headers: any[] };
	include?: string[];
	exclude?: string[];
	excludeAll?: boolean;
}

interface WellFilter {
	_id: string;
	projectId: string;
	name: string;
	filter: Filter;
	createdAt: string;
	updatedAt: string;
}

export function WellFilterButton({
	disabled = false,
	disableQuickFilter,
	onCloseDialog = _.noop,
	onFilterWells = _.noop,
	onOpenDialog = _.noop,
	onQuickFilter = _.noop,
	primary = false,
	purple = false,
	returnFilter,
	secondary = false,
	wellsPage = false,
	wellIds,
}: {
	className?: string;
	disabled?: boolean;
	disableQuickFilter?: boolean;
	onCloseDialog?: () => void;
	onFilterWells?: () => void;
	onOpenDialog?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onQuickFilter?: (filteredWellIds: any) => void;
	primary?: boolean;
	purple?: boolean;
	wellsPage?: boolean;
	returnFilter?: boolean;
	secondary?: boolean;
	small?: boolean;
	wellIds?: string[];
}) {
	const { project } = useAlfa();
	const saveWellIdsAsFilter = useSaveWellIdsAsFilter();
	const filtersQuery = useSavedFilters();

	const { isLoading: filtering, mutateAsync: quickFilter } = useMutation(async (wellFilter: WellFilter) => {
		const validWellIds = wellIds?.map((wellId) => typeof wellId === 'string' && wellId).filter(Boolean);
		const filters = [validWellIds && { excludeAll: true, include: validWellIds }, wellFilter.filter].filter(
			Boolean
		);
		if (returnFilter) {
			onQuickFilter(filters);
			return;
		}
		const ids = await postApi('/filters/lightFilterWellsIds', { filters, project: project?._id });
		onQuickFilter(ids);
	});

	useDoggo(filtering);

	const { isLoading: deleting, mutateAsync: quickDeleteFilter } = useMutation(async (wellFilter: WellFilter) => {
		await deleteApi(`/filters/deleteFilter/${wellFilter._id}`);
		queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
	});

	const { canCreate: canCreateFilter, canDelete: canDeleteFilter } = usePermissionsBuilder(SUBJECTS.Filters);

	const filters =
		filtersQuery.data?.map((wellFilter) => ({
			primaryText: wellFilter.name,
			key: wellFilter._id,
			onClick: () => quickFilter(wellFilter),
			children: (
				<IconButton
					css={`
						color: ${theme.warningColor};
					`}
					disabled={
						!canDeleteFilter({ projectId: wellFilter.projectId }) ||
						filtersQuery.isFetching ||
						deleting ||
						disabled
					}
					onClick={(e) => {
						e.stopPropagation();
						quickDeleteFilter(wellFilter);
					}}
				>
					{faTrash}
				</IconButton>
			),
		})) ?? [];

	const colorProps: CustomColorsProps = {
		color: (() => {
			if (!wellsPage) {
				if (primary) {
					return 'primary';
				}

				if (secondary) {
					return 'secondary';
				}

				if (purple) {
					return 'purple';
				}
			}

			return undefined;
		})(),
	};
	const iconFontSize = 'small';

	return (
		<div css='display: inline-flex; align-items: center;'>
			<Button
				aria-label='Filter Wells'
				style={{ minWidth: 'auto' }}
				{...colorProps}
				onClick={onFilterWells}
				disabled={disabled}
			>
				<Icon fontSize={iconFontSize}>{faFilter}</Icon>
			</Button>
			{!disableQuickFilter && (
				<MenuButton
					hideMenuOnClick
					{...colorProps}
					disabled={disabled}
					label={<Icon fontSize={iconFontSize}>{faChevronDown}</Icon>}
					style={{ minWidth: 'auto' }}
				>
					<ButtonItem
						onClick={async () => {
							onOpenDialog?.();
							await saveWellIdsAsFilter(wellIds);
							onCloseDialog?.();
						}}
						disabled={!canCreateFilter({ projectId: project?._id })}
						label='Save Current Wells Filter'
					/>
					<Divider />
					{filters.length ? (
						filters.map(({ key, primaryText, onClick, children }) => (
							<ButtonItem label={primaryText} secondaryAction={children} key={key} onClick={onClick} />
						))
					) : (
						<ButtonItem label='No Saved Filters' disabled />
					)}
				</MenuButton>
			)}
		</div>
	);
	/* eslint-enable react/jsx-props-no-spreading */
}
