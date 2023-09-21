/* eslint react/jsx-key: warn */
import { useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { SelectionControlGroup } from '@/components/SelectionControlGroup';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	InfoTooltipWrapper,
	ReactDatePicker,
} from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import {
	dataResolutionOptions,
	forecastHistoryMatchTooltip,
	forecastSegmentEndingCondition,
	forecastUnits,
	outputCumsTooltip,
	toLifeOptions,
	wellIdKeyOptions,
	zeroForecastTooltip,
} from '@/scenarios/Scenario/ScenarioPage/exports/ExportToAriesDialog';

const TooltipTextContainer = styled.div`
	white-space: pre-wrap;
`;

const forecastStartToLatestProdTooltip = () => {
	return (
		<TooltipTextContainer>
			For when no overlap on forecasts to historical production is desired, check this box. Start date export to
			ARIES will be translated forward to the month following each phase&apos;s latest historical data. This will
			use the data stream in &quot;Data Resolution&quot; below and will be ignored when production does not exist
			for that phase, rather using the selected date.
		</TooltipTextContainer>
	);
};

const DatePickerContainer = styled.section`
	display: flex;
	flex-direction: column;
	row-gap: 0.5rem;
`;

const DateFieldLabel = styled.span`
	font-size: 14px;
`;

const ExportToAriesDialog = ({ forecast, onHide, resolve: _resolve, visible, wells }) => {
	const [startDate, setStartDate] = useState();
	const [pSeries, setPSeries] = useState('best');
	const [selectedIdKey, setSelectedIdKey] = useState('inptID');
	const [endingCondition, setEndingCondition] = useState('years');
	const [forecastUnit, setForecastUnit] = useState('per_day');
	const [toLife, setToLife] = useState('no');
	const [dataResolution, setDataResolution] = useState('same_as_forecast');
	const [includeZeroForecast, setIncludeZeroForecast] = useState(false);
	const [forecastHistoryMatch, setForecastHistoryMatch] = useState(false);
	const [forecastStartToLatestProd, setForecastStartToLatestProd] = useState(false);
	const [outputCums, setOutputCums] = useState(true);

	const pSeriesOptions = useMemo(
		() =>
			forecast?.type === 'probabilistic'
				? [
						{
							label: 'Best',
							value: 'best',
						},
						{
							label: 'P50',
							value: 'P50',
						},
						{
							label: 'P10',
							value: 'P10',
						},
						{
							label: 'P90',
							value: 'P90',
						},
				  ]
				: [{ label: 'Best', value: 'best' }],
		[forecast]
	);

	const { mutateAsync: handleStartExportToAries } = useMutation(async () => {
		const body = {
			forecastId: forecast._id,
			forecastName: forecast.name,
			wells,
			pSeries,
			selectedIdKey,
			endingCondition,
			forecastUnit,
			toLife,
			dataResolution,
			includeZeroForecast,
			forecastHistoryMatch,
			startDate: startDate ? startDate.toISOString().split('T')[0] : null,
			forecastStartToLatestProd,
			outputCums,
		};

		try {
			await postApi('/forecast/export-to-aries', body);
		} catch (err) {
			genericErrorAlert(err, 'Failed start export Forecast to Aries');
		}
	});

	return (
		<Dialog open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>CSV Export - Forecast To ARIES</DialogTitle>

			<DialogContent>
				<div
					css={`
						display: flex;
						flex-direction: column;
						row-gap: 1rem;
						& .md-selection-control-group {
							padding: 0;
						}
					`}
				>
					<DatePickerContainer>
						<div>
							<ReactDatePicker
								color='primary'
								fullWidth
								label='Start Date'
								onChange={(value) => setStartDate(value)}
								selected={startDate}
								variant='outlined'
							/>
						</div>

						<CheckboxField
							label={
								<InfoTooltipWrapper
									tooltipTitle={forecastStartToLatestProdTooltip()}
									placeIconAfter
									iconFontSize='18px'
								>
									<DateFieldLabel>Truncate Forecast Start To Latest Production Date</DateFieldLabel>
								</InfoTooltipWrapper>
							}
							checked={forecastStartToLatestProd}
							onChange={(ev) => setForecastStartToLatestProd(ev.target.checked)}
						/>
					</DatePickerContainer>

					<Divider />

					<SelectionControlGroup
						type='radio'
						name='p-series'
						labelClassName='md-text'
						id='forecast-to-aries-p-series'
						label='Series (select one)'
						inline
						value={pSeries}
						controls={pSeriesOptions}
						onChange={(p) => setPSeries(p)}
					/>
					<SelectionControlGroup
						type='radio'
						name='well-identifier'
						labelClassName='md-text'
						id='forecast-to-aries-well-identifier'
						label='Well Identifier'
						inline
						value={selectedIdKey}
						controls={wellIdKeyOptions}
						onChange={(id) => setSelectedIdKey(id)}
					/>
					<SelectionControlGroup
						type='radio'
						name='forecast-unit'
						labelClassName='md-text'
						id='forecast-to-aries-forecast-unit'
						label='Forecast Unit'
						inline
						value={forecastUnit}
						controls={forecastUnits}
						onChange={(unit) => setForecastUnit(unit)}
					/>
					<SelectionControlGroup
						type='radio'
						name='ending-condition'
						labelClassName='md-text'
						id='forecast-to-aries-ending-condition'
						label='Forecast Segment Ending Condition'
						inline
						value={endingCondition}
						controls={forecastSegmentEndingCondition}
						onChange={(condition) => setEndingCondition(condition)}
					/>
					<SelectionControlGroup
						type='radio'
						name='to-life'
						labelClassName='md-text'
						id='forecast-to-aries-to-life'
						label='Forecast Non Major Segment To Life'
						inline
						value={toLife}
						controls={toLifeOptions}
						onChange={(bool) => setToLife(bool)}
					/>
					<SelectionControlGroup
						type='radio'
						name='data-resolution'
						labelClassName='md-text'
						id='forecast-to-aries-data-resolution'
						label='Data Resolution'
						inline
						value={dataResolution}
						controls={dataResolutionOptions}
						onChange={(bool) => setDataResolution(bool)}
					/>

					<Divider />

					<section css='display: flex; flex-direction: column;'>
						<CheckboxField
							label={
								<InfoTooltipWrapper
									tooltipTitle={outputCumsTooltip()}
									placeIconAfter
									iconFontSize='18px'
								>
									Output CUMS to ARIES
								</InfoTooltipWrapper>
							}
							checked={outputCums}
							onChange={(ev) => setOutputCums(ev.target.checked)}
						/>
						<CheckboxField
							label={
								<InfoTooltipWrapper
									tooltipTitle={zeroForecastTooltip}
									placeIconAfter
									iconFontSize='18px'
								>
									Include Zero Forecast
								</InfoTooltipWrapper>
							}
							checked={includeZeroForecast}
							onChange={(ev) => setIncludeZeroForecast(ev.target.checked)}
						/>

						<CheckboxField
							label={
								<InfoTooltipWrapper
									tooltipTitle={forecastHistoryMatchTooltip()}
									placeIconAfter
									iconFontSize='18px'
								>
									Force Forecast/History Match
								</InfoTooltipWrapper>
							}
							checked={forecastHistoryMatch}
							onChange={(ev) => setForecastHistoryMatch(ev.target.checked)}
						/>
					</section>
				</div>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>

				<Button
					color='secondary'
					onClick={handleStartExportToAries}
					variant='contained'
					{...getTaggingProp('forecast', 'exportAries')}
				>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ExportToAriesDialog;
