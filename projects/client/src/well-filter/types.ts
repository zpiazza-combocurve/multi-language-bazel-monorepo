type WellFilterConfirmFn = (wellCount: number, wellPerfromanceThreshold?: number) => Promise<boolean>;

export type WellFilterDialogProps = {
	limit?: number;
	type?: 'add' | 'remove' | 'filter';
	returnFilters?: boolean;
	confirm?: WellFilterConfirmFn;
	wellsPerformanceThreshold?: number;
	existingWells?: string[];
	/** Text to show to display total count */
	totalWells?: string;
	totalWellsText?: string; // NOTE this property is not being used at all
	wells?: string[] | 'ALL_WELLS';
	gotAllIds?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	altProject?: any;
	zIndex?: number;
	isFiltered?: boolean;
	wellHeaders?: Record<string, string>;
} & import('@/helpers/dialog').DialogProps;

export interface LightFilterWellsResponseModel {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	byHeadersQuery: any[];
	newWellsCount: number;
	startIndex: number;
	totalCount: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	viewPage: Record<string, any>[]; //filtered wells
	headers?: string[]; // TODO: not sure if needed at all, but it is used in the code of the old well filter
}
