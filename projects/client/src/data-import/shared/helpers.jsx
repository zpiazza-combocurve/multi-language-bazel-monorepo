import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';

import { projectRoutes } from '@/projects/routes';

export function usePagePath() {
	const { pathname = '' } = useMatch(`${projectRoutes.project(':id').dataImports}/*`) ?? {};
	const match = useMatch(`${pathname}/:step`);
	const { params: { step } = {} } = match ?? {};
	return { pathname, step };
}

export function useStepRedirect(status, stepOptions) {
	const navigate = useNavigate();
	const { step } = usePagePath();

	const [statusToIndex, stepToIndex] = useMemo(() => {
		const _statusToIndex = {};
		const _stepToIndex = {};
		stepOptions.forEach(({ status: statuses, path }, index) =>
			statuses.forEach((stat) => {
				_statusToIndex[stat] = index;
				_stepToIndex[path] = index;
			})
		);
		return [_statusToIndex, _stepToIndex];
	}, [stepOptions]);

	const lastStepIndex = statusToIndex[status] ?? stepOptions.length;

	const prevStatusRef = useRef(status);

	const getStep = useCallback(
		(stat) => stepOptions[statusToIndex[stat]]?.path || 'upload',
		[statusToIndex, stepOptions]
	);

	const currentStepIndex = stepToIndex[step];
	const prevStatus = prevStatusRef.current;
	const currentStep = getStep(status);
	const prevStep = getStep(prevStatus);

	useEffect(() => {
		if (!step || (prevStatus && prevStep !== currentStep) || currentStepIndex > lastStepIndex) {
			navigate(`${currentStep}`, { replace: true });
		}
		prevStatusRef.current = status;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentStep, currentStepIndex, lastStepIndex, prevStatus, prevStep, status, step]);

	return useMemo(
		() =>
			stepOptions?.map((_, index) => ({
				disabled: index > lastStepIndex,
				completed: index < lastStepIndex,
				onNext: () => navigate(`${stepOptions[index + 1]?.path}`, { replace: true }),
			})),
		[navigate, lastStepIndex, stepOptions]
	);
}
