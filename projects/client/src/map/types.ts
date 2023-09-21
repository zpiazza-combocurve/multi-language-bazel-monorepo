export interface Layer {
	_id: string;
	preset: boolean;
	shSourceType;
	filtering;
	urls;
	idShapefile: string;
	name: string;
	description: string;
	shapeType: string;
	label: string | null;
	tooltipFields?: string[];
	fields: Array<{ name: string; fieldType: 'string' | 'number' | 'boolean' | 'date' }>;
	opacity: number;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
	visibility: string[];
	active: boolean;
	position: number;
}

export interface MapHeaderSettings {
	projectId: string;
	projectScope?: boolean;
	header?: string | null;
	headerValues: Array<string | null> | null;
	colors: string[] | null;
	wellLabel?: string | null;
	sizeBy: { header: string | null; min?: number; max?: number };
}

export interface HeaderSettingsMapData {
	colorBy: string | null;
	headerColors: Array<{ value: string | null; color: string }>;
	wellLabel: string | null;
	sizeBy: { header: string | null; min?: number; max?: number };
}

export interface Shapefile {
	_id: string;
	idShapefile: string;
	shSourceType: string;
	shapeType: string;
	name: string;
	color: string;
	opacity: number;
	tooltipFields;
	active: boolean;
	preset: boolean;
	visibility: string[];
}

export interface PresetLayer {
	shSourceType: string;
	shapeType: string;
	name: string;
	active: boolean;
	preset: boolean;
	urls: string[];
}

export type LayerExportFormat = 'geojson' | 'shapefile';
