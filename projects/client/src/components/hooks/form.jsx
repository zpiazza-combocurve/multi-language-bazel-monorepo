import { mapValues } from 'lodash-es';
import { useState } from 'react';

function assert(message, condition) {
	if (!condition) {
		throw new Error(message);
	}
}

function createHandleChange(setValue, onChange) {
	return (event) => {
		const value = event && typeof event === 'object' && event.target ? event.target.value : event;
		setValue(value);
		if (onChange) {
			onChange(event);
		}
	};
}

function createField(name, value, setValue, props = {}) {
	return {
		...props,
		name,
		value,
		onChange: createHandleChange(setValue, props.onChange),
	};
}

function createArrayField(name, value, setValue, props = {}) {
	const createSetValue = (index) => (newElement) => {
		const newArray = [...value];
		newArray[index] = newElement;
		setValue(newArray);
	};
	const fields = value.map((element, index) => {
		const subName = `${name}[${index}]`;
		const subSetValue = createSetValue(index);
		if (Array.isArray(element)) {
			return createArrayField(subName, element, subSetValue, props);
		}
		if (element && typeof element === 'object') {
			// eslint-disable-next-line no-use-before-define
			return createObjectField(subName, element, subSetValue, props);
		}
		return createField(subName, element, subSetValue, props);
	});

	return {
		fields,

		name,
		value,
		onChange: setValue,
	};
}

function createObjectField(name, value, setValue, props = {}) {
	const createSetValue = (key) => (newValue) => setValue({ ...value, [key]: newValue });

	const fields = mapValues(value, (subValue, key) => {
		const subName = `${name}.${key}`;
		const subSetValue = createSetValue(key);

		if (Array.isArray(subValue)) {
			return createArrayField(subName, subValue, subSetValue, props);
		}
		if (subValue && typeof subValue === 'object') {
			return createObjectField(subName, subValue, subSetValue, props);
		}
		return createField(subName, subValue, subSetValue, props);
	});

	return {
		fields,

		name,
		value,
		onChange: setValue,
	};
}

/**
 * @deprecated Use other form wrappers out there see components/v2/react-hook-form-fields or components/v2/form-fields
 *   or components/formik-helpers
 */
export function useField(name, initialValue = '', props = {}) {
	const [value, setValue] = useState(initialValue);
	// in the future consider using useCallback here for handleChange

	assert(`${useField.name}: 'name' argument is required`, name);
	assert(
		`${useField.name}: 'initialValue' argument has to be of primitive type, received Array`,
		!Array.isArray(initialValue)
	);
	assert(
		`${useField.name}: 'initialValue' argument has to be of primitive type, received Object`,
		!(initialValue && typeof initialValue === 'object')
	);
	return createField(name, value, setValue, props);
}

/**
 * @deprecated Use other form wrappers out there see components/v2/react-hook-form-fields or components/v2/form-fields
 *   or components/formik-helpers
 */
export function useObjectField(name, initialValue = {}, props = {}) {
	const [object, setObject] = useState(initialValue);

	assert(`${useObjectField.name}: 'name' argument is required`, name);
	assert(
		`${useObjectField.name}: 'initialValue' argument is expected to be of type Object`,
		typeof initialValue === 'object'
	);

	return createObjectField(name, object, setObject, props);
}

/**
 * @deprecated Use other form wrappers out there see components/v2/react-hook-form-fields or components/v2/form-fields
 *   or components/formik-helpers
 */
export function getFormValue(...fields) {
	return fields.reduce((accumulator, field) => ({ ...accumulator, [field.name]: field.value }), {});
}
