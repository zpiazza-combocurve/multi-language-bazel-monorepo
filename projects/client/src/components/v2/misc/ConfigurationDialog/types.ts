import { DialogLikeProps } from '@/helpers/dialog';

export interface ConfigurationDialogProps<T> extends DialogLikeProps {
	deleteConfiguration(configuration: T): void;
	getConfigurationName?(configuration: T): string;
	createConfiguration(name): void;
	updateConfiguration(configuration: T): void;
	isDefaultConfiguration(configuration: T): boolean;
	configurations?: T[];
	defaultName?: string;
	setDefaultConfiguration(configuration: T | null): void;
}

export interface ConfigurationListProps<T extends object> {
	configurations: T[] | undefined;
	deleteConfiguration(c: T): void;
	getConfigurationKey(c: T, i: number): string;
	getConfigurationName(c: T, i: number): string | JSX.Element;
	isDefaultConfiguration(c: T): boolean;
	isDeleteDisabled?(c: T, i: number): boolean | string;
	isLoading?: boolean;
	isSelected(c: T, index: number): boolean;
	isSetDefaultDisabled?(c: T, i: number): boolean | string;
	onSelect(c: T, index): void;
	setDefaultConfiguration(c: T | null): void;
}
