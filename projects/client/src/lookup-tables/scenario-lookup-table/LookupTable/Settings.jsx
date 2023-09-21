import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Divider } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { CheckboxField, alerts } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import {
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace } from '@/helpers/text';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { copyLookupTable, deleteLookupTable } from '@/lookup-tables/scenario-lookup-table/api';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectRoutes } from '@/projects/routes';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';

import { CASE_INSENSITIVE_CHECKBOX_TITLE } from '../../shared/constants';

export default function Settings({ lookupTable, saving, saveLookupName }) {
	const [name, setName] = useDerivedState(lookupTable.name);

	const [caseInsensitiveMatching, setCaseInsensitiveMatching] = useDerivedState(
		lookupTable?.configuration?.caseInsensitiveMatching
	);

	const { project } = useCurrentProject();
	const projectRoutes = useCurrentProjectRoutes();

	const {
		canCreate: canCreateLookupTable,
		canUpdate: canUpdateLookupTable,
		canDelete: canDeleteLookupTable,
	} = usePermissions(SUBJECTS.LookupTables, project._id);

	const handleCopyLookupTable = async () => {
		const confirmed = await alerts.confirm({
			title: 'Copy Lookup Table',
			children: 'Are you sure you want to copy this lookup table?',
			confirmText: 'Copy',
		});

		if (!confirmed) {
			return;
		}

		try {
			await copyLookupTable(lookupTable._id, {
				project: project._id,
			});
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	return (
		<SettingsContainer>
			<SettingsInfoContainer>
				<SettingsTextField label='Lookup Table Name' value={name} onChange={setName} />

				<SettingsTagsList feat='scenarioLookupTable' featId={lookupTable._id} />
			</SettingsInfoContainer>

			<SettingsInfoContainer>
				<CheckboxField
					label={CASE_INSENSITIVE_CHECKBOX_TITLE}
					checked={caseInsensitiveMatching}
					onChange={(event) => setCaseInsensitiveMatching(event.target.checked)}
				/>
			</SettingsInfoContainer>

			<Divider />

			<SettingsButton
				primary
				onClick={() =>
					saveLookupName({
						name,
						configuration: {
							...lookupTable.configuration,
							caseInsensitiveMatching,
						},
					})
				}
				label='Save Lookup Table'
				info={['Save Lookup Table']}
				disabled={
					name === '' ||
					!hasNonWhitespace(name) ||
					(!canUpdateLookupTable && PERMISSIONS_TOOLTIP_MESSAGE) ||
					saving
				}
			/>

			<AssignTagsSettingsButton
				tooltipLabel={!canUpdateLookupTable ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
				disabled={!canUpdateLookupTable}
				feat='scenarioLookupTable'
				featId={lookupTable._id}
			/>

			<Divider />

			<SettingsButton
				primary
				label='Copy Lookup Table'
				disabled={(!canCreateLookupTable && PERMISSIONS_TOOLTIP_MESSAGE) || saving}
				onClick={handleCopyLookupTable}
				info={['Copy Lookup Table']}
			/>

			<SettingsDeleteButton
				feat='Lookup Table'
				onDelete={() => deleteLookupTable(lookupTable._id)}
				name={lookupTable.name}
				info={['Delete Lookup Table']}
				disabled={!canDeleteLookupTable && PERMISSIONS_TOOLTIP_MESSAGE}
				redirectTo={projectRoutes.scenarioLookupTables}
			/>
		</SettingsContainer>
	);
}
