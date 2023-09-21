export interface ItemDetail {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	cellRenderer?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	cellRendererParams?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	title?: any;
	key?: string;
	id?: string;
	currentProject?: boolean;
	className?: string;
	sort?: boolean;
	canRename?: (item: Item) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onRename?: (value: string, item: Item) => Promise<any>;
	onCellClicked?: (event: CellClickedEvent) => void;
	type?: 'string' | 'number';
	minWidth?: number;
	maxWidth?: number;
	width?: number;
	flex?: number;
	tags?: Inpt.ObjectId[];
}

export type Item = {
	// are they both needed _id and id?
	_id: string;
	id?: string;
	name: string;
	details?: ItemDetail[];
	running?: boolean;
	isCurrentItem?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	project?: any;
	versionName?: string;
};

export interface FilterResult<T extends Item = Item> {
	ids: string[];
	totalItems: number;
	items: T[];
	page?: number;
	$skip?: number;
	$limit?: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export type ItemsFetcher<F, T = {}> = (filters: F) => Promise<FilterResult<T>>;
export type ItemIdsFetcher<F> = (filters: F) => Promise<string[]>;
