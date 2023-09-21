import { AnyNode, EmissionType, NetworkModel, NetworkModelFacility, Stream } from '@/networks/carbon/types';

import { NODES_TYPE_LIST } from '../Network/View';
import { DEFAULT_NODE_DATA } from '../shared';

export const TEST_NETWORK = {
	project: 'test',
	_id: '1',
	name: 'test',
	nodes: [
		...NODES_TYPE_LIST.map(
			(type) =>
				({
					id: type,
					type,
					name: type,
					params: DEFAULT_NODE_DATA[type],
					shape: {
						position: {
							x: 0,
							y: 0,
						},
					},
				} as AnyNode)
		),
		{
			shape: {
				position: {
					x: 944,
					y: 1187,
				},
			},
			id: 'facility_id',
			type: 'facility',
			name: 'Facility',
			params: {
				facility_id: 'facility_id',
			},
			description: '',
		},
	],
	edges: [
		{
			id: '9c0f058f-ef33-4232-8c69-3557871dbf0b',
			by: Stream.oil,
			from: 'well_group',
			fromHandle: Stream.oil,
			to: 'econ_output',
			toHandle: Stream.oil,
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
							allocation: 10,
						},
					],
				},
			},
		},
		{
			id: '84ab0d2f-b20a-40f9-b1f4-bae02773cfae',
			by: Stream.gas,
			from: 'well_group',
			fromHandle: Stream.gas,
			to: 'econ_output',
			toHandle: Stream.gas,
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
							allocation: 20,
						},
					],
				},
			},
		},
		{
			id: '5314c18c-464e-48c2-a8fc-873be16f6d20',
			by: Stream.water,
			from: 'well_group',
			fromHandle: Stream.water,
			to: 'econ_output',
			toHandle: Stream.water,
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
							allocation: 30,
						},
					],
				},
			},
		},
		{
			id: '8fceb06a-a818-4604-9fa1-3483b84c0c99',
			by: Stream.development,
			from: 'completion',
			to: 'well_group',
			shape: {
				vertices: [],
			},
			name: '',
		},
		{
			id: '8d9a60fa-07a5-47c6-9e7a-a6901686002c',
			by: Stream.link,
			from: 'well_group',
			toFacilityObjectId: 'facility_id',
			fromHandle: Stream.link,
			to: 'facility_id',
			toHandle: Stream.link,
			shape: {
				vertices: [],
			},
			name: '',
		},
	],
} as NetworkModel;

export const TEST_FACILITY = {
	_id: 'facility_id',
	project: 'test_project',
	name: 'Test',
	nodes: [
		{
			shape: {
				position: {
					x: 432,
					y: 512,
				},
			},
			id: 'atmosphere',
			type: 'atmosphere',
			name: 'Atmosphere',
			params: {
				emission_type: EmissionType.vented,
			},
			description: '',
		},
		{
			shape: {
				position: {
					x: 679,
					y: 518,
				},
			},
			id: 'econ_output',
			type: 'econ_output',
			name: 'Econ Output',
			params: null,
			description: '',
		},
		{
			shape: {
				position: {
					x: 944,
					y: 516,
				},
			},
			id: 'oil_tank',
			type: 'oil_tank',
			name: 'Oil Tank',
			params: {
				oil_to_gas_ratio: 1,
				output_gas_fluid_model: null,
			},
			description: '',
		},
		{
			shape: {
				position: {
					x: 414,
					y: 753,
				},
			},
			id: 'liquids_unloading',
			type: 'liquids_unloading',
			name: 'Liquids Unloading',
			params: null,
			description: '',
		},
		{
			shape: {
				position: {
					x: 662,
					y: 759,
				},
			},
			id: 'associated_gas',
			type: 'associated_gas',
			name: 'Associated Gas',
			params: null,
			description: '',
		},
		{
			shape: {
				position: {
					x: 932,
					y: 761,
				},
			},
			id: 'combustion',
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
		},
		{
			shape: {
				position: {
					x: 1134,
					y: 778,
				},
			},
			id: 'pneumatic_device',
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
		},
		{
			shape: {
				position: {
					x: 425,
					y: 1025,
				},
			},
			id: 'pnematic_pump',
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
		},
		{
			shape: {
				position: {
					x: 677,
					y: 1023,
				},
			},
			id: 'centrifugal_compressor',
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
		},
		{
			shape: {
				position: {
					x: 924,
					y: 1023,
				},
			},
			id: 'reciprocating_compressor',
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
		},
		{
			shape: {
				position: {
					x: 1204,
					y: 582,
				},
			},
			id: 'flare',
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
		},
	],
	edges: [],
	inputs: [
		{
			id: '967a0e2a-d959-4918-bf6a-6446f6d33364',
			by: Stream.gas,
			to: 'atmosphere',
			toHandle: Stream.gas,
			shape: {
				vertices: [
					{
						x: 427.4999694824219,
						y: 381.6666564941406,
					},
				],
			},
			name: 'Input Edge',
		},
	],
	outputs: [
		{
			id: 'e12f78c3-a977-4880-8ca3-3fdbff578acf',
			by: Stream.oil,
			from: 'oil_tank',
			fromHandle: Stream.oil,
			shape: {
				vertices: [
					{
						x: 1405.833251953125,
						y: 343.33331298828125,
					},
				],
			},
			name: 'Output Edge (oil)',
		},
		{
			id: '505e707d-654f-4fe7-920a-9ac92701d987',
			by: Stream.gas,
			from: 'oil_tank',
			fromHandle: Stream.gas,
			shape: {
				vertices: [
					{
						x: 1604.1666259765625,
						y: 421.6666564941406,
					},
				],
			},
			name: 'Output Edge (gas)',
		},
	],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as NetworkModelFacility;
