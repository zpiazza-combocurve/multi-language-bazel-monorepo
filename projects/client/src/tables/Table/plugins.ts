export function getRecords<T, K extends string>(arrayOrRecords: Record<K, T> | T[], key: keyof T): Record<K, T> {
	if (Array.isArray(arrayOrRecords)) {
		return arrayOrRecords.reduce((acc, { [key]: id, ...values }) => {
			acc[id as K] = { id, ...values } as T;
			return acc;
		}, {} as Record<K, T>);
	}
	return arrayOrRecords;
}

export const LOADING_KEY = '__inpt_loading';
