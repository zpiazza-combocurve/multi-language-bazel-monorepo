import { Slider, SliderProps } from '@material-ui/core';
import _ from 'lodash';
import { useMemo, useRef } from 'react';

import { useDerivedState } from './hooks';

function useThrottle(fn, timeout = 500) {
	const fnRef = useRef(fn);
	fnRef.current = fn;
	return useMemo(() => _.throttle((...params) => fnRef.current(...params), timeout), [timeout]);
}

const DEFAULT_THROTTLE = 250;

function useThrottledState<T, F>(state: T, setState: F, timeout = DEFAULT_THROTTLE) {
	const [debouncedValue, setValue] = useDerivedState(state);
	const debouncedSetState = useThrottle(setState, timeout);
	const setAll = (value: T) => {
		debouncedSetState(value);
		setValue(value);
	};
	return [debouncedValue, setAll] as const;
}

export default function ThrottledSlider({
	value: value_,
	onChange: onChange_,
	throttle = DEFAULT_THROTTLE,
	...props
}: SliderProps & { throttle?: number }) {
	const [value, onChange] = useThrottledState(
		value_,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(newValue) => onChange_?.(undefined as any, newValue),
		throttle
	);
	return <Slider {...props} value={value} onChange={(ev, newValue) => onChange(newValue)} />;
}
