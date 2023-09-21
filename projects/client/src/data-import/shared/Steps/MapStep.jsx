import { faChevronRight, faExclamation, faFile } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useMemo, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Centered, FontIcon } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { muiTooltiped } from '@/components/tooltipped';
import { Button as MUIButton } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { DIRECTIONAL_SURVEY_NAME } from '@/data-import/FileImport/data';
import { warningAlert } from '@/helpers/alerts';

import { COORDINATE_REFERENCE_SYSTEMS } from '../coordinateSystems';
import { useCoordinateReference } from '../useCoordinateReference';
import { FileMapSection } from './MapStep/FileMapSection';
import { ActionsContainer, DataSettingsContainer, FilesContainer, MapHeaderTop } from './MapStep/MapStepHeader';
import { Step, StepBody, StepFooter, StepHeader } from './Step';

const MUITooltippedButton = muiTooltiped(MUIButton);

const noop = () => null;
const emptyArr = [];
const directionalSurveyCombinationTooltip = (
	<div>
		Required columns:
		<br />
		<br />
		Use case 1: Measured Depth, Inclination, and Azimuth.
		<br />
		Use case 2: Measured Depth, True Vertical Depth, Deviation NS, and Deviation EW.
		<br />
		Use case 3: Measured Depth, Inclination, Azimuth, Latitude, and Longitude.
	</div>
);

function getRequiredFromObject({ ifPresent, ifMissing }, data) {
	const presentCond = ifPresent && ifPresent.some((requirements) => requirements.every((k) => data[k]?.mappedHeader));
	const missingCond =
		ifMissing && !ifMissing.some((requirements) => requirements.every((k) => data[k]?.mappedHeader));
	return !!(presentCond || missingCond);
}

function getRequiredData(data = {}) {
	const newData = { ...data };
	Object.entries(data).forEach(([id, { required, ...rest }]) => {
		if (typeof required === 'object') {
			const req = getRequiredFromObject(required, data);
			newData[id] = {
				...rest,
				required: req,
			};
		}
	});
	return newData;
}

function getLabelData(ids = [], data = {}) {
	const newData = { ...data };
	ids.forEach((id) => {
		newData[id] = {
			...newData[id],
			label: data[id]?.label || id,
		};
	});
	return newData;
}

function sortRequired(ids, data) {
	return ids.sort((idA, idB) => {
		if (data?.[idA]?.important && !data?.[idB]?.important) {
			return -1;
		}
		if (!data?.[idA]?.important && data?.[idB]?.important) {
			return 1;
		}
		if (data?.[idA]?.required && !data?.[idB]?.required) {
			return -1;
		}
		if (data?.[idB]?.required) {
			return 1;
		}
		return 0;
	});
}

function mapFile({ ccData = {}, fileData = {}, mappings = {}, ccIds, fileIds, ...file }) {
	const ccIdsSet = new Set(ccIds);
	const fileIdsSet = new Set(fileIds);
	let newCCData = {
		...ccData,
	};
	let newFileData = {
		...fileData,
	};
	Object.entries(mappings).forEach(([ccId, fileId]) => {
		newCCData[ccId] = { ...(ccData[ccId] || {}), mappedHeader: fileId };
		if (ccId !== 'chosenID' && ccIdsSet.has(ccId) && fileIdsSet.has(fileId)) {
			newFileData[fileId] = {
				...(fileData[fileId] || {}),
				mappedHeader: ccId,
			};
		}
	});

	const newCCIds = sortRequired([...ccIdsSet], newCCData);
	const newFileIds = sortRequired([...fileIdsSet], newFileData);

	newCCData = getRequiredData(newCCData);
	newFileData = getRequiredData(newFileData);

	newCCData = getLabelData(newCCIds, newCCData);
	newFileData = getLabelData(newFileIds, newFileData);

	return {
		...file,
		ccIds: newCCIds,
		fileIds: newFileIds,
		ccData: newCCData,
		fileData: newFileData,
	};
}

function checkCompleted(ids = [], data = {}) {
	return ids.every((id) => {
		const { mappedHeader, required } = data[id] || {};
		return !required || mappedHeader;
	});
}

function purgeMappings(mappings, ccIds, fileIds) {
	const curatedMappings = {};
	const ccSet = new Set(ccIds);
	const fileSet = new Set(fileIds);
	Object.entries(mappings).forEach(([ccId, fileId]) => {
		if (ccSet.has(ccId) && fileSet.has(fileId)) {
			curatedMappings[ccId] = fileId;
		}
	});
	return curatedMappings;
}

export function MapStep({
	dataSettings,
	setDataSettings,
	completeMap = noop,
	files: defaultFiles = emptyArr,
	loading = false,
	loadMappings,
	saveMappings,
	updateMappings,
	exportMappings,
	completed,
	onNext,
	onFinish,
	completedMessage = 'Cannot update mappings, Map Step already completed',
}) {
	const [selectedFileIndex, setSelectedFileIndex] = useState(0);

	const { coordinateReferenceSystem, setCoordinateReferenceSystem } = useCoordinateReference(
		dataSettings.coordinateReferenceSystem
	);

	const [unmappedFiles, setFiles] = useDerivedState(defaultFiles);
	const files = useMemo(() => unmappedFiles.map(mapFile), [unmappedFiles]);

	const { suggestedMappings, mappings } = unmappedFiles[selectedFileIndex] || {};

	const onUpdateMappings = useCallback(
		(newMappings) => {
			if (completed) {
				warningAlert(completedMessage);
				return;
			}
			setFiles((prevFiles) => {
				const selectedFile = prevFiles[selectedFileIndex];
				const { ccIds, fileIds } = selectedFile;
				const curatedMappings = purgeMappings(newMappings, ccIds, fileIds);
				if (updateMappings) {
					updateMappings({ fileIndex: selectedFileIndex, mappings: curatedMappings });
				}

				const newFiles = [...prevFiles];
				const newFile = { ...newFiles[selectedFileIndex] };
				newFile.mappings = curatedMappings;
				newFiles[selectedFileIndex] = newFile;

				return newFiles;
			});
		},
		[completed, setFiles, completedMessage, selectedFileIndex, updateMappings]
	);

	const mapHeader = useCallback(
		(ccId, fileId) => {
			const file = files[selectedFileIndex];

			const newMappings = { ...mappings };
			const mappedCCId = file?.fileData?.[fileId]?.mappedHeader;
			if (ccId !== 'chosenID') {
				delete newMappings[mappedCCId];
			}
			newMappings[ccId] = fileId;

			onUpdateMappings(newMappings);
		},
		[mappings, files, onUpdateMappings, selectedFileIndex]
	);

	const resetMappings = () => {
		onUpdateMappings({});
	};

	const mapSuggested = () => {
		onUpdateMappings(suggestedMappings || {});
	};

	const completedFiles = useMemo(() => {
		return files.map(({ ccIds, ccData, fileIds, fileData }) => {
			return checkCompleted(ccIds, ccData) && checkCompleted(fileIds, fileData);
		});
	}, [files]);

	const canComplete = completedFiles.every((completedFile) => completedFile);

	const handleLoadMappings = useCallback(async () => {
		const loadedMappings = await loadMappings();
		if (loadedMappings) {
			onUpdateMappings(loadedMappings);
		}
	}, [loadMappings, onUpdateMappings]);

	const onComplete = async () => {
		await setDataSettings({ coordinateReferenceSystem });
		await completeMap();
		onFinish?.();
	};

	const tooltipText = useMemo(
		() =>
			defaultFiles[selectedFileIndex].name === DIRECTIONAL_SURVEY_NAME
				? directionalSurveyCombinationTooltip
				: null,
		[defaultFiles, selectedFileIndex]
	);

	const getMappingAnalyticsTag = (completed) => {
		return completed ? {} : getTaggingProp('dataImport', 'completeMappings');
	};

	return (
		<Step>
			<StepHeader>
				<MapHeaderTop>
					<FilesContainer>
						{files?.length > 1 &&
							files?.map(({ name, label }, index) => (
								<Button
									faIcon={faFile}
									onClick={() => setSelectedFileIndex(index)}
									key={name || index}
									raised
									secondary={index === selectedFileIndex}
								>
									{label || name || `File ${index}`}
									{!completedFiles[index] && (
										<FontIcon warning rightIcon>
											{faExclamation}
										</FontIcon>
									)}
								</Button>
							))}
					</FilesContainer>
					<DataSettingsContainer>
						<SelectField
							name='coordinateReferenceSystem'
							menuItems={COORDINATE_REFERENCE_SYSTEMS.map((v) => ({ label: v, value: v }))}
							label='Coordinate Reference System Datum'
							value={coordinateReferenceSystem}
							onChange={(e) => {
								const crs = e.target.value;
								setCoordinateReferenceSystem(crs);
							}}
							helperText='Coordinates will be converted from this to WGS84'
							css={{ width: '18rem' }}
						/>
					</DataSettingsContainer>
				</MapHeaderTop>
				<Centered horizontal>
					<ActionsContainer>
						<MUITooltippedButton
							labelTooltip='Clears all mapped fields'
							color='primary'
							onClick={resetMappings}
							{...getTaggingProp('dataImport', 'resetMapping')}
						>
							Reset Mappings
						</MUITooltippedButton>
						<MUITooltippedButton
							labelTooltip='Automatically apply recommended mapping'
							onClick={mapSuggested}
							disabled={!suggestedMappings}
							color='primary'
							{...getTaggingProp('dataImport', 'mapSuggested')}
						>
							Map Suggested
						</MUITooltippedButton>
						<MUITooltippedButton
							labelTooltip='Save current mapping for future use'
							onClick={() => saveMappings?.(selectedFileIndex, mappings)}
							disabled={!saveMappings}
							color='primary'
							{...getTaggingProp('dataImport', 'saveMappings')}
						>
							Save Mappings
						</MUITooltippedButton>
						<MUITooltippedButton
							labelTooltip='Load previously saved mapping'
							onClick={() => handleLoadMappings(selectedFileIndex)}
							disabled={!loadMappings}
							color='primary'
							{...getTaggingProp('dataImport', 'loadMappings')}
						>
							Load Mappings
						</MUITooltippedButton>
						<MUITooltippedButton
							labelTooltip='Export Mappings'
							onClick={() => exportMappings?.(selectedFileIndex, mappings)}
							disabled={!exportMappings}
							color='primary'
							{...getTaggingProp('dataImport', 'exportMappings')}
						>
							Export Mappings
						</MUITooltippedButton>
					</ActionsContainer>
				</Centered>
			</StepHeader>

			<StepBody>
				{files.map(({ id, fileIds, ccIds, fileData, ccData }, index) => (
					<FileMapSection
						key={id}
						hidden={selectedFileIndex !== index}
						mapHeader={mapHeader}
						index={index}
						fileIds={fileIds}
						ccIds={ccIds}
						fileData={fileData}
						ccData={ccData}
						loading={loading}
						tooltipText={tooltipText}
					/>
				))}
			</StepBody>

			<StepFooter>
				<Button
					faIcon={faChevronRight}
					iconBefore={false}
					onClick={completed ? onNext : onComplete}
					disabled={!canComplete || loading}
					secondary
					transform
					raised
					{...getMappingAnalyticsTag(completed)}
				>
					{completed ? 'Next' : 'Complete Mapping'}
				</Button>
			</StepFooter>
		</Step>
	);
}
