import { faChevronRight, faGripVertical } from '@fortawesome/pro-regular-svg-icons';
import { useDrag } from 'react-dnd';

import { IconButton, ListItem, Tooltip, Typography } from '@/components/v2';
import { toLocalDate } from '@/helpers/dates';
import { theme } from '@/helpers/styled';

import { getQualifierDnDType } from './helpers';
import styles from './merge-scenarios.module.scss';

const Qualifier = ({
	assumption,
	qualifier,
	scenarioId,
	scenarioName,
	onAddQualifier,
	used,
	color,
	highlighted,
}: {
	assumption: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	qualifier: any;
	scenarioId: string;
	scenarioName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifier: (qualifierObj: any) => void;
	used: boolean;
	color: string | undefined;
	highlighted: boolean;
}) => {
	const [{ isDragging }, drag] = useDrag({
		type: getQualifierDnDType(assumption),
		item: {
			qualifier: { ...qualifier, scenarioId, scenarioName },
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
			className={`${styles.qualifier} ${!used && !isDragging ? styles.drag : ''}`}
			key={qualifier.key}
		>
			<div className={styles['qualifier-element']}>
				<IconButton className={styles.drag} disabled={used || isDragging} size='small'>
					{faGripVertical}
				</IconButton>
				<div className={styles.labels}>
					<Tooltip title={qualifier.name}>
						<Typography noWrap css='max-width: 170px;'>
							{qualifier.name}
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
						{qualifier.createdByName || 'N/A'} @ {toLocalDate(qualifier.createdAt)}
					</Typography>
				</div>
				<IconButton
					disabled={used || isDragging}
					onClick={() => {
						onAddQualifier(qualifier);
					}}
					size='small'
				>
					{faChevronRight}
				</IconButton>
			</div>
		</ListItem>
	);
};

export default Qualifier;
