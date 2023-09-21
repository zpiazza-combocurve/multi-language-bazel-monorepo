import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import {
	Box,
	Dialog,
	DialogContent,
	DialogTitle,
	Paper,
	Tab,
	Tabs,
	type ButtonProps,
	type TextFieldProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import IconButton from '@/components/v5/IconButton';
import { DialogProps } from '@/helpers/dialog';

export const SIDEBAR_BUTTON_PROPS = {
	variant: 'outlined',
	color: 'secondary',
	size: 'small',
} satisfies Partial<ButtonProps>;

export const SIDEBAR_TEXT_FIELD_PROPS = {
	size: 'small',
} satisfies Partial<TextFieldProps>;

export const ActionsGroup = styled('div')(({ theme }) => ({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gridAutoRows: 'auto',
	gap: theme.spacing(1),
}));

interface TabListProps<T> {
	tabs: T[];
	selected?: string;
	getKey?: (tab: T) => string;
	getTitle?: (tab: T) => string;
	onChange: (tab: T) => void;
}

export function TabList<T>(props: TabListProps<T>) {
	const {
		tabs,
		selected,
		getKey = (tab: T) => tab as string,
		getTitle = (tab: T) => tab as string,
		onChange,
	} = props;

	return (
		<Tabs
			indicatorColor='primary'
			textColor='primary'
			variant='scrollable'
			value={selected}
			onChange={async (_ev, newValue: T) => {
				onChange(newValue);
			}}
		>
			{tabs.map((tab) => (
				<Tab sx={{ textTransform: 'none' }} key={getKey(tab)} label={getTitle(tab)} value={getKey(tab)} />
			))}
		</Tabs>
	);
}

export function EconLayoutDialog(
	props: {
		sidebar: JSX.Element;
		/** Expects TabList component */
		extraHeaders?: JSX.Element;
		tabs: JSX.Element;
		topbarActions?: JSX.Element;
		actions?: JSX.Element;
		children?: React.ReactNode;
	} & Omit<DialogProps<void>, 'resolve'>
) {
	const { sidebar, extraHeaders, tabs, topbarActions, actions, children, onHide, visible } = props;
	return (
		<Dialog
			sx={{
				'.MuiDialog-paperWidthXl': {
					maxWidth: 'initial',
					height: '100%',
				},
			}}
			onClose={onHide}
			open={visible}
			maxWidth='xl'
			fullWidth
			disableEscapeKeyDown
			disableEnforceFocus
		>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
				{tabs}
				<Box sx={{ flex: 1 }} />
				{topbarActions}
				<IconButton onClick={onHide}>{faTimes}</IconButton>
			</DialogTitle>
			<DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column' }}>
				{extraHeaders}
				<Box sx={{ display: 'flex', gap: 1, flex: 1, overflow: 'auto' }}>
					<Paper
						sx={{
							flex: 1,
							overflow: 'auto',
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							'&& > *': {
								mx: 1,
							},
							'&& > :first-child': {
								mt: 1,
							},
							'&& > :last-child': {
								mb: 1,
							},
						}}
					>
						{sidebar}
					</Paper>
					<Box sx={{ flex: 3, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
						{children}
						<Box sx={{ flex: 1 }} />
						{actions && (
							<Box sx={{ display: 'flex', gap: 1 }}>
								<Box sx={{ flex: 1 }} />
								{actions}
							</Box>
						)}
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
