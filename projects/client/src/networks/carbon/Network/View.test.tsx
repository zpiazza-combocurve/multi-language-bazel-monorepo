// import { faker } from '@faker-js/faker';
// import { fireEvent, render, screen, within } from '@testing-library/react';

// import { DEFAULT_TESTING_RESPONSE_HEADERS, TestWrapper, getAxiosMockAdapter, mockPermissions } from '@/helpers/testing';

// import { DATA_TESTID_NETWORK_MODEL_SIDEBAR } from '../Diagram/Diagram';
// import { DATA_TESTID_NETWORK_MODEL_MAIN } from '../joint/ReactJoint';
// import { DEFAULT_NODE_DATA } from '../shared';
// import { NetworkModel } from '../types';
// import NetworkModelView from './View';

// mockPermissions();
// const mock = getAxiosMockAdapter();
// const originalGetComputedTextLength = SVGElement.prototype['getComputedTextLength'];
// beforeEach(() => {
// 	mock.reset();
// 	SVGElement.prototype['getComputedTextLength'] = () => {
// 		return 80;
// 	};
// });

// afterEach(() => {
// 	SVGElement.prototype['getComputedTextLength'] = originalGetComputedTextLength;
// });

// const TEST_NETWORK_MODEL: NetworkModel = {
// 	_id: faker.database.mongodbObjectId(),
// 	project: faker.database.mongodbObjectId(),
// 	name: 'Test Carbon Network',
// 	nodes: [],
// 	edges: [],
// };

// function dnd(from: HTMLElement, to: HTMLElement) {
// 	fireEvent.dragStart(from);
// 	fireEvent.dragEnter(to);
// 	fireEvent.dragOver(to);
// 	fireEvent.drop(to, {});
// }

// function allowThreadsToComplete() {
// 	return new Promise<void>((resolve) => {
// 		setTimeout(() => resolve(), 0);
// 	});
// }

// tests failing because of react-router (TODO fix and enable tests)
// eslint-disable-next-line jest/no-disabled-tests -- TODO eslint fix later
describe.skip('NetworkModelView', () => {
	it('should render a saved node', async () => {
		// 		mock.onGet('/network-models/facilities-nodes').reply(200, [], DEFAULT_TESTING_RESPONSE_HEADERS);
		// 		render(
		// 			<TestWrapper>
		// 				<NetworkModelView
		// 					invalidateNetworkModel={(() => {}) as () => Promise<void>}
		// 					networkModel={{
		// 						_id: faker.database.mongodbObjectId(),
		// 						project: faker.database.mongodbObjectId(),
		// 						name: 'Test Carbon Network',
		// 						nodes: [
		// 							{
		// 								id: faker.database.mongodbObjectId(),
		// 								name: 'Well Group',
		// 								type: 'well_group',
		// 								params: DEFAULT_NODE_DATA.well_group,
		// 								shape: { position: { x: 0, y: 0 } },
		// 							},
		// 						],
		// 						edges: [],
		// 					}}
		// 				/>
		// 			</TestWrapper>
		// 		);
		// 		const paper = screen.getByTestId(DATA_TESTID_NETWORK_MODEL_MAIN);
		// 		await within(paper).findByText('Well Group');
		// 	});
		// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
		// 	it('should drop well group node and save', async () => {
		// 		mock.onPut(`/network-models/${TEST_NETWORK_MODEL._id}`).reply((config) => {
		// 			const parsed = JSON.parse(config.data);
		// 			expect(parsed).toStrictEqual({
		// 				_id: TEST_NETWORK_MODEL._id,
		// 				project: TEST_NETWORK_MODEL.project,
		// 				name: 'Test Carbon Network',
		// 				nodes: [
		// 					{
		// 						id: expect.any(String),
		// 						name: 'Well Group',
		// 						type: 'well_group',
		// 						params: DEFAULT_NODE_DATA.well_group,
		// 						shape: { position: { x: expect.any(Number), y: expect.any(Number) } },
		// 					},
		// 				],
		// 				edges: [],
		// 			});
		// 			return [200, undefined, DEFAULT_TESTING_RESPONSE_HEADERS];
		// 		});
		// 		mock.onGet('/network-models/facilities-nodes').reply(200, [], DEFAULT_TESTING_RESPONSE_HEADERS);
		// 		render(
		// 			<TestWrapper>
		// 				<NetworkModelView
		// 					networkModel={TEST_NETWORK_MODEL}
		// 					invalidateNetworkModel={(() => {}) as () => Promise<void>}
		// 				/>
		// 			</TestWrapper>
		// 		);
		// 		const sidebar = screen.getByTestId(DATA_TESTID_NETWORK_MODEL_SIDEBAR);
		// 		const wellGroupSidebarNode = within(sidebar).getByText('Well Group');
		// 		const paper = screen.getByTestId(DATA_TESTID_NETWORK_MODEL_MAIN);
		// 		await allowThreadsToComplete();
		// 		dnd(wellGroupSidebarNode, paper);
		// 		await within(paper).findByText('Well Group');
		// 		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
	});
});
