export interface FilterTypeProps {
	inputName: string;
	exclude?: boolean;
	showNull: boolean;
	neverNull?: boolean;
	inputKey: string;
	projectHeader: boolean;
	onChange: (newValue, key) => void;
	removeHeaderType: (key: string, projectHeader: boolean) => void;
}
