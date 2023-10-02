/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import { ValidationError } from '@src/helpers/validation';

import { CreateDSRequest, IDataSource, IDirectionalSurveyMeasures, ISpatialData } from '../models/requests';
import { MultipleValidationError } from '../../multi-error';

import {
	arraysNotEmptyAndSameLenght,
	coordinatesShouldBeValid,
	dataSourceShouldBeValid,
	inclinationShouldBeValid,
	positiveValuesOnly,
	requiredFields,
	shouldHaveOnlyOneWell,
	spatialTypeShouldBeValid,
} from './core';
import { commonPositiveArrays, createRequiredProperties } from './requests';

const createValidPayload = (): CreateDSRequest => {
	return {
		wellCount: 1,
		chosenID: 'choseID_test',
		dataSource: 'Aries',
		projectID: 'projectID_test',
		spatialDataType: 'WGS84',
		measuredDepth: [1, 2, 3, 4],
		trueVerticalDepth: [1, 2, 3, 4],
		azimuth: [1, 2, 3, 4],
		inclination: [1, 2, 3, 4],
		deviationEW: [1, 2, 3, 4],
		deviationNS: [1, 2, 3, 4],
		latitude: [1, 2, 3, 4],
		longitude: [1, 2, 3, 4],
	};
};

function baseTest<T>(validModel: T, changePayloadFN: (a: T) => void, validationFN: (a: T) => void, isValid: boolean) {
	changePayloadFN(validModel);

	try {
		validationFN(validModel);
	} catch (e) {
		if (e instanceof MultipleValidationError) {
			if (isValid && e.details.errors?.length !== 0) {
				expect('Should be valid').toEqual('but contains errors');
			}
		} else if (e instanceof ValidationError) {
			if (isValid) {
				expect('Should be valid').toEqual('but contains errors');
			}
		} else {
			expect('Should be valid').toEqual('but contains errors');
		}
	}
}

describe('arraysNotEmptyAndSameLenght validation', () => {
	const testFn = (input: IDirectionalSurveyMeasures) => {
		arraysNotEmptyAndSameLenght(input, '');
	};

	const expectArrayValidation = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, testFn, false);
	};

	it('Valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, testFn, true);
	});

	it('trueverticalDepth should have the same lengh', () => {
		expectArrayValidation((i) => (i.trueVerticalDepth = [1, 2]));
	});

	it('azimuth should have the same lengh', () => {
		expectArrayValidation((i) => (i.azimuth = [1, 2]));
	});

	it('inclination should have the same lengh', () => {
		expectArrayValidation((i) => (i.inclination = [1, 2]));
	});

	it('deviationew should have the same lengh', () => {
		expectArrayValidation((i) => (i.deviationEW = [1, 2]));
	});

	it('deviationns should have the same lengh', () => {
		expectArrayValidation((i) => (i.deviationNS = [1, 2]));
	});

	it('latitude should have the same lengh', () => {
		expectArrayValidation((i) => (i.latitude = [1, 2]));
	});

	it('longitude should have the same lengh', () => {
		expectArrayValidation((i) => (i.longitude = [1, 2]));
	});
});

describe('requiredFields validation', () => {
	const testFn = (input: IDirectionalSurveyMeasures) => {
		requiredFields(input, '', createRequiredProperties);
	};

	it('Valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, testFn, true);
	});

	const expectRequiredValidation = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, testFn, false);
	};

	it('choseID should not be empty', () => {
		expectRequiredValidation((i) => (i.chosenID = ''));
	});

	it('dataSource should not be empty', () => {
		expectRequiredValidation((i) => (i.dataSource = ''));
	});

	it('spatialDataType should not be empty', () => {
		expectRequiredValidation((i) => (i.spatialDataType = ''));
	});
});

describe('positiveValuesOnly validation', () => {
	const testFn = (input: IDirectionalSurveyMeasures) => {
		positiveValuesOnly(input, '', commonPositiveArrays);
	};

	it('Valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, testFn, true);
	});

	const expectArrayValidation = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, testFn, false);
	};

	it('measuredDepth should contains only positive values', () => {
		expectArrayValidation((i) => (i.inclination = [-1, 2]));
	});

	it('trueverticalDepth should contains only positive values', () => {
		expectArrayValidation((i) => (i.trueVerticalDepth = [1, -2]));
	});

	it('azimuth should contains only positive values', () => {
		expectArrayValidation((i) => (i.azimuth = [1, 2, -3]));
	});

	it('inclination should contains only positive values', () => {
		expectArrayValidation((i) => (i.inclination = [-31352465]));
	});
});

describe('dataSourceShouldBeValid validation', () => {
	const testFn = (input: IDataSource) => {
		dataSourceShouldBeValid(input.dataSource);
	};

	it('Not allowed should be invalid', () => {
		baseTest(createValidPayload(), (i) => (i.dataSource = ''), testFn, false);
		baseTest(createValidPayload(), (i) => (i.dataSource = 'asd'), testFn, false);
		baseTest(createValidPayload(), (i) => (i.dataSource = 'xablau'), testFn, false);
	});

	const expectDSValid = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, testFn, true);
	};

	it('DI value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'DI'));
	});

	it('Aries value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'Aries'));
	});

	it('IHS value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'IHS'));
	});

	it('Enverus value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'Enverus'));
	});

	it('Internal value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'Internal'));
	});

	it('PDWin value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'PDWin'));
	});

	it('Other value should be valid', () => {
		expectDSValid((i) => (i.dataSource = 'Other'));
	});
});

describe('spatialTypeShouldBeValid validation', () => {
	const testFn = (input: ISpatialData) => {
		spatialTypeShouldBeValid(input.spatialDataType, ',');
	};

	it('Not allowed should be invalid', () => {
		baseTest(createValidPayload(), (i) => (i.spatialDataType = ''), testFn, false);
		baseTest(createValidPayload(), (i) => (i.spatialDataType = 'asd'), testFn, false);
		baseTest(createValidPayload(), (i) => (i.spatialDataType = 'xablau'), testFn, false);
	});

	const expectSpatialValid = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, testFn, true);
	};

	it('NAD27 value should be valid', () => {
		expectSpatialValid((i) => (i.spatialDataType = 'NAD27'));
	});

	it('NAD84 value should be valid', () => {
		expectSpatialValid((i) => (i.spatialDataType = 'NAD83'));
	});

	it('WGS84 value should be valid', () => {
		expectSpatialValid((i) => (i.spatialDataType = 'WGS84'));
	});
});

describe('coordinatesShouldBeValid validation', () => {
	it('Valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, coordinatesShouldBeValid, true);
	});

	const expectArrayValidation = (changePayloadFN: (a: CreateDSRequest) => void) => {
		baseTest(createValidPayload(), changePayloadFN, coordinatesShouldBeValid, false);
	};

	it('latitude should be valid', () => {
		expectArrayValidation((i) => {
			i.latitude = [91];
			i.longitude = [115];
		});
	});

	it('longitude should be valid', () => {
		expectArrayValidation((i) => {
			i.latitude = [81];
			i.longitude = [-190];
		});
	});
});

describe('inclinationShouldBeValid validation', () => {
	const testFn = (input: IDirectionalSurveyMeasures) => {
		inclinationShouldBeValid(input, ',');
	};

	it('valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, testFn, true);
	});

	it('values bigger than 180 should be invalid', () => {
		baseTest(createValidPayload(), (i) => (i.inclination = [190]), testFn, false);
	});
});

describe('shouldHaveOnlyOneWell validation', () => {
	it('valid input should be valid', () => {
		baseTest(createValidPayload(), (i) => i, shouldHaveOnlyOneWell, true);
	});

	it('none wells should be invalid', () => {
		baseTest(createValidPayload(), (i) => (i.wellCount = 0), shouldHaveOnlyOneWell, false);
	});

	it('multiples wells should be invalid', () => {
		baseTest(createValidPayload(), (i) => (i.wellCount = 2), shouldHaveOnlyOneWell, false);
	});
});
