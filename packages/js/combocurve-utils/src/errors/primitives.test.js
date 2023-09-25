// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { AppError, CallerError, ServerError, UserError, createSubclass } = require('./primitives');

describe('primitives', () => {
	describe('ServerError', () => {
		test('should create an error instance correctly', () => {
			const error = new ServerError({ kind: 'InternalError' });
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error.kind).toEqual('InternalError');
			expect(error.getInfo).toBeInstanceOf(Function);
			expect(error.getInfo()).toMatchObject({ expected: false, user: false, status: 500 });
		});
	});

	describe('CallerError', () => {
		test('should create an error instance correctly', () => {
			const error = new CallerError({ kind: 'InvalidParams' });
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error.kind).toEqual('InvalidParams');
			expect(error.getInfo).toBeInstanceOf(Function);
			expect(error.getInfo()).toMatchObject({ expected: true, user: false, status: 400 });
		});
	});

	describe('UserError', () => {
		test('should create an error instance correctly', () => {
			const error = new UserError({ kind: 'Forbidden', status: 403 });
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(AppError);
			expect(error.kind).toEqual('Forbidden');
			expect(error.getInfo).toBeInstanceOf(Function);
			expect(error.getInfo()).toMatchObject({ expected: true, user: true, status: 403 });
		});
	});

	describe('createSubclass', () => {
		test('should create an error class correctly', () => {
			const Subclass = createSubclass(UserError, 'Forbidden', { status: 403 });
			expect(Subclass.name).toEqual('Forbidden');
			expect(new Subclass()).toBeInstanceOf(Error);
		});
	});
});
