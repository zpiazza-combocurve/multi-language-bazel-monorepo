import * as mongoose from 'mongoose';

declare global {
	type Assign<T, K> = Pick<T, Exclude<keyof T, keyof K>> & K;

	type ObjectId = import('mongoose').Types.ObjectId;

	namespace Inpt {
		interface TypeCurve extends mongoose.Document {
			name: string;
			project: ObjectId;
		}

		interface Project extends mongoose.Document {
			name: string;
		}

		interface Forecast extends mongoose.Document {
			status: string;
			project: ObjectId;
		}

		interface Schedule extends mongoose.Document {
			project: ObjectId;
		}
	}
}
