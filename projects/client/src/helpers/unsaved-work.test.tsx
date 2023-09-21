import '@testing-library/jest-dom';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { TestWrapper } from './testing';
import { unsavedWorkContinue, useUnsavedWork } from './unsaved-work';

describe('unsaved-work', () => {
	function Test() {
		enum Page {
			start,
			done,
		}
		const [initialValue, setInitialValue] = useState('');
		const [state, setState] = useState(initialValue);

		const [page, setPage] = useState(Page.start);

		useUnsavedWork(state !== initialValue);

		if (page === Page.start) {
			return (
				<>
					<label>
						value
						<input value={state} onChange={(e) => setState(e.target.value)} />
					</label>
					<button onClick={() => setInitialValue(state)}>Save</button>
					<button
						onClick={async () => {
							if (await unsavedWorkContinue()) setPage(Page.done);
						}}
					>
						Next
					</button>
				</>
			);
		}
		return <div>DONE</div>;
	}

	beforeEach(() => {
		render(<Test />, { wrapper: TestWrapper });
	});
	afterEach(() => {
		cleanup();
	});

	test("shouldn't show dialog if no changes", async () => {
		fireEvent.click(screen.getByText('Next'));
		expect(await screen.findByText(/done/i)).toBeInTheDocument();
	});

	test('should show dialog if there are changes/cancel', async () => {
		fireEvent.change(screen.getByLabelText('value'), { target: { value: 'hello' } });

		fireEvent.click(screen.getByText('Next'));

		expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
		await screen.findByText(/you have unsaved work/i);

		fireEvent.click(screen.getByText('Cancel'));

		expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/you have unsaved work/i)).not.toBeInTheDocument();
	});

	test('should show dialog if there are changes/discard changes', async () => {
		fireEvent.change(screen.getByLabelText('value'), { target: { value: 'hello' } });

		fireEvent.click(screen.getByText('Next'));

		expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
		await screen.findByText(/you have unsaved work/i);

		fireEvent.click(screen.getByText('Discard changes'));

		expect(await screen.findByText(/done/i)).toBeInTheDocument();
		expect(screen.queryByText(/you have unsaved work/i)).not.toBeInTheDocument();
	});
});
