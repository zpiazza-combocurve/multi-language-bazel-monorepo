/**
 * @file This Is used to extend some components like react-data-grid with hooks that are called conditionally depending
 *   on props passed, eg selection
 */
import _ from 'lodash';
import * as React from 'react';

// Experimental spaghetti code ahead

// allow using hooks "conditionally"
export function withModifiedProps<PO, PN extends PO>(
	Component: React.ComponentType<PO>,
	condition: (props: PN) => boolean,
	mapper: (props: PN) => Partial<PO>
) {
	function NewComponent(props: PN) {
		return <Component {...props} {...mapper(props)} />;
	}
	return (props: PN) => {
		if (condition(props)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			return <NewComponent {...props} />;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component {...props} />;
	};
}

// no better name?
// similar to `withModifiedProps` but with a list of modifiers instead of just 1
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function withExtraProps<PN, PO = any>(
	Component: React.ComponentType<PO>,
	...modifiers
): // ...modifiers: [condition: (props: PN) => boolean, mapper: (props: PN) => Partial<PO>][]
React.ComponentType<PN> {
	// there is no complete type safety here
	return _.flowRight(
		...modifiers.map(
			([condition, mapper]) =>
				(component) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					withModifiedProps(component, condition as any, mapper as any)
		)
	)(Component);
}
