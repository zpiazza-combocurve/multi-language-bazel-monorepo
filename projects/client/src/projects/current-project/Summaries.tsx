import { Grid, Paper, useMediaQuery } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled from 'styled-components';

import { Box, Button, Typography } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { toLocalDate, toLocalDateTime } from '@/helpers/dates';
import theme from '@/helpers/styled';
import { getFullName, getShortName } from '@/helpers/user';
import { assert, numberWithCommas } from '@/helpers/utilities';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject, useProjectSummariesCount, useProjectSummariesItems } from '@/projects/api';
import TagsList from '@/tags/TagsList';
import { useGetFeatTags } from '@/tags/queries';
import { URLS, getModuleListRoute } from '@/urls';

const SUMMARY_ENTRIES_QUANTITY = 9;

const RECENT_ITEMS_TABLE = {
	Scenarios: {
		headers: ['Name', 'Wells', 'User', 'Date'],
		gridSize: [6, 1, 3, 2],
	},
	'Econ Models': {
		headers: ['Name', 'Assumption', 'User', 'Date'],
		gridSize: [6, 2, 2, 2],
	},
	Forecasts: {
		headers: ['Name', 'Type', 'Wells', 'User', 'Date'],
		gridSize: [6, 1, 1, 2, 2],
	},
	'Type Curves': {
		headers: ['Name', 'Wells', 'User', 'Date'],
		gridSize: [6, 1, 3, 2],
	},
	Schedulings: {
		headers: ['Name', 'Wells', 'User', 'Date'],
		gridSize: [6, 1, 3, 2],
	},
	'Lookup Tables': {
		headers: ['Name', 'Type', 'User', 'Date'],
		gridSize: [6, 2, 2, 2],
	},
};

function getRecentLookupTableFields(lookupTableSummary) {
	const { name, createdBy, updatedAt, type, assumptionKey } = lookupTableSummary;

	const updatedDateString = toLocalDate(updatedAt);

	const typeLabel = ASSUMPTION_LABELS[AssumptionKey[assumptionKey]] ?? type;

	return [
		{ label: name, tooltip: name },
		{ label: typeLabel, tooltip: typeLabel },
		{ label: getShortName(createdBy), tooltip: getFullName(createdBy) },
		{ label: updatedDateString, tooltip: `Updated On: ${updatedDateString}` },
	];
}

function getRecentForecastFields(forecastSummary) {
	const { name, createdBy, updatedAt, type, wells } = forecastSummary;

	const updatedDateString = toLocalDate(updatedAt);

	const wellText = numberWithCommas(wells);

	const forecastType =
		type === 'deterministic'
			? {
					label: 'D',
					tooltip: 'Deterministic',
			  }
			: {
					label: 'P',
					tooltip: 'Probabilistic',
			  };

	return [
		{ label: name, tooltip: name },
		forecastType,
		{ label: wellText, tooltip: wellText },
		{ label: getShortName(createdBy), tooltip: getFullName(createdBy) },
		{ label: updatedDateString, tooltip: `Updated On: ${updatedDateString}` },
	];
}

function getRecentFields(recent) {
	if (!recent) {
		return [];
	}

	const { assumptionKey, createdBy = {}, wells, name, updatedAt } = recent;
	const userName = getShortName(createdBy);
	const fullUserName = getFullName(createdBy);

	const output = [{ label: name, tooltip: name }];

	if (Number.isFinite(wells)) {
		const wellText = numberWithCommas(wells);
		output.push({ label: wellText, tooltip: wellText });
	}

	if (assumptionKey) {
		const assLabel = ASSUMPTION_LABELS[assumptionKey];
		output.push({ label: assLabel, tooltip: `Econ Model: ${assLabel}` });
	}
	output.push({ label: userName, tooltip: fullUserName });

	const updatedDateString = toLocalDate(updatedAt);

	output.push({ label: updatedDateString, tooltip: `Updated On: ${updatedDateString}` });

	return output;
}

const navigateTo = (module, item, navigate, projectId) => {
	if (module === 'Scenarios') {
		return navigate(URLS.project(projectId).scenario(item._id).view);
	}

	if (module === 'Econ Models') {
		return navigate(URLS.project(projectId).assumption(item.assumptionKey).model(item._id));
	}

	if (module === 'Forecasts') {
		return navigate(URLS.project(projectId).forecast(item._id).view);
	}

	if (module === 'Type Curves') {
		return navigate(URLS.project(projectId).typeCurve(item._id).view);
	}

	if (module === 'Schedulings') {
		return navigate(URLS.project(projectId).schedule(item._id).view);
	}

	if (module === 'Lookup Tables') {
		if (item.type === 'Scenario') {
			return navigate(URLS.project(projectId).scenarioLookupTable(item._id).edit);
		}
		if (item.type === 'ELT') {
			return navigate(URLS.project(projectId).embeddedLookupTable(item._id).edit);
		}
		if (item.type === 'Scheduling') {
			return navigate(URLS.project(projectId).schedulingLookupTable(item._id).edit);
		}
		return navigate(URLS.project(projectId).forecastLookupTable(item._id).edit);
	}

	return false;
};

const getFieldsByModule = (item, module) => {
	if (module === 'Lookup Tables') {
		return getRecentLookupTableFields(item);
	} else if (module === 'Forecasts') {
		return getRecentForecastFields(item);
	} else {
		return getRecentFields(item);
	}
};

const RecentItemsGridItem = styled(Grid).attrs({
	item: true,
})`
	padding-left: ${({ theme }) => theme.spacing(1)}px;
	padding-right: ${({ theme }) => theme.spacing(1)}px;
`;

const RecentItemsRow = styled(Grid).attrs({
	container: true,
	item: true,
})`
	margin-top: ${({ theme }) => theme.spacing(0.7)}px;
	padding-top: ${({ theme }) => theme.spacing(0.5)}px;
	padding-bottom: ${({ theme }) => theme.spacing(0.5)}px;
	line-height: 16px;
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }) => theme.palette.action.hover};
	}
`;

const RecentItemsFieldText = styled(Typography).attrs({
	variant: 'body2',
	noWrap: true,
})<{ $bold?: boolean; $right?: boolean }>`
	font-size: 12px;
	font-weight: ${({ $bold }) => ($bold ? 'bold' : 'normal')};
	text-align: ${({ $right }) => ($right ? 'end' : 'start')};
`;

const RecentItemsHeaderText = styled(RecentItemsFieldText)`
	margin: ${({ theme }) => theme.spacing(0.5)}px ${({ theme }) => theme.spacing(1)}px;

	font-weight: bold;
	color: ${({ theme }) => theme.palette.text.hint};

	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`;

const RecentItems = ({ module, items }) => {
	const navigate = useNavigate();
	const { project } = useCurrentProject();

	if (!items?.length)
		return (
			<RecentItemsFieldText
				$bold
				css={`
					margin-top: 0.5rem;
					margin-left: 0.5rem;
					color: ${({ theme }) => theme.palette.text.hint};
				`}
			>
				No {module} in Current Project.
			</RecentItemsFieldText>
		);
	const formattedRows = items.map((i) => getFieldsByModule(i, module));

	return (
		<>
			{/* Header */}
			<Grid
				container
				css={`
					background-color: ${({ theme }) => theme.palette.action.hover};
					border-radius: 4px;
					margin-bottom: ${({ theme }) => theme.spacing(0.3)}px;
				`}
			>
				{RECENT_ITEMS_TABLE[module].headers.map((header, idx) => (
					<Grid item key={idx} xs={RECENT_ITEMS_TABLE[module].gridSize[idx]}>
						<RecentItemsHeaderText>{header}</RecentItemsHeaderText>
					</Grid>
				))}
			</Grid>
			<Grid container>
				{formattedRows.map((row, rowIdx) => {
					return (
						<RecentItemsRow
							key={rowIdx}
							onClick={() => navigateTo(module, items[rowIdx], navigate, project?._id)}
						>
							{row.map((field, fieldIdx) => (
								<RecentItemsGridItem key={fieldIdx} xs={RECENT_ITEMS_TABLE[module].gridSize[fieldIdx]}>
									<RecentItemsFieldText
										$bold={fieldIdx === 0}
										$right={RECENT_ITEMS_TABLE[module].headers[fieldIdx] === 'Wells'}
									>
										{field.label}
									</RecentItemsFieldText>
								</RecentItemsGridItem>
							))}
						</RecentItemsRow>
					);
				})}
			</Grid>
		</>
	);
};

const SummaryGroupPaper = styled(Paper).attrs({
	elevation: 4,
})`
	overflow-x: hidden;
	min-height: 100%;
	padding: ${({ theme }) => theme.spacing(2)}px;
	background: ${theme.backgroundOpaque};
`;

const SummaryGroupHeaderContainer = styled(Box)`
	display: flex;
	justify-content: space-between;
	padding: ${({ theme }) => theme.spacing(1)}px;
`;

const SummaryGroupHeaderName = styled(Typography).attrs({
	variant: 'subtitle2',
})`
	margin-right: ${({ theme }) => theme.spacing(1)}px;
	font-size: 16px;
`;

const SummaryGroupCountBadge = styled(Box)`
	font-size: 13px;
	font-weight: 500;
	display: flex;
	justify-content: center;
	align-items: center;
	line-height: 1.5;
	background-color: ${({ theme }) => theme.palette.secondary.main};
	border-radius: 16px;
	padding: 2px 8px;
	min-width: 32px;
	color: ${({ theme }) => theme.palette.background.default};
`;

const NewSummaryGroup = ({ module, url, recentItems, count, isLoadingItems, isLoadingCount }) => {
	const navigate = useNavigate();

	return (
		<SummaryGroupPaper>
			<SummaryGroupHeaderContainer>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<SummaryGroupHeaderName>{module}</SummaryGroupHeaderName>
					{!isLoadingCount ? (
						!!count && <SummaryGroupCountBadge>{count}</SummaryGroupCountBadge>
					) : (
						<Skeleton animation='wave' height={30} width={30} />
					)}
				</Box>
				<div>
					<Button data-testid={`${module}-see-all`} color='secondary' onClick={() => navigate(url)}>
						See All
					</Button>
				</div>
			</SummaryGroupHeaderContainer>
			{isLoadingItems ? (
				<>
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
				</>
			) : (
				<RecentItems module={module} items={recentItems} />
			)}
		</SummaryGroupPaper>
	);
};

const InfoBlockLabel = styled(Typography).attrs({
	variant: 'body1',
	color: 'textSecondary',
})<{ $textRight?: boolean }>`
	font-size: 0.875rem;
	text-align: ${({ $textRight }) => ($textRight ? 'end' : 'start')};
`;
const InfoBlockValue = styled(Typography).attrs({
	variant: 'subtitle2',
})`
	font-size: 0.95rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;
const InfoBlockSecondaryValue = styled(Typography).attrs({
	variant: 'body1',
	color: 'textSecondary',
})`
	margin-left: ${(props) => props.theme.spacing(2)}px;
`;

const InfoBlockContainer = styled(Box)`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing(1)}px;
`;

interface IInfoBlock {
	label: string;
	value: string | number;
	secondaryValue?: string | number;
	className?: string;
}
const InfoBlock = ({ label, value, secondaryValue, className }: IInfoBlock) => {
	return (
		<InfoBlockContainer className={className}>
			<InfoBlockLabel>{label}</InfoBlockLabel>
			<Box
				css={`
					display: flex;
					align-items: center;
				`}
			>
				<InfoBlockValue>{value}</InfoBlockValue>
				{secondaryValue && <InfoBlockSecondaryValue>{secondaryValue}</InfoBlockSecondaryValue>}
			</Box>
		</InfoBlockContainer>
	);
};

const Summaries = () => {
	const { project } = useAlfa();

	assert(project?._id, 'Expected project ID to be in scope');

	const { data: tags, isLoading: tagsLoading } = useGetFeatTags({ feat: 'project', featId: project._id });
	const { items, isFetching: isFetchingItems, reload: reloadItems } = useProjectSummariesItems(project._id);
	const { count, isFetching: isFetchingCount, reload: reloadCount } = useProjectSummariesCount(project._id);

	const importOperationNotificationCallback = useCallback(
		async (notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				reloadItems();
				reloadCount();
			}
		},
		[reloadItems, reloadCount]
	);
	useUserNotificationCallback(NotificationType.IMPORT_FORECAST, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_TYPE_CURVE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_LOOKUP_TABLE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_FORECAST_LOOKUP_TABLE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.IMPORT_SCENARIO, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_SCHEDULE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_SCENARIO, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_FORECAST_LOOKUP_TABLE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_LOOKUP_TABLE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_TYPE_CURVE, importOperationNotificationCallback);
	useUserNotificationCallback(NotificationType.COPY_FORECAST, importOperationNotificationCallback);

	const threshold1 = useMediaQuery('(max-width:600px)');
	const threshold2 = useMediaQuery('(max-width:1366px)');
	const totalItems = 6;
	const itemsPerRow = (() => {
		if (threshold1) return 1;
		if (threshold2) return 2;
		return 3;
	})();
	const gap = '1rem';
	const rows = totalItems / itemsPerRow;

	if (!project) {
		return null;
	}

	return (
		<Section
			css={`
				padding: 1rem;
			`}
			fullPage
		>
			<SectionHeader
				css={`
					background: ${({ theme }) => theme.palette.background.default};
					margin: 0.5rem 0;
					padding: 0.5rem 1rem;

					border-bottom: 1px solid ${(props) => props.theme.palette.grey[700]};
					z-index: 1;
				`}
			>
				<Grid container direction='row' spacing={2}>
					<Grid xs={6} lg={4} item>
						<InfoBlock label='Project Name' value={project.name} />
					</Grid>
					<Grid xs={6} lg={4} item>
						<InfoBlock
							label='Created'
							value={getFullName(project?.createdBy)}
							secondaryValue={toLocalDateTime(project?.createdAt)}
						/>
					</Grid>
					<Grid xs={6} lg={2} item>
						<InfoBlock label='Wells In Project' value={project.wells.length} />
					</Grid>
					<Grid xs={6} lg={2} item container>
						<Box
							alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
							css={`
								width: 100%;
								display: flex;
								flex-direction: column;
								gap: ${({ theme }) => theme.spacing(1)}px;
							`}
						>
							<InfoBlockLabel $textRight>Tags</InfoBlockLabel>
							<Box display='flex' justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
								{tagsLoading ? (
									<Skeleton animation='wave' height={30} />
								) : tags?.length ? (
									<TagsList
										tags={tags}
										visible={3}
										// onTagClick={(tagId) => console.log(`Navigating to projects with tag: ${tagId}`)} Disabled until URL params PR is merged
									/>
								) : (
									<Typography variant='body1'>No tags</Typography>
								)}
							</Box>
						</Box>
					</Grid>
				</Grid>
			</SectionHeader>
			<SectionContent
				css={`
					overflow-x: hidden;
				`}
			>
				<AutoSizer>
					{({ height, width }) => (
						<div
							css={`
								height: ${height}px;
								width: ${width}px;
								display: flex;
								gap: ${gap};
								flex-wrap: wrap;
								overflow-x: hidden;
								& > * {
									flex: 1 0 calc(((100%) / ${itemsPerRow}) - (${gap}* ${itemsPerRow}));
									min-height: max(18rem, (${height}px / ${rows}) - (0.5rem * ${rows - 1}));
								}
							`}
						>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Scenarios'
								url={getModuleListRoute('scenarios', project?._id)}
								count={count?.scenarios}
								recentItems={items?.scenarios?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Econ Models'
								url={getModuleListRoute('assumptions', project?._id)}
								count={count?.costModels}
								recentItems={items?.costModels?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Forecasts'
								url={getModuleListRoute('forecasts', project?._id)}
								count={count?.forecasts}
								recentItems={items?.forecasts?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Type Curves'
								url={getModuleListRoute('typeCurves', project?._id)}
								count={count?.typeCurves}
								recentItems={items?.typeCurves?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Schedulings'
								url={getModuleListRoute('schedules', project?._id)}
								count={count?.schedulings}
								recentItems={items?.schedulings?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
							<NewSummaryGroup
								isLoadingItems={isFetchingItems}
								isLoadingCount={isFetchingCount}
								module='Lookup Tables'
								url={getModuleListRoute('lookupTables', project?._id)}
								count={count?.lookupTables}
								recentItems={items?.lookupTables?.slice(0, SUMMARY_ENTRIES_QUANTITY)}
							/>
						</div>
					)}
				</AutoSizer>
			</SectionContent>
		</Section>
	);
};

export default Summaries;
