import { createTheme } from '@material-ui/core/styles';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// import axios from 'axios';
// import MockAdapter from 'axios-mock-adapter';
//
import { loadYaml } from '@/data-sync/data-flows/pipelines/DataPipeline.hooks';
import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { PipelineForm } from './PipelineForm';
import { generateSchema, makeState } from './PipelineForm.hooks';

// const mock = new MockAdapter(axios, {});

const noop = vi.fn();

const defaultProps = { prefix: 'target', config: '', initialValues: {}, updateValues: noop };

const renderSut = (props: Partial<typeof defaultProps> = defaultProps) => {
	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<PipelineForm {...defaultProps} {...props} />
			</ThemeProvider>
		</Wrapper>,
		{
			wrapper: SnapshotFriendlyStylesProviderWrapper,
		}
	);
};

describe('PipelineForm schema', () => {
	it('returns empty schema without config', () => {
		expect(generateSchema({})).toEqual({ fields: [] });
	});

	it('returns empty schema with undefined', () => {
		expect(generateSchema(undefined)).toEqual({ fields: [] });
	});

	it('returns simple fields if field is available', () => {
		const exampleYaml = loadYaml(`
batchSize:
  type: number
  min: 0
  `);

		expect(generateSchema(exampleYaml)).toEqual({
			fields: [
				{
					'data-testid': 'batchSize',
					component: 'text-field',
					name: 'batchSize',
					label: 'batchSize',
					defaultValue: undefined,
					required: false,
					dataType: 'number',
					validate: [{ type: 'min-length', threshold: 0 }],
				},
			],
		});
	});

	it('parses multiple fields', () => {
		const yamlExample = loadYaml(`
batchSize:
  type: number
  min: 0
connectionString:
  type: object
  properties:
    - name: server
      type: string
      pattern: (regexhere)
      required: true
    - name: username
      type: string
      required: false
   `);
		expect(generateSchema(yamlExample)).toEqual({
			fields: [
				{
					'data-testid': 'batchSize',
					component: 'text-field',
					name: 'batchSize',
					dataType: 'number',
					defaultValue: undefined,
					required: false,
					label: 'batchSize',
					validate: [{ type: 'min-length', threshold: 0 }],
				},
				{
					ItemsGridProps: {
						columnSpacing: 2,
					},
					component: 'sub-form',
					title: 'connectionString',
					name: 'connectionString',
					'data-testid': 'connectionString',
					fields: [
						{
							'data-testid': 'server-connectionString',
							component: 'text-field',
							name: 'connectionString.server',
							label: 'server',
							defaultValue: undefined,
							required: true,
							dataType: 'string',
							validate: [{ type: 'required' }],
						},
						{
							'data-testid': 'username-connectionString',
							component: 'text-field',
							name: 'connectionString.username',
							label: 'username',
							defaultValue: undefined,
							dataType: 'string',
							required: false,
							validate: [],
						},
					],
				},
			],
		});
	});
});

describe('Pipeline state', () => {
	it('has state based on config', () => {
		const yamlExample = loadYaml(`
batchSize:
  type: number
  min: 0
connectionString:
  type: object
  properties:
    - name: server
      type: string
      pattern: (regexhere)
      required: true
      defaultValue: ""
    - name: username
      type: string
      defaultValue: ""
      required: false
   `);

		const state = makeState(yamlExample);

		expect(state).toMatchObject({
			batchSize: undefined,
			connectionString: {
				server: '',
				username: '',
			},
		});
	});
});

// eslint-disable-next-line jest/no-disabled-tests -- TODO eslint fix later
describe.skip('Pipeline form', () => {
	let stubbed;
	let stub;
	beforeEach(() => {
		stubbed = vi.fn();
		stub = () => stubbed;
	});
	it('renders with no configuration', () => {
		stub();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		renderSut({ updateValues: stub as any });
	});

	it('has all the fields from metadata', async () => {
		const yamlExample = `
batchSize:
  type: number
  min: 0
connectionString:
  type: object
  properties:
    - name: server
      type: string
      pattern: (regexhere)
      required: true
    - name: username
      type: string
      required: false
   `;

		const { getByTestId } = renderSut({ updateValues: stub, config: yamlExample });

		await waitFor(() => {
			const batchSize = getByTestId('batchSize');
			const connectionString = getByTestId('connectionString');

			expect(batchSize).toBeInTheDocument();
			expect(connectionString).toBeInTheDocument();
		});
	});

	it('updates values when fields changed', async () => {
		const yamlExample = `
batchSize:
  type: number
  min: 0
connectionString:
  type: object
  properties:
    - name: server
      type: string
      pattern: (regexhere)
      required: true
    - name: username
      type: string
      required: false
   `;
		const { container } = renderSut({ updateValues: stub, config: yamlExample });

		let batchSize;
		await waitFor(() => {
			batchSize = container.querySelector('input[name="batchSize"]');
		});

		userEvent.type(batchSize, '1011');

		await waitFor(() => {
			expect(stub).toHaveBeenCalledWith({
				batchSize: '1011',
			});
		});
	});
	it('validates required values when fields changed', async () => {
		const yamlExample = `
batchSize:
  type: number
  min: 0
connectionString:
  type: object
  properties:
    - name: server
      type: string
      required: true
    - name: username
      type: string
      required: false
   `;
		const { container } = renderSut({ updateValues: stub, config: yamlExample });

		let batchSize;
		await waitFor(() => {
			batchSize = container.querySelector('input[name="batchSize"]');
		});

		userEvent.type(batchSize, '1011');
		userEvent.type(batchSize, '');

		// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
		await waitFor(() => {});
	});
});
