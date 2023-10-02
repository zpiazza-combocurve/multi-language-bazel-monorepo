import convert from '@openapi-contrib/json-schema-to-openapi-schema'; // https://github.com/openapi-contrib/json-schema-to-openapi-schema
import Converter from 'api-spec-converter'; // https://www.npmjs.com/package/api-spec-converter
import fs from 'fs';
import YAML from 'json-to-pretty-yaml'; //https://www.npmjs.com/package/json-to-pretty-yaml

const baseSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
};

(async () => {
	const { id, ...restBaseProperties } = JSON.parse(
		fs.readFileSync('./schemas/econ-models/base-econ-model.json', 'utf8')
	);
	const pricingSchema = JSON.parse(fs.readFileSync('./schemas/econ-models/pricing.json', 'utf8'));
	const path = JSON.parse(fs.readFileSync('./paths/econ-models/pricing.json', 'utf8'));
	const baseParams = JSON.parse(fs.readFileSync('./paths/econ-models/base-params.json', 'utf8'));

	const schema = {
		...baseSchema,
		components: {
			schemas: {
				pricing: {
					...restBaseProperties,
					properties: {
						...restBaseProperties.properties,
						...pricingSchema.properties,
					},
					...pricingSchema.definitions,
				},
			},
			...baseParams,
		},
	};

	const specFile = {
		...path,
		...schema,
	};

	const oApiJSON = 'test3.json';

	const convertedSchema = await convert(specFile);
	fs.writeFileSync(oApiJSON, JSON.stringify(convertedSchema));

	console.log(specFile);

	// schema.components.schema = {
	// 	...convertedSchema,
	// };
	// console.log(convertedSchema);
	// debugger;
	// const oApiYAMLName = 'test3.yaml';
	// let parsedYaml = YAML.stringify(convertedSchema);
	// fs.writeFileSync(oApiYAMLName, parsedYaml);
	// fs.writeFileSync(oApiJSON, JSON.stringify(convertedSchema));

	// const oapi3Json = JSON.parse(fs.readFileSync('./test3.json', 'utf8'));

	Converter.convert(
		{
			from: 'openapi_3',
			to: 'swagger_2',
			source: specFile,
		},
		function (err, converted) {
			console.log(err);

			const { paths, definitions } = converted.spec;
			var ymlswagger = YAML.stringify(converted);
			fs.writeFileSync('swagger-2.0.yml', ymlswagger);
			fs.writeFileSync('swagger-2.0-paths.yml', YAML.stringify(paths));
			fs.writeFileSync('swagger-2.0-definitions.yml', YAML.stringify(definitions));
			// For yaml and/or OpenApi field order output replace above line
			// with an options object like below
			//   var  options = {syntax: 'yaml', order: 'openapi'}
			//   console.log(converted.stringify(options));
		}
	);
})();
