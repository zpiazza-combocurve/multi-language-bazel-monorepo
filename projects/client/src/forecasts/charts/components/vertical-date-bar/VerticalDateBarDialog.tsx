import { faChevronDown, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { useCallbackRef, useGetLocalStorage } from '@/components/hooks';
import {
	Button,
	ButtonItem,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	MenuButton,
	Stack,
} from '@/components/v2';
import { ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import { warningAlert } from '@/helpers/alerts';
import { numberToHex } from '@/helpers/color';
import { DialogProps } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import { getVersionedKey, local } from '@/helpers/storage';
import yup from '@/helpers/yup-helpers';

import DateItemRow from './DateItemRow';
import {
	VerticalDateItem,
	VerticalDateItemSchema,
	VerticalDateType,
	generateName,
	generateVerticalDateItem,
	verticalDateTypes,
} from './helpers';

const LOCAL_VERTICAL_DATE_BAR_KEY = 'forecast-grid-vertical-date-bar';
const LOCAL_VERSION = 'v1';
const INITIAL_FORM_STATE = { items: [generateVerticalDateItem({ color: '#a0a0a0', dateType: 'current' })] };
const MAX_ITEMS = 20;

const VerticalDateItemsSchema = yup.object().shape({ items: yup.array().of(VerticalDateItemSchema) });

export function useVerticalDateBarLocalState() {
	return useGetLocalStorage<{ items: Array<VerticalDateItem> }>(LOCAL_VERTICAL_DATE_BAR_KEY, INITIAL_FORM_STATE, {
		version: LOCAL_VERSION,
	});
}

function useVerticalDateBarState() {
	const initialValues = useVerticalDateBarLocalState();

	const {
		control,
		formState: { isValid },
		getValues,
	} = useForm({
		defaultValues: initialValues,
		mode: 'all',
		resolver: yupResolver(VerticalDateItemsSchema),
	});

	const { append, fields, remove, update } = useFieldArray({ control, name: 'items' });

	const hasCurrentDateItem = useMemo(() => fields.some((item) => item.dateType === 'current'), [fields]);

	const { wellHeadersLabels, wellHeadersTypes } = useWellHeaders({ enableProjectCustomHeaders: true });

	const dateHeaderOptions = useMemo(() => {
		// adjust typing for wellHeaderTypes to include the `kind` property
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return _.keys(_.pickBy(wellHeadersTypes, (props: any) => props?.type === 'date' && props?.kind === 'date'));
	}, [wellHeadersTypes]);

	const availableHeaderOptions = useMemo(() => {
		const availableHeaders = _.difference(dateHeaderOptions, _.map(fields, (item) => item.header).filter(Boolean));
		return {
			options: availableHeaders,
			getOptionLabel: (value) => wellHeadersLabels[value],
		};
	}, [dateHeaderOptions, fields, wellHeadersLabels]);

	const addItem = useCallbackRef(({ color, dateType }: { color?: string; dateType: VerticalDateType }) => {
		if (dateType === 'current' && hasCurrentDateItem) {
			return warningAlert('Cannot have more than one date item with date type of current date');
		}
		if (fields.length === MAX_ITEMS) {
			return warningAlert(`Cannot have more than ${MAX_ITEMS} date bars`);
		}

		append(
			generateVerticalDateItem({
				color: color ?? numberToHex(Math.round(Math.random() * 255)),
				dateType,
				header: dateType === 'header' ? availableHeaderOptions.options[0] : undefined,
			})
		);
	});

	return {
		addItem,
		availableHeaderOptions,
		control,
		fields,
		getValues,
		hasCurrentDateItem,
		isValid,
		removeItem: remove,
		updateItem: update,
	};
}

function VerticalDateBarDialog({
	apply: parentApply,
	onHide,
	resolve: _resolve,
	visible,
}: { apply: (value: Array<VerticalDateItem>) => void } & DialogProps<Array<VerticalDateItem>>) {
	const {
		addItem,
		availableHeaderOptions,
		control,
		hasCurrentDateItem,
		fields,
		getValues,
		isValid,
		removeItem,
		updateItem,
	} = useVerticalDateBarState();

	const apply = () => {
		const items = getValues().items;
		local.setItem(getVersionedKey(LOCAL_VERTICAL_DATE_BAR_KEY, LOCAL_VERSION), { items });

		// TODO: check why resolve isn't working; is this happening anywhere else in the app?
		parentApply(_.filter(items, (item) => item.visible));
		onHide();
	};

	return (
		<Dialog fullWidth maxWidth='sm' onClose={onHide} open={Boolean(visible)}>
			<DialogTitle>Date Bar Settings</DialogTitle>

			<DialogContent css='height: 60vh;'>
				<ForecastToolbarTheme>
					<Stack spacing={1}>
						<MenuButton
							color='secondary'
							endIcon={faChevronDown}
							label='Date Bar'
							startIcon={faPlus}
							variant='contained'
						>
							{verticalDateTypes.map((dateType) => (
								<ButtonItem
									key={dateType}
									disabled={dateType === 'current' && hasCurrentDateItem}
									label={generateName(dateType)}
									onClick={() => addItem({ dateType })}
								/>
							))}
						</MenuButton>

						<Divider />

						<Stack css='max-height: 50vh; overflow-y: auto;' spacing={2}>
							{fields.map((field, itemIndex) => (
								<DateItemRow
									key={field.id}
									availableHeaderOptions={availableHeaderOptions}
									control={control}
									item={getValues().items[itemIndex]}
									itemIndex={itemIndex}
									removeItem={removeItem}
									updateItem={updateItem}
								/>
							))}
						</Stack>
					</Stack>
				</ForecastToolbarTheme>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='secondary' disabled={!isValid} onClick={apply} variant='contained'>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export { useVerticalDateBarState };
export default VerticalDateBarDialog;
