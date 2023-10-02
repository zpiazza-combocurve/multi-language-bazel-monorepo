import { IWell } from '@src/models/wells';

import { getWellSelectedIdValue, SELECTED_ID_KEY, SelectedIdKey } from './fields';
import { validateWellsSelectedId } from './validation';

import { createWellsPayload } from '@test/helpers/data-generator';
import { randomizer } from '@test/helpers/randomizer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setSelectedId(well: IWell, selectedIdKey: SelectedIdKey, value: any) {
	if (selectedIdKey == 'well_name_well_number') {
		well['well_name'] = value;
		well['well_number'] = value;
	} else {
		well[selectedIdKey] = value;
	}
}

function getWellsWithSelectedId(count: number, selectedIdKey: SelectedIdKey): IWell[] {
	const wells = createWellsPayload(count) as unknown as IWell[];

	for (let i = 0; i < wells.length; i++) {
		setSelectedId(wells[i], selectedIdKey, randomizer(10, 9)() + i.toString());
	}

	return wells;
}

describe('v1/projects/:projectId/forecasts/:forecastId/aries/validation', () => {
	// eslint-disable-next-line jest/expect-expect
	test('validateWellsSelectedId does not throw error when all wells have selectedId', async () => {
		SELECTED_ID_KEY.forEach((selectedId) => {
			const wells = getWellsWithSelectedId(10, selectedId);

			validateWellsSelectedId(wells, selectedId);
		});
	});

	test('validateWellsSelectedId throws validation error when missing selected id', async () => {
		SELECTED_ID_KEY.forEach((selectedIdKey) => {
			const wells = getWellsWithSelectedId(10, selectedIdKey);
			const expectedErrorMessage = `One or more Wells in this Forecast have missing or duplicate values for: ${selectedIdKey}`;

			setSelectedId(wells[0], selectedIdKey, undefined);

			expect(() => {
				validateWellsSelectedId(wells, selectedIdKey);
			}).toThrow(expectedErrorMessage);
		});
	});

	test('validateWellsSelectedId throws validation error when duplicate selected id', async () => {
		SELECTED_ID_KEY.forEach((selectedIdKey) => {
			const wells = getWellsWithSelectedId(10, selectedIdKey);
			const expectedErrorMessage = `One or more Wells in this Forecast have missing or duplicate values for: ${selectedIdKey}`;

			setSelectedId(wells[0], selectedIdKey, getWellSelectedIdValue(wells[1], selectedIdKey));

			expect(() => {
				validateWellsSelectedId(wells, selectedIdKey);
			}).toThrow(expectedErrorMessage);
		});
	});
});
