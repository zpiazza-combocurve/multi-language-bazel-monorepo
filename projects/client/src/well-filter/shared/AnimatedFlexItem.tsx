import { ReactNode } from 'react';

import TransitionComponent, { TransitionComponentProps } from './TransitionComponent';

interface AnimatedFlexItemProps extends Pick<TransitionComponentProps, 'className' | 'visible' | 'component'> {
	children?: ReactNode;
}

/**
 * Will add an animation transition for hiding/showing the element. Intended to work in a flex container
 *
 * @example
 * 	<AnimatedFlexItem css={{ flex: 1 }} visible={toggled} component={Paper}>
 * 		content
 * 	</AnimatedFlexItem>;
 */
function AnimatedFlexItem({ children, ...props }: AnimatedFlexItemProps) {
	return (
		<TransitionComponent
			hidingStyles={{ flexGrow: 0, minHeight: 0, overflow: 'hidden' }}
			hidenStyles={{ display: 'none' }}
			{...props}
		>
			{(visible) => visible && children}
		</TransitionComponent>
	);
}

export default AnimatedFlexItem;
