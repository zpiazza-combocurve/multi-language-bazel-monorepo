import { isBefore, isValid as isValidDate } from 'date-fns';
import { toPath } from 'lodash';
import * as yup from 'yup';

import { parseKnownDateFormats } from '@/helpers/dates';
import { assert } from '@/helpers/utilities';

import { TimeSeriesInputCommonCriteriaOptions } from './Diagram/types';
import { formulaHasError } from './FormulaCompiler/helpers';
import { ATMOSPHERE_EMISSION_OPTIONS, CAPTURE_EMISSION_OPTIONS, START_VALUE } from './shared';

const ERROR_MESSAGES = {
	min: (min: number) => `Value must be greater than or equal to ${min}`,
	max: (max: number) => `Value must be lesser than or equal to ${max}`,
	asOf: `Must be ${START_VALUE}`,
	required: 'This field is required',
	invalidFormat: 'Invalid value',
	number: 'Expected number',
};

const testAscendingDates = (datesSchema: yup.MixedSchema, fieldName: string) =>
	datesSchema.test({
		name: 'asc',
		message: 'Date cannot be before previous value',
		test: (value, ctx) => {
			assert(ctx.from, 'expected from');
			// https://github.com/jquense/yup/pull/556
			const rows = ctx.from[1].value.rows;
			const idx = Number(toPath(ctx.path).at(-2));
			const prev = rows[idx - 1]?.[fieldName];
			if (prev == null) {
				return true;
			}

			const date = parseKnownDateFormats(value);
			if (idx === 1 && prev === START_VALUE && date instanceof Date) return true;
			const prevDate = parseKnownDateFormats(prev);
			if (!(prevDate instanceof Date) || !(date instanceof Date)) return true;

			return isBefore(prevDate, date);
		},
	});

function isDate(value: string) {
	if (value === START_VALUE) return true;
	return isValidDate(parseKnownDateFormats(value));
}

function getPeriodField(criteria: TimeSeriesInputCommonCriteriaOptions) {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return yup.string().equals(['Flat']).required();
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return testAscendingDates(
				yup.mixed().test('valid-date', ERROR_MESSAGES.invalidFormat, isDate).required(ERROR_MESSAGES.required),
				'period'
			);
		default:
			return yup.string();
	}
}

const TIME_SERIES_INPUT_TABLE_COMMON_FIELDS = {
	name: yup.string(),
	description: yup.string(),
	time_series: (extraFields) =>
		yup.object().shape({
			...extraFields,
			criteria: yup
				.string()
				.required(ERROR_MESSAGES.required)
				.oneOf(Object.values(TimeSeriesInputCommonCriteriaOptions)),
			rows: yup
				.array()
				.when('criteria', ([criteria_value], schema) =>
					schema.of(
						yup.object().shape({
							period: getPeriodField(criteria_value),
							...extraFields?.rows,
						})
					)
				)
				.min(1, 'At least one row is required'),
		}),
	consumption_rate: yup
		.number()
		.typeError(ERROR_MESSAGES.number)
		.min(0, ERROR_MESSAGES.min(0))
		.required(ERROR_MESSAGES.required),
	flowback_rate: yup
		.number()
		.typeError(ERROR_MESSAGES.number)
		.min(0, ERROR_MESSAGES.min(0))
		.required(ERROR_MESSAGES.required),
	fuel_type: yup.string().required(ERROR_MESSAGES.required),
	count: yup
		.number()
		.typeError(ERROR_MESSAGES.number)
		.min(0, ERROR_MESSAGES.min(0))
		.required(ERROR_MESSAGES.required),
	runtime: yup
		.number()
		.typeError(ERROR_MESSAGES.number)
		.min(0, ERROR_MESSAGES.min(0))
		.required(ERROR_MESSAGES.required),
	// D&C
	start_criteria: yup.string().required(),
	start_criteria_option: yup.string().nullable(),
	start_value: yup.number().nullable(),
	end_criteria: yup.string().required(),
	end_criteria_option: yup.string().nullable(),
	end_value: yup.number().nullable(),
};

// Edge schemas

export const StandardEdgeSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		rows: {
			allocation: yup.number().typeError(ERROR_MESSAGES.number).required(),
		},
	}),
});

export const FacilityEdgeSchema = yup.object().shape({
	name: yup.string().required(),
});

// Node schemas

export const FlareSchema = yup.object().shape({
	pct_flare_efficiency: yup.number().required().min(0).max(100),
	pct_flare_unlit: yup.number().required().min(0).max(100),
	fuel_hhv: yup.object().shape({
		value: yup.number().required().min(0),
		unit: yup.string().required(),
	}),
});

export const WellGroupSchema = yup.object().shape({
	wells: yup.array().of(yup.string()),
	fluid_model: yup.string().nullable(),
});

export const AtmosphereSchema = yup
	.object()
	.shape({ emission_type: yup.string().oneOf(ATMOSPHERE_EMISSION_OPTIONS.map((option) => option.value)) });
export const CaptureSchema = yup
	.object()
	.shape({ emission_type: yup.string().oneOf(CAPTURE_EMISSION_OPTIONS.map((option) => option.value)) });

export const OilTankSchema = yup.object().shape({
	oil_to_gas_ratio: yup.number().required(),
});

const getStartAndEndCriteriaBasedTimeSeriesSchema = (extraFields) =>
	yup.object().shape({
		...extraFields,
		rows: yup
			.array()
			.of(
				yup.object().shape({
					start_date_window: testAscendingDates(
						yup
							.mixed()
							.test('valid-date', ERROR_MESSAGES.invalidFormat, isDate)
							.test('as-of', ERROR_MESSAGES.asOf, (value, context) => {
								const idx = Number(toPath(context.path).at(-2));
								if (idx === 0 && value !== START_VALUE) return false;
								return true;
							})
							.required(ERROR_MESSAGES.required),
						'start_date_window'
					),
					start_criteria: yup.string().required(),
					start_criteria_option: yup.string().nullable(),
					start_value: yup.number().nullable(),
					end_criteria: yup.string().required(),
					end_criteria_option: yup.string().nullable(),
					end_value: yup.number().nullable(),
					...extraFields?.rows,
				})
			)
			.min(1, 'At least one row is required'),
	});

export const DrillingSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: getStartAndEndCriteriaBasedTimeSeriesSchema({
		fuel_type: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.fuel_type,
		rows: {
			consumption_rate: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.consumption_rate,
		},
	}),
});
export const CompletionSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: getStartAndEndCriteriaBasedTimeSeriesSchema({
		fuel_type: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.fuel_type,
		rows: {
			consumption_rate: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.consumption_rate,
		},
	}),
});

export const FlowbackSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: getStartAndEndCriteriaBasedTimeSeriesSchema({
		rows: {
			flowback_rate: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.consumption_rate,
		},
	}),
});

export const CombustionSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		fuel_type: yup.string().required(ERROR_MESSAGES.required),
		rows: {
			consumption_rate: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.consumption_rate,
		},
	}),
});

export const PneumaticDeviceSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		rows: {
			count: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.count,
			runtime: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.runtime,
			device_type: yup.string().required(ERROR_MESSAGES.required),
		},
	}),
});

export const PneumaticPumpSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		rows: {
			count: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.count,
			runtime: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.runtime,
		},
	}),
});

export const CentrifugalCompressorSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		rows: {
			count: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.count,
			runtime: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.runtime,
		},
	}),
});

export const ReciprocatingCompressorSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	time_series: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.time_series({
		rows: {
			count: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.count,
			runtime: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.runtime,
		},
	}),
});

export const EconOutputSchema = yup.object().shape({
	name: yup.string(),
	description: yup.string(),
});

export const CustomCalculationSchema = yup.object().shape({
	name: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.name,
	description: TIME_SERIES_INPUT_TABLE_COMMON_FIELDS.description,
	inputs: yup.array().of(
		yup.object().shape({
			name: yup.string().required(),
			assign: yup.boolean().required(),
			by: yup.string().required(),
		})
	),
	outputs: yup.array().of(
		yup.object().shape({
			name: yup.string().required(),
			assign: yup.boolean().required(),
			by: yup.string().required(),
			category: yup.string().required(),
		})
	),
	formula: yup.object().shape({
		simple: yup.array().of(
			yup.object().shape({
				output: yup.string().required(),
				formula: yup
					.string()
					.required(ERROR_MESSAGES.required)
					.test({
						name: 'formula',
						test(value, ctx) {
							const inputs = ctx.from?.[(ctx.from?.length || 1) - 1].value.inputs;
							const activeInputs = inputs.filter((input) => input.assign).map((input) => input.name);
							const error = formulaHasError(value, activeInputs);
							if (error === false) return true;
							return ctx.createError({
								message: typeof error === 'string' ? error : error.message,
							});
						},
					}),
			})
		),
		advanced: yup.string(),
	}),
	fluid_model: yup.string().nullable(),
	active_formula: yup.string().required(),
});

export const LiquidsUnloadingSchema = EconOutputSchema;
export const AssociatedGasSchema = EconOutputSchema;

export const FacilitySchema = yup.object().shape({
	name: yup.string(),
	description: yup.string(),
});
