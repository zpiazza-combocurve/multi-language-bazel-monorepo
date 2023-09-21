import { Expression } from 'mapbox-gl';

import { HeaderSettingsMapData } from '@/map/types';

export const DEFAULT_WELLS_SIZE = 4;
export const MIN_WELLS_CLICKING_SIZE = 12;
export const MIN_WELLS_SIZE = 2;
export const MAX_WELLS_SIZE = 20;

export const getSizeByHeaderValueExpression = ({ header, min }: HeaderSettingsMapData['sizeBy']): Expression => [
	'number',
	['get', header],
	min,
];

export const getWellRadiusExpression = ({ header, min, max }: HeaderSettingsMapData['sizeBy']): number | Expression =>
	header && min !== undefined && max !== undefined && min < max
		? [
				'interpolate',
				['linear'],
				getSizeByHeaderValueExpression({ header, min }),
				min,
				MIN_WELLS_SIZE,
				max,
				MAX_WELLS_SIZE,
		  ]
		: DEFAULT_WELLS_SIZE;
