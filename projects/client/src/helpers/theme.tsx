import { PaletteType, ThemeOptions } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider as MuiThemeProvider, StylesProvider, createTheme, useTheme } from '@material-ui/core/styles';
import _ from 'lodash';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { useHotkey } from '@/components/hooks/useHotkey';
import { addHOCName } from '@/components/shared';
import { AlfaStore, useAlfa, useAlfaStore } from '@/helpers/alfa';
import { useDebounce } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';

export enum Theme {
	light = 'light',
	dark = 'dark',
}

/** @deprecated Use `Theme` instead */
export const THEME = {
	LIGHT: Theme.light,
	DARK: Theme.dark,
} as const;

export const THEME_MODE = {
	CLASSIC: 'classic',
} as const;

type ThemeMode = (typeof THEME)[keyof typeof THEME];

export function setThemeMode(altTheme: string) {
	document.body.dataset.theme = altTheme;
}

const REACT_MD_DARK_THEME = 'react-md-dark-theme';

export function themeInpt(theme: ThemeMode) {
	if (theme) {
		document.body.classList.remove(THEME.LIGHT);
		document.body.classList.remove(THEME.DARK);
		document.body.classList.remove(REACT_MD_DARK_THEME);
		document.body.classList.add(theme);
		if (theme === THEME.DARK) {
			document.body.classList.add(REACT_MD_DARK_THEME);
		}
	}
}

export function useThemeInpt() {
	const { theme: alfaTheme, themeMode } = useAlfa();
	useEffect(() => {
		setThemeMode(themeMode || '');
		themeInpt((alfaTheme as ThemeMode) || THEME.DARK);
	}, [alfaTheme, themeMode]);
}

export function useSyncTheme() {
	const { theme: alfaTheme, authenticated, themeMode } = useAlfa();
	const updateBootstrapTheme = useDebounce(
		() =>
			Promise.all([
				postApi('/user/updateBootstrap', { key: 'theme', value: alfaTheme }),
				postApi('/user/updateBootstrap', { key: 'themeScheme', value: themeMode }),
			]),
		1000
	);
	useEffect(() => {
		if (authenticated) {
			updateBootstrapTheme();
			return () => updateBootstrapTheme.cancel();
		}
	}, [alfaTheme, authenticated, themeMode, updateBootstrapTheme]);
}

/**
 * Sets the theme configuration
 *
 * @example
 * 	setTheme({ themeMode: 'classic', theme: 'light' });
 * 	setTheme({ themeMode: 'classic', theme: 'dark' });
 */
export function setTheme(options: Pick<AlfaStore, 'themeMode' | 'theme'>) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	useAlfaStore.setState(_.omitBy(options, (value) => value == null) as any);
}

/**
 * @example
 * 	toggleSwitch(false, false, true); // true
 * 	toggleBoolean(true, false, true); // false
 * 	toggleBoolean('company', 'company', 'project'); // project
 * 	toggleBoolean('dark', 'dark', 'light'); // light
 * 	toggleBoolean('light', 'dark', 'light'); // dark
 * 	toggleBoolean('asd', 'dark', 'light'); // dark
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function toggleSwitch<A, B>(val: any, optionA: A, optionB: B): A | B {
	return val === optionA ? optionB : optionA;
}

export function toggleTheme() {
	useAlfaStore.setState((p) => ({ theme: toggleSwitch(p.theme, THEME.LIGHT, THEME.DARK) }));
}

export function useThemeKeyboardToggle() {
	useHotkey('alt+t', () => {
		toggleTheme();
		return false;
	});
}

export const getCurrentTheme = () => {
	const bodyStyles = getComputedStyle(document.body);
	return {
		background: bodyStyles.getPropertyValue('--background').trim(),
		backgroundOpaque: bodyStyles.getPropertyValue('--background-opaque').trim(),
	};
};

export const chartHoverColor = '#9A9A9A';

export function getTheme(type: PaletteType, { background, backgroundOpaque }): ThemeOptions {
	return {
		zIndex: {
			datePicker: 9999999, // date picker will always be ontop of everything else
		},
		palette: {
			type,
			primary: { main: '#12c498' },
			secondary: { main: '#228ada' },
			error: { main: '#f9534b' },
			warning: { main: '#fd9559' },
			purple: { main: '#c65efc' },
			background: {
				default: background,
				paper: background, // TODO use backgroundOpaque in the future?
				opaque: backgroundOpaque,
			},
			products: {
				oil: '#12c498',
				ngl: '#9966ff',
				gas: '#f9534b',
				water: '#228ada',
				drip_cond: 'darkcyan',
				fixed_expenses: type === 'light' ? 'dark' : 'white',
			},
			charts: {
				excluded: '#CBA6A6',
				hovered: chartHoverColor,
				selected: type === 'light' ? '#565656' : '#C8C8C8',
			},
		},
		overrides: {
			MuiCssBaseline: {
				'@global':
					type === 'dark'
						? {
								body: {
									'color-scheme': 'dark', // this adds styling to the scrollbar and other browser components
								},
						  }
						: {},
			},
		},
	};
}

function useMUITheme() {
	const [vars, setColors] = useState(() => getCurrentTheme());

	const { theme: alfaTheme, themeMode } = useAlfa();
	const type = alfaTheme === THEME.DARK ? THEME.DARK : THEME.LIGHT;

	useEffect(() => {
		setColors(getCurrentTheme());
	}, [alfaTheme, themeMode]);

	return useMemo(() => createTheme(getTheme(type, vars)), [vars, type]);
}

/** Provides the theme for both styled-component and mui */
export function ThemeProvider({ theme, children }) {
	return (
		<MuiThemeProvider theme={theme}>
			<StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
		</MuiThemeProvider>
	);
}

/** This is only useful for toggling between legacy mui v4 and mui v5 theme */
export function MaterialThemeProvider(props: { children?: React.ReactNode }) {
	const muiTheme = useMUITheme();
	return <MuiThemeProvider theme={muiTheme}>{props.children}</MuiThemeProvider>;
}

/** This is only useful for toggling between legacy mui v4 and mui v5 theme */
export function withMaterialThemeProvider<P>(Component: React.ComponentType<P>) {
	function WithMaterialThemeProvider(props: P, ref: unknown) {
		return (
			<MaterialThemeProvider>
				<Component ref={ref} {...(props as P)} />
			</MaterialThemeProvider>
		);
	}

	return addHOCName(forwardRef(WithMaterialThemeProvider), 'withMuiThemeProvider', Component);
}

export function ThemeHandler({ children }) {
	useThemeInpt();
	useSyncTheme();
	useThemeKeyboardToggle();
	const muiTheme = useMUITheme();
	return (
		<ThemeProvider theme={muiTheme}>
			<StylesProvider injectFirst>
				<CssBaseline />
				{children}
			</StylesProvider>
		</ThemeProvider>
	);
}

/**
 * Creates a `ThemeProvider` with the theme ready to be injected
 *
 * @example
 * 	const SmallerTheme = withExtendedThemeProvider((prevTheme) =>
 * 		createTheme({
 * 			...prevTheme,
 * 			props: {
 * 				MuiButton: { size: 'small' },
 * 				MuiIconButton: { size: 'small' },
 * 				MuiIcon: { fontSize: 'small' },
 * 				MuiFab: { size: 'small' },
 * 				MuiInput: { margin: 'dense' },
 * 				MuiCheckbox: { size: 'small' },
 * 			},
 * 		})
 * 	);
 */
export function withExtendedThemeProvider(theme: ThemeOptions | ((oldTheme: ThemeOptions) => ThemeOptions)) {
	return ({ children }) => {
		const oldTheme = useTheme();
		const customTheme = useMemo(() => {
			if (typeof theme === 'function') {
				return theme(oldTheme);
			}
			return theme;
		}, [oldTheme]);
		return <ThemeProvider theme={customTheme}>{children}</ThemeProvider>;
	};
}
