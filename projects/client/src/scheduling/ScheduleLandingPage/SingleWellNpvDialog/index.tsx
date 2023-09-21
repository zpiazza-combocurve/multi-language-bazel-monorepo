import { useTheme } from '@material-ui/core';
import { random } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AgGridSSRMRef } from '@/components/AgGrid.ssrm';
import { Button } from '@/components/v2';
import { customErrorAlert } from '@/helpers/alerts';

import { usePreviewFilteredWells } from '../../hooks/useFilteredWells';
import { AssignmentsApi } from '../WellTable/api/AssignmentsApi';
import { NpvApi } from '../api/NpvApi';
import { GenericDialog } from '../components/GenericDialog/GenericDialog';
import { NpvStepper, STATE, STEPS } from './NpvStepper';
import { DefineParametersStep } from './Steps/DefineParametersStep';
import { WellTablePreviewStep } from './Steps/WellTablePreviewStep';

type SingleWellNpvContentProps = {
	visible: boolean;
	onHide: () => void;
	scheduleId: Inpt.ObjectId;
	scheduleName: string;
	wellIds: string[];
	updateAssignments: (wellIds?: string[], headers?: string[]) => void;
	setMainCurrentSort: (sort: { field: string; direction: 'desc' | 'asc' }) => void;
};

export const SingleWellNpvDialog = ({
	visible,
	onHide,
	scheduleId,
	wellIds,
	updateAssignments,
	setMainCurrentSort,
}: SingleWellNpvContentProps) => {
	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);
	const npvApi = useMemo(() => new NpvApi(scheduleId), [scheduleId]);

	const theme = useTheme();
	const agGridRef = useRef<AgGridSSRMRef>(null);

	const [activeStep, setActiveStep] = useState(STEPS.DEFINE_PARAMETERS);
	const [state, setState] = useState<STATE>(STATE.LOADING);

	const [npvData, setNpvData] = useState<{ [key: string]: { npv: number; priority: number } }>({});
	const [validationErrors, setValidationErrors] = useState<{
		total?: number;
		validations: { missing?: number; model?: string; details?: string }[];
	}>({ validations: [] });

	const [currentSort, setCurrentSort] = useState<{ field: string; direction: 'desc' | 'asc' }>({
		field: 'priority',
		direction: 'asc',
	});

	const { filters, setHeaderFilters, filteredWellIds, nonProducingWells } = usePreviewFilteredWells(
		scheduleId,
		wellIds,
		currentSort,
		npvData
	);

	useEffect(() => {
		if (nonProducingWells?.length === 0) {
			setValidationErrors({ validations: [{ details: 'Selected wells are producing' }] });
			setState(STATE.LOCKED);
		} else if (filteredWellIds?.length) {
			setState(STATE.UNLOCKED);
		}
	}, [filteredWellIds, nonProducingWells]);

	const handleNext = async () => {
		setValidationErrors({ total: 0, validations: [] });
		setState(STATE.CALCULATING);

		try {
			const validation = await npvApi.validate({ wellIds: nonProducingWells as string[] });
			const hasError = validation.validations.length > 0;
			if (hasError) {
				setState(STATE.LOCKED);
				setValidationErrors(validation);
			} else {
				setState(STATE.UNLOCKED);
				setActiveStep(STEPS.WELL_TABLE_PREVIEW);

				// Temporary random data that will be fetched from the API
				const randomNpvData = filteredWellIds.reduce((acc, well) => {
					acc[well] = { well, npv: random(0, 100) };
					return acc;
				}, {});

				const sortedItems = Object.values(randomNpvData).sort((a, b) => {
					return (a as { npv: number }).npv - (b as { npv: number }).npv;
				});

				sortedItems.forEach((item, index) => {
					const { well } = item as { well: string };
					randomNpvData[well].priority = index + 1;
				});

				setNpvData(randomNpvData);

				agGridRef.current?.updateRows(
					Object.keys(randomNpvData).map((well) => ({ _id: well, ...randomNpvData[well] }))
				);
				setCurrentSort({ field: 'priority', direction: 'asc' });
			}
		} catch (ex) {
			setState(STATE.UNLOCKED);
			customErrorAlert();
		}
	};

	const handleApply = async () => {
		const promises = [
			assignmentsApi.updateMany({
				column: 'priority',
				values: Object.keys(npvData).map((well) => ({
					well: well as Inpt.ObjectId,
					value: npvData[well].priority,
				})),
			}),
			assignmentsApi.updateMany({
				column: 'npv',
				values: Object.keys(npvData).map((well) => ({ well: well as Inpt.ObjectId, value: npvData[well].npv })),
			}),
		];

		onHide();

		await Promise.all(promises);

		updateAssignments(filteredWellIds, ['npv', 'priority']);
		setMainCurrentSort({ field: 'priority', direction: 'asc' });
	};

	return (
		<GenericDialog
			title='Configurations'
			visible={visible}
			onHide={onHide}
			maxWidth='xl'
			actions={
				<>
					<Button variant='text' color='secondary' onClick={onHide}>
						Cancel
					</Button>
					<Button
						variant='contained'
						color='secondary'
						onClick={handleApply}
						disabled={activeStep === STEPS.DEFINE_PARAMETERS}
						style={{ color: theme.palette.background.default }}
					>
						Apply
					</Button>
				</>
			}
		>
			<NpvStepper
				activeStep={activeStep}
				hasValidationErrors={Boolean(validationErrors.validations.length)}
				steps={[
					{
						key: 'define-parameters',
						stepIndex: STEPS.DEFINE_PARAMETERS,
						label: 'Define Parameters',
						content: (
							<DefineParametersStep
								state={state}
								handleNext={handleNext}
								validationErrors={validationErrors}
							/>
						),
					},
					{
						key: 'well-table-preview',
						stepIndex: STEPS.WELL_TABLE_PREVIEW,
						label: 'Well Table Preview',
						content: (
							<WellTablePreviewStep
								agGridRef={agGridRef}
								scheduleId={scheduleId}
								state={state}
								activeStep={activeStep}
								wellIds={filteredWellIds}
								filters={filters}
								setHeaderFilters={setHeaderFilters}
								previewData={npvData}
								currentSort={currentSort}
								setCurrentSort={setCurrentSort}
							/>
						),
					},
				]}
			/>
		</GenericDialog>
	);
};
