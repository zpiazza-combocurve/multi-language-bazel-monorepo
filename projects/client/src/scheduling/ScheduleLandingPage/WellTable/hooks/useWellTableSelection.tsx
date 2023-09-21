import { createContext, useContext, useMemo } from 'react';

import { useSelection } from '@/components/hooks';

export const WellTableSelectionContext = createContext({} as { selection: ReturnType<typeof useSelection> });

export const SelectionProvider = ({ children, ids }) => {
	const selection = useSelection(ids);

	return (
		<WellTableSelectionContext.Provider
			value={useMemo(
				() => ({
					selection,
				}),
				[selection]
			)}
		>
			{children}
		</WellTableSelectionContext.Provider>
	);
};

export function useWellTableSelection() {
	const { selection } = useContext(WellTableSelectionContext);
	return selection;
}
