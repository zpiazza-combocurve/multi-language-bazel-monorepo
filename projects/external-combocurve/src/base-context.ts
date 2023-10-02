import { Connection } from 'mongoose';

import { IModelSet } from './api/v1/model-set';
import { ITenantHeaders } from './headers';
import { ITenantInfo } from './tenant';

export interface IBaseContext {
	headers: ITenantHeaders;
	tenant: ITenantInfo;
	models: IModelSet;
}

export type ContextConstructor<T extends IBaseContext = IBaseContext> = new (
	info: ITenantInfo,
	connection: Connection,
) => T;

export abstract class BaseService<T extends IBaseContext> {
	static attribute: string;
	protected context: T;

	constructor(context: T) {
		this.context = context;
	}
}

export type ServiceConstructor<C extends IBaseContext, S extends BaseService<C>> = new (context: C) => S;
