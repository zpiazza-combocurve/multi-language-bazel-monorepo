import { useDrop } from 'react-dnd';

import { ListItem, Typography } from '@/components/v2';
import theme from '@/helpers/styled';

import { getQualifierDnDType } from './helpers';
import styles from './merge-scenarios.module.scss';

const CreateMergedQualifierDropPlaceholder = ({
	assumption,
	onAddQualifier,
}: {
	assumption: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onAddQualifier: (scenarioObj: any, qualifier: any) => void;
}) => {
	const [{ isOver }, drop] = useDrop({
		accept: getQualifierDnDType(assumption),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		drop: (item: { type: string; qualifier: any }) => {
			const scenario = {
				_id: item.qualifier.scenarioId,
				name: item.qualifier.scenarioName,
			};

			onAddQualifier(scenario, item.qualifier);
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
			className={`${styles.qualifier} ${styles['drop-qualifier']}`}
			key='drop-placeholder'
		>
			<Typography
				css={`
					font-weight: 500;
					${isOver ? `color: ${activeDropColor} !important;` : undefined}
				`}
			>
				Drop qualifier here
			</Typography>
		</ListItem>
	);
};

export default CreateMergedQualifierDropPlaceholder;
