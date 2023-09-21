import { useMemo } from 'react';
import * as yup from 'yup';

import { concatenateKeyCategory, toLowerCaseTransform } from '@/cost-model/detail-components/AdvancedModelView/shared';

import {
	COMPOSITIONAL_ECONOMICS_CATEGORIES,
	COMPOSITIONAL_ECONOMICS_COLUMNS,
	COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS,
	COMPOSITIONAL_ECONOMICS_KEY,
	COMPOSITIONAL_ECONOMICS_SOURCES,
} from './constants';

const ALL_COMP_ECON_CATEGORIES = Object.values(COMPOSITIONAL_ECONOMICS_CATEGORIES);

const MAX_VALUE_FOR_NUMERIC_FIELDS = 100000000;

export const MAX_KEY_CATEGORY_COUNT = COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS.reduce((acc, { key, category }) => {
	const type = concatenateKeyCategory({ key, category });
	acc[type] = (acc[type] ?? 0) + 1;
	return acc;
}, {});

const validateKeyCategoryMaxRecords = (keyCategory: string, keyCategoryCount: object) => {
	const keyCategoryMaxRecordsAllowed = MAX_KEY_CATEGORY_COUNT[keyCategory];
	const keyCategoryRecords = keyCategoryCount[keyCategory];
	const errorMessage = `This key/category pair has a ${keyCategoryMaxRecordsAllowed} record limit.`;

	return keyCategoryRecords > keyCategoryMaxRecordsAllowed ? errorMessage : null;
};

const getCompositionalEconomicsRowSchema = () =>
	yup.object({
		key: yup
			.mixed()
			.when(['isELTRow', '$keyCategoryCount'], ([isELTRow, keyCategoryCount], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				return schema
					.required()
					.transform(toLowerCaseTransform([COMPOSITIONAL_ECONOMICS_KEY]))
					.oneOf([COMPOSITIONAL_ECONOMICS_KEY])
					.test('key-test', (key: string, testContext: yup.TestContext) => {
						const { parent: rowData } = testContext;

						const rowKeyCategory = concatenateKeyCategory({ key, category: rowData.category });

						const errorMessage = validateKeyCategoryMaxRecords(rowKeyCategory, keyCategoryCount);
						if (errorMessage) return testContext.createError({ message: errorMessage });

						return true;
					});
			})
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.key.label),
		category: yup
			.mixed()
			.required()
			.transform(toLowerCaseTransform(ALL_COMP_ECON_CATEGORIES))
			.oneOf(ALL_COMP_ECON_CATEGORIES)
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.category.label),
		source: yup
			.mixed()
			.required()
			.transform(toLowerCaseTransform(Object.values(COMPOSITIONAL_ECONOMICS_SOURCES)))
			.when(['category'], ([category], schema) => {
				if (category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING) {
					return schema.oneOf([COMPOSITIONAL_ECONOMICS_SOURCES.MANUAL]);
				}

				return schema.oneOf(Object.values(COMPOSITIONAL_ECONOMICS_SOURCES));
			})
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.source.label),
		value: yup
			.number()
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.required()
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.value.label),
		molPercentage: yup
			.number()
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.required()
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.molPercentage.label),
		molFactor: yup
			.number()
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.when(['category'], ([category], schema) => {
				if (category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING) {
					return schema.omitted('${path} cannot be used for Remaining category');
				}

				return schema.required();
			})
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.molFactor.label),
		plantEfficiency: yup
			.number()
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.when(['category'], ([category], schema) => {
				if (category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING) {
					return schema.omitted('${path} cannot be used for Remaining category');
				}

				return schema.required();
			})
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.plantEfficiency.label),
		btu: yup
			.number()
			.min(0)
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.required()
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.btu.label),
		shrink: yup
			.number()
			.min(0)
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.shrink.label),
		postExtraction: yup
			.number()
			.max(MAX_VALUE_FOR_NUMERIC_FIELDS)
			.label(COMPOSITIONAL_ECONOMICS_COLUMNS.postExtraction.label),
	});

export function useTemplate() {
	const compositionalEconomicsRowSchema = useMemo(() => getCompositionalEconomicsRowSchema(), []);

	return { compositionalEconomicsRowSchema };
}
