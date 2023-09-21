// same as Java's hashCode() function (https://stackoverflow.com/a/8076436/8479969)
export const hashCode = (str: string) => {
	let hash = 0;
	if (str.length === 0) {
		return hash;
	}
	for (let i = 0; i < str.length; i++) {
		const chr = str.charCodeAt(i);
		// eslint-disable-next-line no-bitwise
		hash = (hash << 5) - hash + chr;
		// eslint-disable-next-line no-bitwise
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
