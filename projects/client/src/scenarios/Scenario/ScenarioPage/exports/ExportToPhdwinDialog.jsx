import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useMergedState } from '@/components/hooks';
import { Button, CheckboxField, Divider, InfoIcon, SwitchField } from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { genericErrorAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

const phdwinGeneralInfoToolTip =
	'Use "Get General Info" to create the well data set in PHDWin and sync up the PHDWin ID between CC and PHDWin.  Once the PHDWin IDs are synced, assumptions can be easily exported from CC.  If PHDWin ID is already correct in CC, this step can be skipped and assumptions can be correctly exported.';

const phdwinIdentifierOptions = [
	{ value: 'phdwin_id', label: 'PHDWIN ID' },
	{ value: 'lease_number', label: 'Lease Number' },
];
const PHDWIN_ASSUMPTIONS_LABEL = {
	[AssumptionKey.pricing]: 'Pricing',
	[AssumptionKey.differentials]: 'Differentials',
	[AssumptionKey.expenses]: 'Expenses',
	[AssumptionKey.productionTaxes]: 'Production Taxes',
	[AssumptionKey.capex]: 'Capex',
	[AssumptionKey.ownershipReversion]: 'Ownership and Reversion',
	[AssumptionKey.forecast]: 'Forecast (includes NGL)',
	shrink_btu: 'Shrink and BTU',
};

const PHDWIN_USED_ASSUMPTIONS = [
	AssumptionKey.pricing,
	AssumptionKey.differentials,
	AssumptionKey.expenses,
	AssumptionKey.productionTaxes,
	AssumptionKey.capex,
	AssumptionKey.ownershipReversion,
	AssumptionKey.streamProperties,
	'shrink_btu',
	AssumptionKey.forecast,
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

const ExportToPhdwinDialog = ({ visible, scenarioId, scenarioName, selectedAssignmentIds, close }) => {
	const [assumptionOptions, setAssumptionOptions] = useState(null);
	const [columns, setColumns] = useMergedState({});
	const [disableAssumptions, setDisableAssumptions] = useState(false);
	const [phdwinIdentifierOption, setPhdwinIdentifierOption] = useState('phdwin_id');

	const loaded = !!assumptionOptions;

	const toggleSelect = (checked, assKey) => {
		const curColVal = columns[assKey];
		setColumns({ [assKey]: { ...curColVal, selected: checked } });
	};

	const exportPHDWIN = async () => {
		const body = {
			columns: disableAssumptions
				? [{ assumptionKey: 'general_info', assumptionName: 'General Info' }]
				: Object.values(columns)
						.filter((column) => column.selected)
						.map((column) => {
							const output = { ...column };
							delete output.selected;

							return output;
						}),
			scenarioName,
			selectedAssignmentIds,
			phdwinIdentifierOption,
		};
		close();

		try {
			await postApi(`/scenarios/${scenarioId}/exportToPhdwin`, body);
		} catch (error) {
			genericErrorAlert(error, 'Failed start export');
		}
	};

	useEffect(() => {
		const initDt = async () => {
			const initAssOptions = Object.entries(PHDWIN_ASSUMPTIONS_LABEL).reduce((arr, [key, value]) => {
				if (PHDWIN_USED_ASSUMPTIONS.includes(key)) {
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
					selected: false,
				};

				return {
					...obj,
					general_info: { assumptionKey: 'general_info', assumptionName: 'General Info', selected: false },
				};
			}, {});

			setAssumptionOptions(initAssOptions);
			setColumns(initColumns);
		};

		initDt();
	}, [setColumns]);

	const [allSelect, setAllSelect] = useState(false);

	const toggleAllSelect = (checked) => {
		const keys = Object.keys(columns).filter((key) => key !== 'general_info');
		const newColumns = {};
		keys.forEach((key) => {
			const curColVal = columns[key];
			newColumns[key] = { ...curColVal, selected: checked };
		});
		setAllSelect(checked);
		setColumns(newColumns);
	};

	const toggleGeneralInfoSelect = (checked, assKey) => {
		toggleSelect(checked, assKey);
		setDisableAssumptions(checked);
	};

	const noColumnSelected = () => {
		return !Object.keys(columns).some((key) => columns[key].selected);
	};

	const { openArticle } = useZoho();

	return (
		<Dialog open={visible} onClose={close} maxWidth='sm' fullWidth>
			<InstructionsBanner onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.ExportToPhdwin })}>
				PHDWin Export Guide
			</InstructionsBanner>
			<DialogTitle>Export Assumptions to PHDWIN</DialogTitle>
			<DialogContent>
				{loaded ? (
					<>
						<ColumnField>
							<FieldLabel css='font-size: 0.9rem; font-weight: bold'>
								Get General Info: <InfoIcon tooltipTitle={phdwinGeneralInfoToolTip} withLeftMargin />
							</FieldLabel>
							<SwitchField
								label=''
								labelPlacement='end'
								onChange={({ target }) => toggleGeneralInfoSelect(target.checked, 'general_info')}
								checked={columns?.general_info?.selected}
								value={columns?.general_info?.selected}
							/>
						</ColumnField>
						<Divider css='margin-bottom: 1rem' />
						<RadioGroupField
							name='phdwin-identifier'
							disabled={disableAssumptions}
							label='PHDWIN Identifier'
							tooltipTitle='Well Header used to match Well with assumption in PHDWIN'
							options={phdwinIdentifierOptions}
							value={phdwinIdentifierOption}
							onChange={({ target }) => setPhdwinIdentifierOption(target.value)}
							row
						/>
						<ColumnField>
							<FieldLabel>Select all assumptions:</FieldLabel>
							<ColumnCheckboxContainer>
								<CheckboxField
									disabled={disableAssumptions}
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
											disabled={disableAssumptions}
											label='Enabled?'
											labelPlacement='start'
											name={label}
											onChange={({ target }) => toggleSelect(target.checked, value)}
											value={columns?.[value]?.selected}
											checked={columns?.[value]?.selected}
										/>
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
				<Button
					onClick={exportPHDWIN}
					color='primary'
					disabled={noColumnSelected()}
					{...getTaggingProp('scenario', 'exportAssumptionsPhdwin')}
				>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export { ExportToPhdwinDialog };
