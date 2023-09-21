import { faChevronRight, faGripVertical } from '@fortawesome/pro-regular-svg-icons';
import { useDrag } from 'react-dnd';

import { IconButton, ListItem, Tooltip, Typography } from '@/components/v2';
import { ProjectCustomHeader as PCHModel } from '@/helpers/project-custom-headers';
import { theme } from '@/helpers/styled';

import { getCustomHeaderDnDType } from './helpers';
import styles from './merge-projects.module.scss';

const ProjectCustomHeader = ({
	data,
	projectId,
	projectName,
	onAddHeader,
	used,
	color,
	highlighted,
}: {
	data: PCHModel;
	projectId: string;
	projectName: string;
	onAddHeader: (header: PCHModel) => void;
	used: boolean;
	color: string | undefined;
	highlighted: boolean;
}) => {
	const [{ isDragging }, drag] = useDrag({
		type: getCustomHeaderDnDType(data.headerType.type),
		item: {
			header: { ...data, projectId, projectName },
		},
		canDrag: !used,
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	});

	const rgbColorsString = used && color ? `${color}` : undefined;
	let css = rgbColorsString ? `border-color: rgb(${rgbColorsString}) !important;` : undefined;

	if (css && highlighted) {
		const colorWithOpacity = `rgb(${rgbColorsString},0.4)`;
		css += `background-color: ${colorWithOpacity};`;
	}

	return (
		<ListItem
			ref={drag}
			css={css}
			className={`${styles['custom-header']} ${!used && !isDragging ? styles.drag : ''}`}
			key={data._id}
		>
			<div className={styles['custom-header-element']}>
				<IconButton disabled={used || isDragging} size='small'>
					{faGripVertical}
				</IconButton>
				<div className={styles.labels}>
					<Tooltip title={data.label}>
						<Typography noWrap css='max-width: 170px;'>
							{data.label}
						</Typography>
					</Tooltip>
					<Typography
						css={`
							font-size: 14px;
							font-weight: 300;
							line-height: 24px;
							color: ${theme.textColorOpaque};
						`}
					>
						{data.headerType.type}
					</Typography>
				</div>
				<IconButton
					disabled={used || isDragging}
					onClick={() => {
						onAddHeader(data);
					}}
					size='small'
				>
					{faChevronRight}
				</IconButton>
			</div>
		</ListItem>
	);
};

export default ProjectCustomHeader;
