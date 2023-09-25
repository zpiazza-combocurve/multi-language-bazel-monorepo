import type { ObjectId } from 'mongodb';

export interface Project {
	_id: ObjectId;
	wells: ObjectId[];
	name: string;
}
