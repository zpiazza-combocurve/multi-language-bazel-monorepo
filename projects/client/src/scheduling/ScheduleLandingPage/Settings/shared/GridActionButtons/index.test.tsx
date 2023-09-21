import { screen } from '@testing-library/react';

import { customRender } from '@/tests/test-utils';

import { GridActionButtons } from '.';

const addFunction = vi.fn();
const deleteFunction = vi.fn();
const duplicateFunction = vi.fn();

const makeSut = ({ addButtonDisabled, hasSelectedRows, renderDuplicateButton = true }) => {
	customRender(
		<GridActionButtons
			name='Custom name'
			addButtonDisabled={addButtonDisabled}
			hasSelectedRows={hasSelectedRows}
			addButtonText='Add button'
			addFunction={addFunction}
			deleteFunction={deleteFunction}
			duplicateFunction={renderDuplicateButton ? duplicateFunction : undefined}
		/>
	);
};

describe('GridActionButtons', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render correctly when there are selected rows', () => {
		makeSut({ addButtonDisabled: false, hasSelectedRows: true });

		expect(screen.getByRole('button', { name: 'Add button' })).toBeEnabled();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
		expect(screen.getByRole('button', { name: 'Duplicate' })).toBeEnabled();
	});

	it('should render correctly when there are not selected rows', () => {
		makeSut({ addButtonDisabled: false, hasSelectedRows: false });

		expect(screen.getByRole('button', { name: 'Add button' })).toBeEnabled();
		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('Mui-disabled');
		expect(screen.getByRole('button', { name: 'Duplicate' })).toHaveClass('Mui-disabled');
	});

	it('should not include Duplicate button when function is not provided', () => {
		makeSut({ addButtonDisabled: true, hasSelectedRows: false, renderDuplicateButton: false });

		expect(screen.getByRole('button', { name: 'Add button' })).toHaveClass('Mui-disabled');
		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('Mui-disabled');
		expect(screen.queryByRole('button', { name: 'Duplicate' })).not.toBeInTheDocument();
	});

	it('should call correct function when button are clicked', () => {
		makeSut({ addButtonDisabled: false, hasSelectedRows: true });

		screen.getByRole('button', { name: 'Add button' }).click();
		expect(addFunction).toHaveBeenCalled();

		screen.getByRole('button', { name: 'Delete' }).click();
		expect(deleteFunction).toHaveBeenCalled();

		screen.getByRole('button', { name: 'Duplicate' }).click();
		expect(duplicateFunction).toHaveBeenCalled();
	});
});
