import { ThemeProvider, createTheme } from '@mui/material/styles';
import { forwardRef, useMemo } from 'react';

import { addHOCName } from '@/components/shared';

import { useAlfa } from './alfa';
import { Theme } from './theme';

export interface ProductsPalette {
	oil: string;
	ngl: string;
	gas: string;
	water: string;
	drip_cond: string;
}

declare module '@mui/material/styles' {
	interface PaletteOptions {
		products: ProductsPalette;
	}
	interface Palette {
		products: ProductsPalette;
	}
	// see https://mui.com/material-ui/customization/theming/#custom-variables
	interface TypeBackground {
		opaque: string;
	}
}

function MuiV5ThemeProvider(props: { children: React.ReactNode }) {
	const { theme: alfaTheme } = useAlfa(['theme']);
	const mode = alfaTheme === Theme.dark ? 'dark' : 'light';

	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					// see theme-colors.scss for original colors
					mode,
					background: {
						opaque: mode === 'dark' ? '#343434' : '#eee',
					},
					primary: { main: '#12c498' },
					secondary: { main: '#228ada' },
					error: { main: '#f9534b' },
					warning: { main: '#fd9559' },
					products: {
						oil: '#12c498',
						ngl: '#9966ff',
						gas: '#f9534b',
						water: '#228ada',
						drip_cond: 'darkcyan',
					},
				},
				components: {
					MuiSvgIcon: {
						styleOverrides: {
							// slightly smaller icons than the default
							fontSizeSmall: {
								fontSize: '1rem',
							},
							fontSizeMedium: {
								fontSize: '1.3rem',
							},
						},
					},
					MuiTooltip: {
						styleOverrides: {
							// larger font size for tooltips
							tooltip: {
								fontSize: '16px',
								maxWidth: '500px',
							},
						},
					},
				},
			}),
		[mode]
	);
	return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}

export function withMuiV5ThemeProvider<P>(Component: React.ComponentType<P>) {
	function WithMuiV5ThemeProvider(props: P, ref: unknown) {
		return (
			<MuiV5ThemeProvider>
				<Component ref={ref} {...(props as P)} />
			</MuiV5ThemeProvider>
		);
	}

	return addHOCName(forwardRef(WithMuiV5ThemeProvider), 'withMuiV5ThemeProvider', Component);
}

export default MuiV5ThemeProvider;
