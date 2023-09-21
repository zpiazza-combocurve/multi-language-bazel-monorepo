import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { pick } from 'lodash';
import { capitalize } from 'lodash-es';
import { useContext, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

import { FormContext } from './FormContext';

type Parent = { parent?: string };

const buildValidation = (
	validationType: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	params: Pick<Record<string, any>, 'required' | 'pattern' | 'min' | 'max'>
) => {
	switch (validationType) {
		case 'required': {
			return params[validationType] ? { type: 'required' } : undefined;
		}
		case 'min': {
			return { type: 'min-length', threshold: params[validationType] };
		}
		case 'max': {
			return { type: 'max-length', threshold: params[validationType] };
		}
	}
};
const buildKey = (name: string, parent?: string) => {
	if (parent) {
		return `${parent}.${name}`;
	}

	return name;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const buildBody = (key: string, contents: Record<string, any>, { parent }: Parent = {}) => {
	const validationContent = pick(contents, ['required', 'pattern', 'min', 'max']);
	const validate = Object.keys(validationContent)
		.map((validation) => buildValidation(validation, validationContent))
		.filter(Boolean);
	if (contents?.type === 'select') {
		return {
			component: componentTypes.SELECT,
			name: buildKey(key, parent),
			label: key,
			'data-testid': `${key}${parent ? '-' + parent : ''}`,
			validate,
			defaultValue: contents?.value,
			isMulti: contents?.multi,
			options: contents?.values?.map((el) => ({ value: el, label: el })),
			required: validate.some((validation) => validation?.type === 'required'),
		};
	}
	if (contents?.type === 'DateTime') {
		return {
			component: componentTypes.DATE_PICKER,
			name: buildKey(key, parent),
			label: key,
			'data-testid': `${key}${parent ? '-' + parent : ''}`,
			validate,
			defaultValue: contents?.value,
			required: validate.some((validation) => validation?.type === 'required'),
		};
	}

	if (contents?.type === 'textarea') {
		return {
			component: componentTypes.TEXTAREA,
			name: buildKey(key, parent),
			label: key,
			dataType: contents?.type?.toString() ?? 'string',
			'data-testid': `${key}${parent ? '-' + parent : ''}`,
			validate,
			defaultValue: contents?.value,
			required: validate.some((validation) => validation?.type === 'required'),
		};
	}

	if (contents?.type === 'custom') {
		return {
			component: 'json-component-type',
			name: buildKey(key, parent),
			label: key,
			dataType: 'string',
			'data-testid': `${key}${parent ? '-' + parent : ''}`,
			validate,
			defaultValue: contents?.value,
			required: validate.some((validation) => validation?.type === 'required'),
		};
	}

	if (contents?.type === 'boolean') {
		return {
			component: componentTypes.CHECKBOX,
			name: buildKey(key, parent),
			dataType: 'boolean',
			label: key,
			'data-testid': `${key}${parent ? '-' + parent : ''}`,
			defaultChecked: contents?.value,
		};
	}

	if (['table', 'object'].includes(contents?.type)) {
		return generateFields(key, contents, { parent });
	}
	return {
		component: componentTypes.TEXT_FIELD,
		name: buildKey(key, parent),
		label: key,
		dataType: contents?.type?.toString() ?? 'string',
		'data-testid': `${key}${parent ? '-' + parent : ''}`,
		validate,
		defaultValue: contents?.value,
		required: validate.some((validation) => validation?.type === 'required'),
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function generateFields(key: string, contents: Record<string, any>, { parent }: Parent = {}) {
	switch (contents.type) {
		case 'object': {
			return {
				'data-testid': key,
				name: buildKey(key, parent),
				title: key,
				component: componentTypes.SUB_FORM,
				ItemsGridProps: { columnSpacing: 2 },
				fields: contents.properties
					.map((property) => {
						if (property.type === 'object') {
							return generateFields(property.name, property, { parent: key });
						} else {
							return buildBody(property.name, property, {
								parent: buildKey(key, parent),
							});
						}
					})
					.filter(Boolean),
			};
		}
		case 'table': {
			return {
				'data-testid': key,
				name: buildKey(key, parent),
				title: key,
				component: 'table',
				properties: contents.properties,
			};
		}
		default:
			return buildBody(key, contents, { parent });
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const parseFields = (config: any) => {
	if (!config) {
		return [];
	}
	if (Array.isArray(config)) {
		return config.map((field) => generateFields(field.name, field)).filter(Boolean);
	}
	return Object.keys(config)
		.map((key) => generateFields(key, config[key]))
		.filter(Boolean);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const generateSchema = (config: any) => {
	const fields = parseFields(config);
	return { fields };
};

const generateState = (acc, name, field) => {
	if (field.type === 'object') {
		const newAcc = field.properties.reduce((innerAcc, prop) => generateState(innerAcc, prop.name, prop), {});
		return {
			...acc,
			[name]: newAcc,
		};
	}
	return {
		...acc,
		[name]: field.value || field.defaultValue,
	};
};

export const makeState = (config) => {
	if (!config) {
		return [];
	}
	if (Array.isArray(config)) {
		return config.reduce((acc, field) => generateState(acc, field.name, field), {});
	}
	return Object.keys(config).reduce((acc, key) => generateState(acc, key, config[key]), {});
};

export const useFieldUpdate = ({ name, defaultValue }) => {
	const api = useFormApi();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const ctx = useContext(FormContext) as { prefix: string; updateValues: any };
	useEffect(() => {
		const registered = api.registerField(
			name,
			({ value }) => {
				if (ctx.updateValues) {
					return ctx.updateValues(`${ctx.prefix}.${name}`)(value || defaultValue);
				}
			},
			{ value: true }
		);

		return registered;
	}, [name, defaultValue, ctx, api]);
};

export const useTemplate = (direction: string, id: string) => {
	const { data } = useQuery(
		['endpoints', direction, id],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		() => getApi<any>(`/data-sync/endpoints/${direction}/${id}`),
		{
			enabled: !!(direction && id),
		}
	);

	return data;
};

export const useTemplates = (direction: string, prefix: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { data } = useQuery(['endpoints', direction, prefix], () => getApi<any>(`/data-sync/endpoints/${direction}`));

	return useMemo(() => {
		return (data ?? []).map((el) => ({
			id: el,
			value: el,
			label: capitalize(el),
		}));
	}, [data]);
};
