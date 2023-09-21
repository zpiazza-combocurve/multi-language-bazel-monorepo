import { faChevronDown, faChevronUp, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactNode } from 'react';

import { Divider, IconButton, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';

import styles from './merge-projects.module.scss';

const ExpandableHeaderSection = ({
	expanded,
	onToggle,
	title,
	warning,
	beforeToggle,
	children,
}: {
	expanded: boolean;
	onToggle: (expanded: boolean) => void;
	title: string;
	warning?: string;
	beforeToggle?: ReactNode;
	children: ReactNode;
}) => {
	return (
		<div className={styles['expandable-header-section']}>
			<div
				css={warning ? `border: 1px ${theme.warningAlternativeColor} solid` : undefined}
				className={styles['header-wrapper']}
			>
				<div className={styles['section-info']}>
					<Typography>{title}</Typography>
					<div className={styles['section-sub-info']}>
						{warning && (
							<>
								<Typography className={styles['info-p']}>{warning}</Typography>
								<FontAwesomeIcon
									className={styles['status-icon']}
									color={theme.warningAlternativeColor}
									size='lg'
									icon={faExclamationTriangle}
								/>
							</>
						)}
						{beforeToggle}
					</div>
				</div>
				<div className={styles.toggle}>
					<Divider orientation='vertical' />
					<IconButton size='small' onClick={() => onToggle(!expanded)}>
						{expanded ? faChevronUp : faChevronDown}
					</IconButton>
				</div>
			</div>
			{expanded && children}
		</div>
	);
};

export default ExpandableHeaderSection;
