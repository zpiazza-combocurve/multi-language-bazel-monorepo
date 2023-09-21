import { faCommentAlt } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useMemo } from 'react';

import { IconButton } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { assert } from '@/helpers/utilities';
import { SingleWellViewDialog, TABS } from '@/manage-wells/shared/SingleWellViewDialog';

const WellCommentButton = ({ wellId, forecastId, onOpen = _.noop, onClose = _.noop }) => {
	const { project } = useAlfa();

	assert(project, 'Expected project to be in context');

	const projectId = project._id;

	const context = useMemo(() => ({ forecastId, projectId }), [forecastId, projectId]);

	const [dialog, showDialog] = useDialog(SingleWellViewDialog, {
		wellId,
		context,
		initialTab: TABS.comments,
	});

	const handleClick = async () => {
		onOpen();
		await showDialog();
		onClose();
	};

	return (
		<>
			{dialog}
			<IconButton iconSize='small' size='small' onClick={handleClick} color='primary' tooltipTitle='Comments'>
				{faCommentAlt}
			</IconButton>
		</>
	);
};

export default WellCommentButton;
