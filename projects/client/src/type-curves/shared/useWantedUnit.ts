import { useMemo } from 'react';

import { getConvertFunc } from '@/helpers/units';
import { fields as defaultUnits } from '@/inpt-shared/display-templates/units/default-units.json';

import { useHeaders } from './useHeaders';

/** @deprecated */
export function useWantedUnits(header: string): [unit: string, convertFn: (v: number) => number, loading: boolean] {
	const { getUnit } = useHeaders();

	const origUnit = getUnit(header);
	const wantedUnit = defaultUnits[header] ?? origUnit ?? '';

	const convertFn = useMemo(() => {
		if (!origUnit || !wantedUnit) {
			return (v: number) => v;
		}
		return getConvertFunc(origUnit, wantedUnit);
	}, [origUnit, wantedUnit]);

	return [wantedUnit, convertFn, false];
}
