/** Form validation functions and schemas */
import { titleize } from './text';

/** @deprecated Use yup for future applications */
export const requiredValidator = (name: string) => (value) => value ? undefined : `${titleize(name)} is required`;

/** @deprecated Use yup for future applications */
export const numberValidator = (name: string) => (value) =>
	Number.isFinite(value) ? undefined : `${titleize(name)} must be a number`;
