import { createTheme } from '@material-ui/core/styles';
import { render } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import axios from '@/helpers/routing/axiosApi';
import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { AgentInstancesList } from './AgentInstancesList';

vi.mock('uuid', async () => ({
	v4: () => '123456789',
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mock = new MockAdapter(axios as any, { delayResponse: 100 });

const renderSut = () => {
	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<AgentInstancesList />
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

const versionsResponse = { data: [] };

describe('<AgentsList/>', () => {
	test('renders without crashes', () => {
		mock.onGet(/data-sync\/agents$/).reply(200, { provisioned: false }, defaultResponseHeaders);
		mock.onGet(/data-sync\/agent-instances\/versions$/).reply(200, { provisioned: false }, versionsResponse);

		renderSut();
	});
});
