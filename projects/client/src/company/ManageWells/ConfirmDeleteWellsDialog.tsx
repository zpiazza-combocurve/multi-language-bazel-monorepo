import { useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import ConfirmTextField from '@/components/v2/misc/ConfirmTextField';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { pluralize } from '@/helpers/text';

import DeleteWellRepercussion from './DeleteWellRepercussion';

type ConfirmDeleteWellsDialogProps = DialogProps<boolean> & { wellIds: string[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getWellsUsage = (wellIds: string[]): Promise<any> => postApi('/well/usage', { wellIds });

const DangerAlert = styled.div`
	background-color: ${theme.warningColorOpaque};
	border-radius: 0.3125em; /* same as sweet-alert's */
	border: 1px solid ${theme.warningColor};
	color: ${theme.warningColor};
	padding: ${theme.spaceMd};
	text-align: center;
`;

export default function ConfirmDeleteWellsDialog({ onHide, resolve, visible, wellIds }: ConfirmDeleteWellsDialogProps) {
	const usageQuery = useQuery(['wells-usage', { wellIds }], () => getWellsUsage(wellIds));
	const [canDelete, setCanDelete] = useState(false);

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			<DialogTitle>Delete {pluralize(wellIds.length, 'Well', 'Wells')}</DialogTitle>
			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				`}
			>
				{usageQuery.data && (
					<>
						<DangerAlert>This action has high repercussions and can NOT be undone</DangerAlert>
						<DeleteWellRepercussion count={wellIds.length} usage={usageQuery.data} />
						<ConfirmTextField
							confirmText={`Delete ${pluralize(wellIds.length, 'Well', 'Wells')}`}
							onConfirmationChange={setCanDelete}
						/>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					disabled={(usageQuery.isLoading && 'Loading') || !canDelete}
					onClick={() => resolve(true)}
					color='error'
				>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
}
