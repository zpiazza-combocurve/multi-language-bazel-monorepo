/** Spy functions for each exported function of a module */
export function getSpies<T extends object>(module: T) {
	return Object.entries(module).reduce((acc, [key, fn]) => {
		if (typeof fn === 'function') {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			acc[key] = vi.spyOn(module, key as any);
		}
		return acc;
	}, {} as { [k in keyof typeof module]: ReturnType<typeof vi.spyOn> });
}
