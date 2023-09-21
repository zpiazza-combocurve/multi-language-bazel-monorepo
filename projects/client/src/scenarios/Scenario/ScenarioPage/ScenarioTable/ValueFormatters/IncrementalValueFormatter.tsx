import { ICellRendererParams } from 'ag-grid-community';

export function IncrementalFormatter(params: ICellRendererParams) {
	if (params.node.group) return null;
	return (
		<div
			css={`
				display: flex;
				justify-content: center;
			`}
		>
			{params.value ?? '-'}
		</div>
	);
}
