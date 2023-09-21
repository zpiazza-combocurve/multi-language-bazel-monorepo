import { render } from '@testing-library/react';

import { HeaderTooltipComponent } from './HeaderTooltipComponent';

describe('<HeaderTooltipComponent />', () => {
	test('renders without crashes', () => {
		const renderSut = () => {
			return render(<HeaderTooltipComponent displayName='Header' />);
		};

		const { getByText } = renderSut();

		expect(getByText('Header')).toBeInTheDocument();
	});
});
