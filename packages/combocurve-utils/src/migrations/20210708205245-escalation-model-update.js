// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const EscalationFrequency = {
	label: 'Constant',
	value: 'constant',
};

const CalculationMethod = {
	label: 'Compound',
	value: 'compound',
};

const pctPerYear = {
	label: '%/Year (APY)',
	value: 'pct_per_year',
};

const dollarPerYear = {
	label: '$/Year',
	value: 'dollar_per_year',
};

const pctPerMonth = {
	label: '%/Month',
	value: 'pct_per_month',
};

const dollarPerMonth = {
	label: '$/Month',
	value: 'dollar_per_month',
};

const buildUpdatesUp = async (batch) => {
	return batch.map(({ _id, econ_function, options }) => {
		const updatedEconRows = econ_function.escalation_model.rows.map((row) => {
			const updatedRow = { ...row };
			if (Object.prototype.hasOwnProperty.call(updatedRow, 'dollar_per_month')) {
				updatedRow.dollar_per_year = updatedRow.dollar_per_month * 12;
				delete updatedRow.dollar_per_month;
			} else {
				updatedRow.pct_per_year = updatedRow.pct_per_month * 12;
				delete updatedRow.pct_per_month;
			}
			return updatedRow;
		});

		const headersEscalationValue =
			options.escalation_model.row_view.headers.escalation_value.value === 'pct_per_month'
				? pctPerYear
				: dollarPerYear;

		return {
			updateOne: {
				filter: { _id },
				update: {
					$set: {
						'options.escalation_model.row_view.headers.escalation_value': headersEscalationValue,
						'options.escalation_model.escalation_frequency': EscalationFrequency,
						'options.escalation_model.calculation_method': CalculationMethod,
						'econ_function.escalation_model.rows': updatedEconRows,
						'econ_function.escalation_model.escalation_frequency': 'constant',
						'econ_function.escalation_model.calculation_method': 'compound',
					},
					$mul: {
						'options.escalation_model.row_view.rows.$[].escalation_value': 12,
					},
				},
			},
		};
	});
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'escalation', 'options.escalation_model.escalation_frequency': { $exists: false } },
	buildUpdates: buildUpdatesUp,
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

const buildUpdatesDown = async (batch) => {
	return batch.map(({ _id, econ_function, options }) => {
		const updatedEconRows = econ_function.escalation_model.rows.map((row) => {
			const updatedRow = { ...row };
			if (Object.prototype.hasOwnProperty.call(updatedRow, 'dollar_per_year')) {
				updatedRow.dollar_per_month = updatedRow.dollar_per_year / 12;
				delete updatedRow.dollar_per_year;
			} else {
				updatedRow.pct_per_month = updatedRow.pct_per_year / 12;
				delete updatedRow.pct_per_year;
			}
			return updatedRow;
		});

		const headersEscalationValue =
			options.escalation_model.row_view.headers.escalation_value.value === 'pct_per_year'
				? pctPerMonth
				: dollarPerMonth;

		return {
			updateOne: {
				filter: { _id },
				update: {
					$unset: {
						'options.escalation_model.escalation_frequency': '',
						'options.escalation_model.calculation_method': '',
						'econ_function.escalation_model.escalation_frequency': '',
						'econ_function.escalation_model.calculation_method': '',
					},
					$set: {
						'options.escalation_model.row_view.headers.escalation_value': headersEscalationValue,
						'econ_function.escalation_model.rows': updatedEconRows,
					},
					$mul: {
						'options.escalation_model.row_view.rows.$[].escalation_value': 1 / 12,
					},
				},
			},
		};
	});
};

const batchUpdateDown = createBatchBulkUpdate({
	collection: 'assumptions',
	query: { assumptionKey: 'escalation', 'options.escalation_model.escalation_frequency': { $exists: true } },
	buildUpdates: buildUpdatesDown,
});

async function down({ db }) {
	await batchUpdateDown({ db });
}

module.exports = {
	up,
	down,
	EscalationFrequency,
	CalculationMethod,
	pctPerYear,
	dollarPerYear,
	pctPerMonth,
	dollarPerMonth,
	uses: ['mongodb'],
};
