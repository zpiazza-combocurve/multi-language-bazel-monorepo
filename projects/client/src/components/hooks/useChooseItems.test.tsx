import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';

import { TestWrapper } from '@/helpers/testing';

import { useChooseItems } from './useChooseItems';

const TestComponent = () => {
	const { selectItems } = useChooseItems({
		title: 'Test Dialog',
		items: [
			{ key: 'a', label: 'Item A' },
			{ key: 'b', label: 'Item B' },
			{ key: 'c', label: 'Item C' },
			{ key: 'lowercase-a', label: 'a' },
		],
		sections: [
			{
				key: 'Section 1',
				label: 'Section 1',
				itemKeys: ['b', 'a', 'lowercase-a'],
			},
			{
				key: 'Section 2',
				label: 'Section 2',
				itemKeys: ['c'],
			},
		],
	});

	useEffect(() => {
		selectItems();
	}, [selectItems]);

	return null;
};

describe('useChooseItems', () => {
	it('renders and filters', async () => {
		const user = userEvent.setup();

		render(
			<TestWrapper>
				<TestComponent />
			</TestWrapper>
		);

		screen.getByText('Test Dialog');

		screen.getAllByText('Section 1');
		screen.getAllByText('Section 2');

		const itemA = screen.getByText('Item A');
		const itemB = screen.getByText('Item B');
		screen.getByText('Item C');
		const itemLowercaseA = screen.getByText('a');

		// Test alphabetical order
		expect(itemA.compareDocumentPosition(itemB)).toBe(4);

		// Test order ignores case
		expect(itemLowercaseA.compareDocumentPosition(itemA)).toBe(4); // 4 = Node.DOCUMENT_POSITION_FOLLOWING
		expect(itemLowercaseA.compareDocumentPosition(itemB)).toBe(4); // 4 = Node.DOCUMENT_POSITION_FOLLOWING

		user.type(screen.getByRole('textbox'), 'Item A');

		await waitForElementToBeRemoved(screen.getByText('Item B'));

		screen.getByText('Item A');

		expect(screen.queryByText('Item B')).not.toBeInTheDocument();
		expect(screen.queryByText('Item C')).not.toBeInTheDocument();
	});
});
