import { useContext, useEffect, useRef, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { AgGridRef } from '@/components/AgGrid';
import { useHotkey } from '@/components/hooks';
import { useDraggingResize } from '@/components/hooks/useDraggingResize';
import { Button, Divider } from '@/components/v2';
import { ActivityStep, Resource } from '@/inpt-shared/scheduling/shared';
import { CardsLayoutContext } from '@/layouts/CardsLayout';

import { MAX_ACTIVITY_STEPS } from '../../hooks/useScheduleSettingsForm';
import { ADD_ROW_SHORTCUT, REMOVE_SELECTED_ROWS_SHORTCUT, SCOPES } from '../../shared/hotkeys';
import { useSchedulingFormContext } from '../shared/FormContext';
import { GridActionButtons } from '../shared/GridActionButtons';
import { createActivityStep } from '../shared/helpers';
import { MemoizedActivityStepsGrid } from './ActivityStepsGrid';
import { DiagramComponent } from './Diagram/DiagramComponent';
import { ButtonsContainer } from './styles';

export function ScheduleSettingActivitySteps({ hasCyclicSteps, enableDiagram }) {
	const agGridRef = useRef<AgGridRef>(null);
	const [selectedRows, setSelectedRows] = useState<ActivityStep[]>([]);

	const [showDiagram, setShowDiagram] = useState(enableDiagram);
	const { maximized } = useContext(CardsLayoutContext);

	const {
		setValue,
		watch,
		formState: { errors },
	} = useSchedulingFormContext();
	const [activitySteps, resources] = watch(['activitySteps', 'resources']);

	const addButtonDisabled = (() => {
		if (activitySteps.length >= MAX_ACTIVITY_STEPS) return `Maximum of ${MAX_ACTIVITY_STEPS} steps reached.`;
		if (errors.activitySteps && errors.activitySteps.message) return errors.activitySteps.message.toString();
	})();

	const handleCreateStep = () => {
		if (addButtonDisabled) return;

		const highestIndex = activitySteps.reduce((prev, current) => {
			return prev > current.stepIdx ? prev : current.stepIdx;
		}, 0);

		const newStep = createActivityStep(highestIndex);
		setValue('activitySteps', [...activitySteps, newStep], { shouldValidate: true });
	};

	useHotkey(ADD_ROW_SHORTCUT, SCOPES.activitySteps, (e) => {
		e.preventDefault();
		handleCreateStep();
	});

	const handleRemoveStep = () => {
		const selectedStepIdx = selectedRows.map((row) => row.stepIdx);
		const filteredSteps = activitySteps.filter((value: ActivityStep) => !selectedStepIdx.includes(value.stepIdx));
		const updatedPreviousSteps = filteredSteps.map((step: ActivityStep) => {
			return {
				...step,
				previousStepIdx: step.previousStepIdx.filter((previousStep) => !selectedStepIdx.includes(previousStep)),
			};
		});
		const updatedResources = resources.map((resource: Resource) => {
			const stepIdx = resource.stepIdx.filter((stepIdx) => !selectedStepIdx.includes(stepIdx));
			const active = Boolean(stepIdx.length);

			return {
				...resource,
				stepIdx,
				active,
			};
		});

		setSelectedRows([]);
		setValue('activitySteps', updatedPreviousSteps, { shouldValidate: true });
		setValue('resources', updatedResources, { shouldValidate: true });
	};

	useHotkey(REMOVE_SELECTED_ROWS_SHORTCUT, SCOPES.activitySteps, (e) => {
		e.preventDefault();
		handleRemoveStep();
	});

	const { dividerRef, boxARef, wrapperRef } = useDraggingResize({ minSize: 150 });

	useEffect(() => {
		if (showDiagram) {
			boxARef.current.style.height = '70%';
			boxARef.current.style.flexGrow = 0;
		} else {
			boxARef.current.style.height = '100%';
			boxARef.current.style.flexGrow = 1;
		}
	}, [boxARef, showDiagram, maximized]);

	return (
		<div
			ref={wrapperRef}
			css={`
				display: flex;
				flex-direction: column;
				height: 100%;
			`}
		>
			<div
				ref={boxARef}
				css={`
					display: flex;
					flex-direction: column;
					flex: 1 1 auto;
				`}
			>
				<ButtonsContainer>
					<GridActionButtons
						name='Activity Steps'
						addButtonDisabled={addButtonDisabled}
						hasSelectedRows={Boolean(selectedRows.length)}
						addButtonText='Step'
						addFunction={handleCreateStep}
						deleteFunction={handleRemoveStep}
						addButtonTaggingProps={getTaggingProp('schedule', 'addStep')}
					/>
					{enableDiagram && (
						<Button
							variant='text'
							color='secondary'
							onClick={() => setShowDiagram((prevState) => !prevState)}
						>
							{showDiagram ? 'Hide Diagram' : 'Show Diagram'}
						</Button>
					)}
				</ButtonsContainer>

				<MemoizedActivityStepsGrid agGridRef={agGridRef} setSelectedRows={setSelectedRows} />
			</div>

			{showDiagram && (
				<>
					<div
						ref={dividerRef}
						css={`
							cursor: ns-resize;
							padding: 1rem 0rem;
						`}
					>
						<Divider orientation='horizontal' />
					</div>
					<div
						css={`
							display: flex;
							flex-direction: column;
							flex: 1 1 auto;
						`}
					>
						<DiagramComponent values={activitySteps} hasCyclicSteps={hasCyclicSteps} />
					</div>
				</>
			)}
		</div>
	);
}
