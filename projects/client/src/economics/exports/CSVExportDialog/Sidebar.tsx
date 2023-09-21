import produce from 'immer';
import { memo } from 'react';

import { MenuItem, Select, Typography } from '@/components/v2';
import { ConfigurationList } from '@/components/v2/misc/ConfigurationDialog/ConfigurationList';
import { ECON_CSV_REPORT_TYPE_OPTIONS, ID } from '@/economics/Economics/shared/constants';
import { ValueOrFunction, assert } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { ConfigurationNameWithLogo } from './Sidebar/ConfigurationNameWithLogo';
import { isSuggestedTemplate, useProjectNamesWithTemplates } from './Sidebar/helpers';
import { CSVExportTemplate, useCurrentProjectDefaultTemplate, useTemplates } from './index';

export const Sidebar = memo(function Sidebar({
	scenarioTableHeaders,
	runId,
	project,
	setProject,
	template,
	setTemplate,
	isFullEconRun,
}: {
	scenarioTableHeaders?;
	runId?: string;
	project: string;
	setProject: (template: ValueOrFunction<string, [string]>) => void;
	template: CSVExportTemplate;
	setTemplate: (template: ValueOrFunction<CSVExportTemplate, [CSVExportTemplate]>) => void;
	isFullEconRun?: boolean;
}) {
	const { type: reportType } = template;

	const {
		handleDeleteConfiguration,
		isCreatingConfiguration,
		isLoading: isLoadingTemplates,
		templates,
	} = useTemplates(project, runId, scenarioTableHeaders, reportType);

	const {
		defaultConfiguration: defaultTemplate,
		isLoadingDefaultConfiguration,
		setDefaultConfiguration,
	} = useCurrentProjectDefaultTemplate(reportType);

	const canDeleteConfiguration = (c: CSVExportTemplate) => !isCreatingConfiguration(c) && !isSuggestedTemplate(c);
	const canSetDefaultConfiguration = (c: CSVExportTemplate) => !isCreatingConfiguration(c);

	const { data: projects } = useProjectNamesWithTemplates();

	assert(projects);

	const isLoading = isLoadingTemplates || isLoadingDefaultConfiguration;

	const handleChangeReportType = (event) => {
		setTemplate(
			produce((draft) => {
				draft.type = event.target.value;
			})
		);
	};

	return (
		<Section>
			<SectionHeader
				css={`
					& > *:not(:first-child) {
						margin-top: 0.5rem;
						width: 100%;
					}
				`}
			>
				<Typography variant='subtitle1'>Select Report Type</Typography>
				<Select id={ID.reportType} value={reportType} onChange={handleChangeReportType} variant='outlined'>
					{Object.keys(ECON_CSV_REPORT_TYPE_OPTIONS).map((key) => (
						<MenuItem
							id={key}
							key={key}
							value={key}
							disabled={key === 'cashflow-agg-csv' && !isFullEconRun}
						>
							{ECON_CSV_REPORT_TYPE_OPTIONS[key]}
						</MenuItem>
					))}
				</Select>
				<Typography variant='subtitle1'>Select Project</Typography>
				<Select value={project} onChange={(event) => setProject(String(event.target.value))} variant='outlined'>
					{Object.keys(projects).map((key) => (
						<MenuItem key={key} value={key}>
							{projects[key]}
						</MenuItem>
					))}
				</Select>
				<hr />
			</SectionHeader>
			<SectionContent>
				<ConfigurationList
					configurations={templates}
					deleteConfiguration={handleDeleteConfiguration}
					getConfigurationKey={({ _id, name }, index) => _id ?? `${name}-${index}`}
					getConfigurationName={ConfigurationNameWithLogo}
					isDefaultConfiguration={(c) => c._id === defaultTemplate?._id}
					isDeleteDisabled={(c) => !canDeleteConfiguration(c)}
					isLoading={isLoading}
					// TODO: remove _id from isSelected check, use name instead
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					isSelected={(c) => (template as any as { _id: string })._id === c._id && template.name === c.name}
					isSetDefaultDisabled={(c) => !canSetDefaultConfiguration(c)}
					onSelect={(t) => setTemplate(t)}
					setDefaultConfiguration={setDefaultConfiguration}
				/>
			</SectionContent>
		</Section>
	);
});

export default Sidebar;
