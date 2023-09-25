import { fields as dailyUnitTemplate } from '../../display-templates/units/daily-units.json';
import { fields as defaultUnitTemplate } from '../../display-templates/units/default-units.json';
import { fields as monthlyUnitTemplate } from '../../display-templates/units/monthly-units.json';
import { getConvertFunc } from '../../helpers/units';

const unitTemplates = {
	defaultUnitTemplate,
	dailyUnitTemplate,
	monthlyUnitTemplate,
};

const getUnitTemplates = () =>
	Promise.resolve(
		Object.assign([defaultUnitTemplate, dailyUnitTemplate, monthlyUnitTemplate], {
			defaultUnitTemplate,
			dailyUnitTemplate,
			monthlyUnitTemplate,
		})
	);

const useUnitTemplates = () => {
	return { ...unitTemplates, loaded: true };
};

const getTcConvertFunc = (templateKey) =>
	getConvertFunc(dailyUnitTemplate[templateKey], defaultUnitTemplate[templateKey]);

const useTcConvertFunc = (templateKey) => {
	// eslint-disable-next-line no-undef -- TODO eslint fix later
	const convert = useMemo(() => getTcConvertFunc(templateKey), [templateKey]);

	return { convert, loaded: true };
};

export default getUnitTemplates;
export { getTcConvertFunc, unitTemplates, useUnitTemplates, useTcConvertFunc };
