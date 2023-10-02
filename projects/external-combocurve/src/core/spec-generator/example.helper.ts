import { ObjectDefinitionSpec } from './templates';

const typeExamples: Record<string, string> = {
	string: 'some_string',
	number: '42',
	boolean: 'true',
	objectID: '5e276e31876cd70012ddf3f6',
};

// Save here any example that you think is useful and common for the project
const specificPropertyExamples: Record<string, string> = {
	econName: 'capex',
	econModel: 'actual-or-forecast',
};

export const getExample = (type: string, prop: string): string | undefined => {
	if (specificPropertyExamples[prop]) {
		return specificPropertyExamples[prop];
	}

	if (typeExamples[type]) {
		return typeExamples[type];
	}
};

const yamlTab = '  ';

/**
 * Create the example for the definitions spec objects
 * @param definitionsObjs the objects defined by the definition handler
 */
export function fillDefinitionExamples(definitionsObjs: ObjectDefinitionSpec[]): void {
	definitionsObjs.forEach((f) => {
		if (f.example === undefined) {
			createObjectDefinitionExample(definitionsObjs, f);
		}
	});
}

function createObjectDefinitionExample(all: ObjectDefinitionSpec[], target: ObjectDefinitionSpec): string[] {
	if (target.example === undefined) {
		target.example = [];

		for (const objProp of target.properties) {
			const key = objProp.name;
			const type = objProp.isArray ? objProp.itemsTypeKey : objProp.typeKey;

			// $ref means this object has another object inside it
			// the property type (itemsType when array) has the referenced name object
			if (type === '$ref') {
				target.example.push(`${key}:`);

				const innerObjName = objProp.isArray ? objProp.itemsType : objProp.type;
				const innerObj = all.find((f) => f.name === innerObjName);

				const innerExample = createObjectDefinitionExample(all, innerObj!);

				// Arrays have the first item different than the others, and have the double of tabs than objects
				if (objProp.isArray) {
					target.example.push(`${yamlTab}- ${innerExample[0]}`);
					target.example.push(...innerExample.slice(1).map((m) => `${yamlTab}${yamlTab}${m}`));
				} else {
					target.example.push(...innerExample.map((m) => `${yamlTab}${m}`));
				}
			} else if (objProp.isArray) {
				target.example.push(`${key}:`);
				target.example.push(`${yamlTab}- ${objProp.example}`);
			} else {
				target.example.push(`${key}: ${objProp.example}`);
			}
		}
	}

	return target.example;
}
