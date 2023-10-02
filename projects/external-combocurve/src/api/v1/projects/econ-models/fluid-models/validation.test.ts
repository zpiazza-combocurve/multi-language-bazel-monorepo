import { cloneDeep, set } from 'lodash';

import { FieldNameError, RequiredFieldError, ValueError } from '@src/helpers/validation';

import { API_FLUID_MODEL_COMPOSITION } from './fields/fluid-model-composition';
import { ApiFluidModel } from './fields/fluid-model';
import { parseApiFluidModel } from './validation';

const defaultFluidModel: ApiFluidModel = {
	name: 'Test Fluid Model',
	unique: false,
	fluidModel: {
		oil: {
			composition: {
				N2: {
					percentage: 100,
				},
				CO2: {
					percentage: 2,
				},
				C1: {
					percentage: 3,
				},
				C2: {
					percentage: 4,
				},
				C3: {
					percentage: 5,
				},
				iC4: {
					percentage: 6,
				},
				nC4: {
					percentage: 7,
				},
				iC5: {
					percentage: 8,
				},
				nC5: {
					percentage: 9,
				},
				iC6: {
					percentage: 10,
				},
				nC6: {
					percentage: 11,
				},
				C7: {
					percentage: 12,
				},
				C8: {
					percentage: 13,
				},
				C9: {
					percentage: 14,
				},
				C10Plus: {
					percentage: 15,
				},
				H2S: {
					percentage: 16,
				},
				H2: {
					percentage: 17,
				},
				H2O: {
					percentage: 18,
				},
				He: {
					percentage: 19,
				},
				O2: {
					percentage: 20,
				},
			},
			criteria: 'flat',
		},
		gas: {
			composition: {
				N2: {
					percentage: 0,
				},
				CO2: {
					percentage: 0,
				},
				C1: {
					percentage: 0,
				},
				C2: {
					percentage: 0,
				},
				C3: {
					percentage: 0,
				},
				iC4: {
					percentage: 0,
				},
				nC4: {
					percentage: 0,
				},
				iC5: {
					percentage: 0,
				},
				nC5: {
					percentage: 0,
				},
				iC6: {
					percentage: 0,
				},
				nC6: {
					percentage: 0,
				},
				C7: {
					percentage: 0,
				},
				C8: {
					percentage: 0,
				},
				C9: {
					percentage: 0,
				},
				C10Plus: {
					percentage: 0,
				},
				H2S: {
					percentage: 0,
				},
				H2: {
					percentage: 0,
				},
				H2O: {
					percentage: 0,
				},
				He: {
					percentage: 0,
				},
				O2: {
					percentage: 0,
				},
			},
			criteria: 'flat',
		},
		water: {
			composition: {
				N2: {
					percentage: 0,
				},
				CO2: {
					percentage: 0,
				},
				C1: {
					percentage: 0,
				},
				C2: {
					percentage: 0,
				},
				C3: {
					percentage: 0,
				},
				iC4: {
					percentage: 0,
				},
				nC4: {
					percentage: 0,
				},
				iC5: {
					percentage: 0,
				},
				nC5: {
					percentage: 0,
				},
				iC6: {
					percentage: 0,
				},
				nC6: {
					percentage: 0,
				},
				C7: {
					percentage: 0,
				},
				C8: {
					percentage: 0,
				},
				C9: {
					percentage: 0,
				},
				C10Plus: {
					percentage: 0,
				},
				H2S: {
					percentage: 0,
				},
				H2: {
					percentage: 0,
				},
				H2O: {
					percentage: 0,
				},
				He: {
					percentage: 0,
				},
				O2: {
					percentage: 0,
				},
			},
			criteria: 'flat',
		},
		ngl: {
			composition: {
				N2: {
					percentage: 0,
				},
				CO2: {
					percentage: 0,
				},
				C1: {
					percentage: 0,
				},
				C2: {
					percentage: 0,
				},
				C3: {
					percentage: 0,
				},
				iC4: {
					percentage: 0,
				},
				nC4: {
					percentage: 0,
				},
				iC5: {
					percentage: 0,
				},
				nC5: {
					percentage: 0,
				},
				iC6: {
					percentage: 0,
				},
				nC6: {
					percentage: 0,
				},
				C7: {
					percentage: 0,
				},
				C8: {
					percentage: 0,
				},
				C9: {
					percentage: 0,
				},
				C10Plus: {
					percentage: 0,
				},
				H2S: {
					percentage: 0,
				},
				H2: {
					percentage: 0,
				},
				H2O: {
					percentage: 0,
				},
				He: {
					percentage: 0,
				},
				O2: {
					percentage: 0,
				},
			},
			criteria: 'flat',
		},
		dripCondensate: {
			composition: {
				N2: {
					percentage: 0,
				},
				CO2: {
					percentage: 0,
				},
				C1: {
					percentage: 0,
				},
				C2: {
					percentage: 0,
				},
				C3: {
					percentage: 0,
				},
				iC4: {
					percentage: 0,
				},
				nC4: {
					percentage: 0,
				},
				iC5: {
					percentage: 0,
				},
				nC5: {
					percentage: 0,
				},
				iC6: {
					percentage: 0,
				},
				nC6: {
					percentage: 0,
				},
				C7: {
					percentage: 0,
				},
				C8: {
					percentage: 0,
				},
				C9: {
					percentage: 0,
				},
				C10Plus: {
					percentage: 99,
				},
				H2S: {
					percentage: 0,
				},
				H2: {
					percentage: 0,
				},
				H2O: {
					percentage: 0,
				},
				He: {
					percentage: 0,
				},
				O2: {
					percentage: 0,
				},
			},
			criteria: 'flat',
		},
	},
};

describe('v1/projects/econ-models/fluidModels/validation.test', () => {
	describe('parseApiFluidModel', () => {
		it('parses valid input without errors', () => {
			const fluidModel = { ...defaultFluidModel };

			const result = parseApiFluidModel(fluidModel);

			expect(result).toEqual(fluidModel);
		});

		it('should throw error if base contract has extra property', () => {
			const model = cloneDeep(defaultFluidModel);

			set(model, `invalidField`, 'test');

			const expectedError = new FieldNameError('`invalidField` is not a valid field name');

			expect(() => parseApiFluidModel(model)).toThrow(expectedError);
		});

		it('should throw error if fluid model has extra property', () => {
			const model = cloneDeep(defaultFluidModel);

			set(model, `fluidModel.invalidField`, 'test');

			const expectedError = new FieldNameError('`invalidField` is not a valid field name');

			expect(() => parseApiFluidModel(model)).toThrow(expectedError);
		});
	});

	describe.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])('parseApiFluidModel', (phase: string) => {
		it.each(Object.keys(API_FLUID_MODEL_COMPOSITION))(
			`should throw error if ${phase} %s percentage is missing`,
			(component: string) => {
				const model = cloneDeep(defaultFluidModel);

				set(model, `fluidModel.${phase}.composition.${component}`, {});

				const expectedError = new RequiredFieldError(
					`Missing required field: \`fluidModel.${phase}.composition.${component}.percentage\``,
				);

				expect(() => parseApiFluidModel(model)).toThrow(expectedError);
			},
		);

		it.each(Object.keys(API_FLUID_MODEL_COMPOSITION))(
			`should throw error if ${phase} %s percentage is not a number`,
			(component: string) => {
				const model = cloneDeep(defaultFluidModel);

				set(model, `fluidModel.${phase}.composition.${component}.percentage`, 'test');

				const expectedError = new TypeError(`\`test\` is not a valid number`);

				expect(() => parseApiFluidModel(model)).toThrow(expectedError);
			},
		);

		it.each(Object.keys(API_FLUID_MODEL_COMPOSITION))(
			`should throw error if ${phase} %s percentage is less than zero`,
			(component: string) => {
				const model = cloneDeep(defaultFluidModel);

				set(model, `fluidModel.${phase}.composition.${component}.percentage`, -1);

				const expectedError = new ValueError(
					`\`fluidModel.${phase}.composition.${component}.percentage\` must be >= 0`,
				);

				expect(() => parseApiFluidModel(model)).toThrow(expectedError);
			},
		);

		it.each(Object.keys(API_FLUID_MODEL_COMPOSITION))(
			`should throw error if ${phase} %s percentage is greater than 100`,
			(component: string) => {
				const model = cloneDeep(defaultFluidModel);

				set(model, `fluidModel.${phase}.composition.${component}.percentage`, 101);

				const expectedError = new ValueError(
					`\`fluidModel.${phase}.composition.${component}.percentage\` must be <= 100`,
				);

				expect(() => parseApiFluidModel(model)).toThrow(expectedError);
			},
		);

		it.each(Object.keys(API_FLUID_MODEL_COMPOSITION))(
			`should throw error if ${phase} %s has extra property`,
			(component: string) => {
				const model = cloneDeep(defaultFluidModel);

				set(model, `fluidModel.${phase}.composition.${component}.invalidField`, true);

				const expectedError = new FieldNameError('`invalidField` is not a valid field name');

				expect(() => parseApiFluidModel(model)).toThrow(expectedError);
			},
		);

		it(`should throw error if ${phase} composition has extra property`, () => {
			const model = cloneDeep(defaultFluidModel);

			set(model, `fluidModel.${phase}.composition.invalidField`, true);

			const expectedError = new FieldNameError('`invalidField` is not a valid field name');

			expect(() => parseApiFluidModel(model)).toThrow(expectedError);
		});

		it(`should throw error if ${phase} has extra property`, () => {
			const model = cloneDeep(defaultFluidModel);

			set(model, `fluidModel.${phase}.invalidField`, true);

			const expectedError = new FieldNameError('`invalidField` is not a valid field name');

			expect(() => parseApiFluidModel(model)).toThrow(expectedError);
		});

		it(`should throw error if ${phase} criteria is not flat`, () => {
			const model = cloneDeep(defaultFluidModel);

			set(model, `fluidModel.${phase}.criteria`, 'other');

			const expectedError = new ValueError(
				`\`fluidModel.${phase}.criteria\` must be one of the following values: flat`,
			);

			expect(() => parseApiFluidModel(model)).toThrow(expectedError);
		});
	});
});
