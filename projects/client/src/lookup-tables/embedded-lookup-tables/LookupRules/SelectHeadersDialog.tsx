import { faGripVertical, faPlus, faTimes, faTrashAlt } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { isEqual, omit } from 'lodash';
import { useMemo, useState } from 'react';

import { Sortable } from '@/components/Sortable';
import ColoredCircle from '@/components/misc/ColoredCircle';
import {
	Autocomplete,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Icon,
	IconButton,
	Typography,
} from '@/components/v2';
import { WellHeaderInfo } from '@/create-wells/models';
import { DialogProps } from '@/helpers/dialog';
import { FieldType } from '@/inpt-shared/constants';
import {
	RuleWellHeaderMatchBehavior,
	RuleWellHeaderMatchBehaviorLabel,
} from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import styles from '../elt.module.scss';

const MAXIMUM_HEADERS = 5;
const behaviorMenuItems = Object.keys(RuleWellHeaderMatchBehavior);

type HeaderRowProps = {
	header: string;
	behavior: RuleWellHeaderMatchBehavior;
	selectedHeaders: string[];
	allHeaders: Record<string, WellHeaderInfo>;
	allHeaderOptions: { value: string; label: string; isPCH: boolean }[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dragRef: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dropRef: any;
	onChangeHeader: (newKey: string, prevKey: string) => void;
	onChangeBehavior: (header: string, behavior: RuleWellHeaderMatchBehavior) => void;
	onRemoveHeader: () => void;
};

const HeaderRow = ({
	header,
	behavior,
	selectedHeaders,
	allHeaders,
	allHeaderOptions,
	dragRef,
	dropRef,
	onChangeHeader,
	onChangeBehavior,
	onRemoveHeader,
}: HeaderRowProps) => {
	const options = useMemo(
		() => allHeaderOptions.filter((x) => !selectedHeaders.includes(x.value) || x.value === header),
		[allHeaderOptions, selectedHeaders, header]
	);

	const headerMenuItems = useMemo(() => options?.map((o) => o.value) ?? [], [options]);

	return (
		<div ref={dropRef} className={styles['header-row']}>
			<div className={styles['justified-content']}>
				{dragRef && (
					<IconButton ref={dragRef} className={styles.drag} size='small'>
						{faGripVertical}
					</IconButton>
				)}
				<Autocomplete
					label='Select Header'
					className={styles['select-header']}
					options={headerMenuItems}
					value={header}
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					getOptionLabel={(val) => options.find((o) => o.value === val)!.label}
					renderOption={(menuItem) => {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						const option = options.find((o) => o.value === menuItem)!;
						return (
							<>
								{option.isPCH ? <ColoredCircle $color={projectCustomHeaderColor} /> : null}
								{option.label}
							</>
						);
					}}
					onChange={(_, newValue) => onChangeHeader(newValue, header)}
					variant='outlined'
					disableClearable
				/>
				<Autocomplete
					label='Behavior'
					className={styles['select-behavior']}
					options={behaviorMenuItems}
					disabled={
						allHeaders[header].type !== FieldType.number && allHeaders[header].type !== FieldType.percent
					}
					value={behavior}
					getOptionLabel={(val) => RuleWellHeaderMatchBehaviorLabel[val]?.(allHeaders[header].type)}
					onChange={(_, newValue) => onChangeBehavior(header, newValue)}
					variant='outlined'
					disableClearable
				/>
			</div>
			<IconButton css='padding: 0 10px;' size='small' onClick={onRemoveHeader}>
				{faTrashAlt}
			</IconButton>
		</div>
	);
};

type SelectHeadersDialogProps = DialogProps<{
	newHeaders: string[];
	newBehavior: Record<string, RuleWellHeaderMatchBehavior>;
}> & {
	allHeaders: Record<string, WellHeaderInfo>;
	initialHeaders: string[];
	initialHeadersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>;
};

const SelectHeadersDialog = ({
	onHide,
	visible,
	resolve,
	allHeaders,
	initialHeaders,
	initialHeadersMatchBehavior,
}: SelectHeadersDialogProps) => {
	const [headers, setHeaders] = useState([...initialHeaders]);
	const [headersMatchBehavior, setHeadersMatchBehavior] = useState({ ...initialHeadersMatchBehavior });

	const allHeaderOptions = useMemo(
		() =>
			Object.entries(allHeaders)
				.map(([key, data]) => ({ value: key, label: data.label, isPCH: data.isPCH }))
				.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0)),
		[allHeaders]
	);

	const onAddHeader = () => {
		if (headers.length < MAXIMUM_HEADERS) {
			const header = allHeaderOptions.find((x) => !headers.includes(x.value))?.value;

			if (header) {
				setHeaders([...headers, header]);
				setHeadersMatchBehavior({ ...headersMatchBehavior, [header]: RuleWellHeaderMatchBehavior.regular });
			}
		}
	};

	const onRemoveHeader = (key: string) => {
		setHeaders(headers.filter((x) => x !== key));
		setHeadersMatchBehavior(omit(headersMatchBehavior, [key]));
	};

	const onSort = (sortedHeaders: string[]) => {
		setHeaders([...sortedHeaders]);
	};

	const onSelectHeader = (newKey: string, prevKey: string) => {
		setHeaders(headers.map((key) => (key === prevKey ? newKey : key)));
		setHeadersMatchBehavior({
			...omit(headersMatchBehavior, [prevKey]),
			[newKey]: RuleWellHeaderMatchBehavior.regular,
		});
	};

	const onSelectBehavior = (header: string, behavior: RuleWellHeaderMatchBehavior) => {
		const newBehavior = { ...headersMatchBehavior, [header]: behavior };

		if (behavior === RuleWellHeaderMatchBehavior.ratio || behavior === RuleWellHeaderMatchBehavior.interpolation) {
			//only 1 interpolation or 1 ratio numerical header type behavior is allowed within the conditions
			Object.entries(newBehavior).forEach(([key, currBehavior]) => {
				if (
					header !== key &&
					(currBehavior === RuleWellHeaderMatchBehavior.ratio ||
						currBehavior === RuleWellHeaderMatchBehavior.interpolation)
				) {
					newBehavior[key] = RuleWellHeaderMatchBehavior.regular;
				}
			});
		}

		setHeadersMatchBehavior(newBehavior);
	};

	return (
		<Dialog className={styles['select-headers-dialog']} onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle disableTypography className={styles['select-headers-dialog-title']}>
				<Typography>Select Headers</Typography>
				<IconButton size='small' onClick={onHide}>
					{faTimes}
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Typography className={styles['thin-font']}>Choose up to {MAXIMUM_HEADERS} headers</Typography>
				<div className={classNames(styles['header-row'], styles['header-row-desc'])}>
					<div className={styles['justified-content']}>
						<Icon css='padding: 0 12px; margin-right: 1rem;'>{faGripVertical}</Icon>
						<Typography className={styles['thin-font']}>Headers</Typography>
					</div>
					<Typography className={styles['thin-font']}>Delete</Typography>
				</div>
				<Divider orientation='horizontal' />
				<Sortable
					dontWrapItems
					items={headers}
					onSort={onSort}
					renderItem={({ item: key, dragRef, dropRef }) => (
						<HeaderRow
							key={key}
							header={key}
							behavior={headersMatchBehavior[key]}
							dragRef={dragRef}
							dropRef={dropRef}
							selectedHeaders={headers}
							allHeaders={allHeaders}
							allHeaderOptions={allHeaderOptions}
							onChangeHeader={onSelectHeader}
							onChangeBehavior={onSelectBehavior}
							onRemoveHeader={() => onRemoveHeader(key)}
						/>
					)}
				/>
			</DialogContent>
			<DialogActions className={styles['select-headers-dialog-actions']}>
				<Button
					color='secondary'
					startIcon={faPlus}
					variant='outlined'
					onClick={onAddHeader}
					disabled={
						(headers.length >= MAXIMUM_HEADERS && `Maximum ${MAXIMUM_HEADERS} headers can be chosen`) ||
						(headers.length >= allHeaderOptions.length && 'No more headers available.')
					}
				>
					Header
				</Button>
				<div>
					<Button color='secondary' onClick={onHide} css='margin-right: 1rem;'>
						Cancel
					</Button>
					<Button
						color='secondary'
						variant='contained'
						disabled={
							isEqual(initialHeaders, headers) &&
							isEqual(initialHeadersMatchBehavior, headersMatchBehavior)
						}
						onClick={() => resolve({ newHeaders: headers, newBehavior: headersMatchBehavior })}
					>
						Save
					</Button>
				</div>
			</DialogActions>
		</Dialog>
	);
};

export default SelectHeadersDialog;
