import proj4 from 'proj4';

/**
 * The 'Proj' library uses this strings called as Proj Strings to define a coordination properts
 * See more at: https://proj.org/apps/cs2cs.html#using-proj-strings
 *
 * In this case we are using pre-defined coordinates by CRS (Coordinate Reference System)
 */
const CRS_PROJ_STRINGS = {
	NAD83: '+proj=longlat +datum=NAD83 +no_defs +type=crs',
	WGS84: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
	NAD27: '+proj=longlat +datum=NAD27 +no_defs +type=crs',
};

export enum CoordinateTypes {
	NAD27 = 'NAD27',
	NAD83 = 'NAD83',
	WGS84 = 'WGS84',
}

const COORDINATE_DEFAULT_ERROR_MSG =
	'In geographic coordinate systems, latitude must ranges from -90° (south pole) to +90° (north pole), and longitude must ranges from -180° (International Date Line) to +180° (180th meridian)';

export class Coordinate {
	readonly latitude: number = 0;
	readonly longitude: number = 0;
	readonly isValid: boolean = false;
	readonly errMsg: unknown;

	constructor(latitude: number, longitude: number, format: CoordinateTypes) {
		if (latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180) {
			this.isValid = false;
			this.errMsg = COORDINATE_DEFAULT_ERROR_MSG;
			return;
		}

		try {
			switch (format) {
				case CoordinateTypes.NAD27:
					[this.longitude, this.latitude] = NAD27ToWGS84(latitude, longitude);
					this.isValid = true;
					break;
				case CoordinateTypes.NAD83:
					[this.longitude, this.latitude] = NAD83ToWGS84(latitude, longitude);
					this.isValid = true;
					break;
				case CoordinateTypes.WGS84:
					this.latitude = latitude;
					this.longitude = longitude;
					this.isValid = true;
					break;
			}
		} catch (err) {
			this.isValid = false;
			this.errMsg = err;
		}
	}
}

function NAD27ToWGS84(lat: number, lon: number): [number, number] {
	return proj4(CRS_PROJ_STRINGS.NAD27, CRS_PROJ_STRINGS.WGS84, [lon, lat]);
}

function NAD83ToWGS84(lat: number, lon: number): [number, number] {
	return proj4(CRS_PROJ_STRINGS.NAD83, CRS_PROJ_STRINGS.WGS84, [lon, lat]);
}
