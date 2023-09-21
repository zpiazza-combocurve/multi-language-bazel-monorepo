import { round } from 'lodash-es';
import { Fragment, useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

import { Placeholder } from '@/components';
import { useClientWidth } from '@/components/hooks/useClientWidth';
import {
	ChartHeaderContext,
	defaultChartHeaders,
} from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import {
	DAILY_PRODUCTION_COLORS,
	FORECAST_PRODUCTION_COLORS,
	MONTHLY_PRODUCTION_COLORS,
} from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { useCumsAndEur } from '@/forecasts/shared';
import sassVars from '@/global-styles/vars.scss?inline';
import { useAlfa } from '@/helpers/alfa';
import { getWellHeaders } from '@/helpers/headers';
import { useProjectHeadersDataMap, useProjectHeadersQuery } from '@/helpers/project-custom-headers';
import { DEFAULT_QUERY_OPTIONS } from '@/helpers/query-cache';
import { capitalize, labelWithUnit } from '@/helpers/text';
import { assert, genDate, numberWithCommas } from '@/helpers/utilities';
import { forecastSeries, phases } from '@/helpers/zing';
import { fields as templates } from '@/inpt-shared/display-templates/forecast-data/forecast-status.json';
import { fields as dailyUnitsTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitsTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as wellHeaderTypesTemplate } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as wellHeaderUnitsTemplate } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { getConvertFunc } from '@/inpt-shared/helpers/units';
import { useWellsHeadersMap } from '@/manage-wells/shared/utils';
import { FitResolution } from '@/type-curves/TypeCurveIndex/types';

const mappedTemplate = Object.entries(templates).reduce(
	(obj, [key, value]) => ({
		...obj,
		[key]: {
			label: value.shortLabel,
			longLabel: value.label,
			color: value.color,
		},
	}),
	{}
);

const MIN_BODY_SIZE = document.body.clientWidth / 1.5;

// headers that will display all characters
const MAX_LENGTH_HEADERS = ['well_name'];

const TitleText = styled.span`
	display: flex;
	flex-wrap: wrap;
	width: 100%;
`;

const TitleTextItem = styled.span<{ largeFont?: boolean; small?: boolean }>`
	${({ largeFont, small }) => {
		if (small) {
			return 'font-size: 0.5rem;';
		}
		if (largeFont) {
			return 'font-size: 1rem;';
		}
		return 'font-size: 0.75rem;';
	}}
	&:not(:first-child) {
		border-left: 1px solid ${sassVars.secondary};
		padding-left: 0.25rem;
	}
	&:not(:last-child) {
		padding-right: 0.25rem;
	}
`;

const SubheaderTextContainer = styled.span`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width: 100%;
`;

const SubheaderTextRow = styled.span`
	display: flex;
	flex-wrap: wrap;
	width: 100%;
`;

const SubheaderTextItem = styled.span`
	column-gap: 0.25rem;
	display: flex;
	margin-right: 0.5rem;
`;

const SubheaderTextItemValue = styled.span<{ largeFont?: boolean }>`
	color: ${({ color }) => color ?? sassVars.color};
	font-size: ${({ largeFont }) => (largeFont ? '0.75rem' : '0.675rem')};
	white-space: nowrap;
`;

const MAX_TYPE_CURVE_LABEL_CHARS = 12;

const getPhaseTitle = (data) => {
	const { forecastType, forecastSubType, typeCurve, typeCurveModel, typeCurveApplySetting } = data ?? {};
	if (forecastSubType === 'typecurve') {
		const label = (typeCurve?.name ?? typeCurveModel?.name)?.slice(0, MAX_TYPE_CURVE_LABEL_CHARS) ?? 'Type Curve';
		return {
			label: `${label} - `,
			title: `${typeCurve?.name ?? typeCurveModel?.name ?? 'Type Curve'} | Forecast Type: ${capitalize(
				forecastType
			)} | Applied Normalization: ${typeCurveApplySetting?.applyNormalization ? 'Yes' : 'No'} | Risk Factor: ${
				typeCurveApplySetting?.riskFactor ?? 1
			}`,
		};
	}
	if (forecastType === 'not_forecasted') {
		return { label: 'No Fst -', title: undefined };
	}

	return { label: `${capitalize(forecastType)} -`, title: undefined };
};

const parseProdValue = (value, unitKey, placesPastDecimal = 0) => {
	if (Number.isFinite(value)) {
		const convertFunc = getConvertFunc(dailyUnitsTemplate[unitKey], defaultUnitsTemplate[unitKey]);
		const parsedValue = round(convertFunc(value), placesPastDecimal);
		if (parsedValue || parsedValue === 0) {
			return numberWithCommas(parsedValue);
		}
	}
	return 'N/A';
};

const getSubheaderTitle = (subheader: string, value: string | number, units?: string) =>
	value === 'N/A' ? undefined : `${subheader} - ${labelWithUnit(value.toString(), units)}`;

const parseValue = ({
	abbreviated: abbreviatedIn = true,
	headerKey,
	headerLabel,
	type,
	value,
	calculatedWidthRatio,
	chartTitleWidth,
}) => {
	const abbreviated = MAX_LENGTH_HEADERS.includes(headerKey) ? false : abbreviatedIn;

	let valueText = 'N/A';
	if (value || type === 'boolean') {
		switch (type) {
			case 'string':
				valueText = abbreviated ? value.slice(0, Math.floor(chartTitleWidth / calculatedWidthRatio)) : value;
				break;
			case 'multi-select':
				valueText = abbreviated ? value.slice(0, Math.floor(chartTitleWidth / calculatedWidthRatio)) : value;
				break;
			case 'number':
				valueText = `${numberWithCommas(round(value, abbreviated ? 0 : 2))} ${
					wellHeaderUnitsTemplate?.[headerKey] ?? ''
				}`;
				break;
			case 'percent':
				valueText = `${numberWithCommas(round(value, abbreviated ? 0 : 2))} ${
					wellHeaderUnitsTemplate?.[headerKey] ?? ''
				}`;
				break;
			case 'date':
				valueText = genDate(value);
				break;
			case 'boolean':
				valueText = `${value ? 'Yes' : 'No'}`;
				break;
			default:
				return null;
		}
	}

	return `${headerLabel?.length ? `${headerLabel} - ` : ''}${valueText}`;
};

const ChartTitleText = ({
	headers,
	largeFont,
	small,
	wellId,
	wellHeadersDep,
}: {
	headers?: Array<string>;
	largeFont?: boolean;
	small?: boolean;
	wellId: string;
	wellHeadersDep?: Array<string>;
}) => {
	const { project } = useAlfa();
	assert(project?._id, 'Expected project ID to be in scope');

	const { chartHeaders = defaultChartHeaders, projectChartHeaders = [] } = useContext(ChartHeaderContext) ?? {};

	const inputHeaders = headers ?? chartHeaders;
	const { elRef: chartTitleRef, width: chartTitleWidth } = useClientWidth();

	const wellHeaderQuery = useWellsHeadersMap([wellId], { ...DEFAULT_QUERY_OPTIONS, enabled: !wellHeadersDep });
	const { data: wellHeadersQueryData, isLoading: isFetchingWellHeaders } = wellHeaderQuery;

	const wellHeaders = wellHeadersDep ?? wellHeadersQueryData?.get(wellId);

	const projectHeadersQuery = useProjectHeadersQuery(project._id, DEFAULT_QUERY_OPTIONS);
	const { data: projectHeaders, isLoading: isFetchingProjectHeaders } = projectHeadersQuery;

	const wellProjectHeadersQuery = useProjectHeadersDataMap(project._id, [wellId], DEFAULT_QUERY_OPTIONS);
	const { data: wellProjectHeadersMap, isLoading: isFetchingWellProjectHeaders } = wellProjectHeadersQuery;
	const wellProjectHeaders = wellProjectHeadersMap?.get(wellId) ?? {};

	const showAllHeaders = (Number(chartTitleWidth) ?? 0) > 500;
	const shownHeaders = useMemo(() => {
		return showAllHeaders ? inputHeaders : inputHeaders.slice(0, 5);
	}, [inputHeaders, showAllHeaders]);

	const shownProjectHeaders = useMemo(() => {
		if (showAllHeaders) {
			return projectChartHeaders;
		}
		if (shownHeaders?.length < 5) {
			return projectChartHeaders.slice(0, shownHeaders.length);
		}
		return [];
	}, [projectChartHeaders, showAllHeaders, shownHeaders?.length]);

	const calculatedLargeFont = useMemo(
		() => largeFont ?? chartTitleWidth > MIN_BODY_SIZE ?? false,
		[chartTitleWidth, largeFont]
	);

	const calculatedWidthRatio = calculatedLargeFont ? 70 : 100;
	return (
		<TitleText ref={chartTitleRef}>
			{(!wellHeadersDep && isFetchingWellHeaders) || isFetchingWellProjectHeaders || isFetchingProjectHeaders ? (
				<Placeholder empty text='Loading...' />
			) : (
				<>
					{Boolean(shownHeaders.length) &&
						shownHeaders
							.map((header) => {
								const { field: headerKey, selected: showFull = false } = header;
								const value = wellHeaders?.[headerKey];
								const headerLabel = getWellHeaders()[headerKey];
								const noValueText = `${headerLabel} - N/A`;
								const valueIsBoolean = wellHeaderTypesTemplate?.[headerKey]?.type === 'boolean';
								const { type } = wellHeaderTypesTemplate[headerKey];

								let title = noValueText;
								if (value) {
									title = `${parseValue({
										abbreviated: false,
										calculatedWidthRatio,
										chartTitleWidth,
										headerKey,
										headerLabel,
										type,
										value,
									})}`;
								}

								return (
									<TitleTextItem
										key={`extended-title-header-${headerKey}`}
										largeFont={calculatedLargeFont}
										small={small}
										title={title}
									>
										{parseValue({
											abbreviated: !showFull,
											calculatedWidthRatio,
											chartTitleWidth,
											headerKey,
											headerLabel: valueIsBoolean && headerLabel,
											type,
											value,
										})}
									</TitleTextItem>
								);
							})
							.filter((val) => val !== null)}

					{Boolean(shownProjectHeaders.length) &&
						shownProjectHeaders.map((header) => {
							const { field: headerKey, selected: showFull = false } = header;
							const value = wellProjectHeaders[headerKey];
							const headerLabel = projectHeaders?.projectHeaders[headerKey];
							const noValueText = `${headerLabel} - N/A`;
							const { type } = projectHeaders?.projectHeadersTypes[headerKey] || {};
							const valueIsBoolean = type === 'boolean';

							let title = noValueText;
							if (value) {
								title = `${parseValue({
									abbreviated: false,
									calculatedWidthRatio,
									chartTitleWidth,
									headerKey,
									headerLabel,
									type,
									value,
								})}`;
							}

							return (
								<TitleTextItem
									key={`extended-title-header-${headerKey}`}
									largeFont={calculatedLargeFont}
									small={small}
									title={title}
								>
									{parseValue({
										abbreviated: !showFull,
										calculatedWidthRatio,
										chartTitleWidth,
										headerKey,
										headerLabel: valueIsBoolean && headerLabel,
										type,
										value,
									})}
								</TitleTextItem>
							);
						})}
				</>
			)}
		</TitleText>
	);
};

const DeterministicChartSubheader = ({
	dailyProduction,
	enableWrap = true,
	forecasts,
	largeFont,
	manualPhase,
	manualSeries,
	monthlyProduction,
	resolution,
	wellHeadersDep,
	wellId,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dailyProduction?: Record<string, any>;
	enableWrap?: boolean;
	forecasts;
	largeFont?: boolean;
	manualPhase?: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualSeries?: Array<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	monthlyProduction?: Record<string, any>;
	resolution?: FitResolution;
	wellHeadersDep?;
	wellId: string;
}) => {
	const wellHeaderQuery = useWellsHeadersMap([wellId], { enabled: !wellHeadersDep });
	const { data: wellHeadersData } = wellHeaderQuery;

	const wellHeaders = wellHeadersDep ?? wellHeadersData?.get(wellId);

	const { elRef: chartSubTitleRef, width: chartTitleWidth } = useClientWidth();
	const showAllHeaders = (Number(chartTitleWidth) ?? 0) > 500;

	const calculatedLargeFont = useMemo(
		() => largeFont ?? chartTitleWidth > MIN_BODY_SIZE ?? false,
		[largeFont, chartTitleWidth]
	);

	const { monthlyCums, dailyCums, forecastCalcs } = useCumsAndEur({
		dailyProduction,
		forecasts,
		manualPhase,
		manualSeries,
		monthlyProduction,
		type: 'deterministic',
		resolution,
	});

	const getProdInfo = useCallback(
		(phase) => {
			const phaseTitle = getPhaseTitle(forecastCalcs[phase]);
			const monthlyValue = parseProdValue(monthlyCums[phase], `cumsum_${phase}`);
			const dailyValue = parseProdValue(dailyCums[phase], `cumsum_${phase}`);
			const eurValue = parseProdValue(forecastCalcs[phase]?.eur, `${phase}_eur`);
			const eurPllValue = parseProdValue(
				forecastCalcs[phase]?.eur / wellHeaders?.perf_lateral_length,
				`${phase}_eur/pll`
			);
			return (
				<SubheaderTextItem key={`prod-info__${phase}`}>
					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={phaseTitle.title}
					>
						{phaseTitle.label}
					</SubheaderTextItemValue>

					{showAllHeaders && (
						<>
							<SubheaderTextItemValue
								color={MONTHLY_PRODUCTION_COLORS[phase]}
								largeFont={calculatedLargeFont}
								title={getSubheaderTitle('M-CUM', monthlyValue, defaultUnitsTemplate[`${phase}_eur`])}
							>
								{monthlyValue}
							</SubheaderTextItemValue>

							<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

							<SubheaderTextItemValue
								color={DAILY_PRODUCTION_COLORS[phase]}
								largeFont={calculatedLargeFont}
								title={getSubheaderTitle('D-CUM', dailyValue, defaultUnitsTemplate[`${phase}_eur`])}
							>
								{dailyValue}
							</SubheaderTextItemValue>

							<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>
						</>
					)}

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('EUR', eurValue, defaultUnitsTemplate[`${phase}_eur`])}
					>
						{eurValue}
					</SubheaderTextItemValue>

					{showAllHeaders && (
						<>
							<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

							<SubheaderTextItemValue
								color={FORECAST_PRODUCTION_COLORS[phase]}
								largeFont={calculatedLargeFont}
								title={getSubheaderTitle(
									'EUR/FT',
									eurPllValue,
									defaultUnitsTemplate[`${phase}_eur/pll`]
								)}
							>
								{eurPllValue}
							</SubheaderTextItemValue>
						</>
					)}
				</SubheaderTextItem>
			);
		},
		[calculatedLargeFont, dailyCums, forecastCalcs, monthlyCums, showAllHeaders, wellHeaders?.perf_lateral_length]
	);

	const getSegmentInfo = useCallback(
		(phase) => {
			const { b, Deff } = forecastCalcs?.[phase] ?? {};
			return (
				<SubheaderTextItem key={`segment-info__${phase}`}>
					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('b', round(b, 5))}
					>
						{Number.isFinite(b) ? round(b, 2) : 'N/A'}
					</SubheaderTextItemValue>

					<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('Di eff', `${round(Deff * 100, 5)}%`)}
					>
						{Number.isFinite(Deff) ? `${round(Deff * 100, 1)}%` : 'N/A'}
					</SubheaderTextItemValue>
				</SubheaderTextItem>
			);
		},
		[calculatedLargeFont, forecastCalcs]
	);

	const secondarySubheaderRender = useMemo(
		() => (
			<>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>b | Di eff:</SubheaderTextItemValue>
				</SubheaderTextItem>

				{/* segment info (b / deff) */}
				{phases.map(({ value: phase }) => getSegmentInfo(phase))}
			</>
		),
		[calculatedLargeFont, getSegmentInfo]
	);

	return (
		<SubheaderTextContainer ref={chartSubTitleRef}>
			<SubheaderTextRow>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>
						{showAllHeaders ? 'M-CUM | D-CUM | EUR | EUR/FT (MBBL & MMCF):' : 'EUR:'}
					</SubheaderTextItemValue>
				</SubheaderTextItem>

				{/* production info (mcum/dcum/eur) */}
				{phases.map(({ value: phase }) => getProdInfo(phase))}

				{!enableWrap && secondarySubheaderRender}
			</SubheaderTextRow>

			{enableWrap && <SubheaderTextRow>{secondarySubheaderRender}</SubheaderTextRow>}
		</SubheaderTextContainer>
	);
};

const ProbabilisticChartSubheader = (props) => {
	const {
		allPSeries = 'best',
		forecasts,
		largeFont,
		manualPhase,
		manualSeries,
		phase,
		production,
		resolution = 'monthly',
		wellId,
	} = props;

	const wellHeaderQuery = useWellsHeadersMap([wellId]);
	const { data: wellHeadersData, isLoading } = wellHeaderQuery;

	const wellHeaders = wellHeadersData?.get(wellId);

	const { elRef: chartSubTitleRef, width: chartTitleWidth } = useClientWidth();
	const calculatedLargeFont = largeFont ?? chartTitleWidth > MIN_BODY_SIZE ?? false;
	const isMonthly = resolution === 'monthly';

	const { monthlyCums, dailyCums, forecastCalcs } = useCumsAndEur({
		dailyProduction: !isMonthly ? production : null,
		monthlyProduction: isMonthly ? production : null,
		forecasts,
		manualPhase,
		manualSeries,
		type: 'probabilistic',
		resolution,
	});

	const productionCum = isMonthly ? monthlyCums : dailyCums;
	const getPhaseProdInfo = useCallback(
		(phaseIn) => {
			const prodValue = parseProdValue(productionCum[phaseIn], `cumsum_${phaseIn}`);
			const eurValue = parseProdValue(forecastCalcs[phaseIn]?.[allPSeries]?.eur, `${phaseIn}_eur`);
			const eurPllvalue = wellHeaders?.perf_lateral_length
				? parseProdValue(
						forecastCalcs[phaseIn]?.[allPSeries]?.eur / wellHeaders.perf_lateral_length,
						`${phaseIn}_eur/pll`
				  )
				: 'N/A';

			return (
				<Fragment key={`prod-info__${phaseIn}`}>
					<SubheaderTextItemValue
						color={(isMonthly ? MONTHLY_PRODUCTION_COLORS : DAILY_PRODUCTION_COLORS)[phaseIn]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('CUM', prodValue, defaultUnitsTemplate[`cumsum_${phaseIn}`])}
					>
						{prodValue}
					</SubheaderTextItemValue>

					<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phaseIn]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('EUR', eurValue, defaultUnitsTemplate[`${phaseIn}_eur`])}
					>
						{eurValue}
					</SubheaderTextItemValue>

					{Boolean(wellHeaders?.perf_lateral_length) && (
						<>
							<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

							<SubheaderTextItemValue
								color={FORECAST_PRODUCTION_COLORS[phaseIn]}
								largeFont={calculatedLargeFont}
								title={getSubheaderTitle(
									'EUR/FT',
									eurPllvalue,
									defaultUnitsTemplate[`${phaseIn}_eur/pll`]
								)}
							>
								{eurPllvalue}
							</SubheaderTextItemValue>
						</>
					)}
				</Fragment>
			);
		},
		[allPSeries, calculatedLargeFont, forecastCalcs, isMonthly, productionCum, wellHeaders]
	);

	const getPhaseSegmentInfo = useCallback(
		(phaseIn, pSeriesIn = 'best') => {
			const { b, Deff } = forecastCalcs?.[phaseIn]?.[pSeriesIn] ?? {};
			return (
				<Fragment key={`phase-segment-info__${phaseIn}`}>
					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phaseIn]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('b', round(b, 5))}
					>
						{Number.isFinite(b) ? round(b, 2) : 'N/A'}
					</SubheaderTextItemValue>

					<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phaseIn]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('Di eff', `${round(Deff * 100, 5)}%`)}
					>
						{Number.isFinite(Deff) ? `${round(Deff * 100, 2)}%` : 'N/A'}
					</SubheaderTextItemValue>
				</Fragment>
			);
		},
		[calculatedLargeFont, forecastCalcs]
	);

	const allPhaseRender = (
		<>
			<SubheaderTextRow>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>
						CUM | EUR {Boolean(wellHeaders?.perf_lateral_length) && <span>| EUR/FT</span>} (MBBL & MMCF):
					</SubheaderTextItemValue>
				</SubheaderTextItem>

				{/* production info (mcum/dcum/eur) */}
				<SubheaderTextItem>{phases.map(({ value: phaseIn }) => getPhaseProdInfo(phaseIn))}</SubheaderTextItem>
			</SubheaderTextRow>

			<SubheaderTextRow>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>b | Di eff:</SubheaderTextItemValue>
				</SubheaderTextItem>

				{/* segment info (b / deff) */}
				<SubheaderTextItem>
					{phases.map(({ value: phaseIn }) => getPhaseSegmentInfo(phaseIn, allPSeries))}
				</SubheaderTextItem>
			</SubheaderTextRow>
		</>
	);

	const pSeriesInfoRender = useMemo(() => {
		const prodValue = parseProdValue(productionCum[phase], `cumsum_${phase}`);
		return (
			<SubheaderTextRow>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>
						{labelWithUnit('CUM', defaultUnitsTemplate[`cumsum_${phase}`])}:
					</SubheaderTextItemValue>
				</SubheaderTextItem>

				<SubheaderTextItem>
					<SubheaderTextItemValue
						color={(isMonthly ? MONTHLY_PRODUCTION_COLORS : DAILY_PRODUCTION_COLORS)[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('CUM', prodValue, defaultUnitsTemplate[`cumsum_${phase}`])}
					>
						{prodValue}
					</SubheaderTextItemValue>
				</SubheaderTextItem>

				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>EUR:</SubheaderTextItemValue>
				</SubheaderTextItem>

				<SubheaderTextItem>
					{forecastSeries.map(({ color, value: pSeries }, idx) => {
						const eurValue = parseProdValue(forecastCalcs[phase]?.[pSeries]?.eur, `${phase}_eur`);
						return (
							<Fragment key={`eur__${pSeries}`}>
								<SubheaderTextItemValue
									largeFont={calculatedLargeFont}
									color={color}
									title={getSubheaderTitle('EUR', eurValue, defaultUnitsTemplate[`${phase}_eur`])}
								>
									{eurValue}
								</SubheaderTextItemValue>

								{idx !== forecastSeries.length - 1 && (
									<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>
								)}
							</Fragment>
						);
					})}
				</SubheaderTextItem>

				{Boolean(wellHeaders?.perf_lateral_length) && (
					<>
						<SubheaderTextItem>
							<SubheaderTextItemValue largeFont={calculatedLargeFont}>EUR/FT:</SubheaderTextItemValue>
						</SubheaderTextItem>

						<SubheaderTextItem>
							{forecastSeries.map(({ color, value: pSeries }, idx) => {
								const eurPllvalue = wellHeaders?.perf_lateral_length
									? parseProdValue(
											forecastCalcs[phase]?.[pSeries]?.eur / wellHeaders.perf_lateral_length,
											`${phase}_eur/pll`
									  )
									: 'N/A';

								return (
									<span key={`eurPLL__${pSeries}`}>
										<SubheaderTextItemValue
											largeFont={calculatedLargeFont}
											color={color}
											title={getSubheaderTitle(
												'EUR/FT',
												eurPllvalue,
												defaultUnitsTemplate[`${phase}_eur/pll`]
											)}
										>
											{eurPllvalue}
										</SubheaderTextItemValue>

										{idx !== forecastSeries.length - 1 && (
											<SubheaderTextItemValue largeFont={calculatedLargeFont}>
												|
											</SubheaderTextItemValue>
										)}
									</span>
								);
							})}
						</SubheaderTextItem>
					</>
				)}

				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>b | Di eff:</SubheaderTextItemValue>
				</SubheaderTextItem>

				<SubheaderTextItem>{getPhaseSegmentInfo(phase)}</SubheaderTextItem>
			</SubheaderTextRow>
		);
	}, [
		calculatedLargeFont,
		forecastCalcs,
		getPhaseSegmentInfo,
		isMonthly,
		phase,
		productionCum,
		wellHeaders?.perf_lateral_length,
	]);

	return (
		<SubheaderTextContainer ref={chartSubTitleRef}>
			{phase === 'all' && !isLoading ? allPhaseRender : pSeriesInfoRender}
		</SubheaderTextContainer>
	);
};

const useForecastStatus = () => ({ statusTemplate: mappedTemplate, loaded: true });

const ProximitySubheaders = ({ eurs }) => {
	const calculatedLargeFont = false;

	const getProdInfo = useCallback(
		(phase) => {
			// const monthlyValue = parseProdValue(monthlyCums[phase], `cumsum_${phase}`);
			// const dailyValue = parseProdValue(dailyCums[phase], `cumsum_${phase}`);
			const eurValue = parseProdValue(eurs?.[`${phase}_eur`], `${phase}_eur`);
			const eurPllValue = parseProdValue(eurs?.[`${phase}_eur/pll`], `${phase}_eur/pll`);
			return (
				<SubheaderTextItem key={`prod-info__${phase}`}>
					{/* TODO: This might be added back in later versions */}
					{/* <>
						<SubheaderTextItemValue
							color={MONTHLY_PRODUCTION_COLORS[phase]}
							largeFont={calculatedLargeFont}
							title={getSubheaderTitle('M-CUM', monthlyValue, defaultUnitsTemplate[`${phase}_eur`])}
						>
							{monthlyValue}
						</SubheaderTextItemValue>

						<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

						<SubheaderTextItemValue
							color={DAILY_PRODUCTION_COLORS[phase]}
							largeFont={calculatedLargeFont}
							title={getSubheaderTitle('D-CUM', dailyValue, defaultUnitsTemplate[`${phase}_eur`])}
						>
							{dailyValue}
						</SubheaderTextItemValue>

						<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>
					</> */}

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('EUR', eurValue, defaultUnitsTemplate[`${phase}_eur`])}
					>
						{eurValue}
					</SubheaderTextItemValue>

					<SubheaderTextItemValue largeFont={calculatedLargeFont}>|</SubheaderTextItemValue>

					<SubheaderTextItemValue
						color={FORECAST_PRODUCTION_COLORS[phase]}
						largeFont={calculatedLargeFont}
						title={getSubheaderTitle('EUR/FT', eurPllValue, defaultUnitsTemplate[`${phase}_eur/pll`])}
					>
						{eurPllValue}
					</SubheaderTextItemValue>
				</SubheaderTextItem>
			);
		},
		[calculatedLargeFont, eurs]
	);

	return (
		<SubheaderTextContainer>
			<SubheaderTextRow>
				<SubheaderTextItem>
					<SubheaderTextItemValue largeFont={calculatedLargeFont}>
						Ave EUR | Ave EUR/FT (MBBL & MMCF)
					</SubheaderTextItemValue>
				</SubheaderTextItem>

				{/* production info (mcum/dcum/eur) */}
				{phases.map(({ value: phase }) => getProdInfo(phase))}
			</SubheaderTextRow>
		</SubheaderTextContainer>
	);
};

const ProximityChartTitle = (props) => {
	const { headerAverages, headers, eurs } = props;

	//
	const { elRef: chartTitleRef, width: chartTitleWidth } = useClientWidth();
	// use 100 since here we are only using small font, copy the logic from ChartTitleText
	const calculatedWidthRatio = 100;

	return (
		<>
			<TitleText ref={chartTitleRef}>
				<TitleTextItem key='proximity-extended-title-header-name' largeFont={false} small={false}>
					Proximity Wells
				</TitleTextItem>
				{headers.map((headerKey) => {
					const value = headerAverages[headerKey];
					const headerLabel = getWellHeaders()[headerKey];
					const noValueText = `${headerLabel} - N/A`;
					const valueIsBoolean = wellHeaderTypesTemplate?.[headerKey]?.type === 'boolean';
					const { type } = wellHeaderTypesTemplate[headerKey];

					let title = noValueText;
					if (value) {
						title = `${parseValue({
							headerKey,
							value,
							abbreviated: false,
							headerLabel,
							type,
							calculatedWidthRatio,
							chartTitleWidth,
						})}`;
					}

					return (
						<TitleTextItem
							key={`proximity-extended-title-header-${headerKey}`}
							largeFont={false}
							small={false}
							title={title}
						>
							{parseValue({
								headerKey,
								value,
								abbreviated: true,
								headerLabel: valueIsBoolean && headerLabel,
								type,
								calculatedWidthRatio,
								chartTitleWidth,
							})}
						</TitleTextItem>
					);
				})}
			</TitleText>
			<ProximitySubheaders eurs={eurs} />
		</>
	);
};

export {
	ChartTitleText,
	DeterministicChartSubheader,
	ProbabilisticChartSubheader,
	useForecastStatus,
	ProximityChartTitle,
};
