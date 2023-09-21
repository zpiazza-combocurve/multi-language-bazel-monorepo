/* eslint react/jsx-key: warn */
import _ from 'lodash-es';
import { Component } from 'react';
import styled from 'styled-components';

import { NumberField, SelectField } from '@/components';
import { Autocomplete, ReactDatePicker as DatePicker, Divider, Paper, SwitchField, Typography } from '@/components/v2';
import {
	DeterministicSeriesDescription,
	SegmentDescription,
	SegmentMenuItems,
} from '@/forecasts/charts/segmentComponents';
import { forecastSeries, phases } from '@/helpers/zing';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { TCTooltippedField } from '@/type-curves/TypeCurveFit/TypeCurveControls/shared/ControlComponents';
import { FPD_SOURCES, TC_TYPES } from '@/type-curves/shared/formProperties';

const resolutionItems = [
	{ label: 'Daily', value: 'daily' },
	{ label: 'Monthly', value: 'monthly' },
];

const phaseItems = [{ label: 'All', value: 'all' }, ...phases];

const getAutocompleteProps = (listItems) => {
	if (!listItems?.length) {
		return { options: [], getOptionLabel: _.noop };
	}

	const listByKey = _.keyBy(listItems, '_id');
	const options = _.map(listItems, '_id');
	const getOptionLabel = (option) => listByKey[option]?.name;
	return { options, getOptionLabel, listByKey };
};

const ControlsContainer = styled(Paper).attrs({ elevation: 2 })`
	display: flex;
	flex-direction: column;
	padding: 0.5rem 0.75rem;
	row-gap: 0.25rem;
`;

const FormControl = ({ label, fieldRender, ...inputProps }) => (
	<div
		css={`
			display: flex;
			align-items: center;
			width: 100%;
		`}
	>
		<div css='flex-basis: 30%'>{`${label}:`}</div>
		{fieldRender(inputProps)}
	</div>
);

const LabeledSelectField = ({ label, ...rest }) => (
	<FormControl
		label={label}
		// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
		fieldRender={(fieldProps) => <SelectField css='flex-grow: 1' {...fieldProps} />}
		{...rest}
	/>
);

const LabeledNumberField = ({ label, ...rest }) => (
	<FormControl
		label={label}
		// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
		fieldRender={(fieldProps) => <NumberField css='flex-grow: 1' {...fieldProps} />}
		{...rest}
	/>
);
class ApplyTCSideOptions extends Component {
	constructor(props) {
		super(props);
		this.state = {
			phase: 'oil',
			segIdx: 0,
		};
	}

	async componentDidMount() {
		this._isMounted = true;
	}

	componentDidUpdate(prevProps) {
		const { refreshFit } = this.props;
		const updateFit = refreshFit !== prevProps.refreshFit;

		if (updateFit) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ segIdx: 0 });
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	_isMounted = false;

	SetState = (obj, cb) => {
		if (this._isMounted) {
			this.setState(obj, cb);
		}
	};

	setParentPhase = (val) => {
		const { setPhase } = this.props;
		setPhase(val);
	};

	setPhaseType = (val) => {
		const { setPhaseType } = this.props;
		setPhaseType(val);
	};

	setSettings = (key, val) => {
		const { settings, setTypeCurve, setParentState, typecurve } = this.props;
		settings[key] = val;
		setParentState({ settings }, () => {
			setTypeCurve(typecurve);
		});
	};

	setUseLookup = (checked) => {
		const { setParentState } = this.props;
		const newState = checked ? { typecurve: null, fit: null } : { lookup: null };
		setParentState({ useLookup: checked, ...newState });
	};

	getSegments = () => {
		const { phase } = this.state;
		const { fit: parentFit, phase: parentPhase, settings } = this.props;

		let fit = parentFit;
		if (parentPhase === 'all') {
			fit = parentFit.filter((curFit) => curFit.phase === phase)?.[0] ?? {};
		}

		const { fitType, P_dict, ratio_P_dict } = fit;
		return (fitType === 'rate' ? P_dict : ratio_P_dict)?.[settings.series]?.segments ?? [];
	};

	render() {
		const { phase: statePhase, segIdx } = this.state;
		const {
			actions,
			fit,
			forecastType,
			lookup,
			lookupList,
			phase: parentPhase,
			phaseType,
			schedList,
			setLookup,
			settings,
			setTypeCurve,
			tcList,
			typecurve,
			useLookup,
		} = this.props;

		const { options, getOptionLabel, listByKey } = getAutocompleteProps(useLookup ? lookupList : tcList);
		const { date, fpd, normalize, resolution, phaseRiskFactors, schedule, series } = settings;

		const phase = parentPhase === 'all' ? statePhase : parentPhase;
		const segments = fit ? this.getSegments() : [];

		const renderRiskFactor = () => {
			if (parentPhase === 'all') {
				return [
					<TCTooltippedField key='apply-q-tooltip' tooltip='Apply a Q multiplier to the curve'>
						Risk Factor
					</TCTooltippedField>,
					...phases.map(({ value: p, label }) => (
						<LabeledNumberField
							id='risk-factor-number-input'
							key={`risk-factor-${p}`}
							className='md-cell'
							label={label}
							onChange={(value) => {
								const newRiskFactor = { ...phaseRiskFactors, [p]: value };
								this.setSettings('phaseRiskFactors', newRiskFactor);
							}}
							value={phaseRiskFactors[p]}
							fixedWidth
						/>
					)),
				];
			}
			return (
				<TCTooltippedField tooltip='Apply a Q multiplier to the curve'>
					<LabeledNumberField
						id='risk-factor-number-input'
						className='md-cell'
						label='Risk Factor'
						onChange={(value) => {
							const newRiskFactor = { ...phaseRiskFactors, [parentPhase]: value };
							this.setSettings('phaseRiskFactors', newRiskFactor);
						}}
						value={phaseRiskFactors[parentPhase]}
					/>
				</TCTooltippedField>
			);
		};

		return (
			<section
				css={`
					display: flex;
					flex-basis: 20%;
					flex-direction: column;
					height: 100%;
					overflow-y: auto;
					padding: 1rem 0.5rem;
					row-gap: 0.5rem;
				`}
			>
				<Typography css='text-align: center;' variant='h5'>
					Apply Type Curve
				</Typography>

				<div
					css={`
						align-items: center;
						display: flex;
						justify-content: space-around;
						width: 100%;
					`}
				>
					{actions}
				</div>

				<Divider />

				<ControlsContainer>
					<LabeledSelectField
						id='apply-tc-phase-select'
						className='md-cell'
						label='Phase'
						menuItems={phaseItems}
						// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
						onChange={this.setParentPhase}
						value={parentPhase}
					/>

					{false && ( // disabled for now because not actually used
						<LabeledSelectField
							id='apply-tc-resolution-select'
							className='md-cell'
							label='Resolution'
							menuItems={resolutionItems}
							onChange={(value) => this.setSettings('resolution', value)}
							value={resolution}
						/>
					)}

					{forecastType === 'deterministic' && parentPhase !== 'all' && (
						<LabeledSelectField
							id='apply-tc-phase-type-select'
							className='md-cell'
							label='Phase Type'
							menuItems={TC_TYPES}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onChange={this.setPhaseType}
							value={phaseType}
						/>
					)}

					<TCTooltippedField tooltip='If on, normalization is applied to adjust q Start of the applied curve'>
						<SwitchField
							disabled={phaseType !== 'rate'}
							css={`
								margin-left: 0;
								width: 100%;
								display: flex;
								justify-content: space-between;
							`}
							labelPlacement='start'
							label={
								<Typography
									css={`
										font-size: 0.875rem;
									`}
								>
									Apply Normalization:
								</Typography>
							}
							onChange={(ev) => this.setSettings('normalize', ev.target.checked)}
							checked={normalize}
						/>
					</TCTooltippedField>

					{renderRiskFactor()}
				</ControlsContainer>

				<ControlsContainer>
					{forecastType === 'deterministic' && (
						<LabeledSelectField
							id='apply-tc-series-select'
							className='md-cell'
							label='Apply Series'
							menuItems={forecastSeries}
							onChange={(val) => this.setSettings('series', val)}
							value={series}
						/>
					)}

					<LabeledSelectField
						id='apply-tc-fpd-select'
						className='md-cell'
						label='FPD Source'
						value={fpd}
						onChange={(val) => this.setSettings('fpd', val)}
						menuItems={FPD_SOURCES}
					/>

					{fpd === 'fixed' && (
						<FormControl
							label='Fixed FPD'
							// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
							fieldRender={(fieldProps) => <DatePicker css='flex-grow: 1' {...fieldProps} />}
							color='primary'
							onChange={(val) => this.setSettings('date', val)}
							selected={new Date(date)}
						/>
					)}

					{fpd === 'schedule' && (
						<Autocomplete
							{...getAutocompleteProps(schedList)}
							disableClearable
							label='Schedule'
							onChange={(_ev, value) => this.setSettings('schedule', value)}
							value={schedule ?? ''}
						/>
					)}
				</ControlsContainer>

				<ControlsContainer>
					<SwitchField
						css={`
							margin-left: 0;
							width: 100%;
							display: flex;
							justify-content: space-between;
						`}
						labelPlacement='start'
						label={
							<Typography
								css={`
									font-size: 0.875rem;
								`}
							>
								Use Lookup:
							</Typography>
						}
						onChange={(ev) => this.setUseLookup(ev.target.checked)}
						checked={useLookup}
					/>
				</ControlsContainer>

				<ControlsContainer>
					{useLookup && (
						<Autocomplete
							key='lookup-autocomplete'
							disableClearable
							getOptionLabel={getOptionLabel}
							label='Lookup'
							onChange={(_ev, value) => setLookup(listByKey[value])}
							options={options}
							renderOption={(props) => {
								return _.truncate(getOptionLabel(props), {
									length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS,
								});
							}}
							value={lookup?._id ?? ''}
						/>
					)}

					{!useLookup && (
						<Autocomplete
							key='tc-autocomplete'
							disableClearable
							getOptionLabel={getOptionLabel}
							label='Type Curve'
							onChange={(_ev, value) => setTypeCurve(listByKey[value])}
							options={options}
							renderOption={(props) => {
								return _.truncate(getOptionLabel(props), {
									length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS,
								});
							}}
							value={typecurve?._id ?? ''}
						/>
					)}

					{!useLookup && fit && (
						<div
							css={`
								display: flex;
								flex-direction: column;
								row-gap: 0.5rem;
							`}
						>
							<div>
								{parentPhase === 'all' && (
									<LabeledSelectField
										id='apply-tc-state-phase-select'
										className='md-cell'
										label='Phase'
										menuItems={phases}
										// eslint-disable-next-line new-cap -- TODO eslint fix later
										onChange={(value) => this.SetState({ phase: value })}
										value={phase}
									/>
								)}

								<LabeledSelectField
									id='set-series-select'
									className='md-cell'
									label='Series'
									menuItems={forecastSeries}
									onChange={(val) =>
										// eslint-disable-next-line new-cap -- TODO eslint fix later
										this.SetState({ segIdx: 0 }, () => this.setSettings('series', val))
									}
									value={series}
								/>

								<SegmentMenuItems
									render={(menuItems) => (
										<LabeledSelectField
											id='set-segment-idx-select'
											className='md-cell'
											label='Segment'
											menuItems={menuItems}
											// eslint-disable-next-line new-cap -- TODO eslint fix later
											onChange={(val) => this.SetState({ segIdx: val })}
											value={segIdx}
										/>
									)}
									segments={segments}
								/>
							</div>

							<Divider />

							<DeterministicSeriesDescription phase={phase} segments={segments} isTC />

							<Divider />

							{segments?.[segIdx] && (
								<SegmentDescription idxDate phase={phase} segment={segments[segIdx]} />
							)}
						</div>
					)}
				</ControlsContainer>
			</section>
		);
	}
}

export default ApplyTCSideOptions;
