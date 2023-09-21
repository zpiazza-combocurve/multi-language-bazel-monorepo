import { faDownload, faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import produce from 'immer';
import { intersection } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { Button, Divider, IconButton, TextField, Typography } from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { genericErrorAlert, useDoggo, useLoadingBar } from '@/helpers/alerts';
import { getProjectCustomHeaders } from '@/helpers/project-custom-headers';
import { theme } from '@/helpers/styled';
import { exportXLSXArray } from '@/helpers/xlsx';
import { MAX_WELLS_COLLECTIONS_PER_MODULE } from '@/inpt-shared/constants';
import { PROJECT_WELLS_LIMIT } from '@/inpt-shared/project/shared';
import Merge from '@/module-list/Merge/Merge';
import { ModuleBasicInfo } from '@/module-list/Merge/models';

import styles from '../module-list/Merge/merge.module.scss';
import Collisions from './MergeProjects/Collisions';
import MergeProjectCustomHeadersWorkspace from './MergeProjects/MergeProjectCustomHeadersWorkspace';
import { DUPLICATE_NAME_PARTS, MAX_NUMBER_OF_MERGED_PROJECT_CUSTOM_HEADERS } from './MergeProjects/constants';
import { getModuleDuplicateName } from './MergeProjects/helpers';
import mergeProjectStyles from './MergeProjects/merge-projects.module.scss';
import {
	CollisionsModel,
	ModulesExpandStateModel,
	ProjectCollisionModuleInfoModel,
	ProjectToMergeModel,
} from './MergeProjects/models';
import useMergeProjects from './MergeProjects/useMergeProjects';
import { downloadMergeWellsInfo, getMergeCollisions, getWellsOverlapAndTotalBasedOnIdField, useProject } from './api';

const MergeProjects = () => {
	const [overlap, setOverlap] = useState<number>(-1);
	const [total, setTotal] = useState<number>(-1);
	const [totalWellsCollections, setTotalWellsCollections] = useState<number | undefined>(undefined);
	const [downloadingWells, setDownloadingWells] = useState<boolean>(false);
	const [isLoadingTotalAndOverlap, setIsLoadingTotalAndOverlap] = useState<boolean>(false);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { firstProjectId, secondProjectId } = useParams()!;
	const { project: firstProjectData } = useProject(firstProjectId);
	const { project: secondProjectData } = useProject(secondProjectId);
	const [firstProjectUnordered, setFirstProjectUnordered] = useState<ProjectToMergeModel>({
		project: {},
		customHeaders: [],
	});
	const [secondProjectUnordered, setSecondProjectUnordered] = useState<ProjectToMergeModel>({
		project: {},
		customHeaders: [],
	});
	const [sidebarItems, setSidebarItems] = useState<ModuleBasicInfo[]>([]);
	const [modulesExpandState, setModulesExpandState] = useState<ModulesExpandStateModel>({
		assumptions: false,
		forecasts: false,
		typeCurves: false,
		scenarios: false,
		schedules: false,
		lookupTables: false,
		filters: false,
		shapefiles: false,
		customHeaders: false,
	});
	const [collisions, setCollisions] = useState<CollisionsModel | null>(null);

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const {
		setName,
		setDuplicateNamePart,
		setDuplicateNameModifier,
		setWellIdentifier,
		sortProjects,
		model,
		addCustomHeaders,
		updateCustomHeader,
		deleteCustomHeader,
		mergeProjects,
		isMergeInProgress,
	} = useMergeProjects(firstProjectId as string, secondProjectId as string);

	const firstProject =
		model.projects[0] === firstProjectUnordered?.project?._id ? firstProjectUnordered : secondProjectUnordered;
	const secondProject =
		model.projects[1] === firstProjectUnordered?.project?._id ? firstProjectUnordered : secondProjectUnordered;

	const onWellIdentifierChange = useCallback(
		(identifier: string) => {
			setWellIdentifier(identifier);
		},
		[setWellIdentifier]
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const duplicateNameModifierInputRef = useRef<any>();
	const onDuplicateNameModifierChange = useCallback(
		(duplicateNameModifier: string) => {
			setDuplicateNameModifier(duplicateNameModifier);
		},
		[setDuplicateNameModifier]
	);
	const onDuplicateNamePartChange = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(e: any) => {
			setDuplicateNamePart(e.target.value);
		},
		[setDuplicateNamePart]
	);

	const downloadWellsInfo = useCallback(async () => {
		setDownloadingWells(true);
		try {
			const data = await downloadMergeWellsInfo(
				firstProject.project._id,
				secondProject.project._id,
				model.wellIdentifier
			);
			exportXLSXArray(`wells ${firstProject.project.name}_${secondProject.project.name}.xlsx`, [
				{ name: 'Wells', data },
			]);
		} catch (err) {
			genericErrorAlert(err);
		} finally {
			setDownloadingWells(false);
		}
	}, [firstProject, secondProject, model.wellIdentifier]);

	const toggleModule = useCallback((flag: boolean, key?: string) => {
		setModulesExpandState(
			produce((draft) => {
				if (key) {
					draft[key] = flag;
				} else {
					Object.keys(draft).forEach((k) => {
						draft[k] = flag;
					});
				}
			})
		);
	}, []);

	const expandModule = useCallback(
		(key?: string) => {
			toggleModule(true, key);
		},
		[toggleModule]
	);

	const collapseModule = useCallback(
		(key?: string) => {
			toggleModule(false, key);
		},
		[toggleModule]
	);

	useEffect(() => {
		if (firstProjectData && secondProjectData) {
			setSidebarItems([
				{
					id: firstProjectData._id,
					name: firstProjectData.name,
					wells: firstProjectData.wells.length,
				},
				{
					id: secondProjectData._id,
					name: secondProjectData.name,
					wells: secondProjectData.wells.length,
				},
			]);
		}
	}, [firstProjectData, secondProjectData]);

	useEffect(() => {
		async function getCustomHeaders() {
			if (firstProjectData && secondProjectData) {
				setSidebarItems([
					{
						id: firstProjectData._id,
						name: firstProjectData.name,
						wells: firstProjectData.wells.length,
					},
					{
						id: secondProjectData._id,
						name: secondProjectData.name,
						wells: secondProjectData.wells.length,
					},
				]);
				const firstProjectCH = await getProjectCustomHeaders(firstProjectId as string);
				const secondProjectCH = await getProjectCustomHeaders(secondProjectId as string);

				setFirstProjectUnordered({ project: firstProjectData, customHeaders: firstProjectCH?.headers || [] });
				setSecondProjectUnordered({
					project: secondProjectData,
					customHeaders: secondProjectCH?.headers || [],
				});
			}
		}

		getCustomHeaders();
	}, [firstProjectId, secondProjectId, firstProjectData, secondProjectData]);

	useEffect(() => {
		if (model.projects && model.projects.length > 1 && model.wellIdentifier) {
			const updateTotalAndOverlap = async () => {
				setIsLoadingTotalAndOverlap(true);
				const {
					overlap: calculatedOverlap,
					total: calculatedTotal,
					wellsCollectionsTotal,
				} = await getWellsOverlapAndTotalBasedOnIdField(
					model.projects[0],
					model.projects[1],
					model.wellIdentifier
				);
				setIsLoadingTotalAndOverlap(false);
				setOverlap(calculatedOverlap);
				setTotal(calculatedTotal);

				if (wellsCollectionsTotal > 0 || isWellsCollectionsEnabled) {
					setTotalWellsCollections(wellsCollectionsTotal);
				}
			};

			updateTotalAndOverlap();
		}
	}, [model.projects, model.wellIdentifier, isWellsCollectionsEnabled]);

	useEffect(() => {
		if (firstProject.project._id && secondProject.project._id && !collisions) {
			const getCollisions = async () => {
				const result = await getMergeCollisions(firstProject.project._id, secondProject.project._id);
				setCollisions(result);
			};

			getCollisions();
		}
	}, [firstProject.project._id, secondProject.project._id, collisions]);

	useDoggo(downloadingWells, 'Downloading wells info...');
	useLoadingBar(isLoadingTotalAndOverlap);

	const mergedHeaders = model.customHeaders;
	const headersNumberExceeded = mergedHeaders.length > MAX_NUMBER_OF_MERGED_PROJECT_CUSTOM_HEADERS;

	let customHeadersWarning = headersNumberExceeded ? 'Merge or Remove some of the Project Custom Headers' : '';

	if (!customHeadersWarning) {
		const mergedHeadersNames = mergedHeaders.map((q) => q.name);
		const allNamesAreUnique = new Set(mergedHeadersNames).size === mergedHeaders.length;

		if (!allNamesAreUnique) {
			customHeadersWarning = 'Project Custom Headers names should be unique';
		}
	}

	const ambiguousSuffixOrPrefixText = useMemo(() => {
		const firstProjId = firstProject.project._id;
		const secondProjId = secondProject.project._id;

		if (collisions && firstProjId && secondProjId && model.duplicateNameModifier) {
			const modules = Object.keys(collisions);

			for (let i = 0; i < modules.length; ++i) {
				const matchingNamesWithAppliedNamePart = collisions[modules[i]].collisions.map(
					(collision: ProjectCollisionModuleInfoModel) => {
						const name = collision[secondProjId].name;
						const category = collision[secondProjId].category;
						const withAppliedModifier = getModuleDuplicateName(
							name,
							model.duplicateNamePart,
							model.duplicateNameModifier
						);

						return category ? `${withAppliedModifier} (${category})` : withAppliedModifier;
					}
				);
				const firstProjectModuleItems = collisions[modules[i]][firstProjId];
				const secondProjectModuleItems = collisions[modules[i]][secondProjId];

				if (
					intersection(firstProjectModuleItems, matchingNamesWithAppliedNamePart).length > 0 ||
					intersection(secondProjectModuleItems, matchingNamesWithAppliedNamePart).length > 0
				) {
					return `Can not create unambiguous names with applied ${model.duplicateNamePart}.`;
				}
			}
		}

		return '';
	}, [
		collisions,
		firstProject.project._id,
		model.duplicateNameModifier,
		model.duplicateNamePart,
		secondProject.project._id,
	]);

	const expandAllDisabled = !Object.entries(modulesExpandState).find((e) => !e[1]);
	const collapseAllDisabled = !Object.entries(modulesExpandState).find((e) => e[1]);

	return (
		<Merge
			items={sidebarItems}
			onNameChange={setName}
			maxNumberOfWellsInMerged={PROJECT_WELLS_LIMIT}
			onSortModuleItems={sortProjects}
			moduleName='Project'
			titleDescription='Define projects hierarchical order for merging duplicate wells and custom headers'
			total={total}
			overlap={overlap}
			totalWellsCollections={totalWellsCollections}
			wellsCountLabel={
				<IconButton
					disabled={isLoadingTotalAndOverlap || !overlap}
					onClick={downloadWellsInfo}
					size='small'
					tooltipTitle='Download Overlapping Wells Information'
				>
					{faDownload}
				</IconButton>
			}
			sidebarBeforeWells={
				<div className={styles['merge-sidebar-block']} css='margin-top: -16px;'>
					<div className={classNames(styles['merge-sidebar-block-header'], styles.main)}>
						<Typography>Well Identifier</Typography>
						<Typography>Choose unique well identifier to map wells</Typography>
					</div>
					<Divider />
					<WellIdentifierSelect
						className={mergeProjectStyles['well-identifier-select']}
						value={model.wellIdentifier}
						onChange={onWellIdentifierChange}
						disabled={isLoadingTotalAndOverlap}
						label=''
					/>
				</div>
			}
			sidebarAdditionalInfo={
				<>
					<TextField
						css='margin-top: 16px;'
						className={styles['merged-name']}
						inputRef={duplicateNameModifierInputRef}
						error={!model.duplicateNameModifier || !!ambiguousSuffixOrPrefixText}
						label={`Duplicate name ${model.duplicateNamePart} *`}
						value={model.duplicateNameModifier}
						helperText={ambiguousSuffixOrPrefixText}
						onBlur={() => {
							onDuplicateNameModifierChange(model.duplicateNameModifier);
						}}
						onChange={(e) => onDuplicateNameModifierChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && model.duplicateNameModifier) {
								duplicateNameModifierInputRef.current?.blur();
								onDuplicateNameModifierChange(model.duplicateNameModifier);
								e.preventDefault();
							}
						}}
						variant='outlined'
					/>
					<RadioGroupField
						className={mergeProjectStyles['modifier-options']}
						value={model.duplicateNamePart}
						onChange={onDuplicateNamePartChange}
						options={DUPLICATE_NAME_PARTS}
						row
					/>
				</>
			}
			content={
				firstProjectData &&
				secondProjectData && (
					<div className={mergeProjectStyles['content-wrapper']}>
						<div className={mergeProjectStyles['merge-projects-header']}>
							<div>
								<Typography>Modules</Typography>
								<IconButton
									css={`
										margin-left: 5px;
									`}
									size='small'
									tooltipTitle='The list of module items with duplicate names between merging projects based on project prioritization'
								>
									{faInfoCircle}
								</IconButton>
								<Button
									css={!expandAllDisabled ? `color: ${theme.secondaryColor};` : undefined}
									className={mergeProjectStyles['toggle-all']}
									disabled={expandAllDisabled}
									onClick={() => expandModule()}
								>
									Expand all
								</Button>
								<Button
									css={!collapseAllDisabled ? `color: ${theme.secondaryColor};` : undefined}
									className={mergeProjectStyles['toggle-all']}
									disabled={collapseAllDisabled}
									onClick={() => collapseModule()}
								>
									Collapse all
								</Button>
							</div>
							<Button
								disabled={
									total > PROJECT_WELLS_LIMIT ||
									(totalWellsCollections &&
										totalWellsCollections > MAX_WELLS_COLLECTIONS_PER_MODULE) ||
									isMergeInProgress ||
									!model.name ||
									!model.duplicateNameModifier ||
									!!customHeadersWarning ||
									!!ambiguousSuffixOrPrefixText
								}
								color='secondary'
								variant='contained'
								onClick={mergeProjects}
							>
								Merge
							</Button>
						</div>
						<Divider className={mergeProjectStyles['content-header-divider']} />
						<div className={mergeProjectStyles['merge-projects-content']}>
							<Collisions
								firstProject={firstProject}
								secondProject={secondProject}
								collisions={collisions}
								modulesExpandState={modulesExpandState}
								duplicateNamePart={model.duplicateNamePart}
								duplicateNameModifier={model.duplicateNameModifier}
								expandModule={expandModule}
								collapseModule={collapseModule}
							/>
							{(firstProject?.customHeaders.length > 0 || secondProject?.customHeaders.length > 0) && (
								<MergeProjectCustomHeadersWorkspace
									expanded={modulesExpandState.customHeaders}
									onToggle={() =>
										modulesExpandState.customHeaders
											? collapseModule('customHeaders')
											: expandModule('customHeaders')
									}
									mergedModel={model}
									firstProject={firstProject}
									secondProject={secondProject}
									addCustomHeaders={addCustomHeaders}
									updateCustomHeader={updateCustomHeader}
									deleteCustomHeader={deleteCustomHeader}
									warning={customHeadersWarning}
								/>
							)}
						</div>
					</div>
				)
			}
		/>
	);
};

export default MergeProjects;
