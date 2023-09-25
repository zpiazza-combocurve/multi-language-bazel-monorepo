import mongoose from 'mongoose';
import { BaseContext } from '../src/base-context';
export default class TestDbManager {
    context: BaseContext;
    db: BaseContext['db'];
    connection: mongoose.Connection;
    start(): Promise<void>;
    stop(): Promise<void>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=test-db-manager.d.ts.map