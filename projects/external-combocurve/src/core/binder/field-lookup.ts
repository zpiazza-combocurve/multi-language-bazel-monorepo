import { camelToPascal, camelToSnake, NamingTypes } from '../common';

function hasFlag(configFlag: NamingTypes, testingFlag: NamingTypes): boolean {
	return (testingFlag & configFlag) === testingFlag;
}

export function sourceFieldLookup(
	source: Record<string, unknown>,
	fieldName: string,
	nameConfig: NamingTypes,
): { name: string; value: unknown } | undefined {
	if (fieldName in source) {
		return { name: fieldName, value: source[fieldName] };
	}

	if (hasFlag(nameConfig, NamingTypes.PascalCase)) {
		const pascalPropName = camelToPascal(fieldName);

		if (pascalPropName in source) {
			return { name: pascalPropName, value: source[pascalPropName] };
		}
	}

	if (hasFlag(nameConfig, NamingTypes.SnakeCase)) {
		const snakePropName = camelToSnake(fieldName);

		if (snakePropName in source) {
			return { name: snakePropName, value: source[snakePropName] };
		}
	}
}

export function containsField(allowedFields: string[], fieldName: string, nameConfig: NamingTypes): boolean {
	for (const field of allowedFields) {
		if (field === fieldName) {
			return true;
		}

		if (hasFlag(nameConfig, NamingTypes.PascalCase)) {
			const pascalPropName = camelToPascal(field);
			if (pascalPropName === fieldName) {
				return true;
			}
		}

		if (hasFlag(nameConfig, NamingTypes.SnakeCase)) {
			const snakePropName = camelToSnake(field);
			if (snakePropName === fieldName) {
				return true;
			}
		}
	}

	return false;
}
