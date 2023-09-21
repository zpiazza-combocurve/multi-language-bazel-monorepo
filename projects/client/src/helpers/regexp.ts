import { escapeRegExp } from 'lodash';

export function matchText(text: string, exp: string) {
	return typeof text === 'string' && !!text.toLowerCase().match(escapeRegExp(exp.toLowerCase()));
}

export function fuzzySearch(s: string) {
	return new RegExp(Array.from(s).join('.*').replace(/ /g, ''), 'i');
}
