export const count = <T>(arr: T[], condition: (elem: T) => boolean): number =>
	arr.reduce((c, elem) => (condition(elem) ? c + 1 : c), 0);
