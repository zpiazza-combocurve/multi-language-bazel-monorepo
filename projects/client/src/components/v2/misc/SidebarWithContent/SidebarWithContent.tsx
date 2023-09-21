import { useState } from 'react';

import { Divider } from '@/components/v2';

import CollapseButton from './CollapseButton';
import styles from './styles.module.scss';

const FLEX_WIDTH = 12;

export interface SidebarWithContent {
	sidebarFlex?: number;
	sidebarHeader: React.ReactNode;
	sidebarContent: React.ReactNode;
	sidebarFooter: React.ReactNode;
	contentHeaderLeft: React.ReactNode;
	contentHeaderRight?: React.ReactNode;
	content: React.ReactNode;
}

const SidebarWithContent = (props: SidebarWithContent) => {
	const [collapsed, setCollapsed] = useState(false);

	const {
		sidebarFlex = 2,
		sidebarHeader,
		sidebarContent,
		sidebarFooter,
		contentHeaderLeft,
		content,
		contentHeaderRight,
	} = props;

	return (
		<div className={styles['sidebar-with-content-wrapper']}>
			{!collapsed && (
				<div className={styles['sidebar-wrapper']} style={{ flex: sidebarFlex }}>
					<div className={styles['sidebar-inner-wrapper']}>
						<div className={styles['sidebar-header']}>{sidebarHeader}</div>
						<div className={styles['sidebar-content']}>{sidebarContent}</div>
						<div className={styles['sidebar-footer']}>
							<Divider orientation='horizontal' />
							{sidebarFooter}
						</div>
					</div>
					<Divider orientation='vertical' />
				</div>
			)}
			<div className={styles['content-wrapper']} style={{ flex: FLEX_WIDTH - sidebarFlex }}>
				<div className={styles['content-inner-wrapper']}>
					<div className={styles['content-header']}>
						<CollapseButton
							className={styles['toggle-sidebar']}
							collapsed={collapsed}
							onClick={setCollapsed}
						/>
						<div className={styles['content-header-content']}>
							{contentHeaderLeft}
							{contentHeaderRight}
						</div>
					</div>
					<div className={styles['content']}>{content}</div>
				</div>
			</div>
		</div>
	);
};

export default SidebarWithContent;
