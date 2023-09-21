import { PriceDeckType } from './PriceDeckButton';

export type DeckProduct = {
	code: string;
	settlements: { date: string; settle: string }[];
};

export type RowStructure = {
	key: string; // The Key label
	criteria: string;
	unit: string;
	category?: string | null;
	escalation?: string;
};

export type ApplyPriceDecksButtonProps = {
	applyCME: (products) => void;
	priceDeckType: PriceDeckType;
};
