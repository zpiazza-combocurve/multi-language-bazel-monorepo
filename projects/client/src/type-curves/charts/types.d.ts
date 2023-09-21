import { Selection } from '@/components/hooks/useSelection';

interface C4Info {
	eur: number[];
}

export interface SharedChartProps {
	// TODO add the others
	curPhase: string;
	chartBehaviors?: { disablePDF?: boolean; disableXLSX?: boolean };
	chartSettings;
	colorBy?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	eurMap: Map<string, any>;
	excludedIds: string[];
	phaseType: 'rate' | 'ratio';
	wellIds: string[];
	eurData: C4Info;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headersMap: Map<string, any>;
	setYAxisLabel(label: string): void;
	selection: Selection;
}
