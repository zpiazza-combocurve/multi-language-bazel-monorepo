import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import _, { noop } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useClientWidth } from '@/components/hooks/useClientWidth';
import { Box, Divider, IconButton, Tab as MUITab, Tabs } from '@/components/v2';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { FORECAST_FLOATER_HANDLE } from '@/forecasts/shared/ForecastFloater';
import ForecastParameters, {
	ParametersTitleWithSubtext,
	getForecastParameterProps,
} from '@/forecasts/shared/ForecastParameters';
import { theme } from '@/helpers/styled';
import { phases } from '@/helpers/zing';
import { fields as segParamsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

const REFERENCE_FORECAST_MULTI = 1.35;

const ForecastNameTitle = ({ forecastName }) => (
	<div
		css={`
			background-color: ${theme.backgroundOpaque};
			border-radius: 5px;
			padding: 0.5rem 1rem;
			width: 100%;
		`}
	>
		<ParametersTitleWithSubtext title={forecastName} subText='Forecast Name' />
	</div>
);

const Tab = styled(MUITab)`
	align-items: flex-start !important;
	min-width: unset !important;
	padding-top: 6px;
`;

const paramsItems = _.sortBy(
	_.filter(
		_.reduce(
			segParamsTemplate,
			(result, value, key) => {
				result.push({ ...value, value: key });
				return result;
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			[] as any
		),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(param: any) => !!param.order
	),
	'order'
);

const viewOrder = paramsItems.map((item) => item.value);

const ComparisonForecastParameters = ({
	comparisonForecastDatas,
	handleToggle,
	setFloaterColor = noop,
	wellName,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	comparisonForecastDatas: any;
	handleToggle?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setFloaterColor?: (arg: any) => void;
	wellName?: string;
}) => {
	const [phase, setPhase] = useState<Phase>('oil');
	const [elRef, width] = useClientWidth();

	const comparisonItems = useMemo(
		() =>
			comparisonForecastDatas?.forecast?.comparisons
				? Object.entries(comparisonForecastDatas?.forecast?.comparisons).map(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						([key, forecast]: [key: any, forecast: any]) => ({
							value: key,
							label: forecast.name,
							type: forecast.type,
						})
				  )
				: [],
		[comparisonForecastDatas?.forecast?.comparisons]
	);

	const forcePSeriesOffset = useMemo(
		() => comparisonItems.map((item) => item.type === 'probabilistic').includes(true),
		[comparisonItems]
	);

	// reference forecast is reserved REFERENCE_FORECAST_MULTI times greater than the width of the comparison forecasts
	const flexLength = comparisonItems.length + REFERENCE_FORECAST_MULTI;

	const referenceProps = useMemo(
		() => ({
			...getForecastParameterProps(comparisonForecastDatas?.forecast?.reference?.data, phase),
			dailyProduction: comparisonForecastDatas?.daily,
			enablePhaseSelection: false,
			forcePSeriesOffset,
			monthlyProduction: comparisonForecastDatas?.monthly,
			phase,
			setPhase,
			title: <ForecastNameTitle forecastName={comparisonForecastDatas?.forecast?.reference?.name} />,
			viewOrder,
		}),
		[
			comparisonForecastDatas?.daily,
			comparisonForecastDatas?.forecast?.reference?.data,
			comparisonForecastDatas?.forecast?.reference?.name,
			comparisonForecastDatas?.monthly,
			forcePSeriesOffset,
			phase,
		]
	);

	const getComparisonProps = useCallback(
		(comparisonId) => ({
			...getForecastParameterProps(comparisonForecastDatas?.forecast?.comparisons?.[comparisonId]?.data, phase),
			dailyProduction: comparisonForecastDatas?.daily,
			enablePhaseSelection: false,
			forcePSeriesOffset,
			monthlyProduction: comparisonForecastDatas?.monthly,
			phase,
			setPhase,
			title: (
				<ForecastNameTitle
					forecastName={comparisonForecastDatas?.forecast?.comparisons?.[comparisonId]?.name}
				/>
			),
			viewOrder,
		}),
		[
			comparisonForecastDatas?.daily,
			comparisonForecastDatas?.forecast?.comparisons,
			comparisonForecastDatas?.monthly,
			forcePSeriesOffset,
			phase,
		]
	);

	useEffect(() => {
		setFloaterColor(theme[`${phase}Color`]);
	}, [phase, setFloaterColor]);

	return (
		<>
			<div
				id={FORECAST_FLOATER_HANDLE}
				css={`
					align-items: center;
					cursor: grab;
					display: flex;
					margin-bottom: 0 !important; // necessary to override the parent margins added to each element
					padding-left: 1rem;
				`}
			>
				<span>{!!wellName?.length && <ParametersTitleWithSubtext title={wellName} subText='Well Name' />}</span>

				<Divider
					flexItem
					orientation='vertical'
					css={`
						margin: 0 1rem;
						height: 2.5rem;
					`}
				/>

				<Tabs
					indicatorColor='secondary'
					onChange={(_ev, newValue) => setPhase(newValue)}
					textColor='secondary'
					value={phase}
				>
					{phases.map(({ value, label }) => (
						<Tab value={value} label={label} key={value} />
					))}
				</Tabs>

				<IconButton
					css={`
						align-self: flex-start;
						margin-left: auto;
					`}
					onClick={handleToggle}
					size='small'
				>
					{faTimes}
				</IconButton>
			</div>

			<Divider
				css={`
					// counteract row-gap
					margin-top: -0.5rem;
				`}
			/>

			<section
				css={`
					column-gap: 0.75rem;
					display: flex;
					justify-content: space-around;
					padding: 0 0.5rem;
				`}
				ref={elRef}
			>
				<Box flexBasis={`${(100 * REFERENCE_FORECAST_MULTI) / flexLength}%`}>
					<ForecastParameters {...referenceProps} />
				</Box>

				{comparisonItems.map((item) => (
					<>
						<Divider flexItem orientation='vertical' />

						<Box flexBasis={`${100 / flexLength}%`} maxWidth={Math.round(width / flexLength)}>
							<ForecastParameters {...getComparisonProps(item.value)} showLabels={false} />
						</Box>
					</>
				))}
			</section>
		</>
	);
};

export default ComparisonForecastParameters;
