import { formatISO, isFuture, isWeekend, subBusinessDays } from 'date-fns';
import { groupBy } from 'lodash-es';
import { useState } from 'react';
import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListSubheader,
	ReactDatePicker,
	TextField,
} from '@/components/v2';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { matchText } from '@/helpers/regexp';
import { getApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { capitalize } from '@/helpers/text';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

const getKey = (product) => `${capitalize(product.product)} ${capitalize(product.type)}`;

function useProductSelection() {
	const [selection, setSelection] = useState({});
	const select = (cme) =>
		setSelection((p) => {
			const key = getKey(cme);
			return { ...p, [key]: p[key]?.code === cme.code ? null : cme };
		});

	return [selection, select];
}

const FIRST_AVAILABLE_PRODUCTS_DATE = new Date(2021, 2, 4);

/**
 * @typedef {{
 * 	code: number; // unique code
 * 	product: 'oil' | 'gas'; // others
 * 	type: 'price' | 'differentials'; // model
 * 	name: string;
 * 	link: string; // link to page
 * }} CME
 */

/**
 * @param {object} props;
 * @param {boolean} [props.visible]
 * @param {(result: { products: CME[]; date }) => void} props.resolve
 * @param {string} [props.type] If it is either price or differential
 * @param {() => void} props.onHide
 */
export function SelectCMEDialog({ type, onHide, visible, resolve }) {
	const [search, setSearch] = useState('');
	const [selection, select] = useProductSelection();
	const [date, setDate] = useState(() => subBusinessDays(Date.now(), 1));

	const priceDecksQuery = useQuery(
		['price-decks', date],
		/** @returns {Promise<CME[]>} */
		() => getApi('/price-imports/available-products', { date: formatISO(date) }),
		{
			enabled: !!date,
			select: (products) => groupBy(type ? products.filter((p) => p.type === type) : products, (p) => getKey(p)),
		}
	);

	const handleApply = () => resolve({ products: Object.values(selection).filter((v) => !!v), date });

	const isValidDate = (dateToCheck) =>
		!isWeekend(dateToCheck) && dateToCheck >= FIRST_AVAILABLE_PRODUCTS_DATE && !isFuture(dateToCheck);

	const hasProducts = !!date && priceDecksQuery.isSuccess && Object.keys(priceDecksQuery.data).length !== 0;
	const hasSelected = Object.values(selection).filter((v) => !!v).length > 0;

	const { openArticle } = useZoho();

	return (
		<Dialog open={visible} onClose={onHide} fullWidth maxWidth='sm'>
			<DialogTitle>
				<InstructionsBanner onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.InsertPriceDeck })}>
					Read Before Inserting Price Deck
				</InstructionsBanner>
				Choose Price Decks
			</DialogTitle>
			<DialogContent
				css={`
					height: 20rem;
				`}
			>
				<div
					css={`
						position: sticky;
						top: 0;
						z-index: 10;
						background-color: ${theme.background};
					`}
				>
					<ReactDatePicker filterDate={isValidDate} selected={date} onChange={setDate} fullWidth />
					<TextField onChange={(ev) => setSearch(ev.target.value)} placeholder='Search' debounce fullWidth />
				</div>
				<List>
					{!date && <ListSubheader>Must select a date</ListSubheader>}
					{!!date && priceDecksQuery.isLoading && <Placeholder loading />}
					{!!date && priceDecksQuery.isSuccess && Object.keys(priceDecksQuery.data).length === 0 && (
						<ListSubheader>No information available for specified date</ListSubheader>
					)}
					{!!date &&
						priceDecksQuery.isSuccess &&
						Object.keys(priceDecksQuery.data).length !== 0 &&
						Object.entries(priceDecksQuery.data)
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([productType, products], i) => (
								<>
									{i > 0 && <Divider />}
									<ListSubheader>{productType}</ListSubheader>
									{products
										.filter(({ name }) => matchText(name, search))
										.map((cme) => (
											<ListItem
												key={cme.code.toString()}
												selected={selection?.[getKey(cme)]?.code === cme.code}
												onClick={() => select(cme)}
												button
											>
												<ListItemText primary={cme.name} />
											</ListItem>
										))}
								</>
							))}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button onClick={handleApply} disabled={!hasProducts || !hasSelected} color='primary'>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
