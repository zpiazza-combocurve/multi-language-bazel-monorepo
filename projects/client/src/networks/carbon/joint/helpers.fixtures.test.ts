export const TESTS = {
	networkData: {
		correctOutput: [
			{
				input: {
					fluidModels: [],
					wells: [],
					facilities: [],
					nodeModels: [],
					copiedFrom: null,
					_id: '649af02021b605092ff87b33',
					project: '62d021878593423eae4142e3',
					createdBy: '61d5b81f4cd17c0013832893',
					name: 'All node types, no facilities',
					nodes: [
						{
							shape: {
								position: {
									x: 354,
									y: 814,
								},
							},
							id: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							type: 'well_group',
							name: 'Well Group',
							params: {
								wells: [],
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 582,
									y: 930,
								},
							},
							id: 'daa49bed-cce0-4cbe-8217-18ebb4889699',
							type: 'atmosphere',
							name: 'Atmosphere',
							params: {
								emission_type: 'vented',
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 877,
									y: 811,
								},
							},
							id: '922e6dc3-f841-48a2-bea2-184261d98617',
							type: 'econ_output',
							name: 'Econ Output',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1133,
									y: 814,
								},
							},
							id: 'd8ab43ac-5646-4a63-bed5-f1ce7218b102',
							type: 'oil_tank',
							name: 'Oil Tank',
							params: {
								oil_to_gas_ratio: 1,
								output_gas_fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 396,
									y: 1150,
								},
							},
							id: '397124a5-b91f-42cf-a15f-8b06954caae1',
							type: 'flare',
							name: 'Flare',
							params: {
								fuel_hhv: {
									value: 0.001235,
									unit: 'MMBtu/scf',
								},
								pct_flare_efficiency: 98,
								pct_flare_unlit: 0,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 609,
									y: 1167,
								},
							},
							id: '78209b7d-26d0-4962-af88-511fadb1b86d',
							type: 'liquids_unloading',
							name: 'Liquids Unloading',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 812,
									y: 1176,
								},
							},
							id: '25ef72d9-545d-4d91-9ee5-39b967b0a239',
							type: 'associated_gas',
							name: 'Associated Gas',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 715,
									y: 1398.333251953125,
								},
							},
							id: '878b45f5-c880-4102-b14c-60005f8c82b5',
							type: 'flowback',
							name: 'Flowback',
							params: {
								time_series: {
									rows: [
										{
											start_date_window: 'Start',
											flowback_rate: 0,
											start_criteria: 'FPD',
											start_criteria_option: null,
											start_value: 0,
											end_criteria: 'duration',
											end_criteria_option: null,
											end_value: 0,
										},
									],
								},
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1003.333251953125,
									y: 1418.333251953125,
								},
							},
							id: '2911c917-8b7b-4e7b-8c5e-1878d39da0e9',
							type: 'capture',
							name: 'Capture',
							params: {
								emission_type: 'capture',
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 128,
									y: 704,
								},
							},
							id: 'e05d188d-230b-45e8-a875-ce5eb2b9756a',
							type: 'completion',
							name: 'Completion',
							params: {
								time_series: {
									fuel_type: 'distillate_fuel_oil_number_2',
									rows: [
										{
											start_date_window: 'Start',
											consumption_rate: 0,
											start_criteria: 'FPD',
											start_criteria_option: null,
											start_value: 0,
											end_criteria: 'duration',
											end_criteria_option: null,
											end_value: 0,
										},
									],
								},
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 128,
									y: 918,
								},
							},
							id: '0ffcdfd4-4c88-48eb-8887-3768849c8ae7',
							type: 'drilling',
							name: 'Drilling',
							params: {
								time_series: {
									fuel_type: 'distillate_fuel_oil_number_2',
									rows: [
										{
											start_date_window: 'Start',
											consumption_rate: 0,
											start_criteria: 'FPD',
											start_criteria_option: null,
											start_value: 0,
											end_criteria: 'duration',
											end_criteria_option: null,
											end_value: 0,
										},
									],
								},
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 354,
									y: 1000,
								},
							},
							id: '0cbe77ef-e7e4-4a39-b95c-d9eeb45fed6c',
							type: 'custom_calculation',
							name: 'Custom Calculation',
							params: {
								inputs: [
									{
										name: 'Oil',
										assign: false,
										by: 'oil',
									},
									{
										name: 'Gas',
										assign: false,
										by: 'gas',
									},
									{
										name: 'Water',
										assign: false,
										by: 'water',
									},
								],
								outputs: [
									{
										name: 'Gas',
										assign: false,
										by: 'gas',
										category: 'custom_calculation',
										emission_type: 'N/A',
									},
									{
										name: 'CO2e',
										assign: false,
										by: 'CO2e',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'CO2',
										assign: false,
										by: 'CO2',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'CH4',
										assign: false,
										by: 'CH4',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'N2O',
										assign: false,
										by: 'N2O',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
								],
								formula: {
									simple: [],
									advanced: '',
								},
								fluid_model: null,
								active_formula: 'simple',
							},
							description: '',
							nodeModel: null,
						},
					],
					edges: [
						{
							id: 'd4e6daba-44dd-4aee-bf1b-d1745d724c2b',
							by: 'gas',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'gas',
							to: 'daa49bed-cce0-4cbe-8217-18ebb4889699',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '2b049720-a16a-464d-92c7-1ff11047ce22',
							by: 'gas',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'gas',
							to: '922e6dc3-f841-48a2-bea2-184261d98617',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: 'a7eb0a63-ff8f-4f88-8bf5-075567e5dc77',
							by: 'oil',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'oil',
							to: 'd8ab43ac-5646-4a63-bed5-f1ce7218b102',
							toHandle: 'oil',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '52426bc0-316b-4d9c-95ce-7e9193c242cc',
							by: 'gas',
							from: 'd8ab43ac-5646-4a63-bed5-f1ce7218b102',
							fromHandle: 'gas',
							to: '25ef72d9-545d-4d91-9ee5-39b967b0a239',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '0a5c5dff-c970-4f16-addf-f7128d18ade5',
							by: 'water',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'water',
							to: '922e6dc3-f841-48a2-bea2-184261d98617',
							toHandle: 'water',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '9a3a7a3d-b386-4a67-a08e-c4643f6a50cc',
							by: 'gas',
							from: '25ef72d9-545d-4d91-9ee5-39b967b0a239',
							fromHandle: 'gas',
							to: '878b45f5-c880-4102-b14c-60005f8c82b5',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: 'af4b22be-bfb6-4561-8c01-86e8fa2d979c',
							by: 'gas',
							from: '878b45f5-c880-4102-b14c-60005f8c82b5',
							fromHandle: 'gas',
							to: '2911c917-8b7b-4e7b-8c5e-1878d39da0e9',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '35f4be20-5cb4-4761-88ec-013b8fe81a2b',
							by: 'gas',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'gas',
							to: '78209b7d-26d0-4962-af88-511fadb1b86d',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '13b7d29c-8b1b-4361-b295-780944684b93',
							by: 'gas',
							from: '78209b7d-26d0-4962-af88-511fadb1b86d',
							fromHandle: 'gas',
							to: '397124a5-b91f-42cf-a15f-8b06954caae1',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '286e5ffb-01a0-422b-aef2-af0dfac556a3',
							by: 'link',
							from: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							fromHandle: 'link',
							to: '0cbe77ef-e7e4-4a39-b95c-d9eeb45fed6c',
							toHandle: 'link',
							shape: {
								vertices: [],
							},
							name: '',
						},
						{
							id: '775cb15c-644a-4bd8-ba21-277d9360262c',
							by: 'development',
							from: 'e05d188d-230b-45e8-a875-ce5eb2b9756a',
							to: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							shape: {
								vertices: [],
							},
							name: '',
						},
						{
							id: '6d916375-3941-4eda-89ce-f3466a36cac0',
							by: 'development',
							from: '0ffcdfd4-4c88-48eb-8887-3768849c8ae7',
							to: '561edafd-9817-42c7-ae0b-a1679cf166d4',
							shape: {
								vertices: [],
							},
							name: '',
						},
					],
					createdAt: new Date('2023-06-27T14:20:16.457Z'),
					updatedAt: new Date('2023-06-27T14:22:09.265Z'),
					__v: 0,
				},
				facilitiesRecord: {},
			},
			{
				input: {
					fluidModels: [],
					wells: [],
					facilities: ['63f629037a024b27d771e1d9'],
					nodeModels: [],
					copiedFrom: null,
					_id: '649edf6f6c3f22090645c3fe',
					project: '62d021878593423eae4142e3',
					createdBy: '61d5b81f4cd17c0013832893',
					name: 'All node types + facility node',
					nodes: [
						{
							shape: {
								position: {
									x: 760,
									y: 806,
								},
							},
							id: '116ee6da-85c5-4523-b06c-c5a1e6daec95',
							type: 'well_group',
							name: 'Well Group',
							params: {
								wells: [],
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1073,
									y: 802,
								},
							},
							id: 'bd9b2e98-a0f8-446e-8d39-7ad0302b345f',
							type: 'econ_output',
							name: 'Econ Output',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 912,
									y: 688,
								},
							},
							id: 'node',
							type: 'facility',
							name: 'Test',
							params: {
								facility_id: '63f629037a024b27d771e1d9',
							},
							nodeModel: null,
						},
					],
					edges: [
						{
							id: 'c365fc6a-0d2b-40d5-931c-863a29e81dfe',
							by: 'gas',
							from: '116ee6da-85c5-4523-b06c-c5a1e6daec95',
							fromHandle: 'gas',
							to: 'bd9b2e98-a0f8-446e-8d39-7ad0302b345f',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							description: undefined,
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: 'da9a9e67-d535-4566-a23d-4888d75a4e29',
							by: 'oil',
							from: '116ee6da-85c5-4523-b06c-c5a1e6daec95',
							fromHandle: 'oil',
							to: 'node',
							toHandle: '406cd390-4ed8-4a8c-a9f9-44e0fafd9395',
							shape: {
								vertices: [],
							},
							name: '',
							description: undefined,
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '4b884a4f-f7d8-4a01-8ad4-3bf90ad7d990',
							by: 'oil',
							from: 'node',
							fromHandle: '2956a367-df23-4b57-903c-78116fdca01c',
							to: 'bd9b2e98-a0f8-446e-8d39-7ad0302b345f',
							toHandle: 'oil',
							shape: {
								vertices: [],
							},
							name: '',
							description: undefined,
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
					],
					createdAt: new Date('2023-06-30T13:58:07.951Z'),
					updatedAt: new Date('2023-06-30T14:16:46.516Z'),
					__v: 0,
				},
				facilitiesRecord: {
					'63f629037a024b27d771e1d9': {
						_id: '63f629037a024b27d771e1d9',
						copiedFrom: null,
						fluidModels: [],
						nodeModels: [],
						project: '62d021878593423eae4142e3',
						createdBy: '61d5b81f4cd17c0013832893',
						name: 'Test',
						nodes: [
							{
								shape: {
									position: {
										x: 592,
										y: 896,
									},
								},
								id: 'node1',
								type: 'oil_tank',
								name: 'Oil Tank',
								params: {
									oil_to_gas_ratio: 1,
									output_gas_fluid_model: null,
								},
								description: '',
								nodeModel: null,
							},
							{
								shape: {
									position: {
										x: 992,
										y: 928,
									},
								},
								id: 'node',
								type: 'atmosphere',
								name: 'Atmosphere',
								params: {
									emission_type: 'vented',
								},
								description: '',
								nodeModel: null,
							},
						],
						edges: [
							{
								id: '1640dcd7-99c7-40dd-80e6-1acae8f28348',
								by: 'gas',
								from: 'node1',
								fromHandle: 'gas',
								to: 'node',
								toHandle: 'gas',
								name: '',
								params: {
									time_series: {
										criteria: 'entire_well_life',
										rows: [
											{
												period: 'Flat',
												allocation: 100,
											},
										],
									},
								},
							},
						],
						inputs: [
							{
								id: '406cd390-4ed8-4a8c-a9f9-44e0fafd9395',
								by: 'oil',
								to: 'node1',
								toHandle: 'oil',
								shape: {
									vertices: [
										{
											x: 469,
											y: 854.25,
										},
									],
								},
								name: 'Input Edge',
							},
						],
						outputs: [
							{
								id: '2956a367-df23-4b57-903c-78116fdca01c',
								by: 'oil',
								from: 'node1',
								fromHandle: 'oil',
								shape: {
									vertices: [
										{
											x: 989,
											y: 831.25,
										},
									],
								},
								name: 'Output Edge',
							},
						],
						createdAt: new Date('2023-02-22T14:38:59.880Z'),
						updatedAt: new Date('2023-06-30T13:58:57.179Z'),
						__v: 0,
					},
				},
			},
		],
		errorOutput: [],
	},
	facilityData: {
		correctOutput: [
			{
				input: {
					copiedFrom: null,
					fluidModels: [],
					nodeModels: [],
					_id: '64a305124431330dc0f2a6ce',
					project: '62d021878593423eae4142e3',
					createdBy: '61d5b81f4cd17c0013832893',
					name: 'All nodes, all edges',
					nodes: [
						{
							shape: {
								position: {
									x: 516,
									y: 839,
								},
							},
							id: 'node',
							type: 'atmosphere',
							name: 'Atmosphere',
							params: {
								emission_type: 'vented',
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 681,
									y: 840,
								},
							},
							id: 'node1',
							type: 'econ_output',
							name: 'Econ Output',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 516,
									y: 1002,
								},
							},
							id: 'node4',
							type: 'liquids_unloading',
							name: 'Liquids Unloading',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 681,
									y: 1002,
								},
							},
							id: 'node5',
							type: 'associated_gas',
							name: 'Associated Gas',
							params: {},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 853,
									y: 1002,
								},
							},
							id: 'node6',
							type: 'combustion',
							name: 'Combustion',
							params: {
								time_series: {
									fuel_type: 'distillate_fuel_oil_number_2',
									assigning_mode: 'facility',
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											consumption_rate: 0,
										},
									],
								},
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1019,
									y: 839,
								},
							},
							id: 'node3',
							type: 'flare',
							name: 'Flare',
							params: {
								fuel_hhv: {
									value: 0.001235,
									unit: 'MMBtu/scf',
								},
								pct_flare_efficiency: 98,
								pct_flare_unlit: 0,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1019,
									y: 1002,
								},
							},
							id: 'node7',
							type: 'pneumatic_device',
							name: 'Pneumatic Device',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											count: 0,
											runtime: 8760,
											device_type: 'high-bleed',
											period: 'Flat',
										},
									],
								},
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 516,
									y: 1166,
								},
							},
							id: 'node8',
							type: 'pneumatic_pump',
							name: 'Pneumatic Pump',
							params: {
								time_series: {
									assigning_mode: 'facility',
									criteria: 'entire_well_life',
									rows: [
										{
											count: 0,
											runtime: 8760,
											period: 'Flat',
										},
									],
								},
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 681,
									y: 1166,
								},
							},
							id: 'node9',
							type: 'centrifugal_compressor',
							name: 'Centrifugal Compressor',
							params: {
								time_series: {
									assigning_mode: 'facility',
									criteria: 'entire_well_life',
									rows: [
										{
											count: 0,
											runtime: 8760,
											period: 'Flat',
										},
									],
								},
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 853,
									y: 1166,
								},
							},
							id: 'node10',
							type: 'reciprocating_compressor',
							name: 'Reciprocating Compressor',
							params: {
								time_series: {
									assigning_mode: 'facility',
									criteria: 'entire_well_life',
									rows: [
										{
											count: 0,
											runtime: 8760,
											period: 'Flat',
										},
									],
								},
								fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 1019,
									y: 1166,
								},
							},
							id: 'node11',
							type: 'custom_calculation',
							name: 'Custom Calculation',
							params: {
								inputs: [
									{
										name: 'Oil',
										assign: false,
										by: 'oil',
									},
									{
										name: 'Gas',
										assign: false,
										by: 'gas',
									},
									{
										name: 'Water',
										assign: false,
										by: 'water',
									},
								],
								outputs: [
									{
										name: 'Gas',
										assign: false,
										by: 'gas',
										category: 'custom_calculation',
										emission_type: 'N/A',
									},
									{
										name: 'CO2e',
										assign: false,
										by: 'CO2e',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'CO2',
										assign: false,
										by: 'CO2',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'CH4',
										assign: false,
										by: 'CH4',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
									{
										name: 'N2O',
										assign: false,
										by: 'N2O',
										category: 'custom_calculation',
										emission_type: 'vented',
									},
								],
								formula: {
									simple: [],
									advanced: '',
								},
								fluid_model: null,
								active_formula: 'simple',
							},
							description: '',
							nodeModel: null,
						},
						{
							shape: {
								position: {
									x: 751,
									y: 682,
								},
							},
							id: 'node2',
							type: 'oil_tank',
							name: 'Oil Tank',
							params: {
								oil_to_gas_ratio: 1,
								output_gas_fluid_model: null,
							},
							description: '',
							nodeModel: null,
						},
					],
					edges: [
						{
							id: '55a01c91-515a-40dc-9fe7-df0943473c9f',
							by: 'gas',
							from: 'node2',
							fromHandle: 'gas',
							to: 'node4',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '72f59541-882c-44a6-be63-47b09d0f5b53',
							by: 'gas',
							from: 'node4',
							fromHandle: 'gas',
							to: 'node5',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '0a18a432-3324-4018-aed6-01e627393d25',
							by: 'gas',
							from: 'node5',
							fromHandle: 'gas',
							to: 'node',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '1959999c-c31e-438b-8c8d-f08e394ded33',
							by: 'gas',
							from: 'node5',
							fromHandle: 'gas',
							to: 'node1',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '1cf74e04-2547-4ee1-a4de-901896fe33c3',
							by: 'gas',
							from: 'node5',
							fromHandle: 'gas',
							to: 'node3',
							toHandle: 'gas',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
						{
							id: '10da4514-7be4-4380-bcb0-e91fd5e54d1d',
							by: 'oil',
							from: 'node2',
							fromHandle: 'oil',
							to: 'node1',
							toHandle: 'oil',
							shape: {
								vertices: [],
							},
							name: '',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [
										{
											period: 'Flat',
											allocation: 100,
										},
									],
								},
							},
						},
					],
					inputs: [
						{
							id: 'faeff2b1-8969-4520-b974-7ec2696d2bc6',
							by: 'oil',
							to: 'node2',
							toHandle: 'oil',
							shape: {
								vertices: [
									{
										x: 475,
										y: 701,
									},
								],
							},
							name: 'Input Edge',
						},
						{
							id: '077a125f-d260-4987-b49e-439b7492b175',
							by: 'gas',
							to: 'node',
							toHandle: 'gas',
							shape: {
								vertices: [
									{
										x: 480,
										y: 736,
									},
								],
							},
							name: 'Input Edge',
						},
						{
							id: '1e8eda8c-4ab1-4193-8dc7-cf2902029691',
							by: 'water',
							to: 'node1',
							toHandle: 'water',
							shape: {
								vertices: [
									{
										x: 643,
										y: 745,
									},
								],
							},
							name: 'Input Edge',
						},
					],
					outputs: [
						{
							id: 'd6b48c0b-29a1-4844-b0da-14259d1b52b6',
							by: 'oil',
							from: 'node2',
							fromHandle: 'oil',
							shape: {
								vertices: [
									{
										x: 1234,
										y: 658,
									},
								],
							},
							name: 'Output Edge',
						},
						{
							id: '9c26214c-3d94-424a-886f-836b880cbf1b',
							by: 'gas',
							from: 'node2',
							fromHandle: 'gas',
							shape: {
								vertices: [
									{
										x: 1337,
										y: 742,
									},
								],
							},
							name: 'Output Edge',
						},
					],
					createdAt: new Date('2023-07-03T17:27:46.011Z'),
					updatedAt: new Date('2023-07-03T17:38:23.180Z'),
					__v: 0,
				},
			},
		],
		errorOutput: [],
	},
};
