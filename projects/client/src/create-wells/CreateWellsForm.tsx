import { faTrashAlt, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { useMemo, useState } from 'react';

import { ButtonItem, Divider, IconButton, MenuButton, TextField, Typography } from '@/components/v2';
import SelectedHeadersList from '@/create-wells/SelectHeaders/SelectedHeadersList';

import ManageTemplatesDialog from './ManageTemplatesDialog';
import styles from './create-wells.module.scss';
import { CreateGenericWellsModel, WellHeaderInfo, WellHeaderValue } from './models';
import { textFieldCSS } from './shared';

type CreateWellsFormProps = {
	model: CreateGenericWellsModel;
	wellHeadersDict: Record<string, WellHeaderInfo>;
	onChangeFixedHeaderValue: (key: string, value: string | number) => void;
	onChangeHeaderValue: (key: string, value: WellHeaderValue) => void;
	onRemoveHeader: (key: string | undefined) => void;
	searchHeader: React.ReactNode;
	templates: CreateGenericWellsModel[] | undefined;
	onApplyTemplate: (template: CreateGenericWellsModel) => void;
	onSaveTemplate: () => Promise<void>;
	onDeleteTemplate: (template: CreateGenericWellsModel) => void;
	onToggleDefaultFlag: (template: CreateGenericWellsModel) => void;
	errors: Record<string, string>;
};

const CreateWellsForm = ({
	model,
	wellHeadersDict,
	onChangeHeaderValue,
	onChangeFixedHeaderValue,
	onRemoveHeader,
	searchHeader,
	templates,
	onApplyTemplate,
	onSaveTemplate,
	onDeleteTemplate,
	onToggleDefaultFlag,
	errors,
}: CreateWellsFormProps) => {
	const onChangeFixed = (e) => {
		onChangeFixedHeaderValue(e.target.name, e.target.value);
	};

	const [manageTemplatesVisible, setManageTemplatesVisible] = useState(false);

	const manageTemplatesDialog = useMemo(
		() => (
			<ManageTemplatesDialog
				visible={manageTemplatesVisible}
				onClose={() => setManageTemplatesVisible(false)}
				templates={templates}
				onDelete={onDeleteTemplate}
				onToggleDefaultFlag={onToggleDefaultFlag}
			/>
		),
		[manageTemplatesVisible, onDeleteTemplate, onToggleDefaultFlag, templates]
	);

	const requiredFieldsFilled = model.wellNamePrefix && model.wellsPerPad && model.numOfWells;

	return (
		<div className={styles['create-wells-form']}>
			{manageTemplatesDialog}
			<div className={styles['inputs-block']}>
				<div className={styles.header}>
					<Typography className={styles['header-title']}>Wells</Typography>
					<MenuButton
						className={styles['templates-menu']}
						label={<IconButton size='small'>{faUserCog}</IconButton>}
					>
						{[
							{
								primaryText: 'Save Current Configuration',
								onClick: onSaveTemplate,
								disabled: !requiredFieldsFilled,
							},
							{ primaryText: 'Manage Configurations', onClick: () => setManageTemplatesVisible(true) },
							{ divider: true },
							...(templates?.length
								? templates.map((t) => ({
										primaryText: t.name,
										onClick: () => onApplyTemplate(t),
										children: onDeleteTemplate && (
											<IconButton
												onClick={(e) => {
													e.stopPropagation();
													onDeleteTemplate(t);
												}}
											>
												{faTrashAlt}
											</IconButton>
										),
								  }))
								: [{ primaryText: 'No Saved Configurations', disabled: true }]),
							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						].map(({ divider, disabled, children, onClick, primaryText }: any, i) =>
							divider ? (
								<Divider key={i.toString()} />
							) : (
								<ButtonItem
									label={primaryText}
									secondaryAction={children}
									key={primaryText}
									onClick={onClick}
									disabled={disabled}
								/>
							)
						)}
					</MenuButton>
				</div>
				<div className={styles.inputs}>
					<TextField
						name='wellNamePrefix'
						label='Well Name Prefix *'
						error={!!errors.wellNamePrefix}
						helperText={errors.wellNamePrefix}
						value={model.wellNamePrefix}
						onChange={onChangeFixed}
						variant='outlined'
						fullWidth
						css={`
							margin-right: 24px;
							${textFieldCSS}
						`}
					/>
					<TextField
						type='number'
						name='numOfWells'
						label='Number of Wells *'
						error={!!errors.numOfWells}
						helperText={errors.numOfWells}
						value={model.numOfWells}
						onChange={onChangeFixed}
						variant='outlined'
						fullWidth
						css={`
							margin-right: 24px;
							${textFieldCSS}
						`}
					/>
					<TextField
						type='number'
						name='wellsPerPad'
						label='Wells Per Pad *'
						error={!!errors.wellsPerPad}
						helperText={errors.wellsPerPad}
						value={model.wellsPerPad}
						onChange={onChangeFixed}
						variant='outlined'
						fullWidth
						css={textFieldCSS}
					/>
				</div>
				<Divider className={styles.divider} orientation='horizontal' />
			</div>
			<div className={styles['inputs-block']}>
				<div className={styles.header}>
					<Typography className={styles['header-title']}>Select Well Headers</Typography>
				</div>
				<div className={styles.inputs}>{searchHeader}</div>
				<Divider className={styles.divider} orientation='horizontal' />
			</div>
			<SelectedHeadersList
				wellHeadersDict={wellHeadersDict}
				headers={model.headers}
				onChangeHeaderValue={onChangeHeaderValue}
				onRemoveHeader={onRemoveHeader}
				errors={errors}
			/>
			<Divider orientation='horizontal' />
		</div>
	);
};

export default CreateWellsForm;
