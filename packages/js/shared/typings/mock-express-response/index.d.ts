import { Request, Response } from 'express';

export interface IMockExpressResponseOptions {
	request?: Request;
}

interface IMockExpressResponse {
	new (options?: IMockExpressResponseOptions): Response;
}

declare const MockExpressResponse: IMockExpressResponse;

export default MockExpressResponse;
