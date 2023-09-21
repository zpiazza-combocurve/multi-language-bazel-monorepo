import { useCallback } from 'react';

import { Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText } from '@/components/v2';
import { titleize } from '@/helpers/text';

import { SCHEDULING_STATUS_OPTIONS } from './types';

export const StatusChooser = ({ resolve, onHide, visible, onChoose = resolve }) => {
	const handleSelect = useCallback(
		async (status) => {
			onHide();
			onChoose(status);
		},
		[onHide, onChoose]
	);

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xs'>
			<DialogTitle>Choose Status</DialogTitle>
			<DialogContent>
				<List>
					{SCHEDULING_STATUS_OPTIONS.map((status) => (
						<ListItem
							css={`
								&:hover {
									cursor: pointer;
									background: rgba(153, 153, 153, 0.12);
								}
							`}
							key={status}
							onClick={() => handleSelect(status)}
						>
							<ListItemText>{titleize(status)}</ListItemText>
						</ListItem>
					))}
				</List>
			</DialogContent>
		</Dialog>
	);
};
