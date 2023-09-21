import { produce } from 'immer';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as React from 'react';

import { useCallbackRef } from '@/components/hooks';
import { useDebounce } from '@/helpers/debounce';

import { getRecords } from './plugins';

export const LOADING = 'INPT_LOADING';
export const EMPTY = '';

function updateStatus<P>({
	data,
	ids,
	keys,
	status,
	targetStatus = [undefined],
}: {
	data: P;
	ids;
	keys?;
	status;
	targetStatus?;
}) {
	ids.forEach((id) => {
		data[id] = data[id] || {};
		(keys ?? Object.keys(data[id])).forEach((key) => {
			if (targetStatus.includes(data[id][key])) {
				data[id][key] = status;
			}
		});
	});
}

export function useAsyncRows<K extends React.Key = React.Key>({
	ids,
	fetch,
	rowKey,
	headers,
}: {
	ids: K[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fetch: (keys: K[], headersToFetch?: string[]) => Promise<Record<K, any> | any[]>;
	rowKey: string;
	headers?: string[];
}) {
	const lastKeysRef = useRef<Set<K>>(new Set());
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const previousRowData = useRef<Record<K, any>>({} as any);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [rowData, setRowData] = useState<Record<K, any>>({} as any);
	const rows = useMemo(
		() => ids.map((id) => ({ [rowKey]: id, ...(rowData[id] || previousRowData.current[id]) })),
		[ids, rowKey, rowData, previousRowData]
	);

	const fetchData = useCallback(
		async (idsToFetch = ids, headersToFetch = headers) => {
			if (!idsToFetch.length) {
				return;
			}
			setRowData(
				produce((draft) =>
					updateStatus({
						data: draft,
						ids: idsToFetch,
						keys: headersToFetch,
						status: LOADING,
						targetStatus: [undefined],
					})
				)
			);
			const newRows = getRecords(await fetch(idsToFetch, headersToFetch), rowKey);
			setRowData(
				produce((draft) => {
					Object.entries(newRows).forEach(([rowId, row]) => {
						Object.entries(row).forEach(([key, value]) => {
							if (draft[rowId]) {
								draft[rowId][key] = value;
							}
						});
					});
					updateStatus({
						data: draft,
						ids: idsToFetch,
						keys: headersToFetch,
						status: EMPTY,
						targetStatus: [LOADING, null],
					});
				})
			);
		},
		[rowKey, fetch, ids, headers]
	);

	const fetchKeys = useDebounce(async () => {
		fetchData(
			[...lastKeysRef.current].filter((id) => {
				const row = rowData[id];
				if (row) {
					return (headers ?? Object.keys(row))?.some((header) => {
						return row[header] === undefined;
					});
				}
				return true;
			}),
			headers
		);
		lastKeysRef.current = new Set();
	}, 250);

	const onGetKey = useCallback(
		(key) => {
			lastKeysRef.current.add(key);
			fetchKeys();
		},
		[fetchKeys]
	);

	const onGetKeys = useCallback(
		(keys) => {
			keys.forEach((key) => lastKeysRef.current.add(key));
			fetchKeys();
		},
		[fetchKeys]
	);

	const invalidateKeys = useCallbackRef((idsToRefetch = ids, headersToRefetch = headers) => {
		setRowData(
			produce((draft) => {
				idsToRefetch.forEach((id) => {
					draft[id] = draft[id] || {};
					headersToRefetch.forEach((header) => {
						draft[id][header] = undefined;
					});
				});
			})
		);
	});

	return { rows, onGetKey, invalidateKeys, fetchKeys, fetchData, setRowData, onGetKeys };
}
