import { faCompress, faDownload, faExpand } from '@fortawesome/pro-regular-svg-icons';
import { Dispatch, RefObject, SetStateAction } from 'react';

import { Divider, IconButton } from '@/components/v2';
import { InfoIcon, SelectField } from '@/components/v2/misc';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { PhaseSelectField, PhaseWellCountLabel } from '@/type-curves/TypeCurveIndex/shared/components';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';

import {
	NormalizationViewerOptions,
	ViewerOptions,
	ViewerType,
	chartViewerTypeMenuItems,
	normalizationChartViewerTypeMenuItems,
} from '../graphProperties';
import ViewerSettings, { useViewerSettings } from './ViewerSettings';
import { TitleContainer } from './layout';

function ViewerTitle({
	maximized,
	multipliersTableRef,
	normRepCount,
	phase,
	resolution,
	setPhase,
	settingsProps,
	setViewerOption,
	toggleMaximized,
	typeCurveId,
	viewerOption,
	viewerType,
	wellCount,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	maximized: any;
	multipliersTableRef: RefObject<{ handleDownload(): void }>;
	normRepCount: number;
	phase: Phase;
	resolution: FitResolution;
	setPhase: Dispatch<SetStateAction<Phase>>;
	settingsProps: Omit<ReturnType<typeof useViewerSettings>, 'viewerOption' | 'viewerType'>;
	setViewerOption: Dispatch<SetStateAction<string>>;
	toggleMaximized: () => void;
	typeCurveId: string;
	viewerOption: ViewerOptions | NormalizationViewerOptions;
	viewerType: ViewerType;
	wellCount: number;
}) {
	const viewerMenuItems = viewerType === 'default' ? chartViewerTypeMenuItems : normalizationChartViewerTypeMenuItems;
	return (
		<ForecastToolbarTheme>
			<TitleContainer>
				<div
					css={`
						align-items: center;
						column-gap: 0.75rem;
						display: flex;
					`}
				>
					<ViewerSettings
						resolution={resolution}
						viewerOption={viewerOption}
						viewerType={viewerType}
						{...settingsProps}
					/>

					<SelectField
						menuItems={viewerMenuItems}
						onChange={(ev) => setViewerOption(ev.target.value as string)}
						size='small'
						value={viewerOption}
						variant='outlined'
					/>

					{viewerOption === 'normalizationMultipliersTable' && (
						<>
							<InfoIcon tooltipTitle='If a "Normalization Type" is selected and ran, the "Multiplier" column can be edited on a well by well basis' />

							<IconButton
								onClick={() => multipliersTableRef?.current?.handleDownload?.()}
								size='small'
								tooltipTitle='Download Multipliers'
							>
								{faDownload}
							</IconButton>
						</>
					)}
				</div>

				<div
					css={`
						align-items: center;
						column-gap: 0.25rem;
						display: flex;
					`}
				>
					{!['threePhaseFit', 'paramsTable'].includes(viewerOption) && (
						<>
							<PhaseWellCountLabel
								count={wellCount}
								enableLabel
								normRepCount={normRepCount}
								phase={phase}
								typeCurveId={typeCurveId}
								viewerOption={viewerOption}
							/>

							<PhaseSelectField phase={phase} setPhase={setPhase} />
						</>
					)}

					<Divider orientation='vertical' flexItem />

					<IconButton onClick={toggleMaximized} size='small'>
						{maximized ? faCompress : faExpand}
					</IconButton>
				</div>
			</TitleContainer>
		</ForecastToolbarTheme>
	);
}

export default ViewerTitle;
