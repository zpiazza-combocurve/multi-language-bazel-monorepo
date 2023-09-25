import { IDAL } from '@combocurve/dal-client';
import { Connection } from 'mongoose';

import { IBaseTenantInfo } from './helpers/tenant';
import { registerModels } from './models';

export type ContextConstructor<
	TContext extends BaseContext = BaseContext,
	TContextParams extends IBaseContextParams = IBaseContextParams
> = new (params: TContextParams) => TContext;

export interface IBaseContextParams {
	tenant: IBaseTenantInfo;
	db: Connection;
	dalClient?: IDAL;
}

export class BaseContext {
	constructor({ tenant, db, dalClient }: IBaseContextParams) {
		this.db = db;
		this.tenant = tenant;
		this.models = registerModels(db);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.dal = dalClient!;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	db: any;

	dal: IDAL;

	models: ReturnType<typeof registerModels>;

	tenant: IBaseTenantInfo;
}

export type ServiceConstructor<TContext extends BaseContext, TService extends BaseService<TContext>> = new (
	context: TContext
) => TService;

export abstract class BaseService<T extends BaseContext> {
	static attribute: string;
	protected context: T;

	constructor(context: T) {
		this.context = context;
	}
}
