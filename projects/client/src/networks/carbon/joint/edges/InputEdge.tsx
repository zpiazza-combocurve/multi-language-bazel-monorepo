import { assert } from '@/helpers/utilities';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { EdgeType, InputEdge as InputEdgeType } from '@/networks/carbon/types';

import { BaseEdge, BaseEdgeAttributes } from './BaseEdge';

export class InputEdge extends BaseEdge {
	static DEFAULT_NAME = 'Input Edge';
	constructor(attrs: BaseEdgeAttributes) {
		super(attrs);
		this.setName(attrs?.name ?? InputEdge.DEFAULT_NAME).prop({
			...DEFAULT_EDGE_DATA[EdgeType.input],
			edgeType: EdgeType.input,
		});
	}

	defaults() {
		return {
			...super.defaults(),
			type: 'edges.Input',
		};
	}

	isValid() {
		const { stream_type, source, target } = this.attributes;
		return stream_type && target && target.id && target.port && source && source.x && source.y;
	}

	setToFacilityObjectId(id: string) {
		return this.prop({ toFacilityObjectId: id });
	}

	static fromEdge(edge: InputEdgeType) {
		return new InputEdge({
			id: edge.id,
			source: edge.shape.vertices[0],
			target: {
				id: edge.to,
				port: InputEdge.handleIdToPortId(edge.toHandle, PortsGroup.in),
			},
		})
			.streamType(edge.by)
			.layer(edge.by)
			.setName(edge?.name ?? InputEdge.DEFAULT_NAME)
			.vertices(edge.shape?.vertices?.slice(1) ?? []);
	}

	toEdge(): InputEdgeType {
		const { stream_type, source, target, vertices, name } = this.attributes;
		assert(stream_type && target && target.id && target.port && source && source.x && source.y);
		return {
			id: this.id.toString(),
			by: stream_type,
			to: target.id.toString(),
			toHandle: InputEdge.portIdToHandleId(target.port, PortsGroup.in),
			shape: { vertices: [source, ...(vertices ?? [])] },
			name,
		};
	}
}
