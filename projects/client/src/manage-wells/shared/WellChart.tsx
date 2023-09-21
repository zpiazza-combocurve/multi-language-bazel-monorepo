import { useMemo, useState } from 'react';

import { WithToolbar } from '@/components';
import Zingchart from '@/components/Zingchart';
import { ButtonGroupSelect } from '@/components/misc/ButtonGroupSelect';
import { titleize } from '@/helpers/text';
import { convertIdxToMilli, phaseColors } from '@/helpers/zing';

import { getProductionUnit, useWellsProductionMap } from './utils';

export default function WellChart(props: { wells: string[] }) {
	const { wells } = props;

	const [resolution, setResolution] = useState<'monthly' | 'daily'>('monthly');
	const wellDataQuery = useWellsProductionMap(wells, resolution);

	const aggregatedData = useMemo(() => {
		const result: Record<number, { oil: number; gas: number; water: number; daysInMonth: number }> = {};

		if (wellDataQuery.data) {
			for (const wellData of wellDataQuery.data) {
				wellData.index.forEach((idx, i) => {
					result[idx] ??= { oil: 0, gas: 0, water: 0, daysInMonth: 0 };
					result[idx].oil += wellData.oil[i] ?? 0;
					result[idx].gas += wellData.gas[i] ?? 0;
					result[idx].water += wellData.water[i] ?? 0;
					result[idx].daysInMonth = wellData?.daysInMonthArray?.[i] ?? 1;
				});
			}
		}

		return result;
	}, [wellDataQuery.data]);

	const series = useMemo(() => {
		const getPlot = (phase: string) => {
			const { unit } = getProductionUnit(phase, resolution);
			const convertMtoD = resolution === 'monthly' && unit.toLowerCase().includes('/d');

			const values = Object.entries(aggregatedData).map(([idx, phases]) => [
				convertIdxToMilli(idx),
				convertMtoD ? phases[phase] / phases.daysInMonth : phases[phase],
			]);

			return {
				text: `${titleize(phase)} (${unit})`,
				values,
				lineColor: phaseColors[phase],
				marker: { backgroundColor: phaseColors[phase] },
			};
		};

		return [getPlot('oil'), getPlot('gas'), getPlot('water')].filter(Boolean);
	}, [aggregatedData, resolution]);

	return (
		<WithToolbar
			left={
				<ButtonGroupSelect
					items={[
						{ value: 'monthly', label: 'Monthly' },
						{ value: 'daily', label: 'Daily' },
					]}
					onChange={setResolution}
					value={resolution}
				/>
			}
			fullWidth
			fullHeight
		>
			<Zingchart
				data={{
					type: 'line',
					utc: true,
					timeZone: -8,
					scaleX: Zingchart.SCALE.MONTHLY,
					scaleY: Zingchart.SCALE.LOG,
					legend: { visible: true },
					series,
					plotarea: { marginRight: '40rem' },
				}}
			/>
		</WithToolbar>
	);
}
