"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSharedModels = exports.registerModels = void 0;
const mongo_1 = require("combocurve-utils/mongo");
const mongoose_1 = __importDefault(require("mongoose"));
const paginate_aggregation_plugin_1 = require("./helpers/paginate-aggregation-plugin");
// Global Plugin
mongoose_1.default.plugin(paginate_aggregation_plugin_1.paginateAggregationPlugin);
const registerModels = (db) => ({
    ArchivedProjectModel: db.model('archived-projects', mongo_1.schemas.ArchivedProjectSchema),
    AssumptionModel: db.model('assumptions', mongo_1.schemas.AssumptionSchema),
    CustomHeaderConfigurationModel: db.model('custom-header-configurations', mongo_1.schemas.CustomHeaderConfigurationSchema),
    DailyProductionModel: db.model('daily-productions', mongo_1.schemas.DailyProductionSchema),
    DailyStreamDataModel: db.model('daily-stream-datas', mongo_1.schemas.DailyStreamDataSchema),
    DataImportMappingModel: db.model('file-import-mappings', mongo_1.schemas.DataImportMappingSchema),
    DeterministicForecastDataModel: db.model('deterministic-forecast-datas', mongo_1.schemas.DeterministicForecastDataSchema),
    EconComboSettingModel: db.model('econ-combo-settings', mongo_1.schemas.EconComboSettingSchema),
    EconRunModel: db.model('econ-runs', mongo_1.schemas.EconRunSchema),
    EconRunsDataModel: db.model('econ-runs-datas', mongo_1.schemas.EconRunsDataSchema),
    EconSettingModel: db.model('econ-settings', mongo_1.schemas.EconSettingSchema),
    EconReportSettingModel: db.model('econ-report-settings', mongo_1.schemas.EconReportSettingSchema),
    EconVisualizationSetupModel: db.model('econ-visualization-setups', mongo_1.schemas.EconVisualizationSetupSchema),
    FileImportModel: db.model('file-imports', mongo_1.schemas.FileImportSchema),
    FileModel: db.model('files', mongo_1.schemas.FileSchema),
    FilterSettingModel: db.model('filter-settings', mongo_1.schemas.FilterSettingSchema),
    FilterModel: db.model('filters', mongo_1.schemas.FilterSchema),
    ForecastBucketModel: db.model('forecast-buckets', mongo_1.schemas.ForecastBucketSchema),
    ForecastConfigurationModel: db.model('forecast-configurations', mongo_1.schemas.ForecastConfigurationSchema),
    ForecastDataModel: db.model('forecast-datas', mongo_1.schemas.ForecastDataSchema),
    ForecastExportModel: db.model('forecast-exports', mongo_1.schemas.ForecastExportSchema),
    ForecastLookupTableModel: db.model('forecast-lookup-tables', mongo_1.schemas.ForecastLookupTableSchema),
    ForecastModel: db.model('forecasts', mongo_1.schemas.ForecastSchema),
    ForecastRollUpRunModel: db.model('forecast-roll-up-runs', mongo_1.schemas.ForecastRollUpRunSchema),
    ForecastWellAssignmentModel: db.model('forecast-well-assignments', mongo_1.schemas.ForecastWellAssignmentSchema),
    HeatmapSettingModel: db.model('heatmap-settings', mongo_1.schemas.HeatmapSettingSchema),
    LookupTableModel: db.model('lookup-tables', mongo_1.schemas.LookupTableSchema),
    MapHeaderModel: db.model('map-headers', mongo_1.schemas.MapHeaderSchema),
    MonthlyProductionModel: db.model('monthly-productions', mongo_1.schemas.MonthlyProductionSchema),
    MonthlyStreamDataModel: db.model('monthly-stream-datas', mongo_1.schemas.MonthlyStreamDataSchema),
    NotificationModel: db.model('notifications', mongo_1.schemas.NotificationSchema),
    OwnershipQualifierModel: db.model('ownership-qualifiers', mongo_1.schemas.OwnershipQualifierSchema),
    PasswordlessTokenModel: db.model('passwordless-tokens', mongo_1.schemas.PasswordlessTokenSchema),
    ProjectCustomHeadersDataModel: db.model('project-custom-headers-datas', mongo_1.schemas.ProjectCustomHeadersDataSchema),
    ProjectCustomHeaderModel: db.model('project-custom-headers', mongo_1.schemas.ProjectCustomHeaderSchema),
    ProjectModel: db.model('projects', mongo_1.schemas.ProjectSchema),
    RollUpGroupsModel: db.model('roll-up-groups', mongo_1.schemas.RollUpGroupSchema),
    ScenarioModel: db.model('scenarios', mongo_1.schemas.ScenarioSchema),
    ScenarioWellAssignmentModel: db.model('scenario-well-assignments', mongo_1.schemas.ScenarioWellAssignmentSchema),
    ScenRollUpRunModel: db.model('scen-roll-up-runs', mongo_1.schemas.ScenRollUpRunSchema),
    ScheduleConstructionModel: db.model('schedule-constructions', mongo_1.schemas.ScheduleConstructionSchema),
    ScheduleModel: db.model('schedules', mongo_1.schemas.ScheduleSchema),
    ScheduleSettingModel: db.model('schedule-settings', mongo_1.schemas.ScheduleSettingSchema),
    ScheduleUmbrellaDataModel: db.model('schedule-umbrella-datas', mongo_1.schemas.ScheduleUmbrellaDataSchema),
    ScheduleUmbrellaModel: db.model('schedule-umbrellas', mongo_1.schemas.ScheduleUmbrellaSchema),
    ScheduleWellAssignmentModel: db.model('schedule-well-assignments', mongo_1.schemas.ScheduleWellAssignmentSchema),
    ScheduleWellOutputModel: db.model('schedule-well-outputs', mongo_1.schemas.ScheduleWellOutputSchema),
    SessionModel: db.model('sessions', mongo_1.schemas.SessionSchema),
    ShapefileModel: db.model('shapefiles', mongo_1.schemas.ShapefileSchema),
    SortingModel: db.model('sortings', mongo_1.schemas.SortingSchema),
    DefaultUserSortingModel: db.model('default-users-sortings', mongo_1.schemas.DefaultUserSortingSchema),
    StreamModel: db.model('streams', mongo_1.schemas.StreamSchema),
    StreamWellAssignmentModel: db.model('stream-well-assignments', mongo_1.schemas.StreamWellAssignmentSchema),
    TaskModel: db.model('tasks', mongo_1.schemas.TaskSchema),
    TypeCurveFitModel: db.model('type-curve-fits', mongo_1.schemas.TypeCurveFitSchema),
    TypeCurveModel: db.model('type-curves', mongo_1.schemas.TypeCurveSchema),
    TypeCurveNormalizationModel: db.model('type-curve-normalizations', mongo_1.schemas.TypeCurveNormalizationSchema),
    TypeCurveNormalizationWellModel: db.model('type-curve-normalization-wells', mongo_1.schemas.TypeCurveNormalizationWellSchema),
    TypeCurveUmbrellaModel: db.model('type-curve-umbrellas', mongo_1.schemas.TypeCurveUmbrellaSchema),
    TypeCurveWellAssignmentModel: db.model('type-curve-well-assignments', mongo_1.schemas.TypeCurveWellAssignmentSchema),
    UserModel: db.model('users', mongo_1.schemas.UserSchema),
    AccessPolicyModel: db.model('access-policies', mongo_1.schemas.AccessPolicySchema),
    WellModel: db.model('wells', mongo_1.schemas.WellSchema),
    CompanyForecastSettingModel: db.model('company-forecast-settings', mongo_1.schemas.CompanyForecastSettingSchema),
    WellCommentBucketModel: db.model('well-comments', mongo_1.schemas.WellCommentBucketSchema),
    TagModel: db.model('tags', mongo_1.schemas.TagSchema),
});
exports.registerModels = registerModels;
const registerSharedModels = (sharedDb) => ({
    QueueModel: sharedDb.model('queues', mongo_1.schemas.QueueSchema),
    ShareableCodeImportModel: sharedDb.model('shareable-code-imports', mongo_1.schemas.ShareableCodeImportSchema),
    ShareableCodeModel: sharedDb.model('shareable-codes', mongo_1.schemas.ShareableCodeSchema),
    FeatureFlagsModel: sharedDb.model('feature-flags', mongo_1.schemas.FeatureFlagsSchema),
});
exports.registerSharedModels = registerSharedModels;
//# sourceMappingURL=models.js.map