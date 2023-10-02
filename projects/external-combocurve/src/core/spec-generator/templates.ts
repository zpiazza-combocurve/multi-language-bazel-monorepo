export type ObjectDefinitionSpec = {
	name: string;
	properties: PropertyDefinitionSpec[];
	required?: string[];
	example?: string[];
};

export type PropertyDefinitionSpec = {
	name: string;
	type: string;
	typeKey: string;
	required?: boolean;
	isArray?: boolean;
	itemsTypeKey?: string;
	itemsType?: string;
	example?: string;
	stringEnum?: string[];
	minimum?: number;
	maximum?: number;
	minItems?: number;
	maxItems?: number;
	maxLength?: number;
	format?: string;
};

export const definitionsTemplate = `
{{#each objects}}
{{this.name}}:
  type: 'object'
  {{#if required}}
  required:
    {{#each required}}
    - {{this}}
	{{/each}}
  {{/if}}
  properties:
  {{#each properties}}
    {{this.name}}:
    {{#if isArray}}
      type: 'array'
      items:
        {{itemsTypeKey}}: '{{itemsType}}'
		{{#if example}}
        example: '{{example}}'
        {{/if}}
		{{#if maxItems}}
        maxItems: {{maxItems}}
        {{/if}}
		{{#if minItems}}
        minItems: {{minItems}}
        {{/if}}
	{{else}}
      {{typeKey}}: '{{type}}'
	  {{#if format}}
      format: '{{format}}'
      {{/if}}
	  {{#if example}}
      example: '{{example}}'
      {{/if}}
      {{#if stringEnum}}
      enum:
        {{#each stringEnum}}
        - '{{this}}'
	    {{/each}}
	  {{/if}}
	  {{#if minimum}}
      minimum: '{{minimum}}'
      {{/if}}
	  {{#if maximum}}
      maximum: '{{maximum}}'
      {{/if}}	    
    {{/if}}
  {{/each}}
  {{#if example}}
  example:
  {{#each example}}
    {{this}}	
  {{/each}}
  {{/if}}	
{{/each}}
`;

export type EndpointPathSpec = {
	verb: string;
	id?: string;
	description?: string;
	consumes?: string;
	produces?: string;
	parameters: EndpointParameterSpec[];
	responses: EndpointResponseSpec[];
};

export type EndpointParameterSpec = {
	fromWhere: string;
	name: string;
	type?: string;
	stringEnum?: string[];
	description?: string;
	format?: string;
	default?: string;
	minimum?: number;
	maximum?: number;
	required?: boolean;
	schema?: string;
	isArray?: boolean;
	itemsTypeKey?: string;
	itemsType?: string;
	example?: string;
	itemsExample?: string;
	minItems?: number;
	maxItems?: number;
};

export type EndpointResponseSpec = {
	status: number;
	description?: string;
	schema?: string;
	headers?: EndpointResponseHeaderSpec[];
};

export type EndpointResponseHeaderSpec = {
	name: string;
	type: string;
};

export const pathsTemplate = `
{{#each routes}}
{{completeRoute}}:
  {{#each methods}}
  {{verb}}:
    operationId: {{id}}
	{{#if description}}
    description: {{description}}
    {{/if}}
    {{#if consumes}}
    consumes:
      - {{consumes}}
    {{/if}}
    {{#if produces}}
    produces:
      - {{produces}}
    {{/if}}
    parameters:
    {{#each parameters}}
      - name: {{name}}
        in: {{fromWhere}}
		{{#if description}}
        description: {{description}}
        {{/if}}
        {{#if required}}
        required: true
        {{/if}}
		{{#if type}}
        type: {{type}}
        {{/if}}
		{{#if format}}
        format: {{format}}
        {{/if}}
		{{#if minimum}}
        minimum: {{minimum}}
        {{/if}}
		{{#if maximum}}
        maximum: {{maximum}}
        {{/if}}
		{{#if stringEnum}}
        enum:
        {{#each stringEnum}}
          - '{{this}}'
	    {{/each}}
	    {{/if}}
		{{#if example}}
        example: {{example}}
        {{/if}}        
		{{#if schema}}
        schema:
          $ref: '{{schema}}'
      	{{/if}}
	  {{#if isArray}}
		{{#if minItems}}
        minItems: {{minItems}}
      	{{/if}}
		{{#if maxItems}}
        maxItems: {{maxItems}}
		{{/if}}
        items:
          {{itemsTypeKey}}: {{itemsType}}
		  {{#if itemsExample}}
          example: {{itemsExample}}
          {{/if}}
	  {{/if}}
    {{/each}}
    responses:
    {{#each responses}}
      '{{status}}':
        description: {{description}}
        {{#if headers}}
        headers:
        {{#each headers}}
          {{name}}:
            type: {{type}}
            {{#if description}}
            description: >-
              {{description}}
            {{/if}}    
        {{/each}}
      {{/if}}
      {{#if schema}}
        schema:
          $ref: {{schema}}
      {{/if}}
    {{/each}}
    {{#if tags}}
    tags:
      {{#each tags}}
      - {{this}}
      {{/each}}
    {{/if}}
  {{/each}}
{{/each}}
`;
