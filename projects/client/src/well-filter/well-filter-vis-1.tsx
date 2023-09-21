import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Breadcrumbs, Divider, Link } from '@material-ui/core';
import classNames from 'classnames';
import { Component } from 'react';

import { Zingchart } from '@/components';
import { Button } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import InfoIcon from '@/components/v2/misc/InfoIcon';
import { withAsync, withProgress } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { colorsArray, getBarConfig, opacityColorsArray, zingClearSelection } from '@/helpers/zing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
let cacheState: any = false;
let vis1GlobalCounter = 0;

const cleanHeaders = (props) => {
	const { wellHeaders, wellHeaderTypes } = props;
	const heads = Object.keys(wellHeaderTypes).filter((f) => wellHeaderTypes[f].visualization);
	return heads.map((h) => ({ label: wellHeaders[h], value: h }));
};

const initChartState = (props) => {
	const { vis1Headers } = props;
	return [
		{ index: 0, id: 'vis-1-chart-0', header: vis1Headers[0], psCols: new Set(), totalWells: 0 },
		{ index: 1, id: 'vis-1-chart-1', header: vis1Headers[1], psCols: new Set(), totalWells: 0 },
		{ index: 2, id: 'vis-1-chart-2', header: vis1Headers[2], psCols: new Set(), totalWells: 0 },
		{ index: 3, id: 'vis-1-chart-3', header: vis1Headers[3], psCols: new Set(), totalWells: 0 },
	];
};

function getChartData({ data, index }) {
	const colorFull = opacityColorsArray[index].full;
	const colorOpac = opacityColorsArray[index].opac;

	const zingConfig = {
		series: [
			{
				values: data.map((d) => [d._id, d.count]),
				'data-index': (data[0] || { parent: {} }).parent.index,
				'data-header': (data[0] || { parent: {} }).parent.header,
			},
		],
		scaleY: { visible: false },
		scaleX: {
			lineWidth: 0,
			item: { angle: -48 },
			tick: { lineWidth: 0 },
			itemsOverlap: true,
			maxItems: 20,
		},
		tooltip: {
			text: '%kt: %v',
			placement: 'node:top',
		},
		extras: {
			colorFull,
			colorOpac,
			legend: false,
			selectedState: true,
			time: false,
			valueBox: true,
			xGuide: false,
			yGuide: false,
			allowDownloadXLS: false,
			allowDownloadPDF: false,
		},
		adjustLayout: false,
	};

	return getBarConfig(zingConfig);
}

type WellFilterVis1Props = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	appliedFilters: any[];
	handleChange: (x) => void;
	vis1Headers: string[];
	filterResult?;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	vis1Filters: any[];
	deleteVis1Filter: (x) => void;
	changeVis1Filters: (x) => void;
	mainView: string;
	wellHeaders;
	className?: string;
	project;
	selectedWells?;
	wellHeaderTypes;
	applyVis1Filter: (wells, header, values, id) => void;
};

interface IWellIdsPayload {
	wells: string[];
	valid: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
class WellFilterVis1 extends Component<WellFilterVis1Props, any> {
	state = cacheState || {
		selectedCols: {},
		chartsBuilt: false,
		graphFiltered: false,
		charts: initChartState(this.props),
		cleanWellHeaders: cleanHeaders(this.props),
		countSelected: 0,
	};

	_isMounted = false;

	componentDidMount() {
		this._isMounted = true;
		this.getData({ revert: false, selectedWells: [] });
	}

	componentDidUpdate({ appliedFilters: prevFilters }) {
		const { appliedFilters } = this.props;

		if (JSON.stringify(appliedFilters) !== JSON.stringify(prevFilters)) {
			this.getData({ revert: true, selectedWells: [] });
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
		cacheState = this.state;
		cacheState.chartsBuilt = false;
		cacheState.charts.forEach((chart) => delete chart.data);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-promise-executor-return -- TODO eslint fix later
	SetState = (obj) => new Promise((r: any) => (!this._isMounted ? r('not mounted') : this.setState(obj, r)));

	getWellsIds = async () => {
		const { appliedFilters, project } = this.props;

		return new Promise((resolve) => {
			withProgress(
				postApi('/filters/getWellsIds', {
					filters: appliedFilters,
					maxCount: 2000,
					project: project?._id,
				}).then(resolve)
			);
		});
	};

	changeHeader = async (value, index) => {
		const { charts } = this.state;
		const { handleChange, vis1Headers } = this.props;

		vis1Headers[index] = value;
		charts[index].header = value;

		await handleChange({ vis1Headers });
		const { wells } = (await this.getWellsIds()) as IWellIdsPayload;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ charts }).then(() => {
			this.getData({ revert: false, selectedWells: [...wells] });
		});
	};

	removeCrumb = async (crumb, index) => {
		const { vis1Filters, deleteVis1Filter, changeVis1Filters } = this.props;
		const newVis1Filters = vis1Filters.slice(0, index);
		changeVis1Filters(newVis1Filters);
		await deleteVis1Filter(crumb);
	};

	graphFilter = async (chart, index) => {
		const { vis1Filters, handleChange, applyVis1Filter } = this.props;
		const { psCols, data, header } = chart;
		const values = [...psCols];
		let wells = new Set();

		values.forEach((col) => {
			const d = data.find((f) => f._id === col);
			if (d && d.wells) {
				wells = new Set([...wells, ...d.wells]);
			}
		});

		const id = vis1GlobalCounter++;

		vis1Filters.push({ header, values, index, id });

		handleChange({ vis1Filters });

		await applyVis1Filter([...wells], header, values, id);
	};

	onHit = (event) => {
		const { selectedCols, charts } = this.state;
		const { handleChange, selectedWells } = this.props;
		const wells = selectedWells || [];
		const { selected, nodeindex, scaletext, 'data-index': dataIndex, 'data-header': dataHeader } = event;
		const { data, psCols } = charts[dataIndex];
		let updateSel;

		if (!selectedCols[dataHeader]) {
			selectedCols[dataHeader] = new Set();
		}

		if (selected) {
			psCols.add(scaletext);
			selectedCols[dataHeader].add(scaletext);
			updateSel = new Set([...wells, ...(data[nodeindex]?.wells ?? [])]);
		} else {
			psCols.delete(scaletext);
			selectedCols[dataHeader].delete(scaletext);
			data[nodeindex].wells.forEach((w) => wells.delete(w));
			updateSel = new Set([...wells]);
		}

		if (!selectedCols[dataHeader].size) {
			delete selectedCols[dataHeader];
		}

		charts[dataIndex].psCols = psCols;

		const allSel = Boolean(!Object.keys(selectedCols).length);

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ charts, selectedCols });

		handleChange({
			allSelected: allSel,
			selectedWells: allSel ? new Set() : new Set([...updateSel]),
		});
	};

	getData = async ({ revert = false, selectedWells }) => {
		const { charts, selectedCols } = this.state;
		const { handleChange, project } = this.props;

		let wells;
		let valid = false;
		if (selectedWells.length > 0) {
			wells = selectedWells;
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ countSelected: selectedWells.length });
		} else {
			const { wells: resultWells, valid: resultValid } = (await this.getWellsIds()) as IWellIdsPayload;
			wells = resultWells;
			valid = resultValid;
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ countSelected: 0 });
		}

		if (valid || selectedWells) {
			const data = await withAsync(
				Promise.all(
					charts.map((c) => postApi('/filters/filterGetHeaderCounts', { wells, header: c.header, project }))
				)
			);
			const state = {};
			let wellSet = new Set();

			state['charts'] = charts.map((ch, i) => {
				const c = ch;
				const { id, index, header, psCols } = c;

				c.totalWells = 0;
				c.psCols = new Set();
				c.totalActual = wells.length;

				c.data = data[i].map((d) => {
					c.totalWells += d.count;
					wellSet = new Set([...wellSet, ...d.wells]);
					return { ...d, selectedCols, parent: { id, index, header, psCols } };
				});

				c.data = c.data.map((obj, j) => {
					const { count, wells: wellsObj, parent, selectedCols: selectedObj, _id } = obj;
					const newData = {
						count,
						wells: wellsObj,
						parent,
						selectedCols: selectedObj,
					};
					newData['_id'] = _id || `Other Type ${j}`;
					return newData;
				});

				c.chart = getChartData({ data: c.data, index: c.index });

				// TODO move this out of the .map
				if (revert && this._isMounted) {
					zingClearSelection(c.id);
				}

				return c;
			});

			state['selectedCols'] = {};

			state['graphFiltered'] = true;

			if (!selectedWells) {
				handleChange({ selectedWells: new Set(), allSelected: true });
			}

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState(state).then(() => {
				if (!revert) {
					this.createChart();
				}
			});
		}
	};

	createChart = () => {
		const { charts } = this.state;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ charts: charts.map((c) => ({ ...c, chart: getChartData(c) })), chartsBuilt: true });
	};

	clearVisFilter = () => {
		const { vis1Filters } = this.props;
		if (vis1Filters && vis1Filters.length) {
			this.removeCrumb(vis1Filters[0], 0);
		}
	};

	render() {
		const { charts, cleanWellHeaders, selectedCols, chartsBuilt } = this.state;
		const { mainView, vis1Filters, wellHeaders, className } = this.props;

		return (
			<section
				id='well-filter-vis-1-view'
				className={classNames(className, mainView !== 'vis1' && 'hide', !chartsBuilt && 'opacity-0')}
			>
				<h2 id='filter-header-h2' className='md-text'>
					{vis1Filters.length ? (
						<span
							id='filters-breadcrumb'
							css={`
								display: flex;
							`}
						>
							<Breadcrumbs separator='>'>
								{vis1Filters.map((filter, i) => {
									const { header, index } = filter;
									return (
										<Link
											component='button'
											underline='none'
											onClick={() => this.removeCrumb(filter, i)}
											key={`${header} ${i + 1}`}
											style={{ color: colorsArray[index] }}
										>
											{wellHeaders[header]}
											<FontAwesomeIcon
												css={`
													margin-left: 8px;
												`}
												icon={faTimes}
											/>
										</Link>
									);
								})}
							</Breadcrumbs>
							<Divider
								css={`
									margin: 0 12px;
								`}
								orientation='vertical'
								flexItem
							/>
							<Breadcrumbs>
								{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
								<Link underline='none' component='button' onClick={this.clearVisFilter} color='error'>
									<FontAwesomeIcon
										css={`
											margin-right: 8px;
										`}
										icon={faTimes}
									/>
									Clear Filter
								</Link>
							</Breadcrumbs>
						</span>
					) : (
						''
					)}
				</h2>
				<div id='vis-1-charts-container'>
					{charts.map((c, i) => (
						<div
							key={i + 1}
							id={`vis-1-chart-paper-${i}`}
							className={`vis-1-chart-paper vis-1-chart-paper-${i} on-hover-paper-1`}
						>
							{c.data ? (
								<div className='chart-header'>
									<h5>
										{c.totalWells !== c.totalActual && (
											<InfoIcon
												withRightMargin
												tooltipTitle='Each chart shows the top 20 results for the selected well header.'
											/>
										)}
										Total: {c.totalWells}
									</h5>
									<SelectField
										value={c.header}
										menuItems={cleanWellHeaders}
										id={`vis-1-chart-select${i}`}
										className='vis-1-chart-select'
										onChange={(v) => this.changeHeader(v.target.value, i)}
									/>
									{selectedCols[c.header] &&
									selectedCols[c.header].size &&
									selectedCols[c.header].size !== c.data.length ? (
										<Button
											onClick={() => this.graphFilter(c, i)}
											style={{
												color: colorsArray[i],
												borderBottom: `1px solid ${colorsArray[i]}`,
												borderRadius: 'unset',
												marginLeft: '1rem',
											}}
										>
											Filter
										</Button>
									) : (
										''
									)}
								</div>
							) : (
								''
							)}
							<Zingchart id={c.id} data={c.chart ?? {}} events={{ node_click: this.onHit }} />
						</div>
					))}
				</div>
			</section>
		);
	}
}

export default WellFilterVis1;
