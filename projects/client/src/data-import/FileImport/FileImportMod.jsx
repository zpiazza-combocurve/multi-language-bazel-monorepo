import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { useCallback, useContext } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';

import { AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { useURLSearchParams } from '@/components/hooks/useQuery';
import { Menu, MenuItem } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { ACTIONS } from '@/inpt-shared/access-policies/shared';
import CreateButton from '@/module-list/ModuleList/CreateButton';
import ModuleList, { Fields, Filters } from '@/module-list/ModuleListV2';
import { projectRoutes } from '@/projects/routes';

import { CreateDialog, IMPORT_METHODS } from './CreateDialog';
import { deleteFileImport, getFileImports } from './api';

const isRunning = (status) => status === 'preprocessing' || status === 'queued' || status === 'started';

async function fetchItems(body) {
	const dataImports = await getFileImports(body);

	const now = new Date();

	return {
		...dataImports,
		items: dataImports.items.map((dataImport) => {
			const findEvent = (eventType) => dataImport.events?.find(({ type }) => type === eventType);
			const createdEvent = findEvent('created') || findEvent('mapping');
			const createdDate = createdEvent ? new Date(createdEvent.date).toLocaleString() : 'N/A';
			const importEvent = findEvent('started') || findEvent('preprocessing') || findEvent('queued');
			const hours = importEvent && (now - new Date(importEvent.date)) / 36e5; // https://stackoverflow.com/a/19225540
			const running = isRunning(dataImport.status);
			const broken = running && hours > 1;
			const canDelete = !running || (broken && hours > 2);
			return {
				...dataImport,
				running: broken ? false : running,
				status: broken ? `${dataImport.status} (error)` : dataImport.status,
				error: broken,
				createdAt: createdDate,
				canDelete,
			};
		}),
	};
}

function getProjectScope(csvImport) {
	return csvImport ? 'Company Level' : '-';
}

export function FileImportModuleList() {
	const navigate = useNavigate();
	// Empty object for times when there's no currently selected project.
	const { pathname = '' } = useMatch(`${projectRoutes.project(':id').dataImports}/*`) ?? {};
	const { project: alfaProject } = useAlfa();
	const { _id: projectId } = alfaProject || {};
	const [query] = useURLSearchParams();
	const createFeat = query.get('create');
	const createDialogIsVisible = !!createFeat;

	const ability = useContext(AbilityContext);

	const canCreateProjectFileImports = ability.can(
		ACTIONS.Create,
		subject(SUBJECTS.ProjectFileImports, { project: projectId })
	);

	const canCreateCompanyFileImports = ability.can(
		ACTIONS.Create,
		subject(SUBJECTS.CompanyFileImports, { project: null })
	);

	const canCreateFileImports = canCreateCompanyFileImports || canCreateProjectFileImports;

	const viewImport = useCallback(
		(id) => {
			navigate(`${id}`);
		},
		[navigate]
	);

	const viewDataImport = useCallback(
		async ({ _id: id }) => {
			viewImport(id);
		},
		[viewImport]
	);

	const hideDialog = () => {
		navigate('');
	};

	const feat = 'Data Import';
	return (
		<>
			<CreateDialog
				visible={createDialogIsVisible}
				onHide={hideDialog}
				onCreate={viewImport}
				feat={createFeat}
				key={createFeat}
			/>
			<ModuleList
				fetch={fetchItems}
				feat={feat}
				initialFilters={{ search: '', createdBy: '', sort: 'createdAt' }}
				createButton={
					<PopupState variant='popover'>
						{(popupState) => (
							<>
								<CreateButton
									feat={feat}
									tooltipTitle={!canCreateFileImports && PERMISSIONS_TOOLTIP_MESSAGE}
									disabled={!canCreateFileImports}
									{...bindTrigger(popupState)}
								/>
								<Menu {...bindMenu(popupState)}>
									{Object.entries(IMPORT_METHODS).map(([name, { label }]) => (
										<MenuItem
											component={Link}
											to={`${pathname}?create=${name}`}
											key={label}
											// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
											onClick={popupState.close}
										>
											{label}
										</MenuItem>
									))}
								</Menu>
							</>
						)}
					</PopupState>
				}
				workMe={viewDataImport}
				itemDetails={[
					{ ...Fields.name, key: 'description' },

					Fields.createdBy,
					Fields.createdAt,
					{
						...Fields.project,
						value: ({ project, importType }) => project?.name ?? getProjectScope(importType === 'CSV'),
						sort: false,
					},
					{
						key: 'item-dataSource',
						label: 'DataSource',
						value: ({ dataSource }) => dataSource,
					},
					{ key: 'item-importType', label: 'ImportType', value: ({ importType }) => importType },
					{ key: 'item-status', label: 'Status', value: ({ status }) => status },
				]}
				canDelete={(item) => {
					const isProjectFileImport = item?.project?._id;
					const caslSubject = isProjectFileImport
						? subject(SUBJECTS.ProjectFileImports, { project: item.project._id })
						: subject(SUBJECTS.CompanyFileImports, { project: null });
					const canDeleteFileImport = ability.can(ACTIONS.Delete, caslSubject);
					return canDeleteFileImport && item?.canDelete;
				}}
				onDelete={(item) => deleteFileImport(item._id, { importType: item.importType })}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedByFilter />
					</>
				}
			/>
		</>
	);
}

export default FileImportModuleList;
