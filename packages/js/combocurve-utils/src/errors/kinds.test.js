// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { expect } = require('@jest/globals');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { CallerErrors, ServerError, UserErrors } = require('./kinds');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { CallerError, ServerError: InternalServerError, UserError } = require('./primitives');

describe('kinds', () => {
	describe('ServerError', () => {
		test('ServerError', () => {
			const error = new ServerError();

			expect(error).toBeInstanceOf(InternalServerError);
			expect(error).toMatchObject({ kind: 'InternalError', status: 500 });
		});
	});

	describe('CallerErrors', () => {
		test('InvalidAuth', () => {
			const error = new CallerErrors.InvalidAuth({});

			expect(error).toBeInstanceOf(CallerError);
			expect(error).toMatchObject({ kind: 'InvalidAuth', status: 401 });
		});

		test('InvalidParams', () => {
			const error = new CallerErrors.InvalidParams({});

			expect(error).toBeInstanceOf(CallerError);
			expect(error).toMatchObject({ kind: 'InvalidParams', status: 400 });
		});
	});

	describe('UserErrors', () => {
		test('DocumentAlreadyExists', () => {
			const error = new UserErrors.DocumentAlreadyExists({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'DocumentAlreadyExists', status: 400 });
		});

		test('DocumentNotFound', () => {
			const error = new UserErrors.DocumentNotFound({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'DocumentNotFound', status: 404 });
		});

		test('FeatureNotEnabled', () => {
			const error = new UserErrors.FeatureNotEnabled({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'FeatureNotEnabled', status: 400 });
		});

		test('Forbidden', () => {
			const error = new UserErrors.Forbidden({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'Forbidden', status: 403 });
		});

		test('LimitExceeded', () => {
			const error = new UserErrors.LimitExceeded({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'LimitExceeded', status: 400 });
		});

		test('OperationNotAllowed', () => {
			const error = new UserErrors.OperationNotAllowed({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'OperationNotAllowed', status: 400 });
		});

		test('WrongInput', () => {
			const error = new UserErrors.WrongInput({});

			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ kind: 'WrongInput', status: 400 });
		});
	});
});
