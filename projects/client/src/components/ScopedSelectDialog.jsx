import { faSearch, faTrash } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { List, ListItem as MdListItem } from 'react-md';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	alerts,
} from '@/components/v2';
import { iconAdornment } from '@/components/v2/helpers';
import { counter } from '@/helpers/Counter';
import { withDialog } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';
import { resolveValueOrFunction } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { matchText } from '../helpers/regexp';
import { Placeholder } from './Placeholder';
import { useDerivedState, useNewValueOnChange, useSet } from './hooks';

const LIST_ITEM_PRIMARY_TEXT_CLASSNAME = 'inpt-list-item-primary-text-classname'; // list item content classname for changing color

const ListItem = styled(MdListItem)`
	${({ selected }) => selected && `background-color: ${theme.primaryColorOpaque};`}
	&& .${LIST_ITEM_PRIMARY_TEXT_CLASSNAME} {
		${({ highlight }) => highlight && `color: #9966ff;`}
	}
`;

export function useScopedSelectCache() {
	const [cache, setCache] = useState();
	return { cache, setCache };
}

function useStep({ length, onFinish, onCancel, cache, setCache }) {
	const [{ index, values }, setState] = useState(cache ?? { index: 0, values: [] });
	const value = values?.[index];
	useEffect(() => setCache?.({ index, values }), [index, setCache, values]);
	const next = useCallback(
		(newValue) =>
			setState(
				produce((draft) => {
					if (draft.index + 1 === length) {
						onFinish(newValue);
						return;
					}
					draft.index += 1;
					draft.values[draft.index] = newValue;
				})
			),
		[length, onFinish]
	);
	const prev = useCallback(
		() =>
			setState(
				produce((draft) => {
					if (draft.index === 0) {
						onCancel(null);
						return;
					}
					draft.index -= 1;
				})
			),
		[onCancel]
	);
	return { index, value, next, prev };
}

const Padded = styled.div`
	padding: 0 1rem;
`;

const EMPTY_ARRAY = [];

/** `useQuery` but without any key, will depend on the inmutability of the function */
function useAnonymousQuery(fn) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const key = useMemo(() => counter.nextId(), [fn]);
	return useQuery(key, fn);
}

/**
 * @template {{
 * 	value: any;
 * 	primaryText: string;
 * 	secondaryText?: string;
 * 	highlight?: boolean;
 * 	onTrash?: (value: any) => {};
 * }} T
 * @typedef {object} Choice
 * @property {string | ((prevStepSelection?: any) => string)} [title]
 * @property {any[]} [checkboxes] Options to show on current step
 * @property {T[] | ((prevStepSelection?: any) => T[]) | ((prevStepSelection?: any) => Promise<T[]>)} elements Elements
 *   values or function to resolve the values
 */

/**
 * @deprecated Use wizard componnet
 * @typedef {object} Props
 * @property {Choice<any>[]} choices
 * @property {boolean} [visible]
 * @property {(value: null | any) => void} resolve
 * @property {any} [cache]
 * @property {any} [setCache]
 * @param {Props} props
 */
export function ScopedSelectDialog({ choices, visible, resolve, cache, setCache }) {
	const {
		index: stepIndex,
		value,
		next,
		prev,
	} = useStep({
		length: choices.length,
		onFinish: resolve,
		onCancel: resolve,
		cache,
		setCache,
	});
	const [search, setSearch] = useDerivedState('', [stepIndex]);
	const { checkboxes = EMPTY_ARRAY, elements: fetch, title: titleOrFn } = choices[stepIndex];
	const [checkboxesValues, setCheckboxesValues] = useDerivedState({}, [stepIndex]);

	const { data: title, isLoading: loadingTitle } = useAnonymousQuery(
		useCallback(() => Promise.resolve(resolveValueOrFunction(titleOrFn, value)), [titleOrFn, value])
	);
	const { data: elementsRaw, isLoading: loadingElements } = useAnonymousQuery(
		useCallback(() => Promise.resolve(resolveValueOrFunction(fetch, value)), [fetch, value])
	);
	const removedSet = useSet(useNewValueOnChange([], [stepIndex]));

	const handleHide = () => resolve(null);
	const handleRemove = async (index) => {
		const item = elementsRaw[index];
		if (
			await alerts.confirm({
				title: `Are you sure you want to delete ${item.primaryText}`,
				confirmText: 'Delete',
				confirmColor: 'error',
			})
		) {
			removedSet.add(index);
			elementsRaw[index].onTrash(item.value);
		}
	};

	const elements =
		elementsRaw &&
		elementsRaw
			.map((element, index) => ({ ...element, index }))
			.filter(({ index, primaryText, secondaryText, ...rest }) => {
				return (
					!removedSet.set.has(index) &&
					(matchText(primaryText ?? '', search) || matchText(secondaryText ?? '', search)) &&
					checkboxes.reduce((acc, { key }) => acc && (!checkboxesValues[key] || rest[key]), true)
				);
			});

	return (
		<Dialog open={visible} onClose={handleHide} fullWidth>
			<DialogTitle>{title ?? 'Choose'}</DialogTitle>
			<DialogContent>
				<Section key={stepIndex.toString()}>
					<SectionHeader>
						<Padded>
							{checkboxes?.map?.(({ key, text }) => (
								<CheckboxField
									key={key}
									checked={checkboxesValues[key]}
									label={text}
									onChange={(ev) => setCheckboxesValues((p) => ({ ...p, [key]: ev.target.checked }))}
								/>
							))}
						</Padded>
						<Padded>
							<TextField
								fullWidth
								InputProps={{ startAdornment: iconAdornment(faSearch) }}
								onChange={(ev) => setSearch(ev.target.value)}
								value={search}
							/>
						</Padded>
					</SectionHeader>
					<SectionContent>
						<Placeholder loading={loadingElements || loadingTitle}>
							<List>
								{elements &&
									elements.map(
										({
											primaryText,
											secondaryText,
											index,
											value: nextValue,
											onTrash,
											highlight,
										}) => (
											<ListItem
												highlight={highlight}
												key={`_${stepIndex}_${index}`}
												primaryText={primaryText}
												primaryTextClassName={LIST_ITEM_PRIMARY_TEXT_CLASSNAME}
												secondaryText={secondaryText}
												onClick={() => next(nextValue)}
											>
												{onTrash && (
													<IconButton
														color='error'
														onClick={(ev) => {
															ev.stopPropagation();
															handleRemove(index);
														}}
													>
														{faTrash}
													</IconButton>
												)}
											</ListItem>
										)
									)}
							</List>
						</Placeholder>
					</SectionContent>
				</Section>
			</DialogContent>
			<DialogActions>
				<Button onClick={prev}>{stepIndex === 0 ? 'Cancel' : 'Back'}</Button>
			</DialogActions>
		</Dialog>
	);
}

/** @deprecated Use useDialog instead */
const scopedSelectDialogConfirm = withDialog(ScopedSelectDialog);

/** @deprecated Use scopedSelectDialogConfirm */
export const scopedSelectDialog = (choices, { cache } = {}, dialogProps) =>
	scopedSelectDialogConfirm({ choices, ...cache, ...dialogProps });
