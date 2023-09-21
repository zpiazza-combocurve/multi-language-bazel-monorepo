import _ from 'lodash';

import { makeLocal } from '@/helpers/date';
import yup from '@/helpers/yup-helpers';
import { fields as wellHeadersLabels } from '@/inpt-shared/display-templates/wells/well_headers.json';
import { getTcTooltipStyles } from '@/type-curves/charts/shared';

import { convertDateToIdx, convertDateToMilli } from '../../../../../../packages/forecast/src/helpers/math';
import { XAxisType } from '../../useChartSettings';

export const verticalDateTypes = ['current', 'custom', 'header'] as const;

export const VerticalDateItemSchema = yup.object().shape({
	color: yup.string().required('Please select a color'),
	date: yup.date().when('dateType', {
		is: 'custom',
		then: (schema) =>
			schema
				.typeError('Date input is required for custom date type')
				.required('Date input is required for custom date type'),
	}),
	dateType: yup.string().oneOf(verticalDateTypes).defined().required(),
	header: yup.string().when('dateType', {
		is: 'header',
		then: (schema) => schema.required('Header selection is required for header date type'),
	}),
	name: yup
		.string()
		.required('Please enter a name')
		.min(2, 'Cannot be shorter than ${min} characters')
		.max(32, ' Cannot be longer than ${max} characters')
		.matches(/^[\w- ]*$/, 'Cannot contain special characters')
		.matches(/^[^ ].*[^ ]$/, 'Cannot start or end in a space'),
	staticTooltip: yup.boolean().default(false),
	visible: yup.boolean().default(true),
});

export type VerticalDateItem = yup.InferType<typeof VerticalDateItemSchema>;
export type VerticalDateType = VerticalDateItem['dateType'];

export const generateName = (type: VerticalDateType) => `${_.capitalize(type)} Date`;

export const generateVerticalDateItem = ({
	color,
	date,
	dateType,
	header,
	name,
}: {
	color: string;
	date?: Date;
	dateType: VerticalDateType;
	header?: string;
	name?: string;
}): VerticalDateItem => {
	const newItem = {
		color,
		date,
		dateType,
		header,
		name: name?.length ? name : generateName(dateType),
		staticTooltip: false,
		visible: true,
	};

	if (dateType === 'custom') {
		newItem.date = date ?? new Date();
	}

	return newItem;
};

export const getDerivedDate = ({
	dateItem,
	wellHeaders,
}: {
	dateItem: VerticalDateItem;
	wellHeaders?: Record<string, Date>;
}): Date => {
	const { date: baseDate, dateType, header } = dateItem;
	if (dateType === 'header') {
		return wellHeaders && header ? makeLocal(wellHeaders?.[header]) ?? new Date() : new Date();
	}
	if (dateType === 'custom') {
		return makeLocal(baseDate) ?? new Date();
	}
	return new Date();
};

export const generateChartDateBar = ({
	dateItem,
	startIdx,
	wellHeaders,
	xAxisType = 'time',
}: {
	dateItem: VerticalDateItem;
	startIdx?: number;
	wellHeaders?: Record<string, Date>;
	xAxisType?: XAxisType;
}):
	| {
			alpha: number;
			lineColor: string;
			lineStyle: string;
			lineWidth: string;
			placement: string;
			range: Array<number>;
			tooltip: Record<string, unknown>;
			type: string;
			valueRange: boolean;
	  }
	| false => {
	const chartDate = getDerivedDate({ dateItem, wellHeaders });
	const chartDateAsMilli = convertDateToMilli(chartDate);

	const { dateType, color, header, name } = dateItem;
	const commonProps = {
		alpha: 1,
		lineColor: dateItem.color,
		lineStyle: 'dashed',
		lineWidth: '3px',
		placement: 'top',
		tooltip: {
			...getTcTooltipStyles(color),
			text: `${
				dateType === 'header' ? wellHeadersLabels?.[header] ?? name : name
			} - ${chartDate?.toLocaleDateString()}`,
		},
		type: 'line',
		valueRange: true,
	};

	if (dateType === 'header' && !wellHeaders?.[header]) {
		return false;
	}
	if (xAxisType === 'time') {
		return {
			...commonProps,
			range: [chartDateAsMilli],
		};
	}
	if (xAxisType === 'relativeTime' && startIdx) {
		return {
			...commonProps,
			range: [convertDateToIdx(chartDate) - startIdx],
		};
	}

	return false;
};
