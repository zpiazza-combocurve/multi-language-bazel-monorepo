import { Schema, Types } from 'mongoose';

export interface Group {
	name: string;
	description?: string;
	users: Types.ObjectId[];
	createdBy: Types.ObjectId;
}

export const GroupSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },

		description: { type: String },

		users: [{ type: Schema.Types.ObjectId, ref: 'users' }],

		createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true, immutable: true },
	},
	{ timestamps: true }
);
