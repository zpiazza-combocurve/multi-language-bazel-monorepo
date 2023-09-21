import { render, screen, waitFor } from '@testing-library/react';
// https://stackoverflow.com/a/70377857
import { renderHook } from '@testing-library/react-hooks/dom';
import userEvent from '@testing-library/user-event';

import { useDialog } from '@/helpers/dialog';
import { local } from '@/helpers/storage';
import { TestWrapper as Wrapper } from '@/helpers/testing';

import ConfigurationDialog from './ConfigurationDialog';

// HACK: get MUI components by classname
const MUI_DIALOG_CLASSNAME = 'MuiDialog-root';

async function renderDialog(user) {
	const { result } = renderHook(
		() =>
			useDialog(ConfigurationDialog, {
				setDefaultConfiguration: (config) => {
					local.setItem('default', config);
				},
				configurations: local.getItem('configs'),
				deleteConfiguration: ({ _id }) =>
					local.setItem(
						'configs',
						local.getItem('configs').filter((config) => _id !== config._id)
					),
				isDefaultConfiguration: ({ _id }) => {
					const defaultConfig = local.getItem('default');
					return defaultConfig?._id === _id;
				},
			}),
		{ wrapper: Wrapper }
	);
	const [, showConfigDialog] = result.current;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const results = render(<button onClick={() => showConfigDialog({} as any)}>Show Dialog</button>);
	await user.click(results.getByText('Show Dialog'));
	const [groupDialog] = result.current;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return render(groupDialog!, { wrapper: Wrapper });
}

describe('Configuration Dialog', () => {
	function getDialogContainer() {
		return document.body.getElementsByClassName(MUI_DIALOG_CLASSNAME)[0];
	}

	async function getDefaultConfigIndex() {
		const listItemIcons = await waitFor(() => document.body.querySelectorAll('ul > li svg[data-icon="star"]'));
		for (let i = 0; i < listItemIcons.length; i++) {
			const icon = listItemIcons[i];
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			if (icon.attributes.getNamedItem('data-prefix')!.value === 'fas') return i;
		}
		return -1;
	}

	it('should render dialog', async () => {
		const user = userEvent.setup();
		await renderDialog(user);
		expect(getDialogContainer()).toBeInTheDocument();
	});

	it('should show values provided', async () => {
		const user = userEvent.setup();
		const configs = [{ name: 'Config 1' }, { name: 'Config 2' }];

		local.setItem('configs', configs);
		await renderDialog(user);

		expect(screen.queryAllByText('Config', { selector: 'li *', exact: false }).length).toBe(2);
		expect(screen.queryByText('Config 1')).toBeInTheDocument();
		expect(screen.queryByText('Config 2')).toBeInTheDocument();
		expect(screen.queryByText('Config 3')).not.toBeInTheDocument();
	});

	it('should not have default configuration if not provided', async () => {
		const user = userEvent.setup();
		const configs = [
			{ _id: 'config1', name: 'Config 1', configuration: {}, properties: {} },
			{ _id: 'config2', name: 'Config 2', configuration: {}, properties: {} },
		];

		local.setItem('configs', configs);

		await renderDialog(user);
		expect(await getDefaultConfigIndex()).toBe(-1);
	});

	it('should use default configuration provided', async () => {
		const user = userEvent.setup();
		const configs = [
			{ _id: 'config1', name: 'Config 1', configuration: {}, properties: {} },
			{ _id: 'config2', name: 'Config 2', configuration: {}, properties: {} },
		];

		local.setItem('configs', configs);
		local.setItem('default', configs[1]);

		await renderDialog(user);
		expect(await getDefaultConfigIndex()).toBe(1);
	});
});
