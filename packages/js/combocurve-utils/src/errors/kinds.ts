import _ from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { CallerError, UserError, ServerError: InternalServerError, createSubclass } = require('./primitives');

const CALLER_ERRORS = {
	InvalidAuth: { status: 401 }, // The caller request is missing or has invalid credentials
	InvalidParams: {}, // The caller request is missing or has invalid parameters
};

const USER_ERRORS = {
	DocumentAlreadyExists: {}, // The user tried to create a document using an identifier that already exists
	DocumentNotFound: { status: 404 }, // The user tried to access a document that does not exist
	FeatureNotEnabled: {}, // The user requested a functionality that is not enabled for their tenant
	Forbidden: {
		status: 403,
		message: "You don't have permission to perform this operation. Please contact your administrator.",
	}, // The user tried an operation that they don't have permission to execute
	LimitExceeded: {}, // The user tried an operation that exceeds the configured limits for the feature
	OperationNotAllowed: {}, // The user tried an operation that is not legal in the current state of the data model
	WrongInput: {}, // The user provided an input that is not correct
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const CallerErrors = _.mapValues(CALLER_ERRORS, (params: any, kind: any) =>
	createSubclass(CallerError, kind, params)
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const UserErrors = _.mapValues(USER_ERRORS, (params: any, kind: any) => createSubclass(UserError, kind, params));

export const ServerError = createSubclass(InternalServerError, 'InternalError');
