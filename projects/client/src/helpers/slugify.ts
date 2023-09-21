export function slugify(val: string) {
	return val.replace(/(#|_| |-|\/|%)+/g, '_');
}
