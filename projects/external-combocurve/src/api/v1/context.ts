import { BigQuery } from '@google-cloud/bigquery';
import { Connection } from 'mongoose';

import { createBQLabels, initBigQueryClient, ITenantBigQueryLabels } from '@src/bigQuery';
import { createHeaders, ITenantHeaders } from '@src/headers';
import config from '@src/config';
import { EconRunService } from '@src/services/econ-runs-service';
import { ForecastVolumeService } from '@src/services/forecast-volume-service';
import { IBaseContext } from '@src/base-context';
import { ITenantInfo } from '@src/tenant';
import logger from '@src/helpers/logger';

import { IModelSet, registerModels } from './model-set';
import { ProjectBaseService, ProjectService } from './projects/service';
import { ActualForecastService } from './projects/econ-models/actual-forecast/service';
import { AriesForecastDataService } from './projects/forecasts/aries/service';
import { CapexService } from './projects/econ-models/capex/service';
import { CompanyDailyProductionService } from './daily-productions/service';
import { CompanyMonthlyProductionService } from './monthly-productions/service';
import { CompanyWellService } from './wells/service';
import { CustomColumnService } from './custom-columns/service';
import { DateSettingsService } from './projects/econ-models/date-settings/service';
import { DepreciationService } from './projects/econ-models/depreciation/service';
import { DifferentialsService } from './projects/econ-models/differentials/service';
import { DirectionalSurveysService } from './directional-surveys/service';
import { EconModelAssignmentService } from './projects/econ-models/assignments/service';
import { EconModelService } from './projects/econ-models/service';
import { EconMonthlyService } from './projects/scenarios/econ-runs/monthly-exports/service';
import { EconRunDataService } from './projects/scenarios/econ-runs/one-liners/service';
import { EmissionService } from './projects/econ-models/emissions/service';
import { EscalationService } from './projects/econ-models/escalations/service';
import { ExpensesService } from './projects/econ-models/expenses/service';
import { FluidModelService } from './projects/econ-models/fluid-models/service';
import { ForecastDataService } from './projects/forecasts/outputs/service';
import { ForecastParameterService } from './projects/forecasts/parameters/service';
import { ForecastService } from './projects/forecasts/service';
import { GeneralOptionsService } from './projects/econ-models/general-options/service';
import { OwnershipQualifierService } from './ownership-qualifiers/service';
import { OwnershipReversionService } from './projects/econ-models/ownership-reversions/service';
import { PricingService } from './projects/econ-models/pricing/service';
import { ProductionTaxesService } from './projects/econ-models/production-taxes/service';
import { ProjectCompanyWellService } from './projects/company-wells/service';
import { ProjectDailyProductionService } from './projects/daily-productions/service';
import { ProjectMonthlyProductionService } from './projects/monthly-productions/service';
import { ProjectWellService } from './projects/wells/service';
import { QualifiersService } from './projects/scenarios/qualifiers/service';
import { ReservesCategoryService } from './projects/econ-models/reserves-categories/service';
import { RiskingService } from './projects/econ-models/riskings/service';
import { ScenarioService } from './projects/scenarios/service';
import { ScenarioWellsService } from './projects/scenarios/well-assignments/service';
import { StreamPropertiesService } from './projects/econ-models/stream-properties/service';
import { TagsService } from './tags/service';
import { TypeCurveService } from './projects/type-curves/service';
import { WellCommentService } from './well-comments/service';
import { WellIdentifierService } from './wells/identifier/service';
import { WellMappingService } from './well-mappings/service';

export class ApiContextV1 implements IBaseContext {
	readonly bigQueryClient: BigQuery;
	readonly bigQueryLabels: ITenantBigQueryLabels;
	readonly headers: ITenantHeaders;
	readonly models: IModelSet;
	readonly tenant: ITenantInfo;

	// services (alphabetical order)
	readonly ariesForecastDataService: AriesForecastDataService;
	readonly capexService: CapexService;
	readonly companyDailyProductionService: CompanyDailyProductionService;
	readonly companyMonthlyProductionService: CompanyMonthlyProductionService;
	readonly companyWellService: CompanyWellService;
	readonly differentialsModelService: DifferentialsService;
	readonly econModelService: EconModelService;
	readonly econMonthlyService: EconMonthlyService;
	readonly dateSettingsService: DateSettingsService;
	readonly econRunDataService: EconRunDataService;
	readonly econRunService: EconRunService;
	readonly emissionService: EmissionService;
	readonly escalationService: EscalationService;
	readonly fluidModelService: FluidModelService;
	readonly forecastDataService: ForecastDataService;
	readonly forecastParameterService: ForecastParameterService;
	readonly forecastService: ForecastService;
	readonly forecastVolumeService: ForecastVolumeService;
	readonly ownershipQualifierService: OwnershipQualifierService;
	readonly ownershipReversionService: OwnershipReversionService;
	readonly projectBaseService: ProjectBaseService;
	readonly projectCompanyWellService: ProjectCompanyWellService;
	readonly projectDailyProductionService: ProjectDailyProductionService;
	readonly pricingModelService: PricingService;
	readonly projectMonthlyProductionService: ProjectMonthlyProductionService;
	readonly projectService: ProjectService;
	readonly projectWellService: ProjectWellService;
	readonly reservesCategoryService: ReservesCategoryService;
	readonly riskingService: RiskingService;
	readonly scenarioService: ScenarioService;
	readonly streamPropertiesService: StreamPropertiesService;
	readonly tagsService: TagsService;
	readonly typeCurvesService: TypeCurveService;
	readonly wellCommentService: WellCommentService;
	readonly wellMappingService: WellMappingService;
	readonly productionTaxesService: ProductionTaxesService;
	readonly expensesService: ExpensesService;
	readonly actualForecastModelService: ActualForecastService;
	readonly wellDirectionalSurveysService: DirectionalSurveysService;
	readonly depreciationService: DepreciationService;
	readonly generalOptionsModelService: GeneralOptionsService;
	readonly wellIdentifierService: WellIdentifierService;
	readonly qualifiersService: QualifiersService;
	readonly scenarioWellsService: ScenarioWellsService;
	readonly econModelAssignmentService: EconModelAssignmentService;
	readonly customColumnService: CustomColumnService;

	constructor(tenant: ITenantInfo, connection: Connection) {
		// base
		this.headers = createHeaders(tenant);

		try {
			// should we keep having the models nested? Could be more convenient for access if they are in the root of the context, like we do in Python
			this.models = registerModels(connection);
		} catch (error) {
			logger.error('Error registering context models', { tenant: tenant?.name, error });
			throw error;
		}

		this.tenant = tenant;

		try {
			this.bigQueryClient = initBigQueryClient(config.gcpPrimaryProjectId);
		} catch (error) {
			logger.error('Error initializing BigQuery client', { tenant: tenant?.name, error });
			throw error;
		}

		this.bigQueryLabels = createBQLabels(tenant);

		// services (alphabetical order)
		this.ariesForecastDataService = new AriesForecastDataService(this);
		this.capexService = new CapexService(this);
		this.companyDailyProductionService = new CompanyDailyProductionService(this);
		this.companyMonthlyProductionService = new CompanyMonthlyProductionService(this);
		this.companyWellService = new CompanyWellService(this);
		this.differentialsModelService = new DifferentialsService(this);
		this.econModelService = new EconModelService(this);
		this.econMonthlyService = new EconMonthlyService(this);
		this.econRunDataService = new EconRunDataService(this);
		this.econRunService = new EconRunService(this);
		this.emissionService = new EmissionService(this);
		this.escalationService = new EscalationService(this);
		this.fluidModelService = new FluidModelService(this);
		this.forecastDataService = new ForecastDataService(this);
		this.forecastParameterService = new ForecastParameterService(this);
		this.forecastService = new ForecastService(this);
		this.forecastVolumeService = new ForecastVolumeService(this);
		this.ownershipQualifierService = new OwnershipQualifierService(this);
		this.ownershipReversionService = new OwnershipReversionService(this);
		this.projectBaseService = new ProjectBaseService(this);
		this.projectCompanyWellService = new ProjectCompanyWellService(this);
		this.projectDailyProductionService = new ProjectDailyProductionService(this);
		this.pricingModelService = new PricingService(this);
		this.projectMonthlyProductionService = new ProjectMonthlyProductionService(this);
		this.projectService = new ProjectService(this);
		this.projectWellService = new ProjectWellService(this);
		this.reservesCategoryService = new ReservesCategoryService(this);
		this.riskingService = new RiskingService(this);
		this.scenarioService = new ScenarioService(this);
		this.streamPropertiesService = new StreamPropertiesService(this);
		this.tagsService = new TagsService(this);
		this.typeCurvesService = new TypeCurveService(this);
		this.wellCommentService = new WellCommentService(this);
		this.wellMappingService = new WellMappingService(this);
		this.wellIdentifierService = new WellIdentifierService(this);
		this.econModelService = new EconModelService(this);
		this.reservesCategoryService = new ReservesCategoryService(this);
		this.ownershipReversionService = new OwnershipReversionService(this);
		this.pricingModelService = new PricingService(this);
		this.productionTaxesService = new ProductionTaxesService(this);
		this.expensesService = new ExpensesService(this);
		this.actualForecastModelService = new ActualForecastService(this);
		this.wellDirectionalSurveysService = new DirectionalSurveysService(this);
		this.econModelService = new EconModelService(this);
		this.reservesCategoryService = new ReservesCategoryService(this);
		this.ownershipReversionService = new OwnershipReversionService(this);
		this.pricingModelService = new PricingService(this);
		this.depreciationService = new DepreciationService(this);
		this.productionTaxesService = new ProductionTaxesService(this);
		this.expensesService = new ExpensesService(this);
		this.actualForecastModelService = new ActualForecastService(this);
		this.dateSettingsService = new DateSettingsService(this);
		this.generalOptionsModelService = new GeneralOptionsService(this);
		this.qualifiersService = new QualifiersService(this);
		this.scenarioWellsService = new ScenarioWellsService(this);
		this.econModelAssignmentService = new EconModelAssignmentService(this);
		this.customColumnService = new CustomColumnService(this);
	}
}
