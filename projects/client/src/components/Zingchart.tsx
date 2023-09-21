import { ElementRef, ForwardedRef, forwardRef } from 'react';

import RawZingchart, { RawZingchartProps } from '@/components/RawZingchart';
import { ZOOM_EVENTS, ZingchartData, zingJoinModules } from '@/helpers/zing';

import '@/helpers/zingchart/cc-zoomout-plugin';

import DebouncedValue from './DebouncedValue';
import ThrottledValue from './ThrottledValue';
import { FASTLINE_CONFIG, LITE_CONFIG } from './Zingchart/config';

export * from './Zingchart/selection';

const DEFAULT_THROTTLE = 1000;
const DEFAULT_DEBOUNCE = 1000;

/**
 * To help with truthy and default values props for debouce and throttle times
 *
 * @example
 * 	getWithDefault(true, 1000); // 1000
 * 	getWithDefault(500, 1000); // 500
 */
function getWithDefault(val: number | true, def: number) {
	if (val === true) {
		return def;
	}
	return val;
}

export type ZingchartProps = RawZingchartProps & {
	disableContextMenu?: boolean;
	/**
	 * Throtles the chart rendering, pass a number for changing throttle speed by milliseconds. Takes precendence over
	 * debounce
	 */
	throttle?: number | boolean; // throttle takes precedence
	/**
	 * Debounces the chart rendering, pass a number for changing debounce speed by milliseconds. `throttle` takes
	 * precendence over debounce
	 */
	debounce?: number | boolean;
};

/** RawZingchart wrapper with some defaults zoom event handlers */
function Zingchart(
	{ disableContextMenu, events, modules, debounce, throttle, ...props }: ZingchartProps,
	ref: ForwardedRef<ElementRef<typeof RawZingchart>>
) {
	const { data } = props;

	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const extendedEvents = { ...ZOOM_EVENTS(), ...events };

	const getChart = (processedData: ZingchartData) => (
		<RawZingchart
			ref={ref}
			css={{ width: '100%', height: '100%' }}
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			baseConfig={processedData?.type === 'fastline' ? FASTLINE_CONFIG() : LITE_CONFIG()}
			rerenderOnModify={processedData?.type === 'fastline'}
			resetLegendScrollOnModify
			events={disableContextMenu ? { ...extendedEvents, contextmenu: () => false } : extendedEvents}
			modules={zingJoinModules(modules, 'cc-zoomout-plugin')}
			{...props}
			data={processedData}
		/>
	);

	if (throttle !== false && throttle != null) {
		return (
			<ThrottledValue value={data} delay={getWithDefault(throttle, DEFAULT_THROTTLE)}>
				{getChart}
			</ThrottledValue>
		);
	}

	if (debounce !== false && debounce != null) {
		return (
			<DebouncedValue value={data} delay={getWithDefault(debounce, DEFAULT_DEBOUNCE)}>
				{getChart}
			</DebouncedValue>
		);
	}

	return getChart(data);
}

export default Object.assign(forwardRef(Zingchart), {
	CROSSHAIR: {
		SCALE: {
			exact: true,
			lineColor: '#8c8c8c',
			plotLabel: {
				visible: false,
			},
			scaleLabel: {
				alpha: 0.6,
				backgroundColor: '#8c8c8c',
				borderColor: 'transparent',
				borderRadius: '5px',
				fontColor: '#ffffff',
				fontWeight: 'bold',
				textAlpha: 1,
			},
		},
	},
	SCALE: {
		MONTHLY: { step: '3month', thousandsSeparator: ',', transform: { type: 'date', all: '%m/%d/%Y' } },
		LOG: { progression: 'log' },
	},
});
