import { createTheme } from '@material-ui/core/styles';
import { render } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import axios from '@/helpers/routing/axiosApi';
import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { DataSourcesTable } from './DataSourcesTable';

vi.mock('uuid', async () => ({
	v4: () => '123456789',
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mock = new MockAdapter(axios as any, {});

const renderSut = () => {
	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<DataSourcesTable />
			</ThemeProvider>
		</Wrapper>,
		{
			wrapper: SnapshotFriendlyStylesProviderWrapper,
		}
	);
};

const defaultResponseHeaders = {
	'inpt-client-latest': true,
};

describe('<DataSourcesTable />', () => {
	test('renders without crashes', () => {
		mock.onGet(/data-sync\/data-sources/).reply(200, { provisioned: false }, defaultResponseHeaders);

		renderSut();
	});
});
