import { ErrorRequestHandler } from 'express';
declare const uncaughtExceptionHandler: (error: any, req: any, res: any, next: any) => void;
declare const uncaughtRejectionHandler: (error: any, req: any, res: any, next: any) => void;
declare const errorHandlerMiddleware: () => ErrorRequestHandler;
export { uncaughtExceptionHandler, uncaughtRejectionHandler, errorHandlerMiddleware };
//# sourceMappingURL=error-handler.d.ts.map