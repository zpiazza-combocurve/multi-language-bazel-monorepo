import { Connection, Model } from 'mongoose';

import { AccessPolicySchema, IAccessPolicy } from '@src/models/access-policies';
import { AssumptionSchema, IBaseEconModel } from '@src/models/econ/econ-models';
import {
	CustomHeaderConfigurationSchema,
	ScenarioWellAssignmentSchema,
	WellDirectionalSurveySchema,
} from '@src/schemas';
import { DailyProductionSchema, IDailyProduction } from '@src/models/daily-productions';
import { DeterministicForecastDataSchema, ForecastDataSchema, IForecastData } from '@src/models/forecast-data';
import { EconGroupSchema, IEconGroup } from '@src/models/econ-group';
import { EconRunSchema, IEconRun } from '@src/models/econ/econ-runs';
import { EconRunsDataSchema, IEconRunData } from '@src/models/econ/econ-run-data';
import { ForecastSchema, IForecast } from '@src/models/forecasts';
import { IMonthlyProduction, MonthlyProductionSchema } from '@src/models/monthly-productions';
import { IOwnershipQualifier, OwnershipQualifierSchema } from '@src/models/econ/ownership-qualifiers';
import { IProject, ProjectSchema } from '@src/models/projects';
import { IScenario, ScenarioSchema } from '@src/models/scenarios';
import { ITag, TagSchema } from '@src/models/tags';
import { ITypeCurve, ITypeCurveFit, TypeCurveFitSchema, TypeCurveSchema } from '@src/models/type-curve';
import { IUser, UserSchema } from '@src/models/users';
import { IWell, WellSchema } from '@src/models/wells';
import { IWellCommentBucket, WellCommentBucketSchema } from '@src/models/well-comments';
import { ICustomHeaderConfiguration } from '@src/models/custom-columns';
import { IScenarioWellAssignments } from '@src/models/scenario-well-assignments';
import { IWellDirectionalSurvey } from '@src/models/well-directional-surveys';

export interface IModelSet {
	AssumptionModel: Model<IBaseEconModel>;
	AccessPolicyModel: Model<IAccessPolicy>;
	WellModel: Model<IWell>;
	MonthlyProductionModel: Model<IMonthlyProduction>;
	DailyProductionModel: Model<IDailyProduction>;
	ProjectModel: Model<IProject>;
	ForecastModel: Model<IForecast>;
	ProbabilisticForecastDataModel: Model<IForecastData>;
	DeterministicForecastDataModel: Model<IForecastData>;
	ScenarioModel: Model<IScenario>;
	EconGroupModel: Model<IEconGroup>;
	EconRunModel: Model<IEconRun>;
	EconRunDataModel: Model<IEconRunData>;
	OwnershipQualifierModel: Model<IOwnershipQualifier>;
	TagModel: Model<ITag>;
	TypeCurveModel: Model<ITypeCurve>;
	TypeCurveFitModel: Model<ITypeCurveFit>;
	WellCommentBucketModel: Model<IWellCommentBucket>;
	WellDirectionalSurvey: Model<IWellDirectionalSurvey>;
	UserModel: Model<IUser>;
	ScenarioWellAssignmentsModel: Model<IScenarioWellAssignments>;
	CustomHeaderConfigurationModel: Model<ICustomHeaderConfiguration>;
}

export const registerModels = (connection: Connection): IModelSet => ({
	AssumptionModel: connection.model('assumptions', AssumptionSchema),
	AccessPolicyModel: connection.model('access-policies', AccessPolicySchema),
	MonthlyProductionModel: connection.model('monthly-productions', MonthlyProductionSchema),
	DailyProductionModel: connection.model('daily-productions', DailyProductionSchema),
	ProjectModel: connection.model('projects', ProjectSchema),
	ForecastModel: connection.model('forecasts', ForecastSchema),
	ProbabilisticForecastDataModel: connection.model('forecast-datas', ForecastDataSchema),
	DeterministicForecastDataModel: connection.model('deterministic-forecast-datas', DeterministicForecastDataSchema),
	ScenarioModel: connection.model('scenarios', ScenarioSchema),
	EconGroupModel: connection.model('econ-groups', EconGroupSchema),
	EconRunModel: connection.model('econ-runs', EconRunSchema),
	EconRunDataModel: connection.model('econ-runs-datas', EconRunsDataSchema),
	OwnershipQualifierModel: connection.model('ownership-qualifiers', OwnershipQualifierSchema),
	TagModel: connection.model('tags', TagSchema),
	TypeCurveModel: connection.model('type-curves', TypeCurveSchema),
	TypeCurveFitModel: connection.model('type-curve-fits', TypeCurveFitSchema),
	WellCommentBucketModel: connection.model('well-comments', WellCommentBucketSchema),
	WellModel: connection.model('wells', WellSchema),
	WellDirectionalSurvey: connection.model('well-directional-surveys', WellDirectionalSurveySchema),
	UserModel: connection.model('users', UserSchema),
	ScenarioWellAssignmentsModel: connection.model('scenario-well-assignments', ScenarioWellAssignmentSchema),
	CustomHeaderConfigurationModel: connection.model('custom-header-configurations', CustomHeaderConfigurationSchema),
});
