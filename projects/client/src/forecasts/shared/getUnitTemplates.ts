import { useMemo } from 'react';

import { getConvertFunc } from '@/helpers/units';
import { fields as dailyUnitTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as monthlyUnitTemplate } from '@/inpt-shared/display-templates/units/monthly-units.json';

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
	const convert = useMemo(() => getTcConvertFunc(templateKey), [templateKey]);

	return { convert, loaded: true };
};

export default getUnitTemplates;
export { getTcConvertFunc, unitTemplates, useUnitTemplates, useTcConvertFunc };
