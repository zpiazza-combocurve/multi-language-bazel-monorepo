import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterPercent } from './filterPercent';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: {},
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Percent', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterPercent
					showNull
					minValue=''
					maxValue=''
					inputName='Percent in Zone'
					projectHeader={false}
					inputKey='percent_in_zone'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
