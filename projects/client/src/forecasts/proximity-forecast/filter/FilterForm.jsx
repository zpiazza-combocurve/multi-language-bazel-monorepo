import { faChevronDown, faChevronUp, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { Collapse } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useGetLocalStorage, useSetLocalStorage } from '@/components/hooks/useStorage';
import { Button, Divider, Icon, IconButton } from '@/components/v2';
import { RHFForm } from '@/components/v2/react-hook-form-fields';
import { useCheckWellValidForProximity } from '@/forecasts/api';
import { useLoadingBar } from '@/helpers/alerts';
import { hasNonWhitespace } from '@/helpers/text';
import { useWellColumns } from '@/well-sort/WellSort';

import CollapseHeader from '../CollapseHeader';
import { ForecastSelectionForm } from './ForecastSelectionForm';
import { ProximityOptionsForm, getFieldItems } from './ProximityOptionsForm';

import './ProximityFilter.scss';

import { getTaggingProp } from '@/analytics/tagging';
import { FormContent, FormFooter, RHFFormStyles } from '@/type-curves/TypeCurveIndex/shared/formLayout';

const DEFAULT_NUM_MONTH = 720;
const PROXIMITY_HEADER_TYPES = ['multi-select', 'string', 'date', 'number'];
export const FORM_INITIAL_VALUE = {
	searchRadius: 10,
	wellCountRange: { start: 1, end: 10 },
	forecastSearch: '',
	selectedForecasts: [],
};

export const PROXIMITY_CACHE_KEY = 'proximity-form';

// https://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
const objectMap = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]));

const recursivelyNumerifyObject = (obj, excludedKeys = []) => {
	return objectMap(obj, (v, k) => {
		if (!excludedKeys.includes(k)) {
			// Strings convert to numbers
			if (typeof v === 'string') {
				if (!hasNonWhitespace(v)) {
					return null;
				}
				return Number(v);
			}
			// Dates should be indexified
			else if (v instanceof Date) {
				return v.toISOString();
			}
			// Objects get passed back into this fn
			else if (typeof v === 'object' && v !== null) {
				return recursivelyNumerifyObject(v);
			}
			// Everything else just keeps its orginal value
			else {
				return v ?? null;
			}
		}
		return v;
	});
};

const prepareProximityFactory = {
	localCount: 0,
	prepareProximityRequestBody: ({ selectedFields, formValues, selectedForecasts }) => {
		prepareProximityFactory.localCount += 1;
		const body = {
			selectedFields,
			selectedForecasts: selectedForecasts?.deterministic?.map((f) => f?._id) ?? [],
			..._.omit(formValues, 'selectedForecasts'),
		};

		// Cast Search Radius and Well Count Range to numbers
		// When fields are left empty, value null gets cast to 0
		body.searchRadius = Number(body.searchRadius);
		body.wellCountRange.start = Number(body.wellCountRange.start);
		body.wellCountRange.end = Number(body.wellCountRange.end);

		const fields = getFieldItems(selectedFields);

		selectedFields.forEach((field) => {
			const fieldObj = fields.find((el) => el.value === field);
			body[field].type = fieldObj.type === 'multi-select' ? 'string' : fieldObj.type;
			body[field].mandatory = Boolean(body[field]?.mandatory);
			body[field] = recursivelyNumerifyObject(body[field], ['mandatory', 'type']);
		});

		return {
			neighborDict: body,
			numMonth: DEFAULT_NUM_MONTH,
			count: prepareProximityFactory.localCount,
		};
	},
};

const FilterForm = ({ forecastId, setHasRun, setProximityMergedStates, activeSelectedForecastRef, wellId }) => {
	const forecastSelectionRef = useRef({});

	const [runDisabledMessage, setRunDisabledMessage] = useState(null);

	const [proximityCache, setProximityCache] = useState(useGetLocalStorage(PROXIMITY_CACHE_KEY, {}));
	useSetLocalStorage(PROXIMITY_CACHE_KEY, proximityCache);

	const [selectedFields, setSelectedFields] = useState(proximityCache?.selectedFields ?? []);
	const [forecastExpanded, setForecastExpanded] = useState(proximityCache?.forecastExpanded ?? true);
	const [filterExpanded, setFilterExpanded] = useState(proximityCache?.filterExpanded ?? true);

	useEffect(() => {
		setProximityCache(
			produce((draft) => {
				draft.filterExpanded = filterExpanded;
				draft.forecastExpanded = forecastExpanded;
			})
		);
	}, [filterExpanded, forecastExpanded, setProximityCache]);

	const wellColumns = useWellColumns(() => false);

	const columns = Object.fromEntries(
		Object.entries(wellColumns)
			.filter(([, v]) => PROXIMITY_HEADER_TYPES.includes(v.type))
			.map(([key, v]) => [key, { ...v, value: key }])
	);

	const availableColumnsKey = Object.keys(columns).filter(
		(key) => !selectedFields.find((selectedField) => selectedField === key)
	);

	const runProximityForecast = useCallback(
		async (formValues) => {
			const newLocalStorageValue = {
				selectedFields,
				formValues,
				selectedForecasts: forecastSelectionRef?.current?.getSelectedForecasts?.(),
			};
			setProximityCache(newLocalStorageValue);

			setProximityMergedStates({
				proximityActive: true,
				proximityForm: prepareProximityFactory.prepareProximityRequestBody(newLocalStorageValue),
			});
			setHasRun(true);
		},
		[selectedFields, setProximityCache, setProximityMergedStates, setHasRun]
	);

	const form = useForm({
		defaultValues: proximityCache?.formValues ?? FORM_INITIAL_VALUE,
		mode: 'all',
	});
	const {
		formState: { isSubmitting, isValid },
		handleSubmit,
	} = form;

	const isProximityWellValid = useCheckWellValidForProximity(wellId);

	useLoadingBar(isSubmitting);

	return (
		<RHFForm form={form} css={RHFFormStyles}>
			<FormContent>
				<CollapseHeader label='Select Forecasts'>
					<IconButton size='small' onClick={() => setForecastExpanded(!forecastExpanded)}>
						{forecastExpanded ? faChevronUp : faChevronDown}
					</IconButton>
				</CollapseHeader>
				<Collapse in={forecastExpanded} timeout='auto' css='min-height: unset !important'>
					<ForecastSelectionForm
						ref={forecastSelectionRef}
						currentForecast={forecastId}
						setRunDisabledMessage={setRunDisabledMessage}
						activeSelectedForecastRef={activeSelectedForecastRef}
					/>
				</Collapse>
				<CollapseHeader label='Proximity Options'>
					<IconButton size='small' onClick={() => setFilterExpanded(!filterExpanded)}>
						{filterExpanded ? faChevronUp : faChevronDown}
					</IconButton>
				</CollapseHeader>
				<Collapse in={filterExpanded} timeout='auto' unmountOnExit css='min-height: unset !important'>
					<ProximityOptionsForm
						allFields={columns}
						availableFieldsKey={availableColumnsKey}
						selectedFields={selectedFields}
						setSelectedFields={setSelectedFields}
					/>
				</Collapse>
			</FormContent>
			<Divider />
			<FormFooter>
				{!isProximityWellValid && (
					<Icon
						style={{ backgroundColor: 'transparent', marginRight: '1.5rem' }}
						color='warning'
						tooltipTitle='Cannot run proximity on well with no surface latitude or longitude'
					>
						{faExclamationTriangle}
					</Icon>
				)}

				<Button
					color='secondary'
					disabled={runDisabledMessage || !isValid || !isProximityWellValid}
					onClick={handleSubmit(runProximityForecast)}
					size='small'
					variant='contained'
					{...getTaggingProp('forecast', 'editingFetchProximity')}
				>
					Fetch Proximity Wells
				</Button>
			</FormFooter>
		</RHFForm>
	);
};

export { FilterForm };
