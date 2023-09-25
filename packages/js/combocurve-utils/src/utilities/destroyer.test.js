// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Destroyer, DestroyerError } = require('./destroyer');

function FakeModel() {
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	return function model() {};
}

describe('helpers/destroyer', () => {
	test('ModelDestroyer()', () => {
		// valid: simplest possible config
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		expect(() => new Destroyer({ root: FakeModel() })).not.toThrow();

		// invalid: missing model
		expect(() => new Destroyer({ root: null })).toThrow(DestroyerError);

		// valid: children with common parentKey
		expect(
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			() => new Destroyer({ root: FakeModel(), children: [FakeModel(), FakeModel()], refKey: 'parent' })
		).not.toThrow();

		// invalid: missing parentRef
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		expect(() => new Destroyer({ root: FakeModel(), children: [FakeModel(), FakeModel()] })).toThrow(
			new DestroyerError('Invalid value for: parentRef')
		);

		// valid: children with different parentRef
		expect(
			() =>
				new Destroyer({
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					root: FakeModel(),
					children: [
						{
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							model: FakeModel(),
							parentRef: 'parent',
						},
						{
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							model: FakeModel(),
							parentRef: 'different',
						},
					],
				})
		).not.toThrow();

		// invalid: children with invalid model
		expect(
			() =>
				new Destroyer({
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					root: FakeModel(),
					children: [
						{
							model: {},
							parentRef: 'key1',
						},
						{
							// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
							model: () => {},
							parentRef: 'key2',
						},
						{
							model: null,
							parentRef: 'key4',
						},
					],
				})
		).toThrow('Invalid value for: model');

		// valid: children with nested destroyer
		expect(
			() =>
				new Destroyer({
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					root: FakeModel(),
					children: [
						{
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							model: FakeModel(),
							parentRef: 'parent',
						},
						{
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							destroyer: new Destroyer({ root: FakeModel() }),
							parentRef: 'different',
						},
					],
				})
		).not.toThrow();

		// invalid: children with invalid destroyer
		expect(
			() =>
				new Destroyer({
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					root: FakeModel(),
					children: [
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						FakeModel(),
						{
							destroyer: {},
						},
					],
					refKey: 'parent',
				})
		).toThrow(new DestroyerError('Invalid value for: destroyer'));

		// other invalid config values
		expect(() => new Destroyer()).toThrow(DestroyerError);
		expect(() => new Destroyer({ root: {} })).toThrow(DestroyerError);
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		expect(() => new Destroyer({ root: FakeModel(), children: [[]] })).toThrow(
			new DestroyerError('Invalid child config object')
		);
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		expect(() => new Destroyer({ root: FakeModel(), children: [{ parentRef: 'parent' }] })).toThrow(
			new DestroyerError('Invalid value for: model/destroyer: none provided')
		);
	});

	test('destroy()', () => {
		let destroyer;

		// destroy one model
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		destroyer = new Destroyer({ root: FakeModel() });
		expect(destroyer.destroy('id1').constructor.name).toBe('DestroyerTransaction');
		expect(destroyer.destroy('id1').operations()).toHaveLength(1);

		// destroy multiple children
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		destroyer = new Destroyer({ root: FakeModel(), children: [FakeModel(), FakeModel()], refKey: 'key' });
		expect(destroyer.destroy('id2').operations()).toHaveLength(3);

		// destroy nested destroyer
		destroyer = new Destroyer({
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			root: FakeModel(),
			children: [
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				FakeModel(),
				{
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					destroyer: new Destroyer({ root: FakeModel(), children: [FakeModel()], refKey: 'key' }),
				},
			],
			refKey: 'key',
		});
		const operations = destroyer.destroy('id3').operations();
		expect(operations).toHaveLength(4);
		operations.forEach((element) => {
			expect(element).toBeInstanceOf(Function);
		});
	});

	test('destroyAll()', () => {
		let destroyer;

		// destroy one model
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		destroyer = new Destroyer({ root: FakeModel() });
		expect(destroyer.destroyAll('id1').constructor.name).toBe('DestroyerTransaction');
		expect(destroyer.destroyAll('id1').operations()).toHaveLength(1);

		// destroy multiple children
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		destroyer = new Destroyer({ root: FakeModel(), children: [FakeModel(), FakeModel()], refKey: 'key' });
		expect(destroyer.destroyAll('id2').operations()).toHaveLength(3);

		// destroy nested destroyer
		destroyer = new Destroyer({
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			root: FakeModel(),
			children: [
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				FakeModel(),
				{
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					destroyer: new Destroyer({ root: FakeModel(), children: [FakeModel()], refKey: 'key' }),
				},
			],
			refKey: 'key',
		});
		let operations = destroyer.destroyAll('id3').operations();
		expect(operations).toHaveLength(4);
		operations.forEach((element) => {
			expect(element).toBeInstanceOf(Function);
		});

		// with batch size
		destroyer = new Destroyer({
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			root: FakeModel(),
			children: [
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				FakeModel(),
				{
					destroyer: new Destroyer({
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						root: FakeModel(),
						children: [
							{
								// eslint-disable-next-line new-cap -- TODO eslint fix later
								model: FakeModel(),
								batchSize: 1000,
							},
						],
						refKey: 'key',
					}),
				},
			],
			refKey: 'key',
		});
		operations = destroyer.destroyAll('id3').operations();
		expect(operations).toHaveLength(4);
		operations.forEach((element) => {
			expect(element).toBeInstanceOf(Function);
		});
	});
});
