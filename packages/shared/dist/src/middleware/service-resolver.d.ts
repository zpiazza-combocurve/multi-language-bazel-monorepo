import { RequestHandler } from 'express';
import { BaseContext, BaseService, ServiceConstructor } from '../base-context';
export declare const serviceResolver: <TContext extends BaseContext, TService extends BaseService<TContext>>(ServiceClass: ServiceConstructor<TContext, TService>, fieldName?: string) => RequestHandler;
//# sourceMappingURL=service-resolver.d.ts.map