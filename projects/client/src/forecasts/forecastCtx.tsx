import React from 'react';

type ForecastContext = {
	loadingRun: boolean;
	setLoadingRun?: (a: boolean) => void;
};

export const ForecastContext = React.createContext<ForecastContext>({
	loadingRun: false,
	setLoadingRun: undefined,
});
