import { truncate } from 'lodash';
import _ from 'lodash-es';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import AutoSizer, { Props as AutoSizerProps } from 'react-virtualized-auto-sizer';
import styled, { css } from 'styled-components';

import { Placeholder } from '@/components';
import AxisControlSelection, { AxisItem, AxisValue } from '@/forecasts/charts/components/AxisControlSelection';
import { VALID_CUMS, VALID_NUMERIC } from '@/forecasts/charts/components/graphProperties';
import {
	ChartContainer,
	Container,
	XControlsContainer,
	YControlsArea,
	YControlsContainer,
} from '@/forecasts/charts/components/gridChartLayout';
import useChartSettings, { ChartSettings } from '@/forecasts/charts/useChartSettings';
import {
	DEFAULT_FORECAST_MENU_VALUES,
	cumMaxItems,
	cumMinItems,
	yBigMaxItems,
	yBigMinItems,
	yMaxItems,
	yMinItems,
	yearsBeforeItems,
	yearsPastItems,
} from '@/forecasts/shared';
import { DEFAULT_ITEM_FONT_FAMILY, SCALE_LABEL_FONT_COLOR, scaleItemFontSize } from '@/helpers/zing';

type SetAxisValueType = (value: AxisValue) => void;

// value chosen based on the size of most charts; adjust as needed
const DEFAULT_Y_LABEL_CHARS = 20;

const Y_AXIS_LABEL_X_OFFSET = '50%';

const axisLabelStyle = css`
	color: ${SCALE_LABEL_FONT_COLOR};
	font-family: ${DEFAULT_ITEM_FONT_FAMILY};
	font-size: ${scaleItemFontSize(1)};
`;

// alt margin allows for more centered UI when no xAxisControls
interface yLabelProps extends AutoSizerProps {
	altTop: boolean;
}

const YAxisLabelContainer = styled(AutoSizer)<yLabelProps>`
	left: ${Y_AXIS_LABEL_X_OFFSET};
	position: absolute;
	top: ${({ altTop }) => (altTop ? '49%' : '53%')};
	transform-origin: top left;

	// x-offset / translation needs to be on the label directly as AutoSizer is using width of 0
	transform: rotate(-90deg);
	white-space: nowrap;
	${axisLabelStyle}
`;

const YAxisLabel = styled.span`
	position: absolute;
	transform: translateX(-${Y_AXIS_LABEL_X_OFFSET});
`;

const XAxisLabelContainer = styled.span`
	${axisLabelStyle};
`;

function ForecastChartContainer({
	id,
	className,
	chartSettings: parentChartSettings = { xAxis: 'time' },
	enableXMinMax,
	enableYMinMax,
	forceOnFirstRender,
	isLoading,
	onControlsBlur,
	onControlsFocus,
	render,
	scaleXControlsToCalc = _.identity,
	scaleXControlsToView = _.identity,
	selectCumMax: parentSelectCumMax,
	selectCumMin: parentSelectCumMin,
	selectYearsBefore: parentSelectYearsBefore,
	selectYearsPast: parentSelectYearsPast,
	selectYMax: parentSelectYMax,
	selectYMin: parentSelectYMin,
	setChartSettings: parentSetChartSettings,
	xMaxItems,
	xMinItems,
	yBigItems,
	yLabelChars,
	yMaxItems: parentYMaxItems,
	...rest
}: {
	id?: string;
	className?: string;
	chartSettings?: ChartSettings;
	enableXMinMax?: boolean;
	enableYMinMax?: boolean;
	forceOnFirstRender?: boolean;
	isLoading?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onControlsBlur?: (value?: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onControlsFocus?: (value?: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	render: (renderProps: any) => ReactElement<any, any>;
	scaleXControlsToCalc?: (value: number) => number;
	scaleXControlsToView?: (value: number) => number;
	selectCumMax?: SetAxisValueType;
	selectCumMin?: SetAxisValueType;
	selectYearsBefore?: SetAxisValueType;
	selectYearsPast?: SetAxisValueType;
	selectYMax?: SetAxisValueType;
	selectYMin?: SetAxisValueType;
	setChartSettings?: (value) => void;
	xMaxItems?: AxisItem[];
	xMinItems?: AxisItem[];
	yBigItems?: AxisItem[];
	yLabelChars?: number;
	yMaxItems?: AxisItem[];
}) {
	const [xAxisLabel, setXAxisLabel] = useState<string>('');
	const [yAxisLabel, setYAxisLabel] = useState<string>('');

	const { chartSettings, setChartSettings } = useChartSettings({
		chartSettings: parentChartSettings,
		setChartSettings: parentSetChartSettings,
	});

	const {
		cumMax = DEFAULT_FORECAST_MENU_VALUES.cumMax,
		cumMin = DEFAULT_FORECAST_MENU_VALUES.cumMin,
		xAxis = 'time',
		yearsBefore = DEFAULT_FORECAST_MENU_VALUES.yearsBefore,
		yearsPast = DEFAULT_FORECAST_MENU_VALUES.yearsPast,
		yMax = DEFAULT_FORECAST_MENU_VALUES.yMax,
		yMin = DEFAULT_FORECAST_MENU_VALUES.yMin,
	} = chartSettings;

	const xAxisUsingNumericUnits = VALID_NUMERIC.includes(xAxis);

	/** Requried for older component compatibility TODO: rework older components and get rid of these */
	const selectCumMax = useCallback(
		(value) => (parentSelectCumMax ? parentSelectCumMax(value) : setChartSettings({ cumMax: value })),
		[parentSelectCumMax, setChartSettings]
	);

	const selectCumMin = useCallback(
		(value) => (parentSelectCumMin ? parentSelectCumMin(value) : setChartSettings({ cumMin: value })),
		[parentSelectCumMin, setChartSettings]
	);

	const selectYearsBefore = useCallback(
		(value) =>
			parentSelectYearsBefore ? parentSelectYearsBefore(value) : setChartSettings({ yearsBefore: value }),
		[parentSelectYearsBefore, setChartSettings]
	);

	const selectYearsPast = useCallback(
		(value) => (parentSelectYearsPast ? parentSelectYearsPast(value) : setChartSettings({ yearsPast: value })),
		[parentSelectYearsPast, setChartSettings]
	);

	const selectYMax = useCallback(
		(value) => (parentSelectYMax ? parentSelectYMax(value) : setChartSettings({ yMax: value })),
		[parentSelectYMax, setChartSettings]
	);

	const selectYMin = useCallback(
		(value) => (parentSelectYMin ? parentSelectYMin(value) : setChartSettings({ yMin: value })),
		[parentSelectYMin, setChartSettings]
	);
	/** End legacy functions */

	useEffect(() => {
		if (VALID_CUMS.includes(xAxis)) {
			selectCumMax('all');
		}
	}, [selectCumMax, xAxis]);

	const addYPaddingBottom = Boolean(enableYMinMax && !enableXMinMax);

	const yAxisProps = useMemo(
		() => ({
			min: { value: yMin, items: yBigItems ? yBigMinItems : yMinItems, onChange: selectYMin },
			max: {
				value: yMax,
				items: parentYMaxItems ?? (yBigItems ? yBigMaxItems : yMaxItems),
				onChange: selectYMax,
			},
		}),
		[parentYMaxItems, selectYMax, selectYMin, yBigItems, yMax, yMin]
	);

	const xAxisProps = useMemo(
		() =>
			xAxisUsingNumericUnits
				? {
						min: { value: cumMin, items: xMinItems ?? cumMinItems, onChange: selectCumMin },
						max: { value: cumMax, items: xMaxItems ?? cumMaxItems, onChange: selectCumMax },
				  }
				: {
						min: {
							items: yearsBeforeItems,
							onChange: selectYearsBefore,
							scaleToCalc: scaleXControlsToCalc,
							scaleToView: scaleXControlsToView,
							value: yearsBefore,
						},
						max: {
							items: yearsPastItems,
							onChange: selectYearsPast,
							scaleToCalc: scaleXControlsToCalc,
							scaleToView: scaleXControlsToView,
							value: yearsPast,
						},
				  },
		[
			cumMax,
			cumMin,
			scaleXControlsToCalc,
			scaleXControlsToView,
			selectCumMax,
			selectCumMin,
			selectYearsBefore,
			selectYearsPast,
			xAxisUsingNumericUnits,
			xMaxItems,
			xMinItems,
			yearsBefore,
			yearsPast,
		]
	);

	return (
		<Container id={id} className={className}>
			<YControlsContainer>
				{enableYMinMax && (
					<YControlsArea>
						<AxisControlSelection
							{...yAxisProps.max}
							addPaddingBottom={addYPaddingBottom}
							onBlur={onControlsBlur}
							onFocus={onControlsFocus}
							rotateTop
						/>

						<YAxisLabelContainer altTop={!enableXMinMax}>
							{({ height }) => {
								const shouldTruncate =
									// @ts-expect-error FIXME height can be undefined
									height < 500 && yAxisLabel?.length > (yLabelChars ?? DEFAULT_Y_LABEL_CHARS);
								return (
									<YAxisLabel title={shouldTruncate ? yAxisLabel : undefined}>
										{shouldTruncate
											? truncate(yAxisLabel, { length: yLabelChars ?? DEFAULT_Y_LABEL_CHARS })
											: yAxisLabel}
									</YAxisLabel>
								);
							}}
						</YAxisLabelContainer>

						<AxisControlSelection
							{...yAxisProps.min}
							addPaddingBottom={addYPaddingBottom}
							onBlur={onControlsBlur}
							onFocus={onControlsFocus}
							rotateBottom
						/>
					</YControlsArea>
				)}

				<Placeholder loading={isLoading} minShow={100} minHide={750} forceOnFirstRender={forceOnFirstRender}>
					<ChartContainer>
						{render({ chartSettings, setXAxisLabel, setYAxisLabel, setChartSettings, xAxisLabel, ...rest })}
					</ChartContainer>
				</Placeholder>
			</YControlsContainer>

			{enableXMinMax && (
				<XControlsContainer>
					<AxisControlSelection {...xAxisProps.min} onBlur={onControlsBlur} onFocus={onControlsFocus} />

					<XAxisLabelContainer>{Boolean(xAxisLabel?.length) && xAxisLabel}</XAxisLabelContainer>

					<AxisControlSelection {...xAxisProps.max} onBlur={onControlsBlur} onFocus={onControlsFocus} />
				</XControlsContainer>
			)}
		</Container>
	);
}

export default ForecastChartContainer;
