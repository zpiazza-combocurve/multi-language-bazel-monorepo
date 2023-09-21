import { FormikContext } from 'formik';
import { forwardRef, useEffect, useImperativeHandle } from 'react';

import { Placeholder } from '@/components';
import { useHotkey } from '@/components/hooks/useHotkey';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { checkBayesian } from '@/forecasts/forecast-form/ForecastForm';
import { PhaseForm } from '@/forecasts/forecast-form/PhaseForm';
import { useAutoReforecast } from '@/forecasts/manual/AutoReforecast';
import { ResolutionToggle } from '@/forecasts/manual/EditingLayout';
import { infoAlert } from '@/helpers/alerts';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

const noop = () => {
	// Return no operation.
};

const DeterministicReforecast = forwardRef(
	(
		{
			canSave,
			forecastId,
			forecastType = 'deterministic',
			onDataChange = noop,
			phase,
			rateOnly = false,
			resolution,
			saveForecast,

			// TODO find more descriptive name
			setAutoProps = noop,
			setEdited,
			setResolution = noop,
			wellId,
		},
		ref
	) => {
		const {
			run,
			save,
			setValidIdx,
			formikBundle,
			setDateSelection,
			showConfigDialog,
			loading,
			formTemplates,
			validIdx,
			dialogs,
		} = useAutoReforecast({
			forecastId,
			forecastType,
			phase,
			resolution,
			setAutoData: onDataChange,
			setEdited,
			wellId,
		});

		const isMac = navigator.userAgent.includes('Mac');
		const saveKeys = isMac ? 'command+s' : 'ctrl+s';

		useHotkey(saveKeys, () => {
			if (!canSave) {
				infoAlert('No updates to save');
			} else {
				(saveForecast ?? save)();
			}
			return false;
		});

		const { values } = formikBundle;

		const settings = values[phase] ?? {};
		const axis_combo = settings.axis_combo;
		const basePhase = settings.base_phase;
		const { openArticle } = useZoho();

		useImperativeHandle(ref, () => ({
			setValidIdx,
			setDateSelection,
			saveForecast,
			runForecast: run,
			showConfig: showConfigDialog,
		}));

		// update auto props
		useEffect(() => {
			if (!resolution || !phase || !axis_combo) {
				return;
			}
			if (axis_combo === 'ratio' && !basePhase) {
				return;
			}
			const yAxis = axis_combo === 'rate' ? phase : `${phase}/${basePhase}`;
			setAutoProps({
				axis_combo,
				basePhase,
				plotSeriesKey: `${resolution}-${yAxis}`,
				seriesItems: [
					{ collection: resolution, x: 'time', y: yAxis },
					{ collection: 'forecast', x: 'time', y: yAxis },
				],
			});
			// setValidIdx(null);
		}, [axis_combo, basePhase, phase, resolution, setAutoProps]);

		if (loading) {
			return <Placeholder loadingText='Loading...' loading />;
		}
		return (
			<FormikContext.Provider value={formikBundle}>
				<ResolutionToggle resolution={resolution} setResolution={setResolution} />
				<PhaseForm
					phase={phase}
					forecastType={forecastType}
					formTemplates={formTemplates}
					disableFilter={validIdx?.length}
					rateOnly={rateOnly}
					showType
					showModel
					showAdvanced
				/>
				{dialogs}
				{checkBayesian(values, true) && (
					<InstructionsBanner onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.BayesianInfo })}>
						Bayesian Forecast Models
					</InstructionsBanner>
				)}
			</FormikContext.Provider>
		);
	}
);

export default DeterministicReforecast;
