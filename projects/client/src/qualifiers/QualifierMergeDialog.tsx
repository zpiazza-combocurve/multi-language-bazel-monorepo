/* eslint react/jsx-key: warn */
import { faChevronRight, faGripVertical, faInfoCircle, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { Dialog, DialogActions, DialogContent, DialogTitle, Icon, Typography } from '@material-ui/core';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { Sortable } from '@/components/Sortable';
import { Button, IconButton, Paper, faIcon } from '@/components/v2';
import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { toLocalDate } from '@/helpers/dates';
import { getApi, postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

export function getWellsByQualifier(scenarioId, column) {
	return getApi(`/scenarios/${scenarioId}/assignedWellsByQualifier`, {
		column,
	});
}

function mergeQualifiers(scenarioId, column, qualifierKeys) {
	return postApi(`/scenarios/${scenarioId}/mergeQualifiers`, {
		column,
		qualifierKeys,
	});
}

function Info({ label, value, color }) {
	return (
		<div
			css={`
				text-align: right;
			`}
		>
			<Typography color={color} component='div'>
				{label}
			</Typography>
			<Typography color={color} component='div'>
				{value}
			</Typography>
		</div>
	);
}

function QualifierItem({
	actions,
	createdAt,
	dragRef,
	dropRef,
	info,
	name,
	...rest
}: {
	actions?;
	createdAt;
	dragRef?;
	dropRef?;
	info?;
	name;
}) {
	return (
		<Paper
			ref={dropRef}
			css={`
				&:not(:first-child) {
					margin-top: 1rem;
				}
				padding: 1rem 0.5rem;
				display: flex;
				justify-content: space-between;
			`}
			{...rest}
		>
			<div
				css={`
					display: flex;
					& > *:not(:first-child) {
						margin-left: 0.5rem;
					}
				`}
			>
				{dragRef && (
					<div ref={dragRef}>
						<IconButton>{faGripVertical}</IconButton>
					</div>
				)}
				<div>
					<div>{name}</div>
					<Typography color='textSecondary' component='div'>
						Created At: {toLocalDate(createdAt)}
					</Typography>
				</div>
			</div>
			<div
				css={`
					display: flex;
					& > *:not(:first-child) {
						margin-left: 1.5rem;
					}
				`}
			>
				{info.map((i) => (
					// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
					<Info {...i} />
				))}
				{actions}
			</div>
		</Paper>
	);
}

const TITLE_SEPARATION = '3.4rem';

function QualifiersSection({ title, children, actions, ...rest }: { title; children; actions? }) {
	return (
		<Section {...rest}>
			<SectionHeader
				as='b'
				css={`
					padding: 0 0.5rem;
					display: flex;
					justify-content: space-between;
					height: ${TITLE_SEPARATION};
					align-items: baseline;
				`}
			>
				{title}
				{actions}
			</SectionHeader>

			<SectionContent
				css={`
					& > *:not(:first-child) {
						margin-top: 0.5rem;
					}
					padding: 0.5rem;
				`}
			>
				{children}
			</SectionContent>
		</Section>
	);
}

type Qualifier = { key: string; name: string; createdAt };

export default function QualifierMergeDialog({ resolve, onHide, visible, qualifiers, columnKey, scenarioId }) {
	const [qualifiersToMerge, setQualifiersToMerge] = useState<Qualifier[]>([]);
	const currentQualifiers = useMemo(() => {
		return qualifiers.filter(({ name }) => !qualifiersToMerge.find((q) => q.name === name));
	}, [qualifiers, qualifiersToMerge]);

	const { data: wellsByQualifier } = useQuery([scenarioId, 'qualifiers-assignments', columnKey], () => {
		return getWellsByQualifier(scenarioId, columnKey);
	});

	const assignmentsTillQualifier = useMemo(() => {
		const qualifiersUniqueData: { assignmentIds: string[]; allUnique: string[] }[] = [];
		qualifiersToMerge.forEach(({ key: qualifierKey }, index) => {
			const assignmentIds = wellsByQualifier?.[qualifierKey] || [];
			qualifiersUniqueData[index] = {
				assignmentIds,
				allUnique: [
					...new Set([...assignmentIds, ...(index ? qualifiersUniqueData[index - 1].allUnique : [])]),
				],
			};
		});
		return qualifiersUniqueData;
	}, [wellsByQualifier, qualifiersToMerge]);

	// Why isn't this using mutateAsync?
	const { mutate: merge } = useMutation(async () => {
		const result = await withLoadingBar(
			mergeQualifiers(
				scenarioId,
				columnKey,
				qualifiersToMerge.map(({ key }) => key)
			)
		);
		confirmationAlert('Qualifiers Merged!');
		resolve(result);
	});
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='lg' fullWidth>
			<DialogTitle
				css={`
					padding-left: 2rem;
					padding-bottom: 0; // to join banner's top with title's bottom
				`}
			>
				Merge Qualifiers
			</DialogTitle>
			<DialogContent
				css={`
					padding-top: 0; // to join banner's top with title's bottom
					height: 60vh;
				`}
			>
				<Section>
					<SectionHeader
						css={`
							margin-left: 40%;
						`}
					>
						<div
							css={`
								background: ${theme.backgroundOpaque};
								padding: 1rem;
								margin-left: 0.5rem;
								display: inline-flex;
								align-items: center;
								// {{ TODO: move to shared styles
								& > *:not(:first-child) {
									margin-left: 1rem;
								}
								// }}
							`}
						>
							<div>
								<Icon fontSize='small'>{faIcon(faInfoCircle)}</Icon>
							</div>
							<div>
								Sequence Qualifiers in order of priority top (high) to bottom (low)
								<br />
								Eg. If two qualifiers then higher priority qualifier is kept
							</div>
						</div>
					</SectionHeader>
					<SectionContent
						css={`
							display: flex;
							height: 100%;
							justify-content: stretch;
							margin-top: 2rem;
						`}
					>
						<QualifiersSection
							css={`
								width: calc(40% - ${TITLE_SEPARATION} + 1rem); // HACK: magic
								margin-right: calc(${TITLE_SEPARATION} - 1rem); // HACK: magic
							`}
							title='Current Qualifiers'
						>
							{currentQualifiers.map((qualifier) => (
								// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
								<QualifierItem
									createdAt={qualifier.createdAt}
									name={qualifier.name}
									info={[
										{
											label: 'Wells',
											value: wellsByQualifier?.[qualifier.key]?.length,
											color: 'secondary',
										},
									]}
									actions={
										<IconButton
											onClick={() => setQualifiersToMerge((prev) => [...prev, qualifier])}
										>
											{faChevronRight}
										</IconButton>
									}
								/>
							))}
						</QualifiersSection>
						<QualifiersSection
							css={`
								width: 60%;
							`}
							title='Qualifiers to merge'
							actions={
								<Button color='secondary' variant='outlined' onClick={() => setQualifiersToMerge([])}>
									Reset
								</Button>
							}
						>
							<Sortable
								items={qualifiersToMerge}
								onSort={(newQualifiersToMerge) => setQualifiersToMerge(newQualifiersToMerge)}
								renderItem={({ item: qualifier, dragRef, dropRef, index }) => {
									const wells = assignmentsTillQualifier[index].assignmentIds.length;
									const ending = assignmentsTillQualifier[index].allUnique.length;
									const starting = (index ? assignmentsTillQualifier[index - 1].allUnique : [])
										.length;
									const added = ending - starting;
									const overlap = assignmentsTillQualifier[index].assignmentIds.length - added;
									return (
										<QualifierItem
											key={qualifier.key}
											dragRef={dragRef}
											dropRef={dropRef}
											createdAt={qualifier.createdAt}
											name={qualifier.name}
											info={[
												{ label: 'Wells', value: wells, color: 'secondary' },
												{
													label: 'Starting',
													value: starting,
												},
												{ label: 'Overlap', value: overlap },
												{ label: 'Added', value: added },
												{ label: 'Ending', value: ending },
											]}
											actions={
												<IconButton
													onClick={() =>
														setQualifiersToMerge((prev) =>
															prev.filter((q) => q !== qualifier)
														)
													}
												>
													{faTimes}
												</IconButton>
											}
										/>
									);
								}}
							/>
						</QualifiersSection>
					</SectionContent>
				</Section>
			</DialogContent>
			<DialogActions
				css={`
					padding-right: 2rem;
				`}
			>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					disabled={qualifiersToMerge.length < 2 && 'Select at least two qualifiers to merge'}
					onClick={() => merge()}
					color='secondary'
				>
					Merge
				</Button>
			</DialogActions>
		</Dialog>
	);
}
