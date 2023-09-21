import { faCalendar } from '@fortawesome/pro-regular-svg-icons';
import { get, isNil } from 'lodash';

import { Divider, Icon, Typography } from '@/components/v2';

import { useFileImport } from './api';

const useImportSummary = (fileImportId: Inpt.ObjectId<'file-import'>) => {
	const { fileImport } = useFileImport(fileImportId);

	if (fileImport) {
		const { importType, status, stats: fileImportStats, events } = fileImport;

		const endStatus =
			importType === 'aries' ? 'aries_complete' : importType === 'phdwin' ? 'phdwin_complete' : 'complete';
		if (status === endStatus) {
			const endEvent = events?.find(({ type }) => type === endStatus);
			const startEvent = events?.find(({ type }) => type === 'started');
			const startDate = startEvent ? new Date(startEvent.date).toLocaleString() : 'N/A';
			const endDate = endEvent ? new Date(endEvent.date).toLocaleString() : 'N/A';

			const stats = fileImportStats ?? {};

			const getStatValue = (path: string) => {
				const value = get(stats, path);
				return isNil(value) ? 'N/A' : (value as number);
			};

			const totalWells = getStatValue('totalWells') as number;
			const newWells = getStatValue('insertedWells') as number;
			const updatedWells = getStatValue('updatedWells') as number;

			return {
				start: startDate,
				end: endDate,
				totalWells,
				newWells,
				updatedWells,
				failedWells: totalWells - newWells - updatedWells,
				monthlyProdData: {
					total: getStatValue('totalMonthly'),
					new: getStatValue('insertedMonthly'),
					updated: getStatValue('updatedMonthly'),
					failed: getStatValue('failedMonthly'),
				},
				dailyProdData: {
					total: getStatValue('totalDaily'),
					new: getStatValue('insertedDaily'),
					updated: getStatValue('updatedDaily'),
					failed: getStatValue('failedDaily'),
				},
				directionalSurveys: {
					totalWells: getStatValue('totalSurveyWells'),
					totalRows: getStatValue('totalSurveyRows'),
					newWells: getStatValue('insertedSurveyWells'),
					newRows: getStatValue('insertedSurveyRows'),
					updatedWells: getStatValue('updatedSurveyWells'),
					updatedRows: getStatValue('updatedSurveyRows'),
					failedWells: getStatValue('failedSurveyWells'),
					failedRows: getStatValue('failedSurveyRows'),
				},
			};
		}
	}

	return null;
};

const SummaryColumn = ({ title, items }: { title: string; items: { label: string; value: number | string }[] }) => {
	return (
		<div css='flex: 1;'>
			<Typography variant='h6' css='margin-bottom: 5px;'>
				{title}
			</Typography>
			<Divider />
			{items.map(({ label, value }) => (
				<Typography key={label} css='margin-top: 10px;'>
					{label}: <span css='font-weight: 500;'>{value}</span>
				</Typography>
			))}
		</div>
	);
};

const ImportSummary = ({ fileImportId }: { fileImportId: Inpt.ObjectId<'file-import'> }) => {
	const summary = useImportSummary(fileImportId);

	if (!summary) {
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const monthlyNew = summary.monthlyProdData.new as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const monthlyUpdated = summary.monthlyProdData.updated as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const dailyNew = summary.dailyProdData.new as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const dailyUpdated = summary.dailyProdData.updated as any;
	const surveyNewWells = +summary.directionalSurveys.newWells || 0;
	const surveyNewRows = +summary.directionalSurveys.newRows || 0;
	const surveyUpdatedWells = +summary.directionalSurveys.updatedWells || 0;
	const surveyUpdatedRows = +summary.directionalSurveys.updatedRows || 0;

	return (
		<div>
			<div css='display: flex; margin-bottom: 15px;'>
				<Icon color='secondary'>{faCalendar}</Icon>
				<Typography css='margin-left: 5px;'>
					{summary.start} &mdash; {summary.end}
				</Typography>
			</div>
			<div
				css={`
					display: flex;
					& > *:not(:first-child) {
						margin-left: 1rem;
					}
				`}
			>
				<SummaryColumn
					title='Wells'
					items={[
						{ label: 'Total', value: summary.totalWells },
						{ label: 'New', value: summary.newWells },
						{ label: 'Updated', value: summary.updatedWells },
						{ label: 'Failed', value: summary.failedWells },
					]}
				/>
				<SummaryColumn
					title='Monthly Production'
					items={[
						{ label: 'Total', value: summary.monthlyProdData.total },
						{
							label: 'New Or Updated',
							value: !isNaN(monthlyNew) && !isNaN(monthlyUpdated) ? monthlyNew + monthlyUpdated : 'N/A',
						},
						{ label: 'Failed', value: summary.monthlyProdData.failed },
					]}
				/>
				<SummaryColumn
					title='Daily Production'
					items={[
						{ label: 'Total', value: summary.dailyProdData.total },
						{
							label: 'New Or Updated',
							value: !isNaN(dailyNew) && !isNaN(dailyUpdated) ? dailyNew + dailyUpdated : 'N/A',
						},
						{ label: 'Failed', value: summary.dailyProdData.failed },
					]}
				/>
				<SummaryColumn
					title='Directional Surveys'
					items={[
						{
							label: 'Total',
							value: `${summary.directionalSurveys.totalWells} wells | ${summary.directionalSurveys.totalRows} rows`,
						},
						{
							label: 'Imported',
							value:
								`${surveyNewWells + surveyUpdatedWells} wells | ` +
								`${surveyNewRows + surveyUpdatedRows} rows`,
						},
						{
							label: 'Failed',
							value: `${summary.directionalSurveys.failedWells} wells | ${summary.directionalSurveys.failedRows} rows`,
						},
					]}
				/>
			</div>
		</div>
	);
};

export default ImportSummary;
