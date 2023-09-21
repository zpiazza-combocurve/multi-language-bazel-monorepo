import { createTheme } from '@material-ui/core/styles';
import { fireEvent, render } from '@testing-library/react';

import { ThemeProvider } from '@/helpers/theme';
import Wrapper from '@/mocks/Wrapper';
import { SnapshotFriendlyStylesProviderWrapper } from '@/tests/SnapshotFriendlyStylesProviderWrapper';

import { PageField } from '../PageField';

const STARTING_PAGE = 2;
const MAX_PAGE = 20;

const ENTER_KEY = 13;

const eventValue = (value) => ({ target: { value } });
const eventKey = (code) => ({ code, keyCode: code });

const renderSut = (onChange) => {
	const theme = createTheme();

	return render(
		<Wrapper>
			<ThemeProvider theme={theme}>
				<PageField maxPage={MAX_PAGE} onChange={onChange} page={STARTING_PAGE} />
			</ThemeProvider>
		</Wrapper>,
		{
			wrapper: SnapshotFriendlyStylesProviderWrapper,
		}
	);
};

describe('<PageField />', () => {
	test('it renders properly', () => {
		const onChange = vi.fn();

		renderSut(onChange);
	});

	test('user can type page number', () => {
		const onChangeMock = vi.fn();

		const { getByDisplayValue } = render(
			<PageField maxPage={MAX_PAGE} onChange={onChangeMock} page={STARTING_PAGE} />
		);

		const input = getByDisplayValue(STARTING_PAGE);

		/* jump to page on press ENTER */
		fireEvent.click(input);
		fireEvent.change(input, eventValue('18'));
		fireEvent.keyUp(input, eventKey(ENTER_KEY));
		expect(onChangeMock).toHaveBeenCalledWith(18);
		expect(input.value).toBe('18');

		/* jump to page on blur */
		fireEvent.change(input, eventValue('19'));
		fireEvent.blur(input);
		expect(onChangeMock).toHaveBeenCalledWith(19);
		expect(input.value).toBe('19');

		/* can't jump to negative page number */
		fireEvent.click(input);
		fireEvent.change(input, eventValue('-1'));
		fireEvent.keyUp(input, eventKey(ENTER_KEY));
		expect(onChangeMock).toHaveBeenCalledWith(1);
		expect(input.value).toBe('1');

		/* can't jump to page number above the maximum */
		fireEvent.click(input);
		fireEvent.change(input, eventValue(`${MAX_PAGE + 10}`));
		fireEvent.keyUp(input, eventKey(ENTER_KEY));
		expect(onChangeMock).toHaveBeenCalledWith(MAX_PAGE);
		expect(input.value).toBe(`${MAX_PAGE}`);
	});
});
