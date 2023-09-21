import { faCopy, faPlus, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classnames from 'classnames';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip } from 'react-md';
import styled, { css } from 'styled-components';

import { Button } from '@/components';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	List,
	ListItem,
	ListItemText,
	TextField,
	alerts,
} from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { genericErrorAlert, withProgress } from '@/helpers/alerts';
import { deleteApi, getApi, postApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

import sassVars from '../global-styles/vars.scss?inline';
import { generateDefaultName } from './helpers';

const MAX_QUALIFIERS_PER_COLUMN = 20;
const NAME_MAX_LENGTH = 16;

const columnOptions = Object.keys(QUALIFIER_FIELDS).map((key) => ({
	value: key,
	label: QUALIFIER_FIELDS[key],
}));

const QualifierDialog = styled(Dialog)`
	& .MuiDialogContent-root > :not(:first-child) {
		margin-top: 1rem;
	}
`;

const ActionBar = styled.div`
	display: flex;
	align-items: center;
	padding: 0 1rem;

	& > :first-child {
		flex-grow: 1;
	}

	& > :not(:first-child) {
		margin-left: 0.5rem;
		flex-shrink: 0;
	}
`;

const BUTTON_SIZE = '40px';

const PlusButton = styled(Button).attrs({
	children: <FontAwesomeIcon icon={faPlus} />,
	className: 'floating-btn-small',
	floating: true,
	primary: true,
})`
	min-width: ${BUTTON_SIZE};
	max-width: ${BUTTON_SIZE};
	min-height: ${BUTTON_SIZE};
	max-height: ${BUTTON_SIZE};
`;

const warnStyle = css`
	background-color: ${sassVars.orange};

	&,
	& > :first-child {
		color: ${sassVars.light};
	}
`;

const CenteredChip = styled(Chip)`
	justify-content: center;
	${(props) => props.warn && warnStyle}
`;

const QualifierList = styled(List)`
	overflow-y: auto;
	flex-grow: 1;

	.qualifier-primary-text {
		cursor: text;
		padding-bottom: 5px;

		&--editing {
			padding-bottom: 0;
		}
	}
`;

const ItemActions = styled.div`
	display: flex;
	align-items: center;
	padding: 0.5rem;

	& > :not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const NameField = styled(TextField)`
	input {
		margin-top: 0;
	}

	hr.md-divider {
		margin-bottom: 0 !important;
	}

	${(props) =>
		props.editing &&
		css`
			input {
				margin-bottom: -8px;
			}
		`}
`;

const ListItemDivider = styled(Divider)`
	width: 2px;
`;

const useQualifiers = (scenarioId, column) => {
	const [qualifiers, setQualifiers] = useState(null);

	useEffect(() => {
		const fetch = async () => {
			try {
				const response = await getApi(`/scenarios/${scenarioId}/getQualifiers?column=${column}`);
				setQualifiers(response);
			} catch (error) {
				genericErrorAlert(error);
			}
		};
		fetch();
	}, [scenarioId, column]);

	return [qualifiers, setQualifiers];
};

const getSecondaryText = (qualifier) => {
	const { createdAt, createdByName } = qualifier;

	const second = createdAt && new Date(createdAt).toLocaleDateString();

	if (!second) {
		return createdByName ? `Created by ${createdByName}` : '';
	}
	const first = `Created by ${createdByName || 'N/A'}`;
	return `${first} @ ${second}`;
};

function QualifierName({ editing, name, onCancel, onRename, className, existingQualifierNames, qualifier }) {
	const [value, setValue] = useState(name);
	const existingQualifierName = existingQualifierNames.find((q) => q.name === value);

	const error = useMemo(() => {
		// Don't show when first editing qualifier
		if (existingQualifierName) {
			if (existingQualifierName.key && existingQualifierName.key !== qualifier.key) {
				return 'Qualifier with that name already exists';
			}
		}
		if (!value || !hasNonWhitespace(value)) {
			return 'Name is required';
		}
		if (value.length > NAME_MAX_LENGTH) {
			return 'Name is too long';
		}
		return '';
	}, [value, qualifier, existingQualifierName]);

	const setInputRef = useCallback((el) => {
		if (el) {
			el.focus();
		}
	}, []);

	const handleInputKey = useCallback(
		(event) => {
			if (event.key === 'Enter' && !error) {
				if (value === name) {
					setValue(name);
					onCancel();
				} else {
					onRename(value);
				}
			}
			event.stopPropagation();
		},
		[onCancel, onRename, value, name, error]
	);

	const handleBlur = useCallback(() => {
		if (!error && value !== name) {
			onRename(value);
			return;
		}
		setValue(name);
		onCancel();
	}, [setValue, name, value, onCancel, onRename, error]);

	const handleChange = useCallback(
		(event) => {
			setValue(event.target.value);
		},
		[setValue]
	);

	const handleClick = useCallback((event) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);

	return (
		<span className={className}>
			{editing ? (
				<NameField
					id='qualifier-name-field'
					inputRef={setInputRef}
					inputProps={{
						onBlur: handleBlur,
						onChange: handleChange,
						onClick: handleClick,
						onKeyDown: handleInputKey,
					}}
					type='text'
					value={value}
					error={!!error}
					helperText={error}
				/>
			) : (
				name
			)}
		</span>
	);
}

function QualifierItem({ canCopy, editing, onCopy, onDelete, onEdit, onRename, qualifier, existingQualifiers }) {
	const { key, name } = qualifier;

	const handleDelete = useCallback(() => onDelete(key), [onDelete, key]);
	const handleRename = useCallback((newName) => onRename(key, newName), [onRename, key]);
	const handleCopy = useCallback(() => onCopy(key), [onCopy, key]);
	const handleClick = useCallback(() => {
		if (!editing) {
			onEdit(key);
		}
	}, [onEdit, key, editing]);
	const handleCancel = useCallback(() => onEdit(null), [onEdit]);

	return (
		<ListItem onClick={handleClick} renderChildrenOutside>
			<ListItemText
				primary={
					<QualifierName
						editing={editing}
						name={name}
						onCancel={handleCancel}
						onRename={handleRename}
						className={classnames('qualifier-primary-text', { 'qualifier-primary-text--editing': editing })}
						existingQualifierNames={existingQualifiers}
						qualifier={qualifier}
					/>
				}
				secondary={getSecondaryText(qualifier)}
			/>
			<ListItemDivider flexItem dir='vertical' />
			<ItemActions>
				<Button disabled={!canCopy} onClick={handleCopy} icon>
					<FontAwesomeIcon className='md-text' icon={faCopy} />
				</Button>
				<Button className='warn-btn-icon' disabled={false} onClick={handleDelete} icon>
					<FontAwesomeIcon className='warn-icon' icon={faTrash} />
				</Button>
			</ItemActions>
		</ListItem>
	);
}

function QualifierManageDialog({ resolve, initialColumn, onHide, scenarioId, updateScenario, visible }) {
	const [column, setColumn] = useState(initialColumn);
	const [editingKey, setEditingKey] = useState(null);
	const [isUpdating, setIsUpdating] = useState(false);

	const [qualifiers, setQualifiers] = useQualifiers(scenarioId, column);

	const canCreate = qualifiers?.length < MAX_QUALIFIERS_PER_COLUMN;

	const handleChangeColumn = useCallback((ev) => setColumn(ev.target.value), [setColumn]);

	const handleCreate = useCallback(() => {
		setIsUpdating(true);

		const name = generateDefaultName(column, qualifiers);
		withProgress(
			postApi(`/scenarios/${scenarioId}/createQualifier`, { column, name }).then((response) => {
				const { qualifier: created, scenario } = response;
				setQualifiers([...qualifiers, created]);
				setEditingKey(created.key);
				updateScenario({ columns: scenario.columns });
				setIsUpdating(false);
			}),
			'Qualifier created successfully'
		);
	}, [column, qualifiers, scenarioId, setQualifiers, updateScenario]);

	const handleDelete = (key) => {
		alerts
			.confirm({
				confirmColor: 'error',
				confirmText: 'Delete',
				children: 'This action can not be undone',
				title: 'Are you sure you want to delete this qualifier?',
			})
			.then((confirmed) => {
				if (!confirmed) {
					return;
				}
				withProgress(
					deleteApi(`/scenarios/${scenarioId}/deleteQualifier`, { column, key }).then((response) => {
						const { scenario } = response;
						setQualifiers(qualifiers.filter((q) => q.key !== key));
						updateScenario({ columns: scenario.columns });
					}),
					'Qualifier deleted successfully'
				);
			});
	};

	const handleRename = useCallback(
		(key, name) => {
			setEditingKey(null);
			withProgress(
				postApi(`/scenarios/${scenarioId}/renameQualifier`, { column, key, name }).then((response) => {
					const { scenario } = response;
					setQualifiers(qualifiers.map((q) => (q.key === key ? { ...q, name } : q)));
					updateScenario({ columns: scenario.columns });
				}),
				'Qualifier renamed successfully'
			);
		},
		[column, scenarioId, setQualifiers, qualifiers, updateScenario]
	);

	const handleCopy = useCallback(
		async (key) => {
			const name = generateDefaultName(column, qualifiers);
			await withProgress(
				postApi(`/scenarios/${scenarioId}/copyQualifier`, { column, key, name }).then(
					({ qualifier: created, scenario }) => {
						setQualifiers([...qualifiers, created]);
						setEditingKey(created.key);
						updateScenario({ columns: scenario.columns });
					}
				)
			);
		},
		[updateScenario, scenarioId, column, setQualifiers, qualifiers]
	);

	return (
		<QualifierDialog
			actions={
				<Button
					className='warn-btn-flat warn-bot-border unset-text-transform on-hover-paper-1'
					onClick={resolve}
					flat
					underlined
				>
					Close
				</Button>
			}
			onHide={onHide}
			open={visible}
			maxWidth='sm'
			fullWidth
		>
			<DialogTitle>Manage Qualifiers</DialogTitle>
			<DialogContent
				css={`
					min-height: 500px;
				`}
			>
				<ErrorBoundary>
					<ActionBar>
						<SelectField onChange={handleChangeColumn} value={column} menuItems={columnOptions} />
						<PlusButton disabled={!canCreate || isUpdating} onClick={handleCreate} />
					</ActionBar>
					<ActionBar>
						<CenteredChip
							label={
								qualifiers
									? `${qualifiers.length} of ${MAX_QUALIFIERS_PER_COLUMN} qualifiers used on this column`
									: 'Loading...'
							}
							warn={qualifiers?.length >= MAX_QUALIFIERS_PER_COLUMN}
						/>
					</ActionBar>
					<QualifierList>
						{qualifiers?.map((qualifier) => (
							<QualifierItem
								canCopy={canCreate}
								editing={qualifier.key === editingKey}
								key={`${qualifier.column}_${qualifier.key}`}
								onCopy={handleCopy}
								onDelete={handleDelete}
								onEdit={setEditingKey}
								onRename={handleRename}
								qualifier={qualifier}
								existingQualifiers={qualifiers}
							/>
						))}
					</QualifierList>
				</ErrorBoundary>
			</DialogContent>
			<DialogActions
				css={`
					justify-content: center;
				`}
			>
				<Button
					className='warn-btn-flat warn-bot-border unset-text-transform on-hover-paper-1'
					onClick={resolve}
					flat
					underlined
				>
					Close
				</Button>
			</DialogActions>
		</QualifierDialog>
	);
}

export default QualifierManageDialog;
