import { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Placeholder, SmallPagination } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem } from '@/components/v2';
import { theme } from '@/helpers/styled';
import { useModuleList } from '@/module-list/ModuleList/useModuleList';
import { Item } from '@/module-list/types';
import restoreDialogAPI from '@/projects/RestoreAPI';

export const DialogTop = styled.div`
	position: sticky;
	top: 0;
	z-index: 10;
	background-color: ${theme.background};
	justify-content: end;
	display: flex;
`;

/**
 * @param {{
 * 	resolve: (archive: import('./types').Archive | null) => void;
 * 	onHide: () => void;
 * 	projectId: string;
 * }} props;
 */

export function RestoreDialog({ visible, onHide, resolve, projectId, ...props }) {
	const [selection, select] = useState<Item | null>(null);

	const fetcher = useCallback((body) => restoreDialogAPI.getArchives({ ...body, projectId }), [projectId]);

	const filter = useModuleList(fetcher, { sort: 'createdAt' });

	const handleApply = () => resolve(selection);

	return (
		<Dialog open={visible} onClose={onHide} {...props}>
			<DialogTitle>Choose Archive version to restore</DialogTitle>
			<DialogTop>
				<SmallPagination pagination={filter.pagination} />
			</DialogTop>
			<DialogContent
				css={`
					height: 70vh;
				`}
			>
				<List>
					{filter.loading && <Placeholder loading />}
					{filter.loaded &&
						filter.items.map((archive) => (
							<ListItem
								css={`
									cursor: pointer;
								`}
								key={archive._id}
								selected={archive._id === selection?._id}
								onClick={() => select(archive)}
							>
								{archive.versionName}
							</ListItem>
						))}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					disabled={selection === null && 'Must choose a version to restore'}
					onClick={() => handleApply()}
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
