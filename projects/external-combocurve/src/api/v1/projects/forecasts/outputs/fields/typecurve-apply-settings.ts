import { BOOLEAN_FIELD, getStringEnumField, IFieldDefinition, NUMBER_FIELD } from '@src/helpers/fields';
import { TYPE_CURVE_FPD_SOURCES, TypeCurveApplySetting } from '@src/models/forecast-data';
import { IField } from '@src/api/v1/fields';

export type ApiForecastTypeCurveApplySettingKey = keyof typeof API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS;

type TypeOfForecastTypeCurveApplySettingField<FT> = FT extends ForecastTypeCurveApplySettingField<
	TypeCurveApplySetting,
	infer T
>
	? T
	: never;

export type ApiForecastTypeCurveApplySetting = {
	[key in ApiForecastTypeCurveApplySettingKey]?: TypeOfForecastTypeCurveApplySettingField<
		(typeof API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS)[key]
	>;
};

export type ForecastTypeCurveApplySettingField<T extends TypeCurveApplySetting, TField> = IField<T, TField>;

const readFieldTypeCurveApplySetting = <K extends keyof TypeCurveApplySetting>(
	key: K,
	definition: IFieldDefinition<TypeCurveApplySetting[K]>,
): ForecastTypeCurveApplySettingField<TypeCurveApplySetting, TypeCurveApplySetting[K]> => {
	return {
		...definition,
		read: (typeCurveApplySetting) => typeCurveApplySetting[key],
	};
};

export const API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS = {
	applyNormalization: readFieldTypeCurveApplySetting('applyNormalization', BOOLEAN_FIELD),
	fpdSource: readFieldTypeCurveApplySetting('fpdSource', getStringEnumField(TYPE_CURVE_FPD_SOURCES)),
	riskFactor: readFieldTypeCurveApplySetting('riskFactor', NUMBER_FIELD),
};

export const toApiForecastTypeCurveApplySetting = (
	typeCurveApplySetting: TypeCurveApplySetting,
): ApiForecastTypeCurveApplySetting => {
	const apiForecastTypeCurveApplySetting: Record<
		string,
		ApiForecastTypeCurveApplySetting[ApiForecastTypeCurveApplySettingKey]
	> = {};
	Object.entries(API_FORECAST_TYPE_CURVE_APPLY_SETTINGS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiForecastTypeCurveApplySetting[field] = read(typeCurveApplySetting);
		}
	});
	return apiForecastTypeCurveApplySetting;
};
