import { createContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_CHART_WELL_HEADERS } from '@/forecasts/charts/components/graphProperties';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { Configuration } from '@/forecasts/configurations/configurations';

type IChartHeaderContext = {
	chartHeaders: Configuration[];
	headers: string[];
	projectChartHeaders: Configuration[];
	projectHeaders: string[];
	setChartHeaders: (headers: Configuration[]) => void;
	setProjectChartHeaders: (headers: Configuration[]) => void;
	showConfigDialog: (newConfig: Configuration, isValidConfig?: boolean) => void;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
const ChartHeaderContext = createContext<IChartHeaderContext>(undefined!);

export const defaultChartHeaders: Configuration[] = DEFAULT_CHART_WELL_HEADERS.map((header) => ({
	field: header,
	selected: false,
}));

const ChartHeaderProvider = ({ children }: { children: React.ReactNode }) => {
	const { activeConfig, dialog, showConfigDialog } = useConfigurationDialog({
		key: 'forecastChartHeaders',
		title: 'Chart Header Configurations',
	});

	const [chartHeaders, setChartHeaders] = useState(defaultChartHeaders);
	const [projectChartHeaders, setProjectChartHeaders] = useState<Configuration[]>([]);

	const contextObj = useMemo(
		() => ({
			chartHeaders,
			headers: chartHeaders.map((header) => header.field),
			projectChartHeaders,
			projectHeaders: projectChartHeaders.map((header) => header.field),
			setChartHeaders,
			setProjectChartHeaders,
			showConfigDialog,
		}),
		[chartHeaders, projectChartHeaders, showConfigDialog]
	);

	useEffect(() => {
		if (activeConfig?.length) {
			setChartHeaders(activeConfig as Configuration[]);
		}
	}, [activeConfig]);

	return (
		<>
			<ChartHeaderContext.Provider value={contextObj}>{children}</ChartHeaderContext.Provider>
			{dialog}
		</>
	);
};

export default ChartHeaderProvider;
export { ChartHeaderContext };
