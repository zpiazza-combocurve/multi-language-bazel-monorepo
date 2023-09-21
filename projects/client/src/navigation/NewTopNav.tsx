import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
import { AppBar, Toolbar } from '@material-ui/core';
import { useState } from 'react';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { IconButton } from '@/components/v2';
import KnowledgeBase from '@/knowledge-base/KnowledgeBase';
import useKnowledgeBaseAPI from '@/knowledge-base/useKnowledgeBaseAPI';
import Breadcrumbs from '@/navigation/Breadcrumbs';
import DrawerButton from '@/navigation/DrawerButton';
import Tabs, { useTabsStore } from '@/navigation/Tabs';
import Notifications from '@/notifications/Notifications';

import { Account } from './Account';
import ComboCurveLogo from './ComboCurveLogo';
import { useHasTabs } from './ReactRouterTabs';

export const Divider = styled.div`
	margin: ${({ theme }) => theme.spacing(1)}px ${({ theme }) => theme.spacing(2)}px;
	width: 2px;
	background: ${({ theme }) => theme.palette.divider};
	align-self: stretch;
`;

export function TopNavbar({ children }) {
	const [kbDrawerOpen, setKBDrawerOpen] = useState(false);
	const { newArticles } = useKnowledgeBaseAPI();
	const tabs = useTabsStore((store) => store.tabs);
	const showTabs = useHasTabs() || tabs.length > 0;
	return (
		<div
			css={`
				width: 100%;
				height: 100%;
				display: flex;
				flex-direction: column;
			`}
		>
			<AppBar
				position='static'
				css={`
					background-color: ${({ theme }) => theme.palette.background.opaque};
					z-index: 4; // HACK for react-md dialogs issue
				`}
			>
				<Toolbar
					css={`
						min-height: 3.5rem;
						padding: 0 0.5rem;
					`}
				>
					<DrawerButton />
					<ComboCurveLogo variant='navbar' />
					<div
						css={`
							margin-left: ${({ theme }) => theme.spacing(1)}px;
						`}
					>
						<Breadcrumbs />
					</div>
					{showTabs && <Divider />}
					<div
						css={`
							min-height: 2rem;
							transition: margin-top 200ms;
							align-self: center;
							height: 100%;
							& > .MuiTabs-root {
								height: 100%;
								.MuiTabs-flexContainer {
									height: 100%;
									display: flex;
									align-items: center;
									a {
										margin-right: ${({ theme }) => theme.spacing(2)}px;
										.MuiButtonBase-root {
											padding: 0;
										}
									}
									a.disabled-tab-link {
										cursor: default;
									}
									a:last-child {
										margin-right: 0;
									}
								}
								.MuiTabs-indicator {
									height: 3px;
								}
							}
						`}
					>
						<Tabs />
					</div>
					<div css={{ flex: 1 }} />
					<Account />
					<Notifications />
					<IconButton
						css={`
							padding: 8px;
						`}
						onClick={() => setKBDrawerOpen(true)}
						tooltipTitle='Help'
						badgeProps={{ color: 'primary', badgeContent: newArticles?.length, overlap: 'rectangular' }}
						{...getTaggingProp('general', 'help')}
					>
						{faQuestion}
					</IconButton>
				</Toolbar>
			</AppBar>
			<KnowledgeBase kbDrawerOpen={kbDrawerOpen} setKBDrawerOpen={setKBDrawerOpen} />
			<div
				css={`
					flex: 1;
					overflow: auto;
				`}
			>
				{children}
			</div>
		</div>
	);
}
