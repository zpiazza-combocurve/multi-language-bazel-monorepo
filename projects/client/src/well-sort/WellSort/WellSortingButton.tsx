import { faChevronDown, faSortAlphaUp, faTrash } from '@fortawesome/pro-regular-svg-icons';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Button, ButtonItem, Divider, Icon, IconButton, MenuButton } from '@/components/v2';
import { CustomColorsProps } from '@/components/v2/helpers';
import { useAlfa } from '@/helpers/alfa';
import { theme } from '@/helpers/styled';

interface SortItem {
	id: string;
	label: string;
}

interface WellSortingButtonProps {
	sortList?: SortItem[];
	onChangeOrUpdateSorting: () => void;
	onSortSave: () => void;
	onManageSortings: () => void;
	onApplySorting: (sortId: string) => void;
	onSortDelete?: (item: SortItem) => void;
	primary?: boolean;
	secondary?: boolean;
	purple?: boolean;
}

// used `client/src/well-filter/WellFilterButton.tsx` as base
export function WellSortingButton({
	sortList,
	onChangeOrUpdateSorting,
	onSortSave,
	onSortDelete,
	onManageSortings,
	onApplySorting,
	primary = false,
	secondary = false,
	purple = false,
}: WellSortingButtonProps) {
	const colorProps: CustomColorsProps = {
		color: (() => {
			if (primary) {
				return 'primary';
			}
			if (secondary) {
				return 'secondary';
			}
			if (purple) {
				return 'purple';
			}
			return undefined;
		})(),
	};

	const iconFontSize = 'small';

	const { project: { _id: projectId } = {} } = useAlfa();
	const { canCreate: canCreateSortings, canDelete: canDeleteSortings } = usePermissions(SUBJECTS.Sortings, projectId);

	return (
		<div css='display: inline-flex; align-items: center;'>
			<Button style={{ minWidth: 'auto' }} {...colorProps} onClick={() => onChangeOrUpdateSorting()}>
				<Icon fontSize={iconFontSize}>{faSortAlphaUp}</Icon>
			</Button>
			<MenuButton
				{...colorProps}
				label={<Icon fontSize={iconFontSize}>{faChevronDown}</Icon>}
				style={{ minWidth: 'auto' }}
			>
				{[
					{
						primaryText: 'Save Current Sorting',
						disabled: !canCreateSortings && PERMISSIONS_TOOLTIP_MESSAGE,
						onClick: onSortSave,
					},
					{ primaryText: 'Manage Sortings', onClick: onManageSortings },
					{ divider: true },
					sortList?.length
						? sortList.map(({ id, label }) => ({
								primaryText: label,
								onClick: () => onApplySorting(id),
								children: onSortDelete && (
									<IconButton
										css={`
											color: ${theme.warningColor};
										`}
										disabled={!canDeleteSortings && PERMISSIONS_TOOLTIP_MESSAGE}
										onClick={(e) => {
											e.stopPropagation();
											onSortDelete({ id, label });
										}}
									>
										{faTrash}
									</IconButton>
								),
						  }))
						: { primaryText: 'No Saved Sortings', disabled: true },
				]
					.flat()
					.filter(Boolean)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					.map(({ divider, disabled, children, onClick, primaryText }: any, i) =>
						divider ? (
							<Divider key={`divider-${i}`} />
						) : (
							<ButtonItem
								label={primaryText}
								secondaryAction={children}
								key={primaryText}
								onClick={onClick}
								disabled={disabled}
							/>
						)
					)}
			</MenuButton>
		</div>
	);
}
