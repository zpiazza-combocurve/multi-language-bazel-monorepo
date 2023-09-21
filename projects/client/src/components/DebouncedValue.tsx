import { useDebouncedValue } from '@/helpers/debounce';

import { RenderProp, renderProp } from './shared';

interface DebouncedValueProps<T> {
	value: T;
	delay?: number;
	children: RenderProp<T>;
}

/**
 * Wrapper over useDebouncedValue for classes and such to prevent expensive calculations
 *
 * @example
 * 	<DebouncedValue value={data}>{(debouncedData) => <Zingchart data={data} />}</DebouncedValue>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function DebouncedValue<T = any>({ value, delay, children }: DebouncedValueProps<T>) {
	return renderProp(children, useDebouncedValue(value, delay));
}

export default DebouncedValue;
