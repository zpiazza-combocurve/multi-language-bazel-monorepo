/* eslint-disable 
	@typescript-eslint/no-unused-vars, 
	@typescript-eslint/no-explicit-any,
	@typescript-eslint/no-non-null-assertion */

import { getExample } from '../example.helper';
import { IInternalRequestBindOptions } from '../../common';
import { PropertyDefinitionSpec } from '../templates';

export type reqParseInput = {
	prop: string;
	opt: IInternalRequestBindOptions;
};

type requestPropertyParseFN = (input: reqParseInput) => PropertyDefinitionSpec;

export const requestSpecParses: Record<string, requestPropertyParseFN> = {
	string: function (input: reqParseInput): PropertyDefinitionSpec {
		const output: PropertyDefinitionSpec = {
			name: input.prop,
			type: 'string',
			typeKey: 'type',
			example: getExample('string', input.prop),
			stringEnum: input.opt.requirements?.validValues as string[],
			maxLength: input.opt.requirements?.maxLength,
		};

		if (input.opt.requirements?.validValues) {
			output.example = input.opt.requirements.validValues[0] as string;
		}

		return output;
	},
	number: function (input: reqParseInput): PropertyDefinitionSpec {
		const output: PropertyDefinitionSpec = {
			name: input.prop,
			type: 'number',
			typeKey: 'type',
			example: getExample('number', input.prop),
			format: 'int32',
		};

		if (input.opt.requirements?.range) {
			output.minimum = input.opt.requirements.range[0];
			output.maximum = input.opt.requirements.range[1];
			output.example = input.opt.requirements.range[0].toString();
		}

		return output;
	},
	boolean: function (input: reqParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: 'boolean',
			typeKey: 'type',
			example: getExample('boolean', input.prop),
		};
	},
	objectID: function (input: reqParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: 'string',
			typeKey: 'type',
			example: getExample('objectID', input.prop),
		};
	},
	object: function (input: reqParseInput): PropertyDefinitionSpec {
		if (!input.opt.objFactory) {
			throw new Error('Object type must have a typeFactory');
		}

		const sample = input.opt.objFactory();
		return {
			name: input.prop,
			type: getNameFromType(sample),
			typeKey: '$ref',
		};
	},
	array: function (input: reqParseInput): PropertyDefinitionSpec {
		const output: PropertyDefinitionSpec = {
			name: input.prop,
			type: 'array',
			typeKey: 'type',
			isArray: true,
			minItems: input.opt.requirements?.minItems,
			maxItems: input.opt.requirements?.maxItems,
		};

		const inner = requestSpecParses[input.opt.itemsExpects!](input);

		output.itemsType = inner.type;
		output.itemsTypeKey = inner.typeKey;
		output.example = inner.example;

		return output;
	},
};

export type resParseInput = {
	prop: string;
	value: any;
	requestName: string;
	objSuffix?: string;
};

type responsePropertyParseFN = (input: resParseInput) => PropertyDefinitionSpec;

export const responseSpecParses: Record<string, responsePropertyParseFN> = {
	string: function (input: resParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: 'string',
			typeKey: 'type',
			example: input.value,
		};
	},
	number: function (input: resParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: 'number',
			typeKey: 'type',
			example: input.value.toString(),
		};
	},
	boolean: function (input: resParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: 'boolean',
			typeKey: 'type',
			example: input.value.toString(),
		};
	},
	object: function (input: resParseInput): PropertyDefinitionSpec {
		return {
			name: input.prop,
			type: `${input.requestName}${capitalize(input.prop)}${input.objSuffix}`,
			typeKey: '$ref',
		};
	},
	array: function (input: resParseInput): PropertyDefinitionSpec {
		const output: PropertyDefinitionSpec = {
			name: input.prop,
			type: 'array',
			typeKey: 'type',
			isArray: true,
		};

		const firstItem = input.value[0];
		const inner = responseSpecParses[typeof firstItem]({
			prop: input.prop,
			value: firstItem,
			requestName: input.requestName,
			objSuffix: input.objSuffix,
		});

		output.itemsType = inner.type;
		output.itemsTypeKey = inner.typeKey;
		output.example = inner.example;

		return output;
	},
};

function getNameFromType(type: any): string {
	return Object.getPrototypeOf(type).constructor.name;
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
