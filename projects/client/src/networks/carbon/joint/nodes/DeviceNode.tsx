import * as joint from '@clientio/rappid';

import { assert } from '@/helpers/utilities';
import { DEFAULT_PORT_NAMES, NODES_PRESETS, NodePresetData, PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import { AnyNode, PartialBy, Stream } from '@/networks/carbon/types';

import { BaseNode, JointPositions, PortDataAttrs, createPortGroup } from './BaseNode';

const linksOutPortsGroup = (show) =>
	createPortGroup({
		groupPosition: JointPositions.bottom,
		labelPosition: JointPositions.bottom,
		magnet: 'active',
		streamType: Stream.link,
		show,
	});
const developmentInPortsGroup = (show) =>
	createPortGroup({
		groupPosition: JointPositions.left,
		labelPosition: JointPositions.left,
		magnet: 'passive',
		streamType: Stream.development,
		show,
	});
const developmentOutPortsGroup = (show) =>
	createPortGroup({
		groupPosition: JointPositions.right,
		labelPosition: JointPositions.right,
		magnet: 'active',
		streamType: Stream.development,
		show,
	});
export class DeviceNode extends BaseNode {
	defaults() {
		return {
			...super.defaults(),
			type: 'nodes.Device',
			ports: {
				...super.defaults().ports,
				groups: {
					...super.defaults().ports.groups,
					[PortsGroup.linkOut]: linksOutPortsGroup(this.showPortLabels),
					[PortsGroup.developmentIn]: developmentInPortsGroup(this.showPortLabels),
					[PortsGroup.developmentOut]: developmentOutPortsGroup(this.showPortLabels),
				},
			},
		};
	}

	movePortsOnSelection() {
		super.movePortsOnSelection();
		const linkOutPorts = this.getGroupPorts(PortsGroup.linkOut);
		const devInPorts = this.getGroupPorts(PortsGroup.developmentIn);
		const devOutPorts = this.getGroupPorts(PortsGroup.developmentOut);

		linkOutPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cy: 10,
			});
		});
		devInPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: -10,
			});
		});
		devOutPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 10,
			});
		});
	}

	movePortsOnDeselection() {
		super.movePortsOnDeselection();
		const linkOutPorts = this.getGroupPorts(PortsGroup.linkOut);
		const devInPorts = this.getGroupPorts(PortsGroup.developmentIn);
		const devOutPorts = this.getGroupPorts(PortsGroup.developmentOut);

		linkOutPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cy: 0,
			});
		});
		devInPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 0,
			});
		});
		devOutPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 0,
			});
		});
	}

	protected static getPortId(group: PortsGroup, id: string) {
		return `${group}_${id}`;
	}

	protected static getPortsByNodeType(nodeType: AnyNode['type']): joint.dia.Element.Port[] {
		const presetData: NodePresetData = NODES_PRESETS[nodeType];

		const mappedPorts = presetData.ports.map((port) => ({
			id: this.getPortId(port.portsGroup, port.stream),
			args: {
				layer: port.stream,
				name: DEFAULT_PORT_NAMES[port.stream],
			},
			group: port.portsGroup,
			attrs: {
				portBody: {
					[PortDataAttrs.streamType]: port.stream,
					fill: STREAM_COLORS[port.stream],
					stroke: STREAM_COLORS[port.stream],
				},
				label: {
					text: DEFAULT_PORT_NAMES[port.stream],
				},
			},
		}));

		return mappedPorts;
	}

	static fromNode(node: PartialBy<AnyNode, 'id'>) {
		const { id, name, shape, params, type, description, nodeModel } = node;

		// Creating new node
		const newNode = new this({ id, position: shape.position })
			// Setting Label
			.setName(name ?? NODES_PRESETS[type].name)
			// Setting icon
			.setNodeType(type)
			// Adding parameters
			.prop({ params, description, nodeModel })
			// Adding ports
			.setPorts(this.getPortsByNodeType(type));

		if (type === 'well_group') {
			newNode.attr('labelWrapper', {
				// Put label on top of the well group node
				// Calculation: 41 is the height of the labelWrapper + 16px padding
				transform: `translate(0, -41)`,
			});
		}
		return newNode;
	}

	toNode(): AnyNode {
		const { id, nodeType, name, position, params, description, nodeModel } = this.attributes;
		return {
			id,
			type: nodeType,
			name,
			shape: {
				position,
			},
			params: params ?? {},
			description: description ?? '',
			nodeModel: nodeModel ?? null,
		} as AnyNode;
	}
}
