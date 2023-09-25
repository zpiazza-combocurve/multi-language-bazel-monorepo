import { schemas } from 'combocurve-utils/mongo';
import { Document, Types } from 'mongoose';

export const { FORECAST_BASE_PHASES } = schemas;

export const FORECAST_TYPES = {
	Probabilistic: 'probabilistic',
	Deterministic: 'deterministic',
};

export interface ForecastWellAssignmentModel extends Partial<Document> {
	data: { oil: Types.ObjectId; gas: Types.ObjectId; water: Types.ObjectId };
	forecast: Types.ObjectId;
	well: Types.ObjectId;
}
//move this to cc-utils
export interface ForecastDataModel extends Partial<Document> {
	_id: Types.ObjectId;
	data_freq: string;
	forecast: Types.ObjectId;
	forecastType: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	P_dict: Object;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	p_extra: Object;
	phase: string;
	project: Types.ObjectId;
	warning: { status: boolean; message: string };
	well: Types.ObjectId;
}

export interface DeterministicForecastDataModel extends Document {
	_id: Types.ObjectId;
	data_freq: string;
	forecast: Types.ObjectId;
	forecastType: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	P_dict: Object;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	p_extra: Object;
	phase: Types.ObjectId;
	project: Types.ObjectId;
	warning: { status: boolean; message: string };
	well: Types.ObjectId;
}

export type ForecastParameterModel = {
	_id: Types.ObjectId;
	forecastType: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	forecastSubType: Object;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	P_dict: Object;
	phase: Types.ObjectId;
	project: Types.ObjectId;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	ratio: Object;
	warning: { status: boolean; message: string };
	well: Types.ObjectId;
};

export interface ForecastSegmentModel {
	b?: number;
	c?: number;
	D?: number;
	D_eff?: number;
	k?: number;
	end_idx: number;
	name: string;
	q_end?: number;
	q_start?: number;
	realized_D_eff_sw?: number;
	start_idx: number;
	sw_idx?: number;
	target_D_eff_sw?: number;
}

export interface ForecastModel extends Partial<Document> {
	wells: Types.ObjectId[];
	project: Types.ObjectId;
	type: string;
}

export type DeterministicPdict = {
	P_dict: {
		best: {
			segments: ForecastSegmentModel[];
		};
	};
};
