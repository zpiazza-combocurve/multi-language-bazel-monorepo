import { faChevronLeft, faChevronRight, faClock, faFileCheck } from '@fortawesome/pro-regular-svg-icons';
import { createTheme } from '@material-ui/core/styles';
import * as React from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { Selection } from '@/components/hooks/useSelection';
import SelectedCount from '@/components/misc/SelectedCount';
import { Separator } from '@/components/shared';
import { Box, Button, IconButton } from '@/components/v2';
import { Project } from '@/forecasts/types';
import { toLocalDate, toLocalDateTime } from '@/helpers/dates';
import { theme as styledTheme } from '@/helpers/styled';
import { withExtendedThemeProvider } from '@/helpers/theme';
import { getFullName } from '@/helpers/user';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { Section, SectionContent, SectionFooter, SectionHeader } from '@/layouts/Section';
import CreateButton from '@/module-list/ModuleList/CreateButton';
import TagsList from '@/tags/TagsList';

import { ModuleListBag, useModuleList } from './ModuleList/useModuleList';
import { ModulesTable } from './ModulesTable';
import * as _filters from './filters';
import { FiltersContext } from './filters/shared';
import { Item, ItemDetail } from './types';

export const Fields: { [key: string]: ItemDetail } = {
	configuration: {
		key: 'configuration',
		label: 'Configuration',
		value: ({ configuration }) => JSON.stringify(configuration, null, 2),
		title: ({ configuration }) => JSON.stringify(configuration),
		width: 200,
		sort: false,
	},
	name: { key: 'name', label: 'Name', value: ({ name }) => name, title: ({ name }) => name, width: 150, sort: true },
	id: { key: 'id', label: 'Id', value: ({ id }) => id, title: ({ id }) => id, width: 180, sort: false },
	machineName: {
		key: 'machineName',
		label: 'Machine Name',
		value: ({ machineName }) => machineName,
		title: ({ machineName }) => machineName,
		width: 220,
		sort: true,
	},
	assumptionType: {
		key: 'assumptionKey',
		label: 'Type',
		value: ({ assumptionKey }) => ASSUMPTION_LABELS[AssumptionKey[assumptionKey]],
		title: ({ assumptionKey }) => ASSUMPTION_LABELS[AssumptionKey[assumptionKey]],
		width: 120,
		sort: true,
	},
	version: {
		key: 'version',
		cellRenderer: 'version',
		label: 'Version',
		value: ({ version }) => version.split('+')[0],
		title: ({ version }) => version,
		sort: true,
	},
	message: {
		key: 'message',
		label: 'Message',
		value: ({ message }) => message,
		title: ({ message }) => message,
		width: 700,
		sort: false,
	},
	description: {
		key: 'description',
		label: 'Description',
		value: ({ description }) => description,
		title: ({ description }) => description,
		width: 220,
		sort: true,
	},
	isIdle: {
		key: 'isIdle',
		cellRenderer: 'icon',
		label: 'Is Idle',
		value: ({ isIdle }) => ({ icon: faClock, color: isIdle ? 'green' : 'red' }),
		title: ({ isIdle }) => (isIdle ? 'Idle' : 'In use'),
		width: 100,
		sort: true,
	},

	key: {
		key: 'key',
		label: 'Key',
		value: ({ key }) => key,
		title: ({ key }) => key,
		width: 220,
		sort: true,
	},

	secretValue: {
		key: 'value',
		label: 'Secret Value',
		value: ({ value }) => value,
		title: ({ value }) => value,
		width: 220,
		sort: true,
	},

	encryptionKeyName: {
		key: 'encryptionKeyName',
		label: 'Encryption Key Name',
		value: ({ encryptionKeyName }) => encryptionKeyName,
		title: ({ encryptionKeyName }) => encryptionKeyName,
		width: 220,
		sort: true,
	},

	encryptionKeyVersion: {
		key: 'encryptionKeyVersion',
		label: 'Encryption  Key Version',
		value: ({ encryptionKeyVersion }) => encryptionKeyVersion,
		title: ({ encryptionKeyVersion }) => encryptionKeyVersion,
		width: 220,
		sort: true,
	},

	hidden: {
		key: 'hidden',
		label: 'Is Hidden',
		value: ({ hidden }) => (hidden ? 'True' : 'False'),
		title: ({ hidden }) => (hidden ? 'True' : 'False'),
		width: 220,
		sort: true,
	},

	agentName: {
		key: 'dataSyncAgentName',
		label: 'Agent Name',
		value: ({ dataSyncAgentName }) => dataSyncAgentName,
		title: ({ dataSyncAgentName }) => dataSyncAgentName,
		width: 320,
		sort: true,
	},

	tenantId: {
		key: 'tenantId',
		label: 'Tenant ID',
		value: ({ tenantId }) => tenantId,
		title: ({ tenantId }) => tenantId,
		width: 200,
		sort: true,
	},

	isValid: {
		key: 'isValid',
		cellRenderer: 'icon',
		label: 'Template Valid',
		value: ({ isValid }) => ({ icon: faFileCheck, color: isValid ? 'green' : 'red' }),
		title: ({ isValid, validationErrorMessage }) => (isValid ? 'Valid' : validationErrorMessage),
		width: 150,
		sort: false,
	},
	createdBy: {
		key: 'createdBy.firstName',
		label: 'Created By',
		value: ({ createdBy }) => getFullName(createdBy),
		sort: true,
	},
	createdAt: {
		key: 'createdAt',
		label: 'Created At',
		value: ({ createdAt }) => toLocalDateTime(createdAt),
		title: ({ createdAt }) => toLocalDateTime(createdAt),
		sort: true,
		width: 140,
	},

	loggedAt: {
		key: 'loggedAt',
		label: 'Logged At',
		value: ({ loggedAt }) => toLocalDateTime(loggedAt),
		title: ({ loggedAt }) => toLocalDateTime(loggedAt),
		sort: true,
		width: 180,
	},

	startedAt: {
		key: 'startedAt',
		label: 'Started At',
		value: ({ startedAt }) => toLocalDateTime(startedAt),
		title: ({ startedAt }) => toLocalDateTime(startedAt),
		sort: true,
		width: 180,
	},

	endedAt: {
		key: 'endedAt',
		label: 'Ended At',
		value: ({ endedAt }) => toLocalDateTime(endedAt),
		title: ({ endedAt }) => toLocalDateTime(endedAt),
		sort: true,
		width: 180,
	},

	priority: {
		key: 'priority',
		label: 'Priority',
		value: ({ dataFlowSchedule }) => (dataFlowSchedule ? dataFlowSchedule.priority : 'N/A'),
		title: ({ dataFlowSchedule }) => dataFlowSchedule && dataFlowSchedule.priority,
		sort: true,
		width: 40,
	},

	currentRun: {
		key: 'currentRunStartedAt',
		label: 'Current Run Starts',
		value: ({ dataFlowSchedule }) =>
			dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.currentRunStartedAt) : 'N/A',
		title: ({ dataFlowSchedule }) =>
			dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.currentRunStartedAt) : 'N/A',
		sort: true,
		width: 180,
	},

	scheduleLast: {
		key: 'lastRunEndedAt',
		label: 'Last Run Ends',
		value: ({ dataFlowSchedule }) => (dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.lastRunEndedAt) : 'N/A'),
		title: ({ dataFlowSchedule }) => (dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.lastRunEndedAt) : 'N/A'),
		sort: true,
		width: 180,
	},

	scheduleNext: {
		key: 'nextRunStartsAt',
		label: 'Next Run Starts',
		value: ({ dataFlowSchedule }) => (dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.nextRunStartsAt) : 'N/A'),
		title: ({ dataFlowSchedule }) => (dataFlowSchedule ? toLocalDateTime(dataFlowSchedule.nextRunStartsAt) : 'N/A'),
		sort: true,
		width: 180,
	},

	wells: {
		key: 'wellsLength',
		label: 'Wells',
		value: (item) => item.wellsLength,
		sort: true,
		type: 'number',
		width: 100,
	},

	wellCollections: {
		key: 'wellCollectionsLength',
		label: 'Well Collections',
		value: (item) => item.wellCollectionsLength,
		sort: false,
		type: 'number',
		width: 100,
	},

	scenarios: {
		key: 'scenariosLength',
		label: 'Scenarios',
		value: (item) => item.scenariosLength,
		sort: true,
		type: 'number',
		width: 125,
	},
	forecasts: {
		key: 'forecastsLength',
		label: 'Forecasts',
		value: (item) => item.forecastsLength,
		sort: true,
		type: 'number',
		width: 125,
	},
	typeCurves: {
		key: 'typeCurvesLength',
		label: 'Type Curves',
		value: (item) => item.typeCurvesLength,
		sort: true,
		type: 'number',
		width: 140,
	},
	schedules: {
		key: 'schedulesLength',
		label: 'Schedules',
		value: (item) => item.schedulesLength,
		sort: true,
		type: 'number',
		width: 130,
	},
	scenarioLookupTables: {
		key: 'scenarioLookupTablesLength',
		label: 'Scenario Lookup Tables',
		value: (item) => item.scenarioLookupTablesLength,
		sort: true,
		type: 'number',
		width: 215,
	},
	typeCurveLookupTables: {
		key: 'typeCurveLookupTablesLength',
		label: 'Type Curve Lookup Tables',
		value: (item) => item.typeCurveLookupTablesLength,
		sort: true,
		type: 'number',
		width: 230,
	},
	embeddedLookupTables: {
		key: 'embeddedLookupTablesLength',
		label: 'Embedded Lookup Tables',
		value: (item) => item.embeddedLookupTablesLength,
		sort: true,
		type: 'number',
		width: 230,
	},
	project: {
		key: 'project.name',
		label: 'Project',
		value: ({ project: { name } }) => name,
		sort: true,
		width: 140,
		// currentProject: item.project._id === project?._id,
	},
	updatedAt: {
		key: 'updatedAt',
		label: 'Last Updated',
		value: ({ updatedAt }) => toLocalDate(updatedAt),
		title: ({ updatedAt }) => toLocalDateTime(updatedAt),
		sort: true,
	},
	tags: {
		key: 'tags',
		cellRenderer: 'tags',
		label: 'Tags',
		width: 100,
		value: ({ tags }) => (
			<div>
				<TagsList tags={tags} visible={2} />
			</div>
		),
	},
};

export const Filters = _filters;

function Pagination({ pagination, className = '' }) {
	const { page, totalPages, onPrevPage, onNextPage, startIndex, endIndex, total } = pagination;

	return (
		<div className={className}>
			<span>
				{startIndex + 1} - {endIndex + 1} {total !== Infinity && ` of ${total}`}
			</span>

			<IconButton disabled={page === 0} onClick={onPrevPage}>
				{faChevronLeft}
			</IconButton>

			<IconButton disabled={totalPages - 1 === page || totalPages === 0} onClick={onNextPage}>
				{faChevronRight}
			</IconButton>
		</div>
	);
}

const CollapseButton = styled(IconButton).attrs({ size: 'small' })`
	position: absolute;
	z-index: 2;
	right: 0;
	transform: translateX(50%);
	background: ${styledTheme.background};

	&:hover {
		background: ${styledTheme.backgroundOpaque};
	}

	padding: 0.75rem;
	border: 1px solid ${styledTheme.textColor};
	color: ${styledTheme.textColor};
`;

function Sidebar({ className = '', filters, clear, apply }) {
	const [collapsed, setCollapsed] = useState(false);
	return (
		<Section
			className={className}
			css={`
				position: relative;
				height: 100%;
				border-right: 1px solid var(--border-color);
				transition: flex-grow 200ms, min-width 200ms;

				&& {
					${collapsed &&
					`
						flex: 0 0 0;
						min-width: 4rem;
						& > *:not(${CollapseButton}):not(${SectionContent}) {
							display: none;
						}
				 `}
				}
			`}
			fullPage
		>
			<SectionContent
				css={`
					margin-top: 2px;
					padding: 12px 1.5rem;
					margin-bottom: 5rem;

					&& {
						${collapsed &&
						`
							flex: 0 0 0;
							min-width: 4rem;
							& > *:not(${CollapseButton}) {
								display: none;
							}
						`}
					}
				`}
			>
				<CollapseButton onClick={() => setCollapsed((value) => !value)}>
					{collapsed ? faChevronRight : faChevronLeft}
				</CollapseButton>
				<div
					css={`
						position: relative;
						padding-top: 0.4rem; // HACK: magic alignment
						display: flex;
						flex-direction: column;
						gap: 0.25rem;
						& > *:first-child {
							// HACK for alignment
							margin-bottom: 1.5rem;
						}
					`}
				>
					{filters}
				</div>
			</SectionContent>
			<SectionFooter
				css={`
					background: ${styledTheme.background};
					display: flex;

					& > * {
						margin-left: 1rem;
					}

					padding: 1.5rem;
					padding-top: 1rem;
				`}
			>
				<Box flexGrow={1} />
				<Button color='secondary' onClick={clear}>
					Clear
				</Button>
				<Button variant='contained' color='secondary' onClick={apply}>
					Apply
				</Button>
			</SectionFooter>
		</Section>
	);
}

function Topbar({ selection, paginationPosition, labels, selectionActions, moduleList, globalActions, title }) {
	const selectedCount = selection?.selectedSet.size;
	const total = moduleList.pagination.total;
	return (
		<Box
			css={`
				min-height: 4.6rem;
				border-color: var(--border-color);

				& > *:not(:first-child) {
					margin-left: 1rem;
				}
			`}
			padding={1.5}
			paddingLeft={4}
			paddingRight={7}
			borderBottom={1}
			display='flex'
			alignItems='center'
		>
			{title}
			{labels}
			{selectionActions}
			<div css='flex: 1;' />
			{globalActions}
			{paginationPosition === 'top' && (
				<Pagination
					css={`
						&&& {
							margin-left: 3rem;
						}
					`}
					pagination={moduleList.pagination}
				/>
			)}
			{selection && (
				<>
					<Separator />
					<SelectedCount count={selectedCount} total={Number.isFinite(total) ? total : 'loading'} />
				</>
			)}
		</Box>
	);
}

// function SortFilter({ sortKey }) {
// 	const { filters, setFilters } = useContext(FiltersContext);
// 	const { sort, sortDir } = filters;
// 	const onSort = () => {
// 		if (sort !== sortKey) {
// 			setFilters({ sortDir: 1, sort: sortKey });
// 			return;
// 		}
// 		setFilters({ sortDir: sortDir === 1 ? -1 : 1 });
// 	};
// 	const icon = (() => {
// 		if (sort !== sortKey) {
// 			return faSort;
// 		}
// 		return sortDir === 1 ? FeatureIcons.sortAsc : FeatureIcons.sortDesc;
// 	})();

// 	return (
// 		<IconButton size='small' onClick={onSort}>
// 			{icon}
// 		</IconButton>
// 	);
// }

// function HeaderBar({
// 	items = [],
// 	selection,
// 	loadingIds,
// }: {
// 	items?: ItemDetail[];
// 	selection?: Selection;
// 	loadingIds?: boolean;
// }) {
// 	return (
// 		<div
// 			css={`
// 				display: flex;
// 				align-items: baseline;
// 				width: calc(100% - 2 * ${horizontalSeparation} - 14px); // HACK: 14 ~= scrollbar width
// 				${cardStyles};
// 				padding-top: 0.5rem;
// 				padding-bottom: 0.5rem;
// 			`}
// 		>
// 			{selection && (
// 				<div
// 					css={`
// 						flex: 0 0 auto;

// 						&& {
// 							border-right: 0;
// 						}
// 					`}
// 				>
// 					<Checkbox
// 						checked={selection.allSelected}
// 						onChange={() => selection.toggleAll()}
// 						disabled={loadingIds}
// 					/>
// 				</div>
// 			)}
// 			{items.map(({ key, label, sort, type, minWidth, width, maxWidth }, index) => {
// 				const alignRight = type === 'number';
// 				const sortButton = (
// 					<div
// 						css={`
// 							flex: 0 0 auto;
// 							${alignRight ? 'margin-right' : 'margin-left'}: 0.5rem;
// 						`}
// 					>
// 						{sort && <SortFilter sortKey={key} />}
// 					</div>
// 				);
// 				return (
// 					<div
// 						css={`
// 							${index === items.length - 1 && '&& { border-right: 0; }'}
// 							${alignRight && `justify-content: right;`}
// 							overflow: auto;
// 							display: flex;
// 							align-items: baseline;
// 							${minWidth && `min-width: ${minWidth}px;`}
// 							${maxWidth && `max-width: ${maxWidth}px;`}
// 							${width && `flex: 0 1 ${width}px;`}
// 						`}
// 						key={key || label}
// 					>
// 						{alignRight && sortButton}
// 						<div
// 							css={`
// 								flex: 0 1 auto;
// 								overflow: hidden;
// 								white-space: nowrap;
// 								text-overflow: ellipsis;
// 							`}
// 						>
// 							{label}
// 						</div>
// 						{!alignRight && sortButton}
// 					</div>
// 				);
// 			})}
// 			<div
// 				css={`
// 					flex: 0 0 12rem; // TODO: check for duplicated code
// 				`}
// 			/>
// 		</div>
// 	);
// }

const ModuleListTheme = withExtendedThemeProvider((p) =>
	createTheme({
		...p,
		props: {
			MuiButton: { size: 'small' },
			MuiIconButton: { size: 'small' },
			MuiIcon: { fontSize: 'small' },
			MuiFab: { size: 'small' },
			MuiInput: { margin: 'dense' },
			MuiCheckbox: { size: 'medium' },
			MuiTextField: { variant: 'outlined', margin: 'dense' },
		},
		overrides: {
			MuiFormLabel: { root: { fontSize: '14px' } },
			MuiInput: { input: { fontSize: '14px' } },
			MuiFormControlLabel: {
				label: {
					fontSize: '14px',
				},
				root: {
					marginLeft: 0,
				},
			},
		},
	})
);

export default function ModuleList<T extends Item, F>({
	onRowClicked,
	currentItem,
	filters,
	title,
	globalActions,
	hideActions,
	itemActionBtns,
	itemDetails,
	feat,
	paginationPosition = 'top',
	moduleList,
	selection,
	selectionActions,
	labels,
	workMe,
	workMeName,
}: {
	moduleList: ModuleListBag<T, F>;
	filters?: React.ReactNode;
	paginationPosition?: 'top' | 'bottom';
	itemDetails?: ItemDetail[];
	globalActions?: React.ReactNode;
	hideActions?: boolean;
	onRowClicked?(): void;
	itemActionBtns?(item: T): React.ReactNode;
	workMe?(item: T): void;
	workMeName?: string;
	title?: React.ReactNode;
	labels?: React.ReactNode;
	feat?: string;
	currentItem?: Project;
	selection?: Selection;
	selectionActions?: React.ReactNode;
}) {
	const moduleListProvider = useMemo(() => {
		return { ...moduleList, selection };
	}, [selection, moduleList]);

	return (
		<FiltersContext.Provider value={moduleListProvider}>
			<div
				css={`
					display: flex;
					height: 100%;
				`}
			>
				{!!filters && (
					<ModuleListTheme>
						<Sidebar
							css={`
								flex: 1;
								min-width: 20rem;
							`}
							filters={filters}
							clear={moduleList.resetFilters}
							apply={moduleList.runFilters}
						/>
					</ModuleListTheme>
				)}
				<div
					css={`
						flex: 5;
					`}
				>
					<Section>
						<SectionHeader>
							<Topbar
								paginationPosition={paginationPosition}
								globalActions={globalActions}
								moduleList={moduleList}
								selection={selection}
								selectionActions={selectionActions}
								labels={labels}
								title={title}
							/>
							{/* <HeaderBar items={itemDetails} selection={selection} loadingIds={moduleList.loadingIds} /> */}
						</SectionHeader>
						<SectionContent
							css={`
								width: 100%;
							`}
						>
							<ModuleListTheme>
								<ModulesTable
									css={`
										height: 100%;
									`}
									feat={feat}
									loaded={moduleList.loaded}
									loading={moduleList.loading}
									loadingIds={moduleList.loadingIds}
									refresh={moduleList.runFilters}
									items={moduleList.items}
									itemDetails={itemDetails}
									hideActions={hideActions}
									onRowClicked={onRowClicked}
									itemActionBtns={itemActionBtns}
									workMe={workMe}
									workMeName={workMeName}
									currentItem={currentItem}
									selection={selection}
								/>
							</ModuleListTheme>
						</SectionContent>
						{paginationPosition === 'bottom' && (
							<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
								<Pagination pagination={moduleList.pagination} />
							</Box>
						)}
					</Section>
				</div>
			</div>
		</FiltersContext.Provider>
	);
}

export const makeField = (key, label, sort, width = 200) => {
	return {
		key,
		label,
		value: (props) => props[key],
		title: (props) => props[key],
		width,
		sort,
	};
};

ModuleList.Fields = Fields;
ModuleList.Filters = Filters;
ModuleList.useModuleList = useModuleList;
ModuleList.CreateButton = CreateButton;
