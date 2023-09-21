import { faUpload } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useState } from 'react';

import { ButtonItem, MenuButton } from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';
import { NotificationType } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useScenario } from '@/scenarios/api';

import { MassImportDialog } from './imports/MassImportDialog';

export function useImportDialogProps() {
	const [visible, setVisible] = useState(false);
	const close = () => setVisible(false);
	const open = () => setVisible(true);
	return { close, open, visible };
}

export function useImportOptions({ scenarioId, scenarioName, refetch }) {
	const { Pusher } = useAlfa();

	const { scenario, partialUpdate } = useScenario(scenarioId);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [importCSVNotificationCallback, setImportCSVNotificationCallback] = useState<any>(null);

	useUserNotificationCallback(NotificationType.CC_CC_IMPORT, importCSVNotificationCallback);

	const sharedImportDialogProps = {
		Pusher,
		scenarioId,
		scenarioName,
		scenario,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};

	const { open: openMassImportDialog, ...importProps } = useImportDialogProps();

	const handleChangeQualifier = useCallback(
		async (column, key, showConfirmationAlert) => {
			const newScenario = await postApi(`/scenarios/${scenarioId}/activateQualifier`, { column, key });
			partialUpdate({ columns: newScenario.columns });
			if (showConfirmationAlert) {
				confirmationAlert(`Qualifier applied successfully.`);
			}
			refetch();
		},
		[refetch, scenarioId, partialUpdate]
	);

	const menuItems = [
		{
			primaryText: 'Mass Import Assumptions',
			onClick: openMassImportDialog,
			disabled: false,
		},
	];

	const importMenu = (
		<MenuButton label='IMPORTS' startIcon={faUpload}>
			{menuItems.map(({ primaryText, onClick, disabled }) => (
				<ButtonItem label={primaryText} onClick={onClick} disabled={disabled} key={primaryText} />
			))}
		</MenuButton>
	);

	const massImportDialog = (
		<MassImportDialog
			buildCurrent={refetch}
			refetch={refetch}
			handleChangeQualifier={handleChangeQualifier}
			setCallback={setImportCSVNotificationCallback}
			{...sharedImportDialogProps}
			{...importProps}
		/>
	);

	return { importMenu, massImportDialog };
}
