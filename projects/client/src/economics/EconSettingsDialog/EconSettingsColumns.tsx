import { useRef } from 'react';
import styled from 'styled-components';

import { Button, Placeholder } from '@/components';
import { useDialog } from '@/helpers/dialog';
import { Section, SectionContent, SectionFooter, SectionHeader } from '@/layouts/Section';

import { EconSettingsDetails } from './EconSettingsDetails';
import { EconSettingsSaveAsDialog } from './EconSettingsSaveAsDialog';
import { ActionsContainer } from './shared';

const EconFooter = styled(SectionFooter)`
	padding: 1rem;
	text-align: center;
`;

export function EconSettingsColumns({
	loading,
	handleReset,
	update,
	setCurrentSetting,
	currentSetting,
	fields,
	create,
}) {
	const [econSettingsSaveAsDialog, promptSaveAsDialog] = useDialog(EconSettingsSaveAsDialog);

	const ref = useRef();

	const onSaveAs = async () => {
		const result = await promptSaveAsDialog({
			initialName: currentSetting.name,
			renderNode: ref.current,
			disableScrollLocking: true,
		});
		if (!result) {
			return;
		}
		create(result);
	};
	return (
		<Section ref={ref}>
			{econSettingsSaveAsDialog}
			<SectionHeader as={ActionsContainer}>
				<Button raised disabled={loading} onClick={handleReset} transform>
					Reset
				</Button>
				<Button raised disabled={loading || !currentSetting?._id} onClick={update} transform>
					Save
				</Button>
				<Button raised disabled={loading} onClick={onSaveAs} transform>
					Save As
				</Button>
			</SectionHeader>
			<SectionContent>
				<Placeholder loading={loading} loadingText='Loading Settings...'>
					<EconSettingsDetails onChange={setCurrentSetting} setting={currentSetting} fields={fields} />
				</Placeholder>
			</SectionContent>
			<EconFooter>
				<span className='md-text'>Tip: The fewer columns you select the faster economics will run.</span>
			</EconFooter>
		</Section>
	);
}
