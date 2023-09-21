export type CustomMenuItem = {
	key?: string;
	id?: string;
	disabled?: boolean | string;
	isNew?: boolean;
	label?: string | JSX.Element;
	annotation?: string;
	icon?: unknown;
	separator?: string | boolean;
	onClick?: () => void;
};
