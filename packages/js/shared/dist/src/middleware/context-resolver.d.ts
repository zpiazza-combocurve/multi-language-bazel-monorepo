import { RequestHandler } from 'express';
import { BaseContext, ContextConstructor, IBaseContextParams } from '../base-context';
import { ITenantCacheEntry } from './tenant-cache';
export declare const getBaseContextParams: (cachedTenant: ITenantCacheEntry) => Promise<IBaseContextParams>;
export declare const contextResolver: <TContext extends BaseContext, TContextParams extends IBaseContextParams>(ContextClass: ContextConstructor<TContext, TContextParams>, getContextParams: (cachedTenant: ITenantCacheEntry) => Promise<TContextParams>) => RequestHandler;
//# sourceMappingURL=context-resolver.d.ts.map