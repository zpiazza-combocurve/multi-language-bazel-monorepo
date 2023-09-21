import produce from 'immer';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { SCALE_LABEL_FONT_COLOR } from '@/helpers/zing';

import AxisControl from './ScaleControlZingchart/AxisControl';
import Zingchart, { ZingchartProps } from './Zingchart';

interface Item {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	label: string;
}

interface ScaleProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	min: any;
	minItems: Item[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	max: any;
	maxItems: Item[];
}

export function useScale({
	minItems,
	maxItems,
	min = minItems[0].value,
	max = maxItems[maxItems.length - 1].value,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	min?: any;
	minItems: Item[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	max?: any;
	maxItems: Item[];
}) {
	const [scale, setScale] = useState({ minItems, maxItems, min, max });
	const handleChange = useCallback(
		(values: Pick<ScaleProps, 'min' | 'max'>) => setScale((p) => ({ ...p, ...values })),
		[]
	);
	return [scale, handleChange] as const;
}

const LegendText = styled.span`
	color: ${SCALE_LABEL_FONT_COLOR};
	font-family: 'K2D';
	font-size: 1rem;
`;

const getScale = (scale: ScaleProps | undefined) =>
	scale
		? {
				'min-value': Number.isFinite(scale.min) ? scale.min : undefined,
				'max-value': Number.isFinite(scale.max) ? scale.max : undefined,
				label: { text: '' },
		  }
		: undefined;

/**
 * Extends `Zingchart` component by adding axis min/max selection
 *
 * @example
 * 	import ScaleControlZingchart from '@/components';
 *
 * 	const items = [0, 10, 100].map((value) => ({ value, label: value.toString() }));
 * 	const [scaleX, setScaleX] = ScaleControlZingchart.useScale({ maxItems: items, minItems: item });
 * 	const [scaleY, setScaleY] = ScaleControlZingchart.useScale({ maxItems: items, minItems: item });
 *
 * 	<ScaleControlZingchart
 * 		scaleX={scaleX}
 * 		onChangeScaleX={setScaleX}
 * 		scaleY={scaleY}
 * 		onChangeScaleY={setScaleY}
 * 		// the rest of the data is the same as `Zingchart` props
 * 		data={{}}
 * 	/>;
 */
export default function ScaleControlZingchart({
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
	onChangeScaleX?(newValue: Pick<ScaleProps, 'min' | 'max'>): void;
	scaleY?: ScaleProps;
	onChangeScaleY?(newValue: Pick<ScaleProps, 'min' | 'max'>): void;
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
					height: 100%;
					position: relative;
					& > *:not(:first-child) {
						margin-left: 1.6rem;
					}
				`}
			>
				{scaleY && (
					<div
						css={`
							display: flex;
							height: 100%;
							position: absolute;
							display: flex;
							flex-direction: column;
							justify-content: space-between;
							& > * {
								transform-origin: top left;
								transform: rotate(-90deg) translateX(-50%);
								text-align: center;
								&:first-child {
									transform: rotate(-90deg) translateX(-100%);
								}
								&:last-child {
									transform: rotate(-90deg);
								}
							}
						`}
					>
						<AxisControl
							items={scaleY.maxItems}
							value={scaleY.max}
							onChange={(newValue) => onChangeScaleY?.({ ...scaleY, max: newValue })}
						/>
						<LegendText>{data?.scaleY?.label?.text}</LegendText>
						<AxisControl
							items={scaleY.minItems}
							value={scaleY.min}
							onChange={(newValue) => onChangeScaleY?.({ ...scaleY, min: newValue })}
						/>
					</div>
				)}
				<Zingchart css='flex: 1' {...props} data={newData} />
			</div>
			{scaleX && (
				<div css='display: flex; justify-content: space-between;'>
					<AxisControl
						items={scaleX.minItems}
						value={scaleX.min}
						onChange={(newValue) => onChangeScaleX?.({ ...scaleX, min: newValue })}
					/>
					<LegendText>{data?.scaleX?.label?.text}</LegendText>
					<AxisControl
						items={scaleX.maxItems}
						value={scaleX.max}
						onChange={(newValue) => onChangeScaleX?.({ ...scaleX, max: newValue })}
					/>
				</div>
			)}
		</div>
	);
}

ScaleControlZingchart.useScale = useScale;
