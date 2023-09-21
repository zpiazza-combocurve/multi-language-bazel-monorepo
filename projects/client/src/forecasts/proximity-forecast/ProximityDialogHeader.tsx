/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	faChevronDoubleLeft,
	faChevronDoubleRight,
	faCompress,
	faExpand,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import { Box } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import { withStyles } from '@material-ui/core/styles';
import { useCallback, useEffect } from 'react';

import { useCallbackRef, useMergedState } from '@/components/hooks';
import { IconButton, Tab } from '@/components/v2';
import { theme } from '@/helpers/styled';

const TabSet = withStyles({
	root: {
		marginLeft: '1rem',
	},
	indicator: {
		backgroundColor: '#1890ff',
	},
})(Tabs as any);

const TabPage = withStyles((tabTheme: any) => ({
	root: {
		textTransform: 'none',
		minWidth: '4.5rem',
		fontWeight: tabTheme.typography.fontWeightRegular,
		fontSize: '1rem',
		'&:not(.Mui-disabled):hover': {
			color: '#40a9ff',
			opacity: 1,
		},
		'&$selected': {
			color: '#1890ff',
			fontWeight: tabTheme.typography.fontWeightMedium,
		},
		'&:focus': {
			color: '#40a9ff',
		},
	},
	selected: {},
}))((props: { label: string; disabled?: string | boolean; onClick?: () => void }) => <Tab disableRipple {...props} />);

export const useProximityDialogState = (hasRun: boolean) => {
	const [{ currentTab, isMinimized, isCollapsed, displayCharts }, setDialogState] = useMergedState({
		currentTab: 0,
		isMinimized: false,
		isCollapsed: false,
		displayCharts: false,
	});

	const setDialogStateByKey = useCallbackRef((key: string) => (value: any) => setDialogState({ [key]: value }));

	const handleTabChange = useCallback(
		(event, newValue) => {
			if (hasRun || [0, 3].includes(newValue)) {
				setDialogState({
					currentTab: newValue,
					displayCharts: false,
				});
			}
		},
		[hasRun, setDialogState]
	);

	const handleChartChange = () => {
		setDialogState({
			currentTab: 3,
			displayCharts: true,
		});
	};

	useEffect(() => {
		// reset everything when going from minimized to un-minimized
		if (!isMinimized) {
			setDialogState({
				isCollapsed: false,
				displayCharts: false,
				currentTab: 0,
			});
		}
	}, [isMinimized, setDialogState]);

	useEffect(() => {
		if (!isMinimized && !isCollapsed && currentTab === 3) {
			setDialogState({
				currentTab: 0,
			});
		}
	}, [isCollapsed, currentTab, isMinimized, setDialogState]);

	return {
		currentTab,
		displayCharts,
		handleChartChange,
		handleTabChange,
		isMinimized,
		isCollapsed,
		setCurrentTab: setDialogStateByKey('currentTab'),
		setDisplayCharts: setDialogStateByKey('displayCharts'),
		setIsCollapsed: setDialogStateByKey('isCollapsed'),
		setIsMinimized: setDialogStateByKey('isMinimized'),
	};
};

interface ProximityDialogHeaderProps {
	currentTab: number;
	handleTabChange: (event: React.ChangeEvent, newValue: number) => void;
	handleChartChange: () => void;
	handle_id: string;
	isMinimized: boolean;
	isCollapsed: boolean;
	setIsCollapsed: (boolean) => void;
	setIsMinimized: (boolean) => void;
	onHide: () => void;
	hasRun: boolean;
}

const ProximityDialogHeader = ({
	currentTab,
	handleTabChange,
	handleChartChange,
	handle_id,
	isMinimized,
	isCollapsed,
	setIsCollapsed,
	setIsMinimized,
	onHide,
	hasRun,
}: ProximityDialogHeaderProps) => {
	return (
		<Box
			display='flex'
			justifyContent='space-between'
			alignItems='center'
			width='100%'
			borderBottom={`1px solid ${theme.borderColor};`}
			top={0}
			id={handle_id}
			css={`
				&:hover {
					cursor: grab;
				}
				&:active {
					cursor: grabbing;
				}
			`}
		>
			<Box display='flex' alignItems='center' padding='0 .2rem'>
				<TabSet value={currentTab} onChange={handleTabChange}>
					<TabPage label='Form' />
					<TabPage label='Normalize' disabled={!hasRun && 'Fetch proximity wells to enable'} />
					<TabPage label='Fit' disabled={!hasRun && 'Fetch proximity wells to enable'} />
					{isMinimized || isCollapsed ? <TabPage label='Charts' onClick={handleChartChange} /> : null}
				</TabSet>
			</Box>
			<Box>
				{!isMinimized && (
					<IconButton
						size='small'
						css='margin: 0 .25rem'
						onClick={() => (isCollapsed ? setIsCollapsed(false) : setIsCollapsed(true))}
					>
						{isCollapsed ? faChevronDoubleRight : faChevronDoubleLeft}
					</IconButton>
				)}

				<IconButton
					size='small'
					css='margin: 0 .25rem'
					onClick={() => setIsMinimized(!isMinimized)}
					tooltipTitle={`${isMinimized ? 'Expand' : 'Minimize'} Dialog`}
				>
					{isMinimized ? faExpand : faCompress}
				</IconButton>

				<IconButton size='small' onClick={onHide} css='margin-left: .25rem; margin-right: 1rem; padding: 0'>
					{faTimes}
				</IconButton>
			</Box>
		</Box>
	);
};

export default ProximityDialogHeader;
