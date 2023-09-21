import { createTheme } from '@material-ui/core/styles';
import { createEvent, fireEvent, render, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import ResizeObserver from 'resize-observer-polyfill';

import axios from '@/helpers/routing/axiosApi';
import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { Overview, OverviewProps } from './DataFlowOverview';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mock = new MockAdapter(axios as any, { delayResponse: 500 });

const defaultResponseHeaders = {
	'inpt-client-latest': true,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
(global as any).ResizeObserver = ResizeObserver;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const renderSut = (props: OverviewProps, payload?: any) => {
	mock.onGet(/data-sync\/data-flows\/\w+$/).reply(200, payload, defaultResponseHeaders);

	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<Overview {...props} />
			</ThemeProvider>
		</Wrapper>,
		{
			wrapper: SnapshotFriendlyStylesProviderWrapper,
		}
	);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const renderSutWithData = (props: OverviewProps, backendPayload: any, dataFlowPayload?: any) => {
	mock.onGet(/data-sync\/data-flows\/\w+\/pipelines$/).reply(200, backendPayload, defaultResponseHeaders);

	const response = renderSut(props, dataFlowPayload);
	return response;
};

const dataFlowPayload = { data: { dataFlow: { id: 'test', description: '', name: '' } } };

describe('<DataFlowOverview />', () => {
	beforeEach(() => {
		mock.reset();
	});

	test('renders without crashes when loading', () => {
		renderSut({ dataFlowId: 'test' }, dataFlowPayload);
	});

	test('renders without crashes when loaded', () => {
		renderSut(
			{
				dataFlowId: 'test',
			},
			dataFlowPayload
		);
	});

	// eslint-disable-next-line jest/no-disabled-tests -- TODO eslint fix later
	describe.skip('renders data flow', () => {
		test('renders data flow section', async () => {
			const { getByTestId } = renderSut(
				{
					dataFlowId: 'test',
				},
				dataFlowPayload
			);

			await waitFor(
				() => {
					const title = getByTestId('data-flow-title');
					expect(title).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		});

		test('renders data flow pipelines', async () => {
			const { getByTestId } = renderSutWithData(
				{
					dataFlowId: 'test',
				},
				{
					items: [
						{
							id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 2,
							name: 'SQL-CC Sync-1',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
						{
							id: '4fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 1,
							name: 'SQL-CC Sync-2',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
					],
				},
				dataFlowPayload
			);

			await waitFor(
				() => {
					const flows = getByTestId('data-flow-body');
					expect(flows).toBeInTheDocument();
				},
				{ timeout: 6000 }
			);
		});

		test('rendered data flow pipelines has two nodes', async () => {
			const { getByText } = renderSutWithData(
				{
					dataFlowId: 'test',
				},
				{
					items: [
						{
							id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 2,
							name: 'SQL-CC Sync-1',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
						{
							id: '4fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 1,
							name: 'SQL-CC Sync-2',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
					],
				},

				dataFlowPayload
			);
			await waitFor(
				() => {
					const firstNode = getByText('SQL-CC Sync-1');
					const secondNode = getByText('SQL-CC Sync-2');
					expect(firstNode).toBeInTheDocument();
					expect(secondNode).toBeInTheDocument();
				},
				{ timeout: 8000 }
			);
		});

		test('rendered data flow pipelines react to click', async () => {
			const fn = vi.fn();
			const { getByText } = renderSutWithData(
				{
					dataFlowId: 'test',
					onDetailClick: fn,
				},
				{
					items: [
						{
							id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 2,
							name: 'SQL-CC Sync-1',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
						{
							id: '4fa85f64-5717-4562-b3fc-2c963f66afa6',
							dataPipelineOrder: 1,
							name: 'SQL-CC Sync-2',
							description: 'SQL to ComboCurve sync pipeline for wells.',
							parameters: 'string',
						},
					],
				},

				dataFlowPayload
			);
			await waitFor(
				() => {
					const firstNode = getByText('SQL-CC Sync-1');

					const myEvent = createEvent.click(firstNode, {});

					fireEvent(firstNode, myEvent);

					expect(fn).toHaveBeenCalled();
				},
				{ timeout: 4500 }
			);
		});
	});
});
