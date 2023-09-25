// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const assumptions = require('../../tests/fixtures/assumptions.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210113022345-remove-pricing-differentials-fields');

let db;
let client;
let mongod;

const typeCurves = [
	{
		_id: '5e41b49612f61e0012dfa852',
		fits: {
			oil: '5e714980a99769fb384d68b5',
			gas: null,
			water: null,
		},
		headers: {
			first_prod_date: '2020-04-12T00:00:00.000Z',
			perf_lateral_length: 10000,
			true_vertical_depth: 1000,
			total_prop_weight: 1000,
		},
		assumptions: {
			capex: '5e3c90be9284cd0013f8b830',
			risking: '5ede60b914e0660012252eac',
			expenses: '5e3856877bd8bc001232c7a2',
			escalation: null,
			depreciation: null,
			general_options: '5e9369a77b5573001268a6fc',
			production_taxes: '5e3856977bd8bc001232c7a3',
			production_vs_fit: null,
			stream_properties: '5e3856717bd8bc001232c7a1',
			ownership_reversion: '5e9369c57b5573001268a701',
			pricing_differentials: '5e27984b9489150012928060',
			dates: '5e9369bb7b5573001268a700',
		},
		fitted: false,
		normalizations: ['5e44285f44399831aefd1d6d'],
		wells: ['5e3854413fba1ea7a0424ff7'],
		wellsAdded: false,
		wellsRemoved: false,
		copiedFrom: null,
		pSeries: {
			percentile: 'P50',
		},
		createdBy: '5bd22c63cc534716dc3929cc',
		forecast: '5e3854cc7bd8bc00123259b5',
		name: 'TC-6',
		project: '5e38535a7bd8bc00123259b4',
		createdAt: '2020-02-10T19:52:54.159Z',
		updatedAt: '2020-06-08T16:00:58.701Z',
		activeUmbrellas: {
			pSeries: '5ede5fad14e0660012252eaa',
			assumptions: {
				capex: '5ede5fb914e0660012252eab',
			},
		},
		tcType: 'rate',
		basePhase: null,
		phaseType: {
			oil: 'rate',
			gas: 'rate',
			water: 'rate',
		},
		forecastSeries: 'P50',
	},
	{
		_id: '5e471774f41ba0814821e3bd',
		fits: {
			oil: '5e714980a99769fb384d68b5',
			gas: null,
			water: null,
		},
		headers: {
			first_prod_date: '2020-04-12T00:00:00.000Z',
			perf_lateral_length: 10000,
			true_vertical_depth: 1000,
			total_prop_weight: 1000,
		},
		assumptions: {
			capex: '5e3c90be9284cd0013f8b830',
			risking: '5ede60b914e0660012252eac',
			expenses: '5e3856877bd8bc001232c7a2',
			escalation: null,
			depreciation: null,
			general_options: '5e9369a77b5573001268a6fc',
			production_taxes: '5e3856977bd8bc001232c7a3',
			production_vs_fit: null,
			stream_properties: '5e3856717bd8bc001232c7a1',
			ownership_reversion: '5e9369c57b5573001268a701',
			pricing_differentials: null,
			dates: '5e9369bb7b5573001268a700',
		},
		fitted: false,
		normalizations: ['5e44285f44399831aefd1d6d'],
		wells: ['5e3854413fba1ea7a0424ff7'],
		wellsAdded: false,
		wellsRemoved: false,
		copiedFrom: null,
		pSeries: {
			percentile: 'P50',
		},
		createdBy: '5bd22c63cc534716dc3929cc',
		forecast: '5e3854cc7bd8bc00123259b5',
		name: 'TC-6',
		project: '5e38535a7bd8bc00123259b4',
		createdAt: '2020-02-10T19:52:54.159Z',
		updatedAt: '2020-06-08T16:00:58.701Z',
		activeUmbrellas: {
			pSeries: '5ede5fad14e0660012252eaa',
			assumptions: {
				capex: '5ede5fb914e0660012252eab',
			},
		},
		tcType: 'rate',
		basePhase: null,
		phaseType: {
			oil: 'rate',
			gas: 'rate',
			water: 'rate',
		},
		forecastSeries: 'P50',
	},
];

const typeCurvesUmbrellas = [
	{
		_id: '5ebc868b63f4dc4248c78460',
		column: 'assumptions.pricing_differentials',
		name: 'PRICINGDIFF',
		value: '5e27984b9489150012928060',
		typeCurve: '5ebc473d511cec1b088cf5cc',
	},
];

const scenarioWellAssignments = [
	{
		_id: '5e274b0c4b97ed0013323c32',
		forecast_p_series: {
			default: {
				model: 'P50',
			},
		},
		well: '5e272d38b78910dd2a1bd6b5',
		scenario: '5e274b004b97ed0013323bd3',
		project: '5e272bed4b97ed00132f2271',
		createdAt: '2020-01-21T19:03:41.972Z',
		updatedAt: '2020-02-18T21:39:01.271Z',
		general_options: '5e27985c9489150012928062',
		capex: {
			'20200330t195858m130xi78t': '5e2798aa9489150012928070',
			default: {
				model: '5e2798aa9489150012928070',
			},
		},
		ownership_reversion: {
			default: {
				model: '5e2798f29489150012928075',
			},
		},
		expenses: {
			default: {
				model: '5e2798d19489150012928073',
			},
		},
		production_taxes: {
			default: {
				model: '5e2798dd9489150012928074',
			},
		},
		dates: {
			default: {
				model: '5e4c5973d0ead300125a3f82',
			},
		},
		depreciation: {
			default: null,
		},
		escalation: {
			default: null,
		},
		forecast: {
			default: {
				model: null,
			},
		},
		pricing_differentials: {
			default: {
				model: '5e27984b9489150012928060',
				lookup: '5e274b0c4b97ed0013323c23',
			},
		},
		production_vs_fit: {
			default: {
				model: null,
			},
		},
		reserves_category: {
			default: {
				model: null,
			},
		},
		risking: {
			default: {
				model: null,
			},
		},
		schedule: {
			default: {
				model: null,
			},
		},
		schemaVersion: 3,
		stream_properties: {
			default: {
				model: null,
			},
		},
	},
	{
		_id: '5e274b0c4b97ed0013323c26',
		forecast_p_series: {
			default: {
				model: 'P50',
			},
		},
		well: '5e272d38b78910dd2a1bd6b5',
		scenario: '5e274b004b97ed0013323bd3',
		project: '5e272bed4b97ed00132f2271',
		createdAt: '2020-01-21T19:03:41.972Z',
		updatedAt: '2020-02-18T21:39:01.271Z',
		general_options: '5e27985c9489150012928062',
		capex: {
			'20200330t195858m130xi78t': '5e2798aa9489150012928070',
			default: {
				model: '5e2798aa9489150012928070',
			},
		},
		ownership_reversion: {
			default: {
				model: '5e2798f29489150012928075',
			},
		},
		expenses: {
			default: {
				model: '5e2798d19489150012928073',
			},
		},
		production_taxes: {
			default: {
				model: '5e2798dd9489150012928074',
			},
		},
		dates: {
			default: {
				model: '5e4c5973d0ead300125a3f82',
			},
		},
		depreciation: {
			default: null,
		},
		escalation: {
			default: null,
		},
		forecast: {
			default: {
				model: null,
			},
		},
		pricing_differentials: {
			default: {
				model: null,
			},
		},
		production_vs_fit: {
			default: {
				model: null,
			},
		},
		reserves_category: {
			default: {
				model: null,
			},
		},
		risking: {
			default: {
				model: null,
			},
		},
		schedule: {
			default: {
				model: null,
			},
		},
		schemaVersion: 3,
		stream_properties: {
			default: {
				model: null,
			},
		},
	},
];

const lookUpTables = [
	{
		_id: '5fb32fe8ed079500120914a3',
		configuration: {
			selectedHeaders: ['type_curve_area', 'perf_lateral_length', 'first_prod_date'],
			selectedAssumptions: ['capex', 'pricing_differentials', 'ownership_reversion', 'expenses'],
		},
		name: 'foo',
		project: '5fb2dc91c5515e791da7ef61',
		rules: [
			{
				capex: '5fb2dc8fc5515e791da76ba3',
				pricing_differentials: '5e27984b9489150012928060',
				filter: {
					conditions: [
						{
							operator: 'less_than_equal',
							key: 'perf_lateral_length',
							value: '1000',
						},
					],
				},
			},
			{
				pricing_differentials: '5e27984b9489150012928060',
				ownership_reversion: '5fb2dc8fc5515e791da76ba1',
				expenses: '5fb2dc8fc5515e791da76ba5',
				filter: {
					conditions: [
						{
							operator: 'less_than_equal',
							key: 'perf_lateral_length',
							value: '5000',
						},
						{
							operator: 'greater_than_equal',
							key: 'perf_lateral_length',
							value: '2000',
						},
					],
				},
			},
			{
				capex: '5fb2dc8fc5515e791da76ba3',
				ownership_reversion: '5fb2dc8fc5515e791da76ba1',
				expenses: '5fb2dc8fc5515e791da76ba5',
				filter: {
					conditions: [
						{
							operator: 'less_than_equal',
							key: 'perf_lateral_length',
							value: '10000',
						},
					],
				},
			},
		],
		createdBy: '5f3bf00416fda7001249751c',
		createdAt: '2020-11-17T02:05:28.724Z',
		updatedAt: '2020-11-17T02:18:32.739Z',
	},
];

const scenarios = [
	{
		_id: '5e27305e4f59a9ec64eb576a',
		history: {
			nameChange: [],
			scenarioDeleted: [],
			permChange: [],
		},
		wells: [],
		name: 'S1',
		project: '5e27302d4f59a9ec64eb5769',
		createdBy: '5d4303aeefe8a100089a7992',
		createdAt: '2020-01-21T17:09:50.686Z',
		updatedAt: '2020-01-21T17:09:50.686Z',
		columns: {
			forecast: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			forecast_p_series: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			schedule: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			capex: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			dates: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			depreciation: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			escalation: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			expenses: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			ownership_reversion: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			pricing_differentials: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			production_taxes: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			production_vs_fit: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			reserves_category: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			risking: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
			stream_properties: {
				qualifiers: {
					default: {
						name: 'Default',
					},
				},
				activeQualifier: 'default',
			},
		},
		schemaVersion: 2,
	},
];

const pricingDifferentialsDocs = [
	{
		_id: '5f2c8e40c7002d044b7391b4',
		originalId: '5e27984b9489150012928060',
		copiedFrom: null,
		typeCurve: null,
		unique: false,
		name: 'Pricing Model',
		options: {
			price_model: {
				phase: {
					label: 'Oil',
					value: 'oil',
				},
				oil: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: '$/BBL',
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 50,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				gas: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '$/MMBTU',
									value: 'dollar_per_mmbtu',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 2,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				ngl: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '% of Oil Price',
									value: 'pct_of_oil_price',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 100,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				drip_condensate: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '$/BBL',
									value: 'dollar_per_bbl',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 0,
									criteria: 'Flat',
								},
							],
						},
					},
				},
			},
			breakeven: {
				npv_discount: 0,
				based_on_price_ratio: {
					label: 'No',
					value: 'no',
				},
				price_ratio: '',
			},
			shutIn: {
				row_view: {
					headers: {
						phase: 'Phase',
						criteria: {
							required: true,
							label: 'Dates',
							value: 'dates',
							fieldType: 'date-range-two',
							valType: 'datetime',
						},
						unit: 'Unit',
						multiplier: 'Multiplier',
						fixed_expense: 'Fixed Expense',
						capex: 'CAPEX',
					},
					rows: [],
				},
			},
		},
		project: '5e276a66876cd70012ddf3f5',
		assumptionKey: 'pricing',
		assumptionName: 'Pricing',
		econ_function: {
			price_model: {
				oil: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							price: 50,
							entire_well_life: 'Flat',
						},
					],
				},
				gas: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							dollar_per_mmbtu: 2,
							entire_well_life: 'Flat',
						},
					],
				},
				ngl: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							pct_of_oil_price: 100,
							entire_well_life: 'Flat',
						},
					],
				},
				drip_condensate: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							dollar_per_bbl: 0,
							entire_well_life: 'Flat',
						},
					],
				},
			},
			breakeven: {
				npv_discount: 0,
				based_on_price_ratio: 'no',
				price_ratio: '',
			},
			shutIn: {
				rows: [],
			},
		},
		createdBy: '5c51c5893e0f9b04e0bbdada',
		createdAt: '2020-01-22T00:33:15.835Z',
		updatedAt: '2020-01-22T00:33:15.835Z',
	},
	{
		_id: '5f3b0b9b552cd446ead2437d',
		copiedFrom: null,
		originalId: '5e27984b9489150012928060',
		typeCurve: null,
		unique: false,
		name: 'Differentials Model',
		options: {
			price_model: {
				phase: {
					label: 'Oil',
					value: 'oil',
				},
				oil: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: '$/BBL',
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 50,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				gas: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '$/MMBTU',
									value: 'dollar_per_mmbtu',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 2,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				ngl: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '% of Oil Price',
									value: 'pct_of_oil_price',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 100,
									criteria: 'Flat',
								},
							],
						},
					},
				},
				drip_condensate: {
					subItems: {
						cap: '',
						escalation_model: {
							label: 'None',
							value: 'none',
						},
						row_view: {
							headers: {
								price: {
									label: '$/BBL',
									value: 'dollar_per_bbl',
								},
								criteria: {
									label: 'Flat',
									value: 'entire_well_life',
								},
							},
							rows: [
								{
									price: 0,
									criteria: 'Flat',
								},
							],
						},
					},
				},
			},
			breakeven: {
				npv_discount: 0,
				based_on_price_ratio: {
					label: 'No',
					value: 'no',
				},
				price_ratio: '',
			},
			shutIn: {
				row_view: {
					headers: {
						phase: 'Phase',
						criteria: {
							required: true,
							label: 'Dates',
							value: 'dates',
							fieldType: 'date-range-two',
							valType: 'datetime',
						},
						unit: 'Unit',
						multiplier: 'Multiplier',
						fixed_expense: 'Fixed Expense',
						capex: 'CAPEX',
					},
					rows: [],
				},
			},
		},
		project: '5e276a66876cd70012ddf3f5',
		assumptionKey: 'differentials',
		assumptionName: 'Differentials',
		econ_function: {
			price_model: {
				oil: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							price: 50,
							entire_well_life: 'Flat',
						},
					],
				},
				gas: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							dollar_per_mmbtu: 2,
							entire_well_life: 'Flat',
						},
					],
				},
				ngl: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							pct_of_oil_price: 100,
							entire_well_life: 'Flat',
						},
					],
				},
				drip_condensate: {
					cap: '',
					escalation_model: 'none',
					rows: [
						{
							dollar_per_bbl: 0,
							entire_well_life: 'Flat',
						},
					],
				},
			},
			breakeven: {
				npv_discount: 0,
				based_on_price_ratio: 'no',
				price_ratio: '',
			},
			shutIn: {
				rows: [],
			},
		},
		createdBy: '5c51c5893e0f9b04e0bbdada',
		createdAt: '2020-01-22T00:33:15.835Z',
		updatedAt: '2020-01-22T00:33:15.835Z',
	},
];

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210113022345-remove-pricing-differentials-fields', () => {
	let typeCurvesCollection;
	let typeCurvesUmbrellasCollection;
	let scenarioWellAssignmentsCollection;
	let lookUpTablesCollection;
	let scenariosCollection;
	let assumptionsCollection;

	beforeAll(async () => {
		typeCurvesCollection = db.collection('type-curves');
		typeCurvesUmbrellasCollection = db.collection('type-curves-umbrellas');
		scenarioWellAssignmentsCollection = db.collection('scenario-well-assignments');
		lookUpTablesCollection = db.collection('lookup-tables');
		scenariosCollection = db.collection('scenarios');
		assumptionsCollection = db.collection('assumptions');

		await typeCurvesCollection.insertMany(typeCurves);
		await typeCurvesUmbrellasCollection.insertMany(typeCurvesUmbrellas);
		await scenarioWellAssignmentsCollection.insertMany(scenarioWellAssignments);
		await lookUpTablesCollection.insertMany(lookUpTables);
		await scenariosCollection.insertMany(scenarios);
		await assumptionsCollection.insertMany([...assumptions, ...pricingDifferentialsDocs]);
	});

	test('up', async () => {
		await up({ db });

		let result = await typeCurvesCollection
			.find({ 'assumptions.pricing_differentials': { $exists: true } })
			.toArray();
		expect(result).toStrictEqual([]);

		result = await typeCurvesUmbrellasCollection.find({ column: 'assumptions.pricing_differentials' }).toArray();
		expect(result).toStrictEqual([]);

		result = await scenarioWellAssignmentsCollection.find({ pricing_differentials: { $exists: true } }).toArray();
		expect(result).toStrictEqual([]);

		result = await lookUpTablesCollection.find({ 'rules.pricing_differentials': { $exists: true } }).toArray();
		expect(result).toStrictEqual([]);

		result = await scenariosCollection.find({ 'columns.pricing_differentials': { $exists: true } }).toArray();
		expect(result).toStrictEqual([]);

		result = await assumptionsCollection
			.find({
				$and: [
					{ originalId: { $exists: true } },
					{ $or: [{ assumptionKey: 'pricing' }, { assumptionKey: 'differentials' }] },
				],
			})
			.toArray();
		expect(result).toStrictEqual([]);

		result = await assumptionsCollection.find({ assumptionKey: 'pricing_differentials' }).toArray();
		expect(result).toStrictEqual([]);
	});
});
