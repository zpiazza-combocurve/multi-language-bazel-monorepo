import { Request } from 'express';

export interface IMockExpressRequestOptions {
	body?: Request['body'];
	headers?: Request['headers'];
	params?: Request['params'];
	query?: Request['query'];
}

interface IMockExpressRequest {
	// This is the syntax declared in the official type definitions (@types/mock-express-request):
	// (options?: IMockExpressRequestOptions): Request;
	//
	// But in reality it has to be used as a constructor:
	new (options?: IMockExpressRequestOptions): Request;
}

declare const MockExpressRequest: IMockExpressRequest;

export default MockExpressRequest;
