import * as joint from '@clientio/rappid';

import { JointJSConfig } from '../ReactJoint';
import { HaloService } from './halo';
import { KeyboardService } from './keyboard';

class JointService<ExternalHandlers, NodeType> {
	element: HTMLElement;
	snaplines: joint.ui.Snaplines;
	graph: joint.dia.Graph;
	paper: joint.dia.Paper;
	paperScroller: joint.ui.PaperScroller;
	navigator: joint.ui.Navigator;
	commandManager: joint.dia.CommandManager;
	clipboard: joint.ui.Clipboard;
	selection: joint.ui.Selection;
	keyboardService: KeyboardService<ExternalHandlers, NodeType>;
	externalHandlers: ExternalHandlers;
	haloService: HaloService<ExternalHandlers>;
	lastSelection: joint.dia.Cell[];
	hoveredPort: {
		port: string;
		element: NodeType;
	} | null;
	showPortLabels: boolean;
	config: JointJSConfig<ExternalHandlers, NodeType>;

	constructor(
		element: HTMLElement,
		externalHandlers: ExternalHandlers,
		config: JointJSConfig<ExternalHandlers, NodeType>
	) {
		this.element = element;
		this.config = config;
		this.externalHandlers = externalHandlers;
		this.graph = new joint.dia.Graph(config.constructorOptions.graph.call(this));
		this.paper = new joint.dia.Paper(config.constructorOptions.paper.call(this));
		this.paper.el.classList.add('hide-ports');

		this.snaplines = new joint.ui.Snaplines(config.constructorOptions.snaplines.call(this));
		this.paperScroller = new joint.ui.PaperScroller(config.constructorOptions.paperScroller.call(this));
		this.navigator = new joint.ui.Navigator(config.constructorOptions.navigator.call(this));
		this.commandManager = new joint.dia.CommandManager(config.constructorOptions.commandManager.call(this));
		this.clipboard = new joint.ui.Clipboard(config.constructorOptions.clipboard.call(this));
		this.selection = new joint.ui.Selection(config.constructorOptions.selection.call(this));
		this.keyboardService = new KeyboardService(this, config.serviceOptions.keyboard);
		this.haloService = new HaloService(
			config.serviceOptions.halo.getHaloHandles,
			externalHandlers,
			this.clipboard,
			this.selection,
			this.keyboardService.keyboard
		);
		this.lastSelection = [];
		this.hoveredPort = null;
		this.showPortLabels = false;
	}

	start() {
		joint.setTheme('modern');
		this.initializePaper();
		this.initializeHandlers();
		this.initializeKeyboardShortcuts();
	}

	initializePaper() {
		this.renderPlugin('#jointPaper', this.paperScroller);
	}

	initializeHandlers() {
		this.selection.collection.on('reset add remove', (evt, { previousModels }) =>
			this.config.eventHandlers.onSelectionChange.call(this, evt, previousModels)
		);
		this.paper.on(this.config.eventHandlers.paper.call(this));
		this.graph.on(this.config.eventHandlers.graph.call(this));
		this.selection.on(this.config.eventHandlers.selection.call(this));
	}

	// Plugins
	private initializeKeyboardShortcuts() {
		this.keyboardService.create();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	renderPlugin(selector: string, plugin: any) {
		this.element.querySelector(selector)?.appendChild(plugin.el);
		plugin.render();
	}
}

export default JointService;
