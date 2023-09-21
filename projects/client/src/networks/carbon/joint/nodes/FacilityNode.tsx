import * as joint from '@clientio/rappid';

import { assert } from '@/helpers/utilities';
import { PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import {
	FacilityNode as FacilityNodeInterface,
	NetworkModelFacility,
	PartialBy,
	Stream,
} from '@/networks/carbon/types';

import { BaseNode, JointPositions, PortDataAttrs, createPortGroup } from './BaseNode';

export const portsLinkIn = (show) =>
	createPortGroup({
		groupPosition: JointPositions.top,
		labelPosition: JointPositions.top,
		streamType: Stream.link,
		show,
	});

export class FacilityNode extends BaseNode {
	protected static DEFAULT_LINK_PORT_NAME = 'Link Wells';
	defaults() {
		return {
			...super.defaults(),
			type: 'nodes.Facility',
			ports: {
				...super.defaults().ports,
				groups: {
					...super.defaults().ports.groups,
					[PortsGroup.linkIn]: portsLinkIn(this.showPortLabels),
				},
			},
		};
	}

	movePortsOnSelection() {
		super.movePortsOnSelection();
		const linkInPorts = this.getGroupPorts(PortsGroup.linkIn);
		linkInPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cy: -10,
			});
		});
	}

	movePortsOnDeselection() {
		super.movePortsOnDeselection();
		const linkInPorts = this.getGroupPorts(PortsGroup.linkIn);
		linkInPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cy: 0,
			});
		});
	}

	protected static getPortId(group: PortsGroup, id: string) {
		return `${group}_${id}`;
	}

	protected static getPortsFromFacility(facility: NetworkModelFacility): joint.dia.Element.Port[] {
		const ports = [
			...facility.inputs.map((edge) => ({
				id: this.getPortId(PortsGroup.in, edge.id),
				args: {
					name: edge.name || edge.id,
					layer: edge.by,
				},
				group: PortsGroup.in,
				attrs: {
					portBody: {
						[PortDataAttrs.streamType]: edge.by,
						magnet: 'passive',
						fill: STREAM_COLORS[edge.by],
						stroke: STREAM_COLORS[edge.by],
					},
					label: {
						text: edge.name || edge.id,
					},
				},
			})),
			...facility.outputs.map((edge) => ({
				id: this.getPortId(PortsGroup.out, edge.id),
				args: {
					name: edge.name || edge.id,
					layer: edge.by,
				},
				group: PortsGroup.out,
				attrs: {
					portBody: {
						[PortDataAttrs.streamType]: edge.by,
						magnet: 'active',
						fill: STREAM_COLORS[edge.by],
						stroke: STREAM_COLORS[edge.by],
					},
					label: {
						text: edge.name || edge.id,
					},
				},
			})),
		];
		if (!facility.inputs.length) {
			ports.push({
				id: this.getPortId(PortsGroup.linkIn, Stream.link),
				args: {
					name: this.DEFAULT_LINK_PORT_NAME,
					layer: Stream.link,
				},
				group: PortsGroup.linkIn,
				attrs: {
					portBody: {
						[PortDataAttrs.streamType]: Stream.link,
						magnet: 'passive',
						fill: STREAM_COLORS.link,
						stroke: STREAM_COLORS.link,
					},
					label: {
						text: this.DEFAULT_LINK_PORT_NAME,
					},
				},
			});
		}
		return ports;
	}

	setName(name: string | undefined, updateProp = true) {
		super.setName(name, updateProp);
		if (!name) this.removeProp('name');
		return this.attr('label/text', name ?? this.attributes.temp.facilityName);
	}

	static fromNode(
		node: PartialBy<FacilityNodeInterface, 'id' | 'name'>,
		facility: NetworkModelFacility
	): FacilityNode {
		const { id, name, shape, params, type, nodeModel } = node;
		// Creating new node
		const newNode = new this({ id: id ?? this.createId(), position: shape.position })
			// Setting Label
			.setName(name ?? facility.name, !!name)
			// Setting icon
			.setNodeType(type)
			// Adding parameters
			.prop({
				params,
				nodeModel,
				temp: {
					facilityName: facility.name,
				},
			})
			// Adding ports
			.setPorts(this.getPortsFromFacility(facility));
		return newNode;
	}

	toNode(): FacilityNodeInterface {
		this.removeProp('temp');
		const { id, nodeType, name, position, params, nodeModel } = this.attributes;
		return {
			id,
			type: nodeType,
			name,
			shape: {
				position,
			},
			params,
			nodeModel: nodeModel ?? null,
		} as FacilityNodeInterface;
	}
}
