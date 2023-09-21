import * as yup from 'yup';

import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';

import { LT_CELL_PLACEHOLDER_VALUES } from './constants';

export const getEltColumnValidation = (elts: ModuleListEmbeddedLookupTableItem[]) => ({
	eltName: yup
		.string()
		.when(['isELTRow', '$eltsCount'], ([isELTRow, eltsCount], schema) => {
			if (isELTRow) {
				return schema
					.required()
					.meta({
						template: { menuItems: elts.map((elt) => ({ label: elt.name, value: elt._id })) },
					})
					.oneOf(elts.map((elt) => elt.name))
					.test('unique-elt', 'Lookup Table already assigned', (eltName, testContext) => {
						if (eltsCount[eltName] > 1) {
							return testContext.createError({ message: 'Lookup Table already assigned' });
						}

						return true;
					});
			}

			return schema.omitted('${path} cannot be used for this row');
		})
		.label('Embedded Lookup Table'),
});

export const getELTLineCellPlaceholderSchema = (schema) =>
	schema
		.transform((typedValue, value) => {
			return LT_CELL_PLACEHOLDER_VALUES.includes(value) ? null : typedValue;
		})
		.nullable();
