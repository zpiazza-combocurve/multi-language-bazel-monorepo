import { EMPTY, LOADING } from '@/tables/Table/useAsyncRows';

import { SkeletonRenderer } from './SkeletonRenderer';

export const NpvRenderer = (params) => {
	if (params.value === EMPTY) return 'N/A';
	if (params.value === LOADING) return <SkeletonRenderer />;

	return (
		<div
			css={`
				display: flex;
				justify-content: space-between;
			`}
		>
			<span>{params.value}</span>
			<span>$M</span>
		</div>
	);
};
