/* eslint react-hooks/exhaustive-deps: warn */
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

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
	DIRECTIONAL_SURVEY_TEMPLATE,
	HEADER_TEMPLATE,
	HEADER_TOOLTIP,
	MONTHLY_TEMPLATE,
	MONTH_FIELDS,
	RECOMMENDED_FIELDS,
	SURVEY_FIELDS,
	useHeaders,
} from '../data';

const GALLON_UNIT = 'GAL';
const IHS_FLUID = {
	first_fluid_volume: `Total Fluid (1st Job) (${GALLON_UNIT})`,
	refrac_fluid_volume: `Total Fluid (Refrac) (${GALLON_UNIT})`,
};

export function getReversedMap(mappings) {
	const reversedMappings = {};
	Object.entries(mappings).forEach(([fileId, ccId]) => {
		reversedMappings[ccId] = fileId;
	});
	return reversedMappings;
}

// MapStep uses cc -> file
// DB mappings are saved file -> cc and chosenId -> file header
function reverseMappings(mappings) {
	if (!mappings) {
		return null;
	}
	const { chosenID: chosenIdMappedHeader, ...mappingsWithoutChosenId } = mappings;
	return { ...getReversedMap(mappingsWithoutChosenId), chosenID: chosenIdMappedHeader };
}

function useSuggestedMappings(fileImportId, file, prodType) {
	const { data } = useQuery(
		['file-import', 'suggested-mappings', prodType, fileImportId],
		() => getSuggestedMappings(fileImportId, { fileType: prodType }),
		{ enabled: !!file?.file }
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
			const { prodType } = files[fileIndex];
			const reversedMappings = reverseMappings(mappings);
			return updateDataImportMappings(fileImportId, { mapping: reversedMappings, category: prodType });
		},
		{
			onSuccess: () => {
				invalidateImport();
			},
		}
	);

	const { isLoading: settingDataSettings, mutateAsync: setDataSettings } = useMutation(
		(dataSettings) => setImportDataSettings(fileImportId, dataSettings),
		{
			onSuccess: (fileImport) => updateImport(fileImport),
		}
	);

	const { isLoading: complettingMappings, mutateAsync: completeMappings } = useMutation(
		() => completeImportMappings(fileImportId),
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
		const { prodType } = files[fileIndex];
		const reversedMappings = reverseMappings(mappings);
		const description = await promptSaveMapping({
			defaultName: `${dataSource}-${prodType}-${userLastName} ${format(Date.now(), 'MM-dd-yyyy')}`,
		});
		if (description) {
			onSaveMappings({ description, mappings: reversedMappings, fileType: prodType });
		}
	};

	const handleExportMappings = async (fileIndex, mappings) => {
		const { prodType, ccData } = files[fileIndex];

		const name = cleanFileName(
			`${dataSource}-${prodType}-${userLastName} ${format(Date.now(), 'MM-dd-yyyy')}.xlsx`
		);

		exportXLSX({
			fileName: name,
			sheets: [
				{
					name: prodType,
					data: Object.keys(ccData).map((key) => ({
						'ComboCurve Fields': ccData[key].label,
						'File Columns': mappings[key],
					})),
					headers: ['ComboCurve Fields', 'File Columns'],
				},
			],
		});

		confirmationAlert(`${name} successfully exported`);
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
		loading: updattingMappings || complettingMappings || settingDataSettings,
		saveMappings: handleSaveMappings,
		loadMappings: handleLoadMappings,
		exportMappings: handleExportMappings,
	};
}

function getMapFile(
	{ mapping = {}, headers: fileIds, prodType, name, label, fields, suggested, category },
	dataSource
) {
	const ccIds = Object.keys(fields);
	const ccData = {};
	const suggestedMappings = reverseMappings(suggested);
	ccIds.forEach((id) => {
		const recommended = RECOMMENDED_FIELDS.includes(id);
		const { label: fieldLabel, required, important } = fields[id] || {};
		// HACK
		function getLabel() {
			if (dataSource === 'ihs' && Object.keys(IHS_FLUID).includes(id)) {
				return IHS_FLUID[id];
			}
			return fieldLabel;
		}
		const mappedLabel = getLabel();
		const note = HEADER_TOOLTIP[name][id];
		ccData[id] = {
			...(ccData[id] || {}),
			label: mappedLabel,
			required,
			recommended,
			note,
			important,
		};
	});
	const reversedMappings = reverseMappings(mapping);
	return { name, label, fileIds, mappings: reversedMappings, ccIds, ccData, prodType, category, suggestedMappings };
}

const getAllFields = (normalFields, customFields) => ({
	...normalFields,
	...Object.fromEntries(Object.entries(customFields ?? {}).map(([k, label]) => [k, { label }])),
});

export function CSVMapStep({
	_id: fileImportId,
	dataSource,
	headerFile,
	productionMonthlyFile,
	productionDailyFile,
	directionalSurveyFile,
	dataSettings,
	completed,
	onNext,
	status,
}) {
	const canUndo = status === 'mapped';
	const undoOnMap = canUndo && completed;

	const headersFields = useHeaders();

	const { data: monthlyCustomFields } = useCustomFields('monthly-productions');
	const { data: dailyCustomFields } = useCustomFields('daily-productions');

	const monthlyFields = useMemo(() => getAllFields(MONTH_FIELDS, monthlyCustomFields), [monthlyCustomFields]);
	const dailyFields = useMemo(() => getAllFields(DAY_FIELDS, dailyCustomFields), [dailyCustomFields]);

	const suggestedHeader = useSuggestedMappings(fileImportId, headerFile, HEADER_TEMPLATE.prodType);
	const suggestedMonths = useSuggestedMappings(fileImportId, productionMonthlyFile, MONTHLY_TEMPLATE.prodType);
	const suggestedDays = useSuggestedMappings(fileImportId, productionDailyFile, DAILY_TEMPLATE.prodType);
	const suggestedSurvey = useSuggestedMappings(
		fileImportId,
		directionalSurveyFile,
		DIRECTIONAL_SURVEY_TEMPLATE.prodType
	);

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
			{
				...DIRECTIONAL_SURVEY_TEMPLATE,
				...(directionalSurveyFile || {}),
				fields: SURVEY_FIELDS,
				suggested: suggestedSurvey,
			},
		],
		[
			headerFile,
			productionDailyFile,
			productionMonthlyFile,
			directionalSurveyFile,
			headersFields,
			dailyFields,
			monthlyFields,
			suggestedDays,
			suggestedHeader,
			suggestedMonths,
			suggestedSurvey,
		]
	);

	const mapFiles = useMemo(
		() => files.map((file) => getMapFile(file, dataSource)).filter((file) => !!file.fileIds?.length),
		[files, dataSource]
	);

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
			<MapStep {...mapOptions} {...{ completed: completed && !canUndo, onNext }} />
		</>
	);
}
