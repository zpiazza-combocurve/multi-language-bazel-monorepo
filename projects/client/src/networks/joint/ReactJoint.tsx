import * as joint from '@clientio/rappid';
import Backbone from 'backbone';
import { useEffect, useRef } from 'react';
import styled, { DefaultTheme } from 'styled-components';

import { useAlfa } from '@/helpers/alfa';
import { Theme } from '@/helpers/theme';

import JointService from './services/main-service';

export const DATA_TESTID_JOINTJS_MAIN = 'joint-main';

const DivWithThemeProps = styled.div<{
	generateStyles: (themeMode: Theme, theme: DefaultTheme) => string;
	themeMode: Theme;
}>`
	${({ theme, themeMode, generateStyles }) => generateStyles(themeMode, theme)}
`;

export interface JointJSConfig<ExternalHandlers, NodeType> {
	styling: {
		// CSS for the wrapper's HTML element
		generateWrapperCss: (themeMode: Theme, theme: DefaultTheme) => string;
		// CSS for the paper's HTML element
		generatePaperCss: (themeMode: Theme, theme: DefaultTheme) => string;
		// Applies theme changes to the paper
		applyThemeChangesToPaper: (paper: joint.dia.Paper) => () => void;
	};
	// Event handlers for the paper, graph, selection, etc.
	eventHandlers: {
		paper: () => { [eventName in keyof Partial<joint.dia.Paper.EventMap>]: joint.dia.Paper.EventMap[eventName] };
		graph: () => { [eventName in keyof Partial<Backbone.EventMap>]: Backbone.EventMap[eventName] };
		selection: () => { [eventName in keyof Partial<Backbone.EventMap>]: Backbone.EventMap[eventName] };
		onSelectionChange: (
			this: JointService<ExternalHandlers, NodeType>,
			evt: Event,
			previousModels: joint.dia.Cell[]
		) => void;
	};
	// Options for the paper, graph, selection, etc.'
	// The options are passed to the constructor of the corresponding class
	// They were implemented as functions to make `this` available
	constructorOptions: {
		paper: () => ConstructorParameters<typeof joint.dia.Paper>[0];
		graph: () => ConstructorParameters<typeof joint.dia.Graph>;
		snaplines: () => ConstructorParameters<typeof joint.ui.Snaplines>[0];
		paperScroller: () => ConstructorParameters<typeof joint.ui.PaperScroller>[0];
		selection: () => ConstructorParameters<typeof joint.ui.Selection>[0];
		navigator: () => ConstructorParameters<typeof joint.ui.Navigator>[0];
		commandManager: () => ConstructorParameters<typeof joint.dia.CommandManager>[0];
		clipboard: () => ConstructorParameters<typeof joint.ui.Clipboard>[0];
	};
	// Options for the services
	serviceOptions: {
		keyboard: {
			// A map of keyboard shortcuts
			shortcuts: (
				mainService: JointService<ExternalHandlers, NodeType>
			) => Record<string, (evt: JQuery.Event) => unknown>;
		};
		halo: {
			// A function that returns a list of halo handles for a given cell
			getHaloHandles: (
				externalHandlers: ExternalHandlers,
				cellView: joint.dia.CellView
			) => joint.ui.Halo.Handle[];
		};
	};
}
interface ReactJointProps<ExternalHandlers, NodeType> {
	initialCells: joint.dia.Cell[];
	externalHandlers: ExternalHandlers;
	onInstanceInitialized: (instance: JointService<ExternalHandlers, NodeType>) => void;
	config: JointJSConfig<ExternalHandlers, NodeType>;
}

const ReactJointNew = <ExternalHandlers, NodeType>(props: ReactJointProps<ExternalHandlers, NodeType>) => {
	const { initialCells, externalHandlers, onInstanceInitialized, config } = props;

	const { theme: themeMode } = useAlfa(['theme']);
	const elementRef = useRef<HTMLDivElement>(null);
	const jointRef = useRef<JointService<ExternalHandlers, NodeType> | null>(null);

	useEffect(() => {
		if (!elementRef.current) {
			return;
		}
		const joint = new JointService<ExternalHandlers, NodeType>(elementRef.current, externalHandlers, config);
		const cleanupThemeChanges = config.styling.applyThemeChangesToPaper(joint.paper);
		joint.start();
		joint.graph.resetCells(initialCells);

		onInstanceInitialized(joint);
		return () => {
			joint.paper.unmount();
			joint.paperScroller.remove();
			joint.keyboardService.destroy();
			joint.graph.destroy();
			jointRef.current = null;
			cleanupThemeChanges();
		};
	}, [initialCells, externalHandlers, onInstanceInitialized, config]);

	return (
		<DivWithThemeProps
			ref={elementRef}
			themeMode={themeMode}
			generateStyles={config.styling.generateWrapperCss}
			data-testid={DATA_TESTID_JOINTJS_MAIN}
			onClick={() => {
				if (document.activeElement instanceof HTMLElement) {
					document.activeElement.blur();
				}
			}}
		>
			<DivWithThemeProps id='jointPaper' themeMode={themeMode} generateStyles={config.styling.generatePaperCss} />
		</DivWithThemeProps>
	);
};

export default ReactJointNew;
