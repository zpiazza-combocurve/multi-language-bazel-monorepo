import { getApi } from '@/helpers/routing';

/** @returns {Promise<import('@/module-list/types').FilterResult<import('./types').Archive>>} */
const getArchives = (query) => getApi(`/archive/archived-projects/versions`, query);

export default {
	getArchives,
};
