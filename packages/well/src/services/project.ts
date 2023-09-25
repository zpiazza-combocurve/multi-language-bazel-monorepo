import { BaseContext, BaseService } from '@combocurve/shared';

import { ScheduleService } from './schedules';
import { WellService } from './wells';

class ProjectService extends BaseService<BaseContext> {
	protected scheduleService: ScheduleService;
	protected wellService: WellService;

	constructor(context: BaseContext) {
		super(context);
		this.scheduleService = new ScheduleService(context);
		this.wellService = new WellService(context);
	}

	addWells = async (projectId: string, wellIds: string[]) =>
		this.context.models.ProjectModel.findOneAndUpdate(
			{ _id: projectId },
			{ $addToSet: { wells: { $each: wellIds } } },
			{ new: true }
		);

	removeCompanyWells = async (projectId: string, wellIds: string[]) => {
		const qProj = { project: projectId };

		// Separate project specific wells from normal wells because they must be completely deleted on removal
		const normalWellIds = (
			await this.context.models.WellModel.find(
				{
					_id: { $in: wellIds },
					project: null,
				},
				{ _id: 1 }
			).exec()
		).map(({ _id }) => _id);

		const $pull = { wells: { $in: normalWellIds } };

		const deleteEconRuns = this.context.models.EconRunModel.find({ ...qProj, ...$pull }, { _id: 1 }).then(
			(runIdsObj) => {
				const runIds = runIdsObj.map(({ _id }) => _id);

				return Promise.all([
					this.context.models.EconRunModel.deleteMany({ _id: { $in: runIds } }),
					this.context.models.EconRunsDataModel.deleteMany({ run: { $in: runIds } }),
				]);
			}
		);

		const forecastIds = (await this.context.models.ForecastModel.find(qProj, { _id: 1 }).lean()).map(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			({ _id }: any) => _id
		);
		const typeCurveIds = (await this.context.models.TypeCurveModel.find(qProj, { _id: 1 }).lean()).map(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			({ _id }: any) => _id
		);

		const status: { [key: string]: PromiseLike<unknown> } = {
			forecasts: this.context.models.ForecastModel.updateMany({ _id: { $in: forecastIds } }, { $pull }), // forecasts 0
			scenarios: this.context.models.ScenarioModel.updateMany(qProj, { $pull }), // scenarios 1
			assumptions: this.context.models.AssumptionModel.deleteMany({ ...qProj, well: { $in: normalWellIds } }), // assumptions 2
			project: this.context.models.ProjectModel.findOneAndUpdate({ _id: projectId }, { $pull }, { new: true }), // project 3
			forecast: this.context.models.ScenarioWellAssignmentModel.deleteMany({
				...qProj,
				well: { $in: normalWellIds },
			}), // forecast 4
			forecastDataProb: this.context.models.ForecastDataModel.deleteMany({
				...qProj,
				well: { $in: normalWellIds },
			}), // forecast datas 5
			forecastDataDet: this.context.models.DeterministicForecastDataModel.deleteMany({
				...qProj,
				well: { $in: normalWellIds },
			}), // forecast datas 6
			forecastWellAssignment: this.context.models.ForecastWellAssignmentModel.deleteMany({
				forecast: { $in: forecastIds },
				well: { $in: normalWellIds },
			}), // forecast well assignment 7
			typeCurves: this.context.models.TypeCurveModel.updateMany(qProj, { $pull, $set: { wellsRemoved: true } }), // type curves 8
			typeCurveWellAssignment: this.context.models.TypeCurveWellAssignmentModel.deleteMany({
				typeCurve: { $in: typeCurveIds },
				well: { $in: normalWellIds },
			}),
			econRuns: deleteEconRuns,
			schedule: this.scheduleService.removeWellsFromAll(normalWellIds, projectId),
			forecastBuckets: this.context.models.ForecastBucketModel.updateMany(
				{ forecast: { $in: forecastIds } },
				{ $pullAll: { bucket: normalWellIds } }
			),
		};

		await Promise.all(Object.values(status)).catch((error) => error);

		return await status.project;
	};

	removeProjectWells = async (projectId: string, wellIds: string[]) => {
		// Separate project specific wells from normal wells because they must be completely deleted on removal
		const projectWellIds = (
			await this.context.models.WellModel.find(
				{
					_id: { $in: wellIds },
					project: projectId,
				},
				{ _id: 1 }
			).exec()
		).map(({ _id }) => _id);

		await this.wellService.deleteWells(projectWellIds);

		return this.context.models.ProjectModel.findOne({ _id: projectId });
	};

	removeWells = async (projectId: string, wellIds: string[]) => {
		// Separate project specific wells from normal wells because they must be completely deleted on removal
		const projectWellIds = (
			await this.context.models.WellModel.find(
				{
					_id: { $in: wellIds },
					project: projectId,
				},
				{ _id: 1 }
			).exec()
		).map(({ _id }) => _id);

		const projectWellsSet = new Set(projectWellIds);
		const normalWellIds = wellIds.filter((w) => !projectWellsSet.has(w));

		await this.removeCompanyWells(projectId, normalWellIds);
		return await this.removeProjectWells(projectId, projectWellIds);
	};
}

export { ProjectService };
