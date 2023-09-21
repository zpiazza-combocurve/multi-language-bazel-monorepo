import { useDrop } from 'react-dnd';

import { ListItem, Typography } from '@/components/v2';
import { ProjectCustomHeader as PCHModel } from '@/helpers/project-custom-headers';
import theme from '@/helpers/styled';

import { getCustomHeaderDnDType } from './helpers';
import styles from './merge-projects.module.scss';

const acceptDrop = ['string', 'number', 'integer', 'boolean', 'date', 'percent', 'multi-select', 'multi-checkbox'].map(
	(t) => getCustomHeaderDnDType(t)
);

const CreateMergedCustomHeaderDropPlaceholder = ({
	onAddMergedCustomHeaders,
}: {
	onAddMergedCustomHeaders: (projectId: string, header: PCHModel | null) => void;
}) => {
	const [{ isOver }, drop] = useDrop({
		accept: acceptDrop,
		drop: (item: { type: string; header: PCHModel & { projectId: string; projectName: string } }) => {
			onAddMergedCustomHeaders(item.header.projectId, item.header);
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	});

	const activeDropColor = theme.secondaryColor;

	return (
		<ListItem
			ref={drop}
			css={isOver ? `border-color: ${activeDropColor} !important;` : undefined}
			className={`${styles['custom-header']} ${styles['drop-header']}`}
			key='drop-placeholder'
		>
			<Typography
				css={`
					font-weight: 500;
					${isOver ? `color: ${activeDropColor} !important;` : undefined}
				`}
			>
				Drop custom header here
			</Typography>
		</ListItem>
	);
};

export default CreateMergedCustomHeaderDropPlaceholder;
