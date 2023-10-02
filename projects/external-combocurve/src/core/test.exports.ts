// Some exports used in many different tests
import { Types } from 'mongoose';

import { compositionObj, fromBody, fromParams, fromParentScope, fromQuery, specs } from './metadata/metadata';
import { HttpMessageContext, ParseInput, ParseOutput } from './common';
import { CommandRequest } from './requests/base';
import { Controller } from './controllers/base';

import { mockExpress } from '@test/express-mocks';

// These samples are used to generate the spec files
// We have well defined the request objects, with metadatas and all the stuff
// but we don't have anything related to the responses, so it's used a sample object to generate their specs
// it's a good practice to have at least an interface to define the responses
// this way we'll have a compilation error on our samples when response changes
const specSamples = {
	ok: {
		name: 'test',
		age: 10,
		isCool: true,
		id: '5f0b4e3b9b0b3e1b3c9d3b3b',
		inner: {
			profession: 'developer',
			yearsOfExperience: 10,
			lookingForJob: false,
		},
		address: 'default address',
		numbers: ['one', 'two'],
	},
	notFound: {
		name: 'test',
		errorMsg: 'test',
		location: 'test',
	},
	created: {
		peoples: [{ name: 'test', age: 10 }],
	},
	customType: {
		prop1: 'qwe',
		prop2: 123,
	},
};

export class CompositionModel {
	@fromQuery({ expects: 'string' })
	public compositionTest?: string;
}

export class InnerModel {
	@fromParentScope({ expects: 'string' })
	public profession?: string;

	@fromParentScope({ expects: 'number' })
	public yearsOfExperience?: number;

	@fromParentScope({ expects: 'boolean' })
	public lookingForJob?: boolean;
}

export type customType = {
	prop1: string;
	prop2: number;
};

@specs.produceResponse({ status: 400 })
@specs.produceResponse({ status: 401 })
@specs.produceResponse({ status: 200, schema: specSamples.ok })
@specs.produceResponse({ status: 404, schema: specSamples.notFound })
@specs.produceResponse({ status: 201, schema: specSamples.created })
export class TestModel extends CommandRequest<number> {
	@fromBody({ expects: 'string', requirements: { maxLength: 10, validValues: ['test1', 'test2'] } })
	public name?: string;

	@fromQuery({ expects: 'number' })
	public age?: number;

	@fromBody({ expects: 'boolean' })
	public isCool?: boolean;

	@fromParams({ expects: 'objectID' })
	public id?: Types.ObjectId;

	@compositionObj(() => new CompositionModel())
	public commomQueryParams?: CompositionModel;

	@fromBody({ expects: 'object', objFactory: () => new InnerModel() })
	public inner?: InnerModel;

	@fromBody({ isOptional: true, expects: 'string' })
	public address?: string;

	@fromBody({
		expects: 'object',
		customParse: TestModel.parseMyCystom,

		// Objects properties usualy have a typeFactory to create a new instance of the object
		// but in this case we don't need it because we are using a custom parse function
		// so, to be able to generate the definitions it's necessary at least a sample
		specOptions: {
			sample: specSamples.customType,
		},
	})
	public custom?: customType;

	constructor() {
		super();

		this.address = 'default address';
	}

	public static parseMyCystom(input: ParseInput): ParseOutput {
		return {
			parsedValue: input.value as customType,
		};
	}

	handle(input: HttpMessageContext): Promise<number> {
		throw new Error('Irrelevant for the test.' + input.method);
	}
}

export class TestController extends Controller {
	constructor() {
		super();

		this.registerDelete('/', TestModel, { description: 'delete' });
	}
}

export class TestModelTwo extends CommandRequest<number> {
	@fromBody({ expects: 'string' })
	propertyFromTest2?: string;

	handle(input: HttpMessageContext): Promise<number> {
		throw new Error('Method not implemented.' + input.method);
	}
}

export const testCreateHttpMessage = (): HttpMessageContext => {
	const { req, res } = mockExpress();

	res.status = (code: number) => {
		res.statusCode = code;
		return res;
	};

	res.json = jest.fn().mockReturnValue(res.end);

	return {
		request: req,
		response: res,
	} as HttpMessageContext;
};
