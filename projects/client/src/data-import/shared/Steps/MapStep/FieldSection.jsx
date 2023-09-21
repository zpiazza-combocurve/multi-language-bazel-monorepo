/* eslint react/jsx-key: warn */
import { faCheckCircle, faCircle, faFilter, faUndo } from '@fortawesome/pro-regular-svg-icons';
import { FormGroup } from '@material-ui/core';
import { escapeRegExp } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
import { Divider, ListItemControl } from 'react-md';
import styled from 'styled-components';

import { Checkbox, MenuButton, Text } from '@/components';
import { InfoTooltip, muiTooltiped } from '@/components/tooltipped';
import { CheckboxField, Icon, IconButton } from '@/components/v2';
import { ifProp, theme } from '@/helpers/styled';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { DebouncedSearchInput } from './DebouncedSearchInput';
import { DnDBox } from './DragNDrop';

const MUITooltippedIconButton = muiTooltiped(IconButton);

const ScrollSection = styled.div`
	overflow-y: scroll; // always show scrollbar
`;

const hideData = (data, b) => `& [data-${data}='${b}'] { display: none; }`;

const ItemsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
	grid-gap: 1rem;
	padding: 1rem;
	align-content: flex-start;
	${ifProp('filterNoMapped', hideData('mapped', 'true'))}
	${ifProp('filterMapped', hideData('mapped', 'false'))}
	${ifProp('filterRequired', hideData('required', 'false'))}
	${ifProp('filterRecommended', hideData('recommended', 'false'))}
`;

const HalfContainer = styled.div`
	width: 50%;
	flex-direction: column;
	height: 100%;
	width: 100%;
	display: flex;
`;

const ActionsContainer = styled.div`
	display: flex;
	align-items: center;
`;

function useSwitch() {
	const [activeId, setActive] = useState('');
	const handleOnSwitch = useCallback((value) => setActive((prev) => (prev === value ? null : value)), []);
	return [activeId, handleOnSwitch];
}

function MappedFilter({ activeId, onChange: handleOnChange, ...props }) {
	const unselectedIcon = <Icon>{faCircle}</Icon>;
	const selectedIcon = <Icon>{faCheckCircle}</Icon>;

	return (
		<div
			css={`
				padding: 0.25rem 1rem;
				& .MuiFormControlLabel-label {
					width: max-content;
				}
			`}
		>
			<FormGroup value={activeId} {...props}>
				<CheckboxField
					value='mapped'
					label='Mapped Only'
					checked={activeId === 'mapped'}
					icon={unselectedIcon}
					checkedIcon={selectedIcon}
					onChange={() => handleOnChange('mapped')}
				/>
				<CheckboxField
					value='not_mapped'
					label='Not Mapped Only'
					checked={activeId === 'not_mapped'}
					icon={unselectedIcon}
					checkedIcon={selectedIcon}
					onChange={() => handleOnChange('not_mapped')}
				/>
			</FormGroup>
		</div>
	);
}

function hasRequiredFields(data = {}) {
	return Object.values(data).some(({ required }) => required);
}
function hasRecommendedFields(data = {}) {
	return Object.values(data).some(({ recommended }) => recommended);
}

export const FieldSection = memo(
	({ ids = [], data = {}, description, type, accept, onDrop, otherData, resetMapping, tooltipText = null }) => {
		const [search, setSearch] = useState('');
		const [filterMapped, toggleFilterMapped] = useSwitch();
		const [filterRequired, setRequired] = useState(false);
		const [filterRecommended, setRecommended] = useState(false);

		const hasRequired = useMemo(() => hasRequiredFields(data), [data]);
		const hasRecommended = useMemo(() => hasRecommendedFields(data), [data]);

		const filteredIds = useMemo(
			() => ids.filter((id) => data[id]?.label?.match?.(new RegExp(escapeRegExp(search.trim()), 'i'))),
			[ids, search, data]
		);

		return (
			<Section as={HalfContainer}>
				<SectionHeader as={ActionsContainer}>
					<Text type='normal'>{description}</Text>
					{tooltipText && (
						<InfoTooltip
							css={`
								color: ${theme.textColor};
							`}
							labelTooltip={tooltipText}
							fontSize='18px'
						/>
					)}
					<MenuButton
						className='secondary-btn-icon'
						menuItems={
							<>
								<MappedFilter activeId={filterMapped} onChange={toggleFilterMapped} />
								{(hasRecommended || hasRequired) && <Divider />}
								{hasRecommended && (
									<ListItemControl
										primaryAction={
											<Checkbox
												label='Recommended Only'
												id='recommended'
												value={filterRecommended}
												onChange={setRecommended}
											/>
										}
									/>
								)}
								{hasRequired && (
									<ListItemControl
										primaryAction={
											<Checkbox
												label='Required Only'
												id='required'
												value={filterRequired}
												onChange={setRequired}
											/>
										}
									/>
								)}
							</>
						}
						faIcon={faFilter}
						secondary
					/>
					<DebouncedSearchInput
						onChange={setSearch}
						placeholder='Search fields'
						type='text'
						fullWidth={false}
					/>
				</SectionHeader>

				<SectionContent as={ScrollSection}>
					<ItemsContainer
						filterRequired={filterRequired}
						filterRecommended={filterRecommended}
						filterMapped={filterMapped === 'mapped'}
						filterNoMapped={filterMapped === 'not_mapped'}
					>
						{filteredIds.map((id) => {
							const mappedHeader = otherData[data[id]?.mappedHeader]?.label;
							return (
								<DnDBox
									key={id}
									data={id}
									header={data[id]?.label}
									mappedHeader={mappedHeader}
									type={type}
									required={data[id]?.required}
									recommended={data[id]?.recommended}
									accept={accept}
									onDrop={onDrop}
									headerActions={[
										...(data[id]?.note
											? [
													// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
													<InfoTooltip
														css={`
															color: ${theme.textColor};
														`}
														labelTooltip={data[id]?.note}
														fontSize='18px'
													/>,
											  ]
											: []),
										...(mappedHeader
											? [
													// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
													<MUITooltippedIconButton
														css={`
															// TODO: make some shared prop for error/warning color
															color: ${theme.warningColor};
														`}
														size='small'
														onClick={() => resetMapping(id)}
														labelTooltip='Undo mapping'
													>
														{faUndo}
													</MUITooltippedIconButton>,
											  ]
											: []),
									]}
								/>
							);
						})}
					</ItemsContainer>
				</SectionContent>
			</Section>
		);
	}
);
