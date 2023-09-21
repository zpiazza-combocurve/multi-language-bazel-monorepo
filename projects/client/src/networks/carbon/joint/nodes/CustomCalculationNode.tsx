import * as joint from '@clientio/rappid';

import { assert } from '@/helpers/utilities';
import { NODES_PRESETS, PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import { CustomCalculationNode as CustomCalculationNodeType, PartialBy, Stream } from '@/networks/carbon/types';

import { PortDataAttrs } from './BaseNode';
import { DeviceNode } from './DeviceNode';
import { portsLinkIn } from './FacilityNode';

class CustomCalculationNode extends DeviceNode {
	protected static DEFAULT_LINK_PORT_NAME = 'Link Wells';

	defaults() {
		return {
			...super.defaults(),
			type: 'nodes.CustomCalculation',
			ports: {
				...super.defaults().ports,
				groups: {
					...super.defaults().ports.groups,
					[PortsGroup.linkIn]: portsLinkIn(this.showPortLabels),
				},
			},
		};
	}

	static getPorts(node: PartialBy<CustomCalculationNodeType, 'id'>, skipPorts?: string[]): joint.dia.Element.Port[] {
		assert(node.params, 'Node params are undefined');
		const ports: joint.dia.Element.Port[] = [
			...node.params.inputs
				.filter((input) => input.assign)
				.map((input) => ({
					id: this.getPortId(PortsGroup.in, input.name),
					args: {
						layer: input.by,
						name: input.name,
					},
					group: PortsGroup.in,
					attrs: {
						portBody: {
							[PortDataAttrs.streamType]: input.by,
							fill: STREAM_COLORS[input.by],
							stroke: STREAM_COLORS[input.by],
						},
						label: {
							text: input.name,
						},
					},
				})),
			...node.params.outputs
				.filter((output) => !!output.assign && Object.keys(Stream).includes(output.by))
				.map((output) => ({
					id: this.getPortId(PortsGroup.out, output.name),
					args: {
						layer: output.by,
						name: output.name,
					},
					group: PortsGroup.out,
					attrs: {
						portBody: {
							[PortDataAttrs.streamType]: output.by,
							fill: STREAM_COLORS[output.by],
							stroke: STREAM_COLORS[output.by],
						},
						label: {
							text: output.name,
						},
					},
				})),
		];

		if (!node.params.inputs.filter((input) => input.assign).length && !skipPorts?.includes(Stream.link)) {
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

	static fromNode(
		node: PartialBy<CustomCalculationNodeType, 'id'>,
		opts?: {
			skipPorts?: Stream[];
		}
	) {
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
			.setPorts(this.getPorts(node, opts?.skipPorts));
		return newNode;
	}
}

export default CustomCalculationNode;
