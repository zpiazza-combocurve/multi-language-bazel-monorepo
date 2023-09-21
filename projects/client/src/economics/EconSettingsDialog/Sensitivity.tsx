import { faCopy, faEllipsisV, faExclamation, faPlus, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { memo, useCallback, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { Button, Checkbox, FontIcon, MenuButton, Paper, SelectField, TextField } from '@/components';
import { useDialog } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';
import { hasNonWhitespace } from '@/helpers/text';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

import { EconSettingsSaveAsDialog } from './EconSettingsSaveAsDialog';
import { ActionsContainer } from './shared';

const FullSizePaper = styled(Paper)`
	width: 100%;
	height: 100%;
`;

const StyledPaper = styled(FullSizePaper)`
	padding: 0 1.5rem;
	display: flex;
	align-items: center;
`;

const Table = styled.div<{ itemCount: number }>`
	display: grid;
	overflow: auto;
	align-content: start;
	${({ itemCount }) => css`
		grid-template-columns: repeat(${itemCount}, max-content);
	`}
`;

const GridElementContainer = styled.div`
	padding: 1rem;
	display: flex;
	align-items: center;
`;

const GridHeaderElementContainer = styled(GridElementContainer)`
	padding-left: 2.5rem;
	border-bottom: 1px solid ${theme.primaryColor};
`;

const GridNameContainer = styled(GridElementContainer)<{ strong?: boolean }>`
	background: ${theme.background};
	z-index: 10;
	position: sticky;
	left: 0;
	${({ strong }) =>
		strong &&
		css`
			z-index: 11;
		`}
`;

const GridHeaderNameContainer = styled(GridNameContainer)`
	border-bottom: 1px solid ${theme.primaryColor};
`;

const SpacedTextField = styled(TextField)`
	margin-left: 0.5rem;
	margin-right: 0.5rem;
`;

const ROW_LIMIT = 10;

const QualifierMenu = memo<{
	changeCombos;
	qualifier;
	qualifierKey;
	qualifiersOptions;
	index;
	qualifiers;
	placeholder;
}>(({ changeCombos, qualifier, qualifierKey, qualifiersOptions, index, qualifiers, ...props }) => {
	const menuItems = qualifiersOptions[qualifierKey];
	const onChange = (newValue) => {
		const qualifierOption = menuItems.find(({ value }) => newValue === value);
		const newQualifier = { key: qualifierOption.value, name: qualifierOption.label };
		changeCombos((combos) => {
			const newCombos = [...combos];
			const newQualifiers = {
				...qualifiers,
				[qualifierKey]: newQualifier,
			};
			newCombos[index] = {
				...newCombos[index],
				qualifiers: newQualifiers,
			};
			return newCombos;
		});
	};

	return (
		<GridElementContainer>
			{menuItems?.length > 1 ? (
				<FullSizePaper>
					<SelectField
						fullWidth
						position={SelectField.Positions.BELOW}
						onChange={onChange}
						simplifiedMenu={false}
						menuItems={menuItems}
						value={qualifier?.key}
						{...props}
					/>
				</FullSizePaper>
			) : (
				<StyledPaper>{qualifier?.name}</StyledPaper>
			)}
		</GridElementContainer>
	);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const Combo = memo<any>(
	({
		isMenuVisible,
		invalid,
		name,
		qualifiers,
		selected,
		disabled,
		index,
		canAdd,
		canRemove,
		qualifiersOptions,
		changeVisivility,
		changeCombos,
	}) => {
		const toggle = () => {
			changeCombos((combos) => {
				const newCombos = [...combos];
				newCombos[index] = {
					...newCombos[index],
					selected: !selected,
				};
				return newCombos;
			});
		};

		const onNameChange = (value) => {
			changeCombos((combos) => {
				const newCombos = [...combos];
				newCombos[index] = { ...newCombos[index], name: value };
				return newCombos;
			});
		};

		const copyCombo = () => {
			changeCombos((combos) => {
				const newCombo = { ...combos[index] };
				newCombo.name += ' (Copy)';
				return [...combos, newCombo];
			});
		};

		const deleteCombo = () => {
			changeCombos((combos) => combos.filter((_combo, comboIndex) => comboIndex !== index));
		};

		return (
			<>
				<GridNameContainer strong={isMenuVisible}>
					{invalid ? (
						<FontIcon
							style={{ width: '62px', paddingLeft: '12px', paddingRight: '12px' }} // override inline styles
							warning
							title='Duplicated name or qualifiers'
						>
							{faExclamation}
						</FontIcon>
					) : (
						<Checkbox disabled={disabled} checked={selected} onChange={toggle} />
					)}
					<SpacedTextField
						label={null}
						placeholder='Name'
						type='text'
						error={!name || !hasNonWhitespace(name)}
						name={`name-${index}`}
						onChange={onNameChange}
						value={name}
					/>
					<MenuButton
						onVisibilityChange={(visible) => changeVisivility(index, visible)}
						id={`menu-${index}`}
						faIcon={faEllipsisV}
						menuItems={[
							{
								primaryText: 'Duplicate',
								disabled: !canAdd,
								onClick: copyCombo,
								rightIcon: <FontIcon>{faCopy}</FontIcon>,
							},
							{
								primaryText: 'Delete',
								disabled: !canRemove,
								onClick: deleteCombo,
								rightIcon: (
									<FontIcon disabled={!canRemove} warning>
										{faTrash}
									</FontIcon>
								),
							},
						]}
					/>
				</GridNameContainer>
				{Object.keys(QUALIFIER_FIELDS).map((qualifierKey) => (
					<QualifierMenu
						changeCombos={changeCombos}
						key={qualifierKey}
						qualifierKey={qualifierKey}
						qualifier={qualifiers[qualifierKey]}
						qualifiers={qualifiers}
						qualifiersOptions={qualifiersOptions}
						placeholder={QUALIFIER_FIELDS[qualifierKey]}
						index={index}
					/>
				))}
			</>
		);
	}
);

export function Sensitivity({ combos, changeCombos, qualifiersOptions, canDeselect }) {
	const canAdd = combos?.length < ROW_LIMIT;

	const allSelected = combos?.every(({ selected, invalid }) => selected || invalid);

	const toggleAll = () => {
		changeCombos((prevCombos) =>
			prevCombos.map((combo) => {
				const { invalid } = combo;
				return {
					...combo,
					selected: !allSelected && !invalid,
				};
			})
		);
	};

	const [visibleMenuIndex, setVisibleMenuIndex] = useState(null);

	const changeVisivility = useCallback(
		(index, visible) => {
			if (visible) {
				setVisibleMenuIndex(index);
			} else if (visibleMenuIndex === index) {
				setVisibleMenuIndex(null);
			}
		},
		[visibleMenuIndex]
	);

	return (
		<Section>
			<SectionContent as={Table} itemCount={Object.keys(QUALIFIER_FIELDS).length + 1}>
				<GridHeaderNameContainer>
					<Checkbox checked={allSelected} onChange={toggleAll} />
					<span style={{ marginLeft: '0.5rem' }}>Name</span>
				</GridHeaderNameContainer>
				{Object.keys(QUALIFIER_FIELDS).map((qualifierKey) => {
					return (
						<GridHeaderElementContainer key={qualifierKey}>
							{QUALIFIER_FIELDS[qualifierKey]}
						</GridHeaderElementContainer>
					);
				})}
				{combos?.map(({ disabled, selected, ...props }, index) => (
					<Combo
						key={index}
						{...props}
						index={index}
						changeCombos={changeCombos}
						isMenuVisible={index === visibleMenuIndex}
						canRemove={combos?.length > 1}
						canAdd={canAdd}
						qualifiersOptions={qualifiersOptions}
						changeVisivility={changeVisivility}
						disabled={disabled || (selected && !canDeselect)}
						selected={selected}
					/>
				))}
			</SectionContent>
		</Section>
	);
}

export function EconSettingsCombos({
	comboSettingNames,
	create,
	currentSetting,
	handleReset,
	update,
	loading,
	defaultComboQualifiers,
	qualifiersOptions,
	canDeselect,
	changeCombos,
	maxCombos,
}) {
	const [econSettingsSaveAsDialog, promptSaveAsDialog] = useDialog(EconSettingsSaveAsDialog);

	const ref = useRef();

	const onSaveAs = async () => {
		const result = await promptSaveAsDialog({
			initialName: currentSetting.name,
			invalidNames: comboSettingNames,
			renderNode: ref.current, // default renderNode is document.body, which conlficts inside fullpage dialogs
			disableScrollLocking: true, // https://react-md.dev/v1/components/dialogs?tab=1#dialog-container-proptypes-disable-scroll-locking
		});
		if (!result) {
			return;
		}
		create(result);
	};

	const handleAdd = () => {
		changeCombos((prevCombos) => [
			...prevCombos,
			{ name: `Default ${prevCombos?.length + 1}`, qualifiers: defaultComboQualifiers, selected: true },
		]);
	};

	return (
		<Section ref={ref}>
			{econSettingsSaveAsDialog}
			<SectionHeader as={ActionsContainer}>
				<Button raised disabled={loading} onClick={handleReset} transform>
					Reset
				</Button>
				<Button
					raised
					disabled={
						loading ||
						!currentSetting?._id ||
						currentSetting.combos.some((c) => !c.name.length || !hasNonWhitespace(c.name))
					}
					onClick={update}
					transform
				>
					Save
				</Button>
				<Button
					raised
					disabled={loading || currentSetting.combos.some((c) => !c.name.length || !hasNonWhitespace(c.name))}
					onClick={onSaveAs}
					transform
				>
					Save As
				</Button>

				<Button
					raised
					disabled={currentSetting?.combos?.length >= Math.min(maxCombos ?? ROW_LIMIT, ROW_LIMIT)}
					onClick={handleAdd}
					transform
					faIcon={faPlus}
				>
					New Combo
				</Button>
			</SectionHeader>
			<SectionContent>
				<Sensitivity
					changeCombos={changeCombos}
					combos={currentSetting?.combos}
					canDeselect={canDeselect}
					qualifiersOptions={qualifiersOptions}
				/>
			</SectionContent>
		</Section>
	);
}
