// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20230117181345-tcfit-d1-eff.js');

let db;
let mongod;
let client;
let configCollection;
let tcFitCollection;

// configs objects for testing

const config1Key = '20230113t233253m614t4qqq';
const config2Key = '20230113t233253m614t4qqp';
const config3Key = '20230113t233253m614t4qqo';
const config4Key = '20230113t233253m614t4qqn';

const oldConfig1 = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [0, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [0, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		water: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [0, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'd1_eff_test',
};

const oldConfig2 = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [2, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [3, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		water: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [4, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'test',
};

const oldConfig3NoWater = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [0, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [3, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'no water test',
};

const newConfig1 = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [1, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [1, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		water: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [1, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'd1_eff_test',
};

const newConfig2 = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [2, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [3, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		water: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [4, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'test',
};

const newConfig3NoWater = {
	configuration: {
		align: 'align',
		normalize: false,
		resolution: 'monthly',
		phases: {
			oil: true,
			gas: true,
			water: true,
		},
		oil: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'gas',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [1, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
		gas: {
			addSeries: 'average',
			addSeriesFitRange: ['2023-01-13T23:32:40.701Z', '2083-01-13T06:00:00.000Z'],
			applySeries: 'average',
			b: [-2, -0.001],
			b0: [-10, -0.001],
			b2: [0.001, 2],
			b1: [0.001, 2],
			basePhase: 'oil',
			best_fit_q_peak: {
				method: 'P50',
				range: [1, 99],
			},
			buildup: {
				apply_ratio: false,
				apply: true,
				buildup_ratio: 0.1,
				days: 0,
			},
			D_lim_eff: 8,
			D1_eff: [3, 99],
			fit_complexity: 'complex',
			minus_t_decline_t_0: [1, 300],
			minus_t_elf_t_peak: [1, 5000],
			minus_t_peak_t0: [0, 1000],
			p1_range: [-10000, 12500],
			phaseType: 'rate',
			q_final: 0.8,
			q_peak: [0, 10000],
			TC_model: 'segment_arps_4_wp_free_b1',
			well_life: 60,
		},
	},
	name: 'no water test',
};

const noTcFormConfig = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('5f57951e2f8dda001231bf4d'),
	chart: {
		configurations: {},
		defaultConfiguration: null,
	},
	deterministicGridChart: {
		configurations: {
			'20201212t000209m835r710o': {
				configuration: {
					dataSettings: {
						xAxis: 'time',
						daily: [],
						forecast: [],
						monthly: ['oil', 'gas', 'water'],
					},
					graphSettings: {
						numOfCharts: 4,
						xLogScale: false,
						xPadding: 10,
						yLogScale: true,
						yMaxPadding: 10,
						yMax: 50000,
						yMin: 0.1,
						yPadding: 10,
						chartResolution: 10,
						yearsBefore: 'all',
						yearsPast: 2,
					},
				},
				name: 'gas oil',
			},
			'20210125t180450m6924yecv': {
				configuration: {
					dataSettings: {
						xAxis: 'time',
						daily: [],
						forecast: ['oil', 'gas', 'water'],
						monthly: ['oil', 'gas', 'water'],
					},
					graphSettings: {
						numOfCharts: 4,
						xLogScale: false,
						xPadding: 10,
						yLogScale: true,
						yMaxPadding: 10,
						yMax: 50000,
						yMin: 0.1,
						yPadding: 10,
						chartResolution: 10,
						yearsBefore: 'all',
						yearsPast: 2,
						cumMin: 0,
						cumMax: 100000,
					},
				},
				name: '3 phases Config',
			},
		},
		defaultConfiguration: '20210125t180450m6924yecv',
	},
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	user: ObjectId('5ee420d6516d9a0012c8e841'),
	__v: 0,
	comparisonGridChart: {
		configurations: {
			'20210125t183102m8133vpp0': {
				configuration: {
					dataSettings: {
						xAxis: 'time',
						daily: [],
						forecast: ['oil'],
						monthly: ['oil'],
					},
					graphSettings: {
						numOfCharts: 4,
						xLogScale: false,
						xPadding: 10,
						yLogScale: true,
						yMaxPadding: 10,
						yMax: 50000,
						yMin: 0.1,
						yPadding: 10,
						chartResolution: 10,
						yearsBefore: 'all',
						yearsPast: 2,
						cumMin: 0,
						cumMax: 100000,
					},
				},
				name: 'Oil Comparison',
			},
			'20210125t183117m477k3xii': {
				configuration: {
					dataSettings: {
						xAxis: 'time',
						daily: [],
						forecast: ['gas'],
						monthly: ['gas'],
					},
					graphSettings: {
						numOfCharts: 4,
						xLogScale: false,
						xPadding: 10,
						yLogScale: true,
						yMaxPadding: 10,
						yMax: 50000,
						yMin: 0.1,
						yPadding: 10,
						chartResolution: 10,
						yearsBefore: 'all',
						yearsPast: 2,
						cumMin: 0,
						cumMax: 100000,
					},
				},
				name: 'Gas Comparison',
			},
			'20210125t183129m576wscdw': {
				configuration: {
					dataSettings: {
						xAxis: 'time',
						daily: [],
						forecast: ['gas', 'oil'],
						monthly: ['gas', 'oil'],
					},
					graphSettings: {
						numOfCharts: 4,
						xLogScale: false,
						xPadding: 10,
						yLogScale: true,
						yMaxPadding: 10,
						yMax: 50000,
						yMin: 0.1,
						yPadding: 10,
						chartResolution: 10,
						yearsBefore: 'all',
						yearsPast: 2,
						cumMin: 0,
						cumMax: 100000,
					},
				},
				name: 'Oil & Gas Comparison',
			},
		},
		defaultConfiguration: '20210125t183102m8133vpp0',
	},
};

const configBeforeMigration = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('6388c9c8f63f637b5715ae47'),
	tcFitForm: {
		configurations: {
			[config1Key]: oldConfig1,
			[config2Key]: oldConfig2,
			[config3Key]: {},
			[config4Key]: oldConfig3NoWater,
		},
		defaultConfiguration: config1Key,
	},
};

// No TC Fit Form Configurations
// This is the document shape listed in bug ticket
// https://combocurve.atlassian.net/browse/CC-21859
const configTCFormNoConfigs = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('6388c9c8f63f637b5715ae46'),
	tcFitForm: {
		configurations: {},
		defaultConfiguration: null,
	},
};

const configAfterMigration = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('6388c9c8f63f637b5715ae47'),
	tcFitForm: {
		configurations: {
			[config1Key]: newConfig1,
			[config2Key]: newConfig2,
			[config3Key]: {},
			[config4Key]: newConfig3NoWater,
		},
		defaultConfiguration: config1Key,
	},
};

// tc fit settings for testing
const oldTCFitSetting = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('5e31d286e2b8443a2c53f1b0'),
	phase: 'oil',
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	typeCurve: ObjectId('5e31b8c59a6b9a00122537ad'),
	P_dict: {
		P10: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 1097.8572337138014,
					q_start: 1097.8572337138014,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.013030286090696704,
					D_eff: 0.6916666264258254,
					b: 2,
					end_idx: 1,
					name: 'arps',
					q_end: 1083.8255080031633,
					q_start: 1097.8572337138014,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.012532532023875288,
					D_eff: 0.8130374720194633,
					D_exp: 0.00017501915738310338,
					D_exp_eff: 0.06192534841780428,
					b: 1.0480496915638957,
					end_idx: 17988,
					name: 'arps_modified',
					q_end: 2.0001113571365328,
					q_start: 1070.2383215040202,
					q_sw: 18.179037042113443,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 2,
					sw_idx: 5377.573262790849,
					target_D_eff_sw: 0.06,
				},
			],
		},
		P50: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 609.8494027356817,
					q_start: 609.8494027356817,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.018911861563229302,
					D_eff: 0.7401950098777602,
					b: 2,
					end_idx: 42,
					name: 'arps',
					q_end: 379.04470463613205,
					q_start: 609.8494027356817,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.007255432900403153,
					D_eff: 0.7605439612334867,
					D_exp: 0.00017361527595436272,
					D_exp_eff: 0.06144421069853501,
					b: 0.79017564684393,
					end_idx: 10114,
					name: 'arps_modified',
					q_end: 2.0003360495474554,
					q_start: 376.29645357696944,
					q_sw: 3.341889522720445,
					realized_D_eff_sw: 0.06000000000000005,
					slope: -1,
					start_idx: 43,
					sw_idx: 7157.91691139229,
					target_D_eff_sw: 0.06,
				},
			],
		},
		P90: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 290.20034468038887,
					q_start: 290.20034468038887,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.020517297907817717,
					D_eff: 0.7499053065515386,
					b: 2,
					end_idx: 41,
					name: 'arps',
					q_end: 177.18814516253187,
					q_start: 290.20034468038887,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.007558899229868243,
					D_eff: 0.8204936831904673,
					D_exp: 0.00017213363996351479,
					D_exp_eff: 0.060936157306971994,
					b: 0.5149984554902247,
					end_idx: 2361,
					name: 'arps_modified',
					q_end: 2.0001889368961603,
					q_start: 175.84755237736397,
					q_sw: 0.11366484750275682,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 42,
					sw_idx: 11065.616157699176,
					target_D_eff_sw: 0.06,
				},
			],
		},
		best: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 478.8783320869812,
					q_start: 478.8783320869812,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.014944381950152843,
					D_eff: 0.7103197539678031,
					b: 2,
					end_idx: 42,
					name: 'arps',
					q_end: 318.87489083262216,
					q_start: 478.8783320869812,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.006574497280671471,
					D_eff: 0.6964460746423221,
					D_exp: 0.0001751050471772814,
					D_exp_eff: 0.061954776528106215,
					b: 1.0637373546935887,
					end_idx: 14730,
					name: 'arps_modified',
					q_end: 2.000000001143259,
					q_start: 316.77789369900324,
					q_sw: 10.484221868290941,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 43,
					sw_idx: 5268.683530980799,
					target_D_eff_sw: 0.06,
				},
			],
		},
	},
	__v: 0,
	adjusted: true,
	align: 'align',
	settings: {
		b2: [0, 2],
		D_lim_eff: 6,
		D1_eff: [0, 99],
		eur_percentile: true,
		p1_range: [-275, 21883],
		q_final: 2,
		TC_model: 'segment_arps_4_wp',
		well_life: 60,
		buildup: {
			apply_ratio: true,
			apply: true,
			buildup_ratio: 1,
			days: 180,
		},
		add_series: {
			type: 'collect_prod',
			fit_range: ['2015-04-15T06:00:00.000Z', '2079-07-15T06:00:00.000Z'],
		},
	},
	fitType: 'rate',
	ratio_P_dict: {
		P10: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		P50: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		P90: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		best: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
	},
};

const newTCFitSettings = {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	_id: ObjectId('5e31d286e2b8443a2c53f1b0'),
	phase: 'oil',
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	typeCurve: ObjectId('5e31b8c59a6b9a00122537ad'),
	P_dict: {
		P10: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 1097.8572337138014,
					q_start: 1097.8572337138014,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.013030286090696704,
					D_eff: 0.6916666264258254,
					b: 2,
					end_idx: 1,
					name: 'arps',
					q_end: 1083.8255080031633,
					q_start: 1097.8572337138014,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.012532532023875288,
					D_eff: 0.8130374720194633,
					D_exp: 0.00017501915738310338,
					D_exp_eff: 0.06192534841780428,
					b: 1.0480496915638957,
					end_idx: 17988,
					name: 'arps_modified',
					q_end: 2.0001113571365328,
					q_start: 1070.2383215040202,
					q_sw: 18.179037042113443,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 2,
					sw_idx: 5377.573262790849,
					target_D_eff_sw: 0.06,
				},
			],
		},
		P50: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 609.8494027356817,
					q_start: 609.8494027356817,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.018911861563229302,
					D_eff: 0.7401950098777602,
					b: 2,
					end_idx: 42,
					name: 'arps',
					q_end: 379.04470463613205,
					q_start: 609.8494027356817,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.007255432900403153,
					D_eff: 0.7605439612334867,
					D_exp: 0.00017361527595436272,
					D_exp_eff: 0.06144421069853501,
					b: 0.79017564684393,
					end_idx: 10114,
					name: 'arps_modified',
					q_end: 2.0003360495474554,
					q_start: 376.29645357696944,
					q_sw: 3.341889522720445,
					realized_D_eff_sw: 0.06000000000000005,
					slope: -1,
					start_idx: 43,
					sw_idx: 7157.91691139229,
					target_D_eff_sw: 0.06,
				},
			],
		},
		P90: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 290.20034468038887,
					q_start: 290.20034468038887,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.020517297907817717,
					D_eff: 0.7499053065515386,
					b: 2,
					end_idx: 41,
					name: 'arps',
					q_end: 177.18814516253187,
					q_start: 290.20034468038887,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.007558899229868243,
					D_eff: 0.8204936831904673,
					D_exp: 0.00017213363996351479,
					D_exp_eff: 0.060936157306971994,
					b: 0.5149984554902247,
					end_idx: 2361,
					name: 'arps_modified',
					q_end: 2.0001889368961603,
					q_start: 175.84755237736397,
					q_sw: 0.11366484750275682,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 42,
					sw_idx: 11065.616157699176,
					target_D_eff_sw: 0.06,
				},
			],
		},
		best: {
			segments: [
				{
					D: 0,
					D_eff: 0,
					end_idx: -1,
					name: 'exp_inc',
					q_end: 478.8783320869812,
					q_start: 478.8783320869812,
					slope: 1,
					start_idx: -180,
				},
				{
					D: 0.014944381950152843,
					D_eff: 0.7103197539678031,
					b: 2,
					end_idx: 42,
					name: 'arps',
					q_end: 318.87489083262216,
					q_start: 478.8783320869812,
					slope: -1,
					start_idx: 0,
				},
				{
					D: 0.006574497280671471,
					D_eff: 0.6964460746423221,
					D_exp: 0.0001751050471772814,
					D_exp_eff: 0.061954776528106215,
					b: 1.0637373546935887,
					end_idx: 14730,
					name: 'arps_modified',
					q_end: 2.000000001143259,
					q_start: 316.77789369900324,
					q_sw: 10.484221868290941,
					realized_D_eff_sw: 0.060000000000000164,
					slope: -1,
					start_idx: 43,
					sw_idx: 5268.683530980799,
					target_D_eff_sw: 0.06,
				},
			],
		},
	},
	__v: 0,
	adjusted: true,
	align: 'align',
	settings: {
		b2: [0, 2],
		D_lim_eff: 6,
		D1_eff: [1, 99],
		eur_percentile: true,
		p1_range: [-275, 21883],
		q_final: 2,
		TC_model: 'segment_arps_4_wp',
		well_life: 60,
		buildup: {
			apply_ratio: true,
			apply: true,
			buildup_ratio: 1,
			days: 180,
		},
		add_series: {
			type: 'collect_prod',
			fit_range: ['2015-04-15T06:00:00.000Z', '2079-07-15T06:00:00.000Z'],
		},
	},
	fitType: 'rate',
	ratio_P_dict: {
		P10: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		P50: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		P90: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
		best: {
			segments: [],
			diagnostics: null,
			basePhase: null,
			x: 'time',
		},
	},
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	configCollection = db.collection('forecast-configurations');
	tcFitCollection = db.collection('type-curve-fits');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('update tcFit configs d1_eff to default of 1 instead of 0', () => {
	test('up', async () => {
		await configCollection.insertMany([configBeforeMigration, configTCFormNoConfigs, noTcFormConfig]);
		await tcFitCollection.insertOne(oldTCFitSetting);

		await up({ db });

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDoc = await configCollection.findOne({ _id: ObjectId('6388c9c8f63f637b5715ae47') });
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDocNoTcForm = await configCollection.findOne({ _id: ObjectId('5f57951e2f8dda001231bf4d') });
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDocTCFormNoConfigs = await configCollection.findOne({ _id: ObjectId('6388c9c8f63f637b5715ae46') });

		const tcFitDoc = await tcFitCollection.findOne();

		expect(configDoc).toStrictEqual(configAfterMigration);
		expect(configDocNoTcForm).toStrictEqual(noTcFormConfig);
		expect(configDocTCFormNoConfigs).toStrictEqual(configTCFormNoConfigs);
		expect(tcFitDoc).toStrictEqual(newTCFitSettings);
	});

	test('down', async () => {
		await configCollection.insertMany([configAfterMigration, configTCFormNoConfigs, noTcFormConfig]);
		await tcFitCollection.insertOne(newTCFitSettings);

		await down({ db });

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDoc = await configCollection.findOne({ _id: ObjectId('6388c9c8f63f637b5715ae47') });
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDocNoTcForm = await configCollection.findOne({ _id: ObjectId('5f57951e2f8dda001231bf4d') });
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		const configDocTCFormNoConfigs = await configCollection.findOne({ _id: ObjectId('6388c9c8f63f637b5715ae46') });

		const tcFitDoc = await tcFitCollection.findOne();

		expect(configDoc).toStrictEqual(configBeforeMigration);
		expect(configDocNoTcForm).toStrictEqual(noTcFormConfig);
		expect(configDocTCFormNoConfigs).toStrictEqual(configTCFormNoConfigs);
		expect(tcFitDoc).toStrictEqual(oldTCFitSetting);
	});
});
