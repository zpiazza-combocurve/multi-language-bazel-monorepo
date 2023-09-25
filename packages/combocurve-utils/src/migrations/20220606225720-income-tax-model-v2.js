// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const defaultTaxHeader = {
	multiplier: 'Multiplier',
	criteria: {
		label: 'Flat',
		value: 'entire_well_life',
	},
};

const upFederalTaxOption = () => {
	return {
		subItems: {
			row_view: {
				headers: defaultTaxHeader,
				rows: [
					{
						multiplier: '$options.income_tax.federal_income_tax',
						criteria: 'Flat',
					},
				],
			},
		},
	};
};

const upStateTaxOption = () => {
	return {
		subItems: {
			row_view: {
				headers: defaultTaxHeader,
				rows: [
					{
						multiplier: '$options.income_tax.state_income_tax',
						criteria: 'Flat',
					},
				],
			},
		},
	};
};

const upFederalTaxEconFunc = () => {
	return {
		rows: [
			{
				multiplier: '$econ_function.income_tax.federal_income_tax',
				entire_well_life: 'Flat',
			},
		],
	};
};

const upStateTaxEconFunc = () => {
	return {
		rows: [
			{
				multiplier: '$econ_function.income_tax.state_income_tax',
				entire_well_life: 'Flat',
			},
		],
	};
};

const downFederalTaxOption = () => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: ['$options.income_tax.federal_income_tax.subItems.row_view.rows', 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const downStateTaxOption = () => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: ['$options.income_tax.state_income_tax.subItems.row_view.rows', 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const downFederalTaxEconFunc = () => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: ['$econ_function.income_tax.federal_income_tax.rows', 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const downStateTaxEconFunc = () => {
	return {
		$let: {
			vars: {
				first: {
					$arrayElemAt: ['$econ_function.income_tax.state_income_tax.rows', 0],
				},
			},
			in: '$$first.multiplier',
		},
	};
};

const batchUp = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'general_options',
		'options.income_tax.federal_income_tax.subItems': { $exists: false },
	},
	update: [
		{
			$set: {
				'options.income_tax.federal_income_tax': upFederalTaxOption(),
				'econ_function.income_tax.federal_income_tax': upFederalTaxEconFunc(),
				'options.income_tax.state_income_tax': upStateTaxOption(),
				'econ_function.income_tax.state_income_tax': upStateTaxEconFunc(),
			},
		},
	],
});

const batchDown = createBatchUpdate({
	collection: 'assumptions',
	query: {
		assumptionKey: 'general_options',
		'options.income_tax.federal_income_tax.subItems': { $exists: true },
	},
	update: [
		{
			$set: {
				'options.income_tax.federal_income_tax': downFederalTaxOption(),
				'econ_function.income_tax.federal_income_tax': downFederalTaxEconFunc(),
				'options.income_tax.state_income_tax': downStateTaxOption(),
				'econ_function.income_tax.state_income_tax': downStateTaxEconFunc(),
			},
		},
	],
});

async function up({ db }) {
	await batchUp({ db });
}

async function down({ db }) {
	await batchDown({ db });
}

module.exports = { up, down, uses: ['mongodb'] };
