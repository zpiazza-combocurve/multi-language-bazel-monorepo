export type BasePropField = {
	fieldName: string;
	fieldType: string;
	helpText?: string;
	required: boolean;
	valType: string;
	placeholder?: string;
};

export interface BaseSelectionPropField extends BasePropField {
	Default: { label: string; value: string };
	menuItems: { label: string; value: string; min?: number; max?: number }[];
	placeholder: string;
}

export interface BaseNumericPropField extends BasePropField {
	Default: number;
	max: number;
	min: number;
}
