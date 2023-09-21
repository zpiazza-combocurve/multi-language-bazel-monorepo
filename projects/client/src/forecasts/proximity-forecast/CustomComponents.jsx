import { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import selection from '@/components/ReactDataGrid/selection';
import { useDerivedState } from '@/components/hooks';
import { Box } from '@/components/v2';
import { ifProp, theme } from '@/helpers/styled';
import { CardsLayoutContext } from '@/layouts/CardsLayout';

import CollapseHeader from './CollapseHeader';
import ProximityChartContainer from './ProximityChartContainer';
import { FilterForm } from './filter/FilterForm';
import ProximityFit from './fit/ProximityFit';
import NormalizationForm from './normalize/ProximityNormForm';

const VerticalDivider = styled.div`
	border-left: 1px solid ${theme.borderColor};
`;

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div role='tabpanel' hidden={value !== index} {...other} css='width: 100%; height: 100%'>
			{value === index && (
				<Box p={3} css='width: 100%; height: 100%; padding: .5rem'>
					{children}
				</Box>
			)}
		</div>
	);
}

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: grid;
	${(props) => `grid-template-columns: ${props.fullWidth ? '100%' : '49.5% auto 49.5%'};`}
	grid-template-rows: 100%;
`;

const ClosingPanel = styled.div`
	display: ${ifProp('visible', 'block', 'none')};
	max-width: none;
	overflow: hidden;
	overflow-y: ${ifProp('disableOverFlow', 'none', 'auto')};
	transition: width 0.3s, max-height 0.3s;
	width: 100%;
`;

const TwoPanelLayout = ({
	activeSelectedForecastRef,
	currentTab,
	displayCharts,
	fitProps,
	forecastId,
	isCollapsed,
	isMinimized,
	normalizationProps,
	setHasRun,
	setDisplayCharts,
	setProximityMergedStates,
	setForecastSegmentsCallback,
	wellId,
}) => {
	const count = isMinimized ? 1 : 2; // TODO check if this is safe, will a phony children mess up the count?
	const [singleChartMaximized, setSingleChartMaximised] = useDerivedState(null, [count]);

	const toggleMaximized = useCallback(
		(value) => setSingleChartMaximised((prev) => (prev === value ? null : value)),
		[setSingleChartMaximised]
	);

	useEffect(() => {
		if (singleChartMaximized) setDisplayCharts(true);
	}, [singleChartMaximized, setDisplayCharts]);

	const cardLayoutContextProps = useMemo(
		() => ({ maximized: singleChartMaximized, toggleMaximized, count }),
		[singleChartMaximized, toggleMaximized, count]
	);

	const displayFormSection = !((isMinimized || isCollapsed) && displayCharts) && !singleChartMaximized;

	const displayChartSection = displayCharts || !isCollapsed;
	const displayDivider = !isMinimized && !isCollapsed && !singleChartMaximized;

	return (
		<CardsLayoutContext.Provider value={cardLayoutContextProps}>
			<Container fullWidth={isMinimized || isCollapsed || singleChartMaximized}>
				<ClosingPanel isMinimized={isMinimized} visible={displayFormSection}>
					<TabPanel value={currentTab} index={0}>
						<FilterForm
							activeSelectedForecastRef={activeSelectedForecastRef}
							forecastId={forecastId}
							setHasRun={setHasRun}
							setProximityMergedStates={setProximityMergedStates}
							wellId={wellId}
						/>
					</TabPanel>
					<TabPanel value={currentTab} index={1}>
						<NormalizationForm {...normalizationProps} />
					</TabPanel>
					<TabPanel value={currentTab} index={2}>
						<ProximityFit {...fitProps} setForecastSegmentsCallback={setForecastSegmentsCallback} />
					</TabPanel>
				</ClosingPanel>

				{displayDivider && <VerticalDivider />}

				<ClosingPanel isMinimized={isMinimized} disableOverFlow visible={displayChartSection}>
					<ProximityChartContainer
						chartMaximized={singleChartMaximized || isMinimized}
						fitProps={fitProps}
						isMinimized={isMinimized}
						normalizationProps={normalizationProps}
						selection={selection}
					/>
				</ClosingPanel>
			</Container>
		</CardsLayoutContext.Provider>
	);
};

export { CollapseHeader, TwoPanelLayout, VerticalDivider };
