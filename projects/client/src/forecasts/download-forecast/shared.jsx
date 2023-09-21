const genForecastFileName = (name, type) => `${name}_${type}_${new Date().toLocaleString()}.xlsx`;

export { genForecastFileName };
