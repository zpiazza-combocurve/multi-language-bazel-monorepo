import { List, ListItem, ListItemText, ListSubheader, TextField } from '@material-ui/core';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { css } from 'styled-components';

import { counter } from '@/helpers/Counter';
import { useDebouncedValue } from '@/helpers/debounce';
import { Resolver } from '@/helpers/promise';
import { matchText } from '@/helpers/regexp';
import { theme } from '@/helpers/styled';

import { Placeholder } from './Placeholder';

const EMPTY_ARRAY = [];

const compactStyles = css`
	&& {
		li > * {
			margin-top: 0.25rem;
			margin-bottom: 0.25rem;
			padding-bottom: 0.75rem;
			padding-top: 0.75rem;
		}
	}
`;

const customColor = (color) => css`
	--text-color: ${color};
	--text-color-secondary: ${color};
	color: ${color};
`;

const stickyStyles = css`
	position: sticky;
	top: 0;
	background-color: var(--background);
	z-index: 1;
`;

const hightlightColor = customColor(theme.primaryColor);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface SelectListItem<T = any> {
	key?: string;
	value: T;
	highlight?: boolean;
	primaryText?: string;
	secondaryText?: string;
}

type SelectListItemWithValueId<T> = SelectListItem<T> & { value: T & { _id: string } };

export function SelectList<T>({
	label = undefined,
	listItems = EMPTY_ARRAY,
	value: selected,
	onChange,
	// withSearch will help your already loaded listItem to be searched
	// for any values
	withSearch = false,
	// withAsyncSearch will help you call your listItems function with a
	// unique string param to look up for results in the DB rather than
	// just on local results
	withAsyncSearch = false,
	stickySearch = false,
	compact = false,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getKey = _.identity as any,
	...props
}: {
	label?: string | undefined;
	value: T | null;
	onChange: (newValue: T | null) => void;
	listItems: Resolver<SelectListItem<T>[]> | Resolver<SelectListItem<T>[], [string]> | undefined;
	compact?: boolean;
	withSearch?: boolean;
	withAsyncSearch?: boolean;
	stickySearch?: boolean;
	className?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	styles?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getKey?: any;
}) {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebouncedValue(search);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const queryKey = useMemo(() => [counter.nextId('__inpt_random_query')], [listItems]);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const localSearchQueryKey = useMemo(() => [counter.nextId('__inpt_random_query')], [listItems]);

	const itemsQuery = useQuery(queryKey, () => {
		if (typeof listItems === 'function') {
			const listItemsFunc = listItems as () => SelectListItem<T>[];
			return Promise.resolve(listItemsFunc());
		}
		return listItems;
	});

	const localSearchItemsQuery = useQuery(localSearchQueryKey, () => {
		if (typeof listItems === 'function' && withAsyncSearch && debouncedSearch) {
			return Promise.resolve(listItems(debouncedSearch));
		}
		return [];
	});

	const keyIteratee = _.iteratee(getKey);
	const selectedKey = selected ? keyIteratee(selected) : null;

	useEffect(() => {
		if (withAsyncSearch) {
			localSearchItemsQuery.refetch();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	// resets search between steps
	useEffect(() => {
		if (!withAsyncSearch) {
			setSearch('');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [listItems]);

	const selectedExists = useMemo(() => (_.isObject(selected) ? !_.isEmpty(selected) : selected != null), [selected]);

	const getJointData = () => {
		const mergedData = [
			...(itemsQuery?.data ?? []),
			...(localSearchItemsQuery?.data ?? []),
		] as SelectListItemWithValueId<T>[];

		const filteredData = mergedData.filter(
			(item, index, self) => self.findIndex((obj) => obj.value._id === item.value._id) === index
		);

		return filteredData.sort((a, b) =>
			!a?.primaryText || !b?.primaryText ? 0 : a.primaryText.localeCompare(b.primaryText)
		);
	};

	const searchableData = withAsyncSearch && search ? getJointData() : itemsQuery.data;

	return (
		<List css={compact ? compactStyles : undefined} disablePadding={!!stickySearch} {...props}>
			{withSearch || withAsyncSearch ? (
				<TextField
					fullWidth
					css={stickySearch ? stickyStyles : undefined}
					label={label ?? 'Search'}
					onChange={(ev) => setSearch(ev.target.value)}
					value={search}
				/>
			) : (
				label && <ListSubheader>{label}</ListSubheader>
			)}
			{itemsQuery.isLoading && <Placeholder loading />}
			{searchableData
				?.filter(
					({ primaryText, secondaryText }) =>
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						matchText(primaryText!, search) || matchText(secondaryText!, search)
				)
				.map(({ key, value, highlight, primaryText, secondaryText }) => (
					<ListItem
						css={highlight ? hightlightColor : undefined}
						key={key ?? keyIteratee(value)}
						onClick={() => onChange(selectedExists && selectedKey === keyIteratee(value) ? null : value)}
						selected={(selectedExists && selectedKey === keyIteratee(value)) ?? false}
						button
					>
						<ListItemText primary={_.truncate(primaryText, { length: 50 })} secondary={secondaryText} />
					</ListItem>
				))}
			{localSearchItemsQuery.isRefetching && <Placeholder loading />}
		</List>
	);
}
