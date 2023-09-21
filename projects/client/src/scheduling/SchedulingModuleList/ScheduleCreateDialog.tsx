import { withTheme } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import { DEFAULT_FLAG_SET, LDFeatureFlagKey } from '@/inpt-shared/feature-flags/shared';
import { showWellFilter } from '@/well-filter/well-filter';

const InfoSectionItem = styled(Typography)`
	margin-top: 0.5rem;
	display: flex;
	justify-content: space-between;
	flex-direction: row;
	font-size: 0.875rem;
`;

const ErrorContainer = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 1rem;
	& > * {
		margin: 0.25rem 0;
	}
	div {
		color: ${({ theme }) => theme.palette.warning.main};
	}
`;

const ErrorText = withTheme(styled.div`
	display: flex;
`);

interface ProjectWellsAndCollections {
	wellIds: Inpt.ObjectId<'well'>[];
	collectionIds: Inpt.ObjectId<'collection'>[];
}

// copied from type curve mod create dialog
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function InfoSection({ info }: { info: { field: string; value: any }[] }) {
	return (
		<>
			{info.map(({ field, value }) => (
				<InfoSectionItem key={field}>
					<span>{field}:</span>
					<span>{value ?? 'N/A'}</span>
				</InfoSectionItem>
			))}
		</>
	);
}

export default function ScheduleCreateDialog({
	visible,
	onHide,
	resolve,
}: DialogProps<{ name: string; wells: Inpt.ObjectId<'well'>[]; method: string }>) {
	const { project } = useAlfa();

	const projectId = project?._id ?? '';

	const { data: projectWellsAndCollections, isLoading } = useQuery<ProjectWellsAndCollections>([projectId], () =>
		getApi(`/projects/getProjectWellsAndCollections/${projectId}`)
	);

	const { maxScheduleSize } = useLDFeatureFlags();
	const defaultScheduleSize = DEFAULT_FLAG_SET[LDFeatureFlagKey.maxScheduleSize];

	const [selectedWells, setSelectedWells] = useState<Inpt.ObjectId<'well'>[] | undefined>(undefined);
	const [name, setName] = useState('');
	const [isValidWellCount, setIsValidWellCount] = useState(true);
	const [isHighWellCount, setIsHighWellCount] = useState(false);
	const [isValidName, setIsValidName] = useState(true);
	const [collectionsCount, setCollectionsCount] = useState(0);

	useEffect(() => {
		if (projectWellsAndCollections && selectedWells === undefined) {
			setSelectedWells(projectWellsAndCollections.wellIds);
			setCollectionsCount(projectWellsAndCollections.collectionIds.length);
		}
	}, [projectWellsAndCollections, selectedWells]);

	useEffect(() => {
		setIsValidWellCount((selectedWells?.length ?? 0) <= maxScheduleSize);
		setIsHighWellCount((selectedWells?.length ?? 0) > defaultScheduleSize);
	}, [defaultScheduleSize, maxScheduleSize, selectedWells?.length]);

	useEffect(() => {
		setIsValidName(!!name.length && hasNonWhitespace(name));
	}, [name]);

	const isValidSchedule = isValidWellCount && isValidName;

	const handleSubmit = () => {
		if (selectedWells === undefined) {
			return;
		}
		resolve({ name, wells: selectedWells, method: 'auto' });
	};

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xs' fullWidth>
			<DialogTitle css='padding-bottom: 0;'>Create Schedule</DialogTitle>
			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				`}
			>
				<div
					css={`
						& > *:not(:first-child) {
							margin-top: 1rem;
						}
					`}
				>
					<TextField
						error={!isValidName}
						fullWidth
						helperText={!isValidName ? 'Schedule name is required' : ''}
						label='Schedule Name'
						name='schedule-name'
						onChange={(e) => setName(e.target.value)}
						value={name}
					/>
					<InfoSection
						info={[
							{ field: 'Current Project', value: project?.name ?? 'N/A' },
							{ field: 'Selected Wells', value: selectedWells?.length ?? '' },
						]}
					/>
				</div>
				<ErrorContainer>
					<ErrorText>
						{isValidWellCount &&
							isHighWellCount &&
							`Warning: Performance May Degrade For Selected Well Counts Higher Than ${numberWithCommas(
								defaultScheduleSize
							)}`}
					</ErrorText>
					<ErrorText>
						{!isValidWellCount &&
							`- Selected Wells Must Be Fewer Than ${numberWithCommas(maxScheduleSize)}`}
					</ErrorText>
					<ErrorText>
						{collectionsCount > 0 &&
							`- Selected Wells Does Not Include ${collectionsCount} ${
								collectionsCount > 1 ? 'Well Collections' : 'Well Collection'
							}.`}
					</ErrorText>
				</ErrorContainer>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='secondary'
					onClick={async () => {
						const wells = await showWellFilter({
							wells: project?.wells ?? [],
							type: 'filter',
							zIndex: 1400, // material-ui dialogs are 1300
						});

						if (wells) {
							setSelectedWells(_.intersection(projectWellsAndCollections?.wellIds ?? [], wells));
							setCollectionsCount(
								_.intersection(projectWellsAndCollections?.collectionIds ?? [], wells).length
							);
						}
					}}
				>
					Filter Wells
				</Button>
				<Button
					color='primary'
					disabled={!isValidSchedule || isLoading}
					onClick={handleSubmit}
					{...getTaggingProp('schedule', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}
