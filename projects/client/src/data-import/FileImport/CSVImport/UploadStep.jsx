import { Typography } from '@material-ui/core';
import { useMemo } from 'react';
import styled from 'styled-components';

import { Box, Link } from '@/components/v2';
import { addFilesToDataImport } from '@/data-import/FileImport/api';
import { UploadStep } from '@/data-import/shared';
import { useUploadOptions as useUpload } from '@/data-import/shared/useUpload';
import { ifProp, theme } from '@/helpers/styled';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

import { DAILY_TEMPLATE, DIRECTIONAL_SURVEY_TEMPLATE, HEADER_TEMPLATE, MONTHLY_TEMPLATE } from '../data';

const warning11 =
	'Important Note: If you open CSV files in Excel please make sure your chosen Id field has not been altered. For example Excel normally alters API14 42412155102500 -> 424121551022500.00 or 424121551000000 which will break the link between the well headers and production files.';
const warning12 = 'We suggest opening CSV files with a text editor (such as Notepad or Notepad ++) instead of Excel.';
const warning2 = 'Preferably use CSV format for files larger than 100MB.';

const Note = styled.div`
	grid-column: 1 / -1;
	margin-top: 0.5rem;
	&,
	& > * {
		color: ${ifProp('warning', theme.warningColor, theme.warningAlternativeColor)};
		text-align: justify;
	}
`;

export const getDownloadLink = (link) => `https://drive.google.com/uc?export=download&id=${link}`;

const wellHeaderTemplateUrl = getDownloadLink('1-EDZuzegkQyuu3l3m7QNjWdAKFVV9yVq');
const dailyProductionTemplateUrl = getDownloadLink('1-3eVRMCXNntaQCSF7JaKVmCeMvosrPUW');
const monthlyProductionTemplateUrl = getDownloadLink('1-A3a2wTjmloHEaOTbNWszd0GSvnnfXci');
const directionalSurveyTemplateUrl = getDownloadLink('1j_L7tCB8nqzqWcf1zBmw_-eD_HVutI8u');
const dataDictionaryUrl = getDownloadLink('1iBif7G0oMz4JcVXcl3CK7zqZlfGwsiOD');

const InstructionsBlock = () => {
	const { openArticle } = useZoho();

	return (
		<Box my={3}>
			<Typography variant='body1'>
				For additional information on the data model, click&nbsp;
				<Link href={dataDictionaryUrl} variant='body1' color='secondary' target='_blank' rel='noreferrer'>
					here
				</Link>
				.
			</Typography>
			<Typography variant='body1'>
				Need help on the data import? click&nbsp;
				<Link
					href='#'
					onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.DataImport })}
					variant='body1'
					color='secondary'
				>
					here
				</Link>
				.
			</Typography>
			<Note>
				<p>{warning11}</p>
				<p>{warning12}</p>
			</Note>
			<Note warning>{warning2}</Note>
		</Box>
	);
};

export function CSVUploadStep({
	headerFile = {},
	productionMonthlyFile = {},
	productionDailyFile = {},
	directionalSurveyFile = {},
	_id: fileImportId,
	completed,
	onNext,
}) {
	const files = useMemo(
		() => [
			{
				...headerFile,
				...HEADER_TEMPLATE,
				template: wellHeaderTemplateUrl,
			},
			{
				...productionMonthlyFile,
				...MONTHLY_TEMPLATE,
				template: monthlyProductionTemplateUrl,
			},
			{
				...productionDailyFile,
				...DAILY_TEMPLATE,
				template: dailyProductionTemplateUrl,
			},
			{
				...directionalSurveyFile,
				...DIRECTIONAL_SURVEY_TEMPLATE,
				template: directionalSurveyTemplateUrl,
			},
		],
		[headerFile, productionDailyFile, productionMonthlyFile, directionalSurveyFile]
	);
	const { filesToUpload, ...uploadOptions } = useUpload({ files, fileImportId, addFilesToDataImport });
	const missingRequired = !filesToUpload || !Object.keys(filesToUpload).length;
	return (
		<UploadStep
			completed={completed}
			onNext={onNext}
			{...uploadOptions}
			note={<InstructionsBlock />}
			missingRequired={missingRequired}
			accept='.csv,.xlsx'
			normalSizeLimit={1024}
			increasedSizeLimit={2048}
		/>
	);
}
