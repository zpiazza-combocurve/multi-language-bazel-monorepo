import { useTheme } from '@material-ui/core';
import mermaid from 'mermaid';
import { useEffect, useState } from 'react';

import { ActivityStep } from '@/inpt-shared/scheduling/shared';

import { Diagram } from './Diagram';

export const useDiagram = (steps: ActivityStep[], hasCyclicSteps: boolean) => {
	const [svg, setSvg] = useState<string>('');
	const [error, setError] = useState<string>('');

	const {
		palette,
		typography: { fontFamily, fontSize },
	} = useTheme();
	const { type: theme, secondary, background, text } = palette;

	mermaid.mermaidAPI.initialize({
		theme: theme === 'dark' ? theme : 'default',
		themeVariables: {
			fontSize,
			fontFamily,
			nodeBorder: secondary[theme],
			mainBkg: background.paper,
			nodeTextColor: text.primary,
			lineColor: secondary[theme],
		},
	});

	useEffect(() => {
		const diagram = new Diagram(steps, hasCyclicSteps);
		const graphText = diagram.build();

		try {
			mermaid.mermaidAPI.render('mermaidFlow', graphText, (graph) => {
				setSvg(graph);
			});
		} catch (error) {
			setError('Failed to generate the chart, please try again.');
		}
	}, [hasCyclicSteps, steps]);

	return { svg, loading: !svg && !error, error };
};
