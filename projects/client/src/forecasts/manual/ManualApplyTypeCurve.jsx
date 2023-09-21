import Autocomplete from '@material-ui/lab/Autocomplete';
import { useContext, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { Divider, SwitchField, TextField, Typography } from '@/components/v2';
import SelectField from '@/components/v2/misc/SelectField';
import { ManualDateField } from '@/forecasts/deterministic/manual/components';
import { ControlsSectionContainer, InlineLabeled } from '@/forecasts/deterministic/manual/layout';
import {
	ManualEditingTypeCurveContext,
	fetchTcDict,
	fetchTcFit,
	fetchTcList,
	fetchWellInfo,
} from '@/forecasts/manual/ManualEditingTypeCurveContext';
import { makeLocal } from '@/helpers/date';
import { useDebouncedValue } from '@/helpers/debounce';
import { convertDateToIdx } from '@/helpers/zing';
import { useCurrentProject } from '@/projects/api';
import { TCTooltippedField } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/ControlComponents';
import { FIXED_SOURCE, HEADER_FPDS, SCHEDULE_SOURCE, TC_TYPES } from '@/type-curves/shared/formProperties';

const ManualApplyTypeCurve = ({ forecastId, phase, wellId, forecastType = 'deterministic' }) => {
	const { project } = useCurrentProject();
	const {
		enableNormalize,
		fit,
		fpd,
		fpdSource,
		phaseType,
		reset,
		riskFactorStr,
		schedule,
		setEnableNormalize,
		setFit,
		setFpd,
		setFpdSource,
		setPhaseType,
		setRiskFactorStr,
		setSchedule,
		setTypeCurveDict,
		setTc,
		tc,
	} = useContext(ManualEditingTypeCurveContext);

	// get well info from python API
	const { data: wellInfo, isLoading: wellInfoLoading } = useQuery(
		['forecast', 'manualApplyTc', 'well-info', project._id, wellId],
		() => fetchWellInfo(wellId, project._id)
	);

	const { data: tcList, isLoading: tcListLoading } = useQuery(
		['forecast', 'manualApplyTc', 'tc-list', project._id, phase, phaseType],
		() => fetchTcList(phase, phaseType, undefined, project._id),
		{ placeholderData: [] }
	);

	const debouncedDictInput = useDebouncedValue(
		[enableNormalize, fit, fpd, fpdSource, riskFactorStr, schedule, tc, wellId],
		500
	);

	const { data: typeCurveDict = null } = useQuery(
		['manual', 'apply-tc-dict', ...debouncedDictInput],
		() =>
			fetchTcDict({
				fit,
				tc,
				fpd,
				fpdSource,
				forecastId,
				enableNormalize,
				riskFactorStr,
				schedule,
				well: wellId,
				projectId: project._id,
			}),
		{ enabled: Boolean(fit) && Boolean(tc), initialData: null }
	);

	const scheduleList = wellInfo?.scheduling
		? wellInfo.scheduling.map((curSchedule) => ({ value: curSchedule.schedule_id, label: curSchedule?.name }))
		: [];

	const fpdSources = useMemo(() => {
		if (wellInfoLoading) {
			return [FIXED_SOURCE];
		}

		const headerFpds = HEADER_FPDS.map((source) => ({ ...source, disabled: !wellInfo?.header?.[source.value] }));
		const scheduleSource = { ...SCHEDULE_SOURCE, disabled: !Object.keys(wellInfo?.scheduling ?? {}).length };
		return [...headerFpds, scheduleSource, FIXED_SOURCE];
	}, [wellInfo, wellInfoLoading]);

	const { isLoading: applyingTc, mutateAsync: applyTc } = useMutation(async (inputTc) => {
		const initFit = await fetchTcFit(inputTc._id, phase);
		setTc(inputTc);
		setFit(initFit);
	});

	const autocompletePlaceholderText = useMemo(() => {
		if (tcListLoading) {
			return 'Loading Type Curves...';
		}
		if (applyingTc) {
			return 'Applying Type Curve';
		}
		if (!tcList?.length) {
			return 'No Available Type Curves';
		}

		return 'Search Type Curves';
	}, [applyingTc, tcList?.length, tcListLoading]);

	useEffect(() => {
		setTypeCurveDict(typeCurveDict);
	}, [setTypeCurveDict, typeCurveDict]);

	// resets props when wellId, phase, or phaseType changes
	useEffect(() => {
		reset();
	}, [reset, wellId, phase, phaseType]);

	return (
		<>
			<ControlsSectionContainer>
				<Autocomplete
					disableClearable
					disabled={tcListLoading || !tcList.length || applyingTc || wellInfoLoading}
					getOptionLabel={(tcItem) => tcItem?.name ?? ''}
					onChange={(_event, newValue) => applyTc(newValue)}
					options={tcList ?? []}
					renderInput={(params) => <TextField placeholder={autocompletePlaceholderText} {...params} />}
					value={tc}
				/>

				{forecastType === 'deterministic' && (
					<InlineLabeled label='Phase Type' noPadding>
						<SelectField
							fullWidth
							menuItems={TC_TYPES}
							onChange={(ev) => setPhaseType(ev.target.value)}
							size='small'
							value={phaseType}
						/>
					</InlineLabeled>
				)}

				<TCTooltippedField tooltip='If on, normalization is applied to adjust q Start of the applied curve'>
					<SwitchField
						css={`
							margin-left: 0;
							width: 100%;
							display: flex;
							justify-content: space-between;
						`}
						disabled={phaseType === 'ratio'}
						labelPlacement='start'
						label={
							<Typography
								css={`
									font-size: 0.7rem;
								`}
							>
								Normalize Volumes for Fitting
							</Typography>
						}
						onChange={(_ev, newValue) => setEnableNormalize(newValue)}
						checked={enableNormalize}
					/>
				</TCTooltippedField>

				<TCTooltippedField tooltip='Apply a Q multiplier to the curve. Manually adjusts q Start of applied curve to fit any historical data'>
					<InlineLabeled label='Risk Factor' noPadding>
						<TextField
							fullWidth
							onChange={(ev) => setRiskFactorStr(ev.target.value)}
							placeholder='Enter Value'
							type='number'
							value={riskFactorStr}
						/>
					</InlineLabeled>
				</TCTooltippedField>
			</ControlsSectionContainer>

			<Divider />

			<ControlsSectionContainer>
				<InlineLabeled label='FPD Source' noPadding>
					<SelectField
						disabled={wellInfoLoading}
						fullWidth
						menuItems={fpdSources}
						onChange={(ev) => setFpdSource(ev.target.value)}
						size='small'
						value={fpdSource}
					/>
				</InlineLabeled>

				{fpdSource === 'fixed' && (
					<ManualDateField
						label='Fixed FPD'
						onChange={(newDate) => setFpd(convertDateToIdx(makeLocal(newDate)))}
						placeholder='Enter Date'
						selected={fpd}
					/>
				)}

				{fpdSource === 'schedule' && (
					<InlineLabeled label='Schedule' noPadding>
						<SelectField
							disabled={wellInfoLoading}
							fullWidth
							menuItems={scheduleList ?? []}
							onChange={(ev) => setSchedule(ev.target.value)}
							size='small'
							value={schedule}
						/>
					</InlineLabeled>
				)}
			</ControlsSectionContainer>
		</>
	);
};

export default ManualApplyTypeCurve;
