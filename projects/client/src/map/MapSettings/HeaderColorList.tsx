import { faRedo } from '@fortawesome/pro-regular-svg-icons';
import { Box, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { SketchPicker } from 'react-color';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as ReactWindowList } from 'react-window';

import { Placeholder } from '@/components';
import { useDerivedState } from '@/components/hooks';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { Autocomplete, IconButton, TextField, Tooltip } from '@/components/v2';
import { useLoadingBar } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { useWellHeaders } from '@/helpers/headers';
import { getEllipseStyle } from '@/helpers/styled';
import { filterSearch } from '@/helpers/utilities';
import { colorsArray } from '@/helpers/zing';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { useColorBy, useHeaderColors } from '../hooks';

interface HeaderValueColorProps {
	value: string | null;
	color?: string;
	updateColor: (color: string) => void;
}

interface HeaderColorListProps {
	project: Inpt.Project;
	filters: unknown[];
}

const DEFAULT_VALUE_LABEL = 'Default';

function HeaderValueColor({ value, color = '#000000', updateColor }: HeaderValueColorProps) {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const [currentColor, setCurrentColor] = useDerivedState(color);

	const updateColorDebounced = useDebounce(updateColor, 2000);

	return (
		<ClickAwayListener onClickAway={() => setAnchorEl(null)}>
			<div>
				<Popper open={!!anchorEl} anchorEl={anchorEl} placement='bottom' css={{ zIndex: 10000 }}>
					<SketchPicker
						color={currentColor}
						disableAlpha
						presetColors={colorsArray}
						onChange={(c) => setCurrentColor(c.hex)}
						onChangeComplete={(c) => updateColorDebounced(c.hex)}
					/>
				</Popper>
				<ListItem button selected={!!anchorEl} onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
					<ListItemText
						primary={
							<div css={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{value ?? <i>{DEFAULT_VALUE_LABEL}</i>}
							</div>
						}
					/>
					<ListItemSecondaryAction>
						<Tooltip title={currentColor}>
							<ColoredCircle $color={currentColor} $size='1.5rem' />
						</Tooltip>
					</ListItemSecondaryAction>
				</ListItem>
			</div>
		</ClickAwayListener>
	);
}

function HeaderColorsList({ project, filters }: HeaderColorListProps) {
	const { headerColors = [], isLoading, isUpdating, setColor } = useHeaderColors(project);

	const { colorBy, setColorBy, isUpdating: isUpdatingColorBy } = useColorBy(project, filters);

	const [filter, setFilter] = useState('');

	const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});

	const filteredValues = useMemo(
		() => filterSearch(headerColors, filter, ({ value }) => value ?? DEFAULT_VALUE_LABEL),
		[filter, headerColors]
	);

	useLoadingBar(isUpdating);

	const headers = useMemo(
		() => _.pickBy(wellHeadersLabels, (_value, key) => wellHeadersTypes[key].type === 'multi-select'),
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

	return (
		<>
			<Autocomplete
				variant='outlined'
				label='Wells Color Header'
				options={[null, ...Object.keys(headers)]}
				value={colorBy && headers[colorBy] ? colorBy : null}
				getOptionLabel={getHeaderOptionLabel}
				renderOption={renderHeaderOption}
				onChange={(_, newValue) => setColorBy(newValue)}
				InputLabelProps={{
					style: { ...getEllipseStyle() },
				}}
				fullWidth
			/>
			{colorBy ? (
				<Box
					css={`
						.MuiListItem-container {
							display: flex;
						}
						height: 40vh;
						overflow: hidden;
					`}
				>
					<Placeholder
						loading={isLoading || isUpdatingColorBy}
						empty={headerColors.length === 0}
						text={`There are no values for ${wellHeadersLabels[colorBy]}`}
						minShow={0}
					>
						<Box css={{ display: 'flex' }}>
							<TextField
								placeholder={`Search ${wellHeadersLabels[colorBy]}`}
								value={filter}
								onChange={(e) => setFilter(e.target.value)}
								fullWidth
							/>
							<Tooltip title='Reload values'>
								<IconButton size='small' onClick={() => setColorBy(colorBy)}>
									{faRedo}
								</IconButton>
							</Tooltip>
						</Box>
						<AutoSizer>
							{({ height, width }) => (
								<ReactWindowList
									id='selected-headers'
									height={height}
									width={width}
									itemSize={70}
									itemCount={filteredValues.length}
									itemData={filteredValues}
								>
									{({ data, index, style }) => {
										return (
											<div style={style}>
												<HeaderValueColor
													key={data[index].value ?? `_${DEFAULT_VALUE_LABEL}_`}
													value={data[index].value}
													color={data[index].color}
													updateColor={(c) => setColor(data[index].value, c)}
												/>
											</div>
										);
									}}
								</ReactWindowList>
							)}
						</AutoSizer>
					</Placeholder>
				</Box>
			) : null}
		</>
	);
}

export default HeaderColorsList;
