import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { IFieldDefinition, STRING_FIELD } from '@src/helpers/fields';
import { ITag } from '@src/models/tags';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

export interface IApiTag {
	name?: string;
	description?: string;
}

export const readTagField = <K extends keyof ITag, TParsed = ITag[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
): IField<ITag, ITag[K], TParsed> => readDbField<ITag, K, TParsed>(key, definition, options);

const API_TAGS_FIELDS = {
	name: readTagField('name', STRING_FIELD),
	description: readTagField('description', STRING_FIELD),
};

type ApiTagKey = keyof typeof API_TAGS_FIELDS;

export const toApiTag = (tag: ITag): IApiTag => {
	const apiEconRunTag: Record<string, IApiTag[ApiTagKey]> = {};
	Object.entries(API_TAGS_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEconRunTag[field] = read(tag);
		}
	});
	return apiEconRunTag;
};

export const tagsFieldDefinition = (): IFieldDefinition<IApiTag[]> => {
	return {
		type: OpenApiDataType.array,
		items: { type: OpenApiDataType.object, properties: API_TAGS_FIELDS },
	};
};

export default API_TAGS_FIELDS;
