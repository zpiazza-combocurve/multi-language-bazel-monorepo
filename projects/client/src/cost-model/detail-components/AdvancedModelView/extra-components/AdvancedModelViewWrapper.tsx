import { Placeholder } from '@/components';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';

interface AdvancedModelViewWrapperProps {
	children: JSX.Element;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useTemplate: (...args: any[]) => any;
}

export function AdvancedModelViewWrapper(props: AdvancedModelViewWrapperProps) {
	const { children, useTemplate } = props;
	const { project } = useAlfa();

	assert(project, 'Expected project to be in context');

	const { templateQuery } = useTemplate(project._id);

	if (templateQuery.isLoading) {
		return <Placeholder loading main text='Preparing model' />;
	}

	if (templateQuery.isError) {
		return <Placeholder loading main error='Error loading model' />;
	}

	return children;
}
