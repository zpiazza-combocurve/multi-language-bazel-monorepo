import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { FileUpload } from '@/components/FileUpload';
import { useMergedState } from '@/components/hooks';
import { Box, Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { handleBackdropClose } from '@/helpers/dialog';
import { FileType } from '@/helpers/fileHelper';
import { uploadFiles } from '@/helpers/files-upload';
import { postApi } from '@/helpers/routing';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { TaskStatus } from '@/notifications/notification';
import { useCurrentProject } from '@/projects/api';

interface IAssumption {
	assumptionKey: string;
	assumptionName: string;
	newQualifier: boolean;
	selected: boolean;
	allUnique: boolean;
}

const USED_ASSUMPTIONS = [
	AssumptionKey.reservesCategory,
	AssumptionKey.ownershipReversion,
	AssumptionKey.dates,
	AssumptionKey.capex,
	AssumptionKey.streamProperties,
	AssumptionKey.expenses,
	AssumptionKey.pricing,
	AssumptionKey.differentials,
	AssumptionKey.productionTaxes,
	AssumptionKey.risking,
	AssumptionKey.emission,
];

const acceptable = new Set(['.xls', '.xlsx']);

const acceptableFileTypeNames = new Set(['Excel']);

const sheetNameTooltip = 'Excel sheet names must be the same as assumptions names';

const ColumnField = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
`;

const StyledCheckboxField = styled(CheckboxField)`
	& .MuiFormControlLabel-label {
		font-size: unset;
	}
`;

export const MassImportDialog = ({
	visible,
	scenarioId,
	close,
	setCallback,
	handleChangeQualifier,
	buildCurrent,
	refetch,
}) => {
	const { project } = useCurrentProject();
	const [assumptionOptions, setAssumptionOptions] = useState<Record<string, string>[]>();
	const [allSelect, setAllSelect] = useState(true);
	const [allUnique, setAllUnique] = useState(false);
	const [allQualifier, setAllQualifier] = useState(false);
	const [columns, setColumns] = useMergedState({});
	const [uploadedFile, setFile] = useState<FileType>();
	const [invalidFileType, setInvalidFileType] = useState(true);

	const onClose = () => {
		close();
		setFile(undefined);
	};

	useEffect(() => {
		if (uploadedFile) {
			let invalid = false;
			if (uploadedFile.extensionError) {
				invalid = true;
			}
			setInvalidFileType(invalid);
		}
	}, [uploadedFile]);

	useEffect(() => {
		const initDt = async () => {
			const initAssOptions = Object.entries(ASSUMPTION_LABELS).reduce(
				(arr: Record<string, string>[], [key, value]) => {
					if (USED_ASSUMPTIONS.includes(key as AssumptionKey)) {
						arr.push({
							label: value,
							value: key,
						});
					}

					return arr;
				},
				[]
			);

			const initColumns = initAssOptions.reduce((_obj, column) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const obj: any = _obj;

				const { label, value } = column;
				obj[value] = {
					assumptionKey: value,
					assumptionName: label,
					newQualifier: false,
					selected: true,
					allUnique: false,
				};

				return obj;
			}, {});

			setAssumptionOptions(initAssOptions);
			setColumns(initColumns);
		};

		initDt();
	}, [setColumns]);

	const toggleSelect = (checked, assKey) => {
		const curColVal = columns[assKey];
		let allUnique = curColVal.allUnique;
		let newQualifier = curColVal.newQualifier;
		if (!checked) {
			allUnique = false;
			newQualifier = false;
		}
		setColumns({ [assKey]: { ...curColVal, selected: checked, allUnique, newQualifier } });
	};

	const toggleUnique = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, allUnique: checked } });
	};

	const toggleQualifier = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, newQualifier: checked } });
	};

	const toggleAllSelect = (checked) => {
		const keys = Object.keys(columns);
		const newColumns = {};
		keys.forEach((key) => {
			const curColVal = columns[key];
			newColumns[key] = { ...curColVal, selected: checked };
		});
		setAllSelect(checked);
		setColumns(newColumns);
	};

	const toggleAllQualifier = (checked) => {
		const keys = Object.keys(columns);
		const newColumns = {};
		keys.forEach((key) => {
			const curColVal = columns[key];
			if (columns[key].selected) {
				newColumns[key] = { ...curColVal, newQualifier: checked };
			}
		});
		setAllQualifier(checked);
		setColumns(newColumns);
	};

	const toggleAllUnique = (checked) => {
		const keys = Object.keys(columns);
		const newColumns = {};
		keys.forEach((key) => {
			const curColVal = columns[key];
			if (columns[key].selected) {
				newColumns[key] = { ...curColVal, allUnique: checked };
			}
		});
		setAllUnique(checked);
		setColumns(newColumns);
	};

	const startImport = () => {
		if (!uploadedFile) {
			return;
		}

		uploadFiles({
			files: [uploadedFile],
			removeOnComplete: true,
			project: project?._id,
			onSuccess: async ({ saved }) => {
				const fileId = saved[0]._id;

				const importScenarioNotificationNewCallback = () => (notification) => {
					if (
						notification.status === TaskStatus.COMPLETED &&
						notification.extra?.body?.scenarioId === scenarioId &&
						notification.extra?.body?.fileId === fileId
					) {
						const assumptions = (Object.values(columns) as IAssumption[]).filter(
							(assumption) => assumption?.selected
						);
						// used to find last assumption in order to show very last assumption with new qualifier
						// has updated.
						const assumptionsWithNewQualifier = assumptions.filter((a) => a.newQualifier);
						const lastAssumptionWithNewQualifier =
							assumptionsWithNewQualifier.length > 0
								? assumptionsWithNewQualifier[assumptionsWithNewQualifier.length - 1]
								: undefined;

						assumptions.forEach((assumption) => {
							if (assumption.newQualifier) {
								const shouldConfirm =
									assumption.assumptionKey === lastAssumptionWithNewQualifier?.assumptionKey;
								const foundAssumption = notification.extra.body.assumptions.find((a) => {
									return a.assumptionKey === assumption.assumptionKey;
								});
								handleChangeQualifier(
									assumption.assumptionKey,
									foundAssumption.qualifierKey,
									shouldConfirm
								);
							} else {
								buildCurrent();
							}
						});
					}
				};

				setCallback(importScenarioNotificationNewCallback);

				postApi(`/scenarios/${scenarioId}/massAssumptionImport`, {
					fileId,
					scenarioId,
					assumptions: Object.values(columns),
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				})
					.then(() => {
						close();
						refetch();
						setFile(undefined);
					})
					.catch((error) => {
						genericErrorAlert(error);
					});
			},
			onFailure: (e) => {
				genericErrorAlert({ ...e, name: '' });
				return false;
			},
		});
	};

	return (
		<Dialog
			open={visible}
			onClose={(event, reason) => handleBackdropClose(event, reason, onClose)}
			maxWidth='md'
			fullWidth
		>
			<DialogTitle>Mass Import Assumptions</DialogTitle>
			<DialogContent>
				<FileUpload
					acceptableFileType={acceptable}
					acceptableFileTypeNames={acceptableFileTypeNames}
					sheetNameTooltip={sheetNameTooltip}
					onUpload={(file: FileType) => setFile(file)}
				/>
				<Box sx={{ borderBottom: '1px solid' }}>
					<ColumnField key='mass-select-assumptions'>
						<StyledCheckboxField
							css={{ flex: 2 }}
							id='selected-column__all-assumptions'
							labelPlacement='end'
							name='Assumptions'
							label='Assumptions'
							onChange={({ target }) => toggleAllSelect(target.checked)}
							checked={allSelect}
							value={allSelect}
						/>
						<StyledCheckboxField
							css={{ flex: 1 }}
							id='new-qualifiers__all-qualifiers'
							labelPlacement='end'
							name='all-new-qualifiers'
							label='New Qualifiers'
							onChange={({ target }) => toggleAllQualifier(target.checked)}
							checked={allQualifier}
							value={allQualifier}
						/>
						<StyledCheckboxField
							css={{ flex: 1, justifyContent: 'flex-start' }}
							id='generate-unique_all-unique'
							labelPlacement='end'
							name='all-generate-unique'
							label='Generate All as Unique'
							onChange={({ target }) => toggleAllUnique(target.checked)}
							checked={allUnique}
							value={allUnique}
						/>
					</ColumnField>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column' }}>
					{assumptionOptions &&
						assumptionOptions.map((assumption) => {
							const { label, value } = assumption;
							return (
								<ColumnField key={value}>
									<StyledCheckboxField
										css={{ flex: 2 }}
										id={`selected-column__${value}`}
										labelPlacement='end'
										name={label}
										label={label}
										onChange={({ target }) => toggleSelect(target.checked, value)}
										value={columns?.[value]?.selected}
										checked={columns?.[value]?.selected}
									/>
									<StyledCheckboxField
										css={{ flex: 1 }}
										id={`new-qualifiers__${value}`}
										labelPlacement='end'
										name={`${label}-new-qualifiers`}
										label='Select'
										onChange={({ target }) => toggleQualifier(target.checked, value)}
										checked={columns?.[value]?.newQualifier}
										disabled={!columns?.[value]?.selected}
										value={columns?.[value]?.newQualifier}
									/>
									<StyledCheckboxField
										css={{ flex: 1, justifyContent: 'flex-start' }}
										id={`generate-unique__${value}`}
										labelPlacement='end'
										name={`${label}-generate-unique`}
										label='Select'
										onChange={({ target }) => toggleUnique(target.checked, value)}
										checked={columns?.[value]?.allUnique}
										disabled={!columns?.[value]?.selected}
										value={columns?.[value]?.allUnique}
									/>
								</ColumnField>
							);
						})}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
				<Button
					onClick={startImport}
					color='secondary'
					disabled={!uploadedFile || (!!uploadedFile && invalidFileType)}
					{...getTaggingProp('scenario', 'massImportAssumptions')}
				>
					Import
				</Button>
			</DialogActions>
		</Dialog>
	);
};
