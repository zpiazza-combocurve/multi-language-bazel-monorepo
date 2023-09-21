import { UseQueryResult } from 'react-query';

import { ChartSettings } from '@/forecasts/charts/useChartSettings';

export type ManualMode = 'auto' | 'manual' | 'typecurve';

export interface SeriesItem {
	collection: string;
	x?: string;
	y: string;
}

// TODO: clean up props; unify props to make them easily exportable; consider separating them by type
export interface SharedChartProps {
	enableVerticalControls?: boolean;
	enableXMinMax?: boolean;
	enableYMinMax?: boolean;
	forecastId?: string;
	maxControlsHeight?: string;
	phase?: string;
	selectable?: boolean;
	wellId: string;
}

export interface PreviewChartProps extends SharedChartProps {
	// shared props
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	chartData?: any;
	chartId?: string;
	chartSettings: ChartSettings;
	comparisonActive: boolean;
	comparisonIds: Array<string>;
	comparisonResolutions: Array<string>;
	enableCard?: boolean;
	enableComparison?: boolean;
	enableDownload?: boolean;
	seriesItems: Array<SeriesItem>;
	setComparisonProps?: (value) => void;

	// auto-reforeast
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	autoProps?: any;

	// manual
	loading?: boolean;
	manualSetOnForm?: () => void;
	onControlsBlur?: (value) => void;
	onControlsFocus?: (value) => void;
}

export interface EditingChartProps extends SharedChartProps {
	// shared props
	chartSettings: ChartSettings;
	mode: ManualMode;
	resolution?: string;
	setChartSettings: (value) => void;

	// auto-reforecast
	allowDataSelection?: boolean;
	allowDateSelection?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	autoProps?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	chartData?: any;
	enableReforecast?: boolean;
	seriesItems?: Array<SeriesItem>;
	proximityActive?: boolean;
	proximityBgNormalization?: Array<number>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	proximitySeriesSelections?: Array<any>;
	proximityQuery?: UseQueryResult;

	// manual
	basePhase?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	baseSeries?: Array<any>;
	forecastType?: string;
	loading?: boolean;
	onControlsBlur?: (value) => void;
	onControlsFocus?: (value) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wellData?: any;

	// type-curve
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	production?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	pSeries?: Array<any>;
	type?: 'deterministic' | 'probabilistic';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	typeProps?: any;
}
