import { faSearch, faTimes, faTimesCircle } from '@fortawesome/pro-regular-svg-icons';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useEffect, useState } from 'react';

import ColoredCircle from '@/components/misc/ColoredCircle';
import {
	Collapse,
	Divider,
	Icon,
	IconButton,
	InputAdornment,
	List,
	ListItemButton,
	ListItemText,
	TextField,
} from '@/components/v2';
import { warningAlert, withLoadingBar } from '@/helpers/alerts';
import { getPastedText } from '@/helpers/browser';
import { postApi } from '@/helpers/routing';
import { difference, intersection, union } from '@/helpers/sets';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { useCurrentProject } from '@/projects/api';
import { MAX_AMOUNT_OF_VALUES } from '@/well-filter/shared';
import { Exclude, IncludeNull } from '@/well-filter/well-header-input-types';

import {
	FilterAccordion,
	FilterAccordionDetails,
	FilterAccordionSummary,
	FilterAccordionSummaryNameContainer,
	FilterName,
	textFieldCSS,
} from '../FilterAccordion';
import { FilterTypeProps } from '../shared';

interface FilterMultiSelectProps extends FilterTypeProps {
	appliedFilters;
	values: Set<string>;
	collapsed: boolean;
	inputValue: string;
}

export function FilterMultiSelect(props: FilterMultiSelectProps) {
	const { project } = useCurrentProject();
	const [searchResults, setSearchResults] = useState<string[]>([]);
	const [searchInput, setSearchInput] = useState<string>('');
	const [collapsed, setCollapsed] = useState<boolean>(true);

	const {
		inputName,
		values,
		exclude,
		showNull,
		neverNull,
		onChange,
		inputKey,
		inputValue: value,
		appliedFilters,
		projectHeader,
		collapsed: savedCollapsed,
		removeHeaderType,
	} = props;

	const fullValue = { values, exclude, showNull, neverNull, value };

	const valuesArr = [...values];

	const changeInput = (val) => {
		setSearchInput(val);
	};

	const collapse = (val) => {
		setCollapsed(val);
	};

	const getHeaderValues = async () => {
		const results = await withLoadingBar(
			postApi('/filters/getDistinctWellHeaderValues', {
				search: searchInput,
				header: inputKey,
				filters: appliedFilters,
				project: project?._id,
			})
		);
		setSearchResults(results);
		onChange({ ...fullValue, collapsed: false, value: searchInput }, inputKey);
	};

	const addOrRemoveValues = (vals) => {
		let newValues = difference(union(values, vals), intersection(values, vals));
		if (newValues.size > MAX_AMOUNT_OF_VALUES) {
			newValues = new Set([...newValues].slice(0, MAX_AMOUNT_OF_VALUES));
			warningAlert(`Too many values to filter. Limited to ${MAX_AMOUNT_OF_VALUES}.`);
		}
		onChange({ ...fullValue, values: newValues, collapsed: false, value: searchInput }, inputKey);
	};
	const addOrRemoveSingleValue = (val) => addOrRemoveValues(new Set([val]));

	useEffect(() => {
		setCollapsed(savedCollapsed);
	}, [savedCollapsed]);

	useEffect(() => setSearchInput(value), [value]);

	const paste = (event) => {
		event.preventDefault();
		const pasteList = getPastedText(event)
			.split(/[,\s]+/)
			.filter((s) => s);
		addOrRemoveValues(new Set(pasteList));
	};

	return (
		<FilterAccordion>
			<FilterAccordionSummary>
				<FilterAccordionSummaryNameContainer>
					<FilterName>
						{projectHeader && <ColoredCircle $color={projectCustomHeaderColor} />}
						{inputName}
					</FilterName>
					<IconButton
						size='small'
						onClick={(e) => {
							e.stopPropagation();
							removeHeaderType(inputKey, projectHeader);
						}}
					>
						{faTimes}
					</IconButton>
				</FilterAccordionSummaryNameContainer>
			</FilterAccordionSummary>
			<FilterAccordionDetails>
				<div
					css={`
						margin-top: 1rem;
						display: flex;
						flex-direction: column;
					`}
				>
					<TextField
						css={`
							margin-bottom: 1rem;
							${textFieldCSS};
						`}
						variant='outlined'
						fullWidth
						placeholder='Enter Text Filter'
						value={searchInput}
						onKeyPress={(e) => e.key === 'Enter' && getHeaderValues()}
						onChange={(e) => changeInput(e.target.value)}
						onPaste={paste}
						InputProps={{
							endAdornment: (
								<InputAdornment
									position='end'
									css={`
										cursor: pointer;
									`}
									onClick={(e) => {
										e.preventDefault();
										getHeaderValues();
									}}
								>
									<Icon>{faSearch}</Icon>
								</InputAdornment>
							),
						}}
					/>
					<Divider />
					{searchResults || values.size ? (
						<div id='filter-multi-select-chips'>
							{valuesArr.map((v) => {
								return (
									<div
										key={v}
										css={`
											display: flex;
											justify-content: space-between;
											align-items: center;
											padding: 2px 0;
											margin: 3px 0;
										`}
									>
										<div>{v}</div>
										<IconButton
											size='small'
											css={`
												color: ${({ theme }) => theme.palette.text.secondary};
											`}
											onClick={() => addOrRemoveSingleValue(v)}
										>
											{faTimesCircle}
										</IconButton>
									</div>
								);
							})}
						</div>
					) : (
						''
					)}
					<Divider />
					{(searchResults?.length > 0 || value) && (
						<>
							<ListItemButton
								css={`
									height: 1.5rem;
									margin: 5px 0;
									padding: 0;
								`}
								onClick={() => collapse(!collapsed)}
							>
								{collapsed ? <ExpandLess /> : <ExpandMore />}
								<ListItemText
									css={`
										font-size: 0.75rem;
									`}
									disableTypography
									primary={`Results for: ${value}`}
								/>
							</ListItemButton>
							<Collapse in={!collapsed}>
								<List
									css={`
										max-height: 150px;
										overflow-y: auto;
									`}
								>
									{searchResults
										.filter((f) => !values.has(f) && !!f)
										.map((r) => (
											<ListItemButton
												key={r}
												css={`
													cursor: pointer;
													padding: 5px 0;
												`}
												onClick={() => addOrRemoveSingleValue(r)}
											>
												<ListItemText
													style={{
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														marginLeft: '.25rem',
													}}
													primary={r}
													disableTypography
												/>
											</ListItemButton>
										))}
								</List>
							</Collapse>
						</>
					)}
					<Divider />
					<Exclude value={fullValue} inputName={inputKey} onChange={onChange} label='Exclude' />
					{!neverNull && <IncludeNull value={fullValue} inputName={inputKey} onChange={onChange} />}
				</div>
			</FilterAccordionDetails>
		</FilterAccordion>
	);
}
