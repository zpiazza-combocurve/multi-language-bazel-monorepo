function validatorGenerator(requiredLength) {
	return (val) => val.length === requiredLength;
}

function validationErrorMessageGenerator(requiredLength) {
	return (props) => `${props.path} must have length ${requiredLength}, got '${props.value}'`;
}

function defaultArray(length) {
	return new Array(length).fill(null);
}

function productionArray(type, size) {
	return {
		type: [type],
		default: defaultArray(size),
		validate: {
			validator: validatorGenerator(size),
			msg: validationErrorMessageGenerator(size),
		},
	};
}

module.exports = {
	productionArray,
};
