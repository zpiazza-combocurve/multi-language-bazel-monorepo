import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { useDerivedState } from '@/components/hooks';
import { CheckboxField, Divider, Tooltip, alerts } from '@/components/v2';
import {
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace } from '@/helpers/text';
import { useCurrentProject } from '@/projects/api';
import { useCurrentProjectRoutes } from '@/projects/routes';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';

import { CASE_INSENSITIVE_CHECKBOX_TITLE, CASE_INSENSITIVE_TOOLTIP_TITLE } from '../shared/constants';
import { deleteEmbeddedLookupTable } from './api';
import { useCopyEmbeddedLookupTableMutation } from './mutations';
import { EmbeddedLookupTablePageSharedProps } from './types';

export default function Settings({
	lookupTableData,
	updateEmbeddedLookupTableMutation,
}: EmbeddedLookupTablePageSharedProps) {
	const [name, setName] = useDerivedState(lookupTableData.name);

	const [caseInsensitiveMatching, setCaseInsensitiveMatching] = useDerivedState(
		lookupTableData?.configuration?.caseInsensitiveMatching
	);
	const projectRoutes = useCurrentProjectRoutes();

	const copyEmbeddedLookupTableMutation = useCopyEmbeddedLookupTableMutation();

	const handleUpdateEmbeddedLookupTable = () => {
		return updateEmbeddedLookupTableMutation.mutate({
			eltId: lookupTableData._id,
			data: {
				...lookupTableData,
				name,
				configuration: {
					...lookupTableData.configuration,
					caseInsensitiveMatching,
				},
			},
		});
	};

	const { project } = useCurrentProject();

	const handleCopyEmbeddedLookupTable = async () => {
		const confirmed = await alerts.confirm({
			title: 'Copy Lookup Table',
			children: 'Are you sure you want to copy this lookup table?',
			confirmText: 'Copy',
		});

		if (!confirmed) {
			return;
		}

		await copyEmbeddedLookupTableMutation.mutate({
			eltId: lookupTableData._id,
		});
	};

	return (
		<SettingsContainer>
			<SettingsInfoContainer>
				<SettingsTextField label='Lookup Table Name' value={name} onChange={setName} />

				<SettingsTagsList feat='embeddedLookupTable' featId={lookupTableData._id} />
			</SettingsInfoContainer>

			<SettingsInfoContainer>
				<Tooltip title={CASE_INSENSITIVE_TOOLTIP_TITLE}>
					{
						// This div is here to make a tooltip showing on hovering label too,
						// deleting it will make tooltip show only on checkbox
					}
					<div>
						<CheckboxField
							label={CASE_INSENSITIVE_CHECKBOX_TITLE}
							checked={caseInsensitiveMatching}
							onChange={(event) => setCaseInsensitiveMatching(event.target.checked)}
						/>
					</div>
				</Tooltip>
			</SettingsInfoContainer>

			<Divider />

			<SettingsButton
				primary
				onClick={() => handleUpdateEmbeddedLookupTable()}
				label='Save Lookup Table'
				info={['Save Lookup Table']}
				disabled={name === '' || !hasNonWhitespace(name) || updateEmbeddedLookupTableMutation.isLoading}
				tooltipLabel=''
			/>

			<AssignTagsSettingsButton tooltipLabel='' feat='embeddedLookupTable' featId={lookupTableData._id} />

			<Divider />

			<Can do={ACTIONS.Create} on={subject(SUBJECTS.EmbeddedLookupTables, { project: project?._id })} passThrough>
				{(allowed) => (
					<SettingsButton
						primary
						label='Copy Lookup Table'
						tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
						disabled={!allowed}
						onClick={handleCopyEmbeddedLookupTable}
						info={['Copies the embedded lookup table and all of its contents']}
					/>
				)}
			</Can>

			<Can do={ACTIONS.Delete} on={subject(SUBJECTS.EmbeddedLookupTables, { project: project?._id })} passThrough>
				{(allowed) => (
					<SettingsDeleteButton
						feat='Lookup Table'
						onDelete={async () => await deleteEmbeddedLookupTable(lookupTableData._id)}
						name={lookupTableData.name}
						info={['Delete Lookup Table']}
						redirectTo={projectRoutes.embeddedLookupTables}
						disabled={!allowed}
						requireName
						tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : 'Delete Embedded Lookup Table'}
					/>
				)}
			</Can>
		</SettingsContainer>
	);
}
