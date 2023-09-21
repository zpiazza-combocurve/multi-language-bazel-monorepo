import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { useMutation } from 'react-query';

import { IconButton } from '@/components/v2';
import { useProbabilisticWellData } from '@/forecasts/api';
import { genForecastFileName } from '@/forecasts/download-forecast/shared';
import { unitTemplates } from '@/forecasts/shared';
import { genericErrorAlert } from '@/helpers/alerts';
import { makeLocalWithHours } from '@/helpers/date';
import { isNumber } from '@/helpers/math';
import { genDate } from '@/helpers/utilities';
import {
	DEFAULT_FILL_VALUE,
	fetchWellHeaders,
	generateHeaderSheet,
	generateProductionSheet,
} from '@/helpers/wellDownload';
import { exportXLSX } from '@/helpers/xlsx';
import { forecastSeries, phases } from '@/helpers/zing';

const generateForecastTimeArr = (data) => {
	if (data) {
		let startTime = Infinity;
		let endTime = -Infinity;
		phases.forEach(({ value: phase }) => {
			const datum = data[phase];
			if (!datum) {
				return;
			}

			const { P_dict } = datum;
			Object.values(P_dict).forEach(({ segments } = {}) => {
				if (segments?.length) {
					startTime = Math.min(startTime, segments[0].start_idx);
					endTime = Math.max(endTime, segments[segments.length - 1].end_idx);
				}
			});
		});

		if (endTime > startTime) {
			return [...Array(endTime - startTime).keys()].map((t) => t + startTime);
		}
	}

	return [];
};

const generatePhaseSeriesForecastData = (data, timeArr, { phase, pSeries }) => {
	const multiSegmentInstance = new MultipleSegments();
	const segments = data?.[phase]?.P_dict?.[pSeries]?.segments ?? [];
	return multiSegmentInstance.predict({ idxArr: timeArr, segments, toFill: DEFAULT_FILL_VALUE });
};

const generateForecastSheet = ({ headers, data, defaultUnits }) => {
	const genPhaseSeriesHeader = (phase, phaseLabel, seriesLabel) =>
		`${phaseLabel} - ${seriesLabel} (${defaultUnits[phase]})`;

	const sheet = {
		headers: [
			'Well Name',
			'INPT ID',
			'API 14',
			'Date',
			...phases
				.map(({ value: phase, label: phaseLabel }) =>
					forecastSeries.map(({ label: seriesLabel }) => genPhaseSeriesHeader(phase, phaseLabel, seriesLabel))
				)
				.flat(),
		],
		name: 'Forecast',
		data: [],
	};

	const timeArr = generateForecastTimeArr(data);
	const phaseForecasts = phases.reduce(
		(obj, { value: phase }) => {
			const P_dict = data?.[phase]?.P_dict;
			if (P_dict) {
				return {
					...obj,
					[phase]: forecastSeries.reduce(
						(seriesObj, { value: pSeries }) => ({
							...seriesObj,
							[pSeries]: generatePhaseSeriesForecastData(data, timeArr, { phase, pSeries }),
						}),
						{ P10: null, P50: null, P90: null, best: null }
					),
				};
			}
			return obj;
		},
		{ oil: null, gas: null, water: null }
	);

	const sharedHeaders = {
		'Well Name': headers.well_name,
		'INPT ID': headers.inptID,
		'API 14': headers.api14,
	};

	sheet.data = timeArr.map((indexVal, indexIdx) => {
		const date = makeLocalWithHours(convertIdxToDate(indexVal));
		const datum = {
			...sharedHeaders,
			Date: genDate(date),
		};

		phases.forEach(({ label: phaseLabel, value: phaseValue }) => {
			forecastSeries.forEach(({ label: seriesLabel, value: seriesValue }) => {
				const forecastValue = phaseForecasts?.[phaseValue]?.[seriesValue]?.[indexIdx];
				datum[genPhaseSeriesHeader(phaseValue, phaseLabel, seriesLabel)] = isNumber(forecastValue)
					? forecastValue
					: '';
			});
		});

		return datum;
	});

	return sheet;
};

const ProbabilisticDownloadButton = (props) => {
	const { forecastId, wellId, small } = props;

	const { defaultUnitTemplate } = unitTemplates;

	const dataQuery = useProbabilisticWellData(forecastId, wellId);
	const { data, isFetching } = dataQuery;

	const loaded = !isFetching;

	const { isLoading: downloading, mutateAsync: download } = useMutation(async () => {
		if (loaded) {
			try {
				const headers = await fetchWellHeaders(wellId);

				// generate production sheets
				const monthlySheet = await generateProductionSheet({
					data,
					headers,
					resolution: 'monthly',
					wellId,
				});

				const dailySheet = await generateProductionSheet({
					data,
					headers,
					resolution: 'daily',
					wellId,
				});

				// generate forecast sheet
				const forecastSheet = generateForecastSheet({
					headers,
					data: data?.data ?? null,
					defaultUnits: defaultUnitTemplate,
				});

				const headerSheet = await generateHeaderSheet(wellId, headers);

				const output = {
					fileName: genForecastFileName(headers.well_name, 'forecast_data'),
					sheets: [headerSheet, monthlySheet, dailySheet, forecastSheet],
				};

				exportXLSX(output);
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	});

	return (
		<IconButton
			disabled={!loaded || downloading}
			onClick={download}
			color='primary'
			iconSize={small ? 'small' : 'medium'}
		>
			{faDownload}
		</IconButton>
	);
};

export { ProbabilisticDownloadButton };
