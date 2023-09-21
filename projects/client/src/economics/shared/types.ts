import { ColDef } from 'ag-grid-community';

export interface Setting {
	name: string;
	columns: { key; selected_options }[];
	_id: string;
	createdAt: Date;
	createdBy: Inpt.CreatedBy;
}

export interface ColDefWithOrderIndex extends ColDef {
	orderIndex: number;
	parentHeaderName: string;
}
