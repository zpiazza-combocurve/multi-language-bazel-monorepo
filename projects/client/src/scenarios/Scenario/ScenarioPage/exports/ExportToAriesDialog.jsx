import { faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { Box, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useState } from 'react';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, CheckboxField, Dialog, DialogActions, DialogContent, Icon, InfoTooltipWrapper } from '@/components/v2';
import CheckboxGroupField from '@/components/v2/misc/CheckboxGroupField';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { InstructionsBanner } from '@/data-import/FileImport/CreateDialog';
import { customErrorAlert, genericErrorAlert } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';

const TooltipTextContainer = styled.div`
	white-space: pre-wrap;
`;

const wellIdKeyOptions = [
	{ value: 'inptID', label: 'INPT ID' },
	{ value: 'api10', label: 'API 10' },
	{ value: 'api12', label: 'API 12' },
	{ value: 'api14', label: 'API 14' },
	{ value: 'chosenID', label: 'Chosen ID' },
	{ value: 'aries_id', label: 'ARIES ID' },
	{ value: 'phdwin_id', label: 'PhdWin ID' },
	{ value: 'well_name', label: 'Well Name' },
	{ value: 'well_name_well_number', label: 'Well Name + Well Number' },
];
const forecastSegmentEndingCondition = [
	{ value: 'years', label: 'Years' },
	{ value: 'months', label: 'Months' },
	{ value: 'absolute_date', label: 'Absolute Date' },
	{ value: 'ending_rate', label: 'Ending Rate' },
];
const forecastUnits = [
	{ value: 'per_day', label: 'Per Day' },
	{ value: 'per_month', label: 'Per Month' },
];
const toLifeOptions = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' },
];
const dataResolutionOptions = [
	{ value: 'same_as_forecast', label: 'Same As Forecast' },
	{ value: 'daily', label: 'Daily' },
	{ value: 'monthly', label: 'Monthly' },
];
const exportFileFormatOptions = [
	{ value: 'accdb', label: 'MS ACCESS' },
	{
		value: 'csv',
		label: 'CSV and TXT',
	},
];
const includeProductionOptions = [
	{ value: 'daily', label: 'Daily' },
	{ value: 'monthly', label: 'Monthly' },
];

const useTextFieldStyles = makeStyles({
	textField: {
		maxWidth: '320px',
		marginTop: '8px',
		marginLeft: '20px',
	},

	input: {
		padding: '7px 12px',
		fontSize: '.875rem',
	},
});

const forecastHistoryMatchTooltip = () => {
	return (
		<TooltipTextContainer>
			Since ComboCurve is daily resolution and ARIES is monthly, export requires a slight recalculation of the
			curve parameters to make a good overlay of historical data (taken forward to the end of the month) and
			forecasts (taken backward to the first of the month). This alignment will make it so curve parameters
			between the platform are not verbatim. To facilitate full alignment, please select in ARIES Multigraph{' '}
			{'==>'} Setup {'==>'} Preferences {'==>'} Draw monthly history volumes at mid-month.
		</TooltipTextContainer>
	);
};

const sidefileTooltip = () => {
	return (
		<TooltipTextContainer>
			<div>
				Default is &#34;No&#34; to flatten all models into the respective ARIES sections. Selecting this
				checkbox will accumulate any non-unique project model into a Sidefile to be used by the assigned
				properties. Overlay lines are co-located with the lines being modified and are called in both sections.
				Sidefile naming convention cannot be the same as CC model names so use: a_b_c
				<br />
				a) &#34;Section Origin&#34;&#10;&#13;
				<br />
				b) &#34;Name&#34; truncated to not violate the ARIES 20-character limit
				<br />
				c) &#34;4 Character Increment&#34;
			</div>
		</TooltipTextContainer>
	);
};

const outputCumsTooltip = () => {
	return (
		<TooltipTextContainer>
			Default is &#34;Yes&#34;. The CUMS data line is the total volume produced from the first production date
			(dictated by the Data Resolution above) until the forecast START for each of the first 5 phases. CUMS allow
			the calculation of EUR by combining historical data with forecast. Writing these lines to ARIES might not be
			desired since they can interact with reforecasting and reimport to CC.
		</TooltipTextContainer>
	);
};

const sameAsForecastTooltip = () => {
	return (
		<TooltipTextContainer>
			<div>
				Export ComboCurve&apos;s discrete monthly forecast volumes to a custom table in ARIES called
				CC_FORECAST, along with normal Arps forecast parameters. LOAD lines overlay Arps parameters with CC
				forecast volumes in order to match precisely. Enter up to 60 months due to an ARIES limitation.
			</div>
		</TooltipTextContainer>
	);
};

const zeroForecastTooltip = 'Pulls the Shut-In periods into the forecast upon export';

const ExportToAriesDialog = (props) => {
	const { close, scenarioId, visible, selectedAssignmentIds } = props;

	const [selectedIdKey, setSelectedIdKey] = useState('inptID');
	const [endingCondition, setEndingCondition] = useState('years');
	const [forecastUnit, setForecastUnit] = useState('per_day');
	const [toLife, setToLife] = useState('no');
	const [dataResolution, setDataResolution] = useState('same_as_forecast');
	const [exportFileFormat, setExportFileFormat] = useState('accdb');
	const [includeZeroForecast, setIncludeZeroForecast] = useState(false);
	const [includeProduction, setIncludeProduction] = useState([]);
	const [forecastHistoryMatch, setForecastHistoryMatch] = useState(false);
	const [sidefile, setSidefile] = useState(false);
	const [sameAsForecastOption, setSameAsForecastOption] = useState(false);
	const [sameAsForecastMonths, setSameAsForecastMonths] = useState({ monthsNumber: 24, isError: false });
	const [outputCums, setOutputCums] = useState(true);

	const textFieldClasses = useTextFieldStyles();

	const handleMonthsChange = (event) => {
		// Need to apply parseInt to avoid leading zeros in number
		const monthsNumber = parseInt(event.target.value);

		if (Number.isInteger(monthsNumber) && monthsNumber >= 1 && monthsNumber <= 60) {
			setSameAsForecastMonths({ monthsNumber, isError: false });
		} else {
			setSameAsForecastMonths({ monthsNumber, isError: true });
		}
	};

	const exportToAries = async () => {
		const MAX_WELLS_NUM = 5000;

		if (selectedAssignmentIds.size > MAX_WELLS_NUM) {
			customErrorAlert(`Can only export up to ${MAX_WELLS_NUM} wells`, 'Try again with less wells selected');
			return;
		}

		close();

		try {
			await postApi(`/scenarios/${scenarioId}/exportToAries`, {
				selectedAssignmentIds: [...selectedAssignmentIds],
				selectedIdKey,
				endingCondition,
				forecastUnit,
				toLife,
				dataResolution,
				exportFileFormat,
				includeZeroForecast,
				includeProduction,
				forecastHistoryMatch,
				sidefile,
				outputCums,
				sameAsForecastMonthsNumber: sameAsForecastOption ? sameAsForecastMonths.monthsNumber : null,
			});
		} catch (err) {
			genericErrorAlert(err, 'Failed start export');
		}
	};

	const { openArticle } = useZoho();

	return (
		<Dialog onHide={close} open={visible} display='flex' fullWidth maxWidth='md'>
			<DialogContent>
				<InstructionsBanner onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.ExportToAries })}>
					How to Export to ARIES
				</InstructionsBanner>
				<h2>Export To ARIES</h2>
				<div css='display: flex; flex-direction: column;'>
					<CheckboxGroupField
						label='Include Production Data'
						tooltipTitle='Check to include the Daily and/or Monthly production (if available) to be imported into the AC_DAILY and AC_PRODUCT tables in ARIES'
						items={includeProductionOptions}
						value={includeProduction}
						onChange={(value) => setIncludeProduction(value)}
						row
					/>
					<RadioGroupField
						name='export-file-format'
						label='Export File Format'
						tooltipTitle={
							<TooltipTextContainer>
								MS ACCESS exports an ARIES-ready .accdb file with all relevant tables. This option
								writes a master table with minimal but relevant items. Make sure to allow the file to
								download because browsers usually block .accdb files by default.
								<br />
								<br />
								CSV and TXT exports files to be File-imported from the ARIES Project Manager (or via
								Access for advanced users). The export also contains .imp instruction files for data
								mapping.
								<br />
								<br />
								See the help file linked on the main tooltip above for detailed instructions or the KB
								“How-To” Videos
							</TooltipTextContainer>
						}
						row
						value={exportFileFormat}
						options={exportFileFormatOptions}
						onChange={({ target }) => setExportFileFormat(target.value)}
					/>
					{exportFileFormat === 'accdb' && (
						<Box
							p={1}
							css={`
								display: flex;
								align-items: center;
								border-radius: 0.25rem;
								background: ${({ theme }) => theme.palette.background.opaque};
								margin: 0 0 0.75rem 0;
							`}
						>
							<Icon css='margin: 0 1rem 0 .75rem' color='warning'>
								{faExclamationTriangle}
							</Icon>
							After export, Access&apos; &quot;Compact and Repair Database&quot; utility must be run in
							order to properly connect the data tables.
						</Box>
					)}
					<RadioGroupField
						name='well-identifier'
						label='Well Identifier'
						tooltipTitle='Choose INPT ID for a new db if you are OK with using it as your PROPNUM or match your existing PROPNUM with the other selections if they align with ARIES. See the KB Help File for instructions on aligning PROPNUM and INPT ID, etc.'
						row
						value={selectedIdKey}
						options={wellIdKeyOptions}
						onChange={({ target }) => setSelectedIdKey(target.value)}
					/>
					<RadioGroupField
						name='forecast-unit'
						label='Forecast Unit'
						tooltipTitle='For the economic forecast, specify the units of output, per day or per month for the scheduled lines'
						row
						value={forecastUnit}
						options={forecastUnits}
						onChange={({ target }) => setForecastUnit(target.value)}
					/>
					<RadioGroupField
						name='ending-condition'
						label='Forecast Segment Ending Condition'
						tooltipTitle='Writes out the CC segment ending condition for the scheduled phases to ARIES as you choose'
						row
						value={endingCondition}
						options={forecastSegmentEndingCondition}
						onChange={({ target }) => setEndingCondition(target.value)}
					/>
					<RadioGroupField
						name='to-life'
						label='Forecast Non Major Segment To Life'
						tooltipTitle='Ensures the minor phases last as long as the major phases if you choose'
						row
						value={toLife}
						options={toLifeOptions}
						onChange={({ target }) => setToLife(target.value)}
					/>
					<RadioGroupField
						name='data-resolution'
						label='Data Resolution'
						tooltipTitle='Allows Daily or Monthly resolution for the “Cums” output at the top of the production section'
						row
						value={dataResolution}
						options={dataResolutionOptions}
						onChange={({ target }) => setDataResolution(target.value)}
					/>
					<CheckboxField
						label={
							<InfoTooltipWrapper tooltipTitle={outputCumsTooltip()} placeIconAfter iconFontSize='18px'>
								Output CUMS to ARIES
							</InfoTooltipWrapper>
						}
						checked={outputCums}
						onChange={(ev) => setOutputCums(ev.target.checked)}
					/>
					<CheckboxField
						label={
							<InfoTooltipWrapper tooltipTitle={zeroForecastTooltip} placeIconAfter iconFontSize='18px'>
								Include Zero Forecast
							</InfoTooltipWrapper>
						}
						checked={includeZeroForecast}
						onChange={(ev) => setIncludeZeroForecast(ev.target.checked)}
					/>

					<CheckboxField
						label={
							<InfoTooltipWrapper
								tooltipTitle={forecastHistoryMatchTooltip()}
								placeIconAfter
								iconFontSize='18px'
							>
								Force Forecast/History Match
							</InfoTooltipWrapper>
						}
						checked={forecastHistoryMatch}
						onChange={(ev) => setForecastHistoryMatch(ev.target.checked)}
					/>
					<CheckboxField
						label={
							<InfoTooltipWrapper tooltipTitle={sidefileTooltip()} placeIconAfter iconFontSize='18px'>
								Export Models as Sidefiles
							</InfoTooltipWrapper>
						}
						checked={sidefile}
						onChange={(ev) => setSidefile(ev.target.checked)}
					/>
					<CheckboxField
						label={
							<InfoTooltipWrapper
								tooltipTitle={sameAsForecastTooltip()}
								placeIconAfter
								iconFontSize='18px'
							>
								Export Forecast Also as Volumes
							</InfoTooltipWrapper>
						}
						checked={sameAsForecastOption}
						onChange={(ev) => setSameAsForecastOption(ev.target.checked)}
					/>
					<TextField
						disabled={!sameAsForecastOption}
						id='outlined-number'
						label='Months'
						type='number'
						InputLabelProps={{
							shrink: true,
						}}
						className={textFieldClasses.textField}
						inputProps={{
							min: 1,
							max: 60,
							step: 1,
							className: textFieldClasses.input,
						}}
						variant='outlined'
						value={sameAsForecastMonths.monthsNumber.toString()}
						error={sameAsForecastMonths.isError}
						onChange={handleMonthsChange}
						helperText={sameAsForecastMonths.isError ? 'Enter integer months from 1 to 60.' : ''}
					/>
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={close}>Cancel</Button>
				<Button
					color='primary'
					onClick={exportToAries}
					disabled={sameAsForecastMonths.isError}
					{...getTaggingProp('scenario', 'exportScenarioAries')}
				>
					Export
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export {
	ExportToAriesDialog,
	wellIdKeyOptions,
	forecastSegmentEndingCondition,
	forecastUnits,
	toLifeOptions,
	dataResolutionOptions,
	zeroForecastTooltip,
	forecastHistoryMatchTooltip,
	outputCumsTooltip,
};
