import { difference, get, union } from 'lodash-es';
import { Component } from 'react';

import { Placeholder, Zingchart } from '@/components';
import { SelectionActions } from '@/components/SelectionActions';
import { Paper } from '@/components/v2';
import { isDevelopmentRoute } from '@/helpers/env';
import { getBarConfig, phaseColors, phaseColorsOpac, zingClearSelection } from '@/helpers/zing';

import { DEFAULT_KEY_PROPS, DiagMenuBtn, diagUnits } from './shared';

const getHistogramConfig = ({ scaleXValues = [], series = [] } = {}) => ({
	series,
	scaleY: { visible: false },
	scaleX: {
		values: scaleXValues,
		decimals: 2,
		itemsOverlap: true,
		lineWidth: 0,
		maxItems: 30,
		tick: {
			lineWidth: 0,
		},
		item: {
			angle: -48,
			textAlign: 'right',
			wrapText: true,
		},
	},
	plot: {
		aspect: 'histogram',
		dataAppendSelection: true,
	},
	extras: {
		adjustLayout: false,
		animation: false,
		legend: false,
		selectedState: true,
		time: false,
		title: 'Histogram',
		valueBox: true,
		yLabel: 'Frequency',
	},
	gui: {
		behaviors: [
			{ id: 'DownloadCSV', enabled: 'none' },
			{ id: 'DownloadSVG', enabled: 'none' },
			{ id: 'DownloadXLS', text: 'Download XLS', enabled: 'all', 'custom-function': 'export2excel()' },
			{ id: 'HideGuide', enabled: 'none' },
			{ id: 'LinScale', enabled: 'none' },
			{ id: 'LogScale', enabled: 'none' },
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
});

class Histogram extends Component {
	constructor(props) {
		super(props);
		this.state = {
			keyProps: { ...DEFAULT_KEY_PROPS },
			selectedWells: [],
			chartConfig: getBarConfig(getHistogramConfig()),
		};
	}

	async componentDidMount() {
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

	binnedWells = [];

	handleSelection = (event) => {
		const { selection } = event;
		const wellIds = [];
		selection[0].forEach((nodeIndex) => {
			wellIds.push(...this.binnedWells[nodeIndex]);
		});

		this.setState(({ selectedWells }) => ({
			selectedWells: union(selectedWells, wellIds),
		}));
	};

	handleNodeClick = (event) => {
		const { selectedWells } = this.state;
		const { nodeindex, selected } = event;
		const wellIds = this.binnedWells[nodeindex];
		this.setState({ selectedWells: selected ? union(selectedWells, wellIds) : difference(selectedWells, wellIds) });
	};

	handleMenuItemClick = (event) => {
		if (event.menuitemid === 'clearSelection') {
			this.setState({ selectedWells: [] });
		}
	};

	handleFilter = (val) => {
		const { selectedWells } = this.state;
		const { onFilter } = this.props;

		onFilter('histogram', selectedWells, val);
		this.clearFilter();
	};

	adjustChart = () => {
		const { phase } = this.props;
		const [binned, binStep] = this.genHistData();
		if (binned && binStep) {
			const barConfig = getBarConfig(
				getHistogramConfig({
					scaleXValues: binStep,
					series: [
						{
							backgroundColor: phaseColorsOpac[phase],
							borderColor: phaseColors[phase],
							borderWidth: 1,
							values: binned,
						},
					],
				})
			);

			const withUpdatedValueBox = {
				...barConfig,
				plot: {
					...barConfig.plot,
					valueBox: {
						...barConfig.plot.valueBox,
						color: phaseColors[phase],
					},
				},
			};

			this.setState({
				chartConfig: withUpdatedValueBox,
			});
		} else {
			this.setState({
				chartConfig: null,
			});
		}
	};

	clearFilter = () => this.setState({ selectedWells: [] }, () => zingClearSelection('hist-chart'));

	setKeyProps = (key, label, unitsIn = null) => {
		const { phase } = this.props;
		const units = unitsIn?.[phase] ?? unitsIn ?? diagUnits[key]?.[phase];
		this.setState({ keyProps: { curVal: key, label, units } }, this.adjustChart);
	};

	genHistData = (maxBins = 25, binRounding = 2) => {
		const {
			keyProps: { curVal },
		} = this.state;

		const { diagData } = this.props;
		const filtered = diagData.filter((val) => Number.isFinite(get(val.diagnostics, curVal)));
		const sorted = filtered.sort((a, b) => {
			const val1 = get(a.diagnostics, curVal);
			const val2 = get(b.diagnostics, curVal);

			return val1 - val2;
		});

		const len = sorted.length;
		if (len < 1) {
			return [];
		}

		const minVal = get(sorted[0].diagnostics, curVal);
		const maxVal = get(sorted[len - 1].diagnostics, curVal);
		const smallKey = maxVal - minVal <= 10;
		const bins = smallKey ? 11 : Math.min(Math.round(Math.sqrt(len)), maxBins);
		const binRange = Math.ceil(((maxVal - minVal) / bins) * 10 ** binRounding) / 10 ** binRounding;

		const binned = [];
		const binnedWells = [];

		for (let i = 0; i < len; i++) {
			const val = get(sorted[i].diagnostics, curVal);
			const idx = binRange !== 0 ? Math.round((val - minVal) / binRange) : 0;

			if (!binned[idx]) {
				binned[idx] = 0;
				binnedWells[idx] = [];
			}

			binned[idx]++;
			binnedWells[idx].push(sorted[i].well);
		}

		this.binnedWells = binnedWells;
		this.sortedDiagData = sorted;

		const binStep = `${minVal}:${maxVal + binRange / 2}:${binRange}`;
		return [binned, binStep];
	};

	render() {
		const { keyProps, selectedWells, chartConfig } = this.state;
		const { getComparisonItems, phase, isLoaded } = this.props;

		const shouldDisplayChart = chartConfig && isLoaded;

		return (
			<Paper id='hist-chart-container'>
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
						id='hist-chart'
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

export default Histogram;
