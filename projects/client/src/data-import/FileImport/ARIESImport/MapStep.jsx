/* eslint react-hooks/exhaustive-deps: warn */
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { ScopedSelectDialog } from '@/components';
import {
	backToMapStep,
	completeMappings as completeImportMappings,
	deleteMappings,
	getMappingsById,
	getSuggestedMappings,
	listMappings,
	saveMappings,
	setDataSettings as setImportDataSettings,
	updateDataImportMappings,
	useFileImport,
} from '@/data-import/FileImport/api';
import { MapStep } from '@/data-import/shared';
import SaveMappingDialog from '@/data-import/shared/Steps/MapStep/SaveMappingDialog';
import { confirmationAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { useCustomFields } from '@/helpers/headers';
import { cleanFileName } from '@/helpers/routing';
import { exportXLSX } from '@/helpers/xlsx';

import { ALL_DATA_SOURCES } from '../CreateDialog';
import {
	DAILY_TEMPLATE,
	DAY_FIELDS,
	HEADER_TEMPLATE,
	MONTHLY_TEMPLATE,
	MONTH_FIELDS,
	RECOMMENDED_FIELDS,
	useHeaders,
} from '../data';

export function getReversedMap(mappings) {
	const reversedMappings = {};
	Object.entries(mappings).forEach(([fileId, ccId]) => {
		reversedMappings[ccId] = fileId;
	});
	return reversedMappings;
}

// MapStep uses cc -> file
// DB mappings are saved file -> cc
function reverseMappings(mappings) {
	if (!mappings) {
		return null;
	}
	return getReversedMap(mappings);
}

function useSuggestedMappings(fileImportId, category) {
	const { data } = useQuery(
		[`file-import-suggested-mappings-${category}`, fileImportId],
		() => getSuggestedMappings(fileImportId, { fileType: category, importType: 'aries' }),
		{ enabled: !!category }
	);
	return data;
}

export function useMap({ dataSource, fileImportId, files, undoOnMap, dataSettings }) {
	const [saveMappingDialog, promptSaveMapping] = useDialog(SaveMappingDialog);
	const [scopedSelectDialog, selectElement] = useDialog(ScopedSelectDialog);
	const { updateImport, invalidateImport } = useFileImport(fileImportId);

	const { isLoading: updattingMappings, mutateAsync: updateMappings } = useMutation(
		async ({ fileIndex, mappings = {} }) => {
			if (undoOnMap) {
				await backToMapStep(fileImportId);
				invalidateImport();
			}
			const { category } = files[fileIndex];
			const reversedMappings = reverseMappings(mappings);
			return updateDataImportMappings(fileImportId, {
				mapping: reversedMappings,
				category,
				importType: 'aries',
			});
		},
		{
			onSuccess: () => {
				invalidateImport();
			},
		}
	);

	const queryClient = useQueryClient();
	const { isLoading: complettingMappings, mutateAsync: completeMappings } = useMutation(async () => {
		await completeImportMappings(fileImportId, { importType: 'aries' });
		queryClient.invalidateQueries(['file-import', fileImportId]);
	});

	const { isLoading: settingDataSettings, mutateAsync: setDataSettings } = useMutation(
		(dataSettings) => setImportDataSettings(fileImportId, dataSettings),
		{
			onSuccess: (fileImport) => updateImport(fileImport),
		}
	);

	const { user } = useAlfa();
	const userId = user?._id;
	const userLastName = user?.lastName;

	const { isLoading: gettingMappings, mutateAsync: getMapping } = useMutation((id) => getMappingsById(id));

	const handleLoadMappings = async () => {
		const elementId = await selectElement({
			choices: [
				{
					title: 'Mappings',
					elements: async () => {
						const docs = await listMappings();
						return docs.map(({ _id, description, dataSource: mappingDataSource, createdBy }) => ({
							value: _id,
							primaryText: description,
							secondaryText: ALL_DATA_SOURCES[mappingDataSource],
							onTrash: userId === createdBy && deleteMappings,
						}));
					},
				},
			],
		});
		if (!elementId) {
			return null;
		}
		const mappingDoc = await getMapping(elementId);
		const mappings = {};
		if (mappingDoc?.mappings) {
			mappingDoc.mappings.forEach(([fileId, ccId]) => {
				mappings[fileId] = ccId;
			});
		}
		return reverseMappings(mappings);
	};

	const { isLoading: savingMappings, mutateAsync: onSaveMappings } = useMutation(
		({ description, mappings, fileType }) => {
			return saveMappings({
				description,
				mappings,
				dataSource,
				fileType,
			});
		}
	);

	const handleSaveMappings = async (fileIndex, mappings) => {
		const { category } = files[fileIndex];
		const reversedMappings = reverseMappings(mappings);
		const description = await promptSaveMapping({
			defaultName: `${dataSource}-${category}-${userLastName} ${format(Date.now(), 'MM-dd-yyyy')}`,
		});
		if (description) {
			onSaveMappings({ description, mappings: reversedMappings, fileType: category });
		}
	};

	// TODO Remove duplication
	const handleExportMappings = async (fileIndex, mappings) => {
		const { name, label, category, ccData } = files[fileIndex];

		const fileName = cleanFileName(`${category} ${label} ${format(Date.now(), 'MM-dd-yyyy')}.xlsx`);

		exportXLSX({
			fileName,
			sheets: [
				{
					name,
					data: Object.keys(ccData).map((key) => ({
						'ComboCurve Fields': ccData[key].label,
						'File Columns': mappings[key],
					})),
					headers: ['ComboCurve Fields', 'File Columns'],
				},
			],
		});

		confirmationAlert(`${fileName} successfully exported`);
	};

	return {
		files,
		updateMappings,
		updattingMappings,
		gettingMappings,
		dataSettings,
		setDataSettings,
		settingDataSettings,
		completeMap: completeMappings,
		complettingMappings,
		savingMappings,
		saveMappingDialog,
		scopedSelectDialog,
		loading: updattingMappings || complettingMappings,
		saveMappings: handleSaveMappings,
		loadMappings: handleLoadMappings,
		exportMappings: handleExportMappings,
	};
}

function getMapFile({ mapping = {}, headers: fileIds, category, name, label, fields, suggested }) {
	const ccIds = Object.keys(fields).filter((id) => id !== 'chosenID');
	const ccData = {};
	const suggestedMappings = reverseMappings(suggested);
	ccIds.forEach((id) => {
		const recommended = RECOMMENDED_FIELDS.includes(id);
		const { label: fieldLabel, required } = fields[id] || {};
		ccData[id] = {
			...(ccData[id] || {}),
			label: fieldLabel,
			required,
			recommended,
		};
	});
	const reversedMappings = reverseMappings(mapping);
	return {
		name,
		label,
		fileIds,
		mappings: reversedMappings,
		ccIds,
		ccData,
		category,
		suggestedMappings,
	};
}

const getAllFields = (normalFields, customFields) => ({
	...normalFields,
	...Object.fromEntries(Object.entries(customFields ?? {}).map(([k, label]) => [k, { label }])),
});

export function ARIESMapStep({
	_id: fileImportId,
	dataSource,
	files: ariesFiles,
	dataSettings,
	completed,
	onNext,
	status,
}) {
	const canUndo = status === 'mapped';
	const undoOnMap = canUndo && completed;
	const headerFile = useMemo(() => ariesFiles?.find(({ category }) => category === 'acProperty'), [ariesFiles]);
	const productionMonthlyFile = useMemo(
		() => ariesFiles?.find(({ category }) => category === 'acProduct'),
		[ariesFiles]
	);
	const productionDailyFile = useMemo(() => ariesFiles?.find(({ category }) => category === 'acDaily'), [ariesFiles]);

	const normalHeadersFields = useHeaders();
	const headersFields = useMemo(() => normalHeadersFields, [normalHeadersFields]);

	const { data: monthlyCustomFields } = useCustomFields('monthly-productions');
	const { data: dailyCustomFields } = useCustomFields('daily-productions');

	const monthlyFields = getAllFields(MONTH_FIELDS, monthlyCustomFields);
	const dailyFields = getAllFields(DAY_FIELDS, dailyCustomFields);

	const suggestedHeader = useSuggestedMappings(fileImportId, headerFile?.headers && 'acProperty');
	const suggestedMonths = useSuggestedMappings(fileImportId, productionMonthlyFile?.headers && 'acProduct');
	const suggestedDays = useSuggestedMappings(fileImportId, productionDailyFile?.headers && 'acDaily');

	const files = useMemo(
		() => [
			{
				...HEADER_TEMPLATE,
				...(headerFile || {}),
				fields: headersFields,
				suggested: suggestedHeader,
			},
			{
				...MONTHLY_TEMPLATE,
				...(productionMonthlyFile || {}),
				fields: monthlyFields,
				suggested: suggestedMonths,
			},
			{
				...DAILY_TEMPLATE,
				...(productionDailyFile || {}),
				fields: dailyFields,
				suggested: suggestedDays,
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- TODO eslint fix later
		[
			headerFile,
			headersFields,
			productionDailyFile,
			productionMonthlyFile,
			suggestedDays,
			suggestedHeader,
			suggestedMonths,
		]
	);

	const mapFiles = useMemo(() => files.map(getMapFile).filter((file) => !!file.fileIds?.length), [files]);

	const { saveMappingDialog, scopedSelectDialog, ...mapOptions } = useMap({
		dataSource,
		fileImportId,
		files: mapFiles,
		undoOnMap,
		dataSettings,
	});

	return (
		<>
			{saveMappingDialog}
			{scopedSelectDialog}
			<MapStep
				{...mapOptions}
				{...{ completed: completed && !canUndo, onNext }}
				completedMessage='Cannot update mappings of a completed import. If you want to update an import project create a new csv import to update an existing ARIES project'
			/>{' '}
		</>
	);
}
