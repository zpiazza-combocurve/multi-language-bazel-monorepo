import { fields as WELL_HEADERS_UNITS } from '@/inpt-shared/display-templates/wells/well_header_units.json';

import { withUnits } from './shared';

const mockWellHeaders = [
	{ key: 'well_name', name: 'Well Name', width: 120 },
	{ key: 'well_number', name: 'Well Number', width: 120 },
	{ key: 'api14', name: 'API 14', width: 120 },
	{ key: 'hz_well_spacing_any_zone', name: 'Hz Well Spacing Any Zone', width: 120 },
	{ key: 'hz_well_spacing_same_zone', name: 'Hz Well Spacing Same Zone', width: 120 },
	{ key: 'vt_well_spacing_any_zone', name: 'Vt Well Spacing Any Zone', width: 120 },
	{ key: 'vt_well_spacing_same_zone', name: 'Vt Well Spacing Same Zone', width: 120 },
	{ key: 'closest_well_any_zone', name: 'Closest Well ID Any Zone', width: 120 },
	{ key: 'closest_well_same_zone', name: 'Closest Well ID Same Zone', width: 120 },
];

describe('Add units', () => {
	it('should add the unit if it exists for the field', () => {
		const wellHeadersWithUnits = withUnits(mockWellHeaders, WELL_HEADERS_UNITS);

		expect(wellHeadersWithUnits[3].name).toBe('Hz Well Spacing Any Zone (FT)');
		expect(wellHeadersWithUnits[4].name).toBe('Hz Well Spacing Same Zone (FT)');
		expect(wellHeadersWithUnits[5].name).toBe('Vt Well Spacing Any Zone (FT)');
		expect(wellHeadersWithUnits[6].name).toBe('Vt Well Spacing Same Zone (FT)');
	});

	it('should keep the original value if the unit does not exist for the field', () => {
		const wellHeadersWithUnits = withUnits(mockWellHeaders, WELL_HEADERS_UNITS);

		expect(wellHeadersWithUnits[0].name).toBe('Well Name');
		expect(wellHeadersWithUnits[1].name).toBe('Well Number');
		expect(wellHeadersWithUnits[7].name).toBe('Closest Well ID Any Zone');
		expect(wellHeadersWithUnits[8].name).toBe('Closest Well ID Same Zone');
	});
});
