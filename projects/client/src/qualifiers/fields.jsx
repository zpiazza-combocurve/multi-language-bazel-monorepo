import { AssumptionKey } from '@/inpt-shared/constants';

export const QUALIFIER_FIELDS = {
	[AssumptionKey.reservesCategory]: 'Reserves Category',
	[AssumptionKey.dates]: 'Dates',
	[AssumptionKey.ownershipReversion]: 'Ownership & Reversion',
	[AssumptionKey.forecast]: 'Forecast',
	[AssumptionKey.forecastPSeries]: 'P-Series',
	[AssumptionKey.carbonNetwork]: 'Carbon Network',
	[AssumptionKey.schedule]: 'Schedule',
	[AssumptionKey.capex]: 'CAPEX',
	[AssumptionKey.pricing]: 'Pricing',
	[AssumptionKey.differentials]: 'Differentials',
	[AssumptionKey.streamProperties]: 'Stream Properties',
	[AssumptionKey.expenses]: 'Expenses',
	[AssumptionKey.productionTaxes]: 'Production Taxes',
	[AssumptionKey.productionVsFit]: 'Actual or Forecast',
	[AssumptionKey.risking]: 'Risking',
	[AssumptionKey.emission]: 'Emission',
};
