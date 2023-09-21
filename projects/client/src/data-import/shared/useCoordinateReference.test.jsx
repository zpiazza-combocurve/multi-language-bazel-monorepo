import { renderHook } from '@testing-library/react-hooks';

import { COORDINATE_REFERENCE_SYSTEMS } from './coordinateSystems';
import { useCoordinateReference } from './useCoordinateReference';

const mockSetState = vi.fn();

vi.mock('react', async () => ({
	...(await vi.importActual('react')),
	useState: vi.fn((useState) => [useState, mockSetState]),
}));

describe('useCoordinateReference', () => {
	describe('when useCoordinateReference hook has been initialized', () => {
		it('coordinate reference state equals COORDINATE_REFERENCE_SYSTEMS[0] - WGS84', () => {
			const { coordinateReferenceSystem } = renderHook(useCoordinateReference).result.current;
			expect(coordinateReferenceSystem).toEqual(COORDINATE_REFERENCE_SYSTEMS[0]);
		});
	});

	describe('when setCoordinateReferenceSystem is called with COORDINATE_REFERENCE_SYSTEMS[1] - NAD27', () => {
		it('changes coordinate reference state to COORDINATE_REFERENCE_SYSTEMS[1] - NAD27', () => {
			const { setCoordinateReferenceSystem } = renderHook(useCoordinateReference).result.current;

			setCoordinateReferenceSystem(COORDINATE_REFERENCE_SYSTEMS[1]);
			expect(mockSetState).toHaveBeenCalledWith(COORDINATE_REFERENCE_SYSTEMS[1]);
		});
	});
});
