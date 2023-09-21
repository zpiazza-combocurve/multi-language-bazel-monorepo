import { AnyObjectSchema, Schema, ValidationError, addMethod, string } from 'yup';
import * as yup from 'yup';

import { hasNonWhitespace } from './text';

/**
 * @returns Yup validation errors
 * @see https://github.com/jquense/yup/issues/44
 */
export function getObjectSchemaValidationErrors<K extends string>(
	schema: Schema,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: Record<K, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	validateSyncOptions?: any
): Record<K, string> | null {
	const validationErrors = {} as Record<K, string>;

	try {
		schema.validateSync(data, { abortEarly: false, ...validateSyncOptions });
	} catch (err) {
		if (!ValidationError.isError(err)) {
			throw err;
		}

		err.inner.forEach((error) => {
			if (error.path) {
				validationErrors[error.path] = error.message;
			}
		});
		return validationErrors;
	}
	return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function getErrorAtPath(schema: AnyObjectSchema, data: Record<string, any>, path: string) {
	try {
		schema.validateSyncAt(path, data);
		return undefined;
	} catch (err) {
		if (!ValidationError.isError(err)) {
			throw err;
		}
		return err.message;
	}
}

declare module 'yup' {
	interface Schema {
		omitted(message?: string, isTestIgnored?: boolean): this;
		hasNonWhitespace(message?: string): this;
	}
}

yup.setLocale({
	mixed: {
		notType: ({ path, type }) =>
			type === 'mixed' ? `${path} must match the configured type.` : `${path} must be a valid ${type}`,
	},
});

addMethod(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	Schema as any as () => Schema, // TODO find out how to avoid casting to any
	'omitted',
	function (this: Schema, message = '${path} should be omitted', isTestIgnored) {
		return this.nullable().test({
			message,
			name: 'omitted',
			// This test shouldn't be deleted, cause cell could be came omitted from state where it had value previously
			// isTestIgnored condition is dedicated solely for scenarios when validation returns true
			// no matter what the value is.
			test: (v) => {
				if (isTestIgnored) {
					return true;
				}
				return v == null || v === '';
			},
		});
	}
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
addMethod(string as any, 'hasNonWhitespace', function (this: Schema, message = 'This field cannot be blank.') {
	return this.test({
		message,
		name: 'hasNonWhitespace',
		test: (v) => hasNonWhitespace(v),
	});
});

export default yup;
