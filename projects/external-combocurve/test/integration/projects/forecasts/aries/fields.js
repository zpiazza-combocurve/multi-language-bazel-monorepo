const toApiAriesForecastData = (ariesForecastData) => ({
	well: ariesForecastData.well.toString(),
	forecast: getColumns(ariesForecastData, 'forecast'),
});

const getColumns = (ariesForecastData, field) => ariesForecastData[field].map(toApiForecastColumns);

const toApiForecastColumns = (ariesColumns) => ({
	PROPNUM: ariesColumns.PROPNUM,
	'WELL NAME': ariesColumns['WELL NAME'],
	'WELL NUMBER': ariesColumns['WELL NUMBER'],
	'INPT ID': ariesColumns['INPT ID'],
	API10: ariesColumns.API10,
	API12: ariesColumns.API12,
	API14: ariesColumns.API14,
	'CHOSEN ID': ariesColumns['CHOSEN ID'],
	'ARIES ID': ariesColumns['ARIES ID'],
	'PHDWIN ID': ariesColumns['PHDWIN ID'],
	SECTION: ariesColumns.SECTION,
	SEQUENCE: ariesColumns.SEQUENCE,
	QUALIFIER: ariesColumns.QUALIFIER,
	KEYWORD: ariesColumns.KEYWORD,
	EXPRESSION: ariesColumns.EXPRESSION,
});

module.exports = {
	toApiAriesForecastData,
};
