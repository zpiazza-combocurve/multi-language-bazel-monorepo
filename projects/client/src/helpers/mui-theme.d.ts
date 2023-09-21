/* eslint-disable @typescript-eslint/no-unused-vars */
// https://stackoverflow.com/questions/61120760/how-to-extend-material-ui-theme-with-typescript
import { Palette, ZIndex } from '@material-ui/core/styles/createPalette';

declare module '@material-ui/core/styles/zIndex' {
	export interface ZIndex {
		datePicker: number;
	}
}

interface ChartPalette {
	excluded: string;
	hovered: string;
	selected: string;
}

interface ProductsPalette {
	oil: string;
	ngl: string;
	gas: string;
	water: string;
	drip_cond: string;
	fixed_expenses: string;
}

declare module '@material-ui/core/styles/createPalette' {
	export interface TypeBackground {
		opaque: string;
	}
	export interface PaletteOptions {
		purple?: PaletteColorOptions;
		products?: ProductsPallete;
		charts?: ChartPalette;
	}
	export interface Palette {
		purple: PaletteColor;
		products: ProductsPallete;
		charts: ChartPalette;
	}
}
