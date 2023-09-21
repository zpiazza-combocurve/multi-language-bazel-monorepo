import { faChevronLeft, faChevronRight } from '@fortawesome/pro-regular-svg-icons';

import { IconButton } from '@/components/v2';
import { theme as styledTheme } from '@/helpers/styled';

export interface CollapseButtonProps {
	collapsed: boolean;
	onClick: (collapsed: boolean) => void;
	className?: string;
}

const CollapseButton = (props: CollapseButtonProps) => {
	const { className, collapsed, onClick } = props;

	return (
		<IconButton
			css={`
				padding: 0.25rem;
				border: 1px solid ${styledTheme.textColorOpaque};

				&:hover {
					background: ${styledTheme.backgroundOpaque};
				}
			`}
			className={className}
			onClick={() => onClick(!collapsed)}
			iconSize='small'
		>
			{collapsed ? faChevronRight : faChevronLeft}
		</IconButton>
	);
};

export default CollapseButton;
