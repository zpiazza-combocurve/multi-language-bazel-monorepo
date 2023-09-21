import { useNavigate } from 'react-router-dom';

import { failureAlert } from './alerts';
import Guard from './guard';
import { session } from './storage';

vi.mock('./alerts', async () => ({
	failureAlert: vi.fn(),
}));

vi.mock('react-router-dom', async () => ({
	useNavigate: vi.fn(() => vi.fn()),
}));

const trueCheck = async () => true;
const falseCheck = async () => false;

let props;
let guard;

describe('shouldRoute', () => {
	describe('when all checks return true', () => {
		const navigate = useNavigate();

		beforeEach(() => {
			props = {
				checks: [trueCheck, trueCheck],
				navigate,
			};

			guard = new Guard(props);
		});

		it('passes', async () => {
			await expect(guard.shouldRoute()).resolves.toEqual(true);
		});
	});

	describe('when any check returns false', () => {
		let navigate;

		beforeEach(() => {
			navigate = useNavigate();
			props = {
				checks: [trueCheck, falseCheck, falseCheck, falseCheck],
				navigate,
			};

			guard = new Guard(props);
		});

		it('fails', async () => {
			await expect(guard.shouldRoute()).resolves.toEqual(false);
		});

		it('sets session loginError', async () => {
			const sessionSpy = vi.spyOn(session, 'setItem').mockImplementation(() => vi.fn);

			await guard.shouldRoute();

			expect(sessionSpy).toHaveBeenCalledWith('loginError', { permission: true });
		});

		it('navigate is called with /login-error', async () => {
			await guard.shouldRoute();

			expect(navigate).toHaveBeenCalledTimes(1);
			expect(navigate).toHaveBeenCalledWith('/login-error');
		});
	});
});

describe('navigate', () => {
	describe('when all checks return true', () => {
		const navigate = useNavigate();

		beforeEach(() => {
			props = {
				checks: [trueCheck, trueCheck],
				navigate,
			};

			guard = new Guard(props);
		});

		it('returns true', async () => {
			await expect(guard.navigate()).resolves.toEqual(true);
		});
	});

	describe('when any check returns false', () => {
		const navigate = useNavigate();

		beforeEach(() => {
			props = {
				checks: [trueCheck, falseCheck],
				navigate,
			};

			guard = new Guard(props);
		});

		it('fails', async () => {
			await expect(guard.shouldRoute()).resolves.toEqual(false);
		});

		it('calls failureAlert', async () => {
			await guard.navigate();

			expect(failureAlert).toHaveBeenCalledWith(false, 3000);
		});
	});
});
