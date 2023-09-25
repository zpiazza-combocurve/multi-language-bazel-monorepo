import { Connection } from 'mongoose';
import { IBaseTenantInfo } from './helpers/tenant';
import { registerModels } from './models';
export type ContextConstructor<TContext extends BaseContext = BaseContext, TContextParams extends IBaseContextParams = IBaseContextParams> = new (params: TContextParams) => TContext;
export interface IBaseContextParams {
    tenant: IBaseTenantInfo;
    db: Connection;
}
export declare class BaseContext {
    constructor({ tenant, db }: IBaseContextParams);
    db: any;
    models: ReturnType<typeof registerModels>;
    tenant: IBaseTenantInfo;
}
export type ServiceConstructor<TContext extends BaseContext, TService extends BaseService<TContext>> = new (context: TContext) => TService;
export declare abstract class BaseService<T extends BaseContext> {
    static attribute: string;
    protected context: T;
    constructor(context: T);
}
//# sourceMappingURL=base-context.d.ts.map