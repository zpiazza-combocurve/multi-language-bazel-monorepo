export const ZOHO_ARTICLE_IDS = {
	// https://support.combocurve.com/portal/en/kb/articles/appending-historical-pricing-data-to-auto-price-decks
	InsertPriceDeck: '404076000011781005',

	// https://support.combocurve.com/portal/en/kb/articles/ \
	// export-to-aries-from-combo-curve-instructions-and-associated-files
	ExportToAries: '404076000014517005',

	//https://support.combocurve.com/portal/en/kb/articles/combocurve-export-assumptions-to-phdwin-guide
	ExportToPhdwin: '404076000027210001',

	// https://support.combocurve.com/portal/en/kb/articles/combocurve-15-10-2021
	DeterministicForecastSetttings: '404076000016084033',

	// https://support.combocurve.com/portal/en/kb/articles/transient-hyperbolic-and-bayesian-models
	BayesianInfo: '404076000016084204',

	// https://support.combocurve.com/portal/en/kb/articles/data-import-23-8-2021-2
	DataImport: '404076000010576270',

	// https://support.combocurve.com/portal/en/kb/articles/combocurve-phdwin-to-combocurve-import-overview
	PhdwinImport: '404076000027210074',
};

const useZoho = () => {
	const openArticle = ({ articleId }) => {
		window.open(
			`/kb/${articleId}`,
			'KB Article',
			`popup=yes,width=${window.innerWidth * 0.75},height=${window.innerHeight * 0.75},left=${
				window.innerWidth * 0.125
			},top=${window.innerHeight * 0.125}`
		);
	};

	return {
		openArticle,
	};
};

export default useZoho;
