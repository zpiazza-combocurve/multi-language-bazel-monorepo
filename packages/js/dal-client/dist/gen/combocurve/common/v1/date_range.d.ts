import _m0 from "protobufjs/minimal";
export declare const protobufPackage = "combocurve.common.v1";
/** A date range. Both dates are inclusive. */
export interface DateRange {
    startDate: Date | undefined;
    endDate: Date | undefined;
}
export declare const DateRange: {
    encode(message: DateRange, writer?: _m0.Writer): _m0.Writer;
    decode(input: _m0.Reader | Uint8Array, length?: number): DateRange;
    fromJSON(object: any): DateRange;
    toJSON(message: DateRange): unknown;
    create(base?: DeepPartial<DateRange>): DateRange;
    fromPartial(object: DeepPartial<DateRange>): DateRange;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
export {};
