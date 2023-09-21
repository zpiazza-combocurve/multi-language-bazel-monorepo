// TODO export globally with appropriate name

export interface WellHeadersData {
	_id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}

export interface WellProductionData {
	_id: string;
	index: number[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}

export interface WellDirectionalSurveyData {
	_id: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	[key: string]: any;
}

export interface WellsPageBaseProps {
	wellIds?: string[];
	padded?: boolean;
	companyOnly?: boolean;
	addWellsProps?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onAdd: (existingWells: any) => Promise<void>;
		disabled?: boolean | string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		restButtonProps?: any;
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	createWellsProps?: { disabled?: boolean | string; restButtonProps?: any };
	removeWellsProps?: {
		onRemove: (selectedWells: string[], getWellIds: () => Promise<string[]>, totalWells: number) => Promise<void>;
		getTooltipTitle?: (numOfWells: string[]) => string;
		disabled?: (selectedWells: string[], totalWellsCount: number) => boolean | string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		restButtonProps?: any;
	};
	operations?: React.FC<{
		selection: Selection<string>;
		getWellIds?: () => Promise<string[]>;
	}>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	operationsProps?: Record<string, any>;
	wellsCollectionsProps?: WellsCollectionsButtonProps;
	manageWellsCollections?: boolean;
	addRemoveWellsCollectionWells?: boolean;
}
