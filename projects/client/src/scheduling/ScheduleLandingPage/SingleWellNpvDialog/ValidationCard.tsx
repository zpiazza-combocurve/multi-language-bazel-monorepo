import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { ReactNode } from 'react';

import { Icon } from '@/components/v2';

import { VerticalScrollbar } from '../components/Scrollbar';

type ValidationCardProps = {
	children: ReactNode;
};

export const ValidationCard = ({ children, ...props }: ValidationCardProps) => {
	return (
		<div {...props}>
			<div
				css={`
					font-size: 14px;
					color: #ffa726;
					display: flex;
					align-items: center;
					gap: 0.6rem;
					margin-bottom: 1rem;
				`}
			>
				<Icon>{faInfoCircle}</Icon>
				<span>Some data is missing!</span>
			</div>
			<div
				css={`
					display: flex;
					flex-direction: column;
					gap: 0.4rem;
					max-height: 45px;
					${VerticalScrollbar}
				`}
			>
				{children}
			</div>
		</div>
	);
};
