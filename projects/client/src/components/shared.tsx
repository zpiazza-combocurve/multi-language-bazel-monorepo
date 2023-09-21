import _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import { StoreApi, UseBoundStore } from 'zustand';
import { shallow } from 'zustand/shallow';

import { useFormikField } from './hooks/useFormikField';
import { useId } from './hooks/useId';
import { TooltipedLabel } from './tooltipped';

/** Optional render prop, eg can be a function or just a plain element */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type RenderProp<T = any> = React.ReactNode | ((args: T) => JSX.Element);

/**
 * Handle optional render prop
 *
 * @example
 * 	function RenderPropComponent(props: { children: RenderProp<{ values }> }) {
 * 		const [state, setState] = useState({});
 * 		return <>{renderProps(props.children, { values: state })}</>;
 * 	}
 *
 * 	<RenderPropComponent>{({ values }) => <>hello</>}</RenderPropComponent>;
 * 	<RenderPropComponent>hello</RenderPropComponent>;
 */
export function renderProp<T>(val: RenderProp<T>, props: T) {
	if (typeof val === 'function') {
		return val(props);
	}
	return val;
}

const Label = styled.label`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

/** Will add display name for react dev tools. From https://react-typescript-cheatsheet.netlify.app/docs/hoc/full_example */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function addHOCName<P>(WrappedComponent: P, name: string, Component: React.ElementType<any>) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const displayName = Component.displayName || Component.name || 'Component';
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	WrappedComponent.displayName = `${name}(${displayName})`;
	return WrappedComponent;
}

/** Will provide the component with a fake `id` if it doesn't have any */
export function withFakeId<P extends { id? }>(Component: React.ElementType<P>) {
	type ComponentExProps = Assign<P, { id?: string }>;
	function ComponentEx({ id, ...props }: ComponentExProps, ref) {
		const fakeId = useId();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} id={id ?? fakeId} {...props} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withFakeId', Component);
}

/**
 * Will add two more properties (`inlineLabel` and `inlineTooltip`), if `inlineLabel` is true it will place the label in
 * the same line instead of the top, useful to save vertical size. `inlineTooltip` is the tooltip for the label info
 * icon
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function withInlineLabel<P extends { label?: any }>(Component: React.ElementType<P>) {
	type ComponentExProps = P & { inlineLabel?: boolean; inlineTooltip?: string };
	function ComponentEx({ inlineLabel, inlineTooltip, label, ...props }: ComponentExProps, ref) {
		if (inlineLabel && label) {
			return (
				<Label>
					<TooltipedLabel labelTooltip={inlineTooltip}>{label}</TooltipedLabel>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
					{/* @ts-expect-error */}
					<Component ref={ref} {...props} />
				</Label>
			);
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} label={label} {...props} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withInlineLabel', Component);
}

/** @deprecated Use formik-fields and controls from @/components/v2 */
export function withFormikField<P>(Component: React.ElementType<P>) {
	function ComponentEx(props: P, ref) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const overrideProps = useFormikField(props);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} {...props} {...overrideProps} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withFormikField', Component);
}

export type WithDefaultProps<P, PP extends Partial<P>> = Omit<P, keyof PP> & Partial<PP>;

/** Will add default props to the component */
export function withDefaultProps<P, PP extends Partial<P>>(Component: React.ElementType<P>, defaultProps: PP) {
	function ComponentEx(props: WithDefaultProps<P, PP>, ref) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} {...defaultProps} {...props} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withDefaultProps', Component);
}

export interface ValidateProps {
	type?: string;
	required?: boolean;
	min?: number;
	max?: number;
	isInteger?: boolean;
}

export function isValidInteger(value, required) {
	if (Number.isFinite(value) && !Number.isInteger(value)) {
		return 'Must be an integer';
	}
	if (!Number.isFinite(value) && required) {
		return 'This field is required';
	}
	return '';
}

export function getValidateFn({
	type = 'text',
	required,
	min = Number.NEGATIVE_INFINITY,
	max = Number.POSITIVE_INFINITY,
	isInteger: requiresInteger = false,
}: ValidateProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return (value: any) => {
		if (required) {
			if (value === '') {
				return 'This field is required';
			}
			if (type === 'number') {
				if (!Number.isFinite(Number(value))) {
					return 'This field is required';
				}
			} else if (!value) {
				return 'This field is required';
			}
		}
		if (type === 'number' && value !== '') {
			if (Number(value) < min) {
				return `Cannot be less than ${min}`;
			}
			// keep the string representation of the number (e.g. 1e9 vs 1000000000)
			if (typeof max === 'string' && Number(value) > Number(max)) {
				return `Cannot be more than ${max}`;
			}
			if (Number(value) > max) {
				return `Cannot be more than ${max}`;
			}
		}
		if (requiresInteger) {
			return isValidInteger(value, required);
		}
		return undefined;
	};
}

/**
 * Will keep the function reference the same to the component, useful for optimization
 *
 * @example
 * 	const Component = ({ value, onChange }) => <>implementation goes here, onChange is a callback</>;
 * 	const OptimizedComponent = withCallbacksRef(React.memo(Component), ['onChange']);
 *
 * 	const [value, setValue] = useState({});
 *
 * 	// subsequent renders will cause a rerender in the component because onChange is a new function every time
 * 	<Component value={value} onChange={(value) => setValue(value)} />;
 * 	// subsequent renders will not cause a rerender in the component
 * 	<OptimizedComponent value={value} onChange={(value) => setValue(value)} />;
 *
 * 	// also similar to the useCallbackRef hook
 * 	const handleChange = useCallbackRef((value) => setValue(value + 1));
 * 	<Component value={value} onChange={handleChange} />;
 *
 * @note use with care
 */
export function withCallbacksRef<P>(Component: React.ComponentType<P>, callbackKeys: (keyof P)[]) {
	function ComponentEx(props: P, ref) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const callbacksRef = React.useRef<Record<any, any>>({});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const callbackProps = _.transform(callbackKeys, (acc: any, key) => {
			callbacksRef.current[key] = props[key];
			const actualIsFunc = typeof callbacksRef.current[key] === 'function';
			/* eslint-disable */
			acc[key] = React.useMemo(
				() => (actualIsFunc ? (...props) => callbacksRef.current[key](...props) : undefined),
				[actualIsFunc]
			);
			if (typeof acc[key] !== 'function') {
				delete acc[key];
			}
			/* eslint-enable */
		});
		return <Component ref={ref} {...props} {...callbackProps} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withCallbacksRef', Component);
}

/**
 * Inject hook to a component, useful for react class components where hooks are unavailable
 *
 * @example
 * 	function useToggleNavbar() {
 * 		const { setVisible } = useContext(NavBarContext);
 * 		const toggleNavbar = () => {
 * 			setVisible((p) => !p);
 * 		};
 * 		return { toggleNavbar };
 * 	}
 *
 * 	class MyComponent extends React.Component {
 * 		render() {
 * 			const { toggleNavbar } = this.props;
 * 			return <button onClick={toggleNavbar}>toggle navbar</button>;
 * 		}
 * 	}
 *
 * 	const MyComponentWithToggle = withHook(MyComponent, useToggleNavbar); // will send toggleNavbar through the props
 *
 * 	<MyComponentWithToggle />;
 */
export function withHook<P, PP extends Omit<P, keyof R>, HR, R = HR>(
	Component: React.ElementType<P>,
	useHook: (props: PP) => HR,
	selector: (hookReturn: HR) => R = _.identity
) {
	function ComponentEx(props: PP, ref) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} {...props} {...selector(useHook(props))} />;
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withHook', Component);
}

/**
 * Connect zustand with react class component
 *
 * @example
 * 	import { create } from 'zustand';
 *
 * 	const useStore = create((set) => ({ color: 'blue' }));
 *
 * 	class MyComponent extends React.Component {
 * 		render() {
 * 			const { color } = this.props;
 * 			return <div>{color}</div>;
 * 		}
 * 	}
 *
 * 	const MyComponentWithZustand = withZustandStore(MyComponent, useStore, (state) => ({ color: state.color }));
 *
 * 	<MyComponent />; // error: color is not defined, will display undefined
 * 	<MyComponentWithZustand />; // will display 'blue'
 */
export function withZustandStore<P, T extends object, U = T>(
	Component: React.ElementType<P>,
	useStore: UseBoundStore<StoreApi<T>>,
	selector: (s: T) => U = _.identity
) {
	return withHook(Component, () => useStore(selector, shallow));
}

/**
 * Like React.memo but with more functionality to improve performance (uses withCallbackRefs underneath to prevent
 * callbacks to cause rerenders)
 *
 * @example
 * 	const TextFieldMemo = memoEx(TextField, { callbacks: ['onChange'] });
 *
 * 	<TextFieldMemo value={value} onChange={(ev) => setValue(ev.target.value)} />; // TextField is not rerendered unless value changes
 */
export function memoEx<P>(
	Component: React.ComponentType<P>,
	options: {
		/** @note these properties should be functions */
		callbacks: (keyof P)[];
	}
): React.ComponentType<P> {
	const { callbacks } = options;
	return withCallbacksRef(React.memo(Component), callbacks) as React.ComponentType<P>;
}

export const Separator = styled.div`
	width: 1px;
	background: ${({ theme }) => theme.palette.divider};
	align-self: stretch;
`;
