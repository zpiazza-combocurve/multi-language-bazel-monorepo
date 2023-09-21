import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { customRender } from '@/tests/test-utils';

import { SearchableMenu } from './SearchableMenu';

describe('<SearchableMenu />', () => {
	it('renders', () => {
		customRender(<SearchableMenu title='Test Menu' options={[]} />);
		expect(screen.getByText('Test Menu')).toBeVisible();
	});

	describe('with options', () => {
		beforeEach(() => {
			customRender(
				<SearchableMenu
					title='Test Menu'
					options={[
						{ key: 'Option 1', label: 'Option 1' },
						{ key: 'Option 2', label: 'Option 2' },
						{ key: 'Option 3', label: 'Option 3' },
					]}
					selectedOption='Option 2'
					startIcon={<p>Start Icon</p>}
					endIcon={<p>End Icon</p>}
				/>
			);
		});

		it('renders the list of options', () => {
			expect(screen.getByText('Test Menu')).toBeVisible();

			fireEvent.click(screen.getByText('Test Menu'));

			expect(screen.getByText('Option 1')).toBeVisible();
			expect(screen.getByText('Option 2')).toBeVisible();
			expect(screen.getByText('Option 3')).toBeVisible();
		});

		it('renders both icons', () => {
			fireEvent.click(screen.getByText('Test Menu'));

			expect(screen.getByText('Start Icon')).toBeVisible();
			expect(screen.getByText('End Icon')).toBeVisible();
		});

		it('renders the list of options with one selected', () => {
			fireEvent.click(screen.getByText('Test Menu'));

			expect(screen.getByRole('button', { name: 'Option 2' })).toHaveClass('Mui-selected');
		});

		it('filters the list', async () => {
			fireEvent.click(screen.getByText('Test Menu'));

			expect(screen.getByRole('button', { name: 'Option 1' })).toBeVisible();
			expect(screen.getByRole('button', { name: 'Option 2' })).toBeVisible();
			expect(screen.getByRole('button', { name: 'Option 3' })).toBeVisible();

			const user = userEvent.setup();

			await user.click(screen.getByLabelText('Search'));
			await user.keyboard('Option 2');

			expect(screen.queryByRole('button', { name: 'Option 1' })).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Option 2' })).toBeVisible();
			expect(screen.queryByRole('button', { name: 'Option 3' })).not.toBeInTheDocument();
		});
	});
});
