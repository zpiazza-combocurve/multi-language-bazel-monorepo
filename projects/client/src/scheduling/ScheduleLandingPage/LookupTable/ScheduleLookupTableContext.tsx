import { createContext, useMemo, useState } from 'react';

type Props = {
	isBuilderOpen: boolean;
	setIsBuilderOpen: (isOpen: boolean) => void;
};

export const ScheduleLookupTableContext = createContext<Props>({ isBuilderOpen: false, setIsBuilderOpen: () => ({}) });

export function ScheduleLookupTableProvider({ children }) {
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);

	return (
		<ScheduleLookupTableContext.Provider
			value={useMemo(
				() => ({
					isBuilderOpen,
					setIsBuilderOpen,
				}),
				[isBuilderOpen]
			)}
		>
			{children}
		</ScheduleLookupTableContext.Provider>
	);
}
