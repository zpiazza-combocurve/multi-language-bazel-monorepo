import { faPencilRuler } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Popover } from '@material-ui/core';
import buffer from '@turf/buffer';
import { Map } from 'mapbox-gl';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';

import { Box, Button, InfoIcon, Card as Paper, RHFNumberField, RHFSelectField, Typography } from '@/components/v2';
import { WellMapTheme } from '@/map/MapboxGL';

import { useMapStore } from './mapPortals';

const UNITS = ['miles', 'feet', 'kilometers', 'meters'] as const;
interface BufferOptions {
	distance: number;
	units: (typeof UNITS)[number];
}

interface TransformMenuProps {
	onBuffer: (values: BufferOptions) => void;
}

function IconMenuButton({ title, icon, className, children }) {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

	return (
		<div>
			<button title={title} className={className} onClick={(e) => setAnchorEl(e.currentTarget)}>
				<FontAwesomeIcon icon={icon} />
			</button>
			<Popover
				open={!!anchorEl}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				{children}
			</Popover>
		</div>
	);
}

function TransformMenu({ onBuffer }: TransformMenuProps) {
	const initialValues: BufferOptions = {
		distance: 10,
		units: 'miles',
	};

	const { control, handleSubmit: withFormValues } = useForm({ defaultValues: initialValues });

	return (
		<WellMapTheme>
			<IconMenuButton
				title='Transform Selection'
				className='mapbox-gl-draw_ctrl-draw-btn custom-mapbox-control'
				icon={faPencilRuler}
			>
				<Box css={{ padding: '0.25rem' }}>
					<Paper css={{ padding: '0.25rem', display: 'flex' }}>
						<Box css={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
							<Typography
								css={`
									color: ${({ theme }) => theme.palette.text.primary} !important;
								`}
							>
								Buffer
							</Typography>
							<InfoIcon
								css={`
									margin-right: 10px;
								`}
								tooltipTitle='Create a buffer distance in linear units around selected spatial features.'
							/>
						</Box>
						<Box css={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
							<RHFNumberField
								css={{ width: '5rem' }}
								control={control}
								placeholder='Distance'
								name='distance'
								variant='standard'
								InputProps={{ style: { fontSize: '.75rem' } }}
							/>
							<RHFSelectField
								css={{ width: '6.5rem' }}
								control={control}
								placeholder='Units'
								name='units'
								menuItems={UNITS.map((u) => ({ value: u, label: u }))}
								InputProps={{ style: { fontSize: '.75rem' } }}
							/>
							<Button
								color='primary'
								onClick={withFormValues(onBuffer)}
								css={`
									font-size: 0.75rem;
								`}
							>
								Create
							</Button>
						</Box>
					</Paper>
				</Box>
			</IconMenuButton>
		</WellMapTheme>
	);
}

const bufferSelectedDraws = (draw: MapboxDraw, map: Map, { distance, units }: BufferOptions) => {
	const selected = draw.getSelected();

	if (!selected.features.length) {
		return;
	}

	const bufferedFeatures = selected.features.map((feature) => ({
		...buffer(feature, distance, { units }),
		properties: {},
	}));

	const addedIds = draw.add({ type: 'FeatureCollection', features: bufferedFeatures });

	draw.changeMode('simple_select', { featureIds: addedIds });
	map.fire('draw.update');
};

export const getTransformButton = (
	draw: MapboxDraw,
	map: Map,
	setMapPortals?: Dispatch<SetStateAction<ReactNode[]>>
) => {
	const container = document.createElement('div');

	const el = ReactDOM.createPortal(
		<TransformMenu onBuffer={(options) => bufferSelectedDraws(draw, map, options)} />,
		container
	);

	if (setMapPortals) {
		setMapPortals((prev) => [...prev, el]);
	} else {
		useMapStore.getState().addComponent(el);
	}

	return container;
};
