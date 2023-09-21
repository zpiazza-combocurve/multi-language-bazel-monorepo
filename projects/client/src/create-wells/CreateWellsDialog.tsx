import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as yup from 'yup';

import { SetNameDialog } from '@/components';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Tab,
	Tabs,
	Typography,
} from '@/components/v2';
import SearchHeadersMultiselect from '@/create-wells/SelectHeaders/SearchHeadersMultiselect';
import { genericErrorAlert, infoAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDebounce } from '@/helpers/debounce';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { NON_EDITABLE_HEADERS } from '@/helpers/headers';
import { useProjectHeadersQuery } from '@/helpers/project-custom-headers';
import { getObjectSchemaValidationErrors } from '@/helpers/yup-helpers';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';

import CreateWellsForm from './CreateWellsForm';
import CreateWellsPreview from './CreateWellsPreview';
import {
	createWells,
	deleteTemplate as deleteCreateWellsTemplate,
	saveTemplate,
	toggleDefaultFlag as toggleCreateWellsTemplate,
	useUserCreateWellsTemplates,
} from './api';
import styles from './create-wells.module.scss';
import { CreateGenericWellsModel, WellHeaderInfo, WellHeaderValue } from './models';
import { EXCLUDE_HEADERS, INPUT_CONTAINS_ERRORS_MESSAGE, getHeaderYupSchema, multiSelectCSS } from './shared';

const FORCE_INCLUDE_READONLY_WELL_HEADERS = ['well_name', 'pad_name'];

const FORCE_INCLUDE_WELL_HEADERS = [
	'first_fluid_per_perforated_interval',
	'first_proppant_per_perforated_interval',
	'surfaceLatitude',
	'surfaceLongitude',
].concat(FORCE_INCLUDE_READONLY_WELL_HEADERS);

const MAX_NUM_OF_WELLS = 10_000;

const TABS = {
	form: 'form',
	preview: 'preview',
};

type CreateWellsDialogProps = DialogProps<void> & { projectId?: Inpt.ObjectId<'project'> };

const getWellName = (prefix: string, i: number) => `${prefix}-${i + 1}`;
const getPadName = (prefix: string, wellsPerPad: number, i: number) =>
	`${prefix}-pad-${1 + Math.floor(i / wellsPerPad)}`;

const RequiredFieldsSchema = yup.object({
	wellNamePrefix: yup.string().required('This field is required').label('Well Name Prefix'),
	numOfWells: yup
		.number()
		.typeError('This field is required')
		.required()
		.min(1)
		.max(MAX_NUM_OF_WELLS)
		.integer()
		.label('Number of Wells'),
	wellsPerPad: yup
		.number()
		.typeError('This field is required')
		.required()
		.min(1)
		.max(200)
		.integer()
		.label('Wells Per Pad'),
});

const CreateWellsDialog = ({ onHide, visible, resolve, projectId = undefined }: CreateWellsDialogProps) => {
	const [tab, setTab] = useState(TABS.form);
	const { wellHeaders } = useAlfa();
	const projectCustomHeadersQuery = useProjectHeadersQuery(projectId);
	const templatesQuery = useUserCreateWellsTemplates(projectId);
	const [defaultChecked, setDefaultChecked] = useState(false);
	const [editingPreviewTable, setEditingPreviewTable] = useState(false);
	const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
	const [headersSchema, setHeadersSchema] = useState(yup.object({}));

	const [model, setModel] = useState<CreateGenericWellsModel>({
		name: '',
		default: false,
		headers: [],
		wellNamePrefix: 'Well',
		numOfWells: 1,
		wellsPerPad: 1,
	});

	const [previewTable, setPreviewTable] = useState<Record<string, WellHeaderValue>[]>([
		{
			well_name: getWellName(model.wellNamePrefix, 0),
			pad_name: getPadName(model.wellNamePrefix, model.wellsPerPad, 0),
		},
	]);

	const [saveTemplateDialog, promptSaveTemplateDialog] = useDialog(SetNameDialog);

	const { wellHeadersDict, wellHeadersDictExtended } = useMemo(() => {
		const wellHeadersDictExtended: Record<string, WellHeaderInfo> = {};

		Object.entries(wellHeaders).forEach(([key, label]) => {
			if (
				FORCE_INCLUDE_WELL_HEADERS.includes(key) ||
				(!EXCLUDE_HEADERS.includes(key) && !NON_EDITABLE_HEADERS.includes(key))
			) {
				wellHeadersDictExtended[key] = {
					label,
					type: WELL_HEADER_TYPES[key].type,
					isPCH: false,
					options: WELL_HEADER_TYPES[key].options?.map((o) => ({ label: o.value, value: o.label })), // label and value are swapped
					min: WELL_HEADER_TYPES[key].min,
					max: WELL_HEADER_TYPES[key].max,
				};
			}
		});

		if (projectCustomHeadersQuery.data) {
			Object.entries(projectCustomHeadersQuery.data.projectHeaders).forEach(([key, label]) => {
				wellHeadersDictExtended[key] = {
					label,
					type: projectCustomHeadersQuery.data.projectHeadersTypes[key].type,
					isPCH: true,
				};
			});
		}

		return {
			wellHeadersDict: _.omit(wellHeadersDictExtended, FORCE_INCLUDE_READONLY_WELL_HEADERS) as Record<
				string,
				WellHeaderInfo
			>,
			wellHeadersDictExtended,
		};
	}, [wellHeaders, projectCustomHeadersQuery.data]);

	const addHeader = useCallback(
		(key: string | undefined) => {
			if (!key) {
				return;
			}

			const value = wellHeadersDict[key].type === 'boolean' ? false : undefined;

			setModel(
				produce((draft) => {
					draft.headers.push({
						key,
						value,
					});
				})
			);

			setPreviewTable(
				produce((draft) => {
					draft.forEach((well) => {
						well[key] = value;
					});
				})
			);
		},
		[wellHeadersDict]
	);

	const removeHeader = useCallback((key: string | undefined) => {
		if (!key) {
			return;
		}

		setModel(
			produce((draft) => {
				draft.headers = draft.headers.filter((h) => h.key !== key);
			})
		);

		setPreviewTable(
			produce((draft) => {
				draft.forEach((well) => {
					delete well[key];
				});
			})
		);
	}, []);

	const onNumOfWellsChanged = useDebounce((template: CreateGenericWellsModel, numOfWells: number) => {
		const prototypes: Record<string, WellHeaderValue>[] = [];
		const prototype: Record<string, WellHeaderValue> = {};

		template.headers.forEach((h) => {
			prototype[h.key] = h.value;
		});

		const correctedNumOfWells = Math.min(MAX_NUM_OF_WELLS, numOfWells);

		for (let i = 0; i < correctedNumOfWells; ++i) {
			prototypes.push({
				well_name: getWellName(template.wellNamePrefix, i),
				pad_name: getPadName(template.wellNamePrefix, template.wellsPerPad, i),
				...prototype,
			});
		}

		setPreviewTable(prototypes);
	}, 200);

	const changeHeaderValue = useCallback((key: string, value: WellHeaderValue) => {
		setModel(
			produce((draft) => {
				const header = draft.headers.find((h) => h.key === key);

				if (header) {
					header.value = value;
				}
			})
		);

		setPreviewTable(
			produce((draft) => {
				draft.forEach((well) => {
					well[key] = value;
				});
			})
		);
	}, []);

	const changeFixedHeaderValue = useCallback(
		(key: string, value: string | number) => {
			setModel(
				produce((draft) => {
					draft[key] = value;
				})
			);

			switch (key) {
				case 'wellNamePrefix': {
					setPreviewTable(
						produce((draft) => {
							draft.forEach((well, i) => {
								well.well_name = getWellName(value as string, i);
								well.pad_name = getPadName(value as string, model.wellsPerPad, i);
							});
						})
					);

					break;
				}

				case 'wellsPerPad': {
					setPreviewTable(
						produce((draft) => {
							draft.forEach((well, i) => {
								well.pad_name = getPadName(model.wellNamePrefix, value as number, i);
							});
						})
					);

					break;
				}

				case 'numOfWells': {
					onNumOfWellsChanged(model, value as number);

					break;
				}

				default:
					break;
			}
		},
		[model, onNumOfWellsChanged]
	);

	const searchHeaderMultiselect = useMemo(() => {
		const selectedHeaders = model.headers.map((h) => h.key);

		return (
			<SearchHeadersMultiselect
				wellHeadersDict={wellHeadersDict}
				multiSelectCSS={multiSelectCSS}
				selectedHeaders={selectedHeaders}
				onAddHeader={addHeader}
				onRemoveHeader={removeHeader}
				disableClearable
				disableTags
			/>
		);
	}, [addHeader, model.headers, removeHeader, wellHeadersDict]);

	const applyTemplate = useCallback(
		(template: CreateGenericWellsModel) => {
			setModel(template);
			onNumOfWellsChanged(template, template.numOfWells);
		},
		[onNumOfWellsChanged]
	);

	const saveCurrentTemplate = useCallback(async () => {
		const name = await promptSaveTemplateDialog({ label: 'Configuration' });

		if (name) {
			setModel(await saveTemplate(projectId, { ...model, name: name as string }));
			infoAlert(`Configuration "${name}" successfully saved!`);
			templatesQuery.invalidate();
		}
	}, [model, projectId, promptSaveTemplateDialog, templatesQuery]);

	const deleteTemplate = useCallback(
		async (template: CreateGenericWellsModel) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			await deleteCreateWellsTemplate(projectId, template._id!);
			infoAlert(`Configuration "${template.name}" successfully deleted!`);
			templatesQuery.invalidate();
		},
		[projectId, templatesQuery]
	);

	const toggleDefaultFlag = useCallback(
		async (template: CreateGenericWellsModel) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			await toggleCreateWellsTemplate(projectId, template._id!);
			infoAlert(`Configuration "${template.name}" ${template.default ? 'unset' : 'set'} as default!`);
			templatesQuery.invalidate();
		},
		[projectId, templatesQuery]
	);

	useEffect(() => {
		if (templatesQuery.data && !defaultChecked) {
			const defaultTemplate = templatesQuery.data.find((t) => t.default);

			if (defaultTemplate) {
				applyTemplate(defaultTemplate);
			}

			setDefaultChecked(true);
		}
	}, [applyTemplate, defaultChecked, templatesQuery.data]);

	useEffect(() => {
		setHeadersSchema(
			yup.object(
				Object.keys(wellHeadersDict).reduce((acc, curr) => {
					acc[curr] = getHeaderYupSchema(wellHeadersDict, curr, false);
					return acc;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				}, {} as any)
			)
		);
	}, [wellHeadersDict]);

	useEffect(() => {
		const errors: Record<string, string> = {};
		const requiredFieldsErrors = getObjectSchemaValidationErrors(RequiredFieldsSchema, {
			wellNamePrefix: model.wellNamePrefix,
			numOfWells: model.numOfWells,
			wellsPerPad: model.wellsPerPad,
		});

		if (requiredFieldsErrors) {
			Object.entries(requiredFieldsErrors).forEach(([path, error]) => {
				errors[path] = error;
			});
		}

		const headersValues = model.headers.reduce((acc, curr) => {
			acc[curr.key] = curr.value;
			return acc;
		}, {} as Record<string, WellHeaderValue>);

		const headersErrors = getObjectSchemaValidationErrors(headersSchema, headersValues);

		if (headersErrors) {
			Object.entries(headersErrors).forEach(([path, error]) => {
				errors[path] = error;
			});
		}

		setInputErrors(errors);
	}, [model.numOfWells, model.wellNamePrefix, model.wellsPerPad, model.headers, headersSchema]);

	const inputHasErrors = Object.keys(inputErrors).length > 0;

	return (
		<Dialog className={styles['dialog-wrapper']} onClose={onHide} open={visible} fullWidth maxWidth='lg'>
			<DialogTitle disableTypography className={styles['dialog-title']}>
				<Typography>Create Generic Wells</Typography>
				<IconButton size='small' onClick={onHide}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<DialogContent css='padding: 0; height: 80vh;'>
				<Tabs
					value={tab}
					onChange={(_ev, newValue) => {
						if (newValue === TABS.preview && inputHasErrors) {
							return;
						}

						setTab(newValue);
					}}
				>
					<Tab value={TABS.form} label='Configure' />
					<Tab
						value={TABS.preview}
						disabled={inputHasErrors && INPUT_CONTAINS_ERRORS_MESSAGE}
						label='Review'
					/>
				</Tabs>
				<Divider orientation='horizontal' />
				{tab === TABS.form && templatesQuery.data && (
					<>
						{saveTemplateDialog}
						<CreateWellsForm
							model={model}
							wellHeadersDict={wellHeadersDict}
							onChangeFixedHeaderValue={changeFixedHeaderValue}
							onChangeHeaderValue={changeHeaderValue}
							onRemoveHeader={removeHeader}
							searchHeader={searchHeaderMultiselect}
							templates={templatesQuery.data}
							onApplyTemplate={applyTemplate}
							onSaveTemplate={saveCurrentTemplate}
							onDeleteTemplate={deleteTemplate}
							onToggleDefaultFlag={toggleDefaultFlag}
							errors={inputErrors}
						/>
					</>
				)}
				{tab === TABS.preview && (
					<CreateWellsPreview
						searchHeader={searchHeaderMultiselect}
						rowData={previewTable}
						wellHeadersDict={wellHeadersDictExtended}
						setRowData={setPreviewTable}
						setEditingForParent={setEditingPreviewTable}
					/>
				)}
			</DialogContent>
			<DialogActions
				css={`
					justify-content: ${tab === TABS.preview ? 'space-between' : 'flex-end'};
					padding: 0 24px 20px 24px;
				`}
			>
				{tab === TABS.preview && (
					<Button color='secondary' onClick={() => setTab(TABS.form)}>
						Back
					</Button>
				)}
				<div>
					<Button color='secondary' onClick={onHide} css='margin-right: 24px;'>
						Cancel
					</Button>
					<Button
						color='secondary'
						variant='contained'
						disabled={
							(inputHasErrors && INPUT_CONTAINS_ERRORS_MESSAGE) ||
							(tab === TABS.preview && editingPreviewTable && 'Please, save or discard the changes.')
						}
						onClick={async () => {
							if (tab === TABS.form) {
								setTab(TABS.preview);
							} else {
								try {
									await createWells(projectId, previewTable);
									resolve();
								} catch (err) {
									genericErrorAlert(err);
								}
							}
						}}
					>
						{tab === TABS.form ? 'Next' : 'Create'}
					</Button>
				</div>
			</DialogActions>
		</Dialog>
	);
};

export default CreateWellsDialog;
