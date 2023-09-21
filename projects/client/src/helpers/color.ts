import { hashCode } from './hash';

/**
 * @example
 * 	numberToHex(255) => '#0000FF'
 */
export function numberToHex(color: number) {
	return `#${(color % 256 ** 3).toString(16).padStart(6, '0')}`.toUpperCase();
}

/**
 * @example
 * 	hexToNumber('#0000FF') => 255
 */
export function hexToNumber(color: string) {
	return parseInt(color.slice(1), 16);
}

export function getRandomRGBColor() {
	const o = Math.round;
	const r = Math.random;
	const s = 255;

	return [o(r() * s), o(r() * s), o(r() * s)];
}

export const getHexColorForString = (key: string) => {
	return numberToHex(Math.abs(hashCode(key)));
};
