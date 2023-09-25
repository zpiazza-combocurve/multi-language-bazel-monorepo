import { BaseContext, BaseService } from '@combocurve/shared';
import { Types } from 'mongoose';

class ScheduleService extends BaseService<BaseContext> {
	removeWellsFromAll = async (wellIds: string[], projectId: string | null = null): Promise<void> => {
		const projectQuery = projectId ? { project: projectId } : {};
		const wellQuery = { $in: wellIds.map((wellId) => new Types.ObjectId(wellId)) };

		await this.context.models.ScheduleInputQualifiersModel.updateMany(
			{ ...projectQuery },
			{ $pull: { qualifierAssignments: { well: wellQuery } } }
		);
		await this.context.models.ScheduleWellOutputModel.deleteMany({
			well: wellQuery,
		});
		await this.context.models.ScheduleModel.updateMany(
			{ ...projectQuery },
			{ $pull: { inputData: { well: wellQuery } }, $set: { modified: true } }
		);
	};
}

export { ScheduleService };
