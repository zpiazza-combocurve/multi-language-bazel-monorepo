/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MultipleValidationError } from '@src/api/v1/multi-error';
import { TypeError } from '@src/helpers/validation';

import { checkModelDuplicates, parseApiCapex } from './validation';

const getValidCapexPayload = (): Record<string, any> => ({
	name: 'rest api test',
	unique: false,
	otherCapex: {
		rows: [
			{
				category: 'pad',
				description: 'R Api Desc',
				tangible: 5,
				intangible: 10,
				capexExpense: 'capex',
				afterEconLimit: true,
				calculation: 'net',
				escalationModel: 'none',
				escalationStart: {
					applyToCriteria: 10,
				},
				depreciationModel: 'none',
				dealTerms: 1,
				fromSchedule: 'offset_to_pad_preparation_mob_end',
				padPreparationMobEnd: 445,
			},
		],
	},
	drillingCost: {
		dollarPerFtOfVertical: 25,
		dollarPerFtOfHorizontal: 1,
		fixedCost: 88,
		tangiblePct: 26,
		calculation: 'net',
		escalationModel: '642f2f56670d176d8558ef7b',
		depreciationModel: '643c2c55ecea760012942188',
		dealTerms: 445,
		rows: [
			{
				pctOfTotalCost: 25,
				scheduleEnd: 10,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 20,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 30,
			},
			{
				pctOfTotalCost: 25,
				scheduleEnd: 40,
			},
		],
	},
	completionCost: {
		dollarPerFtOfVertical: 23,
		dollarPerFtOfHorizontal: [
			{
				propLl: 222,
				unitCost: 14,
			},
			{
				propLl: 77,
				unitCost: 15,
			},
		],
		fixedCost: 225,
		tangiblePct: 80,
		calculation: 'net',
		escalationModel: '62fbcecfcab9dfc5b88427c4',
		depreciationModel: '643c83a9caa3710012596294',
		dealTerms: 3,
		rows: [
			{
				pctOfTotalCost: 50,
				offsetToAsOf: 10,
			},
			{
				pctOfTotalCost: 50,
				offsetToAsOf: 100,
			},
		],
	},
});

describe('v1/projects/econ-models/capex/validation.test', () => {
	describe('parseApiCapex capex.otherCapex', () => {
		it('should throw an RequiredFieldError if otherCapex is not sent', () => {
			const input = getValidCapexPayload();

			delete input.otherCapex;
			expect(() => parseApiCapex(input)).toThrow('Missing required field: `otherCapex`');
		});

		it('should throw an RequestStructureError if otherCapex is not an object', () => {
			const input = getValidCapexPayload();

			input.otherCapex = 'invalid';
			expect(() => parseApiCapex(input)).toThrow(
				'Invalid value for `otherCapex`: `invalid`. `otherCapex` must be an object.',
			);
		});

		describe('capex.otherCapex', () => {
			describe('capex.otherCapex.probCapex', () => {
				test.skip('should throw an RequiredFieldError if otherCapex.probCapex is not sent', () => {
					const input = getValidCapexPayload();

					delete input.otherCapex.probCapex;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `otherCapex.probCapex`');
				});

				test.skip('should throw an RequestStructureError if otherCapex.probCapex is not boolean', () => {
					const input = getValidCapexPayload();
					input.otherCapex.probCapex = 'invalid';

					const errors = [
						new TypeError(
							'if `probCapex` is not correctly `distributionType`,`mean`,`standardDeviation`,`lowerBound`,`upperBound`,`mode`,`seed` CANNOT be set',
						),
						new TypeError('`invalid` is not a valid Boolean'),
					];

					expect(() => parseApiCapex(input)).toThrow(new MultipleValidationError(errors));
				});

				it('should throw an RequiredFieldError if otherCapex.rows is not sent', () => {
					const input = getValidCapexPayload();

					delete input.otherCapex.rows;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `otherCapex.rows`');
				});

				it('should throw an RequestStructureError if otherCapex.rows is array', () => {
					const input = getValidCapexPayload();
					input.otherCapex.rows = 'invalid';
					expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid array');
				});
				it('should throw an RequestStructureError if otherCapex.rows is empty', () => {
					const input = getValidCapexPayload();
					input.otherCapex.rows = [];
					expect(() => parseApiCapex(input)).toThrow('must NOT have fewer than 1 items');
				});
			});
			describe('otherCapex.rows[0]', () => {
				it('should fail if either `fromSchedule`,`fromHeaders`,`offsetToFpd`,`offsetToDiscountDate`,`offsetToMajorSegment`,`offsetToEconLimit`,`oilRate`,`gasRate`,`waterRate`,`totalFluidRate` or `date` are not set', () => {
					const input = getValidCapexPayload();

					delete input.otherCapex.rows[0].fromSchedule;
					expect(() => parseApiCapex(input)).toThrow(
						'one of the following properties MUST be set: `fromSchedule`,`fromHeaders`,`offsetToFpd`,`offsetToAsOf`,`offsetToDiscountDate`,`offsetToMajorSegment`,`offsetToEconLimit`,`oilRate`,`gasRate`,`waterRate`,`totalFluidRate`,`date`',
					);
				});
				describe('category', () => {
					it('should throw an RequiredFieldError if category is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].category;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.category`',
						);
					});

					it('should throw an RequestStructureError if category is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].category = 'invalid';
						expect(() => parseApiCapex(input)).toThrow(
							'otherCapex.rows[0].category` must be one of the following values: drilling, completion, legal, pad, facilities, artificial_lift, workover, development, pipelines, exploration, waterline, appraisal, other_investment, abandonment, salvage',
						);
					});
				});
				describe('tangible', () => {
					it('should throw a RequiredFieldError if tangible is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].tangible;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.tangible`',
						);
					});

					describe('should throw a ValueError if tangible is not valid', () => {
						it('tangible is not a number', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].tangible = 'invalid';
							expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
						});
						it('tangible is not a greater than 10000000000', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].tangible = 100000000001;
							expect(() => parseApiCapex(input)).toThrow(
								'`otherCapex.rows[0].tangible` must be <= 10000000000',
							);
						});
						it('tangible is not a lesser than 10000000000', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].tangible = -100000000001;
							expect(() => parseApiCapex(input)).toThrow(
								'`otherCapex.rows[0].tangible` must be >= -10000000000',
							);
						});
					});
				});
				describe('intangible', () => {
					it('should throw a RequiredFieldError if intangible is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].intangible;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.intangible`',
						);
					});

					describe('should throw a ValueError if intangible is not valid', () => {
						it('intangible is not a number', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].intangible = 'invalid';
							expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
						});
						it('intangible is not a greater than 10000000000', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].intangible = 100000000001;
							expect(() => parseApiCapex(input)).toThrow(
								'`otherCapex.rows[0].intangible` must be <= 10000000000',
							);
						});
						it('intangible is not a lesser than 10000000000', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].intangible = -100000000001;
							expect(() => parseApiCapex(input)).toThrow(
								'`otherCapex.rows[0].intangible` must be >= -10000000000',
							);
						});
					});
				});
				describe('capexExpense', () => {
					it('should throw a ValueError if capexExpense capex', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].capexExpense = 'invalid';
						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].capexExpense` must be one of the following values: capex',
						);
					});
				});
				describe('afterEconLimit', () => {
					it('should throw an RequiredFieldError if afterEconLimit is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].afterEconLimit;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.afterEconLimit`',
						);
					});

					it('should throw an RequestStructureError if afterEconLimit is not boolean', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].afterEconLimit = 'invalid';

						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid Boolean');
					});
				});
				describe('calculation', () => {
					it('should throw an RequiredFieldError if afterEconLimit is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].calculation;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.calculation`',
						);
					});

					it('should throw an RequestStructureError if afterEconLimit is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].calculation = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].calculation` must be one of the following values: net, gross',
						);
					});
				});
				describe('escalationModel', () => {
					it('should throw an RequiredFieldError if escalationModel is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].escalationModel;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.escalationModel`',
						);
					});

					it('should throw an RequestStructureError if escalationModel is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].escalationModel = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							"If Escalation Model is provided it must be either 'none' or a valid Object Id",
						);
					});
				});
				describe('escalationStart', () => {
					it('should throw an RequiredFieldError if escalationStart is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].escalationStart;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.escalationStart`',
						);
					});

					it('should throw an RequestStructureError if escalationStart is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].escalationStart = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							'Invalid value for `escalationStart`: `invalid`. `escalationStart` must be an object.',
						);
					});
				});
				describe('depreciationModel', () => {
					it('should throw an RequiredFieldError if depreciationModel is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].depreciationModel;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.depreciationModel`',
						);
					});

					it('should throw an RequestStructureError if depreciationModel is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].depreciationModel = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							"If Depreciation Model is provided it must be either 'none' or a valid Object Id",
						);
					});
				});
				describe('dealTerms', () => {
					it('should throw an RequiredFieldError if dealTerms is not sent', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].dealTerms;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.dealTerms`',
						);
					});

					describe('should throw a ValueError if dealTerms is not valid', () => {
						it('dealTerms is not a number', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].dealTerms = 'invalid';
							expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
						});
						it('dealTerms is not a greater than 1000', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].dealTerms = 100000000001;
							expect(() => parseApiCapex(input)).toThrow(
								'`otherCapex.rows[0].dealTerms` must be <= 1000',
							);
						});
						it('dealTerms is not a lesser than 0', () => {
							const input = getValidCapexPayload();
							input.otherCapex.rows[0].dealTerms = -100000000001;
							expect(() => parseApiCapex(input)).toThrow('`otherCapex.rows[0].dealTerms` must be >= 0');
						});
					});
				});
				describe('fromSchedule', () => {
					it('should throw an RequestStructureError if fromSchedule is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].fromSchedule = 'invnalid';

						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].fromSchedule` must be one of the following values: offset_to_pad_preparation_mob_start, offset_to_pad_preparation_mob_end, offset_to_pad_preparation_start, offset_to_pad_preparation_end, offset_to_pad_preparation_demob_start, offset_to_pad_preparation_demob_end, offset_to_spud_mob_start, offset_to_spud_mob_end, offset_to_spud_start, offset_to_spud_end, offset_to_spud_demob_start, offset_to_spud_demob_end, offset_to_drill_mob_start, offset_to_drill_mob_end, offset_to_drill_start, offset_to_drill_end, offset_to_drill_demob_start, offset_to_drill_demob_end, offset_to_completion_mob_start, offset_to_completion_mob_end, offset_to_completion_start, offset_to_completion_end, offset_to_completion_demob_start, offset_to_completion_demob_end',
						);
					});
					it('should throw an RequestStructureError if fromSchedule is valid and fromSchedule property is not set', () => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].padPreparationMobEnd;

						expect(() => parseApiCapex(input)).toThrow(
							'If `fromSchedule` is set, one of the following properties must be set: `padPreparationMobStart`, `padPreparationMobEnd`, `padPreparationStart`, `padPreparationEnd`, `padPreparationDemobStart`, `padPreparationDemobEnd`, `spudMobStart`, `spudMobEnd`, `spudStart`, `spudEnd`, `spudDemobStart`, `spudDemobEnd`, `drillMobStart`, `drillMobEnd`, `drillStart`, `drillEnd`, `drillDemobStart`, `drillDemobEnd`, `completionMobStart`, `completionMobEnd`, `completionStart`, `completionEnd`, `completionDemobStart`, `completionDemobEnd`',
						);
					});
					it('should throw an ValidationError if fromSchedule is valid and the correct property is not set', () => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].padPreparationMobEnd;
						input.otherCapex.rows[0].padPreparationMobStart = 45;
						expect(() => parseApiCapex(input)).toThrow(
							'if `fromSchedule` is set to offset_to_pad_preparation_mob_end the `padPreparationMobEnd` property must be set',
						);
					});

					it.each([
						['padPreparationMobStart'],
						['padPreparationMobEnd'],
						['padPreparationStart'],
						['padPreparationEnd'],
						['padPreparationDemobStart'],
						['padPreparationDemobEnd'],
						['spudMobStart'],
						['spudMobEnd'],
						['spudStart'],
						['spudEnd'],
						['spudDemobStart'],
						['spudDemobEnd'],
						['drillMobStart'],
						['drillMobEnd'],
						['drillStart'],
						['drillEnd'],
						['drillDemobStart'],
						['drillDemobEnd'],
						['completionMobStart'],
						['completionMobEnd'],
						['completionStart'],
						['completionEnd'],
						['completionDemobStart'],
						['completionDemobEnd'],
					])('fromSchedule properties are valid number within their boundaries', (fromScheduleProperty) => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].padPreparationMobEnd;
						input.otherCapex.rows[0][fromScheduleProperty] = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');

						input.otherCapex.rows[0][fromScheduleProperty] = 200000;
						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].' + fromScheduleProperty + '` must be <= 20000',
						);

						input.otherCapex.rows[0][fromScheduleProperty] = -200000;
						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].' + fromScheduleProperty + '` must be >= -20000',
						);
					});
				});
				describe('fromHeaders', () => {
					it('should throw an RequestStructureError if fromHeaders is not valid', () => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].padPreparationMobEnd;
						delete input.otherCapex.rows[0].fromSchedule;

						input.otherCapex.rows[0].refracDate = 1;
						input.otherCapex.rows[0].fromHeaders = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].fromHeaders` must be one of the following values: offset_to_refrac_date, offset_to_completion_end_date, offset_to_completion_start_date, offset_to_date_rig_release, offset_to_drill_end_date, offset_to_drill_start_date, offset_to_first_prod_date, offset_to_permit_date, offset_to_spud_date, offset_to_til, offset_to_first_prod_date_daily_calc, offset_to_first_prod_date_monthly_calc, offset_to_last_prod_date_monthly, offset_to_last_prod_date_daily, offset_to_custom_date_0, offset_to_custom_date_1, offset_to_custom_date_2, offset_to_custom_date_3, offset_to_custom_date_4, offset_to_custom_date_5, offset_to_custom_date_6, offset_to_custom_date_7, offset_to_custom_date_8, offset_to_custom_date_9',
						);
					});
					it('should throw an RequestStructureError if fromHeaders is valid and fromHeaders property is not set', () => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].fromSchedule;
						input.otherCapex.rows[0].fromHeaders = 'offset_to_refrac_date';
						input.otherCapex.rows[0].completionEndDate = 45;
						expect(() => parseApiCapex(input)).toThrow(
							'if `fromHeaders` is set to offset_to_refrac_date the `refracDate` property must be set',
						);
					});

					it('should throw an ValidationError if fromHeaders is valid and the correct property is not set', () => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].fromSchedule;
						input.otherCapex.rows[0].fromHeaders = 'offset_to_refrac_date';

						expect(() => parseApiCapex(input)).toThrow(
							'If `fromHeaders` is set, one of the following properties must be set: `refracDate`, `completionEndDate`, `completionStartDate`, `dateRigRelease`, `drillEndDate`, `drillStartDate`, `firstProdDate`, `permitDate`, `spudDate`, `til`, `firstProdDateDaily`, `firstProdDateMonthly`, `lastProdDateDaily`, `lastProdDateMonthly`, `customDateHeader0`, `customDateHeader1`, `customDateHeader2`, `customDateHeader3`, `customDateHeader4`, `customDateHeader5`, `customDateHeader6`, `customDateHeader7`, `customDateHeader8`, `customDateHeader9`',
						);
					});

					it.each([
						['refracDate'],
						['completionEndDate'],
						['completionStartDate'],
						['dateRigRelease'],
						['drillEndDate'],
						['drillStartDate'],
						['firstProdDate'],
						['permitDate'],
						['spudDate'],
						['til'],
						['customDateHeader0'],
						['customDateHeader1'],
						['customDateHeader2'],
						['customDateHeader3'],
						['customDateHeader4'],
						['customDateHeader5'],
						['customDateHeader6'],
						['customDateHeader7'],
						['customDateHeader8'],
						['customDateHeader9'],
						['firstProdDateDaily'],
						['firstProdDateMonthly'],
						['lastProdDateDaily'],
						['lastProdDateMonthly'],
					])('fromHeaders properties are valid number within their boundaries', (fromHeaderProperty) => {
						const input = getValidCapexPayload();
						delete input.otherCapex.rows[0].fromSchedule;
						input.otherCapex.rows[0].fromHeaders = 'offset_to_refrac_date';
						delete input.otherCapex.rows[0].padPreparationMobEnd;
						input.otherCapex.rows[0][fromHeaderProperty] = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');

						input.otherCapex.rows[0][fromHeaderProperty] = 200000;
						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].' + fromHeaderProperty + '` must be <= 20000',
						);

						input.otherCapex.rows[0][fromHeaderProperty] = -200000;
						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].' + fromHeaderProperty + '` must be >= -20000',
						);
					});
				});
				describe.skip('distributionType', () => {
					it('should throw an RequiredFieldError if distributionType is not sent and probCapex is true', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].distributionType;
						expect(() => parseApiCapex(input)).toThrow(
							'Missing required field: `otherCapex.rows.0.distributionType`',
						);
					});

					it('should throw errors if distributionType is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'invalid';

						expect(() => parseApiCapex(input)).toThrow(
							'`otherCapex.rows[0].distributionType` must be one of the following values: na, normal, lognormal, triangular, uniform',
						);
					});

					it('should throw errors if distributionType = na and "mean", "standardDeviation", "lowerBound", "upperBound" or "mode" are sent', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'na';

						expect(() => parseApiCapex(input)).toThrow(
							'if distributionType is set to `na` only `seed` can be send. `mean`, `standardDeviation`,`lowerBound`,`upperBound` or `mode` cannot be send',
						);
					});
					it('should throw errors if distributionType = normal and "mean", "standardDeviation", "lowerBound", "upperBound" or "mode" are sent', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'normal';
						input.otherCapex.rows[0].mode = 45;

						expect(() => parseApiCapex(input)).toThrow(
							'if distributionType is set to `normal` only `mean`, `standardDeviation`,`lowerBound`,`upperBound` and `seed` MUST be send, `mode` CANNOT be send',
						);
					});
					it('should throw errors if distributionType = lognormal and "mean", "standardDeviation", "lowerBound", "upperBound" or "mode" are sent', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'lognormal';
						input.otherCapex.rows[0].mode = 45;

						expect(() => parseApiCapex(input)).toThrow(
							'if distributionType is set to `lognormal` only `mean`, `standardDeviation`,`lowerBound`,`upperBound` and `seed` MUST be send, `mode` CANNOT be send',
						);
					});

					it('should throw errors if distributionType = triangular and "mean", "standardDeviation", "lowerBound", "upperBound" or "mode" are sent', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'triangular';
						input.otherCapex.rows[0].mode = 45;
						input.otherCapex.rows[0].mean = 45;

						expect(() => parseApiCapex(input)).toThrow(
							'if distributionType is set to `triangular` only `lowerBound`,`upperBound`, `mode` and `seed` MUST be send, `mean` or `standardDeviation` CANNOT be send',
						);
					});
					it('should throw errors if distributionType = uniform and "mean", "standardDeviation", "lowerBound", "upperBound" or "mode" are sent', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].distributionType = 'uniform';
						input.otherCapex.rows[0].mode = 45;
						input.otherCapex.rows[0].mean = 45;

						expect(() => parseApiCapex(input)).toThrow(
							'if distributionType is set to `uniform` only `lowerBound`,`upperBound` and  `seed` MUST be send, `mean`, `mode or `standardDeviation` CANNOT be send',
						);
					});
				});
				describe.skip('seed', () => {
					it('should throw an RequiredFieldError if seed is not sent and probCapex is true', () => {
						const input = getValidCapexPayload();

						delete input.otherCapex.rows[0].seed;
						expect(() => parseApiCapex(input)).toThrow('Missing required field: `otherCapex.rows.0.seed`');
					});

					it('should throw errors if seed is not valid', () => {
						const input = getValidCapexPayload();
						input.otherCapex.rows[0].seed = 'invalid';

						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid integer');
					});
				});
			});
		});
	});

	describe('parseApiCapex capex.drillingCost', () => {
		describe('capex.drillingCost', () => {
			describe('dollarPerFtOfVertical', () => {
				it('should throw a RequiredFieldError if dollarPerFtOfVertical is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.dollarPerFtOfVertical;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `drillingCost.dollarPerFtOfVertical`',
					);
				});
				describe('should throw a ValueError if dollarPerFtOfVertical is not valid', () => {
					it('dollarPerFtOfVertical is not a number', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfVertical = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('dollarPerFtOfVertical is not a greater than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfVertical = 1000001;
						expect(() => parseApiCapex(input)).toThrow(
							'`drillingCost.dollarPerFtOfVertical` must be <= 100000',
						);
					});
					it('dollarPerFtOfVertical is not a lesser than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfVertical = -100000;
						expect(() => parseApiCapex(input)).toThrow('`drillingCost.dollarPerFtOfVertical` must be >= 0');
					});
				});
			});
			describe('dollarPerFtOfHorizontal', () => {
				it('should throw a RequiredFieldError if dollarPerFtOfHorizontal is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.dollarPerFtOfHorizontal;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `drillingCost.dollarPerFtOfHorizontal`',
					);
				});
				describe('should throw a ValueError if dollarPerFtOfHorizontal is not valid', () => {
					it('dollarPerFtOfHorizontal is not a number', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfHorizontal = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('dollarPerFtOfHorizontal is not a greater than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfHorizontal = 1000001;
						expect(() => parseApiCapex(input)).toThrow(
							'`drillingCost.dollarPerFtOfHorizontal` must be <= 100000',
						);
					});
					it('dollarPerFtOfHorizontal is not a lesser than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.dollarPerFtOfHorizontal = -100000;
						expect(() => parseApiCapex(input)).toThrow(
							'`drillingCost.dollarPerFtOfHorizontal` must be >= 0',
						);
					});
				});
			});
			describe('fixedCost', () => {
				it('should throw a RequiredFieldError if fixedCost is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.fixedCost;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `drillingCost.fixedCost`');
				});
				describe('should throw a ValueError if fixedCost is not valid', () => {
					it('fixedCost is not a number', () => {
						const input = getValidCapexPayload();
						input.drillingCost.fixedCost = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('fixedCost is not a greater than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.fixedCost = 1000000001;
						expect(() => parseApiCapex(input)).toThrow('`drillingCost.fixedCost` must be <= 100000000');
					});
					it('fixedCost is not a lesser than 10000000000', () => {
						const input = getValidCapexPayload();
						input.drillingCost.fixedCost = -10000000;
						expect(() => parseApiCapex(input)).toThrow('`drillingCost.fixedCost` must be >= 0');
					});
				});
			});
			describe('tangiblePct', () => {
				it('should throw a RequiredFieldError if tangiblePct is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.tangiblePct;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `drillingCost.tangiblePct`');
				});
				describe('should throw a ValueError if tangiblePct is not valid', () => {
					it('tangiblePct is not a number', () => {
						const input = getValidCapexPayload();
						input.drillingCost.tangiblePct = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('tangiblePct is not a greater than 100', () => {
						const input = getValidCapexPayload();
						input.drillingCost.tangiblePct = 1001;
						expect(() => parseApiCapex(input)).toThrow('`drillingCost.tangiblePct` must be <= 100');
					});
					it('tangiblePct is not a lesser than 0', () => {
						const input = getValidCapexPayload();
						input.drillingCost.tangiblePct = -100;
						expect(() => parseApiCapex(input)).toThrow('`drillingCost.tangiblePct` must be >= 0');
					});
				});
			});
			describe('rows', () => {
				it('should throw a RequiredFieldError if rows is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.rows;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `drillingCost.rows`');
				});

				it('should throw an RequestStructureError if rows is array', () => {
					const input = getValidCapexPayload();
					input.drillingCost.rows = 'invalid';
					expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid array');
				});
				it('should throw an RequestStructureError if rows is empty', () => {
					const input = getValidCapexPayload();
					input.drillingCost.rows = [];
					expect(() => parseApiCapex(input)).toThrow('must NOT have fewer than 1 items');
				});
				it('should throw an RequestStructureError if rows[0].pctOfTotalCost is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.rows[0].pctOfTotalCost;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `drillingCost.rows.0.pctOfTotalCost`',
					);
				});
				it('should throw an RequestStructureError if no criteria is not sent', () => {
					const input = getValidCapexPayload();
					delete input.drillingCost.rows[0].scheduleEnd;
					expect(() => parseApiCapex(input)).toThrow(
						'One of the following properties must be set: `offsetToFpd`,`offsetToAsOf`,`offsetToDiscountDate`,`offsetToFirstSegment`,`scheduleStart`,`scheduleEnd` or `date`',
					);
				});
			});
		});
	});

	describe('parseApiCapex capex.completionCost', () => {
		describe('capex.completionCost', () => {
			describe('dollarPerFtOfVertical', () => {
				it('should throw a RequiredFieldError if dollarPerFtOfVertical is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.dollarPerFtOfVertical;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `completionCost.dollarPerFtOfVertical`',
					);
				});
				describe('should throw a ValueError if dollarPerFtOfVertical is not valid', () => {
					it('dollarPerFtOfVertical is not a number', () => {
						const input = getValidCapexPayload();
						input.completionCost.dollarPerFtOfVertical = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('dollarPerFtOfVertical is not a greater than 10000000000', () => {
						const input = getValidCapexPayload();
						input.completionCost.dollarPerFtOfVertical = 1000001;
						expect(() => parseApiCapex(input)).toThrow(
							'`completionCost.dollarPerFtOfVertical` must be <= 100000',
						);
					});
					it('dollarPerFtOfVertical is not a lesser than 10000000000', () => {
						const input = getValidCapexPayload();
						input.completionCost.dollarPerFtOfVertical = -100000;
						expect(() => parseApiCapex(input)).toThrow(
							'`completionCost.dollarPerFtOfVertical` must be >= 0',
						);
					});
				});
			});
			describe('dollarPerFtOfHorizontal', () => {
				it('should throw a RequiredFieldError if dollarPerFtOfHorizontal is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.dollarPerFtOfHorizontal;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `completionCost.dollarPerFtOfHorizontal`',
					);
				});

				it('should throw an RequestStructureError if dollarPerFtOfHorizontal is not an array', () => {
					const input = getValidCapexPayload();
					input.completionCost.dollarPerFtOfHorizontal = 'invalid';
					expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid array');
				});
				it('should throw an RequestStructureError if dollarPerFtOfHorizontal is empty', () => {
					const input = getValidCapexPayload();
					input.completionCost.dollarPerFtOfHorizontal = [];
					expect(() => parseApiCapex(input)).toThrow('must NOT have fewer than 1 items');
				});
				it('should throw an RequestStructureError if rows[0].propLl is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.dollarPerFtOfHorizontal[0].propLl;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `completionCost.dollarPerFtOfHorizontal.0.propLl`',
					);
				});
				it('should throw an RequestStructureError if rows[0].unitCost is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.dollarPerFtOfHorizontal[0].unitCost;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `completionCost.dollarPerFtOfHorizontal.0.unitCost`',
					);
				});
			});
			describe('fixedCost', () => {
				it('should throw a RequiredFieldError if fixedCost is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.fixedCost;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `completionCost.fixedCost`');
				});
				describe('should throw a ValueError if fixedCost is not valid', () => {
					it('fixedCost is not a number', () => {
						const input = getValidCapexPayload();
						input.completionCost.fixedCost = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('fixedCost is not a greater than 10000000000', () => {
						const input = getValidCapexPayload();
						input.completionCost.fixedCost = 1000000001;
						expect(() => parseApiCapex(input)).toThrow('`completionCost.fixedCost` must be <= 100000000');
					});
					it('fixedCost is not a lesser than 10000000000', () => {
						const input = getValidCapexPayload();
						input.completionCost.fixedCost = -10000000;
						expect(() => parseApiCapex(input)).toThrow('`completionCost.fixedCost` must be >= 0');
					});
				});
			});
			describe('tangiblePct', () => {
				it('should throw a RequiredFieldError if tangiblePct is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.tangiblePct;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `completionCost.tangiblePct`');
				});
				describe('should throw a ValueError if tangiblePct is not valid', () => {
					it('tangiblePct is not a number', () => {
						const input = getValidCapexPayload();
						input.completionCost.tangiblePct = 'invalid';
						expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid number');
					});
					it('tangiblePct is not a greater than 100', () => {
						const input = getValidCapexPayload();
						input.completionCost.tangiblePct = 1001;
						expect(() => parseApiCapex(input)).toThrow('`completionCost.tangiblePct` must be <= 100');
					});
					it('tangiblePct is not a lesser than 0', () => {
						const input = getValidCapexPayload();
						input.completionCost.tangiblePct = -100;
						expect(() => parseApiCapex(input)).toThrow('`completionCost.tangiblePct` must be >= 0');
					});
				});
			});
			describe('rows', () => {
				it('should throw a RequiredFieldError if rows is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.rows;
					expect(() => parseApiCapex(input)).toThrow('Missing required field: `completionCost.rows`');
				});

				it('should throw an RequestStructureError if rows is array', () => {
					const input = getValidCapexPayload();
					input.completionCost.rows = 'invalid';
					expect(() => parseApiCapex(input)).toThrow('`invalid` is not a valid array');
				});
				it('should throw an RequestStructureError if rows is empty', () => {
					const input = getValidCapexPayload();
					input.completionCost.rows = [];
					expect(() => parseApiCapex(input)).toThrow('must NOT have fewer than 1 items');
				});
				it('should throw an RequestStructureError if rows[0].pctOfTotalCost is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.rows[0].pctOfTotalCost;
					expect(() => parseApiCapex(input)).toThrow(
						'Missing required field: `completionCost.rows.0.pctOfTotalCost`',
					);
				});
				it('should throw an RequestStructureError if no criteria is not sent', () => {
					const input = getValidCapexPayload();
					delete input.completionCost.rows[0].offsetToAsOf;
					expect(() => parseApiCapex(input)).toThrow(
						'One of the following properties must be set: `offsetToFpd`,`offsetToAsOf`,`offsetToDiscountDate`,`offsetToFirstSegment`,`scheduleStart`,`scheduleEnd` or `date`',
					);
				});
			});
		});
	});

	describe('checkModelDuplicates', () => {
		it('returns the original array if there are no duplicates', () => {
			const input = [{ name: 'Model1' }, { name: 'Model2' }, { name: 'Model3' }];

			const output = checkModelDuplicates(input);

			expect(output).toEqual(input);
		});

		it('filters out duplicate elements and throws a MultipleValidationError', () => {
			const input = [
				{ name: 'Model1' },
				{ name: 'Model2' },
				{ name: 'Model1' },
				{ name: 'Model3' },
				{ name: 'Model2' },
			];

			expect(() => checkModelDuplicates(input)).toThrow(MultipleValidationError);
		});
	});
});
