import { cleanup, fireEvent, render } from '@testing-library/react';

import { Provider, subscribe, useAlfa } from './alfa';

afterEach(cleanup);

test('useAlfa, and Provider should work', async () => {
	function Component({ name }) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const { lastname, set } = useAlfa() as any;
		return (
			<div>
				<h1>{name}</h1>
				<h2>{lastname}</h2>
				<button
					type='button'
					onClick={() => {
						set('lastname', 'changed using set');
					}}
				>
					using set
				</button>
			</div>
		);
	}
	const { findByText } = render(
		<Provider data={{ lastname: 'world' }}>
			<Component name='hello' />
		</Provider>
	);

	expect(await findByText('hello')).toBeInTheDocument();
	expect(await findByText('world')).toBeInTheDocument();
	fireEvent.click(await findByText('using set'));
	expect(await findByText('changed using set')).toBeInTheDocument();
});

test('subscribe should work', async () => {
	function Component({ lastname, set, name }) {
		return (
			<div>
				<h1>{name}</h1>
				<h2>{lastname}</h2>
				<button
					type='button'
					onClick={() => {
						set('lastname', 'changed using set');
					}}
				>
					using set
				</button>
			</div>
		);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const WrapperComponent = subscribe(Component, ['lastname'] as any) as any;

	const { findByText } = render(
		<Provider data={{ lastname: 'world' }}>
			<WrapperComponent name='hello' />
		</Provider>
	);

	expect(await findByText('hello')).toBeInTheDocument();
	expect(await findByText('world')).toBeInTheDocument();
	fireEvent.click(await findByText('using set'));
	expect(await findByText('changed using set')).toBeInTheDocument();
});
