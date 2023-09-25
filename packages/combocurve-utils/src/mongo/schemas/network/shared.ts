/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import _ from 'lodash';
import mongoose, { EnforceDocument } from 'mongoose';

import {
	Criteria,
	EMISSION_CATEGORYS,
	EMISSION_TYPES,
	EdgeType,
	EmissionType,
	FacilityEdge,
	FacilityNode,
	FacilityNodeType,
	FuelTypes,
	InputEdge,
	NetworkEdge,
	NetworkNode,
	NetworkNodeType,
	NodeType,
	NonDisplayedStream,
	OutputEdge,
	PneumaticDeviceTypes,
	TimeSeriesCriterias,
} from './types';

const { Schema } = mongoose;

export const START_CRITERIAS = [Criteria.FPD, Criteria.schedule, Criteria.headers];
export const END_CRITERIAS = [Criteria.FPD, Criteria.schedule, Criteria.headers, Criteria.duration];

export const NETWORK_NODE_TYPES = Object.values(NetworkNodeType);
export const FACILITY_NODE_TYPES = Object.values(FacilityNodeType);

function createSubSchema(schemaDefinition: mongoose.SchemaDefinition<unknown>) {
	return new Schema(schemaDefinition, {
		autoCreate: false,
		autoIndex: false,
		_id: false,
		id: false,
		strict: 'throw',
	});
}

const NodeParamsSchemaDefinitions = {
	[NodeType.well_group]: {
		wells: [{ cast: false, type: Schema.Types.ObjectId, ref: 'wells' }],
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
	},
	[NodeType.flare]: {
		pct_flare_efficiency: { cast: false, type: Number, required: true, min: 0, max: 100 }, // default: 98
		pct_flare_unlit: { cast: false, type: Number, required: true, min: 0, max: 100 }, // default: 0
		fuel_hhv: {
			value: { cast: false, type: Number, required: true, min: 0 }, // default: 0.001235
			unit: { cast: false, type: String, required: true, enum: ['MMBtu/scf'] }, // TODO: currently unused, default: 'MMBtu/scf'
		},
	},
	[NodeType.oil_tank]: {
		output_gas_fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
		oil_to_gas_ratio: { cast: false, type: Number, required: true, min: 0 }, // 0 as a ratio does not make sense, and will create some issues in the calculations
	},
	[NodeType.atmosphere]: {
		emission_type: { cast: false, type: String, enum: [EmissionType.vented] },
	},
	[NodeType.capture]: {
		emission_type: { cast: false, type: String, enum: [EmissionType.capture] },
	},
	[NodeType.liquids_unloading]: {}, // no params
	[NodeType.associated_gas]: {}, // no params
	[NodeType.econ_output]: {}, // no params
	[NodeType.facility]: {
		facility_id: { cast: false, type: Schema.Types.ObjectId, ref: 'facilities' },
	},
	[NodeType.combustion]: {
		time_series: {
			criteria: { cast: false, type: String, enum: TimeSeriesCriterias, required: true },
			fuel_type: { cast: false, type: String, enum: FuelTypes, required: true },
			assigning_mode: { cast: false, type: String, required: false }, // not used for now, will be used for future, leave this as it is
			rows: [
				createSubSchema({
					period: { cast: false, type: String, required: true }, // either 'Start' or a date string '07/01/2023'
					consumption_rate: { cast: false, type: Number, required: true },
				}),
			],
		},
	},
	[NodeType.pneumatic_device]: {
		time_series: {
			criteria: { cast: false, type: String, enum: TimeSeriesCriterias, required: true },
			assigning_mode: { cast: false, type: String, required: false }, // not used for now, will be used for future, leave this as it is
			rows: [
				createSubSchema({
					period: { cast: false, type: String, required: true },
					count: { cast: false, type: Number, required: true },
					runtime: { cast: false, type: Number, required: true },
					device_type: { cast: false, type: String, required: true, enum: PneumaticDeviceTypes },
				}),
			],
		},
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
	},
	[NodeType.pneumatic_pump]: {
		time_series: {
			criteria: { cast: false, type: String, enum: TimeSeriesCriterias, required: true },
			assigning_mode: { cast: false, type: String, required: false }, // not used for now, will be used for future, leave this as it is
			rows: [
				createSubSchema({
					period: { cast: false, type: String, required: true },
					count: { cast: false, type: Number, required: true },
					runtime: { cast: false, type: Number, required: true },
				}),
			],
		},
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
	},
	[NodeType.centrifugal_compressor]: {
		time_series: {
			criteria: { cast: false, type: String, enum: TimeSeriesCriterias, required: true },
			assigning_mode: { cast: false, type: String, required: false }, // not used for now, will be used for future, leave this as it is
			rows: [
				createSubSchema({
					period: { cast: false, type: String, required: true },
					count: { cast: false, type: Number, required: true },
					runtime: { cast: false, type: Number, required: true },
				}),
			],
		},
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
	},
	[NodeType.reciprocating_compressor]: {
		time_series: {
			criteria: { cast: false, type: String, enum: TimeSeriesCriterias, required: true },
			assigning_mode: { cast: false, type: String, required: false }, // not used for now, will be used for future, leave this as it is
			rows: [
				createSubSchema({
					period: { cast: false, type: String, required: true },
					count: { cast: false, type: Number, required: true },
					runtime: { cast: false, type: Number, required: true },
				}),
			],
		},
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
	},
	[NodeType.drilling]: {
		time_series: {
			fuel_type: { cast: false, type: String, enum: FuelTypes, required: true },
			rows: [
				createSubSchema({
					start_date_window: { cast: false, type: String, required: true },
					consumption_rate: { cast: false, type: Number, required: true },
					start_criteria: { cast: false, type: String, required: true, enum: START_CRITERIAS },
					start_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					start_value: { cast: false, type: Number, required: false },
					end_criteria: { cast: false, type: String, required: true, enum: END_CRITERIAS },
					end_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					end_value: { cast: false, type: Number, required: false },
				}),
			],
		},
	},
	[NodeType.completion]: {
		time_series: {
			fuel_type: { cast: false, type: String, enum: FuelTypes, required: true },
			rows: [
				createSubSchema({
					start_date_window: { cast: false, type: String, required: true },
					consumption_rate: { cast: false, type: Number, required: true },
					start_criteria: { cast: false, type: String, required: true, enum: START_CRITERIAS },
					start_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					start_value: { cast: false, type: Number, required: false },
					end_criteria: { cast: false, type: String, required: true, enum: END_CRITERIAS },
					end_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					end_value: { cast: false, type: Number, required: false },
				}),
			],
		},
	},
	[NodeType.flowback]: {
		time_series: {
			rows: [
				createSubSchema({
					start_date_window: { cast: false, type: String, required: true },
					flowback_rate: { cast: false, type: Number, required: true },
					start_criteria: { cast: false, type: String, required: true, enum: START_CRITERIAS },
					start_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					start_value: { cast: false, type: Number, required: false },
					end_criteria: { cast: false, type: String, required: true, enum: END_CRITERIAS },
					end_criteria_option: { cast: false, type: String, required: false }, // This could be an enum, but is more complicated, leave for future
					end_value: { cast: false, type: Number, required: false },
				}),
			],
		},
	},
	[NodeType.custom_calculation]: {
		inputs: [
			createSubSchema({
				name: { cast: false, type: String, required: true },
				assign: { cast: false, type: Boolean, required: true }, // default: false
				by: { cast: false, type: String, required: true, enum: [EdgeType.oil, EdgeType.gas, EdgeType.water] },
			}),
		],
		outputs: [
			createSubSchema({
				name: { cast: false, type: String, required: true },
				assign: { cast: false, type: Boolean, required: true }, // default: false
				by: {
					cast: false,
					type: String,
					required: true,
					enum: [
						EdgeType.gas,
						NonDisplayedStream.CO2e,
						NonDisplayedStream.CO2,
						NonDisplayedStream.CH4,
						NonDisplayedStream.N2O,
					],
				},
				emission_type: {
					cast: false,
					type: String,
					enum: [...EMISSION_TYPES, 'N/A'],
					required: true,
				},
				category: { cast: false, type: String, required: true, enum: EMISSION_CATEGORYS },
			}),
		],
		formula: {
			simple: [
				{
					output: { cast: false, type: String, required: true },
					formula: { cast: false, type: String, required: true },
				},
			],
			advanced: { cast: false, type: String, required: false },
		},
		fluid_model: { cast: false, type: Schema.Types.ObjectId, ref: 'assumptions' },
		active_formula: { cast: false, type: String, enum: ['simple', 'advanced'], required: true },
	},
} satisfies Record<NodeType, mongoose.SchemaDefinition<unknown>>;

// TODO: Can make a params Type for each node, and then this any and unknown can be replaced with union of all params types
// TODO: We do not need to fix this now, in the future we could move this to mongoose-model package
export const nodeParamsModels: Record<NodeType, mongoose.Model<any>> = {} as Record<NodeType, mongoose.Model<unknown>>;

for (const [nodeType, schemaDefinition] of Object.entries(NodeParamsSchemaDefinitions)) {
	// TODO check https://stackoverflow.com/questions/38685504/how-to-create-a-mongoose-model-without-creating-a-collection-in-mongodb
	nodeParamsModels[nodeType as NodeType] = mongoose.model(
		`__network_node_schema_${nodeType}`,
		createSubSchema(schemaDefinition)
	);
}

export const NetworkNodeSchema = new Schema<NetworkNode>(
	{
		id: { type: String, required: true },
		type: { type: String, enum: NETWORK_NODE_TYPES, required: true },
		params: { type: Object, required: false, default: {} },
		name: { type: String, required: false },
		description: { type: String, required: false },
		shape: {
			position: {
				x: { type: Number, required: true, default: 0 },
				y: { type: Number, required: true, default: 0 },
			},
		},
	},
	{
		_id: false,
		minimize: false,
	}
);
// If we need to initialize the sub document for params using the schema. Queue can be used here.
// See https://github.com/Automattic/mongoose/issues/672#issuecomment-178038854
// NetworkNodeSchema.methods.initializeParamsDoc = function () {
// 	const nodeType = this.type as NodeType;
// 	if (nodeType && this.params instanceof Object) {
// 		const paramsDoc = new nodeParamsModels[nodeType](this.params);
// 		this.params = paramsDoc.toObject();
// 	}
// };
// NetworkNodeSchema.queue('initializeParamsDoc', []);

async function validateParams(
	this: EnforceDocument<NetworkNode, unknown>,
	_doc: NetworkNode,
	next: mongoose.HookNextFunction
) {
	const nodeType = this.type;
	// TODO: for inquids_unloading, params might be null/undefined, need to make sure that is allowed
	if (!(this.params instanceof Object)) {
		next(this.invalidate('params', 'Params must be an object')!);
	}

	const paramsDoc = new nodeParamsModels[nodeType](this.params);

	// NOTE: use validateSync here is to because we do not need to run post validate hook for the params
	// May need to use validate in the future if post validation is needed
	const error = paramsDoc.validateSync();
	if (!error) next();

	const actualError = Object.values(error.errors)[0];

	// The following checking should always be true, but ts does not know that
	if (actualError instanceof Error) {
		next(this.invalidate('params', actualError.message)!);
	} else {
		throw actualError;
	}
}

NetworkNodeSchema.post('validate', validateParams);

export const FacilityNodeSchema = new Schema<FacilityNode>(
	{
		id: { type: String, required: true },
		type: { type: String, enum: FACILITY_NODE_TYPES, required: true },
		params: { type: Object, required: false, default: {} },
		name: { type: String, required: false },
		description: { type: String, required: false },
		shape: {
			position: {
				x: { type: Number, required: true, default: 0 },
				y: { type: Number, required: true, default: 0 },
			},
		},
	},
	{
		_id: false,
		minimize: false,
	}
);

FacilityNodeSchema.post('validate', validateParams);

// TODO: The following schema can be defined using Schema.Discriminator in mongoose==7.3.4
export const InputEdgeSchema = new Schema<InputEdge>(
	{
		id: { type: String, required: true },
		by: { type: String, enum: [EdgeType.oil, EdgeType.gas, EdgeType.water], required: true },
		to: { type: String, required: true },
		toHandle: { type: String, required: false },
		name: { type: String, required: false },
		description: { type: String, required: false },
		shape: { type: Schema.Types.Mixed, required: false }, // TODO: update shape to be a SubSchema
	},
	{
		_id: false,
		minimize: false,
		strict: 'throw',
	}
);

export const OutputEdgeSchema = new Schema<OutputEdge>(
	{
		id: { type: String, required: true },
		by: { type: String, enum: [EdgeType.oil, EdgeType.gas, EdgeType.water], required: true },
		from: { type: String, required: true },
		fromHandle: { type: String, required: false },
		name: { type: String, required: false },
		description: { type: String, required: false },
		shape: { type: Schema.Types.Mixed, required: false },
	},
	{
		_id: false,
		minimize: false,
		strict: 'throw',
	}
);

const EdgeParamsSchema = new Schema<{
	time_series: {
		criteria: 'entire_well_life' | 'dates';
		rows: { period: string; allocation: number }[];
	};
}>({
	time_series: {
		criteria: { type: String, enum: ['entire_well_life', 'dates'], required: true },
		rows: [{ period: { type: String, required: true }, allocation: { type: Number, required: true } }],
	},
});

export const NetworkEdgeSchema = new Schema<NetworkEdge>(
	{
		id: { type: String, required: true },
		by: {
			type: String,
			enum: [EdgeType.oil, EdgeType.gas, EdgeType.water, EdgeType.link, EdgeType.development],
			required: true,
		}, // TODO this can probably be user defined and not a enum after implementing the custom stream
		from: { type: String, required: true },
		fromHandle: { type: String, required: false },
		fromFacilityObjectId: { type: String, required: false }, // This field can be removed if we use fromHandle to get the fromNode
		to: { type: String, required: true },
		toHandle: { type: String, required: false },
		toFacilityObjectId: { type: String, required: false }, // This field can be removed if we use toHandle to get the toNode
		params: { type: EdgeParamsSchema, required: false },
		name: { type: String, required: false }, // defaults to id
		description: { type: String, required: false },
		shape: { type: Schema.Types.Mixed, required: false }, // for jointjs { vertices: [] }
	},
	{ _id: false, minimize: false, strict: 'throw' }
);

export const FacilityEdgeSchema = new Schema<FacilityEdge>(
	{
		id: { type: String, required: true },
		by: {
			type: String,
			enum: [EdgeType.oil, EdgeType.gas, EdgeType.water],
			required: true,
		}, // TODO this can probably be user defined and not a enum after implementing the custom stream
		from: { type: String, required: true },
		fromHandle: { type: String, required: false },
		to: { type: String, required: true },
		toHandle: { type: String, required: false },
		params: { type: EdgeParamsSchema, required: true },
		name: { type: String, required: false }, // defaults to id
		description: { type: String, required: false },
		shape: { type: Schema.Types.Mixed, required: false }, // for jointjs { vertices: [] }
	},
	{ _id: false, minimize: false, strict: 'throw' }
);

export function enforceValidateBeforeUpdate<T>(schema: mongoose.Schema<T>) {
	schema.pre('update', function (this, next) {
		// @ts-expect-error there's an error from mongoose
		this.options.runValidators = true;
		next();
	});

	schema.pre('updateOne', function (this, next) {
		// @ts-expect-error there's an error from mongoose
		this.options.runValidators = true;
		next();
	});

	schema.pre('findOneAndUpdate', function (this, next) {
		// @ts-expect-error there's an error from mongoose
		this.options.runValidators = true;
		next();
	});

	schema.pre('updateMany', function (this, next) {
		// @ts-expect-error there's an error from mongoose
		this.options.runValidators = true;
		next();
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO fix later
export function updateNetworkTopLevelIds(network: any) {
	const toObjectId = (str: string | typeof mongoose.Types.ObjectId) =>
		typeof str === 'string' ? new mongoose.Types.ObjectId(str) : str;
	const toString = (v: string | object) => (typeof v === 'object' ? v.toString() : v);

	let wells: (typeof mongoose.Types.ObjectId)[] = [];
	let facilities: (typeof mongoose.Types.ObjectId)[] = [];
	let fluidModels: (typeof mongoose.Types.ObjectId)[] = [];

	for (let i = 0; i < network.nodes.length; i++) {
		const thisNode = network.nodes[i];
		switch (thisNode.type) {
			case 'well_group':
				thisNode.params.wells = thisNode.params.wells.map(toObjectId);
				thisNode.params.fluid_model = toObjectId(thisNode.params.fluid_model);
				wells = [...wells, ...thisNode.params.wells];
				if (thisNode.params.fluid_model) {
					fluidModels.push(thisNode.params.fluid_model);
				}
				break;
			case 'oil_tank':
				thisNode.params.output_gas_fluid_model = toObjectId(thisNode.params.output_gas_fluid_model);
				if (thisNode.params.output_gas_fluid_model) {
					fluidModels.push(thisNode.params.output_gas_fluid_model);
				}
				break;
			case 'facility':
				thisNode.params.facility_id = toObjectId(thisNode.params.facility_id);
				if (thisNode.params.facility_id) {
					facilities.push(thisNode.params.facility_id);
				}
				break;
			case 'custom_calculation':
			case 'pneumatic_device':
			case 'pneumatic_pump':
				thisNode.params.fluid_model = toObjectId(thisNode.params.fluid_model);
				if (thisNode.params.fluid_model) {
					fluidModels.push(thisNode.params.fluid_model);
				}
				break;
			default:
				break;
		}
	}

	wells = _.uniqBy(wells, toString);
	facilities = _.uniqBy(facilities, toString);
	fluidModels = _.uniqBy(fluidModels, toString);

	Object.assign(network, { wells, facilities, fluidModels });
}
