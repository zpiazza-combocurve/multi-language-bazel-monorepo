import { BaseContext, BaseService } from '@combocurve/shared';
export declare class PythonApiService extends BaseService<BaseContext> {
    constructor(context: BaseContext);
    private callPythonApi;
    updateEur: ({ body, retries, }: {
        body: {
            forecast_ids: string[];
            wells?: string[];
            phases?: string[];
            is_deterministic?: boolean;
        };
        retries?: number | undefined;
    }) => Promise<void>;
}
//# sourceMappingURL=python.d.ts.map