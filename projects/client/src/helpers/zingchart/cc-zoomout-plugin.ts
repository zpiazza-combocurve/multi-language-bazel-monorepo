/**
 * Zoomout Clickable label
 *
 * @file
 * @example
 * 	zingchart.render({
 * 		id,
 * 		data: { 'cc-zoomout-plugin': true },
 * 		modules: 'cc-zoomout-plugin',
 * 	});
 */
import _ from 'lodash';

import { hexToRgba } from '../text';
import { zingchart } from './entry';

export interface ZingchartZoomoutPluginOptions {
	color?: string;
	size?: number | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	labelConfig?: any;
}

const DEFAULT_SIZE = 24;

const ZOOMOUT_LABEL_ID = 'zoom-out';

/** @note `color` must be an hex value */
const ZOOMOUT_LABEL = ({
	color = '#9966ff',
	size = DEFAULT_SIZE,
	labelConfig,
}: ZingchartZoomoutPluginOptions = {}) => ({
	backgroundColor: hexToRgba(color),
	borderColor: hexToRgba(color),
	borderRadius: '50%',
	borderWidth: 2,
	cursor: 'pointer',
	flat: false, // makes label clickable
	fontColor: '#ffffff',
	fontSize: '14px',
	fontWeight: 'bold',
	id: ZOOMOUT_LABEL_ID,
	// offsetX: -250,
	// offsetY: 60,
	text: '&#9866;',
	// textAlign: 'center',
	// verticalAlign: 'middle',
	visible: false, // hide label by default
	height: size, // keep it the same value as offset so that it always fits within it
	width: size,
	x: '50%',
	y: '5%', // NOTE: may need to adjust if it overlaps data
	// zIndex: 1000,
	hoverState: { alpha: 1 },
	placement: 'top',
	...labelConfig,
});

zingchart.bind(null, 'label_click', (event) => {
	if (event.labelid === ZOOMOUT_LABEL_ID) {
		zingchart.exec(event.id, 'viewall');
	}
});

zingchart.bind(null, 'zoom', (event) => {
	if (event.action === 'viewall') {
		zingchart.exec(event.id, 'updateobject', {
			type: 'label',
			data: { id: ZOOMOUT_LABEL_ID, visible: false },
		});
	} else {
		zingchart.exec(event.id, 'updateobject', {
			type: 'label',
			data: { id: ZOOMOUT_LABEL_ID, visible: true },
		});
	}
});

const ZOOMOUT_PLUGIN_ID = 'cc-zoomout-plugin' as const;

zingchart.defineModule(ZOOMOUT_PLUGIN_ID, 'plugin', (data) => {
	data.labels ??= [];
	const config = data[ZOOMOUT_PLUGIN_ID];

	if (!_.find(data.labels, { id: ZOOMOUT_LABEL_ID })) {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		data.labels.push(ZOOMOUT_LABEL(typeof config === 'object' ? config : {}));
	}

	return data;
});
