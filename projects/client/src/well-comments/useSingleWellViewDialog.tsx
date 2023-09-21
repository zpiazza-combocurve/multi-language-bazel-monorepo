import { noop } from 'lodash';
import { useMemo } from 'react';

import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { SingleWellViewDialog, TABS } from '@/manage-wells/shared/SingleWellViewDialog';

const useSingleWellViewDialog = ({
	wellId,
	forecastId,
	onOpen = noop,
	onClose = noop,
	onHeaderSubmitCallback = noop,
}) => {
	const { project } = useAlfa();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const projectId = project!._id;

	const context = useMemo(() => ({ forecastId, projectId }), [forecastId, projectId]);

	const [dialog, showDialog] = useDialog(SingleWellViewDialog, {
		onHeaderSubmitCallback,
		wellId,
		context,
		initialTab: TABS.comments,
	});

	const handleOpen = async (...args) => {
		onOpen();
		await showDialog(...args);
		onClose();
	};

	return {
		dialog,
		handleOpen,
	};
};

export default useSingleWellViewDialog;
