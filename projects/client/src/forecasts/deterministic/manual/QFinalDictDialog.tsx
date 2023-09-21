import {
	Q_FINAL_DECIMAL,
	convertDateToIdx,
	convertIdxToDate,
	fixedFloatWithFlexibleDecimal,
} from '@combocurve/forecast/helpers';
import { SegmentParent } from '@combocurve/forecast/models';
import produce from 'immer';
import _ from 'lodash-es';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFForm } from '@/components/v2';
import ForecastFormControl, { getFormControlRules } from '@/forecasts/forecast-form/ForecastFormControl';
import { DEFAULT_WELL_LIFE_DICT } from '@/forecasts/forecast-form/automatic-form/useAutomaticForecast';
import { WellLifeFieldItem, getWellLifeFields } from '@/forecasts/forecast-form/phase-form/ModelFields';

const mapFromDB = (values, qConversion) =>
	produce(values, (draft) => {
		if (Number.isFinite(draft?.q_final)) {
			draft.q_final = fixedFloatWithFlexibleDecimal(qConversion.toView(draft.q_final), Q_FINAL_DECIMAL);
		}
		if (draft?.well_life_dict?.well_life_method === 'fixed_date') {
			draft.well_life_dict.fixed_date = convertIdxToDate(draft.well_life_dict.fixed_date);
		}
	});

const mapToDB = (values, qConversion) =>
	produce(values, (draft) => {
		if (Number.isFinite(draft?.q_final)) {
			draft.q_final = qConversion.toCalc(draft.q_final);
		}

		if (draft.well_life_dict?.well_life_method === 'fixed_date') {
			draft.well_life_dict.fixed_date = convertDateToIdx(draft.well_life_dict.fixed_date);
		}
	});

function QFinalDictDialog({ resolve, initialValues, editBase, qConversion, visible, ...props }) {
	const resolvedInitialValues = _.merge(
		{ well_life_dict: DEFAULT_WELL_LIFE_DICT },
		mapFromDB(initialValues, qConversion) ?? {}
	);

	if (editBase === 'typecurve') {
		resolvedInitialValues.well_life_dict ??= { well_life_method: 'duration_from_first_data' };
		resolvedInitialValues.well_life_dict.well_life_method ??= 'duration_from_first_data';
	}

	const form = useForm({ defaultValues: resolvedInitialValues, mode: 'onChange' });
	const {
		handleSubmit: formSubmit,
		formState: { isSubmitting, errors },
		watch,
	} = form;

	const wellLifeMethod = watch('well_life_dict.well_life_method');

	const handleSubmit = useCallback(
		async (values) => {
			resolve(mapToDB(values, qConversion));
		},
		[qConversion, resolve]
	);

	const segmentBounds = new SegmentParent({}, editBase === 'typecurve');
	const wellLifeFields: Array<WellLifeFieldItem> =
		editBase === 'typecurve'
			? [
					{
						name: 'well_life_dict.num',
						label: 'Years:',
						type: 'number',
						min: 1,
						max: segmentBounds.dateIdxLarge,
					},
			  ]
			: getWellLifeFields({ wellLifeMethod });

	return (
		<Dialog {...props} open={visible} title='Additional Settings' fullWidth maxWidth='xs'>
			<DialogTitle>Additional Settings</DialogTitle>

			<DialogContent>
				<RHFForm
					css={`
						display: flex;
						flex-direction: column;
						gap: 1rem;
					`}
					form={form}
					onSubmit={handleSubmit}
				>
					<ForecastFormControl
						label={`q Final (${qConversion.viewUnits})`}
						name='q_final'
						required
						rules={getFormControlRules({
							min: segmentBounds.numericSmall,
							max: segmentBounds.numericLarge,
						})}
						type='number'
					/>

					{_.map(wellLifeFields, (field) => {
						const { min, name } = field;
						return (
							<ForecastFormControl
								key={name}
								{..._.pick(field, ['label', 'menuItems', 'name', 'required', 'tooltip', 'type'])}
								{...(Boolean(min) && { rules: getFormControlRules({ min }) })}
							/>
						);
					})}
				</RHFForm>
			</DialogContent>

			<DialogActions>
				<Button color='warning' onClick={() => resolve(null)}>
					Cancel
				</Button>

				<Button
					color='primary'
					disabled={isSubmitting || !_.isEmpty(errors)}
					onClick={formSubmit(handleSubmit)}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default QFinalDictDialog;
