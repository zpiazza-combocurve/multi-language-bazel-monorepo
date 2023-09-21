import * as joint from '@clientio/rappid';
import _ from 'lodash';

// eslint-disable-next-line jest/no-mocks-import
import { companyPusherChannel, pusherChannel } from '@/helpers/__mocks__/pusher';
import { useAlfaStore } from '@/helpers/alfa';
import { mockCanvas } from '@/helpers/testing';
import { assert } from '@/helpers/utilities';

import { NetworkModel, NetworkModelFacility } from '../types';
import { InputEdge, OutputEdge } from './edges';
import { BaseEdgeAttributes } from './edges/BaseEdge';
import { AllocationEdgeAttributes } from './edges/StandardEdge';
import {
	graphToNetworkModelData,
	graphToNetworkModelFacilityDataWithError,
	networkModelDataToGraph,
	networkModelFacilityDataToGraph,
	updatedJointShapes,
} from './helpers';
import { TESTS } from './helpers.fixtures.test';

mockCanvas();

vi.spyOn(useAlfaStore, 'getState').mockReturnValue({
	// @ts-expect-error Required for mocking
	project: false,
	// @ts-expect-error Required for mocking
	theme: 'dark',
	projects: false,
	scenario: false,
	scenarios: false,
	themeMode: 'classic',
	Pusher: pusherChannel,
	CompanyPusher: companyPusherChannel,
});

describe('Data conversion: DB <-> Frontend', () => {
	test.each(TESTS.networkData.correctOutput)(
		'networkModelDataToGraph (Load from DB): "$input.name"',
		({ input, facilitiesRecord }) => {
			const graphCells = networkModelDataToGraph(
				input as NetworkModel,
				facilitiesRecord as Record<string, NetworkModelFacility>
			);
			// Group by nodes and edges
			const groupedCells = _.groupBy(graphCells, (cell) => cell.attributes.type.startsWith('nodes.'));
			const graphElements = groupedCells['true'];
			const graphLinks = groupedCells['false'];
			// Check nodes
			expect(graphElements).toHaveLength(input.nodes.length);
			graphElements.forEach((element) => {
				const foundNode = (input as NetworkModel).nodes.find((n) => n.id === element.attributes.id);
				expect(foundNode).toBeDefined();
				const nodeAttributes = element.attributes;
				const mappedNodeData = {
					id: nodeAttributes.id,
					shape: {
						position: {
							x: nodeAttributes.position.x,
							y: nodeAttributes.position.y,
						},
					},
					type: nodeAttributes.nodeType,
					params: nodeAttributes.params,
					// Facility nodes don't have description
					...(nodeAttributes.nodeType !== 'facility' && {
						description: nodeAttributes.description,
					}),
				};
				expect(foundNode).toMatchObject(mappedNodeData);
			});
			// Check edges
			expect(graphLinks).toHaveLength(input.edges.length);
			graphLinks.forEach((link) => {
				const foundEdge = input.edges.find((e) => e.id === link.attributes.id);
				expect(foundEdge).toBeDefined();
				assert(foundEdge);
				const linkAttributes = link.attributes;
				const mappedEdgeData: BaseEdgeAttributes | AllocationEdgeAttributes = {
					id: linkAttributes.id,
					name: linkAttributes.name,
					by: linkAttributes.stream_type,
					from: linkAttributes.source.id,
					to: linkAttributes.target.id,
					shape: {
						vertices: linkAttributes.vertices,
					},
				};
				if (foundEdge.fromHandle) {
					mappedEdgeData.fromHandle = linkAttributes.source.port.split('_')[1];
				}
				if (foundEdge.toHandle) {
					mappedEdgeData.toHandle = linkAttributes.target.port.split('_')[1];
				}
				if (linkAttributes.params) {
					mappedEdgeData.params = linkAttributes.params;
				}
				expect(foundEdge).toMatchObject(mappedEdgeData);
			});
		}
	);

	test.each(TESTS.networkData.correctOutput)(
		'graphToNetworkModelData (Save to DB): "$input.name"',
		({ input, facilitiesRecord }) => {
			const { nodes, edges } = input;
			const graphCells = networkModelDataToGraph(
				input as NetworkModel,
				facilitiesRecord as Record<string, NetworkModelFacility>
			);
			const graph = new joint.dia.Graph({}, { cellNamespace: updatedJointShapes });
			graph.resetCells(graphCells);
			const convertedData = graphToNetworkModelData(graph);
			expect(convertedData).toEqual({ nodes, edges });
		}
	);

	test.each(TESTS.facilityData.correctOutput)(
		'networkModelFacilityDataToGraph (Load from DB): "$input.name"',
		({ input }) => {
			const graphCells = networkModelFacilityDataToGraph(input as NetworkModelFacility);
			// Group by nodes and edges
			const groupedCells = _.groupBy(graphCells, (cell) => cell.attributes.type.startsWith('nodes.'));
			const graphElements = groupedCells['true'];
			const graphLinks = groupedCells['false'];

			// Check nodes
			expect(graphElements).toHaveLength(input.nodes.length);
			graphElements.forEach((element) => {
				const foundNode = (input as NetworkModelFacility).nodes.find((n) => n.id === element.attributes.id);
				expect(foundNode).toBeDefined();
				const nodeAttributes = element.attributes;
				const mappedNodeData = {
					id: nodeAttributes.id,
					shape: {
						position: {
							x: nodeAttributes.position.x,
							y: nodeAttributes.position.y,
						},
					},
					type: nodeAttributes.nodeType,
					params: nodeAttributes.params,
					description: nodeAttributes.description,
				};
				expect(foundNode).toMatchObject(mappedNodeData);
			});

			// Check edges
			const allEdges = [...input.edges, ...input.inputs, ...input.outputs];
			expect(graphLinks).toHaveLength(allEdges.length);
			graphLinks.forEach((link) => {
				const foundEdge = allEdges.find((e) => e.id === link.attributes.id);
				expect(foundEdge).toBeDefined();
				assert(foundEdge);
				const linkAttributes = link.attributes;
				const mappedEdgeData: AllocationEdgeAttributes = {
					id: linkAttributes.id,
					name: linkAttributes.name,
					by: linkAttributes.stream_type,
					...(linkAttributes.source?.id && {
						from: linkAttributes.source.id,
					}),
					...(linkAttributes.target?.id && {
						to: linkAttributes.target.id,
					}),
				};
				if (link instanceof InputEdge) {
					mappedEdgeData.toHandle = linkAttributes.target.port.split('_')[1];
					mappedEdgeData.shape = {
						vertices: [link.getSourcePoint(), ...(link.attributes.vertices || [])],
					};
				}
				if (link instanceof OutputEdge) {
					mappedEdgeData.fromHandle = linkAttributes.source.port.split('_')[1];
					mappedEdgeData.shape = {
						vertices: [link.getTargetPoint(), ...(link.attributes.vertices || [])],
					};
				}
				if (linkAttributes.params) {
					mappedEdgeData.params = linkAttributes.params;
				}
				expect(foundEdge).toMatchObject(mappedEdgeData);
			});
		}
	);

	test.each(TESTS.facilityData.correctOutput)(
		'graphToNetworkModelFacilityData (Save to DB): "$input.name"',
		({ input }) => {
			const { nodes, edges, inputs, outputs } = input;
			const graphCells = networkModelFacilityDataToGraph(input as NetworkModelFacility);
			const graph = new joint.dia.Graph({}, { cellNamespace: updatedJointShapes });
			graph.resetCells(graphCells);
			const [convertedData] = graphToNetworkModelFacilityDataWithError(graph);
			expect(convertedData).toEqual({ nodes, edges, inputs, outputs });
		}
	);
});
