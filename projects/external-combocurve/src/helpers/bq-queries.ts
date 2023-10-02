import { ParsedQueryValue, ParseQueryOperator } from './fields/field-definition';

export type BQOperator = '>' | '<' | '<=' | '>=' | '=';
export interface IBQFilters<T = unknown> {
	value: NonNullable<T>;
	operator: BQOperator;
}

const operatorMap: Record<ParseQueryOperator, BQOperator> = {
	le: '<=',
	lt: '<',
	gt: '>',
	ge: '>=',
};

export const getBqFilter = <T>(parsedValues: ParsedQueryValue<T>[]): IBQFilters<T> => {
	// TODO: Allow multi filters
	if (parsedValues.length > 1) {
		throw new Error('Operation not supported');
	}
	return {
		value: parsedValues[0].value,
		operator: !parsedValues[0].operator ? '=' : operatorMap[parsedValues[0].operator],
	};
};
