import * as joint from '@clientio/rappid';
import { v4 as uuidv4 } from 'uuid';

import { useAlfaStore } from '@/helpers/alfa';
import theme from '@/helpers/styled';
import { Theme } from '@/helpers/theme';
import { arrayToRecord, assert } from '@/helpers/utilities';

import { CM_IGNORE } from '../../../joint/services/helpers';
import { NODES_PRESETS, PortsGroup } from '../../shared';
import { STREAM_COLORS } from '../../styles';
import { Stream } from '../../types';

export const NODE_INPUT_PORTS = [PortsGroup.in, PortsGroup.linkIn, PortsGroup.developmentIn];
export const NODE_OUTPUT_PORTS = [PortsGroup.out, PortsGroup.linkOut, PortsGroup.developmentOut];

export enum PortDataAttrs {
	streamType = 'data-port-stream-type',
}

export function getNodeTypeImageUrl(nodeType: string, theme: Theme.dark | Theme.light) {
	return `/ghg_icons/${theme}/${nodeType}.svg`;
}

export enum JointPositions {
	top = 'top',
	bottom = 'bottom',
	left = 'left',
	right = 'right',
}
const DEFAULT_PORT_SIZE = 6;
const EXPANDED_PORT_SIZE = 10;
const DEFAULT_LABEL_OFFSET = 15;
const LABEL_OFFSET: Record<JointPositions, { x?: number; y?: number }> = {
	[JointPositions.top]: {
		y: -(DEFAULT_LABEL_OFFSET + 10),
	},
	[JointPositions.bottom]: {
		y: DEFAULT_LABEL_OFFSET + 10,
	},
	[JointPositions.left]: {
		x: -(DEFAULT_LABEL_OFFSET + 10),
	},
	[JointPositions.right]: {
		x: DEFAULT_LABEL_OFFSET,
	},
};
const LABEL_PADDING = {
	x: 8,
	y: 2,
};

const adjustLabelToJointPosition = (position: JointPositions) => {
	switch (position) {
		case JointPositions.left:
			return {
				x: `calc(x - calc(w + ${LABEL_PADDING.x / 2}))`,
				y: `calc(y - ${LABEL_PADDING.y / 2})`,
			};
		case JointPositions.bottom:
			return {
				x: `calc(-0.5 * w - ${LABEL_PADDING.x / 2})`,
				y: `calc(-0.5 * h - ${LABEL_PADDING.y / 2})`,
			};
		case JointPositions.top:
			return {
				x: `calc(-0.5 * w - ${LABEL_PADDING.x / 2})`,
				y: `calc(-0.5 * h - ${LABEL_PADDING.y / 2})`,
			};
		default:
			return {
				x: `calc(x - ${LABEL_PADDING.x / 2})`,
				y: `calc(y - ${LABEL_PADDING.y / 2})`,
			};
	}
};

interface CreatePortGroupOptions {
	groupPosition: JointPositions;
	labelPosition: JointPositions;
	streamType?: Stream;
	magnet?: 'active' | 'passive';
	show: boolean;
}
export const createPortGroup = ({
	groupPosition,
	labelPosition,
	streamType,
	magnet,
}: CreatePortGroupOptions): joint.dia.Element.PortGroup => {
	return {
		position: {
			name: groupPosition,
		},
		attrs: {
			portBody: {
				r: DEFAULT_PORT_SIZE,
				fill: STREAM_COLORS[streamType ?? 'default'],
				stroke: STREAM_COLORS[streamType ?? 'default'],
				magnet,
			},
			labelBackground: {
				ref: 'label',
				width: `calc(w + ${LABEL_PADDING.x})`,
				height: `calc(h + ${LABEL_PADDING.y})`,
				fill: 'white',
				display: 'inline',
				rx: 4,
				ry: 4,
				...adjustLabelToJointPosition(labelPosition),
			},
			label: {
				y: 5,
			},
		},
		markup: [
			{
				tagName: 'circle',
				selector: 'portBody',
			},
		],
		label: {
			position: {
				name: labelPosition,
				args: LABEL_OFFSET[labelPosition],
			},
			markup: [
				{
					tagName: 'g',
					selector: 'labelWrapper',
					className: 'label-wrapper',
					children: [
						{
							tagName: 'rect',
							selector: 'labelBackground',
							className: 'label-background',
						},
						{
							tagName: 'text',
							selector: 'label',
							className: 'label-text',
						},
					],
				},
			],
		},
	};
};

const portsIn = (show) =>
	createPortGroup({
		groupPosition: JointPositions.left,
		labelPosition: JointPositions.left,
		magnet: 'passive',
		show,
	});

const portsOut = (show) =>
	createPortGroup({
		groupPosition: JointPositions.right,
		labelPosition: JointPositions.right,
		magnet: 'active',
		show,
	});

function displayTextWidth(text, font) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	assert(context, 'canvas context is not defined');
	context.font = font;
	const metrics = context.measureText(text);
	return metrics.width;
}
export class BaseNode extends joint.dia.Element {
	static SIZE = 70;
	private static LABEL_FONT_SIZE = 14;
	private static LABEL_PADDING = 4;
	protected showPortLabels = false;

	protected static createId() {
		const id = uuidv4();
		return id;
	}

	constructor(attrs: joint.dia.Element.Attributes) {
		super({
			...attrs,
			id: attrs.id ?? BaseNode.createId(),
		});
	}

	private unsubThemeChange = useAlfaStore.subscribe((state, prevState) => {
		if (state.theme !== prevState.theme) {
			this.updateImage();
			// Hack to force update of port labels, positioning fails otherwise
			const ports = this.getPorts();
			this.removePorts();
			this.addPorts(ports);
		}
	});

	defaults() {
		return {
			...super.defaults,
			type: 'nodes.Base',
			z: 2,
			size: { width: BaseNode.SIZE, height: BaseNode.SIZE },
			attrs: {
				body: {
					width: 70,
					height: 70,
					filter: 'drop-shadow(0 0 1px currentcolor)', // https://css-tricks.com/adding-shadows-to-svg-icons-with-css-and-svg-filters/
					fill: `${theme.backgroundOpaque}`,
				},
				labelWrapper: {
					transform: 'translate(0, 86)',
					opacity: 0.5,
				},
				labelBackground: {
					width: 'calc(w)',
					height: '25',
					x: '0',
					fill: `${theme.backgroundOpaque}`,
					rx: '8px',
					ry: '8px',
				},
				label: {
					textVerticalAnchor: 'middle',
					textAnchor: 'middle',
					x: 'calc(0.5*w)',
					y: '12.5',
					fontSize: BaseNode.LABEL_FONT_SIZE,
					fill: theme.textColorOpaque,
				},
				icon: {
					width: BaseNode.SIZE / 2,
					height: BaseNode.SIZE / 2,
					x: 'calc(0.25*w)',
					y: 'calc(0.25*h)',
					href: '',
				},
			},
			ports: {
				groups: {
					[PortsGroup.in]: portsIn(this.showPortLabels),
					[PortsGroup.out]: portsOut(this.showPortLabels),
				},
			},
		};
	}

	markup = [
		{
			tagName: 'rect',
			selector: 'body',
		},
		{
			tagName: 'g',
			selector: 'labelWrapper',
			children: [
				{
					tagName: 'rect',
					selector: 'labelBackground',
				},
				{
					tagName: 'text',
					selector: 'label',
				},
			],
		},
		{
			tagName: 'image',
			selector: 'icon',
		},
	];

	setName(val: string | undefined, updateProp = true) {
		const newName = val || NODES_PRESETS[this.attributes.nodeType]?.name;
		const fontWidth = displayTextWidth(newName, `${BaseNode.LABEL_FONT_SIZE}px "Roboto", sans-serif`);
		const fontWidthPlusHack = fontWidth + fontWidth * 0.01645;
		if (updateProp) {
			this.prop({ name: newName });
		}
		this.attr('label/text', newName);
		this.attr(
			'labelBackground/x',
			(fontWidthPlusHack <= BaseNode.SIZE ? 0 : BaseNode.SIZE / 2 - fontWidthPlusHack / 2) -
				BaseNode.LABEL_PADDING
		);
		return this.attr(
			'labelBackground/width',
			(fontWidthPlusHack <= BaseNode.SIZE ? BaseNode.SIZE : fontWidthPlusHack) + BaseNode.LABEL_PADDING * 2
		);
	}

	setNodeType(val: string) {
		return this.prop({ nodeType: val }).updateImage();
	}

	/** Updates the icon image using the current application theme */
	private updateImage() {
		return this.attr('icon/href', getNodeTypeImageUrl(this.prop('nodeType'), useAlfaStore.getState().theme));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setPorts(ports: any[]) {
		ports.forEach((port) => this.addPort(port, CM_IGNORE));
		this.prop({ portsInfo: arrayToRecord(ports, 'id') }, CM_IGNORE);
		return this;
	}

	movePortsOnSelection() {
		const inPorts = this.getGroupPorts(PortsGroup.in);
		const outPorts = this.getGroupPorts(PortsGroup.out);

		inPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: -10,
			});
		});
		outPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 10,
			});
		});
	}

	movePortsOnDeselection() {
		const inPorts = this.getGroupPorts(PortsGroup.in);
		const outPorts = this.getGroupPorts(PortsGroup.out);

		inPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 0,
			});
		});
		outPorts.forEach((port) => {
			assert(port.id, 'Port id is undefined');
			this.portProp(port.id, 'attrs/portBody', {
				cx: 0,
			});
		});
	}

	expandPort(portId: string) {
		this.portProp(portId, 'attrs/portBody', {
			r: EXPANDED_PORT_SIZE,
		});
	}

	shrinkPort(portId: string) {
		this.portProp(portId, 'attrs/portBody', {
			r: DEFAULT_PORT_SIZE,
		});
	}

	destroy(...params) {
		this.unsubThemeChange();
		return super.destroy(...params);
	}
}
