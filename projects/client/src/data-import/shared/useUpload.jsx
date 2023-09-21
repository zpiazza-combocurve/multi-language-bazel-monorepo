import { useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { useFileImport } from '@/data-import/FileImport/api';
import { useFileImportContext } from '@/data-import/FileImport/store';
import { infoAlert } from '@/helpers/alerts';

import { DAILY_TEMPLATE, DIRECTIONAL_SURVEY_TEMPLATE, HEADER_TEMPLATE, MONTHLY_TEMPLATE } from '../FileImport/data';

function getFileImportName(fileImportId, name) {
	return `${fileImportId}-${name}`;
}

export function useUploadOptions({ files, fileImportId, addFilesToDataImport, importType }) {
	const { invalidateImport, fileImport } = useFileImport(fileImportId);
	const [filesToUpload, addFileToUpload] = useState();
	const batchName = `fileImport(${fileImportId})`;
	const { uploadBatch, getBatchInfo, getFileInfo } = useFileImportContext(fileImport?.project);
	const batchInfo = getBatchInfo(batchName);

	const getTagging = (fileType) => {
		let property;
		switch (fileType) {
			case HEADER_TEMPLATE.name:
				property = 'downloadTemplateWellHeader';
				break;
			case MONTHLY_TEMPLATE.name:
				property = 'downloadTemplateMonthly';
				break;
			case DAILY_TEMPLATE.name:
				property = 'downloadTemplateDaily';
				break;
			case DIRECTIONAL_SURVEY_TEMPLATE.name:
				property = 'downloadTemplateDirectional';
				break;
			default:
				property = '';
		}

		if (!property) return {};
		return getTaggingProp('dataImport', property);
	};

	const filesWithProgress = files.map((file, index) => {
		const replaceName = (fileName) => (fileName ? fileName.replace(/\.accdb--.+\.csv/i, '.accdb') : undefined); // HACK: remove aries csv portion
		const fileInfo = getFileInfo(getFileImportName(fileImportId, file.name));
		const taggingProp = getTagging(file.name);
		return { ...fileInfo, ...file, fileName: replaceName(files[index]?.file?.name), taggingProp }; // fileName is used for previous file uploads after reloading the page
	});

	const { isLoading: uploadingFiles, mutate: uploadFiles } = useMutation(
		async () => {
			infoAlert('Uploading files, do not close or refresh your browser', 3000);
			const data = files
				.filter(({ name }) => !!filesToUpload[name])
				.map((file) => ({
					...file,
					file: filesToUpload[file.name],
					name: getFileImportName(fileImportId, file.name),
				}));
			const savedFiles = await uploadBatch({ name: batchName, files: data });
			return addFilesToDataImport(fileImportId, { files: savedFiles, importType });
		},
		{
			onSuccess: () => {
				invalidateImport();
			},
		}
	);

	const uploading = batchInfo?.uploading || uploadingFiles;

	return { files: filesWithProgress, uploadFiles, uploading, addFile: addFileToUpload, filesToUpload };
}
