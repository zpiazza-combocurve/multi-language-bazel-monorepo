// TODO look for alternatives in lodash and native js

export const union = <A, B>(set1: Set<A> | Array<A>, set2: Set<B> | Array<B>) => new Set<A | B>([...set1, ...set2]);

export const intersection = <A, B>(set1: Set<A>, set2: Set<B>) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	new Set<A | B>([...set1].filter((x) => set2.has(x as any)));

export const difference = <A, B>(set1: Set<A>, set2: Set<B>) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	new Set<A>([...set1].filter((x) => !set2.has(x as any)));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const isSuperset = (set: Set<any>, subset: Set<any>) => {
	let bool = true;
	subset.forEach((elem) => {
		if (!set.has(elem)) {
			bool = false;
		}
	});
	return bool;
};
