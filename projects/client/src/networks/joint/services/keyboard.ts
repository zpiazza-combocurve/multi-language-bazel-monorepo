import * as joint from '@clientio/rappid';
import Backbone from 'backbone';
import _ from 'lodash';

import { alerts } from '@/components/v2';

import { JointJSConfig } from '../ReactJoint';
import JointService from './main-service';

export const handleCopy = async (
	evt: JQuery.Event,
	graph: joint.dia.Graph,
	selection: joint.ui.Selection,
	clipboard: joint.ui.Clipboard,
	keyboard?: joint.ui.Keyboard
): Promise<boolean> => {
	evt.preventDefault();
	// Copy all selected elements and their associated links.
	const hasWellGroupNodes = selection.collection.models.some((node) => node.attributes.nodeType === 'well_group');
	if (hasWellGroupNodes) {
		if (keyboard) keyboard.disable();
		const response = await alerts.confirm({
			title: 'Copy Well Group Node(s)?',
			children: 'Wells inside Well Group node(s) will not be copied.',
			confirmText: 'Copy',
		});
		if (keyboard) keyboard.enable();
		if (!response) return false;
		// Clone all selected elements and their associated links.
		const originalElements = selection.collection.toArray();
		const clones = _.sortBy(graph.cloneSubgraph(originalElements, { deep: true }), function (cell) {
			return cell.isLink() ? 1 : 2;
		});
		// Remove wells from well group nodes
		clones.forEach((cell) => {
			if (cell.attributes.nodeType === 'well_group') {
				cell.attributes.params.wells = [];
			}
		});
		// Create new collection to satisfy the `clipboard.copyElements` method
		const newCollection = new Backbone.Collection(clones, _.clone(selection.options));
		clipboard.copyElements(newCollection, graph);
	} else {
		clipboard.copyElements(selection.collection, graph);
	}
	return true;
};

export const handlePaste = (
	evt: JQuery.Event,
	graph: joint.dia.Graph,
	selection: joint.ui.Selection,
	clipboard: joint.ui.Clipboard
) => {
	evt.preventDefault();
	const pastedCells = clipboard.pasteCells(graph, {
		translate: { dx: 20, dy: 20 },
	});

	const elements = _.filter(pastedCells, (cell) => cell.isElement());

	// Make sure pasted elements get selected immediately. This makes the UX better as
	// the user can immediately manipulate the pasted elements.
	selection.collection.reset(elements);
};

export class KeyboardService<ExternalHandlers, NodeType> {
	keyboard: joint.ui.Keyboard;
	shortcuts: Record<string, (evt: JQuery.Event) => void>;
	constructor(
		mainService: JointService<ExternalHandlers, NodeType>,
		serviceOptions: JointJSConfig<ExternalHandlers, NodeType>['serviceOptions']['keyboard']
	) {
		this.keyboard = new joint.ui.Keyboard();
		this.shortcuts = serviceOptions.shortcuts(mainService);
	}

	create() {
		this.keyboard.on(this.shortcuts);
	}

	addShortcut(key: string, callback: (evt: Event) => void) {
		this.keyboard.off(key);
		this.keyboard.on(key, (evt) => callback(evt));
	}

	destroy() {
		/**
		 * Not exposed by JointJS but by backbone
		 *
		 * @see https://backbonejs.org/#Events-off
		 */
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		this.keyboard.off();
	}

	disable() {
		this.keyboard.disable();
	}

	enable() {
		this.keyboard.enable();
	}
}
