import { useStepRedirect } from '@/data-import/shared/helpers';
import { RoutedTabsLayout } from '@/layouts/TabsLayout';

export function StepManager({ header, status, steps = [], sharedProps = {} }) {
	const stepProps = useStepRedirect(status, steps);
	return (
		<RoutedTabsLayout
			header={header}
			tabs={steps.map(({ component: Component, ...step }, index) => {
				const { disabled, completed, onNext } = stepProps[index];
				return {
					disabled,
					...step,
					render: (props) =>
						disabled ? null : <Component {...props} {...sharedProps} {...{ completed, onNext }} />,
				};
			})}
		/>
	);
}
