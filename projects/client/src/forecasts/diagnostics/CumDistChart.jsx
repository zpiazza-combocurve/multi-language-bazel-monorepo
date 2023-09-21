import { difference, get, union } from 'lodash-es';
import { Component } from 'react';

import { SelectionActions } from '@/components/SelectionActions';
import { Placeholder, Zingchart } from '@/components/index';
import { Paper } from '@/components/v2';
import { isDevelopmentRoute } from '@/helpers/env';
import { getScatterConfig, phaseColors, zingClearSelection } from '@/helpers/zing';

import { DEFAULT_KEY_PROPS, DiagMenuBtn, diagUnits } from './shared';

const getCumDistChartConfig = ({ scaleY = {}, series = [] } = {}) => ({
	legend: undefined,
	extras: {
		adjustLayout: false,
		crosshairX: true,
		crosshairY: true,
		selectedState: true,
		time: false,
		title: 'Cumulative Distribution',
		xLabel: 'Percentile',
		toggleScale: true,
	},
	plot: {
		dataAppendSelection: true,
	},
	plotarea: {
		marginLeft: '10%',
	},
	gui: {
		behaviors: [
			{ id: 'DownloadCSV', enabled: 'none' },
			{ id: 'DownloadSVG', enabled: 'none' },
			{ id: 'DownloadXLS', text: 'Download XLS', enabled: 'all', 'custom-function': 'export2excel()' },
			{ id: 'HideGuide', enabled: 'none' },
			{ id: 'LinScale', enabled: 'all' },
			{ id: 'LogScale', enabled: 'all' },
			{ id: 'Print', enabled: 'none' },
			{ id: 'Reload', enabled: 'none' },
			{ id: 'SaveAsImagePNG', enabled: 'none' },
			{ id: 'ViewAll', enabled: 'none' },
			{ id: 'ViewDataTable', enabled: 'none' },
			{ id: 'ViewSource', enabled: isDevelopmentRoute() ? 'all' : 'none' },
			{ id: 'ZoomIn', enabled: 'none' },
			{ id: 'ZoomOut', enabled: 'none' },
		],
	},
	scaleY,
	series,
});

class CumDistChart extends Component {
	constructor(props) {
		super(props);
		this.state = {
			keyProps: { ...DEFAULT_KEY_PROPS },
			selectedWells: [],
			chartConfig: getScatterConfig(getCumDistChartConfig()),
		};
	}

	componentDidMount() {
		this.adjustChart();
	}

	componentDidUpdate(prevProps) {
		const { clearSelection, diagData, resetKeyProps, phase } = this.props;
		const needClear = clearSelection !== prevProps.clearSelection;
		const needRefresh = diagData !== prevProps.diagData;
		const resetKeyPropsChanged = resetKeyProps !== prevProps.resetKeyProps;
		const phaseChanged = phase !== prevProps.phase;

		if (needRefresh) {
			this.adjustChart();
		}
		if (needClear) {
			this.clearFilter();
		}
		if (resetKeyPropsChanged) {
			const { curVal, label, units } = DEFAULT_KEY_PROPS;
			this.setKeyProps(curVal, label, units);
		}
		if (phaseChanged) {
			const { keyProps } = this.state;
			const { curVal, label } = keyProps;
			const { curVal: defaultCurVal, label: defaultLabel } = DEFAULT_KEY_PROPS;
			this.setKeyProps(curVal ?? defaultCurVal, label ?? defaultLabel);
		}
	}

	sortedDiagData = [];

	handleSelection = (event) => {
		const { selection } = event;
		const wellIds = [];
		selection[0].forEach((index) => wellIds.push(this.sortedDiagData[index].well));
		this.setState(({ selectedWells }) => ({
			selectedWells: union(selectedWells, wellIds),
		}));
	};

	handleNodeClick = (event) => {
		const { nodeindex, selected } = event;
		const wellId = this.sortedDiagData[nodeindex].well;

		this.setState(({ selectedWells }) => ({
			selectedWells: selected ? union(selectedWells, [wellId]) : difference(selectedWells, [wellId]),
		}));
	};

	handleMenuItemClick = (event) => {
		if (event.menuitemid === 'clearSelection') {
			this.setState({ selectedWells: [] });
		}
	};

	handleFilter = (val) => {
		const { selectedWells } = this.state;
		const { onFilter } = this.props;

		onFilter('cum_dist', selectedWells, val);
		this.clearFilter();
	};

	adjustChart = () => {
		const [minValue, series] = this.genSeries();
		if (series[0].values?.length) {
			this.setState({
				chartConfig: getScatterConfig(getCumDistChartConfig({ scaleY: { minValue }, series })),
			});
		} else {
			this.setState({
				chartConfig: null,
			});
		}
	};

	genSeries = () => {
		const {
			keyProps: { curVal },
		} = this.state;

		const { phase, diagData } = this.props;
		const filtered = diagData.filter((val) => Number.isFinite(get(val.diagnostics, curVal)));
		const sorted = filtered.sort((a, b) => {
			const val1 = get(a.diagnostics, curVal);
			const val2 = get(b.diagnostics, curVal);

			return val1 - val2;
		});

		const len = sorted.length;
		const retObj = {
			values: [],
			marker: {
				type: 'circle',
				backgroundColor: phaseColors[phase],
			},
		};

		for (let i = 0; i < len; i++) {
			const value = [(i / len) * 100, get(sorted[i].diagnostics, curVal)];
			retObj.values.push(value);
		}

		this.sortedDiagData = sorted;
		return [get(sorted[0]?.diagnostics, curVal) || [], [retObj]];
	};

	clearFilter = () => this.setState({ selectedWells: [] }, () => zingClearSelection('cum-dist-chart'));

	setKeyProps = (key, label, unitsIn = null) => {
		const { phase } = this.props;
		const units = unitsIn?.[phase] ?? unitsIn ?? diagUnits[key]?.[phase];
		this.setState({ keyProps: { curVal: key, label, units } }, this.adjustChart);
	};

	render() {
		const { keyProps, selectedWells, chartConfig } = this.state;
		const { getComparisonItems, phase, isLoaded } = this.props;

		const shouldDisplayChart = chartConfig && isLoaded;

		return (
			<Paper id='cum-dist-chart-container'>
				<div className='chart-header'>
					<DiagMenuBtn
						additionalItems={getComparisonItems()}
						changeVal={this.setKeyProps}
						phase={phase}
						{...keyProps}
					/>

					<SelectionActions
						clearCurrentActive
						// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
						onClearFilter={this.clearFilter}
						onFilterOut={() => this.handleFilter(false)}
						onFilterTo={() => this.handleFilter(true)}
						selectedCount={selectedWells.length}
					/>
				</div>
				{shouldDisplayChart ? (
					<Zingchart
						id='cum-dist-chart'
						data={chartConfig}
						modules='selection-tool'
						events={{
							'zingchart.plugins.selection-tool.selection': this.handleSelection,
							menu_item_click: this.handleMenuItemClick,
							node_click: this.handleNodeClick,
						}}
					/>
				) : (
					<Placeholder empty={!shouldDisplayChart} text={isLoaded ? 'No data' : 'Loading chart data'} />
				)}
			</Paper>
		);
	}
}

CumDistChart.defaultProps = {
	diagData: new Set(),
};

export default CumDistChart;
