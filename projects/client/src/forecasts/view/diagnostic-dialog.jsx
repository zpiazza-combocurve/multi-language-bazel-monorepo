import { cloneDeep } from 'lodash-es';
import { Animated } from 'react-animated-css';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Checkbox } from '@/components';
import { getFormValue, useField, useObjectField } from '@/components/hooks';
import { InfoTooltip } from '@/components/tooltipped';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InfoTooltipWrapper,
	MenuItem,
	ReactDatePicker,
	Select,
	TextField,
} from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { phases as forecastPhases } from '@/helpers/zing';

const DiagnosticSettingsContainer = styled.section`
	display: flex;
	flex-direction: column;
	padding: 0.5rem 0;
	width: 100%;
`;
const SelectField = styled(Select)`
	flex-grow: 1;
`;

const LabeledFieldContainer = styled.div`
	align-items: center;
	display: flex;
	justify-content: space-between;
`;

const LabelText = styled.span`
	display: flex;
	align-items: center;
	flex-shrink: 1;
	margin-right: 0.5rem;
	white-space: nowrap;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const LabeledSelectField = ({ label, menuItems, ...rest }) => {
	return (
		<LabeledFieldContainer>
			<LabelText>{label}:</LabelText>
			<SelectField {...rest}>
				{menuItems.map(({ label, value }) => (
					<MenuItem key={value} value={value}>
						{label}
					</MenuItem>
				))}
			</SelectField>
		</LabeledFieldContainer>
	);
};

const modeOptions = [
	{
		label: 'Last',
		value: 'last',
	},
	{
		label: 'Absolute Range',
		value: 'absolute_range',
	},
	{
		label: 'All',
		value: 'all',
	},
];

const unitOptions = [
	{
		label: 'Years',
		value: 'year',
	},
	{
		label: 'Months',
		value: 'month',
	},
	{
		label: 'Days',
		value: 'day',
	},
	{
		label: 'Percent',
		value: 'percent',
	},
];

const baseForecastErrorOptions = [
	{
		label: 'Monthly',
		value: 'monthly',
	},
	{
		label: 'Daily',
		value: 'daily',
	},
	// removed for now
	// {
	// 	label: 'Self',
	// 	value: 'self',
	// },
];

const defaultTimePeriod = {
	absolute_range: [new Date(), new Date()],
	mode: 'last',
	num_range: [1, 6],
	unit: 'month',
};

function TimePeriodFields({ fields }) {
	const { mode, unit, num_range, absolute_range } = fields;
	return (
		<div>
			<LabeledSelectField
				{...mode}
				id='time-period-mode-select'
				label={
					<>
						<InfoTooltip labelTooltip='Data used to calculate all the error terms, MAE, RMSE, ...' />
						<span>Date range used in Diagnostic</span>
					</>
				}
				listClassName='theme-pop-up-menu-list'
				menuItems={modeOptions}
				fullWidth
			/>
			{mode.value === 'last' && (
				<div className='controls-row' css='margin-top: 1rem'>
					<TextField
						{...num_range.fields[0]}
						id='num_range.0'
						className='md-cell md-cell--6'
						error={Number(num_range.value[1]) < Number(num_range.value[0])}
						helperText={
							Number(num_range.value[1]) < Number(num_range.value[0]) &&
							'Value must be less than Duration End'
						}
						label='Duration Start'
						min='1'
						step='1'
						type='number'
					/>

					<TextField
						{...num_range.fields[1]}
						id='num_range.1'
						className='md-cell md-cell--6'
						error={Number(num_range.value[1]) < Number(num_range.value[0])}
						helperText={
							Number(num_range.value[1]) < Number(num_range.value[0]) &&
							'Value must be greater than Duration Start'
						}
						label='Duration End'
						min={num_range.value[0]}
						step='1'
						type='number'
					/>

					<LabeledSelectField {...unit} id={unit.name} label='Unit' menuItems={unitOptions} />
				</div>
			)}
			{mode.value === 'absolute_range' && (
				<div className='controls-row' css='margin-top: 1rem'>
					<ReactDatePicker
						{...absolute_range.fields[0]}
						id='absolute-range-0'
						color='primary'
						label='From'
						selected={absolute_range.fields[0].value}
						popperPlacement='bottom-start'
						css='margin-right: 1rem'
					/>
					<ReactDatePicker
						{...absolute_range.fields[1]}
						id='absolute-range-1'
						color='primary'
						label='To'
						selected={absolute_range.fields[1].value}
						popperPlacement='bottom-start'
					/>
				</div>
			)}
		</div>
	);
}

function SettingFields({ timePeriod }) {
	return (
		<div className='settings-fields'>
			<TimePeriodFields fields={timePeriod.fields} />
		</div>
	);
}

function DiagnosticSettings({ baseForecastError, treatNanAsZero, removeZeros }) {
	return (
		<div className='settings-box'>
			<div className='settings-box__header md-text'>Additional Settings</div>

			<LabeledSelectField
				label={
					<>
						<InfoTooltip
							labelTooltip='The resolution of production used in calculating all the error terms
						and EURs for this forecast. This will not affect the data resolution used in calculating
						EUR of comparing forecasts'
						/>
						<span>Base Forecast Error Data Resolution</span>
					</>
				}
				menuItems={baseForecastErrorOptions}
				{...baseForecastError}
			/>
			<InfoTooltipWrapper
				tooltipTitle='If checked any missing production values will be evaluated as zero
						during the diagnostics run. If unchecked, dates with missing production will not be
						used for diagnostics.'
			>
				<Checkbox
					{...treatNanAsZero}
					id='treat-nan-as-zero'
					label='Treat missing production as zero'
					checked={treatNanAsZero.value}
				/>
			</InfoTooltipWrapper>
			<InfoTooltipWrapper tooltipTitle='If checked zero production values will not be used for diagnostics.'>
				<Checkbox
					{...removeZeros}
					id='remove-zeros'
					label='Remove zero production values'
					checked={removeZeros.value}
				/>
			</InfoTooltipWrapper>
		</div>
	);
}

function GeneralSettings({ pSeries, timePeriod }) {
	return (
		<div className='settings-box'>
			<div className='settings-box__header md-text'>General</div>
			<SettingFields pSeries={pSeries} timePeriod={timePeriod} />
		</div>
	);
}

function PhaseSettings({ phase, pSeries, timePeriod }) {
	return (
		<div className={`settings-box settings-box--${phase}`}>
			<div className='settings-box__header md-text'>{phase}</div>
			<SettingFields pSeries={pSeries} timePeriod={timePeriod} />
		</div>
	);
}

function DiagnosticForm({ id, onSubmit }) {
	const sameSettings = useField('sameSettings', true);

	const removeZeros = useField('removeZeros', false);
	const treatNanAsZero = useField('treatNanAsZero', false);

	const baseForecastError = useField('baseForecastError', 'monthly');

	const pSeries = useField('pSeries', 'p50');
	const timePeriod = useObjectField('timePeriod', defaultTimePeriod);

	const phases = {
		oil: {
			pSeries: useField('pSeries', 'p50'),
			timePeriod: useObjectField('timePeriod', defaultTimePeriod),
		},
		gas: {
			pSeries: useField('pSeries', 'p50'),
			timePeriod: useObjectField('timePeriod', defaultTimePeriod),
		},
		water: {
			pSeries: useField('pSeries', 'p50'),
			timePeriod: useObjectField('timePeriod', defaultTimePeriod),
		},
	};
	const handleSubmit = (event) => {
		event.preventDefault();
		event.stopPropagation();

		let data;
		if (sameSettings.value) {
			const general = getFormValue(pSeries, timePeriod);
			data = {
				oil: cloneDeep(general),
				gas: cloneDeep(general),
				water: cloneDeep(general),
			};
		} else {
			data = {
				oil: getFormValue(phases.oil.pSeries, phases.oil.timePeriod),
				gas: getFormValue(phases.gas.pSeries, phases.gas.timePeriod),
				water: getFormValue(phases.water.pSeries, phases.water.timePeriod),
			};
		}

		data = {
			...data,
			...getFormValue(baseForecastError),
			...getFormValue(removeZeros),
			...getFormValue(treatNanAsZero),
		};

		forecastPhases.forEach(({ value: phaseValue }) => {
			data[phaseValue].timePeriod.num_range = data[phaseValue].timePeriod.num_range.map((value) => Number(value));
		});

		onSubmit(data);
	};

	return (
		<form id={id} onSubmit={handleSubmit}>
			<div>
				<Checkbox
					{...sameSettings}
					id='same-settings'
					label='Use same settings for all phases'
					checked={sameSettings.value}
				/>
			</div>
			<div className='settings-content'>
				{sameSettings.value && (
					<Animated
						animationIn='slideInDown'
						animationOut='slideOutUp'
						animationInDuration={250}
						animationOutDuration={250}
					>
						<div>
							<GeneralSettings pSeries={pSeries} timePeriod={timePeriod} />
						</div>

						<DiagnosticSettingsContainer>
							<DiagnosticSettings
								baseForecastError={baseForecastError}
								treatNanAsZero={treatNanAsZero}
								removeZeros={removeZeros}
							/>
						</DiagnosticSettingsContainer>
					</Animated>
				)}
				{!sameSettings.value && (
					<Animated
						animationIn='slideInUp'
						animationOut='slideOutDown'
						animationInDuration={250}
						animationOutDuration={250}
					>
						<div className='settings-phases-container'>
							{VALID_PHASES.map((phase) => (
								<PhaseSettings
									key={phase}
									phase={phase}
									pSeries={phases[phase].pSeries}
									timePeriod={phases[phase].timePeriod}
								/>
							))}
						</div>

						<DiagnosticSettingsContainer>
							<DiagnosticSettings
								baseForecastError={baseForecastError}
								treatNanAsZero={treatNanAsZero}
								removeZeros={removeZeros}
							/>
						</DiagnosticSettingsContainer>
					</Animated>
				)}
			</div>
		</form>
	);
}

const DIAGNOSTIC_FORM_ID = 'diagnostic-form';

export function DiagnosticDialog({ onClose, onRun, wellCount, visible }) {
	const handleSubmit = async (input) => {
		await onRun(input);
		onClose();
	};

	return (
		<Dialog id='diagnostic-dialog' onClose={onClose} maxWidth='lg' open={visible}>
			<DialogTitle>Diagnostic Settings</DialogTitle>
			<DialogContent>
				<DiagnosticForm id={DIAGNOSTIC_FORM_ID} onSubmit={handleSubmit} />
			</DialogContent>
			<DialogActions>
				<Button className='warn-btn-flat warn-bot-border unset-text-transform' onClick={onClose}>
					Cancel
				</Button>
				<Button
					className='primary-btn-flat primary-bot-border unset-text-transform'
					form={DIAGNOSTIC_FORM_ID}
					color='primary'
					type='submit'
					{...getTaggingProp('forecast', 'diagnostic')}
				>
					Run ({wellCount})
				</Button>
			</DialogActions>
		</Dialog>
	);
}
