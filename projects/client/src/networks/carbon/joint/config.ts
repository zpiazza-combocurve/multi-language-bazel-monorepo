import * as joint from '@clientio/rappid';
import Backbone from 'backbone';
import _ from 'lodash';

import { CTRL_OR_COMMAND_KEY } from '@/components';
import { alerts } from '@/components/v2';
import { useAlfaStore } from '@/helpers/alfa';
import { Theme } from '@/helpers/theme';
import { assert } from '@/helpers/utilities';
import {
	AnyJointEdge,
	DevelopmentEdge,
	InputEdge,
	LinkEdge,
	OutputEdge,
	StandardEdge,
} from '@/networks/carbon/joint/edges';
import {
	createEdgeInfoButton,
	createLinkByStreamType,
	getNonOverlappingPosition,
	updatedJointShapes,
} from '@/networks/carbon/joint/helpers';
import { AnyJointNode, DeviceNode, FacilityNode } from '@/networks/carbon/joint/nodes';
import { BaseNode, NODE_INPUT_PORTS, NODE_OUTPUT_PORTS, PortDataAttrs } from '@/networks/carbon/joint/nodes/BaseNode';
import { Stream } from '@/networks/carbon/types';
import { JointJSConfig } from '@/networks/joint/ReactJoint';
import { HaloService } from '@/networks/joint/services/halo';
import { CM_IGNORE_KEY, INIT_BATCH_EVENT, STORE_BATCH_EVENT } from '@/networks/joint/services/helpers';
import { KeyboardService } from '@/networks/joint/services/keyboard';
import JointService from '@/networks/joint/services/main-service';

import { PortsGroup } from '../shared';

export type CarbonJointJSService = JointService<JointCarbonExternalHandlers, AnyJointNode>;

const TIMEOUT_HACK_PERIOD = 300;
export const PAPER_SCROLLER_MAX_ZOOM = 4;
export const PAPER_SCROLLER_MIN_ZOOM = 0.2;
export const PAPER_SCROLLER_ZOOM_LIMITS = {
	max: PAPER_SCROLLER_MAX_ZOOM,
	min: PAPER_SCROLLER_MIN_ZOOM,
};
export const PAPER_SCROLLER_ZOOM_UNIT = 0.1;
export const PORT_LIMITS = {
	well_group: {
		[PortsGroup.developmentIn]: {
			[Stream.development]: 20,
		},
	},
};
const EDGES_WITHOUT_DIALOG = [LinkEdge, DevelopmentEdge];

const linkToolsView = (onEditEdge: JointCarbonExternalHandlers['onEditEdge'] | null = null) => {
	const tools = [
		new joint.linkTools.Vertices(),
		new joint.linkTools.Segments(),
		new joint.linkTools.SourceArrowhead(),
		new joint.linkTools.TargetArrowhead(),
		// new joint.linkTools.Boundary(),
		new joint.linkTools.Remove(),
	];
	if (onEditEdge) {
		tools.push(createEdgeInfoButton(onEditEdge));
	}
	return new joint.dia.ToolsView({
		tools,
	});
};

const EXPANDABLE_PORTS = [PortsGroup.linkOut, PortsGroup.developmentOut, PortsGroup.out];

const defaultLink = (_cellView: joint.dia.CellView, magnet: SVGElement): AnyJointEdge => {
	const streamType = magnet.getAttribute(PortDataAttrs.streamType) as Stream;
	return createLinkByStreamType(streamType);
};

const validateConnection: joint.dia.Paper.Options['validateConnection'] = (
	cellViewS,
	magnetS,
	cellViewT,
	magnetT,
	end,
	linkView
) => {
	if (linkView.model instanceof InputEdge) {
		return end === 'target' && magnetT?.getAttribute('port-group') === PortsGroup.in;
	}
	if (linkView.model instanceof OutputEdge) {
		return end === 'source' && magnetS?.getAttribute('port-group') === PortsGroup.out;
	}

	const sourcePhase = magnetS?.getAttribute(PortDataAttrs.streamType);
	const targetPhase = magnetT?.getAttribute(PortDataAttrs.streamType) ?? null;

	const graph = cellViewS.model.graph;
	const links = graph.getLinks();

	const isDraggingFromInputPort =
		magnetS && NODE_INPUT_PORTS.includes(magnetS?.getAttribute('port-group') as PortsGroup);
	const isConnectedToSameNode = cellViewS === cellViewT;
	const isConnectedToOutputPort =
		magnetT && NODE_OUTPUT_PORTS.includes(magnetT?.getAttribute('port-group') as PortsGroup);
	const isMismatchingPhase = sourcePhase !== targetPhase;
	const isDuplicatedLink = links.some(
		(link) =>
			linkView.model.source().id === link.source().id &&
			linkView.model.source().port === link.source().port &&
			cellViewT.model.id === link.target().id &&
			magnetT?.getAttribute('port') === link.target().port &&
			linkView.model.id !== link.id
	);
	// Check port limits
	let isPortFull = false;
	const portLimit =
		PORT_LIMITS[cellViewT.model.attributes.nodeType]?.[magnetT?.getAttribute('port-group') as PortsGroup]?.[
			sourcePhase as Stream
		];
	if (portLimit) {
		const currentPortCount = graph
			.getConnectedLinks(cellViewT.model, { inbound: true })
			.filter((link) => link.attributes.stream_type === sourcePhase).length;
		isPortFull = currentPortCount >= portLimit;
	}

	if (
		isDraggingFromInputPort ||
		isConnectedToSameNode ||
		isConnectedToOutputPort ||
		isMismatchingPhase ||
		isDuplicatedLink ||
		isPortFull
	)
		return false;
	return true;
};

const allowLink: joint.dia.Paper.Options['allowLink'] = (linkView) => {
	const link = linkView.model as AnyJointEdge;
	if (link instanceof StandardEdge || link instanceof LinkEdge || link instanceof DevelopmentEdge) {
		return !!(
			link.attributes.source &&
			link.attributes.source.id &&
			link.attributes.source.port &&
			link.attributes.target &&
			link.attributes.target.id &&
			link.attributes.target.port
		);
	}
	return true;
};

const PAPER_DIMENSIONS = { width: 2000, height: 2000 };

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

export interface JointCarbonExternalHandlers {
	onEditDevice: (device: DeviceNode) => void;
	onEditFacility: (facility: FacilityNode) => void;
	onEditEdge: (linkView: joint.dia.LinkView) => void;
}

export const CARBON_JOINTJS_CONFIG: JointJSConfig<JointCarbonExternalHandlers, AnyJointNode> = {
	styling: {
		generateWrapperCss: (themeMode, theme) => `
			overflow: hidden;
			width: 100%;
			height: 100%;

			/* Toolbar */
			.joint-halo.toolbar {
				display: flex;
				justify-content: center;
				min-width: ${BaseNode.SIZE}px;
				.handles {
					height: min-content;
					margin-left: 0;
					background: ${theme.palette.background.opaque};
					border-left: 0;
					border-right: 0;
					border-top: 0;
					border-bottom: ${theme.palette.background.opaque};
					.handle.clone {
						background-image: url('/ghg_icons/${themeMode}/tools/clone.svg') !important;
					}
					.handle.delete {
						background-image: url('/ghg_icons/${themeMode}/tools/trash-alt.svg') !important;
					}
					.handle.edit {
						background-image: url('/ghg_icons/${themeMode}/tools/pen.svg') !important;
					}
					.handle:hover:after {
						border-bottom: 4px solid ${theme.palette.text.primary};
					}
				}
				.box {
					display: none;
				}
			}
			.MuiButton-root.MuiButton-contained:not(.MuiButton-containedPrimary):not(
					.MuiButton-containedSecondary
				) {
				background-color: ${theme.palette.background.opaque};
				&:not(.Mui-disabled) {
					color: ${theme.palette.text.primary};
				}
			}

			/* Links */
			.custom-link-hover {
				[joint-selector='line'] {
					stroke-width: 4px;
				}
				[joint-selector='wrapper'] {
					stroke: ${theme.palette.warning.light};
				}
			}
			.target-arrowhead.joint-tool,
			.source-arrowhead.joint-tool {
				opacity: 0;
			}

			/* Elements */
			.joint-port-label {
				> .label-background {
					fill: ${theme.palette.background.opaque};
					opacity: 0.8;
				}
				> .label-text {
					fill: ${theme.palette.text.primary};
				}
			}

			/* Selection */
			.joint-selection {
				> .selection-wrapper {
					border-color: ${theme.palette.text.primary};
					box-shadow: none;
					> .handle.rotate,
					.handle.resize {
						display: none;
					}
					> .box {
						display: none;
					}
				}
				> .selection-box {
					border-color: ${theme.palette.text.primary};
					box-shadow: none;
				}
			}

			/* Ports */
			.available-magnet {
				stroke: ${theme.palette.warning.light};
				stroke-width: 3px;
			}
		`,
		generatePaperCss: (_themeMode, theme) => `
			width: 100%;
			height: 100%;
			overflow: hidden;
			> .joint-paper-scroller {
				background: ${theme.palette.background.default};
				overflow: hidden;
			}

			.joint-paper.hide-ports {
				.joint-port-label {
					display: none;
				}
			}
		`,
		applyThemeChangesToPaper: (paper: joint.dia.Paper) => {
			function updateColors() {
				const theme = useAlfaStore.getState().theme;

				const BGCOLOR = theme === Theme.dark ? '#121212' : '#DEDEDE';
				const DOTCOLOR = theme === Theme.dark ? 'rgba(235, 235, 235, 0.32)' : 'rgba(41, 41, 41, 0.32)';

				paper.drawBackground({ color: BGCOLOR });
				paper.drawGrid({
					name: 'dot',
					color: DOTCOLOR,
				});
			}

			updateColors();
			return useAlfaStore.subscribe((state, prevState) => {
				if (state.theme !== prevState.theme) {
					updateColors();
				}
			});
		},
	},
	eventHandlers: {
		paper(this: CarbonJointJSService) {
			const keyboard = this.keyboardService.keyboard;
			return {
				// Blank events
				'blank:mousewheel': (evt, _x, _y, delta) => {
					evt.preventDefault();
					const adjustedDelta = delta / 10;
					this.paperScroller.zoom(adjustedDelta, PAPER_SCROLLER_ZOOM_LIMITS);
				},
				'blank:pointerdown': (evt, _x, _y) => {
					if (keyboard.isActive('alt', evt)) {
						// Rectangle Selection
						evt.data = {
							...evt.data,
							rectangleSelection: true,
						};
						this.selection.startSelecting(evt);
					} else {
						this.selection.collection.reset([]);
						this.paperScroller.startPanning(evt);
						this.paper.removeTools();
					}
				},
				'blank:pointerup': (evt, _x, _y) => {
					if (evt.data.rectangleSelection) {
						// If there were selected elements before starting the rectangle, they're added to the selection
						this.selection.collection.add(this.lastSelection);
						this.lastSelection = this.selection.collection.toArray();
					} else {
						this.lastSelection = [];
					}
				},
				'element:pointerup': (elementView, evt) => {
					// Select an element if CTRL/Meta key is pressed while the element is clicked.
					if (keyboard.isActive('alt', evt)) {
						this.selection.collection.add(elementView.model);
						// Store in case that the user starts a rectangle selection next
						this.lastSelection = this.selection.collection.toArray();
					} else {
						this.selection.collection.reset([elementView.model]);
					}
					const otherNodes = this.graph.getElements().filter((node) => node.id !== elementView.model.id);
					const nonOverlappingPosition = getNonOverlappingPosition(elementView.model.position(), otherNodes);
					elementView.model.position(nonOverlappingPosition.x, nonOverlappingPosition.y);
					elementView.model.toFront();
				},
				'element:contextmenu': (elementView, evt) => {
					evt.stopPropagation();
					evt.preventDefault();
					const { model } = elementView;
					if (model instanceof DeviceNode) {
						/**
						 * HACK: This is a workaround for the issue with the right click menu appearing
						 *
						 * @see https://github.com/clientIO/joint/issues/1891
						 */
						setTimeout(() => {
							this.externalHandlers.onEditDevice(model);
						}, TIMEOUT_HACK_PERIOD);
					} else if (model instanceof FacilityNode) {
						/**
						 * HACK: This is a workaround for the issue with the right click menu appearing
						 *
						 * @see https://github.com/clientIO/joint/issues/1891
						 */
						setTimeout(() => {
							this.externalHandlers.onEditFacility(model);
						}, TIMEOUT_HACK_PERIOD);
					}
				},
				'element:mouseover'(this: CarbonJointJSService, elementView, evt) {
					if (
						evt.target.getAttribute('joint-selector') === 'portBody' &&
						EXPANDABLE_PORTS.includes(evt.target.getAttribute('port-group'))
					) {
						const port = evt.target.getAttribute('port');
						if (port !== this.hoveredPort?.port) {
							const model = elementView.model as AnyJointNode;
							this.hoveredPort = {
								element: model,
								port,
							};
							if (port) {
								model.expandPort(port);
							}
						}
					} else if (this.hoveredPort) {
						(this.hoveredPort.element as AnyJointNode).shrinkPort(this.hoveredPort.port);
						this.hoveredPort = null;
					}
				},
				'element:mouseleave'(this: CarbonJointJSService) {
					if (this.hoveredPort) {
						(this.hoveredPort.element as AnyJointNode).shrinkPort(this.hoveredPort.port);
						this.hoveredPort = null;
					}
				},
				// Link events
				'link:mouseenter': (linkView) => {
					linkView.addTools(
						linkToolsView(
							!EDGES_WITHOUT_DIALOG.some((edge) => linkView.model instanceof edge)
								? this.externalHandlers.onEditEdge
								: null
						)
					);
					linkView.el.classList.add('custom-link-hover');
				},
				'link:mouseleave': (linkView: joint.dia.LinkView) => {
					linkView.el.classList.remove('custom-link-hover');
					linkView.removeTools();
				},
				'link:connect': (linkView, ev, newCellView, newCellViewMagnet, arrowhead) => {
					const link = linkView.model as AnyJointEdge;
					const source = link.getSourceElement();
					const target = link.getTargetElement();

					if (link instanceof StandardEdge && source instanceof FacilityNode) {
						assert('No facility ID', source.attributes.params.facility_id);
						link.setFromFacilityObjectId(source.attributes.params.facility_id);
					}
					if ((link instanceof StandardEdge || link instanceof LinkEdge) && target instanceof FacilityNode) {
						assert('No facility ID', target.attributes.params.facility_id);
						link.setToFacilityObjectId(target.attributes.params.facility_id);
					}

					if (link instanceof InputEdge && target) {
						assert(arrowhead === 'target', 'should be connecting to target');
						assert(newCellViewMagnet, 'should be connected to a magnet');

						const streamType = newCellViewMagnet.getAttribute(PortDataAttrs.streamType) as Stream;
						assert(streamType, 'should have stream type attribute');

						link.streamType(streamType);
						link.layer(streamType);
					}

					if (link instanceof OutputEdge && source) {
						assert(arrowhead === 'source', 'should be connecting to source');
						assert(newCellViewMagnet, 'should be connected to a magnet');

						const streamType = newCellViewMagnet.getAttribute(PortDataAttrs.streamType) as Stream;
						assert(streamType, 'should have stream type attribute');

						link.streamType(streamType);
						link.layer(streamType);
					}
				},
				'link:disconnect': (linkView, _evt, _prev, _cellViewMagnet, arrowhead) => {
					const link = linkView.model as AnyJointEdge;
					if (link instanceof InputEdge && arrowhead === 'target' && !link.attributes.target?.id) {
						link.streamType(undefined);
						link.layer(undefined);
					}
					if (link instanceof OutputEdge && arrowhead === 'source' && !link.attributes.source?.id) {
						link.streamType(undefined);
						link.layer(undefined);
					}
				},
				'link:contextmenu': (linkView, evt) => {
					evt.stopPropagation();
					evt.preventDefault();
					if (EDGES_WITHOUT_DIALOG.some((edge) => linkView.model instanceof edge)) return;
					setTimeout(() => {
						this.externalHandlers.onEditEdge(linkView);
					}, TIMEOUT_HACK_PERIOD);
				},
			};
		},
		graph(this: CarbonJointJSService) {
			return {
				remove: (cell) => {
					// If element is removed from the graph, remove from the selection too.
					if (this.selection.collection.has(cell)) {
						this.selection.collection.reset(this.selection.collection.models.filter((c) => c !== cell));
					}
				},
			};
		},
		selection(this: CarbonJointJSService) {
			const keyboard = this.keyboardService.keyboard;
			return {
				'selection-box:pointerup': (elementView: joint.dia.ElementView, evt: joint.dia.Event) => {
					// Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.
					if (keyboard.isActive('alt', evt)) {
						const model = elementView.model as AnyJointNode;
						model.movePortsOnDeselection();
						this.selection.collection.remove(elementView.model);
					} else if (!evt.data.isPointerMove) {
						this.selection.collection.reset([elementView.model]);
					}
					const otherNodes = this.graph.getElements().filter((node) => node.id !== elementView.model.id);
					const nonOverlappingPosition = getNonOverlappingPosition(elementView.model.position(), otherNodes);
					elementView.model.position(nonOverlappingPosition.x, nonOverlappingPosition.y);
					elementView.model.toFront();
				},
				'selection-box:pointermove': (_elementView: joint.dia.ElementView, evt: joint.dia.Event) => {
					// Prevents selection box from being deselected if it's a drag event.
					if (!evt.data.isPointerMove) {
						evt.data.isPointerMove = true;
					}
				},
			};
		},
		onSelectionChange(_evt, previousModels) {
			if (previousModels) {
				previousModels.forEach((model) => {
					model.attr('labelWrapper', {
						opacity: 0.5,
					});
					if (model.isElement()) {
						const element = model as AnyJointNode;
						element.movePortsOnDeselection();
					}
				});
			}
			const { paper, selection } = this;
			const { collection } = selection;
			paper.removeTools();
			joint.ui.Halo.clear(paper);
			joint.ui.FreeTransform.clear(paper);
			joint.ui.Inspector.close();
			if (collection.length === 1) {
				const primaryCell: joint.dia.Cell = collection.first();
				const primaryCellView = paper.requireView(primaryCell);
				// selection.destroySelectionBox(primaryCell);
				if (primaryCell.isElement()) {
					this.haloService.create(primaryCellView);
					primaryCell.attr('labelWrapper', {
						opacity: 1,
					});
					const element = primaryCell as AnyJointNode;
					element.movePortsOnSelection();
				}
			} else {
				collection.each(function (cell: joint.dia.Cell) {
					selection.createSelectionBox(cell);
					if (cell.isElement()) {
						cell.attr('labelWrapper', {
							opacity: 1,
						});
						const element = cell as AnyJointNode;
						element.movePortsOnSelection();
					}
				});
			}
		},
	},
	constructorOptions: {
		paper(this: CarbonJointJSService) {
			return {
				...PAPER_DIMENSIONS,
				model: this.graph,
				cellViewNamespace: updatedJointShapes,
				defaultLink,
				validateConnection,
				allowLink,
				gridSize: 16,
				drawGrid: { thickness: 2 },
				restrictTranslate: true,
				sorting: joint.dia.Paper.sorting.APPROX,
				async: true,
				snapLinks: {
					radius: 12,
				},
				markAvailable: true,
			};
		},
		graph(this: CarbonJointJSService) {
			return [{}, { cellNamespace: updatedJointShapes }];
		},
		snaplines(this: CarbonJointJSService) {
			return {
				paper: this.paper,
			};
		},
		paperScroller(this: CarbonJointJSService) {
			return {
				paper: this.paper,
				autoResizePaper: true,
				scrollWhileDragging: true,
				cursor: 'grab',
				// see https://resources.jointjs.com/docs/rappid/v3.6/ui.PaperScroller.html, "Paper auto-resize/shrink" example
				padding: 0,
				contentOptions: (paperScroller) => {
					const visibleArea = paperScroller.getVisibleArea();
					return {
						padding: {
							bottom: visibleArea.height / 2,
							top: visibleArea.height / 2,
							left: visibleArea.width / 2,
							right: visibleArea.width / 2,
						},
						allowNewOrigin: 'any',
					};
				},
			};
		},
		navigator(this: CarbonJointJSService) {
			return {
				paperScroller: this.paperScroller,
				width: 200,
				height: 100,
				padding: 10,
				zoomOptions: { max: 2, min: 0.2 },
				paperOptions: {
					background: {
						color: 'transparent',
					},
				},
			};
		},
		commandManager(this: CarbonJointJSService) {
			return {
				graph: this.graph,
				cmdBeforeAdd: (cmdName, _cell, _graph, options) => {
					if (['change:ports', 'change:attrs'].includes(cmdName)) {
						// ignore some undesired events from the queue events
						return false;
					}
					if (cmdName === INIT_BATCH_EVENT) {
						this.commandManager.initBatchCommand();
						return false;
					}
					if (cmdName === STORE_BATCH_EVENT) {
						this.commandManager.storeBatchCommand();
						return false;
					}
					return !options?.[CM_IGNORE_KEY];
				},
			};
		},
		clipboard(this: CarbonJointJSService) {
			return {
				useLocalStorage: false,
			};
		},
		selection(this: CarbonJointJSService) {
			return { paper: this.paper, useModelGeometry: true, allowCellInteraction: true };
		},
	},
	serviceOptions: {
		keyboard: {
			shortcuts(
				this: KeyboardService<JointCarbonExternalHandlers, AnyJointNode>,
				mainService: CarbonJointJSService
			) {
				const { graph, selection, clipboard, commandManager, paperScroller, paper } = mainService;
				return {
					[`${CTRL_OR_COMMAND_KEY}+c`]: (evt) => handleCopy(evt, graph, selection, clipboard, this.keyboard),
					[`${CTRL_OR_COMMAND_KEY}+v`]: (evt) => handlePaste(evt, graph, selection, clipboard),
					[`${CTRL_OR_COMMAND_KEY}+x shift+delete`]: (evt) => {
						evt.preventDefault();
						clipboard.cutElements(selection.collection, graph);
					},
					'delete backspace': (evt) => {
						evt.preventDefault();
						graph.removeCells(selection.collection.toArray());
					},
					[`${CTRL_OR_COMMAND_KEY}+z`]: (evt) => {
						evt.preventDefault();
						commandManager.undo();
						selection.cancelSelection();
					},
					[`${CTRL_OR_COMMAND_KEY}+y`]: (evt) => {
						evt.preventDefault();
						commandManager.redo();
						selection.cancelSelection();
					},
					[`${CTRL_OR_COMMAND_KEY}+a`]: (evt) => {
						evt.preventDefault();
						selection.collection.reset(graph.getElements());
					},
					[`${CTRL_OR_COMMAND_KEY}+up`]: (evt) => {
						evt.preventDefault();
						paperScroller.zoom(0.2, { max: PAPER_SCROLLER_MAX_ZOOM });
					},
					[`${CTRL_OR_COMMAND_KEY}+down`]: (evt) => {
						evt.preventDefault();
						paperScroller.zoom(-0.2, { min: PAPER_SCROLLER_MIN_ZOOM });
					},
					[`${CTRL_OR_COMMAND_KEY}+0`]: (evt) => {
						evt.preventDefault();
						paperScroller.zoom(1, {
							absolute: true,
						});
					},
					'keydown:alt': (_evt) => {
						paperScroller.setCursor('crosshair');
					},
					'keyup:alt': () => {
						paperScroller.setCursor('grab');
					},
					'keyup:q': () => {
						if (mainService.showPortLabels) {
							paper.el.classList.add('hide-ports');
						} else {
							paper.el.classList.remove('hide-ports');
						}
						mainService.showPortLabels = !mainService.showPortLabels;
					},
				};
			},
		},
		halo: {
			getHaloHandles(
				this: HaloService<JointCarbonExternalHandlers>,
				externalHandlers: JointCarbonExternalHandlers,
				cellView: joint.dia.CellView
			) {
				return [
					{
						name: 'edit',
						position: joint.ui.Halo.HandlePosition.NW,
						events: {
							pointerdown: (evt) => {
								evt.stopPropagation();
								if (!(cellView.model instanceof FacilityNode)) {
									this.externalHandlers.onEditDevice(cellView.model as DeviceNode);
								} else {
									assert(cellView.model.attributes.params.facility_id, 'should have facility id');
									this.externalHandlers.onEditFacility(cellView.model);
								}
							},
						},
					},
					{
						name: 'clone',
						position: joint.ui.Halo.HandlePosition.NW,
						events: {
							pointerup: async (evt) => {
								const proceed = await handleCopy(
									evt,
									cellView.model.graph,
									this.selection,
									this.clipboard,
									this.keyboard
								);
								if (proceed) handlePaste(evt, cellView.model.graph, this.selection, this.clipboard);
							},
						},
					},
					{
						name: 'delete',
						position: joint.ui.Halo.HandlePosition.NW,
						events: {
							pointerdown: (evt) => {
								evt.stopPropagation();
								cellView.model.remove();
							},
						},
					},
				];
			},
		},
	},
};
