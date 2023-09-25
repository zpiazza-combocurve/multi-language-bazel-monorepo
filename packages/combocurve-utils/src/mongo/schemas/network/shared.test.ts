import { MongoMemoryServer } from 'mongodb-memory-server-global-4.2';
import mongoose from 'mongoose';

import { FacilitySchema } from '../facilities';
import { NetworkSchema } from '../networks';
import {
	END_CRITERIAS,
	FacilityEdgeSchema,
	FacilityNodeSchema,
	InputEdgeSchema,
	NetworkEdgeSchema,
	NetworkNodeSchema,
	OutputEdgeSchema,
	START_CRITERIAS,
} from './shared';
import { EMISSION_CATEGORYS, FuelTypes, NodeType, PneumaticDeviceTypes, TimeSeriesCriterias } from './types';

async function shouldBeValid(doc: mongoose.Document): Promise<void> {
	await expect(doc.validate()).resolves.toBeUndefined();
}

const NetworkNodeModel = mongoose.model('network-nodes', NetworkNodeSchema);
const FacilityNodeModel = mongoose.model('facility-nodes', FacilityNodeSchema);

const InputEdgeModel = mongoose.model('input-edges', InputEdgeSchema);
const OutputEdgeModel = mongoose.model('output-edges', OutputEdgeSchema);
const FacilityEdgeModel = mongoose.model('facility-edges', FacilityEdgeSchema);
const NetworkEdgeModel = mongoose.model('network-edges', NetworkEdgeSchema);

const NetworkModel = mongoose.model('networks', NetworkSchema);
const FacilityModel = mongoose.model('facilities', FacilitySchema);

describe('Network', () => {
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		const connectionString = await mongoServer.getUri('test');
		await mongoose.connect(connectionString);
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
		await mongoServer.stop();
	});

	describe('Edges', () => {
		describe('All Edge Schemas', () => {
			it('Must have id', async () => {
				await expect(new InputEdgeModel({}).validate()).rejects.toThrow('Path `id` is required.');
				await expect(new OutputEdgeModel({}).validate()).rejects.toThrow('Path `id` is required.');
				await expect(new FacilityEdgeModel({}).validate()).rejects.toThrow('Path `id` is required.');
				await expect(new NetworkEdgeModel({}).validate()).rejects.toThrow('Path `id` is required.');
			});

			it('Must have by', async () => {
				await expect(new InputEdgeModel({ id: 'node1' }).validate()).rejects.toThrow('Path `by` is required.');
				await expect(new OutputEdgeModel({ id: 'node1' }).validate()).rejects.toThrow('Path `by` is required.');
				await expect(new FacilityEdgeModel({ id: 'node1' }).validate()).rejects.toThrow(
					'Path `by` is required.'
				);
				await expect(new NetworkEdgeModel({ id: 'node1' }).validate()).rejects.toThrow(
					'Path `by` is required.'
				);
			});

			it('Name will be casted to string, and is optional', async () => {
				await expect(new InputEdgeModel({ id: 'node1', by: 'oil', name: 123 }).name).toBe('123');
				await shouldBeValid(new InputEdgeModel({ id: 'node1', by: 'oil', to: 'node2' }));

				await expect(new OutputEdgeModel({ id: 'node1', by: 'oil', name: 123 }).name).toBe('123');
				await shouldBeValid(new OutputEdgeModel({ id: 'node1', by: 'oil', from: 'node2' }));

				await expect(new FacilityEdgeModel({ id: 'node1', by: 'oil', name: 123 }).name).toBe('123');
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);

				await expect(new NetworkEdgeModel({ id: 'node1', by: 'oil', name: 123 }).name).toBe('123');
				await shouldBeValid(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
			});

			it('Description will be casted to string, and is optional', async () => {
				await expect(new InputEdgeModel({ id: 'node1', by: 'oil', description: 123 }).description).toBe('123');
				await shouldBeValid(new InputEdgeModel({ id: 'node1', by: 'oil', to: 'node2' }));

				await expect(new OutputEdgeModel({ id: 'node1', by: 'oil', description: 123 }).description).toBe('123');
				await shouldBeValid(new OutputEdgeModel({ id: 'node1', by: 'oil', from: 'node2' }));

				await expect(new FacilityEdgeModel({ id: 'node1', by: 'oil', description: 123 }).description).toBe(
					'123'
				);
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);

				await expect(new NetworkEdgeModel({ id: 'node1', by: 'oil', description: 123 }).description).toBe(
					'123'
				);
				await shouldBeValid(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
			});
		});

		describe('Input Edge Schema', () => {
			it('Must have to', async () => {
				await expect(new InputEdgeModel({ id: 'node1', by: 'oil' }).validate()).rejects.toThrow(
					'Path `to` is required.'
				);
			});

			it('by must be one of oil, gas, water', async () => {
				for (const by of ['oil', 'gas', 'water']) {
					await shouldBeValid(new InputEdgeModel({ id: 'node1', by, to: 'node2' }));
				}

				await expect(new InputEdgeModel({ id: 'node1', by: 'link', to: 'node2' }).validate()).rejects.toThrow(
					'`link` is not a valid enum value for path `by`.'
				);

				await expect(
					new InputEdgeModel({ id: 'node1', by: 'development', to: 'node2' }).validate()
				).rejects.toThrow('`development` is not a valid enum value for path `by`.');

				await expect(new InputEdgeModel({ id: 'node1', by: 'random', to: 'node2' }).validate()).rejects.toThrow(
					'`random` is not a valid enum value for path `by`.'
				);
			});

			it('Can not initialize InputEdge with params field', () => {
				expect(() => new InputEdgeModel({ id: 'node1', by: 'oil', to: 'node2', params: {} })).toThrow(
					'Field `params` is not in schema and strict mode is set to throw.'
				);
			});

			it('Can not initialize InputEdge with toFacilityObjectId field', () => {
				expect(
					() => new InputEdgeModel({ id: 'node1', by: 'oil', to: 'node2', toFacilityObjectId: 'facilityid' })
				).toThrow('Field `toFacilityObjectId` is not in schema and strict mode is set to throw.');
			});
		});

		describe('Output Edge Schema', () => {
			it('Must have from', async () => {
				await expect(new OutputEdgeModel({ id: 'node1', by: 'oil' }).validate()).rejects.toThrow(
					'Path `from` is required.'
				);
			});

			it('by must be one of oil, gas, water', async () => {
				for (const by of ['oil', 'gas', 'water']) {
					await shouldBeValid(new OutputEdgeModel({ id: 'node1', by, from: 'node2' }));
				}

				await expect(
					new OutputEdgeModel({ id: 'node1', by: 'link', from: 'node2' }).validate()
				).rejects.toThrow('`link` is not a valid enum value for path `by`.');

				await expect(
					new OutputEdgeModel({ id: 'node1', by: 'development', from: 'node2' }).validate()
				).rejects.toThrow('`development` is not a valid enum value for path `by`.');

				await expect(
					new OutputEdgeModel({ id: 'node1', by: 'random', from: 'node2' }).validate()
				).rejects.toThrow('`random` is not a valid enum value for path `by`.');
			});

			it('Can not initialize OutputEdge with params field', () => {
				expect(() => new OutputEdgeModel({ id: 'node1', by: 'oil', from: 'node2', params: {} })).toThrow(
					'Field `params` is not in schema and strict mode is set to throw.'
				);
			});

			it('Can not initialize OutputEdge with fromFacilityObjectId field', () => {
				expect(
					() =>
						new OutputEdgeModel({
							id: 'node1',
							by: 'oil',
							from: 'node2',
							fromFacilityObjectId: 'facilityid',
						})
				).toThrow('Field `fromFacilityObjectId` is not in schema and strict mode is set to throw.');
			});
		});

		describe('Facility Edge Schema', () => {
			it('Must have from', async () => {
				await expect(new FacilityEdgeModel({ id: 'node1', by: 'oil' }).validate()).rejects.toThrow(
					'Path `from` is required.'
				);
			});

			it('Must have to', async () => {
				await expect(
					new FacilityEdgeModel({ id: 'node1', by: 'oil', from: 'node2' }).validate()
				).rejects.toThrow('Path `to` is required.');
			});

			it('Must have params', async () => {
				await expect(
					new FacilityEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3' }).validate()
				).rejects.toThrow('Path `params` is required.');
			});

			it('params.time_series.criteria should be either entire_well_life or dates', async () => {
				await expect(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'random', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`random` is not a valid enum value for path `time_series.criteria`.');

				for (const criteria of ['entire_well_life', 'dates']) {
					await shouldBeValid(
						new FacilityEdgeModel({
							id: 'node1',
							by: 'oil',
							from: 'node2',
							to: 'node3',
							params: {
								// When criteria == 'dates', period can not be flat, but here we are just testing criteria
								time_series: { criteria, rows: [{ period: 'Flat', allocation: 100 }] },
							},
						})
					);
				}
			});

			it('params.time_series.rows should be an array', async () => {
				await expect(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: 'qwe' },
						},
					}).validate()
				).rejects.toThrow(
					'facility-edges validation failed: params.time_series.rows:' +
						' Cast to embedded failed for value "\'qwe\'" (type string) ' +
						'at path "time_series.rows", params: Validation failed: ' +
						'time_series.rows: Cast to embedded failed for value "\'qwe\'" ' +
						'(type string) at path "time_series.rows"'
				);

				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'dates', rows: [] },
						},
					})
				);
			});

			it('by must be one of oil, gas, water', async () => {
				for (const by of ['oil', 'gas', 'water']) {
					await shouldBeValid(
						new FacilityEdgeModel({
							id: 'node1',
							by,
							from: 'node2',
							to: 'node3',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [{ period: 'Flat', allocation: 100 }],
								},
							},
						})
					);
				}

				await expect(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'link',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`link` is not a valid enum value for path `by`.');

				await expect(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'development',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`development` is not a valid enum value for path `by`.');

				await expect(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'random',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`random` is not a valid enum value for path `by`.');
			});

			it('Can not initialize FacilityEdge with fromFacilityObjectId/toFacilityObjectId field', () => {
				expect(
					() =>
						new FacilityEdgeModel({
							id: 'node1',
							by: 'oil',
							from: 'node2',
							to: 'node3',
							fromFacilityObjectId: 'facilityid',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [{ period: 'Flat', allocation: 100 }],
								},
							},
						})
				).toThrow('Field `fromFacilityObjectId` is not in schema and strict mode is set to throw.');
				expect(
					() =>
						new FacilityEdgeModel({
							id: 'node1',
							by: 'oil',
							from: 'node2',
							to: 'node3',
							toFacilityObjectId: 'facilityid',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [{ period: 'Flat', allocation: 100 }],
								},
							},
						})
				).toThrow('Field `toFacilityObjectId` is not in schema and strict mode is set to throw.');
			});

			it('FromHandle and toHandle are optional', async () => {
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						fromHandle: 'hanlde1',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						toHandle: 'hanlde1',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
				await shouldBeValid(
					new FacilityEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						fromHandle: 'hanlde1',
						toHandle: 'handle2',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					})
				);
			});
		});

		describe('Network Edge Schema', () => {
			it('Must have from', async () => {
				await expect(new NetworkEdgeModel({ id: 'node1', by: 'oil' }).validate()).rejects.toThrow(
					'Path `from` is required.'
				);
			});

			it('Must have to', async () => {
				await expect(
					new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2' }).validate()
				).rejects.toThrow('Path `to` is required.');
			});

			// TODO: check with team to see if this makes sense
			it('params is optional, but an empty object is not accepted because params.time_series.criteria is required', async () => {
				await shouldBeValid(new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3' }));
				await expect(
					new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3', params: {} }).validate()
				).rejects.toThrow(
					'network-edges validation failed: params.time_series.criteria: Path `time_series.criteria` is required., params: Validation failed: time_series.criteria: Path `time_series.criteria` is required.'
				);
			});

			it('params.time_series.criteria should be either entire_well_life or dates', async () => {
				await expect(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'random', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`random` is not a valid enum value for path `time_series.criteria`.');

				for (const criteria of ['entire_well_life', 'dates']) {
					await shouldBeValid(
						new NetworkEdgeModel({
							id: 'node1',
							by: 'oil',
							from: 'node2',
							to: 'node3',
							params: {
								// When criteria == 'dates', period can not be flat, but here we are just testing criteria
								time_series: { criteria, rows: [{ period: 'Flat', allocation: 100 }] },
							},
						})
					);
				}
			});

			it('params.time_series.rows should be an array', async () => {
				await expect(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: 'qwe' },
						},
					}).validate()
				).rejects.toThrow(
					'network-edges validation failed: params.time_series.rows:' +
						' Cast to embedded failed for value "\'qwe\'" (type string) ' +
						'at path "time_series.rows", params: Validation failed: ' +
						'time_series.rows: Cast to embedded failed for value "\'qwe\'" ' +
						'(type string) at path "time_series.rows"'
				);

				await shouldBeValid(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'dates', rows: [] },
						},
					})
				);
			});

			it('by must be one of oil, gas, water, link, development', async () => {
				for (const by of ['oil', 'gas', 'water', 'link', 'development']) {
					await shouldBeValid(
						new NetworkEdgeModel({
							id: 'node1',
							by,
							from: 'node2',
							to: 'node3',
							params: {
								time_series: {
									criteria: 'entire_well_life',
									rows: [{ period: 'Flat', allocation: 100 }],
								},
							},
						})
					);
				}

				await expect(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'random',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					}).validate()
				).rejects.toThrow('`random` is not a valid enum value for path `by`.');
			});

			it('Can initialize NetworkEdge with fromFacilityObjectId/toFacilityObjectId field', async () => {
				await shouldBeValid(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
						fromFacilityObjectId: 'facilityid',
						toFacilityObjectId: 'facilityid',
					})
				);
			});

			it('FromHandle and toHandle are optional', async () => {
				await shouldBeValid(new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3' }));
				await shouldBeValid(
					new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3', fromHandle: 'hanlde1' })
				);
				await shouldBeValid(
					new NetworkEdgeModel({ id: 'node1', by: 'oil', from: 'node2', to: 'node3', toHandle: 'hanlde1' })
				);
				await shouldBeValid(
					new NetworkEdgeModel({
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						fromHandle: 'hanlde1',
						toHandle: 'handle2',
					})
				);
			});
		});

		describe('General NetworkNodeSchema', () => {
			// const NetworkModel = mongoose.model('networks', NetworkSchema);

			it('Must have id', async () => {
				const doc = new NetworkNodeModel({ type: 'well_group' });
				await expect(doc.validate()).rejects.toThrow('Path `id` is required.');
			});

			it('Must have type', async () => {
				const doc = new NetworkNodeModel({ id: 'node1' });
				await expect(doc.validate()).rejects.toThrow('Path `type` is required.');
			});

			it('Default position is x = 0, y = 0. x and y can be provided separately', async () => {
				const doc1 = new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading' });
				await shouldBeValid(doc1);
				expect(doc1.shape.position).toEqual({ x: 0, y: 0 });

				const doc2 = new NetworkNodeModel({
					id: 'node1',
					type: 'liquids_unloading',
					shape: { position: { x: 123 } },
				});
				await shouldBeValid(doc2);
				expect(doc2.shape.position).toEqual({ x: 123, y: 0 });

				const doc3 = new NetworkNodeModel({
					id: 'node1',
					type: 'liquids_unloading',
					shape: { position: { y: 123 } },
				});
				await shouldBeValid(doc3);
				expect(doc3.shape.position).toEqual({ x: 0, y: 123 });
			});

			it('Name will be casted to string', async () => {
				const doc = new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading', name: 123 });
				shouldBeValid(doc);
				expect(doc.name).toEqual('123');

				await expect(
					new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading', name: [] }).validate()
				).rejects.toThrow('Cast to string failed for value "[]" (type Array) at path "name"');
			});

			it('Description will be casted to string', async () => {
				const doc = new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading', description: 123 });
				shouldBeValid(doc);
				expect(doc.description).toEqual('123');

				await expect(
					new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading', description: [] }).validate()
				).rejects.toThrow('Cast to string failed for value "[]" (type Array) at path "description"');
			});

			it('Params must be an object, will not be casted by creation, but will be catched by post validation', async () => {
				const doc = new NetworkNodeModel({ id: 'node1', type: 'liquids_unloading', params: 123 });

				expect(doc.params).toBe(123); // This means that the params will not be casted to Object by creation
				await expect(doc.validate()).rejects.toThrow('Params must be an object');
			});
		});
	});

	describe('Nodes', () => {
		describe('Well Group', () => {
			it('wells must be a list of ObjectIds', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.well_group,
						params: {
							wells: ['asd', 123],
						},
					}).validate()
				).rejects.toThrow('Cast to [ObjectId] failed for value "["asd",123]" (type string) at path "wells.0"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.well_group,
						params: {
							wells: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
						},
					})
				);
			});

			it('Fluid Model must be an ObjectId', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.well_group,
						params: {
							wells: [],
							fluid_model: 'asd',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "asd" (type string) at path "fluid_model"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.well_group,
						params: {
							wells: [],
							fluid_model: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
		});

		describe('Flare', () => {
			it('pct_flare_efficiency wont be casted to number, and is required and range is 0-100', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: '12',
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "12" (type string) at path "pct_flare_efficiency"');

				// required check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_efficiency` is required.');

				// upper bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 101,
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_efficiency` (101) is more than maximum allowed value (100).');

				//lower bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: -1,
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_efficiency` (-1) is less than minimum allowed value (0).');
			});

			it('pct_flare_unlit wont be casted to number, and is required and range is 0-100', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: '12',
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "12" (type string) at path "pct_flare_unlit"');

				// required check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_unlit` is required.');

				// upper bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 101,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_unlit` (101) is more than maximum allowed value (100).');

				//lower bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: -1,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `pct_flare_unlit` (-1) is less than minimum allowed value (0).');
			});

			it('fuel_hhv: value wont be casted to number, and is required and range is 0-100; unit must be "MMBtu/scf"', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 12,
							fuel_hhv: {
								value: '0.001235',
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "0.001235" (type string) at path "fuel_hhv.value"');

				// required check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 12,
							fuel_hhv: {
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `fuel_hhv.value` is required.');

				//lower bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 12,
							fuel_hhv: {
								value: -1,
								unit: 'MMBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('Path `fuel_hhv.value` (-1) is less than minimum allowed value (0).');

				// unit must be in enum
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 12,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MBtu/scf',
							},
						},
					}).validate()
				).rejects.toThrow('`MBtu/scf` is not a valid enum value for path `fuel_hhv.unit`.');

				// unit is required
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 12,
							fuel_hhv: {
								value: 0.001235,
							},
						},
					}).validate()
				).rejects.toThrow('Path `fuel_hhv.unit` is required.');
			});
		});

		describe('Custom Calculation Node', () => {
			it('active_formula is required and must be in [simple, advanced]', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {},
					}).validate()
				).rejects.toThrow('Path `active_formula` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: { active_formula: 'asd' },
					}).validate()
				).rejects.toThrow('`asd` is not a valid enum value for path `active_formula`.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: { active_formula: 'simple' },
					})
				);

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: { active_formula: 'advanced' },
					})
				);
			});

			it('inputs name, assign, by are required; by should be in [oil, gas, water]; assign should be boolean', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{}],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `by` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{ by: 'oil' }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `assign` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{ by: 'oil', assign: true }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `name` is required.');

				// by should be in [oil, gas, water]
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{ name: '123', by: 'asd', assign: true }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('`asd` is not a valid enum value for path `by`.');

				for (const by of ['oil', 'gas', 'water']) {
					await shouldBeValid(
						new NetworkNodeModel({
							id: 'node1',
							type: NodeType.custom_calculation,
							params: {
								inputs: [{ name: '123', by, assign: true }],
								active_formula: 'simple',
							},
						})
					);
				}

				// assign should be boolean
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{ name: '123', by: 'oil', assign: 123 }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Cast to Boolean failed for value "123" (type number) at path "assign"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							inputs: [{ name: '123', by: 'gas', assign: false }],
							active_formula: 'simple',
						},
					})
				);
			});

			it('output name, assign, by, emission_type, category are required', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [{}],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `category` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [{ category: 'flare' }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `emission_type` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [{ category: 'flare', emission_type: 'vented' }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `by` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [{ by: 'gas', category: 'flare', emission_type: 'vented' }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `assign` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [{ assign: true, by: 'gas', category: 'flare', emission_type: 'vented' }],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `name` is required.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [
								{ name: '123', assign: true, by: 'gas', category: 'flare', emission_type: 'vented' },
							],
							active_formula: 'simple',
						},
					})
				);
			});

			it('output: by in [gas, CO2e, CO2, CH4, N2O]; emission_type in [vented, combustion, flare, capture, electricity], category in EMISSION_CATEGORYS', async () => {
				for (const by of ['gas', 'CO2e', 'CO2', 'CH4', 'N2O']) {
					for (const emission_type of ['vented', 'combustion', 'flare', 'capture', 'electricity']) {
						for (const category of EMISSION_CATEGORYS) {
							await shouldBeValid(
								new NetworkNodeModel({
									id: 'node1',
									type: NodeType.custom_calculation,
									params: {
										outputs: [{ name: '123', assign: true, by, category, emission_type }],
										active_formula: 'simple',
									},
								})
							);
						}
					}
				}
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [
								{ name: '123', assign: true, by: '123', category: 'flare', emission_type: 'vented' },
							],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('`123` is not a valid enum value for path `by`.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [
								{ name: '123', assign: true, by: 'gas', category: 'oil', emission_type: 'vented' },
							],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('`oil` is not a valid enum value for path `category`.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							outputs: [
								{ name: '123', assign: true, by: 'gas', category: 'flare', emission_type: 'qwe' },
							],
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('`qwe` is not a valid enum value for path `emission_type`.');
			});

			it('formula.simple should be an array of {output: required, formula: required}', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							formula: { simple: [{ output: 'oil' }] },
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `formula` is required.');

				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							formula: { simple: [{ formula: 'oil' }] },
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Path `output` is required.');
			});

			it('fluid_model should be an ObjectId', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							fluid_model: '123',
							active_formula: 'simple',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "fluid_model"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.custom_calculation,
						params: {
							fluid_model: new mongoose.Types.ObjectId(),
							active_formula: 'simple',
						},
					})
				);
			});
		});

		describe('Oil Tank', () => {
			it('output_gas_fluid_model should be an ObjectId', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: '123',
							oil_to_gas_ratio: 2,
						},
					}).validate()
				).rejects.toThrow(
					'Cast to ObjectId failed for value "123" (type string) at path "output_gas_fluid_model"'
				);

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: 2,
						},
					})
				);
			});

			it('oil_to_gas_ratio is required', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
						},
					}).validate()
				).rejects.toThrow('Path `oil_to_gas_ratio` is required.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: 2,
						},
					})
				);
			});

			it('oil_to_gas_ratio should be a number', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: '2',
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "2" (type string) at path "oil_to_gas_ratio"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: 2,
						},
					})
				);
			});

			it('oil_to_gas_ratio should be greater than 0', async () => {
				//lower bound check
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: -1,
						},
					}).validate()
				).rejects.toThrow('Path `oil_to_gas_ratio` (-1) is less than minimum allowed value (0).');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.oil_tank,
						params: {
							output_gas_fluid_model: new mongoose.Types.ObjectId(),
							oil_to_gas_ratio: 2,
						},
					})
				);
			});
		});

		describe('Atmosphere', () => {
			it('emission_type should be `vented`', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.atmosphere,
						params: {
							emission_type: 'capture',
						},
					}).validate()
				).rejects.toThrow('`capture` is not a valid enum value for path `emission_type`.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.atmosphere,
						params: {
							emission_type: 'vented',
						},
					})
				);
			});
		});

		describe('Capture', () => {
			it('emission_type should be a `capture`', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.capture,
						params: {
							emission_type: 'vented',
						},
					}).validate()
				).rejects.toThrow('`vented` is not a valid enum value for path `emission_type`.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.capture,
						params: {
							emission_type: 'capture',
						},
					})
				);
			});
		});

		describe('Facility', () => {
			it('facility_id should be an ObjectId', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.facility,
						params: {
							facility_id: '123',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "facility_id"');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.facility,
						params: {
							facility_id: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
		});

		describe('Associated Gas', () => {
			it('Should not have any params', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.associated_gas,
						params: {
							a: 123,
						},
					}).validate()
				).rejects.toThrow('Field `a` is not in schema and strict mode is set to throw.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.associated_gas,
						params: {},
					})
				);
			});
		});

		describe('Liquids Unloading', () => {
			it('Should not have any params', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.liquids_unloading,
						params: {
							a: 123,
						},
					}).validate()
				).rejects.toThrow('Field `a` is not in schema and strict mode is set to throw.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.liquids_unloading,
						params: {},
					})
				);
			});
		});

		describe('Econ Output', () => {
			it('Should not have any params', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.econ_output,
						params: {
							a: 123,
						},
					}).validate()
				).rejects.toThrow('Field `a` is not in schema and strict mode is set to throw.');

				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.econ_output,
						params: {},
					})
				);
			});
		});

		describe('Combustion', () => {
			it('time_series fuel_type required and in FuelTypes, criteria required and in TimeSeriesCriterias', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								criteria: 'entire_well_life',
							},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.fuel_type` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
							},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.criteria` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: 'diesel',
								criteria: 'entire_well_life',
							},
						},
					}).validate()
				).rejects.toThrow('`diesel` is not a valid enum value for path `time_series.fuel_type`.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: 'flat',
							},
						},
					}).validate()
				).rejects.toThrow('`flat` is not a valid enum value for path `time_series.criteria`.');
				for (const criteria of TimeSeriesCriterias) {
					for (const fuel_type of FuelTypes) {
						shouldBeValid(
							new FacilityNodeModel({
								id: 'node1',
								type: NodeType.combustion,
								params: {
									time_series: {
										fuel_type,
										criteria,
									},
								},
							})
						);
					}
				}
			});
			it('time_series.rows period and consumption rate are required', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `consumption_rate` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										consumption_rate: 1,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `period` is required.');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										consumption_rate: 1,
									},
								],
							},
						},
					})
				);
			});
			it('period must be a string', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: 1,
										consumption_rate: 1,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "period"');
			});
			it('consumption_rate must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										consumption_rate: '1',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "1" (type string) at path "consumption_rate"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										consumption_rate: 1.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.combustion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										consumption_rate: -100,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Pneumatic Device', () => {
			it('time_series criteria required and in TimeSeriesCriterias', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.criteria` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: 'flat',
							},
						},
					}).validate()
				).rejects.toThrow('`flat` is not a valid enum value for path `time_series.criteria`.');
				for (const criteria of TimeSeriesCriterias) {
					shouldBeValid(
						new FacilityNodeModel({
							id: 'node1',
							type: NodeType.pneumatic_device,
							params: {
								time_series: {
									criteria,
								},
							},
						})
					);
				}
			});
			it('fluid_model should be an ObjectId', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: '123',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "fluid_model"');

				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
			it('time_series.rows period, device_type, count and runtime are required', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										device_type: 'intermittent',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `period` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `device_type` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `count` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `runtime` is required.');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('period must be a string', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: 1,
										device_type: 'intermittent',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "period"');
			});
			it('device_type must be a string and in PneumaticDeviceTypes', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 5,
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "device_type"');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'high',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`high` is not a valid enum value for path `device_type`.');
				for (const device_type of PneumaticDeviceTypes) {
					await shouldBeValid(
						new FacilityNodeModel({
							id: 'node1',
							type: NodeType.pneumatic_device,
							params: {
								time_series: {
									criteria: TimeSeriesCriterias[0],
									rows: [
										{
											period: '1',
											device_type,
											count: 0,
											runtime: 8760,
										},
									],
								},
							},
						})
					);
				}
			});
			it('count must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: '0',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "0" (type string) at path "count"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0.5,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: -10,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('runtime must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0,
										runtime: '8760',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "8760" (type string) at path "runtime"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0,
										runtime: 8760.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_device,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										device_type: 'intermittent',
										count: 0,
										runtime: -8760,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Pneumatic Pump', () => {
			it('time_series criteria required and in TimeSeriesCriterias', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.criteria` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: 'flat',
							},
						},
					}).validate()
				).rejects.toThrow('`flat` is not a valid enum value for path `time_series.criteria`.');
				for (const criteria of TimeSeriesCriterias) {
					shouldBeValid(
						new FacilityNodeModel({
							id: 'node1',
							type: NodeType.pneumatic_pump,
							params: {
								time_series: {
									criteria,
								},
							},
						})
					);
				}
			});
			it('fluid_model should be an ObjectId', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: '123',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "fluid_model"');

				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
			it('time_series.rows period, count and runtime are required', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `period` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `count` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `runtime` is required.');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('period must be a string', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: 1,
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "period"');
			});
			it('count must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: '0',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "0" (type string) at path "count"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0.5,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: -10,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('runtime must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: '8760',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "8760" (type string) at path "runtime"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.pneumatic_pump,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: -8760,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Centrifugal Compressor', () => {
			it('time_series criteria required and in TimeSeriesCriterias', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.criteria` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: 'flat',
							},
						},
					}).validate()
				).rejects.toThrow('`flat` is not a valid enum value for path `time_series.criteria`.');
				for (const criteria of TimeSeriesCriterias) {
					shouldBeValid(
						new FacilityNodeModel({
							id: 'node1',
							type: NodeType.centrifugal_compressor,
							params: {
								time_series: {
									criteria,
								},
							},
						})
					);
				}
			});
			it('fluid_model should be an ObjectId', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: '123',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "fluid_model"');

				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
			it('time_series.rows period, count and runtime are required', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `period` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `count` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `runtime` is required.');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('period must be a string', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: 1,
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "period"');
			});
			it('count must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: '0',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "0" (type string) at path "count"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0.5,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: -10,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('runtime must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: '8760',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "8760" (type string) at path "runtime"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.centrifugal_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: -8760,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Reciprocating Compressor', () => {
			it('time_series criteria required and in TimeSeriesCriterias', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.criteria` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: 'flat',
							},
						},
					}).validate()
				).rejects.toThrow('`flat` is not a valid enum value for path `time_series.criteria`.');
				for (const criteria of TimeSeriesCriterias) {
					shouldBeValid(
						new FacilityNodeModel({
							id: 'node1',
							type: NodeType.reciprocating_compressor,
							params: {
								time_series: {
									criteria,
								},
							},
						})
					);
				}
			});
			it('fluid_model should be an ObjectId', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: '123',
						},
					}).validate()
				).rejects.toThrow('Cast to ObjectId failed for value "123" (type string) at path "fluid_model"');

				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
							},
							fluid_model: new mongoose.Types.ObjectId(),
						},
					})
				);
			});
			it('time_series.rows period, count and runtime are required', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `period` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `count` is required.');
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `runtime` is required.');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('period must be a string', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: 1,
										count: 0,
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "period"');
			});
			it('count must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: '0',
										runtime: 8760,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "0" (type string) at path "count"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0.5,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: -10,
										runtime: 8760,
									},
								],
							},
						},
					})
				);
			});
			it('runtime must be a number, no min or max value', async () => {
				await expect(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: '8760',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "8760" (type string) at path "runtime"');
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: 8760.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new FacilityNodeModel({
						id: 'node1',
						type: NodeType.reciprocating_compressor,
						params: {
							time_series: {
								criteria: TimeSeriesCriterias[0],
								rows: [
									{
										period: '1',
										count: 0,
										runtime: -8760,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Drilling', () => {
			it('time_series fuel_type required and in FuelTypes', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.fuel_type` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: 'diesel',
							},
						},
					}).validate()
				).rejects.toThrow('`diesel` is not a valid enum value for path `time_series.fuel_type`.');
				for (const fuel_type of FuelTypes) {
					shouldBeValid(
						new NetworkNodeModel({
							id: 'node1',
							type: NodeType.drilling,
							params: {
								time_series: {
									fuel_type,
								},
							},
						})
					);
				}
			});
			it('time_series.rows start_date_window, consumption_rate, start_criteria, end_criteria required', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_date_window` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `consumption_rate` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_criteria` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `end_criteria` is required.');
			});
			it('time_series.rows start_date_window, start_criteria, start_criteria_option, end_criteria, end_criteria_option must be a string', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 1,
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "start_date_window"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: 'Start',
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`Start` is not a valid enum value for path `start_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria_option"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`End` is not a valid enum value for path `end_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria_option"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 'offset_to_drill_start_date',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_drill_end_date',
									},
								],
							},
						},
					})
				);
			});
			it('time_series.rows start_value, end_value must be a number, no min or max value', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 'Start',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_drill_end_date',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "Start" (type string) at path "start_value"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "End" (type string) at path "end_value"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0.5,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: -10,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.drilling,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: -1,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Completion', () => {
			it('time_series fuel_type required and in FuelTypes', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {},
						},
					}).validate()
				).rejects.toThrow('Path `time_series.fuel_type` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: 'diesel',
							},
						},
					}).validate()
				).rejects.toThrow('`diesel` is not a valid enum value for path `time_series.fuel_type`.');
				for (const fuel_type of FuelTypes) {
					shouldBeValid(
						new NetworkNodeModel({
							id: 'node1',
							type: NodeType.completion,
							params: {
								time_series: {
									fuel_type,
								},
							},
						})
					);
				}
			});
			it('time_series.rows start_date_window, consumption_rate, start_criteria, end_criteria required', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_date_window` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `consumption_rate` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_criteria` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `end_criteria` is required.');
			});
			it('time_series.rows start_date_window, start_criteria, start_criteria_option, end_criteria, end_criteria_option must be a string', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 1,
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "start_date_window"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: 'Start',
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`Start` is not a valid enum value for path `start_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria_option"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`End` is not a valid enum value for path `end_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria_option"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 'offset_to_completion_start_date',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_completion_end_date',
									},
								],
							},
						},
					})
				);
			});
			it('time_series.rows start_value, end_value must be a number, no min or max value', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 'Start',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_completion_end_date',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "Start" (type string) at path "start_value"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "End" (type string) at path "end_value"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0.5,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: -10,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.completion,
						params: {
							time_series: {
								fuel_type: FuelTypes[0],
								rows: [
									{
										start_date_window: 'Start',
										consumption_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: -1,
									},
								],
							},
						},
					})
				);
			});
		});

		describe('Flowback', () => {
			it('time_series.rows start_date_window, flowback_rate, start_criteria, end_criteria required', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_date_window` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `flowback_rate` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `start_criteria` is required.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Path `end_criteria` is required.');
			});
			it('time_series.rows start_date_window, start_criteria, start_criteria_option, end_criteria, end_criteria_option must be a string', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 1,
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "1" (type number) at path "start_date_window"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: 'Start',
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`Start` is not a valid enum value for path `start_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 5,
										end_criteria: END_CRITERIAS[0],
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "start_criteria_option"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('`End` is not a valid enum value for path `end_criteria`.');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 5,
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to string failed for value "5" (type number) at path "end_criteria_option"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_criteria_option: 'offset_to_completion_end_date',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_first_prod_date',
									},
								],
							},
						},
					})
				);
			});
			it('time_series.rows start_value, end_value must be a number, no min or max value', async () => {
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 'Start',
										end_criteria: END_CRITERIAS[0],
										end_criteria_option: 'offset_to_first_prod_date',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "Start" (type string) at path "start_value"');
				await expect(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 'End',
									},
								],
							},
						},
					}).validate()
				).rejects.toThrow('Cast to Number failed for value "End" (type string) at path "end_value"');
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0.5,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: -10,
										end_criteria: END_CRITERIAS[0],
										end_value: 1,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: 1.5,
									},
								],
							},
						},
					})
				);
				await shouldBeValid(
					new NetworkNodeModel({
						id: 'node1',
						type: NodeType.flowback,
						params: {
							time_series: {
								rows: [
									{
										start_date_window: 'Start',
										flowback_rate: 1,
										start_criteria: START_CRITERIAS[0],
										start_value: 0,
										end_criteria: END_CRITERIAS[0],
										end_value: -1,
									},
								],
							},
						},
					})
				);
			});
		});
	});

	describe('Save Network Doc', () => {
		it('should not save when some node is invalid', async () => {
			const network = new NetworkModel({
				name: 'network 1',
				nodes: [
					{
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: '12',
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					},
				],
			});

			await expect(network.save()).rejects.toThrow(
				'Cast to Number failed for value "12" (type string) at path "pct_flare_efficiency"'
			);
		});

		it('should not save when some edge is invalid', async () => {
			const network = new NetworkModel({
				name: 'network 1',
				edges: [
					{
						id: 'node1',
						by: 'random',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					},
				],
			});

			await expect(network.save()).rejects.toThrow('`random` is not a valid enum value for path `by`.');
		});

		it('should be able to save when some nodes and edges are all valid', async () => {
			const network = new NetworkModel({
				name: 'network 1',
				nodes: [
					{
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					},
				],
				edges: [
					{
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					},
				],
			});
			await expect(network.save()).resolves.toBe(network);
		});
	});

	describe('Save Facility Doc', () => {
		it('should not save when some node is invalid', async () => {
			const facility = new FacilityModel({
				name: 'facility 1',
				nodes: [
					{
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: '12',
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					},
				],
			});

			await expect(facility.save()).rejects.toThrow(
				'Cast to Number failed for value "12" (type string) at path "pct_flare_efficiency"'
			);
		});

		it('should not save when input edge is invalid', async () => {
			await expect(
				new FacilityModel({
					name: 'facility 1',
					inputs: [
						{
							id: 'node1',
							by: 'link',
							to: 'node3',
						},
					],
				}).save()
			).rejects.toThrow('`link` is not a valid enum value for path `by`.');

			await expect(
				new FacilityModel({
					name: 'facility 1',
					inputs: [
						{
							id: 'node1',
							by: 'oil',
						},
					],
				}).save()
			).rejects.toThrow('Path `to` is required.');
		});

		it('should not save when output edge is invalid', async () => {
			await expect(
				new FacilityModel({
					name: 'facility 1',
					outputs: [
						{
							id: 'node1',
							by: 'link',
							from: 'node3',
						},
					],
				}).save()
			).rejects.toThrow('`link` is not a valid enum value for path `by`.');

			await expect(
				new FacilityModel({
					name: 'facility 1',
					outputs: [
						{
							id: 'node1',
							by: 'oil',
						},
					],
				}).save()
			).rejects.toThrow('Path `from` is required.');
		});

		it('should not save when some edge is invalid', async () => {
			const facility = new FacilityModel({
				name: 'facility 1',
				edges: [
					{
						id: 'node1',
						by: 'link',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					},
				],
			});

			await expect(facility.save()).rejects.toThrow('`link` is not a valid enum value for path `by`.');
		});

		it('should be able to save when some nodes and edges are all valid', async () => {
			const facility = new FacilityModel({
				name: 'facility 1',
				inputs: [
					{
						id: 'node1',
						by: 'oil',
						to: 'node3',
					},
				],
				outputs: [
					{
						id: 'node1',
						by: 'oil',
						from: 'node3',
					},
				],
				nodes: [
					{
						id: 'node1',
						type: NodeType.flare,
						params: {
							pct_flare_efficiency: 12,
							pct_flare_unlit: 0,
							fuel_hhv: {
								value: 0.001235,
								unit: 'MMBtu/scf',
							},
						},
					},
				],
				edges: [
					{
						id: 'node1',
						by: 'oil',
						from: 'node2',
						to: 'node3',
						params: {
							time_series: { criteria: 'entire_well_life', rows: [{ period: 'Flat', allocation: 100 }] },
						},
					},
				],
			});
			await expect(facility.save()).resolves.toBe(facility);
		});
	});
});
