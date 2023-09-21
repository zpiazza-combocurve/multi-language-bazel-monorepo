const SECONDARY_KEYS_MAP = {
	altKey: 'Alt',
	ctrlKey: 'Control',
	shiftKey: 'Shift',
};

// TODO add documentation
// TODO improve types
function bindInput(el) {
	const isMac = navigator.userAgent.includes('Mac');
	const parent = el;
	const intervals = {};
	let keyMap = {};

	const eventKeyDown = (e) => {
		e.preventDefault();

		const { key } = e;
		// Macs don't log keyups when Meta or Control are pressed, so just disable any key presses in those cases.
		if (isMac && (keyMap?.['Meta'] || keyMap?.['Control'])) {
			return;
		}
		if (!Object.values(SECONDARY_KEYS_MAP).includes(key)) {
			keyMap[key] = true;
			return;
		}

		Object.entries(SECONDARY_KEYS_MAP).forEach(([secondaryKey, value]) => {
			if (e[secondaryKey]) {
				keyMap[value] = true;
			}
		});
	};

	const eventKeyUp = (e) => {
		e.preventDefault();

		const { key } = e;
		// Mac edge case. Possible that user first pressed key, then held modifier, then released key. Just clear all
		// keys when Meta or Control are released to prevent infinite triggers.
		if (isMac && (key === 'Meta' || key === 'Control')) {
			Object.keys(keyMap).forEach((key) => (keyMap[key] = false));
		}
		if (!Object.values(SECONDARY_KEYS_MAP).includes(key)) {
			keyMap[key] = false;
			return;
		}

		Object.entries(SECONDARY_KEYS_MAP).forEach(([secondaryKey, value]) => {
			if (!e[secondaryKey]) {
				keyMap[value] = false;
			}
		});
	};

	const keyDown = (key) => keyMap[key];

	const keysDownArr = (arr) => {
		if (!arr?.length) {
			return false;
		}

		for (let i = 0; i < arr.length; i++) {
			if (!keyDown(arr[i])) {
				return false;
			}
		}
		return true;
	};

	const keysDownArgs = (...args) => keysDownArr(args);

	const clear = () => {
		keyMap = {};
	};

	const watchLoop = (keys, callback) => {
		return () => {
			if (keysDownArr(keys)) {
				callback();
			}
		};
	};

	const watch = ({ name, callback, keys, time = 50 }) => {
		intervals[name] = setInterval(watchLoop(keys, callback), time);
	};

	const unwatch = (name) => {
		clearInterval(intervals[name]);
		delete intervals[name];
	};

	const unwatchAll = () => {
		Object.keys(intervals).forEach((key) => {
			clearInterval(intervals[key]);
			delete intervals[key];
		});
	};

	const detach = () => {
		parent.removeEventListener('keyup', eventKeyUp);
		parent.removeEventListener('keydown', eventKeyDown);
	};

	const attach = () => {
		parent.addEventListener('keyup', eventKeyUp);
		parent.addEventListener('keydown', eventKeyDown);
	};

	function bind() {
		attach();
		return {
			clear,
			detach,
			getParent: () => parent,
			keyDown,
			keysDown: keysDownArgs,
			unwatch,
			unwatchAll,
			watch,
		};
	}

	return bind();
}

export default bindInput;
