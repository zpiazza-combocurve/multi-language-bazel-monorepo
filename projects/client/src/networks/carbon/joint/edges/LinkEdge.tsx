import _ from 'lodash';

import { assert } from '@/helpers/utilities';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import { EdgeType, LinkEdge as LinkEdgeType, Stream } from '@/networks/carbon/types';

import { BaseEdge, BaseEdgeAttributes } from './BaseEdge';

export class LinkEdge extends BaseEdge {
	constructor(attributes: BaseEdgeAttributes = {}) {
		super({ ...attributes, stream_type: Stream.link });
		this.prop({ ...DEFAULT_EDGE_DATA[EdgeType.link], edgeType: EdgeType.link });
	}
	defaults(): Partial<joint.shapes.standard.LinkAttributes> {
		return _.merge({}, super.defaults(), {
			type: 'edges.Link',
			router: {
				args: {
					startDirections: ['bottom'],
					endDirections: ['top'],
				},
			},
			attrs: {
				line: {
					stroke: STREAM_COLORS.link,
					strokeWidth: 4,
					strokeDasharray: '5 5',
				},
			},
		});
	}

	setToFacilityObjectId(id: string | undefined) {
		return this.prop({ toFacilityObjectId: id ?? null });
	}

	static fromEdge(edge: LinkEdgeType) {
		const newEdge = new LinkEdge({
			id: edge.id,
			source: {
				id: edge.from,
				port: LinkEdge.handleIdToPortId(edge.fromHandle, PortsGroup.linkOut),
			},
			target: {
				id: edge.to,
				port: LinkEdge.handleIdToPortId(edge.toHandle, PortsGroup.linkIn),
			},
		});
		newEdge.layer(edge.by);
		newEdge.vertices(edge.shape?.vertices || []);
		newEdge.prop({
			toFacilityObjectId: edge.toFacilityObjectId,
		});

		return newEdge;
	}

	toEdge(): LinkEdgeType {
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
			toFacilityObjectId: this.attributes.toFacilityObjectId ?? undefined,
			fromHandle: LinkEdge.portIdToHandleId(this.attributes.source.port.toString(), PortsGroup.linkOut),
			to: this.attributes.target.id.toString(),
			toHandle: LinkEdge.portIdToHandleId(this.attributes.target.port.toString(), PortsGroup.linkIn),
			shape: { vertices: this.attributes.vertices },
			name: this.attributes.name, // TODO we need to add name
		};
	}
}
