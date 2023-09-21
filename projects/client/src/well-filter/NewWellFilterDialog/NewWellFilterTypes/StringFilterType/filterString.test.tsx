import { render } from '@testing-library/react';
import { create } from 'zustand';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';

import { FilterString } from './filterString';

const mock = getAxiosMockAdapter();

const mockStore = create<{ value }>((set) => ({
	value: '',
	setValue: (valueInstance: string) => set(() => ({ value: valueInstance })),
}));

beforeEach(() => {
	mock.reset();
});

describe('Filter String', () => {
	it('should render', async () => {
		render(
			<TestWrapper>
				<FilterString
					value=''
					exact={false}
					showNull
					inputName='Well Name'
					projectHeader={false}
					inputKey='well_name'
					onChange={(newValue) => {
						mockStore.setState(() => ({ value: newValue }));
					}}
					removeHeaderType={() => ''}
				/>
			</TestWrapper>
		);
	});
});
