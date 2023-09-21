namespace ForecastExport {
	type Phase = 'oil' | 'gas' | 'water';
	type Ratio = 'gas/oil' | 'oil/water' | 'oil/gas' | 'water/gas' | 'gas/water' | 'water/oil';
	type Pressure =
		| 'bottom_hole_pressure'
		| 'gas_lift_injection_pressure'
		| 'tubing_head_pressure'
		| 'flowline_pressure'
		| 'casing_head_pressure'
		| 'vessel_separator_pressure';
	export interface ForecastExportSettings {
		include: boolean;
		start: string;
		end: string;
		pSeries: string[];
	}

	export interface ProductionExportSettings {
		include: boolean;
		start: string;
		end: string;
		exportPressure: boolean;
	}

	export interface ChartsExportSettings {
		include: boolean;
		dataSettings: {
			xAxis: 'time' | 'relative_idx' | 'cumsum_oil' | 'cumsum_gas' | 'cumsum_water' | 'mbt' | 'mbt_filtered';
			monthly: Array<Phase | Ratio>;
			daily: Array<Phase | Ratio | Pressure>;
			forecast: Array<Phase | Ratio>;
		};
		graphSettings: {
			enableLegend: boolean;
			numOfCharts: 1 | 2 | 4 | 6 | 8;
			xLogScale: boolean;
			xPadding: number;
			yLogScale: boolean;
			yMax: number;
			yMaxPadding: number;
			yMin: number;
			yPadding: number;
			chartResolution: number;
			yearsBefore: number | 'all';
			yearsPast: number | 'all';
			cumMin: number | 'all';
			cumMax: number | 'all';
		};
	}

	export interface Settings {
		productionMonthly?: ProductionExportSettings;
		productionDaily?: ProductionExportSettings;
		forecastMonthly?: ForecastExportSettings;
		forecastDaily?: ForecastExportSettings;
	}

	export namespace Create {
		export interface RequestPayload {
			wells?: string[];
			settings: Settings;
		}
		export interface ResponsePayload {
			task: string;
			message: string;
			forecastExport: ForecastExport;
		}
	}
}

interface ForecastExport {
	_id: string;
	forecast: string;
	status: 'pending' | 'complete' | 'failed';
	wells: string[];
	createdBy: string;
	createdAt: string | { _id: string; firstName: string; lastName: string };
	updatedAt: string;
	productionMonthly?: { settings: ForecastExport.ProductionExportSettings; file: string };
	productionDaily?: { settings: ForecastExport.ProductionExportSettings; file: string };
	forecastMonthly?: { settings: ForecastExport.ForecastExportSettings; file: string };
	forecastDaily?: { settings: ForecastExport.ForecastExportSettings; file: string };
	charts?: { settings: ForecastExport.ChartsExportSettings; file: string };
}

interface FileDocument {
	_id: string;
	name: string;
	gcpName: string;
	type: string;
	bSize: number;
	mbSize: number;
	createdAt: string;
}
