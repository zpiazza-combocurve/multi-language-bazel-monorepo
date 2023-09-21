/* eslint react/jsx-key: warn */
import { faExclamation } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash-es';
import { useMemo, useRef } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { PlotZingchart } from '@/components/PlotZingchart';
import { useDerivedState } from '@/components/hooks';
import { Checkbox, IconButton, alerts } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { WarningContainer } from '@/forecasts/charts/components/gridChartLayout';
import { getProbXBoundaries } from '@/forecasts/charts/components/helpers';
import { ProbabilisticDownloadButton } from '@/forecasts/download-forecast/ProbabilisticDownload';
import PhaseStatusButtons from '@/forecasts/shared/PhaseStatusButtons';
import { confirmationAlert, genericErrorAlert, withAsync } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { genLegendConfig, genScaleX, genScaleY, phases } from '@/helpers/zing';
import { Card } from '@/layouts/CardsLayout';
import { useCurrentProject } from '@/projects/api';
import WellCommentButton from '@/well-comments/WellCommentButton';

import { ForecastSeries, ProductionSeries, phaseYLabels } from '../config';
import { ChartTitleText, ProbabilisticChartSubheader } from './ChartTitle';

import './forecastChartStyles.scss';

const GenLabelsContainer = styled.div`
	align-items: center;
	display: flex;
`;

function SimplePhaseChart({
	enableDownload = true,
	enableLabels = false,
	getChartOptions = _.noop,
	graphSettings,
	phase = 'oil',
	prodFreq,
	selectable = true,
	selected,
	showLoadStatus = false,
	toggleManualSelect,
	well: curWell,
}) {
	const { project } = useCurrentProject();
	const { canUpdate: canRemoveWarning } = usePermissions(SUBJECTS.Forecasts, project?._id);

	const [well, setWell] = useDerivedState(curWell);
	const wellProduction = useMemo(() => well?.[prodFreq], [prodFreq, well]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const zingRef = useRef<any>(null);

	const {
		allPName,
		chartResolution,
		enableLegend,
		lineScatter,
		logScale,
		sNames,
		xLogScale,
		yearsBefore,
		yearsPast,
		yMin,
	} = graphSettings;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { mutateAsync: openWarningPopup } = useMutation(async (message: any) => {
		const {
			forecastId,
			headers: { _id },
		} = well;

		try {
			const acknowledged = await alerts.confirm({
				confirmText: 'Acknowledge?',
				confirmColor: 'warning',
				children: message,
				title: 'Forecast Warning',
				hideConfirmButton: !canRemoveWarning,
			});

			if (!acknowledged) {
				return;
			}

			const { message: resultMessage } = await withAsync(
				putApi(`/forecast/${forecastId}/acknowledgeWarning/${_id}`, {
					phase: phase === 'all' ? VALID_PHASES : [phase],
				})
			);

			setWell(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((draft: any) => {
					if (phase === 'all') {
						phases.forEach(({ value }) => {
							draft.data[value].warning = { ...draft.data[value].warning, status: false };
						});
					} else {
						draft.data[phase].warning = { ...well.data[phase].warning, status: false };
					}
				})
			);

			confirmationAlert(resultMessage);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const labelRender = useMemo(() => {
		const { _id, forecastId } = well;
		if (phase === 'all') {
			const { data } = well;

			let showWarning = false;
			const warnings = _.reduce(
				data,
				(obj, dataValue, dataPhase) => {
					const {
						warning: { status, message },
					} = dataValue;

					if (status) {
						showWarning = true;
					}

					return { ...obj, [dataPhase]: status ? message : null };
				},
				{}
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const render: Array<any> = _.reduce(
				warnings,
				(message, warningValue, warningPhase) => {
					if (warningValue) {
						message.push(
							<div key={`warning-message__${warningPhase}`}>{`${capitalize(
								warningPhase
							)}: ${warningValue}`}</div>
						);
					}
					return message;
				},
				[] as Array<JSX.Element>
			);

			return (
				<GenLabelsContainer>
					{showWarning && (
						<IconButton
							color='warning'
							onClick={() => openWarningPopup(<WarningContainer>{render}</WarningContainer>)}
							size='small'
							tooltipPlacement='left'
							tooltipTitle='View Warning'
						>
							{faExclamation}
						</IconButton>
					)}

					<div
						css={`
							align-items: center;
							column-gap: 0.25rem;
							display: flex;
						`}
					>
						<PhaseStatusButtons forecastId={forecastId} wellId={_id} />
					</div>
				</GenLabelsContainer>
			);
		}

		const {
			data: {
				[phase]: { warning },
			},
		} = well;

		const inputPhases = phases.filter((curPhase) => curPhase.value === phase);
		return (
			<GenLabelsContainer>
				{warning?.status && (
					<IconButton
						color='warning'
						onClick={() => openWarningPopup(<WarningContainer>{warning.message}</WarningContainer>)}
						size='small'
						tooltipPlacement='left'
						tooltipTitle='View Warning'
					>
						{faExclamation}
					</IconButton>
				)}

				<PhaseStatusButtons forecastId={forecastId} phases={inputPhases} wellId={_id} />
			</GenLabelsContainer>
		);
	}, [openWarningPopup, phase, well]);

	const [xMin, xMax] = useMemo(
		() =>
			getProbXBoundaries({
				production: wellProduction,
				xLogScale: graphSettings.xLogScale,
				xType: graphSettings.xLogScale ? 'relativeTime' : 'time',
				yearsBefore: graphSettings.yearsBefore,
				yearsPast: graphSettings.yearsPast,
			}),
		[graphSettings.xLogScale, graphSettings.yearsBefore, graphSettings.yearsPast, wellProduction]
	);

	return (
		<Card
			left={
				!showLoadStatus && (
					<>
						{selectable && (
							<Checkbox
								key={`well-selected__${well.headers._id}`}
								checked={selected}
								onChange={(checked) => toggleManualSelect({ checked, wellId: well.headers._id })}
								size='small'
								value={selected}
							/>
						)}

						{getChartOptions?.()}

						<span className='title-label'>
							<ChartTitleText wellId={well?._id} />

							<ProbabilisticChartSubheader
								allPSeries={allPName}
								forecasts={well?.data}
								phase={phase}
								production={wellProduction}
								resolution={prodFreq}
								wellId={well?._id}
							/>
						</span>
					</>
				)
			}
			right={
				!showLoadStatus && (
					<>
						{enableDownload && (
							<ProbabilisticDownloadButton forecastId={well?.forecastId} wellId={well?._id} small />
						)}

						{enableLabels && labelRender}

						<WellCommentButton wellId={well?._id} forecastId={well?.forecastId} />
					</>
				)
			}
		>
			{showLoadStatus ? (
				<div
					css={`
						align-items: center;
						display: flex;
						font-size: 1.25rem;
						height: 100%;
						justify-content: center;
						width: 100%;
					`}
				>
					Loading...
				</div>
			) : (
				<PlotZingchart
					data={{
						type: 'mixed',
						legend: enableLegend ? genLegendConfig() : undefined,
						scaleY: genScaleY({
							// maxValue: Number.isFinite(yMin) && yMax > yMin ? yMax : undefined, disabled yMax for now
							log: logScale,
							minValue: Number.isFinite(yMin) ? yMin : undefined,
							yGuide: true,
							yLabel: phaseYLabels[phase],
						}),
						scaleX: genScaleX({
							maxValue: xMax,
							minValue: xMin,
							time: !xLogScale,
							xGuide: true,
							xLabel: undefined,
							xLogScale,
						}),
						plotarea: { marginRight: '40rem' },
					}}
					disableContextMenu
					ref={zingRef}
				>
					<ProductionSeries
						index={xLogScale}
						lineScatter={lineScatter}
						phase={phase}
						prodFreq={prodFreq}
						production={wellProduction}
						relative={xLogScale}
						tooltip
						yearsBefore={yearsBefore}
					/>
					<ForecastSeries
						chartResolution={chartResolution}
						forecastData={well?.data}
						index={xLogScale}
						names={phase === 'all' ? [allPName] : sNames}
						phase={phase}
						production={wellProduction}
						relative={xLogScale}
						resolution={well?.data?.[phase]?.data_freq || 'monthly'}
						yearsBefore={yearsBefore}
						yearsPast={yearsPast}
					/>
				</PlotZingchart>
			)}
		</Card>
	);
}

export default SimplePhaseChart;
