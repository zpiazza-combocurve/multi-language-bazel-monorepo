import { Schema } from 'mongoose';

export const UserSchema = new Schema(
	{
		auth0Id: { type: String, required: true, unique: true },

		bootstrap: {
			theme: { type: String, default: 'dark' },
			themeScheme: { type: String, default: 'classic' },
			project: { type: Schema.Types.ObjectId, ref: 'projects' },
		},

		lastSignIn: Date,

		company: String,
		email: { type: String, required: true, unique: true, index: true },
		firstName: String,
		lastName: String,
		locked: { type: Boolean, default: false },
	},
	{ timestamps: true }
);
