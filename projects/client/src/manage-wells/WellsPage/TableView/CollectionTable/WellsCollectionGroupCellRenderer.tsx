import { ICellRendererParams } from 'ag-grid-community';

const WellsCollectionGroupCellRenderer = (props: ICellRendererParams) => {
	const {
		data: { wells_collection_items },
	} = props;

	if (!wells_collection_items) {
		return null;
	}

	return (
		<div
			css={`
				color: ${({ theme }) => theme.palette.secondary.main};
			`}
		>
			{wells_collection_items.length} wells
		</div>
	);
};

export default WellsCollectionGroupCellRenderer;
