import _ from 'lodash';
import { Component } from 'react';

import { IdCounter } from '@/helpers/Counter';
import {
	ZingChartScaleX,
	ZingchartData,
	ZingchartEvents,
	ZingchartModule,
	ZingchartRender,
	ZingchartSerie,
	ZingchartTheme,
	mergeZingchartConfigs,
	zingchart,
} from '@/helpers/zing';

type ZingMinMaxScale = Pick<ZingChartScaleX, 'minValue' | 'maxValue'>;

export interface RawZingchartProps {
	/** Don't change the id on runtime it will probably break */
	id?: string;
	className?: string;
	/** Zingchart modules to use */
	modules?: ZingchartModule[] | string;
	/** Zingchart events property */
	events?: ZingchartEvents;
	data: ZingchartData;
	/** Like `data` but will not cause rerenders, will be overwritten by `data` property */
	baseConfig?: ZingchartData;
	/** Theme https://www.zingchart.com/docs/tutorials/styling/themes */
	defaults?: ZingchartTheme;
	/**
	 * If true will rerender the chart instead of using zingchart.modify when needs to update data, eg fastline charts
	 * doesn't support modify
	 */
	rerenderOnModify?: boolean;

	/** If true, will reset the currrent scroll position of the legend to the top of the legend */
	resetLegendScrollOnModify?: boolean;
	/** If true, will reset zoom on scaleX minValue/maxValue or scaleY minValue/maxValue change */
	viewAllOnMinMaxChange?: boolean;
}

/**
 * React wrapper for zingchart
 *
 * @example
 * 	import { RawZingchart } from '@/components';
 * 	import { ZC_SHARED_CONFIG, ZC_CC_THEME } from '@/helpers/zing';
 *
 * 	<RawZingchart
 * 		data={{ type: 'line', series: [{ values: [1, 2, 3, 4] }] }}
 * 		baseConfig={ZC_SHARED_CONFIG}
 * 		defaults={ZC_CC_THEME}
 * 		modules={['cc-zoomout-plugin', 'selection-tool']}
 * 	/>;
 *
 * @note it is recommended to memoize at least the series values for performance reasons
 * @note keep extra customizations to the minimum
 */
class RawZingchart extends Component<RawZingchartProps> {
	static compareEvents(events: ZingchartEvents | undefined, prevEvents: ZingchartEvents | undefined) {
		return _.isEqual(Object.keys(events ?? {}).sort(), Object.keys(prevEvents ?? {}).sort());
	}

	/** Optimized serie comparison to avoid rerenders and allow a easier api */
	static compareSeries(series: ZingchartSerie[] | undefined = [], prevSeries: ZingchartSerie[] | undefined = []) {
		if (series === prevSeries) {
			return true;
		}
		if (series.length !== prevSeries.length) {
			return false;
		}
		return !series.find((_serie, index) => {
			const { values, ...rest } = series[index];
			const { values: prevValues, ...prevRest } = prevSeries[index];
			if (!_.isEqual(rest, prevRest)) {
				return true;
			}
			if (values?.length !== prevValues?.length) {
				return true;
			}
			if (values?.length > 2) {
				return values !== prevValues;
			}
			return !_.isEqual(values, prevValues);
		});
	}

	static compareScaleMinMax(curScale: ZingMinMaxScale = {}, prevScale: ZingMinMaxScale = {}) {
		const { minValue, maxValue } = curScale;
		const { minValue: prevMinValue, maxValue: prevMaxValue } = prevScale;
		return minValue === prevMinValue && maxValue === prevMaxValue;
	}

	static loadModules(modules: string) {
		return new Promise((resolve) => {
			zingchart.loadModules(modules, resolve);
		});
	}

	constructor(props: RawZingchartProps) {
		super(props);

		if (props.id) {
			this.id = props.id;
		}
	}

	componentDidMount() {
		this.renderChart();
	}

	componentDidUpdate(prevProps: this['props']) {
		const { data, events, viewAllOnMinMaxChange } = this.props;
		if (!RawZingchart.compareEvents(events, prevProps.events)) {
			this.renderChart();
		} else {
			const { series, ...actualData } = data;
			const { series: prevSeries, ...prevData } = prevProps.data;
			if (!RawZingchart.compareSeries(series, prevSeries) || !_.isEqual(actualData, prevData)) {
				this.modifyChart();
			}
		}
		if (viewAllOnMinMaxChange) {
			const { scaleX, scaleY } = data;
			const { scaleX: prevScaleX, scaleY: prevScaleY } = prevProps.data;
			if (
				!RawZingchart.compareScaleMinMax(scaleX, prevScaleX) ||
				!RawZingchart.compareScaleMinMax(scaleY, prevScaleY)
			) {
				this.viewAll();
			}
		}
	}

	componentWillUnmount() {
		this.unmount();
	}

	static counter = new IdCounter('_inpt_zingchart3?');

	id = RawZingchart.counter.nextId();

	getEvents() {
		const { events } = this.props;

		if (!events) {
			return {};
		}

		const mappedEvents = _.mapValues(
			events,
			(ev, key) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				(...args: any[]) =>
					this.props.events?.[key]?.(...args)
		);
		return mappedEvents;
		/* eslint-enable react/destructuring-assignment */
	}

	getData() {
		const { data, baseConfig = {} } = this.props;

		return mergeZingchartConfigs(baseConfig, data, { series: data.series?.filter(Boolean) }); // TODO is this needed? remove to keep as close to zingchart as possible
	}

	getModules() {
		const { modules } = this.props;
		if (Array.isArray(modules)) {
			return modules.join(',');
		}
		return modules;
	}

	getRenderConfig(): ZingchartRender {
		const id = this.id;
		const { defaults } = this.props;

		const data = this.getData();
		const events = this.getEvents();
		const modules = this.getModules();

		return {
			id,
			data,
			width: '100%',
			height: '100%',
			output: 'canvas',
			modules,
			events,
			defaults,
		};
	}

	unmount() {
		zingchart.exec(this.id, 'destroy');
	}

	modifyChart() {
		const { data, rerenderOnModify, resetLegendScrollOnModify } = this.props;

		if (resetLegendScrollOnModify) {
			// reset legend scroll on chart modification
			zingchart.exec(this.id, 'legendscroll', { plotindex: 0 });
		}
		if (rerenderOnModify) {
			this.renderChart();
			return;
		}

		zingchart.exec(this.id, 'modify', { data });
	}

	renderChart() {
		zingchart.render(this.getRenderConfig());
	}

	// https://www.zingchart.com/docs/api/methods#getobjectinfo
	// https://insidepetroleum.slack.com/archives/CL65ASJ3S/p1639493462061500?thread_ts=1638313008.031900&cid=CL65ASJ3S
	isZoomed() {
		const {
			minValue: minY,
			minValue_: minY_,
			maxValue: maxY,
			maxValue_: maxY_,
		} = zingchart.exec(this.id, 'getobjectinfo', { object: 'scale', name: 'scale-y' });
		const {
			minValue: minX,
			minValue_: minX_,
			maxValue: maxX,
			maxValue_: maxX_,
		} = zingchart.exec(this.id, 'getobjectinfo', { object: 'scale', name: 'scale-x' });

		return minY !== minY_ || maxY !== maxY_ || minX !== minX_ || maxX !== maxX_;
	}

	viewAll() {
		zingchart.exec(this.id, 'viewall');
	}

	render() {
		const { className } = this.props;
		return <div id={this.id} className={className} />;
	}
}

export default RawZingchart;
