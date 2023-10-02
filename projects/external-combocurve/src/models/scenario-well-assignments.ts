import { Document, Types } from 'mongoose';

export interface IScenarioWellAssignments extends Document {
	_id: Types.ObjectId;
	well: Types.ObjectId;
	scenario: Types.ObjectId;
	project: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
	reserves_category: IWellQualifers;
	general_options: IWellQualifers;
	ownership_reversion: IWellQualifers;
	capex: IWellQualifers;
	expenses: IWellQualifers;
	production_taxes: IWellQualifers;
	forecast: IWellQualifers;
	dates: IWellQualifers;
	depreciation: IWellQualifers;
	escalation: IWellQualifers;
	production_vs_fit: IWellQualifers;
	risking: IWellQualifers;
	stream_properties: IWellQualifers;
	differentials: IWellQualifers;
	pricing: IWellQualifers;
}

interface IWellQualifers {
	default: IQualifierModelReference;
	qualifier1?: IQualifierModelReference;
	qualifier2?: IQualifierModelReference;
	qualifier3?: IQualifierModelReference;
	qualifier4?: IQualifierModelReference;
	qualifier5?: IQualifierModelReference;
	qualifier6?: IQualifierModelReference;
	qualifier7?: IQualifierModelReference;
	qualifier8?: IQualifierModelReference;
	qualifier9?: IQualifierModelReference;
	qualifier10?: IQualifierModelReference;
	qualifier11?: IQualifierModelReference;
	qualifier12?: IQualifierModelReference;
	qualifier13?: IQualifierModelReference;
	qualifier14?: IQualifierModelReference;
	qualifier15?: IQualifierModelReference;
	qualifier16?: IQualifierModelReference;
	qualifier17?: IQualifierModelReference;
	qualifier18?: IQualifierModelReference;
	qualifier19?: IQualifierModelReference;
}

interface IQualifierModelReference {
	model: Types.ObjectId | null;
}
