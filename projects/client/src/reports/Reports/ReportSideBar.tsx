import { IconDefinition, faExpand, faFilter, faGlobe, faPrint, faTint } from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { Toolbar } from '@/components';
import { Box, Button, Drawer, Icon, List, ListItem } from '@/components/v2';
import theme from '@/helpers/styled';

export enum ItemMenu {
	None,
	WellList,
	Filter,
	Map,
	Print,
	Fullscreen,
}

type OptionMenuType = {
	id: ItemMenu;
	label: string;
	icon: IconDefinition;
};

const topMenu: OptionMenuType[] = [
	{ id: ItemMenu.WellList, label: 'well list', icon: faTint },
	{ id: ItemMenu.Filter, label: 'filter', icon: faFilter },
	{ id: ItemMenu.Map, label: 'map', icon: faGlobe },
];

const bottomMenu: OptionMenuType[] = [
	{ id: ItemMenu.Print, label: 'print', icon: faPrint },
	{ id: ItemMenu.Fullscreen, label: 'fullscreen', icon: faExpand },
];

const StyledButton = styled(Button)`
	min-width: 32px;
` as typeof Button;

const StyledListItem = styled(ListItem)`
	justify-content: center;
` as typeof ListItem;

type ReportSideBarProps = {
	activeMenu: ItemMenu;
	onMenuClick: (menu: ItemMenu) => void;
};

export const ReportSideBar = ({ activeMenu, onMenuClick }: ReportSideBarProps) => {
	const barWidth = 56;

	return (
		<Drawer
			variant='permanent'
			css={`
				width: ${barWidth};
				z-index: 1;
			`}
			PaperProps={{
				style: {
					width: barWidth,
					backgroundColor: theme.backgroundOpaque,
				},
			}}
		>
			<Toolbar
				css={`
					min-height: 3.5rem;
				`}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					height: '100%',
				}}
			>
				<nav aria-label='reports menu'>
					<List>
						{topMenu.map(({ id, label, icon }) => {
							const isSelected = activeMenu === id;

							return (
								<StyledListItem key={id}>
									<StyledButton
										aria-label={label}
										variant={isSelected ? 'outlined' : 'text'}
										color={isSelected ? 'secondary' : 'default'}
										onClick={() => onMenuClick(id)}
									>
										<Icon fontSize='small'>{icon}</Icon>
									</StyledButton>
								</StyledListItem>
							);
						})}
					</List>
				</nav>

				<List>
					{bottomMenu.map(({ id, label, icon }) => (
						<StyledListItem key={id}>
							<StyledButton aria-label={label} onClick={() => onMenuClick(id)}>
								<Icon fontSize='small'>{icon}</Icon>
							</StyledButton>
						</StyledListItem>
					))}
				</List>
			</Box>
		</Drawer>
	);
};
