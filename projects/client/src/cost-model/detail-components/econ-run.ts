import { createContext, useState } from 'react';

import { useQuickEconRunMutation } from '@/economics/shared/shared';
import { confirmationAlert } from '@/helpers/alerts';
import { useCurrentScenario } from '@/scenarios/api';

export function useSingleWellEconRun({ scenarioId }: { scenarioId?: Inpt.ObjectId<'scenario'> } = {}) {
	const [visibility, setVisibility] = useState<'closed' | 'open' | 'expanded'>('closed');

	const { runEconomicsMutation, loading, settings } = useQuickEconRunMutation();
	const [econRun, setEconRun] = useState(undefined as { monthly; oneLiner } | undefined);

	const runEconomics = async (
		wellAssignments?: Inpt.Api.Scenario.WellAssignmentBuild[],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		settings?: any,
		modular = false
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	): Promise<any> => {
		if (!scenarioId || !wellAssignments?.length) {
			return;
		}

		const results = await runEconomicsMutation.mutateAsync({ scenarioId, wellAssignments, settings });

		const { monthly, oneLiner } = results;

		setEconRun({ monthly, oneLiner });

		if (!modular) {
			confirmationAlert('Economics successfully ran');
			setVisibility((p) => (p !== 'closed' ? p : 'open'));
		}

		return results;
	};

	return { runEconomics, econRun, settings, visibility, setVisibility, loading };
}

export function useEconRun() {
	const { scenario } = useCurrentScenario();

	return useSingleWellEconRun({ scenarioId: scenario?._id });
}

export const EconRunContext = createContext<ReturnType<typeof useEconRun> | undefined>(undefined);
