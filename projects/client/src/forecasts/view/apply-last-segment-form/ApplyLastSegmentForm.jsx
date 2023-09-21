import { convertDateToIdx, convertIdxToDate } from '@combocurve/forecast/helpers';
import { faCopy, faPaste } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ReactDatePicker as DatePicker, SelectField } from '@/components';
import { useMergedState } from '@/components/hooks';
import { Button, DialogActions, IconButton } from '@/components/v2';
import sassVars from '@/global-styles/vars.scss?inline';
import { confirmationAlert, genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { getWellHeaders } from '@/helpers/headers';
import { NumberField } from '@/helpers/inputFields';
import { putApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { clone } from '@/helpers/utilities';
import { forecastSeries as pSeries, phases as phaseOptions } from '@/helpers/zing';
import { fields as modelDT } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';

import { METHOD_FIELDS, METHOD_OPTIONS, MODEL_OPTIONS, MODEL_VALUES, TIME_REF_PROPS } from './LastSegmentTemplate';
import SegmentParameterUnits from './SegmentParameterUnits';
import {
	DatePickerContainer,
	FieldTitle,
	FieldTitleActions,
	FieldsContainer,
	FormContainer,
	FormTitle,
	GeneralSelectFieldContainer,
	MethodSelectFieldContainer,
	NumberFieldContainer,
	PSeriesActions,
	PSeriesContainer,
	PSeriesSwitch,
	PSeriesTitle,
	PSeriesTitleContainer,
	StyledCheckbox,
	StyledDialog,
	StyledDialogContent,
} from './layout';

// disabled for now
// const resolutionItems = [
// 	{ label: 'Not Change', value: 'not_change' },
// 	{ label: 'Daily', value: 'daily' },
// 	{ label: 'Monthly', value: 'monthly' },
// ];

const QFINAL_EXCLUDE_ITEMS = ['exp_inc', 'flat', 'empty', 'arps_inc'];

const ApplyLastSegmentForm = (props) => {
	const { forecastId, forecastType = 'probabilistic', onHide, resolve, visible, wells } = props;

	const [copiedSeries, setCopiedSeries] = useState(null);
	const [dtObj, setDtObj] = useState(null);
	const [errors, setErrors] = useState(new Set());
	const [model, setModel] = useState('arps_modified');
	const [models, setModels] = useState(null);
	const [phase, setPhase] = useState('oil');

	// disabled for now
	// const [resolution, setResolution] = useState('not_change');

	const [modelValues, setModelValues] = useMergedState(null);

	const [startMethod, setStartMethod] = useState(null);
	const [endMethod, setEndMethod] = useState(null);
	const [startMethodValues, setStartMethodValues] = useMergedState(null);
	const [endMethodValues, setEndMethodValues] = useMergedState(null);

	const modelValuesRef = useRef(null);

	const methods = useMemo(
		() => ({
			start: {
				methodValues: startMethodValues,
				set: setStartMethodValues,
				value: startMethod,
			},
			end: {
				methodValues: endMethodValues,
				set: setEndMethodValues,
				value: endMethod,
			},
		}),
		[endMethod, endMethodValues, setEndMethodValues, setStartMethodValues, startMethod, startMethodValues]
	);

	const loaded = dtObj && startMethod && endMethod && startMethodValues && endMethodValues && modelValues && models;

	const modelEntries = Object.values(modelValues || {});
	const allConnected = !modelEntries
		.filter((series) => series?.enable)
		.map((series) => series?.connect_to_previous)
		.includes(false);

	const allMatch = !modelEntries
		.filter((series) => series?.enable)
		.map((series) => series?.match_previous_slope)
		.includes(false);

	const handleError = useCallback(
		(error, name) => {
			const newErrorSet = new Set(errors);
			if (error) {
				newErrorSet.add(name);
			} else {
				newErrorSet.delete(name);
			}

			setErrors(newErrorSet);
		},
		[errors]
	);

	const endMethodOptions = useMemo(() => {
		const ret = METHOD_OPTIONS.end?.options || [];
		if (QFINAL_EXCLUDE_ITEMS.includes(model)) {
			return ret.filter((x) => x.value !== 'q_final');
		}
		return ret;
	}, [model]);

	const handleChangeModel = useCallback(
		(newModel) => {
			if (QFINAL_EXCLUDE_ITEMS.includes(newModel) && endMethod === 'q_final') {
				setEndMethod('well_life');
			}
			setModel(newModel);
		},
		[setModel, setEndMethod, endMethod]
	);

	const genMethodFields = useCallback(
		(timeRef) => {
			const options = TIME_REF_PROPS[timeRef]?.options;
			return loaded && options
				? options.reduce((arr, option) => {
						if (timeRef === 'end' && option === 'q_final' && QFINAL_EXCLUDE_ITEMS.includes(model)) {
							return arr;
						}
						const modelOption = METHOD_FIELDS[timeRef]?.[methods?.[timeRef]?.value]?.[option];
						if (!modelOption) {
							return arr;
						}

						const { label, min, max, rangeReliesOn, type, useHeaders, useHeaderUnits, units } = modelOption;
						const { set, methodValues } = methods[timeRef];

						let minValue = min;
						let maxValue = max;
						let modelOptions = modelOption.options;

						if (modelOptions && useHeaders) {
							const { wellHeaders } = dtObj;
							modelOptions = modelOption.options.map((cur) => {
								const { label: curLabel, headerValue, value } = cur;
								const optionLabel = headerValue ? wellHeaders[headerValue] : curLabel;
								const optionValue = value;
								return {
									label: optionLabel,
									value: optionValue,
								};
							});
						}

						switch (type) {
							case Date:
								arr.push(
									<DatePickerContainer key={option}>
										<span className='datepicker-field-label'>{`${label}:`}</span>
										<DatePicker
											color='primary'
											onChange={(value) => set({ [option]: convertDateToIdx(value) })}
											selected={convertIdxToDate(methodValues[option])}
										/>
									</DatePickerContainer>
								);
								break;
							case String:
								arr.push(
									<MethodSelectFieldContainer key={option}>
										<span className='select-field-label'>{`${label}:`}</span>
										<SelectField
											id={`method-field-select__${option}`}
											menuItems={modelOptions || []}
											onChange={(value) => set({ [option]: value })}
											value={methodValues[option]}
										/>
									</MethodSelectFieldContainer>
								);
								break;
							case Number:
								if (rangeReliesOn) {
									const methodValue = methods[timeRef].methodValues[rangeReliesOn];
									minValue = min[methodValue];
									maxValue = max[methodValue];
								}

								arr.push(
									<NumberFieldContainer key={option}>
										<span className='number-field-label'>{`${label}:`}</span>
										<NumberField
											id={`number-field__${option}`}
											max={maxValue}
											min={minValue}
											name={`number-field__${option}`}
											onError={handleError}
											required
											setVal={(value) => set({ [option]: value })}
											value={methodValues[option]}
										/>

										{(units || useHeaderUnits) && (
											<SegmentParameterUnits
												param={option}
												phase={phase}
												units={units}
												useHeaderUnits={useHeaderUnits}
											/>
										)}
									</NumberFieldContainer>
								);
								break;
							default:
								arr.push(null);
						}

						return arr;
				  }, [])
				: [];
		},
		[dtObj, handleError, loaded, methods, phase, model]
	);

	const genModelFields = useCallback(
		(pName) => {
			const options = MODEL_OPTIONS[model];
			return loaded && modelValues?.[pName]
				? options.map((option) => {
						const modelOption = MODEL_VALUES[option];
						const { label, max, min, rangeReliesOn, type, units, useHeaderUnits } = modelOption;
						const isDisabled = !modelValues[pName].enable;

						let numValue = '';
						let minValue = min;
						let maxValue = max;
						switch (type) {
							case Number:
								if (model !== 'empty') {
									const modelValue = modelValues[pName][option];
									numValue = modelValue;
								} else {
									numValue = 0;
								}
								if (rangeReliesOn) {
									minValue = min[model] || min.default;
									maxValue = max[model] || max.default;
								}

								return (
									<NumberFieldContainer key={`${pName}-${option}`} width='unset'>
										<span className='number-field-label'>{`${label}:`}</span>
										<NumberField
											id={`number-field__${`${pName}-${option}`}`}
											disabled={model === 'empty' || isDisabled}
											max={maxValue}
											min={minValue}
											name={`number-field__${`${pName}-${option}`}`}
											onError={handleError}
											required
											setVal={(value) =>
												setModelValues({
													[pName]: {
														...modelValues[pName],
														[option]: value,
													},
												})
											}
											value={numValue}
										/>

										{(units || useHeaderUnits) && (
											<SegmentParameterUnits
												param={option}
												phase={phase}
												units={units}
												useHeaderUnits={useHeaderUnits}
											/>
										)}
									</NumberFieldContainer>
								);
							case Boolean:
								return (
									<StyledCheckbox
										id={`checkbox-field__${`${pName}-${option}`}`}
										disabled={isDisabled}
										key={`${pName}-${option}`}
										label={label}
										name={`${pName}-${option}`}
										onChange={(_ev, checked) =>
											setModelValues({ [pName]: { ...modelValues[pName], [option]: checked } })
										}
										checked={modelValues[pName][option]}
									/>
								);
							default:
								return null;
						}
				  })
				: [];
		},
		[handleError, loaded, model, modelValues, phase, setModelValues]
	);

	const copyPSeries = useCallback(
		(pName) => {
			setCopiedSeries({ value: clone(modelValues[pName]), label: pName });
			confirmationAlert(`${capitalize(pName)} added to clipboard`);
		},
		[modelValues]
	);

	const runAddSegment = async () => {
		const model_params = Object.entries(modelValues).reduce((_obj, [modelValueKey, modelValue]) => {
			const obj = _obj;
			if (modelValue.enable) {
				const newModelValue = clone(modelValue);
				Object.entries(MODEL_VALUES).forEach(([modelPropKey, modelProp]) => {
					if (modelProp.percent) {
						newModelValue[modelPropKey] /= 100;
					}
				});

				obj[modelValueKey] = newModelValue;
			}

			return obj;
		}, {});

		const body = {
			setting: {
				name: model,
				data_freq: 'not_change',
				start: {
					...startMethodValues,
					start_method: startMethod,
				},
				end: {
					...endMethodValues,
					end_method: endMethod,
				},
				model_params,
			},
			phase,
			wells,
		};
		// if a task is created/dialog should close so user can see notification alerts

		try {
			const { message, taskCreated } = await withDoggo(
				putApi(`/forecast/${forecastId}/mass-apply-last-segment`, body),
				'Applying last segment...'
			);
			if (!taskCreated) {
				confirmationAlert(message);
			}
			resolve(!taskCreated);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const toggleAllProp = useCallback(
		(checked, key) => {
			const newModelValues = clone(modelValuesRef.current);
			Object.values(newModelValues).forEach((_series) => {
				const series = _series;
				series[key] = checked;
			});

			setModelValues(newModelValues);
		},
		[setModelValues]
	);

	const setModelDefault = useCallback(
		(inputModel) => {
			const initPSeriesValues = Object.entries(MODEL_VALUES).reduce((_obj, [optionKey, optionValue]) => {
				const obj = _obj;
				if (optionValue.defaultValueReliesOn) {
					obj[optionKey] = optionValue.default?.[inputModel] ?? optionValue.default.default;
				} else {
					obj[optionKey] = optionValue.default;
				}

				obj.enable = true;
				return obj;
			}, {});

			const initModelValues = pSeries.reduce((_obj, { value }) => {
				const obj = _obj;
				obj[value] = clone(initPSeriesValues);
				return obj;
			}, {});

			setModelValues(initModelValues);
		},
		[setModelValues]
	);

	// componentDidMount
	useEffect(() => {
		const initLoad = async () => {
			const modelOptions = Object.entries(modelDT).reduce((arr, [modelKey, modelValue]) => {
				if (modelValue?.canAddLastSegment) {
					arr.push({
						label: modelValue.label,
						value: modelKey,
					});
				}

				return arr;
			}, []);

			setModels(modelOptions);
			setDtObj({ wellHeaders: getWellHeaders() });
			setModelDefault('arps_modified');
			setStartMethod('absolute');
			setEndMethod('well_life');
		};

		initLoad();
	}, [setModelDefault, setModelValues]);

	// adjusts start method values when start method is adjusted
	useEffect(() => {
		if (startMethod) {
			const methodsObj = METHOD_FIELDS.start?.[startMethod];
			if (!methodsObj) {
				return;
			}

			const initMethodValues = Object.entries(methodsObj).reduce((_obj, [optionKey, optionValue]) => {
				const obj = _obj;
				obj[optionKey] = optionValue.default;
				return obj;
			}, {});

			setStartMethodValues(initMethodValues);
		}
	}, [dtObj, startMethod, setStartMethodValues]);

	// adjusts end method values when end method is adjusted
	useEffect(() => {
		if (endMethod) {
			const methodsObj = METHOD_FIELDS.end?.[endMethod];
			if (!methodsObj) {
				return;
			}

			const initMethodValues = Object.entries(methodsObj).reduce((_obj, [optionKey, optionValue]) => {
				const obj = _obj;
				obj[optionKey] = optionValue.default;
				return obj;
			}, {});

			setEndMethodValues(initMethodValues);
		}
	}, [endMethod, setEndMethodValues]);

	// adjust model defaults when model is adjusted
	useEffect(() => {
		setModelDefault(model);
	}, [model, setModelDefault]);

	useEffect(() => {
		modelValuesRef.current = modelValues;
	}, [modelValues]);

	return (
		<StyledDialog
			id='add-last-segment-form'
			aria-labelledby='add-last-segment-form'
			contentClassName='add-last-segment-form-content'
			open={visible}
			maxWidth='lg'
			fullWidth
		>
			<StyledDialogContent>
				<FormTitle>Mass Add Last Segment</FormTitle>
				<FieldsContainer>
					<FieldTitle>General Fields</FieldTitle>
					<FormContainer>
						<GeneralSelectFieldContainer>
							<span className='select-field-label'>Phase:</span>
							<SelectField
								id='phase-select'
								menuItems={phaseOptions || []}
								onChange={(value) => setPhase(value)}
								value={phase}
							/>
						</GeneralSelectFieldContainer>

						<GeneralSelectFieldContainer>
							<span className='select-field-label'>Model:</span>
							<SelectField
								id='model-select'
								menuItems={models || []}
								onChange={handleChangeModel}
								value={model}
							/>
						</GeneralSelectFieldContainer>

						{/* removed for now */}
						{/* <GeneralSelectFieldContainer>
							<span className='select-field-label'>Resolution:</span>
							<SelectField
								id='resolution-select'
								menuItems={resolutionItems}
								onChange={(value) => setResolution(value)}
								value={resolution}
							/>
						</GeneralSelectFieldContainer> */}
					</FormContainer>
				</FieldsContainer>

				<FieldsContainer>
					<FieldTitle>Start Date Fields</FieldTitle>
					<FormContainer>
						<MethodSelectFieldContainer>
							<span className='select-field-label'>Start Method:</span>
							<SelectField
								id='method-select'
								menuItems={METHOD_OPTIONS.start?.options || []}
								onChange={(value) => setStartMethod(value)}
								value={startMethod ?? ''}
							/>
						</MethodSelectFieldContainer>

						{genMethodFields('start')}
					</FormContainer>
				</FieldsContainer>

				<FieldsContainer>
					<FieldTitle>End Date Fields</FieldTitle>
					<FormContainer>
						<MethodSelectFieldContainer>
							<span className='select-field-label'>End Method:</span>
							<SelectField
								id='method-select'
								menuItems={endMethodOptions}
								onChange={(value) => setEndMethod(value)}
								value={endMethod ?? ''}
							/>
						</MethodSelectFieldContainer>

						{genMethodFields('end')}
					</FormContainer>
				</FieldsContainer>

				<FieldsContainer>
					<FieldTitle>
						<span className='field-title-label'>Model Fields</span>
						{forecastType === 'probabilistic' && (
							<FieldTitleActions>
								<StyledCheckbox
									id='checkbox-field__all-connected'
									label='Connect All'
									name='checkbox-field__all-connected'
									onChange={(checked) => toggleAllProp(checked, 'connect_to_previous')}
									value={allConnected}
								/>

								<StyledCheckbox
									id='checkbox-field__all-matched'
									label='Match All'
									name='checkbox-field__all-matched'
									onChange={(checked) => toggleAllProp(checked, 'match_previous_slope')}
									value={allMatch}
								/>
							</FieldTitleActions>
						)}
					</FieldTitle>

					{(forecastType === 'probabilistic' ? pSeries : pSeries.filter(({ value }) => value === 'best')).map(
						({ color, label, value }) => {
							const isDisabled = !modelValues?.[value]?.enable;
							return (
								<PSeriesContainer key={value}>
									<PSeriesTitleContainer>
										{forecastType === 'probabilistic' && (
											<PSeriesSwitch
												id={`enable-p-series-switch__${value}`}
												aria-labelledby={`enable-p-series-switch__${value}`}
												name={`enable-p-series-switch__${value}`}
												onChange={(checked) =>
													setModelValues({
														[value]: { ...modelValues[value], enable: checked },
													})
												}
												value={!isDisabled}
											/>
										)}

										<PSeriesTitle color={isDisabled ? sassVars.grey : color}>
											<span className='p-label'>{label}</span>

											{forecastType === 'probabilistic' && (
												<PSeriesActions>
													<IconButton
														disabled={isDisabled}
														onClick={() => copyPSeries(value)}
														color='primary'
														tooltipTitle='Add to clipboard'
													>
														{faCopy}
													</IconButton>

													<IconButton
														disabled={!copiedSeries || isDisabled}
														onClick={() =>
															setModelValues({ [value]: clone(copiedSeries.value) })
														}
														color='secondary'
														tooltipTitle={
															copiedSeries && `Paste ${capitalize(copiedSeries?.label)}`
														}
													>
														{faPaste}
													</IconButton>
												</PSeriesActions>
											)}
										</PSeriesTitle>
									</PSeriesTitleContainer>

									<FormContainer>{genModelFields(value)}</FormContainer>
								</PSeriesContainer>
							);
						}
					)}
				</FieldsContainer>
			</StyledDialogContent>
			<DialogActions
				css={`
					justify-content: space-around;
				`}
			>
				<Button key='apply-close' color='warning' onClick={() => onHide()}>
					Close
				</Button>
				<Button key='apply-run' disabled={!!errors.size} color='primary' onClick={runAddSegment}>
					{`Run (${wells.length})`}
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default ApplyLastSegmentForm;
