import * as joint from '@clientio/rappid';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { useAlfaStore } from '@/helpers/alfa';
import { Theme } from '@/helpers/theme';
import { assert } from '@/helpers/utilities';
import { DEFAULT_EDGE_DATA, PortsGroup } from '@/networks/carbon/shared';
import { STREAM_COLORS } from '@/networks/carbon/styles';
import { EdgeType, Stream } from '@/networks/carbon/types';

import { INIT_BATCH_EVENT, STORE_BATCH_EVENT } from '../../../joint/services/helpers';

export interface BaseEdgeAttributes extends joint.shapes.standard.LinkAttributes {
	layer?: string;
	stream_type?: Stream;
	name?: string;
	description?: string;
}

export class BaseEdge extends joint.shapes.standard.Link {
	private static LABEL_PADDING_X = 14;

	private static LABEL_PADDING_Y = 6;

	private static DEFAULT_COLORS: { [k in Theme]: { arrow: string; text: string } } = {
		[Theme.dark]: { arrow: '#F5F5F5', text: '#121212' },
		[Theme.light]: { arrow: '#404040', text: '#F5F5F5' },
	};

	private unsubThemeChange = useAlfaStore.subscribe((state, prevState) => {
		if (state.theme !== prevState.theme) {
			this.updateColor();
		}
	});

	/**
	 * Start batching commands
	 *
	 * @note it can be nested
	 * @note make sure to call storeBatch as many times as initBatch else the commands won't get saved
	 */
	initBatch() {
		return this.trigger(INIT_BATCH_EVENT);
	}

	/** Ends batching commands */
	storeBatch() {
		return this.trigger(STORE_BATCH_EVENT);
	}

	static createId() {
		const id = uuidv4();
		return id;
	}

	constructor(attributes?: BaseEdgeAttributes) {
		const { id, layer, stream_type, name, description, ...rest } = attributes ?? {};

		super({ ...rest, id: id ?? BaseEdge.createId() });

		this.streamType(stream_type).layer(layer);
		this.prop({
			...[DEFAULT_EDGE_DATA[EdgeType.base]],
			edgeType: EdgeType.base,
			name,
			description,
		});
	}

	defaults(): Partial<joint.shapes.standard.LinkAttributes> {
		return _.merge({}, super.defaults, {
			type: 'edges.Base',
			name: '',
			router: {
				name: 'manhattan',
				args: {
					padding: 10,
					startDirections: ['right'],
					endDirections: ['left'],
				},
			},
			connector: { name: 'rounded' },
			labels: [],
			z: 1,
		});
	}

	defaultLabel = {
		attrs: {
			text: _.defaultsDeep(this.getLabelAttributes(), { text: '' }),
			rect: {
				rx: 12,
				ry: 12,
				width: `calc(w + ${BaseEdge.LABEL_PADDING_X})`,
				height: `calc(h + ${BaseEdge.LABEL_PADDING_Y})`,
				x: `calc(x + calc(0.5 * w - ${BaseEdge.LABEL_PADDING_X / 2}))`,
				y: `calc(y + calc(0.5 * h - ${BaseEdge.LABEL_PADDING_Y / 2}))`,
			},
		},
	};

	/** Sets the edge stream type */
	streamType(val: Stream | undefined): this {
		return this.prop({ stream_type: val ?? null }).updateColor();
	}

	private getLabelAttributes() {
		const theme = useAlfaStore.getState().theme;
		const streamType = this.prop('stream_type');
		return {
			text: {
				fill: BaseEdge.DEFAULT_COLORS[theme].text,
			},
			rect: {
				fill: streamType ? STREAM_COLORS[streamType] : BaseEdge.DEFAULT_COLORS[theme].arrow,
			},
		};
	}

	private updateColor() {
		const theme = useAlfaStore.getState().theme;
		const streamType = this.prop('stream_type');

		return this.initBatch()
			.attr({
				line: {
					stroke: streamType ? STREAM_COLORS[streamType] : BaseEdge.DEFAULT_COLORS[theme].arrow,
				},
				label: {
					fill: BaseEdge.DEFAULT_COLORS[theme].text,
				},
				...this.getLabelAttributes(),
			})
			.storeBatch();
	}

	labelText(text: string): this {
		return this.initBatch()
			.label(0, { attrs: _.defaultsDeep(this.getLabelAttributes(), { text: { text } }) })
			.storeBatch();
	}

	setName(name: string): this {
		return this.initBatch().labelText(name.toString()).prop({ name }).storeBatch();
	}

	layer(val: string | undefined): this {
		return this.prop({ layer: val });
	}

	destroy(...params) {
		this.unsubThemeChange();
		return super.destroy(...params);
	}

	// handleId is the `fromHandle` and `toHandle` values in the db, portId is the id it will have in the front end, they are different because the ids of the ports in the front end need to be distinct from each other
	protected static handleIdToPortId(id: string, portsGroup: PortsGroup) {
		const check = `${portsGroup}_${id}`;
		return check;
	}

	protected static portIdToHandleId(id: string, portsGroup: PortsGroup) {
		const [mod, ...rest] = id.split('_');
		assert(mod === portsGroup, `mod should have been ${portsGroup} but was ${mod}`);
		assert(rest.length > 0, 'expected an actual id after the mod');
		return rest.join('_');
	}
}
