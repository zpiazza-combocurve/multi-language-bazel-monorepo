import { Request, Response } from 'express';
import { IMockExpressRequestOptions } from 'mock-express-request';
import { IMockExpressResponseOptions } from 'mock-express-response';
export interface IMockExpressReturn {
    req: Request;
    res: Response;
}
export declare function mockExpress(reqOptions?: IMockExpressRequestOptions, resOptions?: IMockExpressResponseOptions): IMockExpressReturn;
//# sourceMappingURL=express-mocks.d.ts.map