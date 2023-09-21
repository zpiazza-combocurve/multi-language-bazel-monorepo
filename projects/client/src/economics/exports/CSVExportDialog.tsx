import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { useGetLocalStorage, useSetLocalStorage } from '@/components/hooks';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useDialog } from '@/helpers/dialog';
import { assert } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { useCurrentProjectId } from '@/projects/routes';

import { EMPTY_TEMPLATE, ID } from '../Economics/shared/constants';
import Sidebar from './CSVExportDialog/Sidebar';
import Template from './CSVExportDialog/Template';
import {
	CSVExportDialogProps,
	CSVExportTemplate,
	CashflowOptions,
	CustomReportDialogTheme,
	DataToTrack,
	SuggestedTemplateSymbol,
	Tour,
	adjustScenarioTableHeaders,
	getExportButtonStatus,
	getSaveButtonStatus,
	useAllPossibleHeaders,
	useCurrentProjectDefaultTemplate,
	useTemplates,
	useUserTemplates,
} from './CSVExportDialog/index';

type ICSVExportDialogProps = CSVExportDialogProps<Omit<CSVExportTemplate, 'cashfowOpions'>> & {
	cashflowOptions?: CashflowOptions;
};

const localStorageKey = 'local-storage-csv-export-type';

export const CSVExportDialog = memo(function CustomReportDialog({
	visible,
	resolve,
	onHide,
	runId,
	scenarioTableHeaders: _scenarioTableHeaders,
	hasReservesGroups: isFullEconRun,
}: ICSVExportDialogProps) {
	const currentProjectId = useCurrentProjectId();
	// TODO: add caching
	const [project, setProject] = useState<string>(currentProjectId);
	const cachedReportType = useGetLocalStorage(localStorageKey, 'oneLiner' as CSVExportTemplate['type']);
	const defaultReportType = !isFullEconRun && cachedReportType === 'cashflow-agg-csv' ? 'oneLiner' : cachedReportType;

	const [template, setTemplate] = useState<CSVExportTemplate>({
		...EMPTY_TEMPLATE,
		type: defaultReportType,
	} as CSVExportTemplate);

	const track = useTrackAnalytics();

	const { allPossibleHeaders } = useAllPossibleHeaders();
	const scenarioTableHeaders = useMemo(
		() => adjustScenarioTableHeaders(allPossibleHeaders, _scenarioTableHeaders),
		[allPossibleHeaders, _scenarioTableHeaders]
	);

	const { cashflowOptions, type: reportType, name: templateName, columns } = template;
	useSetLocalStorage(localStorageKey, reportType);

	const { defaultConfiguration: _defaultTemplate, isLoadingDefaultConfiguration } =
		useCurrentProjectDefaultTemplate(reportType);

	useEffect(() => {
		setTemplate((prev) => ({ ...prev, type: reportType, columns: [] } as CSVExportTemplate));
	}, [reportType]);

	const {
		templates,
		isLoading: isLoadingTemplates,
		handleCreateConfiguration,
		handleUpdateConfiguration,
	} = useTemplates(project, runId, scenarioTableHeaders, reportType);

	const { configurations: currentProjectTemplates } = useUserTemplates({
		project: currentProjectId,
		type: reportType,
	});

	const defaultTemplate = useMemo(
		() => templates.find(({ _id }) => _id === _defaultTemplate?._id),
		[templates, _defaultTemplate]
	);

	// HACK to avoid using default template in dependency array causing cycle rerenders
	const defaultTemplateRef = useRef(defaultTemplate);
	defaultTemplateRef.current = defaultTemplate;

	useEffect(() => {
		if (!isLoadingDefaultConfiguration && !isLoadingTemplates && defaultTemplateRef.current != null) {
			setTemplate(defaultTemplateRef.current);
		}
	}, [isLoadingDefaultConfiguration, isLoadingTemplates, defaultTemplateRef]);

	const isOneliner = reportType === 'oneLiner';
	const isImportEnabled = project !== currentProjectId;
	const templatesArray = useMemo(
		() => (isImportEnabled ? currentProjectTemplates : templates),
		[currentProjectTemplates, isImportEnabled, templates]
	);

	const { templatesNamesSet, suggestedTemplatesNamesSet } = useMemo(() => {
		return {
			templatesNamesSet: new Set(templatesArray?.map(({ name }) => name)),
			suggestedTemplatesNamesSet: new Set(
				templates?.filter((t) => t[SuggestedTemplateSymbol])?.map(({ name }) => name)
			),
		};
	}, [templates, templatesArray]);

	const trimmedTemplateName = templateName?.trim();
	const duplicatedName = templatesNamesSet.has(trimmedTemplateName);
	const isNameReserved = suggestedTemplatesNamesSet.has(trimmedTemplateName);

	const exportButtonWarningMessage = getExportButtonStatus(reportType, cashflowOptions, columns);
	const isExportButtonDisabled = Boolean(exportButtonWarningMessage);

	const saveButtonWarningMessage = getSaveButtonStatus({ isNameReserved, isNameBlank: !trimmedTemplateName });
	const isSaveButtonDisabled = isNameReserved || !trimmedTemplateName;

	const createTemplate = () =>
		handleCreateConfiguration({ ...template, project: currentProjectId, name: trimmedTemplateName });
	const saveTemplate = (templateToSave) =>
		handleUpdateConfiguration({ ...templateToSave, project: currentProjectId, name: templateToSave.name.trim() });

	const handleSaveTemplate = async () => {
		if (!duplicatedName) {
			createTemplate();
			return;
		}

		const isRewritingConfirmed = await alerts.confirm({
			title: `Confirm overwriting "${trimmedTemplateName}" template`,
			children: `Are you sure you want to overwrite template with name: "${trimmedTemplateName}"?`,
		});

		if (!isRewritingConfirmed) return;

		const idToSave = templatesArray?.find((template) => trimmedTemplateName === template.name)?._id;
		assert(idToSave);
		const templateToOverride = {
			...template,
			_id: idToSave,
		};

		setTemplate(templateToOverride);
		saveTemplate({
			...template,
			_id: idToSave,
		});
	};

	const { isCustomCSVEditorTourEnabled } = useLDFeatureFlags();

	return (
		<Dialog
			fullWidth
			maxWidth='xl'
			onClose={onHide}
			open={visible}
			css={`
				.MuiDialog-paperWidthXl {
					height: 100%;
				}
			`}
		>
			<CustomReportDialogTheme>
				<DialogTitle
					css={`
						h2 {
							display: flex;
							justify-content: space-between;
						}
					`}
				>
					<span>CSV Export Reports</span>
					{isCustomCSVEditorTourEnabled && <Tour />}
				</DialogTitle>
				<Section
					as={DialogContent}
					css={`
						flex-direction: row;
					`}
					disableOverflow
				>
					<SectionHeader
						css={`
							flex: 1 1 0;
							min-width: 15rem;
							border-right: 1px solid #404040;
							padding: 0 0.5rem;
						`}
					>
						<Sidebar
							isFullEconRun={isFullEconRun}
							project={project}
							runId={runId}
							scenarioTableHeaders={scenarioTableHeaders}
							setProject={setProject}
							setTemplate={setTemplate}
							template={template}
						/>
					</SectionHeader>
					<SectionContent
						disableOverflow
						css={`
							flex: 3 1 0;
							padding: 0 0.5rem;
						`}
					>
						<Template setTemplate={setTemplate} template={template} loading={isLoadingTemplates} />
					</SectionContent>
				</Section>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button
						variant='outlined'
						color='secondary'
						onClick={handleSaveTemplate}
						disabled={isSaveButtonDisabled && saveButtonWarningMessage}
					>
						{isImportEnabled ? 'Import' : 'Save'}
					</Button>
					<Button
						id={ID.export}
						variant='contained'
						color='secondary'
						onClick={() => {
							const cashflowOptionsToPass = isOneliner ? undefined : cashflowOptions;

							const dataToTrack: DataToTrack = {
								reportType,
								templateName: trimmedTemplateName,
							};

							if (cashflowOptionsToPass) {
								dataToTrack.cashflowOptionsReportType = cashflowOptionsToPass.type;
								dataToTrack.useTimePeriodsChecked = cashflowOptionsToPass.useTimePeriods;
							}

							if (cashflowOptionsToPass?.type === 'hybrid') {
								dataToTrack.hybridOptionsYearType = cashflowOptionsToPass.hybridOptions.yearType;
							}

							track(EVENTS.csvExport.form, dataToTrack);

							resolve({ ...template, cashflowOptions: cashflowOptionsToPass });
						}}
						disabled={isExportButtonDisabled && exportButtonWarningMessage}
					>
						Export
					</Button>
				</DialogActions>
			</CustomReportDialogTheme>
		</Dialog>
	);
});

export function useCSVExportDialog<T extends Partial<Omit<CSVExportDialogProps, 'resolve' | 'visible' | 'onHide'>>>(
	props: T
) {
	return useDialog<ICSVExportDialogProps, T>(CSVExportDialog, props);
}

export default useCSVExportDialog;
