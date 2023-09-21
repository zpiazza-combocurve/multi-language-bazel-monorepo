import ReactDataSheet from 'react-datasheet';

import { BaseSelectionPropField } from '@/cost-model/detail-components/shared_types/standard_view_types';

// General

interface SpecialField extends BaseSelectionPropField {
	multiRowHeaderReliance: { criteria: string[] };
}

interface StreamPropertiesFields {
	rate_type: SpecialField;
	rows_calculation_method: SpecialField;
}

export interface BaseCostField {
	fieldName: string;
	fieldType: string;
	helpText?: string;
	subItems?: CostFieldSubItem;
}

export interface CostFieldSubItem {
	row_view: { minRows: number; maxRows: number; columns: object }; // TODO: type columns
}

interface BaseDataSheetSelection {
	cut_off_sheet: ReactDataSheet.Selection | null;
	dates_setting_sheet: ReactDataSheet.Selection | null;
}

interface BaseContentRowHeaders {
	criteria: { label: string; value: string };
	pct_remaining: string;
}
interface BaseContentRowValues {
	criteria: string;
	pct_remaining: number;
}

interface BaseContentItems {
	subItems: { row_view: { criteria: BaseContentRowHeaders; rows: BaseContentRowValues[] } };
}

interface BaseContent {
	rate_type: { label: string; value: string };
	rows_calculation_method: { label: string; value: string };
}

// Shrinkage

export interface ShrinkageProps {
	shrinkage: ShrinkageContent;
	fields: ShrinkageFields;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setShrinkage: (content: { [key: string]: any }, key: string) => void;
	selected: ShrinkageSelection;
	onSelect: (sheet: string, selection: ReactDataSheet.Selection) => void;
}

interface ShrinkageContent extends BaseContent {
	gas: BaseContentItems;
	oil: BaseContentItems;
}

export interface ShrinkageFields extends StreamPropertiesFields {
	gas: BaseCostField;
	oil: BaseCostField;
}

export interface ShrinkageSelection extends BaseDataSheetSelection {
	rate_shrinkage_sheet: ReactDataSheet.Selection | null;
	oil_shrinkage_sheet: ReactDataSheet.Selection | null;
	gas_shrinkage_sheet: ReactDataSheet.Selection | null;
}

// Btu Content

export interface BtuContentProps {
	btu_content: { unshrunk_gas: number; shrunk_gas: number };
	fields: BtuContentFields;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setBtuContent: (content: { [key: string]: any }, key: string) => void;
	selected: BtuContentSelection;
	onSelect: (sheet: string, selection: ReactDataSheet.Selection) => void;
}

interface BtuContentFields {
	shrunk_gas: BtuContentFieldTypes;
	unshrunk_gas: BtuContentFieldTypes;
}

interface BtuContentFieldTypes extends BaseCostField {
	Default: number;
	max: number;
	min: number;
	description: string;
	required: boolean;
	unit: string;
	valType: string;
}

interface BtuContentSelection extends BaseDataSheetSelection {
	btu_content_sheet: ReactDataSheet.Selection | null;
}

// Loss Flare

export interface LossFlareProps {
	loss_flare: LossFlareContent;
	fields: LossFlareFields;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setLossFlare: (content: { [key: string]: any }, key: string) => void;
	selected: LossFlareSelection;
	onSelect: (sheet: string, selection: ReactDataSheet.Selection) => void;
}

export interface LossFlareFields extends StreamPropertiesFields {
	gas_flare: BaseCostField;
	gas_loss: BaseCostField;
	oil_loss: BaseCostField;
}

export interface LossFlareSelection extends BaseDataSheetSelection {
	rate_loss_flare_sheet: ReactDataSheet.Selection;
	oil_loss_loss_flare_sheet: ReactDataSheet.Selection;
	gas_loss_loss_flare_sheet: ReactDataSheet.Selection;
	gas_flare_loss_flare_sheet: ReactDataSheet.Selection;
}

interface LossFlareContent extends BaseContent {
	gas_flare: BaseContentItems;
	gas_loss: BaseContentItems;
	oil_loss: BaseContentItems;
}

// Yields

export interface YieldsProps {
	yields: YieldsContent;
	fields: YieldsFields;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setYields: (content: { [key: string]: any }, key: string) => void;
	selected: YieldsSelection;
	onSelect: (sheet: string, selection: ReactDataSheet.Selection) => void;
}

interface YieldsFields extends StreamPropertiesFields {
	drip_condensate: BaseCostField;
	ngl: BaseCostField;
}

export interface YieldsSelection extends BaseDataSheetSelection {
	yields_sheet_drip_condensate: ReactDataSheet.Selection;
	yields_sheet_ngl: ReactDataSheet.Selection;
	yields_sheet_rates: ReactDataSheet.Selection;
}

interface YieldsContent extends BaseContent {
	drip_condensate: BaseContentItems;
	ngl: BaseContentItems;
}
