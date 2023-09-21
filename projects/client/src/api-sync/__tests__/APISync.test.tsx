import { fireEvent, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import { APISync } from '@/api-sync/APISync';
import axios from '@/helpers/routing/axiosApi';
import { customRender } from '@/tests/test-utils';

window.open = vi.fn();

const mock = new MockAdapter(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	axios as any, // TODO improve types
	{}
);

vi.mock('@/access-policies/usePermissions', async () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	...((await vi.importActual('@/access-policies/usePermissions')) as any),

	__esModule: true,
	default: vi.fn().mockReturnValue({ canView: true }),
}));

const defaultResponseHeaders = {
	'inpt-client-latest': true,
};

const credentialsFixture = [
	{
		apiKeyName: '1',
		createdAt: new Date(Date.now()),
		serviceAccountKeyId: '1',
		createdBy: {
			firstName: 'John',
			lastName: 'Doe',
		},
		file: '1.json',
	},
	{
		apiKeyName: '2',
		createdAt: new Date(Date.now()),
		serviceAccountKeyId: '2',
		createdBy: {
			firstName: 'Jane',
			lastName: 'Doe',
		},
		file: '2.json',
	},
];

const renderSut = () => {
	customRender(<APISync />);
};

describe('APISync', () => {
	beforeEach(() => {
		mock.reset();
	});

	it('should render the first step', async () => {
		mock.onGet(/provision$/).reply(200, { provisioned: false }, defaultResponseHeaders);
		mock.onPost(/provision$/).reply(200, [], defaultResponseHeaders);
		mock.onGet(/credentials$/).reply(200, credentialsFixture, defaultResponseHeaders);

		renderSut();

		expect(
			await screen.findByRole('button', {
				name: 'Enable',
			})
		).toBeInTheDocument();

		expect(screen.getByText('REST API Access')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Enable access to the ComboCurve REST API for your organization. This is required before generating credentials.'
			)
		).toBeInTheDocument();
	});

	it('should render the additional information', async () => {
		mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
		mock.onGet(/credentials$/).reply(200, [], defaultResponseHeaders);

		renderSut();

		expect(await screen.findByText('Additional Information')).toBeInTheDocument();

		expect(screen.getByText('REST API Documentation')).toHaveAttribute('href', 'http://docs.api.combocurve.com/');
		expect(screen.getByText('REST API Forum')).toHaveAttribute('href', 'http://forum.api.combocurve.com/');
		expect(screen.getByText('Data Dictionary')).toHaveAttribute(
			'href',
			'https://drive.google.com/uc?export=download&id=1iBif7G0oMz4JcVXcl3CK7zqZlfGwsiOD'
		);
	});

	it('should render the ComboCurve Sync instructions', async () => {
		mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
		mock.onGet(/credentials$/).reply(200, [], defaultResponseHeaders);

		renderSut();

		expect(await screen.findByText('ComboCurve Sync (Recommended)')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Get started with our no-code solution for automating syncing your database with ComboCurve.'
			)
		).toBeInTheDocument();

		expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute(
			'href',
			'mailto:contact@combocurve.com?subject=ComboCurve Sync'
		);
	});

	describe('Second step', () => {
		it('should render correctly when provisioner is enabled and there is no credentials', async () => {
			mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
			mock.onGet(/credentials$/).reply(200, [], defaultResponseHeaders);

			renderSut();

			expect(
				await screen.findByRole('button', {
					name: 'Create & Download',
				})
			).toBeInTheDocument();

			expect(screen.getByText('Credentials')).toBeInTheDocument();
			expect(
				screen.getByText('Create and download credentials for ComboCurve Sync or for direct REST API access.')
			).toBeInTheDocument();

			expect(
				screen.getByText('Once you have downloaded the credentials please store them securely.')
			).toBeInTheDocument();

			expect(screen.queryByText('Created By')).not.toBeInTheDocument();
			expect(screen.queryByText('Created At')).not.toBeInTheDocument();
		});

		it('should render correctly when provisioner is enabled and there are credentials', async () => {
			mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
			mock.onGet(/credentials$/).reply(200, credentialsFixture, defaultResponseHeaders);

			renderSut();

			expect(
				await screen.findByRole('button', {
					name: 'Create & Download',
				})
			).toBeInTheDocument();

			expect(screen.getByText('Credentials')).toBeInTheDocument();

			expect(
				screen.queryByText('Create and download credentials for ComboCurve Sync or for direct REST API access.')
			).not.toBeInTheDocument();
			expect(
				screen.queryByText('Once you have downloaded the credentials please store them securely.')
			).not.toBeInTheDocument();

			expect(screen.getByText('Created By')).toBeInTheDocument();
			expect(screen.getByText('Created At')).toBeInTheDocument();
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('Jane Doe')).toBeInTheDocument();
		});

		it('should render a disabled Create & Download button when there are three credentials', async () => {
			const threeCredentials = [
				...credentialsFixture,
				{
					apiKeyName: '3',
					createdAt: new Date(Date.now()),
					serviceAccountKeyId: '3',
					createdBy: {
						firstName: 'Paul',
						lastName: 'Doe',
					},
					file: 'credentials3.json',
				},
			];

			mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
			mock.onGet(/credentials$/).reply(200, threeCredentials, defaultResponseHeaders);

			renderSut();

			expect(
				await screen.findByRole('button', {
					name: 'Create & Download',
				})
			).toHaveClass('Mui-disabled');
		});

		it('should be able to create a new credential', async () => {
			const [firstCredential] = credentialsFixture;
			mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
			mock.onGet(/credentials$/)
				.replyOnce(200, [], defaultResponseHeaders)
				.onGet(/credentials$/)
				.replyOnce(200, [firstCredential], defaultResponseHeaders);
			mock.onPost(/credentials$/).reply(200, firstCredential, defaultResponseHeaders);

			renderSut();

			fireEvent.click(
				await screen.findByRole('button', {
					name: 'Create & Download',
				})
			);

			expect(await screen.findByText('Created By')).toBeInTheDocument();
			expect(await screen.findByText('Created At')).toBeInTheDocument();
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		it('should be able to revoke a credential', async () => {
			const [firstCredential] = credentialsFixture;

			mock.onGet(/provision$/).reply(200, { provisioned: true }, defaultResponseHeaders);
			mock.onGet(/credentials$/)
				.replyOnce(200, credentialsFixture, defaultResponseHeaders)
				.onGet(/credentials$/)
				.replyOnce(200, [firstCredential], defaultResponseHeaders);
			mock.onPost(/credentials$/).reply(200, firstCredential, defaultResponseHeaders);
			mock.onDelete(/credentials$/).reply(200, {}, defaultResponseHeaders);

			renderSut();

			const [, secondRevokeButton] = await screen.findAllByRole('button', {
				name: 'Revoke',
			});

			fireEvent.click(secondRevokeButton);

			expect(await screen.findByText('Created By')).toBeInTheDocument();
			expect(await screen.findByText('Created At')).toBeInTheDocument();
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
		});
	});
});
