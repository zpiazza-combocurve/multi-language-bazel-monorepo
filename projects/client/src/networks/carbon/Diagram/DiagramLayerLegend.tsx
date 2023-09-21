import * as joint from '@clientio/rappid';
import { FormGroup, Typography } from '@material-ui/core';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Paper, RHFCheckboxField, Stack } from '@/components/v2';

import { InputEdge, OutputEdge } from '../joint/edges';
import { Stream } from '../types';

export interface Layer {
	id: Stream;
	name: string;
}
interface DiagramLayerLegendProps {
	graph: joint.dia.Graph;
	paper?: joint.dia.Paper;
	layerList: Layer[];
}

function DiagramLayerLegend({ graph, paper, layerList }: DiagramLayerLegendProps) {
	const {
		formState: { isValid, isValidating },
		control,
		watch,
	} = useForm({
		defaultValues: layerList.reduce(
			(acc, layer) => ({
				...acc,
				[layer.id]: true,
			}),
			{}
		) as unknown as Record<Stream, boolean>,
		mode: 'onChange',
	});

	const data = watch();

	const toggleLayerVisibility = useCallback(
		(data) => {
			const elements = graph.getElements();
			elements.forEach((element) => {
				const ports = element.getPorts();
				ports.forEach((port) => {
					if (port.id) {
						const isLayerActive = data[port.args?.layer] ?? false;
						element.portProp(port.id, 'attrs', {
							root: {
								style: {
									display: isLayerActive ? '' : 'none',
								},
							},
						});
					}
				});
			});
			const links = graph.getLinks();
			links.forEach((link) => {
				const isLayerActive =
					data[link.attributes.stream_type] || link instanceof InputEdge || link instanceof OutputEdge;
				link.attr({
					root: {
						style: {
							display: isLayerActive ? '' : 'none',
						},
					},
				});
			});
			paper?.update();
		},
		[graph, paper]
	);

	useEffect(() => {
		if (isValid && !isValidating) {
			toggleLayerVisibility(data);
		}
	}, [isValid, isValidating, data, toggleLayerVisibility]);

	return (
		<Paper
			css={`
				width: 200px;
				height: min-content;
				background: ${({ theme }) => theme.palette.background.opaque};
				padding: ${({ theme }) => theme.spacing(1, 2)};
			`}
		>
			<form>
				<Stack spacing={2}>
					<Typography variant='body1'>Layers</Typography>
					<FormGroup>
						{layerList.map((layer) => (
							<RHFCheckboxField key={layer.id} label={layer.name} control={control} name={layer.id} />
						))}
					</FormGroup>
				</Stack>
			</form>
		</Paper>
	);
}

export default DiagramLayerLegend;
