import { RequestStructureError, RequiredFieldError, ValidationError } from '@src/helpers/validation';
import { CoordinateTypes } from '@src/value-objs/cordinate';
import { notNil } from '@src/helpers/typing';

import { IDirectionalSurveyID, IDirectionalSurveyMeasures, IWellDependency } from '../models/requests';
import { MultipleValidationError } from '../../multi-error';
import { Sources } from '../models/enums';

const COORDINATE_DEFAULT_ERROR_MSG =
	'In geographic coordinate systems, latitude must ranges from -90° (south pole) to +90° (north pole), and longitude must ranges from -180° (International Date Line) to +180° (180th meridian)';

/**
 * Check if all of arrays fields contains elements AND have the same length
 */
export const arraysNotEmptyAndSameLenght = (input: IDirectionalSurveyMeasures, fieldPrefix: string): void => {
	let errors: ValidationError[] = [];

	const requiredLength = input.measuredDepth?.length;
	if (requiredLength === 0) {
		errors.push(new RequiredFieldError(`The measures must not be empty`, fieldPrefix));
	}

	errors = errors.concat(
		Object.entries(input)
			.map((keyValue) => {
				const [key, value] = keyValue;
				if (Array.isArray(value) && value?.length !== requiredLength) {
					return new RequestStructureError(
						`The mesures '${fieldPrefix}${key}' must have the same lengh of measureDepth.`,
						fieldPrefix,
					);
				}
			})
			.filter(notNil),
	);

	throw new MultipleValidationError(errors);
};

/**
 * Checks all of required fields
 */
export const requiredFields = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	input: any,
	fieldPrefix: string,
	requiredFields: string[],
): void => {
	const actual = Object.entries(input);
	throw new MultipleValidationError(
		requiredFields
			.map((field) => {
				const index = actual.findIndex((f) => f[0] === field);
				if (index === -1 || !actual[index][1]) {
					return new RequiredFieldError(`The field '${fieldPrefix}${field}' is required`, fieldPrefix);
				}
			})
			.filter(notNil),
	);
};

/**
 * Check if arrays mentioned on 'positiveFields' contains ONLY positive values
 */
export const positiveValuesOnly = (
	input: IDirectionalSurveyMeasures,
	fieldPrefix: string,
	positiveFields: string[],
): void => {
	throw new MultipleValidationError(
		Object.entries(input)
			.map((keyValue) => {
				const [key, value] = keyValue;
				if (Array.isArray(value) && positiveFields.includes(key) && value.some((s) => s < 0)) {
					return new RequestStructureError(
						`The field '${fieldPrefix}${key}' must contains only positive values.`,
					);
				}
			})
			.filter(notNil),
	);
};

/**
 * Check if the field data source has a valid value.
 * Valid Values: DI,Aries,IHS,Enverus,Internal,PDWin,Other
 */
export const dataSourceShouldBeValid = (dataSource: string): void => {
	if (Object.values(Sources).every((s) => s !== dataSource)) {
		throw new RequestStructureError(
			`The 'dataSource' must have a valid value. The valid values are: ${Object.values(Sources)}`,
			'dataSource',
		);
	}
};

/**
 * Checks if the field SpatialDataType has a valid value
 * Valid Values: NAD27,NAD84,WGS84
 */
export const spatialTypeShouldBeValid = (spatialDataType: string, prefix: string): void => {
	if (Object.values(CoordinateTypes).every((s) => s !== spatialDataType)) {
		throw new RequestStructureError(
			`The '${prefix}spatialDataType' must have a valid value. The valid values are: ${Object.values(
				CoordinateTypes,
			)}`,
			'spatialDataType',
		);
	}
};

/**
 * Checks if all of coordinates are valid and can be convert to WGS84
 */
export const coordinatesShouldBeValid = (input: IDirectionalSurveyMeasures): void => {
	if (input.latitude?.length !== input.longitude?.length) {
		return;
	}

	const [lat, log] = [input.latitude, input.longitude];

	throw new MultipleValidationError(
		input.latitude
			.map((_, i) => {
				if (lat[i] > 90 || lat[i] < -90 || log[i] > 180 || log[i] < -180) {
					return new RequestStructureError(
						`The coordinates: [${lat[i]},${log[i]}] are not valid. ${COORDINATE_DEFAULT_ERROR_MSG}`,
						`coordinates[${i}]`,
					);
				}
			})
			.filter(notNil),
	);
};

/** Check if the inclination values are less than 180 */
export const inclinationShouldBeValid = (input: IDirectionalSurveyMeasures, prefix: string): void => {
	if (input.inclination.some((s) => s > 180)) {
		throw new RequestStructureError(
			`The field ${prefix}inclination has values bigger than 180. Inclination values should be less than 180.`,
			`${prefix}inclination`,
		);
	}
};

/** Check if exists only one well for the specified directional survey */
export const shouldHaveOnlyOneWell = (input: IWellDependency & IDirectionalSurveyID): void => {
	if (input.wellCount === 0) {
		throw new ValidationError(
			`There is no well identified by this chosenID (${input.chosenID}) and projectID (${
				input.projectID || 'not-defined'
			})`,
		);
	}

	if (input.wellCount > 1) {
		throw new ValidationError(
			`Has more than one well identified by this chosenID (${input.chosenID}) and projectID (${
				input.projectID || 'not-defined'
			})`,
		);
	}
};
