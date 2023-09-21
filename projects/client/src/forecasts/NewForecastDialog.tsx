import { withTheme } from '@material-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, TextField } from '@/components/v2';
import SelectField from '@/components/v2/misc/SelectField';
import { confirmationAlert, genericErrorAlert, getPerformanceWarningText, withDoggo } from '@/helpers/alerts';
import { usePrevious } from '@/helpers/hooks';
import { postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { hasNonWhitespace } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import { MAX_WELLS_IN_FORECAST, MAX_WELLS_PERFORMANCE_FORECAST } from '@/inpt-shared/constants';
import { URLS } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

const forecastTypeItems = [
	{ label: 'Probabilistic', value: 'probabilistic' },
	{ label: 'Deterministic', value: 'deterministic' },
];

const ErrorContainer = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 1rem;
	& > * {
		margin: 0.25rem 0;
	}
	div {
		color: ${theme.warningAlternativeColor};
	}
`;

const ErrorText = withTheme(styled.div`
    color: ${({ theme }) => theme.palette.warning.main}
    display: flex;
    justify-content: center;
`);

const InfoText = styled.span`
	display: flex;
	justify-content: space-between;
`;

const NewForecastDialog = ({ onHide, project, visible, wells: forecastWells }) => {
	const navigate = useNavigate();
	const prevVisible = usePrevious(visible);
	const track = useTrackAnalytics();

	const [name, setName] = useState('');
	const [prodPref, setProdPref] = useState('monthly_preference');
	const [type, setType] = useState('deterministic');
	const [wells, setWells] = useState(forecastWells);

	// reset state on open
	useEffect(() => {
		if (prevVisible !== visible) {
			setName('');
			setProdPref('monthly_preference');
			setType('deterministic');
			setWells(forecastWells);
		}
	}, [visible, prevVisible, forecastWells]);

	const { mutateAsync: stage } = useMutation(async () => {
		const body = {
			name,
			prodPref,
			projectId: project._id,
			type,
			wells,
		};

		try {
			const f = await withDoggo(postApi(`/forecast/stage-forecast`, body));
			confirmationAlert(`Successfully created forecast: ${f.name}`);
			track(EVENTS.forecast.form, body);
			navigate(URLS.project(f.project).forecast(f._id).view);
		} catch (err) {
			genericErrorAlert(err);
		}
	});

	// well filter actions
	const handleShowWellFilter = useCallback(async () => {
		const filteredWells = await showWellFilter({
			isFiltered: false,
			totalWells: `${wells.length} wells`,
			type: 'add',
			wells,
		});

		if (!filteredWells) return;
		setWells(filteredWells);
	}, [wells]);

	return (
		<Dialog fullWidth maxWidth='xs' onClose={onHide} open={visible}>
			<DialogTitle>Create Forecast</DialogTitle>

			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					height: 30vh;
					row-gap: 1rem;
				`}
			>
				<TextField
					error={!name.length || !hasNonWhitespace(name)}
					fullWidth
					helperText={!name.length || !hasNonWhitespace(name) ? 'Forecast name is required' : ''}
					label='Forecast Name'
					name='forecast-name'
					onChange={(e) => setName(e.target.value)}
					value={name}
				/>

				<SelectField
					label='Type'
					menuItems={forecastTypeItems}
					onChange={(e) => setType(e.target.value)}
					value={type}
				/>

				<Divider />

				<InfoText>
					<span>Current Project:</span>
					<span>{project.name}</span>
				</InfoText>

				<InfoText>
					<span>Selected Wells:</span>
					<span data-cy='selected'>{wells.length}</span>
				</InfoText>

				<ErrorContainer>
					{wells.length > MAX_WELLS_IN_FORECAST && (
						<ErrorText>{`- Selected Wells Must Be Fewer Than ${numberWithCommas(
							MAX_WELLS_IN_FORECAST
						)}`}</ErrorText>
					)}

					{wells.length > MAX_WELLS_PERFORMANCE_FORECAST && (
						<ErrorText>
							{`- ${getPerformanceWarningText('forecast', MAX_WELLS_PERFORMANCE_FORECAST)}`}
						</ErrorText>
					)}
				</ErrorContainer>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide} size='small'>
					Cancel
				</Button>

				<Button color='secondary' onClick={handleShowWellFilter} size='small'>
					Filter Wells
				</Button>

				<Button
					color='secondary'
					disabled={
						!name.length ||
						!hasNonWhitespace(name) ||
						wells.length > MAX_WELLS_IN_FORECAST ||
						wells.length === 0
					}
					onClick={() => stage()}
					size='small'
					variant='contained'
					{...getTaggingProp('forecast', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default NewForecastDialog;
