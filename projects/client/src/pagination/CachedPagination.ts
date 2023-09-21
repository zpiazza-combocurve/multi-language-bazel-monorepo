import { genericErrorAlert } from '../helpers/alerts';

/**
 * @param {any} data The dataset as a list that will be used for fetching data
 * @param {number} limit The number of items per page
 * @param {function} fetch The fetch API that uses a member of data as part of the body
 * @param {number} maxSize The maximum size of the store. Default is 500 items.
 * @param {number} pagesToCache The number of pages to cache everytime the parent runs getData. Number of pages are
 *   cached in both directions. Default is 5 pages.
 * @param {string} cacheKey The unique key on each datum to refer to in the store (cannot be 'exp'). Default is '_id'.
 * @param {number} ttl Time to live of each item in the store in seconds. Time to live will only be checked when the
 *   parent tries to run getData. If the item is expired, it will be refetched. Default is 10 minutes.
 */
class CachedPagination {
	cachedFetch: number | null;
	cacheKey: string;
	curPage: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fetch: (x: any[], y: boolean) => any;
	handleStore: boolean;
	length: number;
	limit: number;
	maxSize: number;
	pageCount: number;
	pagesToCache: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	store: Map<any, any>;
	ttl: number;
	constructor({
		data,
		limit,
		fetch,
		handleStore = true,
		maxSize = 500,
		pagesToCache = 5,
		cacheKey = '_id',
		store = new Map(),
		ttl = 60 * 10,
	}) {
		this.cachedFetch = null;
		this.cacheKey = cacheKey;
		this.curPage = 0;
		this.data = data;
		this.fetch = fetch;
		this.handleStore = handleStore;
		this.length = data.length;
		this.limit = limit;
		this.maxSize = maxSize;
		this.pageCount = Math.ceil(data.length / limit);
		this.pagesToCache = pagesToCache;
		this.store = store;
		this.ttl = Math.ceil(ttl) * 1000;
	}

	// getters
	getLength = () => this.length;

	getLimit = () => this.limit;

	getTotalPages = () => this.pageCount;

	getCurrentPage = () => this.curPage;

	getPageItems = (page) => {
		if (page < 0 || page > this.pageCount) {
			return null;
		}

		const lower = page * this.limit;
		const upper = (page + 1) * this.limit;
		return this.data.slice(lower, upper);
	};

	getCurrentIndex = () => this.curPage * this.limit;

	// returns lower index of current page
	getLowerIndex = () => this.curPage * this.limit + 1;

	// returns upper index of current page
	getUpperIndex = () => {
		if (this.canMove(1)) {
			return (this.curPage + 1) * this.limit;
		}
		return this.length;
	};

	// grabs data for the current page and caches pages in both directions after 1.5s
	getData = async (refresh = false) => {
		if (!this.data.length) {
			return [];
		}

		const items = this.getPageItems(this.curPage);
		const output = await this.fetchData(items, refresh);

		if (this.cachedFetch) {
			clearTimeout(this.cachedFetch);
		}

		// @ts-expect-error TODO investigate why it doesn't work
		this.cachedFetch = setTimeout(async () => {
			const toCache = [...Array(this.pagesToCache * 2).keys()]
				.map((val) => val - this.pagesToCache)
				.filter((val) => val !== 0)
				.map((val) => val + this.curPage)
				.map((page) => this.getPageItems(page))
				.filter((val) => val !== null)
				.flat();

			await this.fetchData(toCache);
		}, 1000);

		return output;
	};

	// setters
	setPageCount = () => {
		this.pageCount = Math.ceil(this.length / this.limit);
	};

	setCurPage = (val) => {
		if (val <= this.pageCount) {
			this.curPage = val;
		}
	};

	resetCurrentPage = () => {
		this.curPage = 0;
	};

	setData = (data) => {
		this.data = data;
		this.length = data.length;
		this.setPageCount();
		if (this.getLowerIndex() > this.length) {
			this.resetCurrentPage();
		}
	};

	setLimit = (limit) => {
		this.limit = limit;

		this.setPageCount();
		this.resetCurrentPage();
	};

	// utility functions
	movePage = (direction) => {
		if (this.canMove(direction)) {
			this.curPage += direction;
		}
	};

	canMove = (direction) => this.curPage + direction > -1 && this.curPage + direction < this.pageCount;

	// fetches data using the fetch API given by the parent
	fetchData = async (items, refresh = false) => {
		let toGet: string[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const output: any[] = [];

		if (!refresh) {
			// grab items that are already cached and only fetch items that aren't already cached
			items.forEach((item) => {
				const storedItem = this.store.get(item);
				if (storedItem && new Date().valueOf() - new Date(storedItem.exp).valueOf() < this.ttl) {
					output.push(storedItem);
				} else {
					toGet.push(item);
				}
			});
		} else {
			toGet = items;
		}

		try {
			// returns the relevant data items and runs the given fetch API
			if (toGet.length) {
				const fetchedItems = await this.fetch(toGet, refresh);
				// remove items from cache if it has grown too large
				const dif = this.store.size + fetchedItems.length - this.maxSize;
				if (dif > 0) {
					this.removeItems(dif);
				}

				// for each fetched item, store in the cache
				fetchedItems.forEach((item) => {
					if (this.handleStore) {
						this.store.set(item[this.cacheKey], { ...item, exp: new Date() });
					}

					output.push(item);
				});
			}
			return output;
		} catch (e) {
			genericErrorAlert(e);
			return null;
		}
	};

	// given a value, removes that many of the oldest items from the store
	removeItems = (val) => {
		const iter = this.store.keys();
		for (let i = 0; i < val; i++) {
			const key = iter.next().value;
			this.store.delete(key);
		}
	};

	removeItem = (key) => {
		this.store.delete(key);
	};

	// clear the whole store
	clearStore = () => {
		this.store.clear();
	};
}

export default CachedPagination;
