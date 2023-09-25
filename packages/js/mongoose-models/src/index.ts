/* eslint-disable @typescript-eslint/no-explicit-any */
// any is used temporally, replace with actual types
import type { Facility, Network, NodeModel } from '@combocurve/types/server';
import { schemas } from 'combocurve-utils/mongo';
import type { Connection } from 'mongoose';

export type MongooseModels = ReturnType<typeof registerModels>;

export function registerModels(db: Connection) {
	return {
		ApiCredentialModel: db.model<any>('api-credentials', schemas.ApiCredentialSchema),
		ArchivedProjectModel: db.model<any>('archived-projects', schemas.ArchivedProjectSchema),
		AssumptionModel: db.model<any>('assumptions', schemas.AssumptionSchema),
		CreateWellsTemplateModel: db.model<any>('create-wells-templates', schemas.CreateWellsTemplateSchema),
		CustomHeaderConfigurationModel: db.model<any>(
			'custom-header-configurations',
			schemas.CustomHeaderConfigurationSchema
		),
		DailyProductionModel: db.model<any>('daily-productions', schemas.DailyProductionSchema),
		DailyStreamDataModel: db.model<any>('daily-stream-datas', schemas.DailyStreamDataSchema),
		DataImportMappingModel: db.model<any>('file-import-mappings', schemas.DataImportMappingSchema),
		DeterministicForecastDataModel: db.model<any>(
			'deterministic-forecast-datas',
			schemas.DeterministicForecastDataSchema
		),
		EconGroupModel: db.model<any>('econ-groups', schemas.EconGroupSchema),
		EconGroupDefaultUserConfigurationModel: db.model<any>(
			'econ-group-default-user-configurations',
			schemas.EconGroupDefaultUserConfigurationSchema
		),
		EconReportExportConfigurationModel: db.model<any>(
			'econ-report-export-configurations',
			schemas.EconReportExportConfigurationSchema
		),
		EconReportExportDefaultUserConfigurationModel: db.model<any>(
			'econ-report-export-default-user-configurations',
			schemas.EconReportExportDefaultUserConfigurationSchema
		),
		EconPDFReportExportConfigurationModel: db.model<any>(
			'econ-pdf-report-export-configurations',
			schemas.EconPDFReportExportConfigurationSchema
		),
		EconPDFReportExportDefaultUserConfigurationModel: db.model<any>(
			'econ-pdf-report-export-default-user-configurations',
			schemas.EconPDFReportExportDefaultUserConfigurationSchema
		),
		EconComboSettingModel: db.model<any>('econ-combo-settings', schemas.EconComboSettingSchema),
		EconRunModel: db.model<any>('econ-runs', schemas.EconRunSchema),
		GhgRunModel: db.model<any>('ghg-runs', schemas.GhgRunSchema),
		EconGroupConfigurationModel: db.model<any>('econ-group-configurations', schemas.EconGroupConfigurationSchema),
		EconRunsDataModel: db.model<any>('econ-runs-datas', schemas.EconRunsDataSchema),
		EconSettingModel: db.model<any>('econ-settings', schemas.EconSettingSchema),
		EconReportSettingModel: db.model<any>('econ-report-settings', schemas.EconReportSettingSchema),
		EconVisualizationSetupModel: db.model<any>('econ-visualization-setups', schemas.EconVisualizationSetupSchema),
		FileImportModel: db.model<any>('file-imports', schemas.FileImportSchema),
		FileModel: db.model<any>('files', schemas.FileSchema),
		FilterSettingModel: db.model<any>('filter-settings', schemas.FilterSettingSchema),
		FilterModel: db.model<any>('filters', schemas.FilterSchema),
		ForecastBucketModel: db.model<any>('forecast-buckets', schemas.ForecastBucketSchema),
		ForecastConfigurationModel: db.model<any>('forecast-configurations', schemas.ForecastConfigurationSchema),
		ForecastDataModel: db.model<any>('forecast-datas', schemas.ForecastDataSchema),
		ForecastExportModel: db.model<any>('forecast-exports', schemas.ForecastExportSchema),
		ForecastLookupTableModel: db.model<any>('forecast-lookup-tables', schemas.ForecastLookupTableSchema),
		ForecastModel: db.model<any>('forecasts', schemas.ForecastSchema),
		ForecastRollUpRunModel: db.model<any>('forecast-roll-up-runs', schemas.ForecastRollUpRunSchema),
		ForecastWellAssignmentModel: db.model<any>('forecast-well-assignments', schemas.ForecastWellAssignmentSchema),
		HeatmapSettingModel: db.model<any>('heatmap-settings', schemas.HeatmapSettingSchema),
		LookupTableModel: db.model<any>('lookup-tables', schemas.LookupTableSchema),
		MapHeaderModel: db.model<any>('map-headers', schemas.MapHeaderSchema),
		MonthlyProductionModel: db.model<any>('monthly-productions', schemas.MonthlyProductionSchema),
		MonthlyStreamDataModel: db.model<any>('monthly-stream-datas', schemas.MonthlyStreamDataSchema),
		NotificationModel: db.model<any>('notifications', schemas.NotificationSchema),
		OwnershipQualifierModel: db.model<any>('ownership-qualifiers', schemas.OwnershipQualifierSchema),
		PasswordlessTokenModel: db.model<any>('passwordless-tokens', schemas.PasswordlessTokenSchema),
		ProjectCustomHeadersDataModel: db.model<any>(
			'project-custom-headers-datas',
			schemas.ProjectCustomHeadersDataSchema
		),
		ProjectCustomHeaderModel: db.model<any>('project-custom-headers', schemas.ProjectCustomHeaderSchema),
		ProjectModel: db.model<any>('projects', schemas.ProjectSchema),
		ProximityForecastDataModel: db.model<any>('proximity-forecast-datas', schemas.ProximityForecastDataSchema),
		RollUpGroupsModel: db.model<any>('roll-up-groups', schemas.RollUpGroupSchema),
		ScenarioModel: db.model<any>('scenarios', schemas.ScenarioSchema),
		ScenarioWellAssignmentModel: db.model<any>('scenario-well-assignments', schemas.ScenarioWellAssignmentSchema),
		ScenRollUpRunModel: db.model<any>('scen-roll-up-runs', schemas.ScenRollUpRunSchema),
		ScheduleConstructionModel: db.model<any>('schedule-constructions', schemas.ScheduleConstructionSchema),
		ScheduleModel: db.model<any>('schedules', schemas.ScheduleSchema),
		ScheduleSettingModel: db.model<any>('schedule-settings', schemas.ScheduleSettingSchema),
		ScheduleInputQualifiersModel: db.model<any>('schedule-input-qualifiers', schemas.ScheduleInputQualifiersSchema),
		ScheduleWellOutputModel: db.model<any>('schedule-well-outputs', schemas.ScheduleWellOutputSchema),
		ScheduleLookupTableModel: db.model<any>('schedule-lookup-tables', schemas.ScheduleLookupTableSchema),
		SessionModel: db.model<any>('sessions', schemas.SessionSchema),
		ShapefileModel: db.model<any>('shapefiles', schemas.ShapefileSchema),
		SortingModel: db.model<any>('sortings', schemas.SortingSchema),
		DefaultUserSortingModel: db.model<any>('default-users-sortings', schemas.DefaultUserSortingSchema),
		StreamModel: db.model<any>('streams', schemas.StreamSchema),
		StreamWellAssignmentModel: db.model<any>('stream-well-assignments', schemas.StreamWellAssignmentSchema),
		TaskModel: db.model<any>('tasks', schemas.TaskSchema),
		TypeCurveFitModel: db.model<any>('type-curve-fits', schemas.TypeCurveFitSchema),
		TypeCurveModel: db.model<any>('type-curves', schemas.TypeCurveSchema),
		TypeCurveNormalizationModel: db.model<any>('type-curve-normalizations', schemas.TypeCurveNormalizationSchema),
		TypeCurveNormalizationWellModel: db.model<any>(
			'type-curve-normalization-wells',
			schemas.TypeCurveNormalizationWellSchema
		),
		TypeCurveUmbrellaModel: db.model<any>('type-curve-umbrellas', schemas.TypeCurveUmbrellaSchema),
		TypeCurveWellAssignmentModel: db.model<any>(
			'type-curve-well-assignments',
			schemas.TypeCurveWellAssignmentSchema
		),
		UserModel: db.model<any>('users', schemas.UserSchema),
		AccessPolicyModel: db.model<any>('access-policies', schemas.AccessPolicySchema),
		GroupModel: db.model<any>('groups', schemas.GroupSchema),
		WellDirectionalSurveyModel: db.model<any>('well-directional-surveys', schemas.WellDirectionalSurveySchema),
		WellIdentifiersValidationResultModel: db.model<any>(
			'well-identifiers-validation-results',
			schemas.WellIdentifiersValidationResultSchema
		),
		WellModel: db.model<any>('wells', schemas.WellSchema),
		CompanyForecastSettingModel: db.model<any>('company-forecast-settings', schemas.CompanyForecastSettingSchema),
		WellCommentBucketModel: db.model<any>('well-comments', schemas.WellCommentBucketSchema),
		TagModel: db.model<any>('tags', schemas.TagSchema),
		NetworkModel: db.model<Network>('networks', schemas.NetworkSchema),
		FacilityModel: db.model<Facility>('facilities', schemas.FacilitySchema),
		NodeModel: db.model<NodeModel>('node-models', schemas.NodeModelSchema),
		ModularEconomicsConfigurationModel: db.model<any>(
			'modular-economics-configurations',
			schemas.ModularEconomicsConfigurationSchema
		),
		EmbeddedLookupTableModel: db.model<any>('embedded-lookup-tables', schemas.EmbeddedLookupTableSchema),
	};
}

export function registerSharedModels(sharedDb: Connection) {
	return {
		ApiTenantModel: sharedDb.model<any>('api-tenants', schemas.ApiTenantSchema),
		QueueModel: sharedDb.model<any>('queues', schemas.QueueSchema),
		ShareableCodeImportModel: sharedDb.model<any>('shareable-code-imports', schemas.ShareableCodeImportSchema),
		ShareableCodeModel: sharedDb.model<any>('shareable-codes', schemas.ShareableCodeSchema),
	};
}
