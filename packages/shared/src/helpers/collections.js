const findChild = (root, path) => {
	const pathArray = path.split('.');
	let parent = root;
	for (let p = 0; p < pathArray.length - 1; p += 1) {
		if (parent) {
			parent = parent[pathArray[p]];
		} else {
			return { parent: null, key: null };
		}
	}
	return { parent: parent || null, key: pathArray[pathArray.length - 1] };
};

// TODO Check if it can be replaced with _.set
export function set(object, path, value) {
	const { parent, key } = findChild(object, path);
	parent[key] = value;
}
