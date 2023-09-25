import { buildConnectionString, populate } from './mongo';

class QueryMock {
	constructor(data) {
		this.data = data;
	}

	select() {
		return this;
	}

	then(callback) {
		callback(this.data);
	}
}

const ModelMock = (name, documents) => {
	// eslint-disable-next-line func-name-matching -- TODO eslint fix later
	const ConcreteModel = function Model(values) {
		Object.assign(this, values);
		this.toObject = () => values;
		return this;
	};
	ConcreteModel.collection = { name };
	ConcreteModel.find = () => {
		const data = documents.map((doc) => new ConcreteModel(doc));
		return new QueryMock(data);
	};

	return ConcreteModel;
};

describe('helpers/mongo', () => {
	test('buildConnectionString', () => {
		// no special chars
		expect(
			buildConnectionString({ username: 'john', password: 'pass', cluster: 'moon', database: 'secret' })
		).toEqual('mongodb+srv://john:pass@moon/secret');
		// with special chars
		expect(
			buildConnectionString({
				username: 'john@gmail.com',
				password: 'pass+',
				cluster: 'moon',
				database: 'secret',
			})
		).toEqual('mongodb+srv://john%40gmail.com:pass%2B@moon/secret');
		// with params
		expect(
			buildConnectionString({
				username: 'john',
				password: 'pass',
				cluster: 'moon',
				database: 'secret',
				params: {
					retryWrites: true,
					w: 'majority',
				},
			})
		).toEqual('mongodb+srv://john:pass@moon/secret?retryWrites=true&w=majority');
	});

	test('populate()', async () => {
		const projections = { _id: true, bar: { name: true } };
		const fooSchema = { bar: { ref: 'bars' }, name: String };
		const models = {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			BarModel: ModelMock('bars', [{ _id: 'b1', name: 'Bar 2' }]),
		};

		// empty documents
		let populated = await populate([], projections, fooSchema, models);
		expect(populated).toBeInstanceOf(Array);

		// documents with refs
		populated = await populate(
			[
				{
					_id: 'f1',
					name: 'Foo 1',
					bar: 'b1',
					extra: 'keep',
				},
				{
					_id: 'f2',
					name: 'Foo 2',
					bar: null,
					extra: 'keep',
				},
			],
			projections,
			fooSchema,
			models
		);
		expect(populated[0].bar.name).toBe('Bar 2');
		expect(populated[0].extra).toBe('keep');
		expect(populated[1].bar).toBe(null);
		expect(populated[1].extra).toBe('keep');
	});
});
