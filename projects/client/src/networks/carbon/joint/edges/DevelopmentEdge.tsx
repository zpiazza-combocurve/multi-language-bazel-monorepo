import _ from 'lodash';

import { assert } from '@/helpers/utilities';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import { DevelopmentEdge as DevelopmentEdgeType, EdgeType, Stream } from '@/networks/carbon/types';

import { BaseEdge, BaseEdgeAttributes } from './BaseEdge';

export class DevelopmentEdge extends BaseEdge {
	constructor(attributes: BaseEdgeAttributes = {}) {
		super({ ...attributes, stream_type: Stream.development });
		this.prop({ ...DEFAULT_EDGE_DATA[EdgeType.development], edgeType: EdgeType.development });
	}

	defaults(): Partial<joint.shapes.standard.LinkAttributes> {
		return _.merge({}, super.defaults(), {
			type: 'edges.Development',
			router: {
				args: {
					startDirections: ['right'],
					endDirections: ['left'],
				},
			},
			attrs: {
				line: {
					stroke: STREAM_COLORS.development,
				},
			},
		});
	}

	static fromEdge(edge: DevelopmentEdgeType) {
		const newEdge = new DevelopmentEdge({
			id: edge.id,
			source: {
				id: edge.from,
				port: DevelopmentEdge.handleIdToPortId(Stream.development, PortsGroup.developmentOut),
			},
			target: {
				id: edge.to,
				port: DevelopmentEdge.handleIdToPortId(Stream.development, PortsGroup.developmentIn),
			},
		});
		newEdge.layer(edge.by);
		newEdge.vertices(edge.shape?.vertices || []);

		return newEdge;
	}

	toEdge(): DevelopmentEdgeType {
		assert(
			this.attributes.stream_type &&
				this.attributes.source &&
				this.attributes.source.id &&
				this.attributes.source.port &&
				this.attributes.target &&
				this.attributes.target.id &&
				this.attributes.target.port
		);
		return {
			id: this.id.toString(),
			by: this.attributes.stream_type,
			from: this.attributes.source.id.toString(),
			to: this.attributes.target.id.toString(),
			shape: { vertices: this.attributes.vertices },
			name: this.attributes.name, // TODO we need to add name
		};
	}
}
