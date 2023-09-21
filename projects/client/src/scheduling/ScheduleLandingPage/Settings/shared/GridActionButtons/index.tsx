import { faPlus } from '@fortawesome/pro-regular-svg-icons';

import { Button, Divider, Typography } from '@/components/v2';

import { Container } from './styles';

interface GridActionButtonsProps {
	name: string;
	addButtonDisabled?: boolean | string;
	hasSelectedRows?: boolean;
	addButtonText: string;
	addButtonTaggingProps?: Record<string, string>;
	addFunction: () => void;
	deleteFunction: () => void;
	duplicateFunction?: () => void;
}

export function GridActionButtons({
	name,
	addButtonDisabled = false,
	hasSelectedRows = false,
	addButtonText,
	addButtonTaggingProps = {},
	addFunction,
	deleteFunction,
	duplicateFunction,
}: GridActionButtonsProps) {
	return (
		<Container>
			<Typography
				css={`
					align-self: center;
				`}
				variant='subtitle2'
			>
				{name}
			</Typography>
			<Divider orientation='vertical' flexItem />

			<Button
				color='secondary'
				variant='outlined'
				startIcon={faPlus}
				onClick={addFunction}
				disabled={addButtonDisabled}
				{...addButtonTaggingProps}
			>
				{addButtonText}
			</Button>

			<Button variant='text' onClick={deleteFunction} disabled={!hasSelectedRows}>
				Delete
			</Button>
			{duplicateFunction && (
				<Button variant='text' onClick={duplicateFunction} disabled={!hasSelectedRows}>
					Duplicate
				</Button>
			)}
		</Container>
	);
}
