import { setNestedObjectValues, useFormik } from 'formik';
import produce from 'immer';
import { get, set } from 'lodash';
import _ from 'lodash-es';
import { useEffect, useMemo } from 'react';

import { useFormikReducer, useGetter } from '@/components/hooks';
import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { deepMerge } from '@/helpers/utilities';
import {
	DEFAULT_FORM_VALUES,
	TC_MODELS_VALUES,
	TC_MODEL_DEFAULTS,
} from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/controlsFormValues';

export const setRangeValues = (activeValues = {}, draft, requiredValues, key: string) => {
	const { defaultValues, min, max } = get(requiredValues, key) ?? {};
	const [activeMin, activeMax] = get(activeValues, key) ?? [];
	if ((!activeMin || !activeMax || activeMin < min || activeMax > max) && defaultValues) {
		set(draft, key, defaultValues);
	}
};

const useAutoFitForm = ({
	activeFormConfig,
	defaultFormConfig,
	initSettings = {},
	onSubmit,
	phaseType,
	requiredMinMax,
}) => {
	const initialValues = useMemo(() => {
		// merge default config and prioritize saved fit settings
		const values = produce(DEFAULT_FORM_VALUES, (draft) => {
			deepMerge(deepMerge(draft, defaultFormConfig?.settings ?? {}), initSettings);
			if (!TC_MODELS_VALUES[phaseType].includes(draft.TC_model)) {
				draft.TC_model = TC_MODEL_DEFAULTS[phaseType];
			}
		});
		return values;
	}, [defaultFormConfig?.settings, initSettings, phaseType]);

	const formikBundle = useFormikReducer(
		useFormik({ enableReinitialize: true, initialValues, onSubmit }),
		(prev, field, value) =>
			produce(prev, (draft) => {
				set(draft, field, value);
				if (prev.TC_model !== draft.TC_model) {
					if (draft.TC_model === 'arps_inc') {
						draft.q_final = 50_000;
						draft.buildup.apply = false;
					} else {
						draft.q_final = DEFAULT_FORM_VALUES.q_final;
					}
				}
			})
	);

	const { setValues, validateForm: _validateForm, setTouched } = formikBundle;

	const validateForm = useCallbackRef(async () => {
		const errors = await _validateForm();

		// touch fields with errors in order to force visual error for the user
		if (_.keys(errors).length > 0) {
			setTouched(setNestedObjectValues(errors, true));
		}
	});

	const getRequiredMinMax = useGetter(requiredMinMax);
	// merge in active config when it changes
	useEffect(() => {
		if (activeFormConfig?.settings) {
			setValues(
				produce((draft) => {
					deepMerge(draft, activeFormConfig.settings);

					const requiredMinMax = getRequiredMinMax();
					setRangeValues(draft, draft, requiredMinMax, 'p1_range');
					setRangeValues(draft, draft, requiredMinMax, 'addSeriesFitRange');
					setRangeValues(draft, draft, requiredMinMax, 'best_fit_q_peak.range');
				})
			);

			// HACK: only run after values have been set
			setTimeout(validateForm, 250);
		}
	}, [
		activeFormConfig.settings,
		defaultFormConfig,
		defaultFormConfig.settings,
		getRequiredMinMax,
		setValues,
		validateForm,
	]);

	// on runs on initial load
	useEffect(() => {
		validateForm();
	}, [initialValues, validateForm]);

	return { formikBundle, validateForm };
};

export default useAutoFitForm;
