import { Dispatch, SetStateAction, createContext } from 'react';

export const WellsPageContext = createContext<{
	wellIds?: string[]; // optional well ids list to skip filter
	getWellIds: () => Promise<string[]>;
	selection: import('@/components/hooks/useSelection').Selection; //only root ids of the well or well collection
	nodeIdsSelection: import('@/components/hooks/useSelection').Selection; //full path of ids, e.g. wells collection -> well
	allWellCount: number | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	filters: any[];
	companyOnly: boolean;
	editingWells: boolean;
	setEditingWells: Dispatch<SetStateAction<boolean>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
}>(null as any);
