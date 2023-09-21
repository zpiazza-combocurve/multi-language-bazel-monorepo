import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { RenderProp, renderProp } from './shared';

const DEFAULT_TIMEOUT = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function useThrottledValue<T = any>(value: T, delay = DEFAULT_TIMEOUT) {
	const [throttledValue, _setThrottledValue] = useState(value);
	const setThrottledValue = useMemo(() => _.throttle(_setThrottledValue, delay), [delay]);

	useEffect(() => {
		return () => {
			setThrottledValue.cancel();
		};
	}, [delay, setThrottledValue]);

	useEffect(() => {
		setThrottledValue(value);
	}, [setThrottledValue, value]);

	return throttledValue;
}

interface ThrottledValueProps<T> {
	value: T;
	delay?: number;
	children: RenderProp<T>;
}

/**
 * Wrapper over useThrottledValue for classes and such to prevent expensive calculations
 *
 * @example
 * 	<ThrottledValue value={data}>{(throttledData) => <Zingchart data={data} />}</ThrottledValue>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function ThrottledValue<T = any>({ value, delay, children }: ThrottledValueProps<T>) {
	return renderProp(children, useThrottledValue(value, delay));
}

export default ThrottledValue;
