// https://testing-library.com/docs/react-testing-library/setup#custom-render
import { createTheme } from '@material-ui/core/styles';
import { RenderOptions, render } from '@testing-library/react';
import { FC, ReactElement, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from 'react-query';

import { queryClient } from '@/helpers/query-cache';
import { ThemeProvider } from '@/helpers/theme';

const Wrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme] = useState(createTheme());

	return (
		<QueryClientProvider client={queryClient}>
			<DndProvider backend={HTML5Backend}>
				<ThemeProvider theme={theme}>{children}</ThemeProvider>
			</DndProvider>
		</QueryClientProvider>
	);
};

export const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	render(ui, { wrapper: Wrapper, ...options });
