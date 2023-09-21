import { NodeType } from '../types';

export enum NodeDialogMode {
	node = 'node',
	model = 'model',
}
export interface FormValues {
	mode: NodeDialogMode;
	nodeModelName: string;
	nodeModelDescription: string;
	name: string;
	description: string;
	type: NodeType;
}
