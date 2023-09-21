import { adjustDataSeriesRanges } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { Assumption } from '@/cost-model/detail-components/shared';
import { fields as template } from '@/inpt-shared/display-templates/cost-model-dialog/expenses.json';

import { models } from './__fixtures__';
import { assumptionToRows, rowsToAssumption } from './shared';

test.each(models)('rows to assumption %#', (model) => {
	const expected = rowsToAssumption(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		adjustDataSeriesRanges({ rowData: assumptionToRows(model as Assumption, template as any, []) }),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		template as any,
		[]
	);

	expect(expected.options).toEqual(model.options);
	expect(expected.econ_function).toEqual(model.econ_function);
});
