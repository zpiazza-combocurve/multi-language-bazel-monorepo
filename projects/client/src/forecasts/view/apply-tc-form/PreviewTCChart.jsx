import { Component } from 'react';

import { capitalize } from '@/helpers/text';
import { clone } from '@/helpers/utilities';
import { PRIMARY_COLOR, colorsArray, lineConfig, lineSeriesConfig, zingLine } from '@/helpers/zing';

import { genSeriesData } from '../../charts/forecastChartHelper';

class PreviewTCChart extends Component {
	state = {};

	_isMounted = false;

	componentDidMount() {
		this._isMounted = true;
		this.initChart();
	}

	componentDidUpdate(prevProps) {
		const { applySeries, refreshFit } = this.props;
		const updateFit = refreshFit !== prevProps.refreshFit;
		const updateApplySeries = applySeries !== prevProps.applySeries;

		if (updateFit || updateApplySeries) {
			this.updateChart();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	SetState = (obj, cb) => {
		if (this._isMounted) {
			this.setState(obj, cb);
		}
	};

	initChart = async () => {
		const config = lineConfig({
			log: true,
			time: false,
			title: true,
		});

		const zingConfig = {
			...config,
			utc: undefined,
			timezone: undefined,
			extras: {
				crosshairX: true,
				crosshairY: true,
				time: false,
			},
		};

		config.scaleX.step = 1;
		zingLine('preview-chart-area', zingConfig);
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ config: zingConfig, loaded: true }, this.updateChart);
	};

	updateChart = () => {
		const { fit, typecurve } = this.props;
		if (!fit) {
			return;
		}

		const { config } = this.state;
		config.series = this.genSeries();
		config.title.text = typecurve.name;
		zingLine('preview-chart-area', config);
	};

	genSeries = () => {
		const { applySeries, fit, forecastType } = this.props;
		const { fitType, P_dict, ratio_P_dict } = fit;

		const parsedP_dict = fitType === 'rate' ? P_dict : ratio_P_dict;

		const names = Object.keys(parsedP_dict);
		const series = names
			.map((pSeries, i) => {
				const { segments } = parsedP_dict[pSeries];
				if (!segments?.length) {
					return null;
				}

				const temp = clone(segments);
				const startIdx = segments[0].start_idx;

				temp.forEach((_segment) => {
					const segment = _segment;
					segment.start_idx -= startIdx;
					segment.end_idx -= startIdx;

					if (segment.sw_idx) {
						segment.sw_idx -= startIdx;
					}
				});

				const config = lineSeriesConfig({
					color: forecastType === 'deterministic' && applySeries === pSeries ? PRIMARY_COLOR : colorsArray[i],
				});
				const data = genSeriesData({
					chartResolution: 30,
					finalIdx: segments[segments.length - 1].end_idx,
					index: true,
					segments: temp,
					yearsPast: 0,
				});

				return {
					...config,
					text: capitalize(pSeries),
					values: data,
				};
			})
			.filter((value) => value !== null);

		return series;
	};

	render() {
		return (
			<section className='preview-chart-container'>
				<div id='preview-chart-area' />
			</section>
		);
	}
}

export default PreviewTCChart;
