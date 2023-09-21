import produce, { enableMapSet } from 'immer';
import { ComponentType, Fragment, ReactNode } from 'react';
import { create } from 'zustand';

import { WithDefaultProps } from '@/components/shared';

import { counter } from './Counter';

enableMapSet();

interface GlobalComponentsStore {
	components: Map<string, ReactNode>;
	addComponent: (component: ReactNode | ((unmout: () => void) => ReactNode)) => void;
}

const useGlobalComponentsStore = create<GlobalComponentsStore>((set) => ({
	components: new Map(),
	addComponent: (componentRender) => {
		const key = counter.nextId('cc-global-component');

		const unmount = () =>
			set(
				produce((state: GlobalComponentsStore) => {
					state.components.delete(key);
				})
			);

		const component = typeof componentRender === 'function' ? componentRender(unmount) : componentRender;

		set(
			produce((state: GlobalComponentsStore) => {
				state.components.set(key, component);
			})
		);
	},
}));

/**
 * Mounts a given component globally in the `GlobalComponentsHandler` component, useful for dialogs, alerts and other
 * temporal components
 *
 * @example
 * 	onClick = () => {
 * 		dispatchComponent((unmout) => (
 * 			<Dialog onClose={unmount} open>
 * 				Content
 * 			</Dialog>
 * 		));
 * 	};
 */
export const dispatchComponent = useGlobalComponentsStore.getState().addComponent;

// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export function withDispatchComponent<P extends object, K extends keyof P, PP extends Partial<P> = {}>(
	Component: ComponentType<P>,
	options: { closeProp: K },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	extraProps: PP = {} as any as PP
) {
	const { closeProp } = options;
	type Props = WithDefaultProps<P, PP>;
	// TODO wrap in hoc helpers to give it a debug name, forward ref, etc.
	return (props: Omit<Props, K>) =>
		dispatchComponent((unmount) => (
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			<Component {...extraProps} {...props} {...{ [closeProp]: unmount }} />
		));
}

/**
 * Allows mouting componnets with a function call from everywhere
 *
 * Extracted from dialog helpers functions
 *
 * @note there should only be one in the whole app
 */
export function GlobalComponentsHandler() {
	const components = useGlobalComponentsStore((store) => store.components);
	return (
		<>
			{[...components.entries()].map(([key, component]) => (
				<Fragment key={key}>{component}</Fragment>
			))}
		</>
	);
}
