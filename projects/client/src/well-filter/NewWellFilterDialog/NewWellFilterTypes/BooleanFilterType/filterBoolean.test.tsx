import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterBoolean } from './filterBoolean';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: {},
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter Boolean', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterBoolean
					value=''
					options={[]}
					showNull
					inputName='Scope'
					projectHeader={false}
					inputKey='scope'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
