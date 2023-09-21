import { render } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { TestWrapper } from '@/helpers/testing';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { DataFlowDetail } from './DataFlowDetail';

const mock = new MockAdapter(axios, {});

const renderSut = () => {
	return render(
		<TestWrapper>
			<DataFlowDetail />
		</TestWrapper>,
		{
			wrapper: SnapshotFriendlyStylesProviderWrapper,
		}
	);
};

const defaultResponseHeaders = {
	'inpt-client-latest': true,
};

describe('<DataFlowDetail />', () => {
	test('renders without crashes', () => {
		mock.onGet(/data-sync\/data-flows/).reply(200, { provisioned: false }, defaultResponseHeaders);

		renderSut();
	});
});
