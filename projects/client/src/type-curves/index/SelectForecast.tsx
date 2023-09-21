import {
	Divider,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	TextField,
	Typography,
} from '@material-ui/core';
import { makeStyles, withTheme } from '@material-ui/core/styles';
import _, { capitalize, truncate } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Placeholder } from '@/components';
import { scrollBarStyles } from '@/forecasts/forecast-form/phase-form/layout';
import { ProjectForecastItem } from '@/forecasts/types';
import { useAlfa } from '@/helpers/alfa';
import { matchText } from '@/helpers/regexp';
import { pluralize } from '@/helpers/text';
import { getFullName } from '@/helpers/user';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';

import { useProjectForecastIndex } from './api';

const useStyle = makeStyles((theme) => ({
	listItemRoot: {
		color: theme.palette.text.secondary,
		background: theme.palette.type === 'light' ? '#F5F5F5' : '#292929',
		borderRadius: '4px',
		border: '1px solid',
		borderColor: theme.palette.type === 'light' ? '#F5F5F5' : '#404040',
		marginBottom: '8px',
		paddingTop: '6px',
		paddingBottom: '8px',

		'&.Mui-selected': {
			backgroundColor: theme.palette.type === 'light' ? '#F5F5F5' : '#292929',
			borderColor: '#228ADA',
		},

		'& .MuiListItemText-multiline': {
			margin: 0,
			lineHeight: 1,
		},
	},

	listItemBody: {
		lineHeight: '20px',
	},

	listItemCaption: {
		color: theme.palette.text.secondary,
		lineHeight: '14px',
	},
}));

const ScrolledContent = withTheme(styled.section`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	overflow-y: auto;
	padding-right: 0.5rem;
	row-gap: 0.5rem;
	${({ theme }) => scrollBarStyles({ theme, width: '10px' })}
`);

export function SelectForecast({
	value: selected,
	filteredWellsCount,
	onChange,
	...props
}: {
	value: ProjectForecastItem | null;
	filteredWellsCount: number;
	onChange: (newValue: ProjectForecastItem | null) => void;
}) {
	const { project } = useAlfa();
	const forecastIndexQuery = useProjectForecastIndex(project?._id);

	const [search, setSearch] = useState('');
	const classes = useStyle();

	const keyIteratee = _.iteratee('_id');
	const selectedKey = selected ? keyIteratee(selected) : null;

	// resets search between steps
	useEffect(() => {
		setSearch('');
	}, [forecastIndexQuery.data]);

	const selectedExists = useMemo(() => (_.isObject(selected) ? !_.isEmpty(selected) : selected != null), [selected]);

	return (
		<>
			<TextField
				fullWidth
				label='Search Forecasts'
				onChange={(ev) => setSearch(ev.target.value)}
				value={search}
				variant='outlined'
				size='small'
				margin='dense'
			/>
			<Divider css='margin: 0.5rem 0;' />
			<ScrolledContent>
				<List disablePadding {...props}>
					{forecastIndexQuery.isLoading && <Placeholder loading />}
					{forecastIndexQuery.data
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						?.filter(({ name, user }) => matchText(name!, search) || matchText(getFullName(user), search))
						.map((forecast) => {
							const isSelected = selectedExists && selectedKey === keyIteratee(forecast);
							return (
								<ListItem
									button
									className={classes.listItemRoot}
									key={forecast._id}
									selected={isSelected ?? false}
									onClick={() => onChange(isSelected ? null : forecast)}
								>
									<ListItemText
										primary={
											<Typography className={classes.listItemBody}>
												{truncate(forecast.name, {
													length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS,
												})}
											</Typography>
										}
										secondary={
											<Typography variant='caption' className={classes.listItemCaption}>
												{`${getFullName(forecast.user)} | ${capitalize(forecast.type)}`}
											</Typography>
										}
									/>
									<ListItemSecondaryAction css={{ textAlign: 'right' }}>
										<Typography className={classes.listItemBody}>
											{pluralize(forecast.wellCount, 'Well', 'Wells', false)}
										</Typography>
										<Typography
											align='right'
											variant='caption'
											component='div'
											className={classes.listItemCaption}
										>
											{isSelected && filteredWellsCount !== forecast.wellCount
												? `${filteredWellsCount} out of ${forecast.wellCount}`
												: forecast.wellCount}
										</Typography>
									</ListItemSecondaryAction>
								</ListItem>
							);
						})}
				</List>
			</ScrolledContent>
		</>
	);
}
