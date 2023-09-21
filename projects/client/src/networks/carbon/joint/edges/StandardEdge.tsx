import * as joint from '@clientio/rappid';
import _ from 'lodash';

import { assert } from '@/helpers/utilities';
import { TimeSeriesInputCommonCriteriaOptions } from '@/networks/carbon/Diagram/types';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { EdgeType, StandardEdge as StandardEdgeType } from '@/networks/carbon/types';

import { BaseEdge, BaseEdgeAttributes } from './BaseEdge';

export interface AllocationEdgeAttributes extends BaseEdgeAttributes {
	fromFacilityObjectId?: string;
	toFacilityObjectId?: string;
	params?: StandardEdgeType['params'];
}

export class StandardEdge extends BaseEdge {
	static DEFAULT_ALLOCATION_RATIO = 100;

	constructor(attrs?: AllocationEdgeAttributes) {
		const { params, fromFacilityObjectId, toFacilityObjectId, ...rest } = attrs ?? {};
		super(rest);
		this.setFromFacilityObjectId(fromFacilityObjectId);
		this.setToFacilityObjectId(toFacilityObjectId);
		this.prop({ ...DEFAULT_EDGE_DATA[EdgeType.standard], edgeType: EdgeType.standard });
		this.prop({
			params: {
				...this.attributes.params,
				...params,
			},
		});
		this.updateLabel();
	}

	defaults(): Partial<joint.dia.Link.Attributes> {
		return _.merge({}, super.defaults(), {
			type: 'edges.Allocation',
		});
	}

	/** Sets the allocation_ratio value and updates the label */
	allocationRatio(val: number): this {
		return this.initBatch().labelText(`${val.toString()}%`).prop({ allocation_ratio: val }).storeBatch();
	}

	setFromFacilityObjectId(id: string | undefined) {
		return this.prop({ fromFacilityObjectId: id ?? null });
	}

	setToFacilityObjectId(id: string | undefined) {
		return this.prop({ toFacilityObjectId: id ?? null });
	}
	updateLabel() {
		const { time_series } = this.attributes.params;
		assert(time_series);
		const { criteria, rows } = time_series;
		assert(criteria && rows?.length > 0);
		if (criteria === TimeSeriesInputCommonCriteriaOptions.Flat) {
			const { allocation } = rows[0];
			this.labelText(`${allocation.toString()}%`);
		}
		if (criteria === TimeSeriesInputCommonCriteriaOptions.Dates) {
			this.labelText(`Dates*%`);
		}
	}

	static fromEdge(edge: StandardEdgeType) {
		const newEdge = new StandardEdge({
			id: edge.id,
			source: {
				id: edge.from,
				port: StandardEdge.handleIdToPortId(edge.fromHandle, PortsGroup.out),
			},
			target: {
				id: edge.to,
				port: StandardEdge.handleIdToPortId(edge.toHandle, PortsGroup.in),
			},
			description: edge.description,
			params: edge.params,
		});

		// newEdge.allocationRatio(edge.allocation_ratio);
		newEdge.streamType(edge.by);
		newEdge.layer(edge.by);
		newEdge.vertices(edge.shape?.vertices || []);
		// newEdge.prop({
		// 	allocation_ratio: edge.allocation_ratio,
		// 	fromFacilityObjectId: edge.fromFacilityObjectId,
		// 	toFacilityObjectId: edge.toFacilityObjectId,
		// });

		return newEdge;
	}

	toEdge(): StandardEdgeType {
		assert(
			this.attributes.params.time_series.criteria &&
				this.attributes.params.time_series.rows.length > 0 &&
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
			fromHandle: StandardEdge.portIdToHandleId(this.attributes.source.port.toString(), PortsGroup.out),
			to: this.attributes.target.id.toString(),
			toHandle: StandardEdge.portIdToHandleId(this.attributes.target.port.toString(), PortsGroup.in),
			shape: { vertices: this.attributes.vertices },
			name: this.attributes.name,
			description: this.attributes.description,
			params: this.attributes.params,
		};
	}
}
