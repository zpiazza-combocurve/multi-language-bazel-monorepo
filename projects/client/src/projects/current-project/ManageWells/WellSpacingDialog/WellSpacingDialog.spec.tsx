import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { customRender } from '@/tests/test-utils';

import { WellSpacingDialog } from './WellSpacingDialog';

const defaultValidationResult = { isValid: true, totalAmount: 2, candidateWellsAmount: 2, details: {} };
const renderSut = (validationResult = defaultValidationResult) => {
	const onHide = vi.fn();
	const onSubmit = vi.fn();
	const onValidate = vi.fn().mockResolvedValue(validationResult);
	const resolve = vi.fn();

	customRender(
		<WellSpacingDialog onHide={onHide} onSubmit={onSubmit} onValidate={onValidate} visible resolve={resolve} />
	);

	return {
		onHide,
		onSubmit,
		onValidate,
		resolve,
	};
};

describe('Well Spacing Dialog', () => {
	it('should render properly default options', async () => {
		renderSut();

		await new Promise((resolve) => {
			// HACK needed for in some cases for some mocked request to finish loading
			setTimeout(resolve, 0);
		});

		expect(await screen.findByRole('button', { name: 'Calc' })).toBeEnabled();

		expect(screen.getByTestId('well_spacing_dialog_title')).toBeInTheDocument();

		expect(screen.getByText('Calculate Well Spacing Distance for:')).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Any Landing Zone' })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Same Landing Zone' })).toBeInTheDocument();

		expect(screen.getByText('Choose the type of distance to calculate')).toBeInTheDocument();
		expect(screen.getByText('Mid-point to mid-point')).toBeInTheDocument();

		await userEvent.click(screen.getByText('Advanced options'));
		expect(screen.getByText('Select the CRS')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'advanced.crs' })).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
	});

	it('should submit form with default values', async () => {
		const { onSubmit, onValidate, resolve } = renderSut();

		expect(await screen.findByRole('button', { name: 'Calc' })).toBeEnabled();

		await userEvent.click(screen.getByRole('button', { name: 'Calc' }));

		await waitFor(() => {
			expect(onValidate).toHaveBeenCalledWith({ zoneType: 'any', distanceType: 'mid' });
			expect(onSubmit).toHaveBeenCalledWith({
				zoneType: 'any',
				distanceType: 'mid',
				epsgNumber: 0,
			});
			expect(resolve).toHaveBeenCalled();
		});
	});

	it('should call on hide when user clicks on Cancel button', async () => {
		const { onHide } = renderSut();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(onHide).toHaveBeenCalled();
		});
	});

	it('should submit form with advanced options', async () => {
		const { onSubmit, onValidate, resolve } = renderSut();

		await userEvent.click(screen.getByText('Advanced options'));

		await userEvent.click(screen.getByRole('button', { name: 'advanced.crs' }));
		await userEvent.click(screen.getByRole('option', { name: 'Other' }));

		await userEvent.click(screen.getByRole('textbox', { name: 'epsg' }));
		await userEvent.click(screen.getByText('Well Spacing Calculation'));

		expect(await screen.findByText('EPSG is required')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Calc' })).toHaveClass('Mui-disabled');

		await userEvent.type(screen.getByRole('textbox', { name: 'epsg' }), '123');
		expect(screen.queryByText('EPSG is required')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Calc' }));

		await waitFor(() => {
			expect(onValidate).toHaveBeenCalledWith({ zoneType: 'any', distanceType: 'mid' });
			expect(onSubmit).toHaveBeenCalledWith({
				zoneType: 'any',
				distanceType: 'mid',
				epsgNumber: 123,
			});
			expect(resolve).toHaveBeenCalled();
		});
		// HACK: improve test performance
	}, 10000);

	it('should handle correctly when data is missing', async () => {
		const validationResult = {
			isValid: false,
			totalAmount: 4,
			candidateWellsAmount: 2,
			details: [
				{
					name: 'Directional Survey',
					amount: 2,
					allWellsAmount: 4,
					itemDescriptor: ' project wells',
				},
				{
					name: 'Lat/Long data',
					amount: 1,
					allWellsAmount: 4,
					itemDescriptor: ' project wells',
				},
			],
		};

		const { onSubmit, onValidate } = renderSut(validationResult);

		expect(await screen.findByRole('button', { name: 'Calc' })).toBeEnabled();
		await userEvent.click(screen.getByRole('button', { name: 'Calc' }));

		await waitFor(() => {
			expect(onValidate).toHaveBeenCalledWith({ zoneType: 'any', distanceType: 'mid' });
		});

		expect(screen.getByText('Some data is missing!')).toBeVisible();

		expect(screen.getByText('1 / 4 project wells')).toBeVisible();
		expect(screen.getByText('have Lat/Long data')).toBeVisible();

		expect(screen.getByText('2 / 4 project wells')).toBeVisible();
		expect(screen.getByText('have Directional Survey')).toBeVisible();

		expect(screen.getByRole('button', { name: 'Calc' })).toHaveClass('Mui-disabled');
		await userEvent.click(screen.getByRole('checkbox', { name: 'I understand the wells will be ignored' }));
		await userEvent.click(screen.getByRole('button', { name: 'Calc' }));

		await waitFor(() => {
			expect(onValidate).toHaveBeenCalledTimes(1);
			expect(onSubmit).toHaveBeenCalledWith({
				zoneType: 'any',
				distanceType: 'mid',
				epsgNumber: 0,
			});
		});
	});

	it('should handle correctly when there is no candidate wells available', async () => {
		const validationResult = {
			isValid: false,
			totalAmount: 4,
			candidateWellsAmount: 0,
			details: [
				{
					name: 'Directional Survey',
					amount: 4,
				},
				{
					name: 'Lat/Long data',
					amount: 4,
				},
			],
		};

		const { onSubmit, onValidate } = renderSut(validationResult);

		expect(await screen.findByRole('button', { name: 'Calc' })).toBeEnabled();
		await userEvent.click(screen.getByRole('button', { name: 'Calc' }));

		await waitFor(() => {
			expect(onValidate).toHaveBeenCalledWith({ zoneType: 'any', distanceType: 'mid' });
		});

		expect(
			screen.getByText('No wells within the selection have the required information to calculate well spacing.')
		).toBeInTheDocument();

		expect(screen.getByRole('button', { name: 'Calc' })).toHaveClass('Mui-disabled');
		expect(
			screen.queryByRole('checkbox', { name: 'I understand the wells will be ignored' })
		).not.toBeInTheDocument();

		await waitFor(() => {
			expect(onSubmit).not.toHaveBeenCalled();
		});
	});
});
