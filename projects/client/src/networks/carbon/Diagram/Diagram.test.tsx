import { RenderResult, render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter, mockCanvas, mockFlags, mockPermissions } from '@/helpers/testing';
import { LAYERS } from '@/networks/carbon/Network/View';
import { StandardEdge } from '@/networks/carbon/joint/edges/StandardEdge';
import { StandardEdge as StandardEdgeType } from '@/networks/carbon/types';

import { CarbonJointJSService } from '../joint/config';
import { JointStore, networkModelDataToGraph, networkModelFacilityDataToGraph } from '../joint/helpers';
import Diagram from './Diagram';
import { TEST_FACILITY, TEST_NETWORK } from './Diagram.fixtures.test';

mockCanvas();

// TODO: mock flags here
beforeEach(() => mockFlags({}));
mockPermissions();
const mock = getAxiosMockAdapter();
const mockStore = create<JointStore>((set) => ({
	jointNetwork: null,
	setJointNetwork: (jointInstance: CarbonJointJSService | null) => set(() => ({ jointNetwork: jointInstance })),
	jointFacility: null,
	setJointFacility: (jointInstance: CarbonJointJSService | null) => set(() => ({ jointFacility: jointInstance })),
}));

vi.mock('@/cost-model/detail-components/fluid_models/FluidModelTable', () => ({})); // temporally mocking the fluid model table to avoid ag grid v30 react 18 incompatibility (importing react-dom/server)

beforeEach(() => {
	mock.reset();
	mockStore.setState({
		jointNetwork: null,
		jointFacility: null,
	});
});

async function getRenderedStandardEdge(
	edge: StandardEdgeType,
	baseElement: Element,
	findByText: RenderResult['findByText']
) {
	const allocationValue = (edge as StandardEdgeType).params?.time_series?.rows[0]?.allocation;

	if (allocationValue) {
		return await findByText(`${allocationValue}%`);
	} else {
		// In these cases, the edge does not have a label, so we just check that it exists
		return baseElement.querySelector(`g[model-id="${edge.id}"]`);
	}
}

describe('Diagram', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<Diagram
					layerList={LAYERS}
					// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
					invalidateModel={() => {}}
					isDirty={() => false}
					instance={mockStore.getState().jointNetwork}
					setInstance={(jointInstance: CarbonJointJSService | null) =>
						mockStore.setState(() => ({ jointNetwork: jointInstance }))
					}
					initialCells={[]}
					sidebar={<>sidebar</>}
					getDropItemCell={() => new StandardEdge()}
				/>
			</TestWrapper>
		);
	});

	it('should render all node and edge types (network)', async () => {
		const { findByText, baseElement } = render(
			<TestWrapper>
				<Diagram
					layerList={LAYERS}
					// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
					invalidateModel={() => {}}
					isDirty={() => false}
					instance={mockStore.getState().jointNetwork}
					setInstance={(jointInstance: CarbonJointJSService | null) =>
						mockStore.setState(() => ({ jointNetwork: jointInstance }))
					}
					initialCells={networkModelDataToGraph(TEST_NETWORK, { facility_id: TEST_FACILITY })}
					sidebar={<>sidebar</>}
					getDropItemCell={() => new StandardEdge()}
				/>
			</TestWrapper>
		);
		for (const node of TEST_NETWORK.nodes) {
			const renderedNode = await findByText(node.name);
			expect(renderedNode).toBeInTheDocument();
		}
		for (const edge of TEST_NETWORK.edges) {
			const renderedEdge = await getRenderedStandardEdge(edge as StandardEdgeType, baseElement, findByText);
			expect(renderedEdge).toBeInTheDocument();
		}
	});

	it('should render all node and edge types (facility)', async () => {
		const { findByText } = render(
			<TestWrapper>
				<Diagram
					layerList={LAYERS}
					// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
					invalidateModel={() => {}}
					isDirty={() => false}
					instance={mockStore.getState().jointNetwork}
					setInstance={(jointInstance: CarbonJointJSService | null) =>
						mockStore.setState(() => ({ jointNetwork: jointInstance }))
					}
					initialCells={networkModelFacilityDataToGraph(TEST_FACILITY)}
					sidebar={<>sidebar</>}
					getDropItemCell={() => new StandardEdge()}
				/>
			</TestWrapper>
		);
		for (const node of TEST_FACILITY.nodes) {
			const renderedNode = await findByText(node.name);
			expect(renderedNode).toBeInTheDocument();
		}
		for (const edge of [...TEST_FACILITY.inputs, ...TEST_FACILITY.outputs]) {
			const renderedEdge = await findByText((edge as { name: string }).name); // Just to prevent TS error
			expect(renderedEdge).toBeInTheDocument();
		}
	});
});
