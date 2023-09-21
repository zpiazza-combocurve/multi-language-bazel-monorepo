import { createTheme } from '@material-ui/core/styles';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';

import axios from '@/helpers/routing/axiosApi';
import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { AgentInstancesDetailComponent } from './AgentDetailInstances.component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mock = new MockAdapter(axios as any, { delayResponse: 100 });

const renderSut = ({ props }) => {
	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<AgentInstancesDetailComponent {...props} />
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

const versionsReponse = [];

const defaultProps = {
	hasLatestVersion: false,
	loading: false,
	data: {
		data: {
			isIdle: false,
			dataSyncAgentName: 'Test',
			version: '1.0.0',
		},
	},
	permissions: { canRequestUpdate: true },
	fetchAgentStates: vi.fn().mockReturnValue(Promise.resolve({})),
	fetchAgentInstances: vi.fn().mockReturnValue(Promise.resolve({})),
	handleStateMessageCellClicked: vi.fn(),
	handlePartialResultCellClicked: vi.fn(),
	promptChooseVersionDialog: vi.fn(),
};
let props;

describe('<AgentDetail />', () => {
	beforeEach(() => {
		mock.reset();
		props = { ...defaultProps };
	});

	test('renderes without crashes', async () => {
		mock.onGet(/data-sync\/agent-instances\/versions$/).reply(200, versionsReponse, defaultResponseHeaders);
		mock.onGet(/data-sync\/agent-instances\/\w+$/).reply(200, { data: {} }, defaultResponseHeaders);
		mock.onGet('/notifications').reply(200, {}, defaultResponseHeaders);

		const { getByText } = renderSut({ props });
		await waitFor(() => {
			const chooseVersion = getByText('Request update');
			const runHistory = getByText('Run history');
			const states = getByText('States');
			expect(chooseVersion).toBeInTheDocument();
			expect(runHistory).toBeInTheDocument();
			expect(states).toBeInTheDocument();
		});
	});

	test('triggers request update dialog', async () => {
		mock.onGet(/data-sync\/agent-instances\/versions$/).reply(200, versionsReponse, defaultResponseHeaders);
		mock.onGet(/data-sync\/agent-instances\/\w+$/).reply(200, { data: {} }, defaultResponseHeaders);
		mock.onGet('/notifications').reply(200, [], defaultResponseHeaders);

		const { getByText } = renderSut({ props });
		let chooseVersion: Element | null;
		await waitFor(() => {
			chooseVersion = getByText('Request update').closest('button');
		});

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		await userEvent.click(chooseVersion!);

		expect(props.promptChooseVersionDialog).toHaveBeenCalledTimes(1);
	});
});
