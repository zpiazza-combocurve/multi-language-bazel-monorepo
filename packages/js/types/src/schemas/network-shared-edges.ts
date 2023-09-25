/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO add more explicit types for params and shape
import type { ObjectId } from 'mongodb';

import type { Stream } from './network-shared';

interface BaseEdge {
	id: string;
	name: string;
	description?: string;
	by: Stream;
	from: string;
	to: string;
	shape: any;
	fromFacilityObjectId?: unknown;
	toFacilityObjectId?: unknown;
}

interface StandardEdge extends BaseEdge {
	fromHandle: string;
	toHandle: string;
	toFacilityObjectId?: ObjectId;
	params: any;
	by: Stream.oil | Stream.gas | Stream.water;
}

interface LinkEdge extends BaseEdge {
	fromHandle: string;
	toHandle: string;
	toFacilityObjectId?: ObjectId;
	by: Stream.link;
}

interface DevelopmentEdge extends BaseEdge {
	by: Stream.development;
}

export type EdgeByStreamMap = {
	[Stream.oil]: StandardEdge;
	[Stream.gas]: StandardEdge;
	[Stream.water]: StandardEdge;
	[Stream.link]: LinkEdge;
	[Stream.development]: DevelopmentEdge;
};

export type Edge = EdgeByStreamMap[Stream];

// facility only edges
export interface InputEdge extends Omit<BaseEdge, 'from'> {
	toHandle: string;
}

export interface OutputEdge extends Omit<BaseEdge, 'to'> {
	fromHandle: string;
}
