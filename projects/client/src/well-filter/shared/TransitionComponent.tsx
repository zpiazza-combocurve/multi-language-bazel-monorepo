import { CSSProperties, useEffect, useState } from 'react';

import { RenderProp, renderProp } from '@/components/shared';

export interface TransitionComponentProps {
	visible?: boolean;
	children?: RenderProp<boolean>;
	className?: string;
	component?: React.ElementType<React.HTMLAttributes<HTMLElement>>; // actually only need `className`, `style` and `onTransitionEnd` properties from the component
	hidingStyles?: CSSProperties;
	hidenStyles?: CSSProperties;
}

/**
 * Will add an animation transition for hiding/showing the element. Intended to work in a flex container
 *
 * @example
 * 	<TransitionComponent css={{ flex: 1 }} visible={toggled} component={Paper}>
 * 		{(visible) => visible && <>content</>}
 * 	</TransitionComponent>;
 */
function TransitionComponent({
	visible = false,
	className,
	children,
	component: Component = 'div',
	hidenStyles,
	hidingStyles,
}: TransitionComponentProps) {
	const [currentVisible, setCurrentVisible] = useState(visible);

	useEffect(() => {
		if (visible) {
			setCurrentVisible(visible);
		}
	}, [visible]);

	return (
		<Component
			style={{
				...(visible && currentVisible ? {} : hidingStyles),
				...(visible || currentVisible ? {} : hidenStyles),
				transition: 'all 200ms',
			}}
			className={className}
			onTransitionEnd={() => {
				setCurrentVisible(visible);
			}}
		>
			{renderProp(children, currentVisible)}
		</Component>
	);
}

export default TransitionComponent;
