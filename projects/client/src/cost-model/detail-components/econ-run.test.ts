import { act, renderHook } from '@testing-library/react-hooks';

import { useSingleWellEconRun } from '@/cost-model/detail-components/econ-run';
import * as economicsShared from '@/economics/shared/shared';
import * as alertsShared from '@/helpers/alerts';

vi.mock('@/economics/shared/shared');
vi.mock('@/helpers/alerts');
vi.mock('@/scenarios/api');

describe('useSingleWellEconRun', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	test('runs economics mutation and updates the state correctly', async () => {
		const scenarioId = 'scenarioId';
		const wellAssignments = [{ wellAssignmentId: 'testWellAssignmentId' }];
		const settings = 'mockSettings';
		const results = { monthly: {}, oneLiner: {} };

		const runEconomicsMutationMock = vi.fn().mockResolvedValue(results);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		economicsShared.useQuickEconRunMutation.mockReturnValue({
			runEconomicsMutation: { mutateAsync: runEconomicsMutationMock },
		});
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		alertsShared.confirmationAlert.mockImplementation(() => {});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		const { result, waitForNextUpdate } = renderHook(() => useSingleWellEconRun({ scenarioId }));

		act(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			result.current.runEconomics(wellAssignments, settings);
		});

		await waitForNextUpdate();

		expect(runEconomicsMutationMock).toHaveBeenCalledWith({
			scenarioId,
			wellAssignments,
			settings,
		});
		expect(result.current.econRun).toEqual(results);
		expect(result.current.visibility).toBe('open');
		expect(alertsShared.confirmationAlert).toHaveBeenCalledWith('Economics successfully ran');
	});
});
