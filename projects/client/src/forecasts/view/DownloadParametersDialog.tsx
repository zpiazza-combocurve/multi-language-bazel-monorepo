import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { useMergedState } from '@/components/hooks';
import {
	Box,
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	InfoIcon,
	Radio,
	ReactDatePicker,
} from '@/components/v2';
import SimpleSelectField from '@/components/v2/misc/SimpleSelectField';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { genForecastFileName } from '@/forecasts/download-forecast/shared';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { subscribe } from '@/helpers/alfa';
import { errorFromInfo } from '@/helpers/errors';
import { downloadFile, postApi } from '@/helpers/routing';
import { Sheet, exportXLSX } from '@/helpers/xlsx';
import { forecastSeries, phases } from '@/helpers/zing';
import { ADJUST_EXPORT_VISIBLE_SUBDOMAIN } from '@/inpt-shared/constants';

import useEntityMenuOptions from './entity-menu-constants';

const FieldLabel = styled.div`
	font-size: 1rem;
`;

const PhaseContainer = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
	margin: 1rem 0;
`;

const PhaseDateContainer = styled.div`
	display: flex;
	flex-direction: column;
`;

function DownloadParametersDialog({
	forecast,
	forecastsWellsMap: _forecastsWellsMap = null,
	resolve,
	subdomain,
	visible,
	wells,
	phdWinExport = false,
	mosaicExport = false,
}) {
	const [state, setState] = useMergedState({
		adjust: false,
		gasDate: null,
		oilDate: null,
		phase: new Set(VALID_PHASES),
		series: 'best',
		waterDate: null,
	});
	const entityMenuOptions = useEntityMenuOptions();
	const [entityOption, setEntityOption] = useState(entityMenuOptions.menuItems[0].value);

	const cancel = useCallback(() => {
		// reset initial state
		setState({ phase: new Set(VALID_PHASES), series: 'best' });
		resolve(null);
	}, [resolve, setState]);

	const { mutateAsync: exportForecastDataParams, isLoading: exportingForecast } = useMutation(async () => {
		const { phase, series, adjust, oilDate, gasDate, waterDate } = state;
		const { _id: forecastId } = forecast;

		// proximity export uses forecastsWellsMap vs other exports don't
		const forecastsWellsMap = _forecastsWellsMap ?? { [forecastId]: wells };

		const body = {
			adjust: ADJUST_EXPORT_VISIBLE_SUBDOMAIN.includes(subdomain) ? adjust : false,
			forecastsWellsMap,
			phase: [...phase],
			series: [series],
			startDate: { oil: oilDate, gas: gasDate, water: waterDate },
		};

		try {
			const {
				error_info: errorInfo,
				file_id: fileId,
				success,
			} = await withLoadingBar(postApi(`/forecast/${forecastId}/exportForecastDataParams`, body));

			if (!success) {
				throw Error(errorInfo);
			}
			await downloadFile(fileId);
		} catch (_err) {
			genericErrorAlert(
				errorFromInfo({
					name: 'There was an issue generating your document',
					message: 'Please try again later',
					expected: true,
				})
			);
		} finally {
			cancel();
		}
	});

	const { mutateAsync: exportPHDWinDataParams, isLoading: exportingPHDWin } = useMutation(async () => {
		const { phase, series } = state;

		try {
			const wellIds = [...(wells ?? forecast.wells)];
			let sheets: Sheet = { name: '', data: [{}], header: [] };
			let startIdx = 1;
			while (wellIds.length) {
				const curWellIds = wellIds.splice(0, 500);
				const body = {
					phase: [...phase],
					series: [series],
					wells: curWellIds,
				};

				const sheet = await withLoadingBar(postApi(`/forecast/${forecast._id}/exportPHDwinDataParams`, body));

				if (startIdx > 1) {
					sheets.data = sheets.data.concat(sheet.data);
				} else {
					sheets = sheet;
				}

				startIdx++;
			}

			sheets.name = 'Parameters';
			exportXLSX({
				sheets: [sheets],
				fileName: genForecastFileName(forecast.name, 'parameters'),
			});
		} catch (_err) {
			genericErrorAlert(
				errorFromInfo({
					name: 'There was an issue generating your document',
					message: 'Please try again later',
					expected: true,
				})
			);
		} finally {
			cancel();
		}
	});

	const { mutateAsync: exportMosaicDataParams, isLoading: exportingMosaic } = useMutation(async () => {
		const { phase, series } = state;
		const { _id: forecastId } = forecast;
		const forecastsWellsMap = _forecastsWellsMap ?? { [forecastId]: wells };

		const body = {
			phase: [...phase],
			series: [series],
			forecastsWellsMap,
			entityOption,
		};

		try {
			const {
				error_info: errorInfo,
				file_id: fileId,
				success,
			} = await withLoadingBar(postApi(`/forecast/${forecast._id}/exportMosaicDataParams`, body));

			if (!success) {
				throw Error(errorInfo);
			}
			await downloadFile(fileId);
		} catch (_err) {
			genericErrorAlert(
				errorFromInfo({
					name: 'There was an issue generating your document',
					message: 'Please try again later',
					expected: true,
				})
			);
		} finally {
			cancel();
		}
	});

	const exporting = exportingForecast || exportingMosaic || exportingPHDWin;
	const { adjust, phase, series } = state;
	const taggingProp = phdWinExport
		? getTaggingProp('forecast', 'exportPHDWin')
		: !mosaicExport
		? getTaggingProp('forecast', 'exportParameters')
		: {};

	return (
		<Dialog onClose={cancel} open={visible} fullWidth maxWidth={phdWinExport || mosaicExport ? 'sm' : 'md'}>
			<DialogTitle>Choose Download Parameters</DialogTitle>
			{mosaicExport && (
				<Box marginBottom='1rem'>
					<InfoIcon
						tooltipTitle='Select Header to be used as the Entity Name on the Export File'
						withLeftMargin
					/>
					<SimpleSelectField
						css={{ width: '45%', marginLeft: '1rem' }}
						label='Entity Name'
						value={entityOption}
						onChange={(ev) => setEntityOption(ev.target.value)}
						menuItems={entityMenuOptions.menuItems}
					/>
				</Box>
			)}
			<DialogContent>
				<FieldLabel>Phases:</FieldLabel>

				<PhaseContainer>
					{phases.map(({ label, value }) => {
						const dateKey: 'oilDate' | 'gasDate' | 'waterDate' = `${value}Date`;
						const { [dateKey]: dateValue } = state;
						return (
							<PhaseDateContainer key={value}>
								<CheckboxField
									checked={phase.has(value)}
									label={label}
									value={phase.has(value)}
									onChange={(ev) => {
										if (ev.target.checked) {
											phase.add(value);
										} else {
											phase.delete(value);
										}

										setState({ phase });
									}}
								/>

								{!(phdWinExport || mosaicExport) && (
									<ReactDatePicker
										asUtc
										selected={dateValue}
										onChange={(param) => {
											setState({
												[dateKey]: param ? format(param, 'yyyy-MM-dd') : null,
											});
										}}
										variant='outlined'
										label={`${label} Start Date`}
										placeholder='Select Date'
									/>
								)}
							</PhaseDateContainer>
						);
					})}
				</PhaseContainer>

				{forecast.type === 'probabilistic' && (
					<Box marginY='0.5rem'>
						<FieldLabel>Series (select one):</FieldLabel>
						{forecastSeries.map(({ label, value }) => {
							return (
								<FormControlLabel
									control={
										<Radio
											checked={series === value}
											onChange={(ev) => {
												if (ev.target.checked) {
													setState({ series: value });
												}
											}}
										/>
									}
									key={value}
									label={label}
									value={series === value}
								/>
							);
						})}
					</Box>
				)}

				{ADJUST_EXPORT_VISIBLE_SUBDOMAIN.includes(subdomain) && !(phdWinExport || mosaicExport) && (
					<>
						<Divider />

						<Box marginTop='1rem'>
							<CheckboxField
								label='Adjust Parameters'
								value={adjust}
								onChange={(ev) => {
									setState({ adjust: ev.target.checked });
								}}
							/>
						</Box>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button color='secondary' onClick={cancel}>
					Cancel
				</Button>

				<Button
					color='secondary'
					disabled={exporting || phase.size === 0 || series.length === 0}
					onClick={() =>
						(phdWinExport
							? exportPHDWinDataParams
							: mosaicExport
							? exportMosaicDataParams
							: exportForecastDataParams)()
					}
					variant='contained'
					{...taggingProp}
				>
					Download
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default subscribe(DownloadParametersDialog, ['subdomain']);
