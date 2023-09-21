import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useMergedState } from '@/components/hooks';
import { Button, CheckboxField } from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { genericErrorAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
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
	justify-content: flex-end;
	width: 33%;
	.md-selection-control-label {
		span {
			margin-right: 0.5rem;
		}
	}
`;

const FieldLabel = styled.span`
	width: 33%;
`;

const fileTypeOptions = [
	{ value: 'excel', label: 'EXCEL' },
	{ value: 'csv', label: 'CSV' },
];

const ExportToCsvDialog = ({ visible, scenarioId, scenarioName, tableHeaders, selectedAssignmentIds, close }) => {
	const [assumptionOptions, setAssumptionOptions] = useState(null);
	const [columns, setColumns] = useMergedState({});
	const [fileType, setFileType] = useState('excel');

	const loaded = !!assumptionOptions;

	const toggleDefault = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, includeDefault: checked } });
	};

	const toggleSelect = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, selected: checked } });
	};

	const queryClient = useQueryClient();

	const exportCSV = async () => {
		const body = {
			columns: Object.values(columns)
				.filter((column) => column.selected)
				.map((column) => {
					const output = { ...column };
					delete output.selected;

					if (!USES_DEFAULT.includes(column.assumptionKey)) {
						delete output.includeDefault;
					}

					return output;
				}),
			fileType,
			scenarioName,
			tableHeaders,
			selectedAssignmentIds,
		};

		try {
			await queryClient.fetchQuery(['scenario', 'export', 'csv', body], () => {
				postApi(`/scenarios/${scenarioId}/exportToCSV`, body);
			});
			close();
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	// componentDidMount
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
		<Dialog open={visible} onClose={close} maxWidth='sm' fullWidth>
			<DialogTitle>Mass Export Assumptions</DialogTitle>
			<DialogContent>
				{loaded ? (
					<>
						<RadioGroupField
							label='Export file type'
							options={fileTypeOptions}
							onChange={(e) => setFileType(e.target.value)}
							value={fileType}
							row
						/>
						<ColumnField>
							<FieldLabel>Select All:</FieldLabel>
							<ColumnCheckboxContainer>
								<CheckboxField
									label='Enabled?'
									labelPlacement='start'
									onChange={({ target }) => toggleAllSelect(target.checked)}
									checked={allSelect}
									value={allSelect}
								/>
							</ColumnCheckboxContainer>
							<ColumnCheckboxContainer>{null}</ColumnCheckboxContainer>
						</ColumnField>
						{assumptionOptions.map((assumption) => {
							const { label, value } = assumption;
							return (
								<ColumnField key={value}>
									<FieldLabel>{`${label}:`}</FieldLabel>

									<ColumnCheckboxContainer>
										<CheckboxField
											id={`selected-column__${value}`}
											label='Enabled?'
											labelPlacement='start'
											name={label}
											onChange={({ target }) => toggleSelect(target.checked, value)}
											value={columns?.[value]?.selected}
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
												value={columns?.[value]?.includeDefault}
												checked={columns?.[value]?.includeDefault}
											/>
										)}
									</ColumnCheckboxContainer>
								</ColumnField>
							);
						})}
					</>
				) : (
					<Placeholder loading loadText='Loading...' />
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={close}>Close</Button>
				<Button onClick={exportCSV} color='primary' {...getTaggingProp('scenario', 'massExportAssumptions')}>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export { ExportToCsvDialog, USES_DEFAULT };
