import { flatten } from 'lodash-es';
import { useState } from 'react';

import { withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { getApi, postApi } from '@/helpers/routing';

const CUSTOM_WELL_HEADERS = {
	string: {
		display: 'Text Headers',
		fields: [
			'custom_string_0',
			'custom_string_1',
			'custom_string_2',
			'custom_string_3',
			'custom_string_4',
			'custom_string_5',
			'custom_string_6',
			'custom_string_7',
			'custom_string_8',
			'custom_string_9',
			'custom_string_10',
			'custom_string_11',
			'custom_string_12',
			'custom_string_13',
			'custom_string_14',
			'custom_string_15',
			'custom_string_16',
			'custom_string_17',
			'custom_string_18',
			'custom_string_19',
		],
	},
	number: {
		display: 'Numeric Headers',
		fields: [
			'custom_number_0',
			'custom_number_1',
			'custom_number_2',
			'custom_number_3',
			'custom_number_4',
			'custom_number_5',
			'custom_number_6',
			'custom_number_7',
			'custom_number_8',
			'custom_number_9',
			'custom_number_10',
			'custom_number_11',
			'custom_number_12',
			'custom_number_13',
			'custom_number_14',
			'custom_number_15',
			'custom_number_16',
			'custom_number_17',
			'custom_number_18',
			'custom_number_19',
		],
	},
	date: {
		display: 'Date Headers',
		fields: [
			'custom_date_0',
			'custom_date_1',
			'custom_date_2',
			'custom_date_3',
			'custom_date_4',
			'custom_date_5',
			'custom_date_6',
			'custom_date_7',
			'custom_date_8',
			'custom_date_9',
		],
	},
	bool: {
		display: 'Boolean (Yes/No) Headers',
		tooltip: (
			<>
				<div>Options for import: Yes, Y, True, 1, No, N, False, 0</div>
				<div>Note: Not case sensitive, Displayed as Yes/No</div>
			</>
		),
		fields: ['custom_bool_0', 'custom_bool_1', 'custom_bool_2', 'custom_bool_3', 'custom_bool_4'],
	},
};

export function useCustomWellHeaderNames() {
	const { wellHeaders, set } = useAlfa();

	const [columnNames, setColumnNames] = useState(() =>
		Object.fromEntries(
			flatten(Object.values(CUSTOM_WELL_HEADERS).map(({ fields }) => fields.map((f) => [f, wellHeaders[f]])))
		)
	);

	const setColumnName = (header, name) => setColumnNames({ ...columnNames, [header]: name });

	const save = async () => {
		await withLoadingBar(postApi('/dt/setCustomHeadersNames', { headers: columnNames, collection: 'wells' }));
		const newWellHeaders = await withLoadingBar(getApi('/dt/getWellHeaders'));
		set('wellHeaders', newWellHeaders);
	};

	return { columns: CUSTOM_WELL_HEADERS, columnNames, setColumnName, save };
}
