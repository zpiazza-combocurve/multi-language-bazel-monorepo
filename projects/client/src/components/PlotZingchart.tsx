import * as React from 'react';
import { ElementRef, ForwardedRef } from 'react';

import RawZingchart from '@/components/RawZingchart';
import { ZingchartData } from '@/helpers/zing';

import Zingchart from './Zingchart';

type ZCSerie = NonNullable<ZingchartData['series']>[number];

const ZingchartContext = React.createContext<{ seriesRef: React.MutableRefObject<ZCSerie[]> } | null>(null);

/**
 * Abstraction over Zingchart component to allow defining plots using jsx syntax, it's kind of a hack, like the old
 * Zingchart component
 *
 * @deprecated No actual gains
 */
export const PlotZingchart = React.forwardRef(
	(
		{
			children,
			data,
			...props
		}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		React.PropsWithChildren<Omit<React.ComponentProps<typeof Zingchart>, 'series'>> & { children: any },
		ref: ForwardedRef<ElementRef<typeof RawZingchart>>
	) => {
		const stateRef = React.useRef('initial');
		const seriesRef = React.useRef<ZCSerie[]>([]);
		const [series, setSeries] = React.useState<ZCSerie[]>([]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
		React.useEffect(() => {
			if (stateRef.current === 'initial') {
				stateRef.current = 'render';
				setSeries(seriesRef.current);
			} else if (stateRef.current === 'render') {
				stateRef.current = 'initial';
				seriesRef.current = [];
			}
		});

		return (
			// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
			<ZingchartContext.Provider value={{ seriesRef }}>
				<Zingchart ref={ref} {...props} data={{ ...data, series }} />
				{stateRef.current === 'initial' && children}
			</ZingchartContext.Provider>
		);
	}
);

export function Plot(props: ZCSerie & { dataIgnoreSelection?: boolean }) {
	const { seriesRef } = React.useContext(ZingchartContext) ?? {};
	React.useEffect(() => {
		seriesRef?.current.push({ ...props }); // needs props spreading for some reason, breaks without it, saw some getters inspecting the object
	});
	return null;
}
