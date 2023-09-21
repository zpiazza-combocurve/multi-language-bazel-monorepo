import { Feature } from 'geojson';
import { Dispatch, MutableRefObject, ReactNode, SetStateAction, useContext, useEffect } from 'react';

import { useCallbackRef } from '@/components/hooks';
import { CustomDraw } from '@/helpers/map/draw/CustomDraw';

import MapNativeControl from './MapNativeControl';
import { MapboxGLContext } from './context';

interface DrawingCustomControlsProps {
	setMapPortals: Dispatch<SetStateAction<ReactNode[]>>;
	theme: 'light' | 'dark';
	showDrawingControl?: boolean;
	persistDrawings: boolean;
	onDrawingChange?: (draws: Feature[]) => void;
	onDrawModeChange: (mode) => void;
	drawRef: MutableRefObject<MapboxDraw | undefined>;
}
export function DrawingCustomControls({
	setMapPortals,
	theme,
	showDrawingControl,
	persistDrawings,
	onDrawingChange,
	onDrawModeChange,
	drawRef,
}: DrawingCustomControlsProps) {
	const { map } = useContext(MapboxGLContext);

	const handleDrawChange = useCallbackRef(() => {
		onDrawingChange?.(drawRef.current?.getAll()?.features ?? []);
		if (!persistDrawings) {
			drawRef.current?.deleteAll();
		}
	});

	const handleDrawModeChange = useCallbackRef(({ mode }) => {
		onDrawModeChange(mode);
	});

	useEffect(() => {
		if (!showDrawingControl || !map) return;
		map.on('draw.create', handleDrawChange);
		map.on('draw.update', handleDrawChange);
		map.on('draw.delete', handleDrawChange);
		map.on('draw.modechange', handleDrawModeChange);

		return () => {
			map.off('draw.create', handleDrawChange);
			map.off('draw.update', handleDrawChange);
			map.off('draw.delete', handleDrawChange);
			map.off('draw.modechange', handleDrawModeChange);
		};
	}, [handleDrawChange, map, showDrawingControl, handleDrawModeChange]);

	return <MapNativeControl controlRef={drawRef} control={CustomDraw} setMapPortals={setMapPortals} theme={theme} />;
}
