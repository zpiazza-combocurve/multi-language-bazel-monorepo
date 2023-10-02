import { range } from 'lodash';
import { Types } from 'mongoose';

export const generateBoolean = (i: number): boolean => i % 2 === 0;

export const generateDate = (day: number, month = 0): Date => new Date(Date.UTC(2000, month, day));

export const generateStrDateOnly = (day: number, month = 0): string =>
	generateDate(day, month).toISOString().split('T')[0];

export const generateNumber = (i: number): number => i * 10;

export const generateObjectId = (i: number): Types.ObjectId => Types.ObjectId((i + '').padStart(24, '0'));

export const generateString = (i: number): string => (1 / i).toString(36).substring(7);

export const generateEnum = <T extends string>(i: number, choices: readonly T[]): T => choices[i % choices.length];

export const generateObjectIdArray = (length: number): Types.ObjectId[] =>
	range(length).map((i) => generateObjectId(i));
