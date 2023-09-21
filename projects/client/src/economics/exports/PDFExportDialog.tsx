import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import produce from 'immer';
import { useMemo } from 'react';

import { useDialog } from '@/helpers/dialog';
import { assert } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import CustomReportDialogTheme from './CSVExportDialog/theme';
import { Sidebar } from './PDFExportDialog/Sidebar';
import { Template } from './PDFExportDialog/Template';
import { Data, ids } from './PDFExportDialog/shared/constants';
import { useCurrentTemplate, useProjectNamesWithTemplates } from './PDFExportDialog/shared/helpers';
import { FormProvider } from './PDFExportDialog/shared/rhf';
import { PDFExportDialogProps } from './PDFExportDialog/shared/types';

const dialogGutters = '2rem';
export const PDFExportDialog = ({ visible, onHide, resolve }: PDFExportDialogProps) => {
	const { saveDisabled, save, saveAction, formData } = useCurrentTemplate();

	const { handleSubmit, watch, formState } = formData;

	const cashflowType = watch('cashflowOptions.type');

	const isHybridReportType = cashflowType === 'hybrid';

	const { data: projects } = useProjectNamesWithTemplates();

	const errors = Object.entries(formState.errors);
	const hasErrors = !!errors.length;

	const data = useMemo(() => {
		return produce(Data, (data) => {
			assert(data.project);
			data.project.options = projects;
			if (isHybridReportType) return;
			assert(data['cashflowOptions.hybridOptions.months']);
			assert(data['cashflowOptions.hybridOptions.yearType']);
			data['cashflowOptions.hybridOptions.months'].disabled = true;
			data['cashflowOptions.hybridOptions.yearType'].disabled = true;
		});
	}, [isHybridReportType, projects]);

	return (
		<FormProvider {...formData} data={data}>
			<Dialog
				id={ids.dialog}
				onClose={onHide}
				open={visible}
				fullScreen
				disableEnforceFocus
				sx={{
					maxHeight: `calc(100vh - ${dialogGutters} * 2)`,
					top: dialogGutters,
					maxWidth: `calc(100vw - ${dialogGutters} * 2)`,
					left: dialogGutters,
				}}
			>
				<CustomReportDialogTheme>
					<DialogTitle>PDF Export Reports</DialogTitle>
					<DialogContent>
						<Section
							as={DialogContent}
							css={`
								flex-direction: row;
							`}
						>
							<SectionHeader
								css={`
									flex: 1 1 0;
									min-width: 15rem;
									border-right: 1px solid #404040;
									padding: 0 0.5rem;
								`}
							>
								<Sidebar />
							</SectionHeader>
							<SectionContent
								css={`
									flex: 3 1 0;
									padding: 0 0.5rem;
								`}
							>
								<Template />
							</SectionContent>
						</Section>
					</DialogContent>
					<DialogActions>
						<Button color='inherit' onClick={onHide}>
							Cancel
						</Button>
						<Button
							color='secondary'
							variant='outlined'
							disabled={!!saveDisabled || hasErrors}
							onClick={save}
						>
							{saveAction}
						</Button>
						<Button
							color='secondary'
							variant='contained'
							disabled={hasErrors}
							onClick={handleSubmit((data) => resolve(data))}
						>
							Export
						</Button>
					</DialogActions>
				</CustomReportDialogTheme>
			</Dialog>
		</FormProvider>
	);
};

export function usePDFExportDialog<T extends Partial<Omit<PDFExportDialogProps, 'resolve' | 'visible' | 'onHide'>>>(
	props?: T
) {
	return useDialog<PDFExportDialogProps, T>(PDFExportDialog, props);
}

export default usePDFExportDialog;
