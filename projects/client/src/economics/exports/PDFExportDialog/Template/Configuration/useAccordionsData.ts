import produce from 'immer';
import { useFormContext } from 'react-hook-form';

import { AGG_HEADERS, BY_WELL_HEADERS } from '@/economics/Economics/shared/constants';
import { useAllPossibleHeaders } from '@/economics/exports/CSVExportDialog/helpers';
import {
	DEFAULT_SELECTED_ITEMS_LIMIT,
	DISCOUNT_SELECTED_ITEMS_LIMIT,
	TIME_SERIES_METRICS_SELECTED_ITEMS_LIMIT,
} from '@/economics/exports/PDFExportDialog/shared/constants';
import { getPDFOptions } from '@/economics/exports/PDFExportDialog/shared/helpers';
import {
	Option,
	PDFExportTemplate,
	PDFOptionKeyTypes,
	PDFOptionTypes,
} from '@/economics/exports/PDFExportDialog/shared/types';
import { useWellHeaders } from '@/helpers/headers';
import { assert } from '@/helpers/utilities';

import {
	DISCOUNT_DETAILS,
	EXTRA_HEADERS,
	ONELINE_METRICS_AGG,
	ONELINE_METRICS_BY_WELL,
	REPORT_DETAILS,
	TIME_SERIES_METRICS,
} from './constants';

export type AccordionData = {
	options: Option[];
	title: string;
	placeholder: string;
	items: Option[];
	selectedItemsLimit: number;
};

export type AccordionsData = Record<PDFOptionTypes, AccordionData>;

const ACCORDIONS_DATA: {
	[key in PDFOptionKeyTypes]?: Omit<Partial<AccordionData>, 'options'> &
		Pick<AccordionData, 'title'> & { keysAndLabels?: Parameters<typeof getPDFOptions>[0]['keysAndLabels'] };
} = {
	[PDFOptionTypes.HEADER_DATA]: {
		title: 'Headers',
		keysAndLabels: BY_WELL_HEADERS,
	},
	[PDFOptionTypes.REPORT_DETAILS]: {
		title: 'Report Details',
		keysAndLabels: REPORT_DETAILS,
	},
	[PDFOptionTypes.TIME_SERIES_METRICS]: {
		title: 'Time Series Metrics',
		keysAndLabels: TIME_SERIES_METRICS,
		selectedItemsLimit: TIME_SERIES_METRICS_SELECTED_ITEMS_LIMIT,
	},
	[PDFOptionTypes.ONELINE_METRICS]: {
		title: 'Oneline Metrics',
		keysAndLabels: ONELINE_METRICS_BY_WELL,
	},
	[PDFOptionTypes.DISC_CASHFLOW]: {
		title: 'Discount Tables',
		keysAndLabels: DISCOUNT_DETAILS,
		selectedItemsLimit: DISCOUNT_SELECTED_ITEMS_LIMIT,
	},
};

export function useAccordionsData(): AccordionsData {
	const { getValues, watch } = useFormContext<PDFExportTemplate>();
	const { allPDFHeaders } = useAllPossibleHeaders();

	const type = watch('type');
	const { projectCustomHeadersKeys, wellHeadersLabels, companyCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
		enableCompanyCustomHeaders: true,
	});
	const accordionsData = produce(ACCORDIONS_DATA, (data) => {
		assert(data.headerData);
		assert(data.headerData.keysAndLabels);
		for (const key in EXTRA_HEADERS) {
			data.headerData.keysAndLabels[key] = EXTRA_HEADERS[key];
		}
		for (const key of companyCustomHeadersKeys) {
			data.headerData.keysAndLabels[key] = wellHeadersLabels[key];
		}
		for (const key of projectCustomHeadersKeys) {
			data.headerData.keysAndLabels[key] = wellHeadersLabels[key];
		}
		if (type === 'cashflow-agg-pdf') {
			data.headerData.keysAndLabels = AGG_HEADERS;
			assert(data.onelineMetrics);
			data.onelineMetrics.keysAndLabels = ONELINE_METRICS_AGG;
		}
	});

	return Object.values(PDFOptionTypes).reduce((acc, key) => {
		const {
			title = 'Accordion title',
			selectedItemsLimit = DEFAULT_SELECTED_ITEMS_LIMIT,
			placeholder = `Select Up To ${selectedItemsLimit} ${title}`,
			keysAndLabels = allPDFHeaders,
		} = accordionsData[key] ?? {};

		const items = watch(key);

		acc[key] = {
			options: getPDFOptions({
				keyType: key,
				keysAndLabels,
				selectedItems: getValues(key),
			}),
			selectedItemsLimit,
			placeholder,
			items,
			title,
		};
		return acc;
	}, {} as AccordionsData);
}
