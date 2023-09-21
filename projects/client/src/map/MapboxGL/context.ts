import mapboxgl from 'mapbox-gl';
import { MutableRefObject, createContext } from 'react';

export const MapboxGLContext = createContext<{ map?: mapboxgl.Map; isMountedRef?: MutableRefObject<boolean> }>({});
