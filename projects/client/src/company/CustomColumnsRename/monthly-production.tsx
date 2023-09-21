import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { useLoadingBar, withLoadingBar } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';

const DEFAULT_CUSTOM_MONTHLY_FIELDS = {
	customNumber0: 'Custom Number 0',
	customNumber1: 'Custom Number 1',
	customNumber2: 'Custom Number 2',
	customNumber3: 'Custom Number 3',
	customNumber4: 'Custom Number 4',
};

const CUSTOM_MONTHLY_COLUMNS = {
	number: {
		display: 'Numeric Fields',
		fields: ['customNumber0', 'customNumber1', 'customNumber2', 'customNumber3', 'customNumber4'],
	},
};

export function useCustomMonthlyFieldsNames() {
	const queryClient = useQueryClient();

	const [columnNames, setColumnNames] = useState(DEFAULT_CUSTOM_MONTHLY_FIELDS);

	const { isLoading } = useQuery(
		['custom-headers', 'monthly-productions'],
		() => getApi('/dt/getCustomHeaders', { collection: 'monthly-productions' }),
		{ onSuccess: setColumnNames }
	);

	useLoadingBar(isLoading);

	const setSingleColumnName = (field, name) => setColumnNames({ ...columnNames, [field]: name });

	const save = async () => {
		await withLoadingBar(
			postApi('/dt/setCustomHeadersNames', { headers: columnNames, collection: 'monthly-productions' })
		);
		queryClient.invalidateQueries(['custom-headers', 'monthly-productions']);
	};

	return { columns: CUSTOM_MONTHLY_COLUMNS, columnNames, setColumnName: setSingleColumnName, save };
}
