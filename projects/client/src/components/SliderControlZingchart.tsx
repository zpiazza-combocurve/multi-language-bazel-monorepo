import { Slider } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash';
import { useMemo } from 'react';

import Zingchart, { ZingchartProps } from './Zingchart';
import { useDerivedState } from './hooks/useDerivedState';

interface ScaleProps {
	min: number;
	max: number;
	value: [number, number];
}

export function useScale({
	min,
	max,
	value: initialValue = [min, max],
}: {
	value?: [number, number];
	min: number;
	max: number;
}) {
	const [value, setValue] = useDerivedState(() => initialValue, [initialValue?.[0], initialValue?.[1]]);
	return [{ min, max, value }, setValue] as const;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useValuesScale(values: any[], { iteratee = _.identity as any } = {}) {
	const it = _.iteratee(iteratee);
	return useScale({
		min: 0,
		max: it(_.maxBy(values, it)),
	});
}

const getScale = (scale: ScaleProps | undefined) =>
	scale ? { 'min-value': scale.value[0], 'max-value': scale.value[1] } : undefined;

/**
 * Extends `Zingchart` component by adding axis min/max slider range selection
 *
 * @example
 * 	import { SliderControlZingchart } from '@/components';
 *
 * 	// values from zingchart.series.value
 * 	const values = [
 * 		// x, y
 * 		[10, 23],
 * 		[17, 60],
 * 	];
 * 	const [scaleX, setScaleX] = SliderControlZingchart.useValuesScale(values, { iteratee: '0' });
 * 	const [scaleY, setScaleY] = SliderControlZingchart.useValuesScale(values, { iteratee: '1' });
 *
 * 	<SliderControlZingchart
 * 		scaleX={scaleX}
 * 		onChangeScaleX={setScaleX}
 * 		scaleY={scaleY}
 * 		onChangeScaleY={setScaleY}
 * 		// the rest of the data is the same as `Zingchart` props
 * 		data={{ series: [{ values }] }}
 * 	/>;
 */
export default function SliderControlZingchart({
	data,
	scaleX,
	onChangeScaleX,
	scaleY,
	onChangeScaleY,
	id,
	className,
	...props
}: ZingchartProps & {
	scaleX?: ScaleProps;
	onChangeScaleX?(newValue: [number, number]): void;
	scaleY?: ScaleProps;
	onChangeScaleY?(newValue: [number, number]): void;
}) {
	const newData = useMemo(
		() => produce(data, (draft) => _.merge(draft, { scaleX: getScale(scaleX), scaleY: getScale(scaleY) })),
		[data, scaleX, scaleY]
	);

	return (
		<div
			className={className}
			id={id}
			css={`
				display: flex;
				flex-direction: column;
				height: 100%;
				width: 100%;
			`}
		>
			<div
				css={`
					display: flex;
					flex: 1;
				`}
			>
				{scaleY && (
					<Slider
						css={`
							margin: 0.5rem 0 0;
							height: calc(100% - 0.5rem);
						`}
						orientation='vertical'
						{...scaleY}
						onChange={(ev, newValue) => onChangeScaleY?.(newValue as [number, number])}
					/>
				)}
				<Zingchart css='flex: 1;' {...props} data={newData} />
			</div>
			{scaleX && (
				<Slider
					css={`
						margin: 0 2rem 0.5rem 3rem;
						width: calc(100% - 5rem);
					`}
					{...scaleX}
					onChange={(ev, newValue) => onChangeScaleX?.(newValue as [number, number])}
				/>
			)}
		</div>
	);
}

SliderControlZingchart.useScale = useScale;
SliderControlZingchart.useValuesScale = useValuesScale;
