import { faSortDown, faSortUp } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useState } from 'react';

export function useSingleColumnSort(defaultOrder = 'asc') {
	const [type, setType] = useState(defaultOrder);
	const toggle = useCallback(() => setType((p) => (p === 'asc' ? 'desc' : 'asc')), []);
	const icon = type === 'asc' ? faSortDown : faSortUp;
	return Object.assign([type, toggle, icon, setType], { type, toggle, icon, setType });
}
