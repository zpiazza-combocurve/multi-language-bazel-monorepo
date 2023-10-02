const re = /<([^<>]+)>;rel="([^"]+)"/g;

/**
 * @param {Record<string, string> | undefined} response_headers
 * @returns {string | undefined}
 */
const get_next_page_url = (response_headers) => {
	const link_header = response_headers?.link || '';

	const matches = [...link_header.matchAll(re)];

	return matches.find((match) => match?.[2] == 'next')?.[1];
};

module.exports = {
	get_next_page_url,
};
