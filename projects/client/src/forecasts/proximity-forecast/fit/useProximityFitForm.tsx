import produce from 'immer';
import _ from 'lodash-es';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useCallbackRef } from '@/components/hooks';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';
import { PhaseForm } from '@/type-curves/TypeCurveIndex/fit/useAutoFitForm';
import { Align, PhaseType } from '@/type-curves/TypeCurveIndex/types';

const TC_MODEL_DEFAULTS: Record<PhaseType, string> = { rate: 'segment_arps_4_wp_free_b1', ratio: 'flat' };

export const generatePhaseSettings = ({
	phase,
	phaseType,
}: {
	phase: Phase;
	phaseType: PhaseType;
}): PhaseForm & { fitToTargetData: boolean; q_flat: number } => {
	const currentDate = new Date();
	return {
		addSeries: 'average',
		addSeriesFitRange: [
			currentDate,
			new Date(currentDate.getFullYear() + 60, currentDate.getMonth(), currentDate.getDate()),
		],
		applySeries: 'average',
		b: [-2, -0.001],
		b0: [-10, -0.001],
		b2: [0.001, 2],
		b1: [0.001, 2],
		basePhase: phase === 'oil' ? 'gas' : 'oil',
		best_fit_q_peak: { method: 'P50', range: [1, 99] },
		buildup: {
			apply_ratio: false,
			apply: true,
			buildup_ratio: 0.1,
			days: 0,
		},
		D_lim_eff: 8,
		D1_eff: [1, 99],
		D2_eff: [1, 99],
		fit_complexity: 'complex',
		fitToTargetData: false,
		minus_t_decline_t_0: [1, 300],
		minus_t_elf_t_peak: [1, 5000],
		minus_t_peak_t0: [0, 1000],
		p1_range: [-10000, 10000],
		phaseType,
		q_final: 0.8,
		q_flat: 100,
		q_peak: [0, 10000],
		TC_model: TC_MODEL_DEFAULTS[phaseType],
		well_life: 60,
	};
};

export const generateDefaultFormValues = ({ phase, phaseType = 'rate' }: { phase: Phase; phaseType?: PhaseType }) => ({
	[phase]: generatePhaseSettings({ phase, phaseType }),
});

const useProximityFitForm = ({
	fitConfigProps,
	handleFitRequest,
	phase,
	phaseType,
}: {
	align?: Align;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fitConfigProps?: { activeConfig?: any };
	handleFitRequest;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initSettings?: Record<string, any>;
	normalize?: boolean;
	phase: Phase;
	phaseRepWells: string[];
	phaseType: PhaseType;
}) => {
	const { activeConfig } = fitConfigProps ?? {};

	const initialValues = useMemo(
		() => _.merge(generateDefaultFormValues({ phase, phaseType }), activeConfig),
		[activeConfig, phase, phaseType]
	);

	const form = useForm({ defaultValues: initialValues, mode: 'onChange' });
	const {
		formState: { errors, isSubmitting },
		getValues,
		reset,
	} = form;

	const handleModelChange = useCallbackRef(async (phase: Phase, newModel: string) => {
		const curValues = getValues();
		const newModelViewOrder = formTemplates[phaseType][newModel].viewOrder;
		await reset(
			produce(curValues, (draft) => {
				const curModel = draft[phase].TC_model;
				draft[phase].TC_model = newModel;

				const defaultValues = generatePhaseSettings({ phase, phaseType });
				const difFields: Array<string> = _.difference(
					newModelViewOrder,
					formTemplates[phaseType][curModel].viewOrder
				);

				// add buildup fields exception for flat_arps_modified
				if (curModel === 'flat_arps_modified') {
					difFields.push('buildup');
				}

				_.merge(draft[phase], _.pick(defaultValues, difFields));
			})
		);
	});

	const formError: string | boolean = useMemo(() => {
		if (isSubmitting) {
			return 'Submitting forecast';
		}
		if (!_.isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		return false;
	}, [errors, isSubmitting]);

	const handleSubmit = useCallback(async () => {
		const curValues = getValues()[phase];
		await handleFitRequest(curValues);
	}, [getValues, handleFitRequest, phase]);

	return {
		form,
		formError,
		handleModelChange,
		handleSubmit,
	};
};

export default useProximityFitForm;
