import { mapConfig } from './forecastConfig';

it('no config should return nothing', () => {
	expect(mapConfig(undefined)).toStrictEqual(undefined);
	expect(mapConfig({})).toStrictEqual({});
});
describe('mapConfig from old configuration', () => {
	it('shared is top level', () => {
		expect(
			mapConfig({
				applyAll: false,
				shared: { resolution: 'monthly_only', dispersion: 2 },
			})
		).toStrictEqual({
			applyAll: false,
			shared: { dispersion: 2 },
		});
	});
	it('applyAll = false', () => {
		expect(
			mapConfig({
				applyAll: false,
				axisCombo: 'ratio',
				settings: {
					general: {
						model_name: 'arps_modified_wp',
						phases: ['gas', 'water'],
						resolution: 'monthly_only',
					},
					oil: { dispersion: 1 },
					gas: { dispersion: 2 },
					water: { dispersion: 3 },
					shared: { dispersion: 4 },
				},
			})
		).toStrictEqual({
			settings: {
				applyAll: false,
				shared: {
					axis_combo: 'ratio',
					model_name: 'arps_modified_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				oil: {
					axis_combo: 'ratio',
					model_name: 'arps_modified_wp',
					dispersion: 1,
				},
				gas: {
					axis_combo: 'ratio',
					model_name: 'arps_modified_wp',
					dispersion: 2,
				},
				water: {
					axis_combo: 'ratio',
					model_name: 'arps_modified_wp',
					dispersion: 3,
				},
				phases: { oil: false, gas: true, water: true },
			},
		});
	});
	it('applyAll = true', () => {
		expect(
			mapConfig({
				applyAll: true,
				axisCombo: 'rate',
				settings: {
					general: {
						model_name: 'arps_wp',
						phases: ['oil', 'gas'],
						resolution: 'monthly_only',
					},
					shared: { dispersion: 4 },
					oil: { dispersion: 5 },
				},
			})
		).toStrictEqual({
			settings: {
				applyAll: true,
				shared: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				oil: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				gas: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				water: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				phases: { oil: true, gas: true, water: false },
			},
		});
	});
	it('mapConfig(value) === mapConfig(mapConfig(value))', () => {
		const value = {
			applyAll: true,
			axisCombo: 'rate',
			settings: {
				general: {
					model_name: 'arps_wp',
					phases: ['oil', 'gas'],
					resolution: 'monthly_only',
				},
				shared: { dispersion: 4 },
			},
		};
		expect(mapConfig(value)).toStrictEqual(mapConfig(mapConfig(value)));
	});
});
describe('mapConfig from semi old configuration', () => {
	// in recent configurations it was saved with `model` property instead of `model_name` which will cause conflicts with new ones, also there's an unnecesarry nesting in configurations under the settings property which we should get rid of.
	// the latests configurations has a _counter property which also shouldn't be there but we can use this to know how old is the config (from these changes or from the previous hotfix)
	it("if it doesn't has _counter read from model", () => {
		expect(
			mapConfig({
				settings: {
					applyAll: true,
					shared: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					oil: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					gas: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					water: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					phases: { oil: true, gas: true, water: true },
				},
			})
		).toStrictEqual({
			settings: {
				applyAll: true,
				shared: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				oil: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				gas: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				water: {
					axis_combo: 'rate',
					model_name: 'arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				phases: { oil: true, gas: true, water: true },
			},
		});
	});
	it('if it has _counter read from model_name', () => {
		expect(
			mapConfig({
				settings: {
					applyAll: true,
					shared: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					oil: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					gas: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					water: {
						axis_combo: 'rate',
						model: 'arps_wp',
						model_name: 'modified_arps_wp',
						resolution: 'monthly_only',
						dispersion: 4,
					},
					phases: { oil: true, gas: true, water: true },
					_counter: 1,
				},
			})
		).toMatchObject({
			settings: {
				applyAll: true,
				shared: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				oil: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				gas: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				water: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				phases: { oil: true, gas: true, water: true },
			},
		});
	});
	it('applyAll should take precedence', () => {
		const settings = {
			applyAll: true,
			shared: {
				axis_combo: 'rate',
				model_name: 'modified_arps_wp',
				resolution: 'monthly_only',
				dispersion: 4,
			},
			oil: {
				axis_combo: 'rate',
				model_name: 'modified_arps_wp',
				resolution: 'monthly_only',
				dispersion: 5,
			},
			gas: {
				axis_combo: 'rate',
				model_name: 'modified_arps_wp',
				resolution: 'monthly_only',
				dispersion: 4,
			},
			water: {
				axis_combo: 'rate',
				model_name: 'modified_arps_wp',
				resolution: 'monthly_only',
				dispersion: 4,
			},
			phases: { oil: true, gas: true, water: true },
		};
		const expected = {
			settings: {
				applyAll: true,
				shared: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				oil: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				gas: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				water: {
					axis_combo: 'rate',
					model_name: 'modified_arps_wp',
					resolution: 'monthly_only',
					dispersion: 4,
				},
				phases: { oil: true, gas: true, water: true },
			},
		};
		expect(mapConfig({ settings: { ...settings, _counter: 1 } })).toMatchObject(expected);
		expect(mapConfig({ settings })).toMatchObject(expected);
	});
});
