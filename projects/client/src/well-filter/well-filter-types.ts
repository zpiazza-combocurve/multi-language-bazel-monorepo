import sassVars from '../global-styles/vars.scss?inline';

// null color = default color
const wellFilterTypes = {
	add: {
		color: sassVars.primary,
		label: 'Add',
	},
	remove: {
		color: sassVars.warn,
		label: 'Remove',
	},
	filter: {
		color: null,
		label: 'Filter',
	},
	select: {
		color: null,
		label: 'Select',
	},
};

export default wellFilterTypes;
