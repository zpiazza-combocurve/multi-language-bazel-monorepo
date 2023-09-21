import { capitalize } from 'lodash';
import { useCallback, useMemo } from 'react';

import { XLogScaleSwitch } from '@/components';
import { Divider, SubMenuItem, SwitchItem } from '@/components/v2';
import { ListItem, VALID_CUMS } from '@/forecasts/charts/components/graphProperties';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import {
	CumMaxAxisControlSelection,
	CumMinAxisControlSelection,
	XAxisSubMenu,
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
} from '@/forecasts/shared';

const ManualChartOptionsSubMenuItem = ({
	chartSettings,
	enableUnitResolution,
	label,
	setChartSettings,
	xAxisItems,
}: {
	chartSettings: ChartSettings;
	enableUnitResolution?: boolean;
	label: string;
	setChartSettings: (value) => void;
	xAxisItems: ListItem[];
}) => {
	const { xAxis = 'time', unitResolution } = chartSettings;
	const register = useCallback(
		(key) => ({
			value: chartSettings[key],
			onChange: (value) => setChartSettings({ [key]: value }),
		}),
		[chartSettings, setChartSettings]
	);

	const xAxisRegister = useMemo(() => {
		const registerObj = register('xAxis');
		const originalOnChange = registerObj.onChange;

		return {
			...registerObj,
			onChange: (value) => {
				originalOnChange(value);
				if (value.includes('mbt')) {
					if (!chartSettings.xLogScale) {
						setChartSettings({ xLogScale: true });
					}
					if (!chartSettings.yLogScale) {
						setChartSettings({ yLogScale: true });
					}
				}
			},
		};
	}, [chartSettings.xLogScale, chartSettings.yLogScale, register, setChartSettings]);

	return (
		<SubMenuItem label={label}>
			{[...VALID_CUMS, 'mbt', 'mbt_filtered'].includes(xAxis) ? (
				<>
					<CumMinAxisControlSelection {...register('cumMin')} />
					<CumMaxAxisControlSelection {...register('cumMax')} />
				</>
			) : (
				<>
					<YearsBeforeAxisControlSelection {...register('yearsBefore')} />
					<YearsPastAxisControlSelection {...register('yearsPast')} />
				</>
			)}

			<YMaxAxisControlSelection {...register('yMax')} />
			<YMinAxisControlSelection {...register('yMin')} />

			<XAxisSubMenu {...xAxisRegister} items={xAxisItems} />

			<Divider />

			<SwitchItem label='Production Line Scatter' {...register('lineScatter')} />

			<SwitchItem label='Y-Axis Log Scale' {...register('yLogScale')} />

			<XLogScaleSwitch xAxis={xAxis} {...register('xLogScale')} />

			{enableUnitResolution && (
				<SwitchItem
					label={`Unit Resolution (${capitalize(unitResolution)})`}
					onChange={(checked) => setChartSettings({ unitResolution: checked ? 'daily' : 'monthly' })}
					value={unitResolution === 'daily'}
				/>
			)}

			<SwitchItem label='Enable Monthly Operations' {...register('enableMonthlyOperations')} />

			<SwitchItem label='Enable Daily Operations' {...register('enableDailyOperations')} />

			<SwitchItem label='Legend' {...register('enableLegend')} />
		</SubMenuItem>
	);
};

export default ManualChartOptionsSubMenuItem;
