import { faRedo } from '@fortawesome/pro-regular-svg-icons';
import { Box } from '@material-ui/core';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';

import { Placeholder } from '@/components';
import { ColoredCircle } from '@/components/misc';
import { Autocomplete, IconButton, Tooltip } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useWellHeaders } from '@/helpers/headers';
import { WELL_DEFAULT_COLOR } from '@/helpers/map/colors';
import { MAX_WELLS_SIZE, MIN_WELLS_SIZE } from '@/helpers/map/well-size';
import { interpolate } from '@/helpers/math';
import { getEllipseStyle } from '@/helpers/styled';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { useSizeBy } from '../hooks';

interface SizeBySettingsProps {
	project: Inpt.Project;
	filters: unknown[];
}

interface LegendValueProps {
	radius: number;
	value: number | string;
}

const LEGEND_STEPS = 5;

const LegendCircle = styled.div<{ radius: number }>(
	({ radius, theme }) => `
	min-height: ${2 * radius + 1}px;
	min-width: ${2 * radius + 1}px;
	height: ${2 * radius + 1}px;
	width: ${2 * radius + 1}px;
	background-color: ${WELL_DEFAULT_COLOR};
	border: 1px solid ${theme.palette.text.primary};
	border-radius: 50%;
`
);

function LegendValue({ radius, value }: LegendValueProps) {
	return (
		<Box css={{ display: 'flex', gap: '0.5rem' }}>
			<Box
				css={{
					flexBasis: `${2 * MAX_WELLS_SIZE}px`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<LegendCircle radius={radius} />
			</Box>
			<Box css={{ display: 'flex', alignItems: 'center' }}>{Number(value).toFixed(2)}</Box>
		</Box>
	);
}

function SizeBySettings({ project, filters }: SizeBySettingsProps) {
	const { header: sizeByHeader, min, max, setSizeBy, isLoading, isUpdating } = useSizeBy(project, filters);

	const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});

	useLoadingBar(isUpdating);

	const headers = useMemo(
		() =>
			_.pickBy(wellHeadersLabels, (_value, key) =>
				['integer', 'number', 'percent'].includes(wellHeadersTypes[key].type)
			),
		[wellHeadersLabels, wellHeadersTypes]
	);

	const getHeaderOptionLabel = (key) => {
		return key === null ? 'None' : headers[key];
	};

	const renderHeaderOption = (key) => {
		return key === null ? (
			'None'
		) : (
			<>
				{projectCustomHeadersKeys.includes(key) && <ColoredCircle $color={projectCustomHeaderColor} />}
				{headers[key]}
			</>
		);
	};

	const hasLegend = min !== undefined && max !== undefined && min < max;

	const legend = hasLegend
		? [...new Array(LEGEND_STEPS)].map((_, i) => ({
				value: interpolate(min, max, LEGEND_STEPS, i),
				radius: interpolate(MIN_WELLS_SIZE, MAX_WELLS_SIZE, LEGEND_STEPS, i),
		  }))
		: [];

	return (
		<>
			<Autocomplete
				variant='outlined'
				label='Wells Size Header'
				options={[null, ...Object.keys(headers)]}
				value={sizeByHeader && headers[sizeByHeader] ? sizeByHeader : null}
				getOptionLabel={getHeaderOptionLabel}
				renderOption={renderHeaderOption}
				onChange={(_, newValue) => setSizeBy(newValue)}
				InputLabelProps={{
					style: { ...getEllipseStyle() },
				}}
				fullWidth
			/>
			{sizeByHeader && (
				<Box css={{ display: 'flex', alignItems: 'flex-start' }}>
					<Placeholder
						loading={isLoading || isUpdating}
						empty={!hasLegend}
						text={`There are no values for ${wellHeadersLabels[sizeByHeader]}`}
						// @ts-expect-error TODO fix this, emptySize should be a number
						emptySize='0.75rem'
						minShow={0}
					>
						<Box css={{ flexGrow: 1, display: 'flex', 'flex-direction': 'column', gap: '1rem' }}>
							{legend.map(({ value, radius }, i) => (
								<LegendValue key={i} value={value} radius={radius} />
							))}
						</Box>
						<Tooltip title='Reload values'>
							<IconButton size='small' onClick={() => setSizeBy(sizeByHeader)}>
								{faRedo}
							</IconButton>
						</Tooltip>
					</Placeholder>
				</Box>
			)}
		</>
	);
}

export default SizeBySettings;
