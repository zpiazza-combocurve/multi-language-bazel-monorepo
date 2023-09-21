import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import { keyBy, mapValues } from 'lodash-es';
import { useState } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { FontIcon } from '@/components';
import { WarnBanner } from '@/components/banners';
import { Button, Dialog, DialogActions, DialogContent, TextField } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { getImportName } from '@/data-import/shared/CreateDialog';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { theme } from '@/helpers/styled';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

import { createFileImport } from './api';

const IMPORT_TYPE_CSV = {
	label: 'CSV',
	value: 'csv',
};
const IMPORT_TYPE_ARIES = {
	label: 'ARIES',
	value: 'aries',
};

const IMPORT_TYPE_PHDWIN = {
	label: 'PHDWIN',
	value: 'phdwin',
};
const DATA_SOURCE_DI = { value: 'di', label: 'DI' };
const DATA_SOURCE_IHS = { value: 'ihs', label: 'IHS' };
const DATA_SOURCE_INTERNAL = { value: 'internal', label: 'Internal' };
const DATA_SOURCE_OTHER = { value: 'other', label: 'Other' };
const ARIES_OPTION = { value: 'aries', label: 'ARIES' };
const PHDWIN_OPTION = { value: 'phdwin', label: 'PHDWIN' };

const Link = ({ children, href, onClick }) => (
	<a
		css={`
			&& {
				text-decoration: underline;
				color: ${theme.textColorOpaque};
				cursor: pointer;
			}
		`}
		href={href}
		onClick={onClick}
		target='_blank'
		rel='noopener noreferrer'
	>
		{children}
	</a>
);

/**
 * @param {object} props
 * @param {string} [props.href]
 * @param {() => void} [props.onClick]
 * @param {React.ReactNode} [props.children]
 */
export const InstructionsBanner = ({ href, onClick, children, ...rest }) => (
	<WarnBanner
		css={`
			width: 100%;
			& a {
				text-decoration: underline;
				color: ${theme.textColorOpaque};
			}
		`}
		{...rest}
	>
		<FontIcon>{faInfoCircle}</FontIcon>
		<Link onClick={onClick} href={href}>
			{children}
		</Link>
	</WarnBanner>
);

const updateInstructions = (
	<>
		{[
			{
				href: 'https://drive.google.com/file/d/1neQv5RdtmH1NdIvqP6OyKzRJgSSDiomz/view?usp=sharing',
				label: 'How to Update Data',
			},
			{
				href: 'https://bit.ly/3lsc921',
				label: 'Company Vs Project level wells',
			},
		].map(({ href, label }) => (
			<InstructionsBanner
				css={`
					&& {
						padding: 0.5rem;
						padding-left: 3rem; // HACK: hardcoding margins here, couldn't find other way to center and align
						justify-content: initial;
					}
				`}
				href={href}
				key={href}
			>
				{label}
			</InstructionsBanner>
		))}
	</>
);

const newAriesInstructions = (
	<InstructionsBanner href='https://drive.google.com/file/d/1VwP8QyLusRwjdYyf5ocXf7GIVq1KdTZ6'>
		How to Upload ARIES
	</InstructionsBanner>
);

const ARIES_IMPORT_TITLE = 'ARIES Import';
const PHDWIN_IMPORT_TITLE = 'PHDWIN Import';
export const IMPORT_METHODS = {
	'new-csv': {
		label: 'Regular Import (.csv)',
		title: 'File Import',
		dataSourceOptions: [
			DATA_SOURCE_DI,
			DATA_SOURCE_IHS,
			DATA_SOURCE_INTERNAL,
			DATA_SOURCE_OTHER,
			ARIES_OPTION,
			PHDWIN_OPTION,
		],
		note: updateInstructions,
	},
	'new-aries': {
		label: 'New ARIES Import (.accdb or .mdb)',
		title: ARIES_IMPORT_TITLE,
		importType: IMPORT_TYPE_ARIES.value,
		dataSourceOptions: [ARIES_OPTION],
		ariesImport: true,
		note: newAriesInstructions,
	},
	'new-phdwin': {
		label: 'New PHDWIN Import (.phz)',
		title: PHDWIN_IMPORT_TITLE,
		importType: IMPORT_TYPE_PHDWIN.value,
		dataSourceOptions: [PHDWIN_OPTION],
		ariesImport: true,
		phdwinImport: true,
	},
};

export const ALL_DATA_SOURCES = mapValues(
	keyBy(
		[DATA_SOURCE_DI, DATA_SOURCE_IHS, DATA_SOURCE_INTERNAL, DATA_SOURCE_OTHER, ARIES_OPTION, PHDWIN_OPTION],
		'value'
	),
	'label'
);

/**
 * @param {boolean} ariesImport If it is aries import
 * @param {boolean} update If it is updating a previous import
 */
export function useScopeOptions(ariesImport, update) {
	const newAries = ariesImport && !update;
	const { project } = useAlfa();

	const { canCreate: canCreateProjectFileImports } = usePermissions(SUBJECTS.ProjectFileImports, project?._id);
	const { canCreate: canCreateCompanyFileImports } = usePermissions(SUBJECTS.CompanyFileImports, null);

	const hasProject = !!project?._id;
	const projectLabel = newAries
		? 'Import to new project'
		: `Import to Existing Project${hasProject ? ` (${project?.name})` : ''}`;
	const disabledProject = !hasProject && !newAries;
	const projectOption = {
		label: projectLabel,
		value: 'project',
		disabled: !canCreateProjectFileImports || disabledProject,
		title:
			(!canCreateProjectFileImports && PERMISSIONS_TOOLTIP_MESSAGE) ||
			(!disabledProject && 'Create a project first'),
	};
	const companyOption = {
		label: 'Import to Company Level',
		value: 'company',
		disabled: !canCreateCompanyFileImports || ariesImport,
		title: !canCreateCompanyFileImports && PERMISSIONS_TOOLTIP_MESSAGE,
	};
	const scopeOptions = ariesImport ? [projectOption] : [projectOption, companyOption];
	const [dataScope, onScopeChange] = useState(scopeOptions.find((option) => !option.disabled)?.value);
	const selectedProject = dataScope === projectOption.value ? project?._id : null;
	return { scopeOptions, dataScope, onScopeChange, selectedProject };
}

// TODO: split diaog in several components, one for each data source
/** Param feat One of IMPORT_METHODS */
export function CreateDialog({ visible, onHide, onCreate, feat }) {
	// state
	const {
		importType = IMPORT_TYPE_CSV.value,
		update,
		dataSourceOptions,
		title,
		ariesImport,
		phdwinImport,
		note,
	} = IMPORT_METHODS[feat ?? Object.keys(IMPORT_METHODS)[0]];
	const { user, project } = useAlfa();
	const initialDataSource = dataSourceOptions[0].value;
	const { scopeOptions, dataScope, onScopeChange, selectedProject } = useScopeOptions(ariesImport, update);
	const [dataSource, setDataSource] = useState(initialDataSource);
	const [name, setName] = useState(getImportName(user, initialDataSource));
	const track = useTrackAnalytics();

	// actions
	const { isLoading: creating, mutateAsync: create } = useMutation(async () => {
		const payload = {
			project: selectedProject,
			description: name,
			dataSource,
			importType,
		};
		try {
			const { _id } = await createFileImport(payload);
			onCreate(_id);
			track(EVENTS.dataImport.form, { dataSource, dataScope });
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	useLoadingBar(creating);

	const canCreate = name && dataSource && !creating && dataScope;
	const noAriesProject = !project?._id && ariesImport && update; // cannot import if aries update and no project selected

	const getTaggingPropForImportType = (importType) => {
		if (importType === IMPORT_TYPE_CSV.value) {
			return getTaggingProp('dataImport', 'standard');
		} else if (importType === IMPORT_TYPE_ARIES.value) {
			return getTaggingProp('dataImport', 'aries');
		} else if (importType === IMPORT_TYPE_PHDWIN.value) {
			return getTaggingProp('dataImport', 'phdwin');
		}
		return {};
	};

	const { openArticle } = useZoho();

	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogContent css='padding: 0 !important; width: 25rem;'>
				{phdwinImport ? (
					<InstructionsBanner onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.PhdwinImport })}>
						How to Upload a PHDWin File
					</InstructionsBanner>
				) : (
					note
				)}
				<div
					css={`
						padding: 24px; // same as normal DialogContent components
					`}
				>
					<h2>
						{update ? 'Update' : 'New'} {title}
					</h2>
					<SelectField
						name='dataSource'
						menuItems={dataSourceOptions}
						disabled={!importType || dataSourceOptions.length < 2 || noAriesProject}
						label='Data Source'
						fullWidth
						value={dataSource}
						onChange={(e) => {
							const source = e.target.value;
							setDataSource(source);
							setName(getImportName(user, source));
						}}
					/>

					<TextField value={name} label='Name' fullWidth onChange={(n) => setName(n.target.value)} />

					<RadioGroupField
						css={`
							margin-top: 0.5rem;
							padding: 0;
							& .MuiFormControlLabel-root {
								margin-left: 0;
							}
						`}
						name='dataScope'
						label='Data Scope:'
						value={dataScope}
						options={scopeOptions}
						onChange={(v) => onScopeChange(v.target.value)}
					/>
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} disabled={creating}>
					Cancel
				</Button>
				<Button
					color='primary'
					disabled={!canCreate}
					onClick={create}
					{...getTaggingPropForImportType(importType)}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}
export default CreateDialog;
