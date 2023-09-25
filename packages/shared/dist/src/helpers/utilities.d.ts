import { clone, getAutoIncrementedName } from 'combocurve-utils/utilities';
import { Types } from 'mongoose';
declare const getSeconds: (ms: number) => number;
declare const daysToMS: (days: number) => number;
declare const numberWithCommas: (num: number) => string;
declare function convertIdxToMilli(idx: number): number;
declare function convertIdxToDate(idx: number): Date;
declare function convertDateToIdxWithDateInput(date: Date): number;
declare function convertUtcDateToIdx(date: Date): number;
declare function makeLocal(date: Date): Date;
declare function convertDateToIdx(props: {
    year?: number;
    month?: number | string;
    date?: string | Date;
}, make15th?: boolean): number | false;
declare function getYearMonthFromDate(d: Date): false | {
    year: number;
    month: number;
};
declare const getValidQuery: (props: string[], query: Record<string, unknown>) => Record<string, unknown>;
declare const splitQueryProps: (props: string[], query: Record<string, string>) => string[][];
declare const parseObjectId: (id: string) => Types.ObjectId;
declare const getProjection: (fields: string[]) => Record<string, boolean>;
declare const paginator: <T>(pageSize: number) => (array: T[]) => T[][];
declare const objectFromKeys: <T>(keys: string[], valueResolver: (key: string, index: number) => T) => Record<string, T>;
declare const genInptId: () => string;
declare const removeNonAlphanumeric: (value: string) => string;
declare function deepMerge<TObject1, TObject2>(obj1: TObject1, obj2: TObject2): (TObject1 & TObject2) | TObject1;
declare const objToBuffer: (obj: object) => string;
declare const bufferToObj: (buffer: any) => any;
declare const mapObjectKeys: (obj: object, keyMap: (key: string) => string | undefined) => object;
declare function isDict(item: unknown): boolean;
export { bufferToObj, clone, convertDateToIdx, convertDateToIdxWithDateInput, convertUtcDateToIdx, makeLocal, convertIdxToDate, convertIdxToMilli, daysToMS, deepMerge, genInptId, removeNonAlphanumeric, getAutoIncrementedName, getProjection, getSeconds, getValidQuery, getYearMonthFromDate, numberWithCommas, objToBuffer, paginator, parseObjectId, splitQueryProps, objectFromKeys, mapObjectKeys, isDict, };
//# sourceMappingURL=utilities.d.ts.map