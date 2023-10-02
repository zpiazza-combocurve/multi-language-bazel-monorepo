export const isNil = <T>(value: T | null | undefined): value is null | undefined =>
	value === null || value === undefined;

export const notNil = <T>(value: T | null | undefined): value is T => !isNil(value);

export const isOneOf = <T extends string>(value: string, choices: readonly T[]): value is T =>
	choices.includes(value as T);

export const removeNilProperties = <T>(value: T): T => {
	if (!isNil(value)) {
		for (const key in value) {
			if (isNil(value[key])) {
				delete value[key];
			}
		}
	}

	return value;
};
