import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Placeholder } from '@/components';
import { useMergedState } from '@/components/hooks';
import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { failureAlert, infoAlert, withAsync } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { downloadFile, postApi } from '@/helpers/routing';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';

// assumption keys associated with this form, also keeps track of the order of the assumptions;
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
	AssumptionKey.escalation,
	AssumptionKey.fluidModel,
	AssumptionKey.emission,
];

const USES_DEFAULT = [
	AssumptionKey.streamProperties,
	AssumptionKey.expenses,
	AssumptionKey.pricing,
	AssumptionKey.differentials,
	AssumptionKey.productionTaxes,
];

const ColumnField = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
`;

const ColumnCheckboxContainer = styled.div`
	display: flex;
	width: 33%;

	.md-selection-control-label {
		span {
			margin-right: 0.5rem;
		}
	}
`;

const FieldLabel = styled.span`
	width: 40%;
`;

// disableExport={(value) => SetState({ disableExportCSV: value })} // TODO find out why is this needed
// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
const ExportToCsvDialog = ({ close, onHide = close, visible, disableExport = () => {} }) => {
	const [assumptionOptions, setAssumptionOptions] = useState(null);
	const [columns, setColumns] = useMergedState({});
	const { project } = useAlfa();

	const loaded = !!assumptionOptions;

	const toggleDefault = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, includeDefault: checked } });
	};

	const toggleSelect = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, selected: checked } });
	};

	async function exportModels() {
		const body = {
			projectId: project._id,
			columns: Object.values(columns)
				.filter(({ selected }) => selected)
				.map(({ assumptionKey, assumptionName, includeDefault }) => ({
					assumptionKey,
					assumptionName,
					...(USES_DEFAULT.includes(assumptionKey) ? { includeDefault } : {}),
				})),
		};

		onHide();
		disableExport(true);
		const { success, file_id: fileId, message } = await withAsync(postApi(`/cost-model/modelsExport`, body));

		if (success) {
			downloadFile(fileId);
			infoAlert(message);
		} else {
			failureAlert(message);
		}
		disableExport(false);
	}

	useEffect(() => {
		const initDt = async () => {
			const initAssOptions = Object.entries(ASSUMPTION_LABELS).reduce((arr, [key, value]) => {
				if (USED_ASSUMPTIONS.includes(key)) {
					arr.push({
						label: value,
						value: key,
					});
				}

				return arr;
			}, []);

			const initColumns = initAssOptions.reduce((_obj, column) => {
				const obj = _obj;

				const { label, value } = column;
				obj[value] = {
					assumptionKey: value,
					assumptionName: label,
					includeDefault: false,
					selected: true,
				};

				return obj;
			}, {});

			setAssumptionOptions(initAssOptions);
			setColumns(initColumns);
		};

		initDt();
	}, [setColumns]);

	const [allSelect, setAllSelect] = useState(true);

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

	return (
		<Dialog
			id='export-to-csv-dialog'
			aria-labelledby='export-to-csv-dialog'
			onClose={onHide}
			open={visible}
			maxWidth='md'
			fullWidth
		>
			<DialogTitle>Export Econ Models To CSV</DialogTitle>
			<DialogContent>
				<ColumnField>
					<FieldLabel>Select All:</FieldLabel>
					<ColumnCheckboxContainer>
						<CheckboxField
							labelPlacement='start'
							onChange={({ target }) => toggleAllSelect(target.checked)}
							checked={allSelect}
							value={allSelect}
						/>
					</ColumnCheckboxContainer>
					<ColumnCheckboxContainer>{null}</ColumnCheckboxContainer>
				</ColumnField>
			</DialogContent>
			<DialogContent>
				{loaded ? (
					assumptionOptions.map((assumption) => {
						const { label, value } = assumption;
						return (
							<ColumnField key={value}>
								<FieldLabel>{label}:</FieldLabel>
								<ColumnCheckboxContainer>
									<CheckboxField
										id={`selected-column__${value}`}
										labelPlacement='start'
										name={label}
										onChange={({ target }) => toggleSelect(target.checked, value)}
										checked={columns?.[value]?.selected}
									/>
								</ColumnCheckboxContainer>

								<ColumnCheckboxContainer>
									{USES_DEFAULT.includes(value) && (
										<CheckboxField
											id={`use-default__${value}`}
											disabled={!columns?.[value]?.selected}
											label='Include Default?'
											labelPlacement='start'
											name={label}
											onChange={({ target }) => toggleDefault(target.checked, value)}
											checked={columns?.[value]?.includeDefault}
										/>
									)}
								</ColumnCheckboxContainer>
							</ColumnField>
						);
					})
				) : (
					<Placeholder loading loadText='Loading...' />
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Close</Button>
				<Button color='primary' onClick={exportModels}>
					Export CSV
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export { ExportToCsvDialog, USES_DEFAULT };
