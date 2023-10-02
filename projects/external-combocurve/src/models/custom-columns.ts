interface ICustomColumnField {
	label: string;
}

export interface ICustomHeaderConfiguration extends Document {
	wells: IWellCustomColumn;
	'monthly-productions': ISingleProductionCustomColumn;
	'daily-productions': ISingleProductionCustomColumn;
}
export interface ISingleProductionCustomColumn {
	customNumber0: ICustomColumnField;
	customNumber1: ICustomColumnField;
	customNumber2: ICustomColumnField;
	customNumber3: ICustomColumnField;
	customNumber4: ICustomColumnField;
}

export interface IWellCustomColumn {
	custom_string_0: ICustomColumnField;
	custom_string_1: ICustomColumnField;
	custom_string_2: ICustomColumnField;
	custom_string_3: ICustomColumnField;
	custom_string_4: ICustomColumnField;
	custom_string_5: ICustomColumnField;
	custom_string_6: ICustomColumnField;
	custom_string_7: ICustomColumnField;
	custom_string_8: ICustomColumnField;
	custom_string_9: ICustomColumnField;
	custom_string_10: ICustomColumnField;
	custom_string_11: ICustomColumnField;
	custom_string_12: ICustomColumnField;
	custom_string_13: ICustomColumnField;
	custom_string_14: ICustomColumnField;
	custom_string_15: ICustomColumnField;
	custom_string_16: ICustomColumnField;
	custom_string_17: ICustomColumnField;
	custom_string_18: ICustomColumnField;
	custom_string_19: ICustomColumnField;
	//numbers
	custom_number_0: ICustomColumnField;
	custom_number_1: ICustomColumnField;
	custom_number_2: ICustomColumnField;
	custom_number_3: ICustomColumnField;
	custom_number_4: ICustomColumnField;
	custom_number_5: ICustomColumnField;
	custom_number_6: ICustomColumnField;
	custom_number_7: ICustomColumnField;
	custom_number_8: ICustomColumnField;
	custom_number_9: ICustomColumnField;
	custom_number_10: ICustomColumnField;
	custom_number_11: ICustomColumnField;
	custom_number_12: ICustomColumnField;
	custom_number_13: ICustomColumnField;
	custom_number_14: ICustomColumnField;
	custom_number_15: ICustomColumnField;
	custom_number_16: ICustomColumnField;
	custom_number_17: ICustomColumnField;
	custom_number_18: ICustomColumnField;
	custom_number_19: ICustomColumnField;
	//dates
	custom_date_0: ICustomColumnField;
	custom_date_1: ICustomColumnField;
	custom_date_2: ICustomColumnField;
	custom_date_3: ICustomColumnField;
	custom_date_4: ICustomColumnField;
	custom_date_5: ICustomColumnField;
	custom_date_6: ICustomColumnField;
	custom_date_7: ICustomColumnField;
	custom_date_8: ICustomColumnField;
	custom_date_9: ICustomColumnField;
	//booleans
	custom_bool_0: ICustomColumnField;
	custom_bool_1: ICustomColumnField;
	custom_bool_2: ICustomColumnField;
	custom_bool_3: ICustomColumnField;
	custom_bool_4: ICustomColumnField;
}
