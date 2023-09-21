import { faAngleDown, faAngleUp } from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';
import { css } from 'styled-components';

import { Separator } from '@/components/shared';
import { IconButton, Typography } from '@/components/v2';

export function Collapsible({
	title,
	children,
	collapsed,
	onCollapsed,
}: {
	title: string;
	children?: string | JSX.Element;
	collapsed: boolean;
	onCollapsed(collapsed: boolean): void;
}) {
	const toggleCollapsed = useCallback(() => {
		onCollapsed?.(!collapsed);
	}, [onCollapsed, collapsed]);

	return (
		<div
			css={`
				position: relative;
			`}
		>
			<div
				css={`
					// position: sticky;
					top: 0;
					background: ${({ theme }) => theme.palette.background.opaque};
					display: flex;
					padding: 0.5rem;
					border-radius: 4px;
					align-items: center;
					cursor: pointer;
				`}
				onClick={toggleCollapsed}
			>
				<Typography
					css={`
						flex: 1 1 0;
					`}
					variant='body1'
				>
					{title}
				</Typography>
				<div
					css={`
						flex: 0 0 auto;
						display: flex;
					`}
				>
					<Separator
						css={`
							align-self: center;
							height: 2rem;
							margin: 0 0.5rem;
						`}
					/>
					<IconButton size='small'>{collapsed ? faAngleDown : faAngleUp}</IconButton>
				</div>
			</div>
			<div
				css={`
					overflow: hidden;
					padding: 0.5rem;
					${collapsed &&
					css`
						max-height: 0;
						padding: 0;
					`};
				`}
			>
				{children}
			</div>
		</div>
	);
}
