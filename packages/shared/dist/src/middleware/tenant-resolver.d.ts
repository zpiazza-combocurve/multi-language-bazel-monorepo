/**
 * Middleware to set `res.locals.tenant`, containing the info for the tenant making the request that will be used for
 * other middlewares
 */
import { Request, RequestHandler } from 'express';
import { IBaseTenantInfo } from '../helpers/tenant';
export interface IBaseRequestTenant {
    name: Readonly<string>;
}
export declare const tenantResolver: <TRequestTenant extends IBaseRequestTenant, TTenantInfo extends IBaseTenantInfo>(getRequestTenant: (req: Request) => TRequestTenant, getTenantInfo: (requestTenant: TRequestTenant) => Promise<TTenantInfo>) => RequestHandler;
//# sourceMappingURL=tenant-resolver.d.ts.map