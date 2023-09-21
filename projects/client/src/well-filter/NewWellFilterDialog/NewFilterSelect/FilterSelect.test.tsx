import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterSelect } from './FilterSelect';

const mock = getAxiosMockAdapter();

const mockStore = create<{ filter; selectedSavedFilter }>((set) => ({
	filter: '',
	setSelectFiler: (valueInstance: string) => set(() => ({ filter: valueInstance })),
	selectedSavedFilter: {
		_id: '64d2461b31cc3c741620b0d6',
		projectId: '63f7e0ace0be5d0012adf5cd',
		name: 'test save number',
		filter: {
			_id: 8,
			name: 'Filter8',
			headers: {
				headers: [
					{ type: 'string', key: 'well_number', filter: '12', exact: false, exclude: false, showNull: true },
					{ type: 'boolean', key: 'scope', filter: 'both' },
					{ type: 'string', key: 'well_name', filter: '', exact: false, exclude: false, showNull: true },
					{ type: 'boolean', key: 'wells_collection', filter: 'both' },
					{ type: 'string', key: 'chosenID', filter: '', exact: false, exclude: false, showNull: true },
				],
			},
		},
		createdAt: '2023-08-08T13:41:47.149Z',
		updatedAt: '2023-08-08T13:41:47.149Z',
	},
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Select', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterSelect
					savedFilters={[]}
					selectFilter={(newValue) => mockStore.setState(() => ({ filter: newValue }))}
					selectedSavedFilter={mockStore.getState().selectedSavedFilter}
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					resetFilter={() => {}}
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					deleteFilter={() => {}}
					canDeleteFilter
				/>
			</TestWrapper>
		);
	});
});
