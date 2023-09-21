import { createTheme } from '@material-ui/core/styles';
import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from '@/helpers/theme';

import { ItemMenu, ReportSideBar } from './ReportSideBar';

const renderSut = (onMenuClickMock = vi.fn()) => {
	const theme = createTheme();

	render(
		<ThemeProvider theme={theme}>
			<ReportSideBar activeMenu={ItemMenu.WellList} onMenuClick={onMenuClickMock} />
		</ThemeProvider>
	);
};

describe('Reports SideBar', () => {
	it('should render menu options', () => {
		renderSut();

		expect(screen.getByRole('button', { name: 'well list' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'filter' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'map' })).toBeInTheDocument();

		expect(screen.getByRole('button', { name: 'print' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'fullscreen' })).toBeInTheDocument();
	});

	it.each`
		id                     | label
		${ItemMenu.WellList}   | ${'well list'}
		${ItemMenu.Filter}     | ${'filter'}
		${ItemMenu.Map}        | ${'map'}
		${ItemMenu.Print}      | ${'print'}
		${ItemMenu.Fullscreen} | ${'fullscreen'}
	`('should call the handler with $id param when user clicks on $label', ({ id, label }) => {
		const onMenuClickMock = vi.fn();

		renderSut(onMenuClickMock);

		fireEvent.click(screen.getByRole('button', { name: label }));

		expect(onMenuClickMock).toHaveBeenCalledTimes(1);
		expect(onMenuClickMock).toHaveBeenCalledWith(id);
	});
});
