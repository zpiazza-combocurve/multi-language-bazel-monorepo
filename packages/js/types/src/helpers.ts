import type { ObjectId } from 'mongodb';

export type Substitute<T, From, To> = T extends From
	? To
	: T extends object
	? {
			[K in keyof T]: Substitute<T[K], From, To>;
	  }
	: T;

export type Client<T> = T extends ObjectId
	? string
	: T extends Date
	? Date
	: T extends object
	? { [K in keyof T]: Client<T[K]> }
	: T;

/**
 * @example
 * 	type Foo = {
 * 		_id: ObjectId;
 * 		createdAt: Date;
 * 		bar: number;
 * 		baz: string;
 * 	};
 *
 * 	type PlainFoo = PlainJSON<Foo>; // { _id: string; createdAt: string; bar: number; baz: string; }
 */
export type PlainJSON<T> = Substitute<T, Date | ObjectId, string>;
