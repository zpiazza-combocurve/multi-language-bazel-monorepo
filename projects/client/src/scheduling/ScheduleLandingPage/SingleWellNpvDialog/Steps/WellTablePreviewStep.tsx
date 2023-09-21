import { faDownload } from '@fortawesome/pro-regular-svg-icons';

import { IconButton } from '@/components/v2';
import { WELL_HEADER_COLUMNS } from '@/scheduling/shared/columns';

import { PreviewTableGrid } from '../../WellTable/PreviewTable';
import { NpvRenderer } from '../../components/AgGrid/Renderers/NpvRenderer';
import { SkeletonRenderer } from '../../components/AgGrid/Renderers/SkeletonRenderer';
import { STATE, STEPS } from '../NpvStepper';

export const WellTablePreviewStep = ({
	agGridRef,
	scheduleId,
	activeStep,
	state,
	wellIds,
	filters,
	setHeaderFilters,
	previewData,
	currentSort,
	setCurrentSort,
}) => {
	const isOnPreviewStep = activeStep === STEPS.WELL_TABLE_PREVIEW;

	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
			`}
		>
			{isOnPreviewStep && (
				<IconButton
					css={`
						margin-top: -2.2rem;
						margin-bottom: 0.3rem;
						align-self: flex-end;
					`}
					onClick={() => {
						agGridRef.current?.exportDataAsExcel();
					}}
					size='small'
				>
					{faDownload}
				</IconButton>
			)}
			<PreviewTableGrid
				css={`
					height: 380px;
					min-width: 1020px;
					width: 100%;

					opacity: ${state === STATE.CALCULATING || isOnPreviewStep ? 1 : 0.2};
					pointer-events: ${state === STATE.CALCULATING || isOnPreviewStep ? 'unset' : 'none'};
				`}
				agGridRef={agGridRef}
				scheduleId={scheduleId}
				currentSort={currentSort}
				setCurrentSort={setCurrentSort}
				columns={[
					{
						key: 'priority',
						title: 'Priority',
						width: 130,
						frozen: true,
						pinned: 'left',
					},
					{
						key: 'npv',
						title: 'NPV',
						width: 150,
						frozen: true,
						cellRenderer: state === STATE.CALCULATING ? SkeletonRenderer : NpvRenderer,
					},
					...WELL_HEADER_COLUMNS,
				]}
				wellIds={wellIds}
				filters={filters}
				setHeaderFilters={setHeaderFilters}
				previewData={previewData}
			/>
		</div>
	);
};
