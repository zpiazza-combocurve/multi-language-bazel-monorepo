import { assert } from '@/helpers/utilities';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { EdgeType, OutputEdge as OutputEdgeType } from '@/networks/carbon/types';

import { BaseEdge, BaseEdgeAttributes } from './BaseEdge';

export class OutputEdge extends BaseEdge {
	static DEFAULT_NAME = 'Output Edge';
	constructor(attrs: BaseEdgeAttributes) {
		super(attrs);
		this.setName(attrs?.name ?? OutputEdge.DEFAULT_NAME).prop({
			...DEFAULT_EDGE_DATA[EdgeType.output],
			edgeType: EdgeType.output,
		});
	}

	defaults() {
		return {
			...super.defaults(),
			type: 'edges.Output',
		};
	}

	isValid() {
		const { stream_type, source, target } = this.attributes;
		return stream_type && source && source.id && source.port && target && target.x && target.y;
	}

	static fromEdge(edge: OutputEdgeType) {
		return new OutputEdge({
			id: edge.id,
			source: {
				id: edge.from,
				port: OutputEdge.handleIdToPortId(edge.fromHandle, PortsGroup.out),
			},
			target: edge.shape.vertices.at(-1),
		})
			.setName(edge.name ?? OutputEdge.DEFAULT_NAME)
			.streamType(edge.by)
			.layer(edge.by)
			.vertices(edge.shape?.vertices?.slice(0, -1) ?? []);
	}

	toEdge(): OutputEdgeType {
		const { stream_type, source, target, vertices } = this.attributes;
		assert(stream_type && source && source.id && source.port && target && target.x && target.y);
		return {
			id: this.id.toString(),
			by: stream_type,
			from: source.id.toString(),
			fromHandle: BaseEdge.portIdToHandleId(source.port, PortsGroup.out),
			shape: { vertices: [...(vertices ?? []), target] },
			name: this.attributes.name,
		};
	}
}
