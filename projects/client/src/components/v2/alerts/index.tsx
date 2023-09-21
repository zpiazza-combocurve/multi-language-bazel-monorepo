import { withDialog } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';

import { ButtonProps } from '../Button';
import GenericDialog from './GenericDialog';
import { snackbarFns } from './SnackbarHandler';

export const { closeSnackbar, enqueueSnackbar } = snackbarFns;

export const prompt = withDialog(GenericDialog);

export const confirm = ({
	children,
	helperText,
	confirmText = 'Confirm',
	confirmColor = 'primary',
	cancelText = 'Cancel',
	hideCancelButton = false,
	hideConfirmButton = false,
	confirmButtonProps,
	...props
}: Omit<Parameters<typeof prompt>[0], 'actions'> & {
	confirmText?: string;
	confirmColor?: ButtonProps['color'];
	cancelText?: string;
	helperText?: string;
	hideCancelButton?: boolean;
	hideConfirmButton?: boolean;
	confirmButtonProps?: Omit<ButtonProps, 'key' | 'value' | 'children'>;
}): Promise<boolean> =>
	prompt({
		...props,
		children: (
			<>
				{children}
				{helperText && (
					<>
						<br />
						<br />
						<span>{helperText}</span>
					</>
				)}
			</>
		),
		actions: [
			...(!hideCancelButton ? [{ value: false, children: cancelText }] : []),
			...(!hideConfirmButton
				? [{ value: true, children: confirmText, color: confirmColor, ...confirmButtonProps }]
				: []),
		],
	});

const getPerformanceWarningText = (module: string, threshold: number) =>
	`Performance may be impacted by exceeding the recommended ${module} well limit of ${numberWithCommas(threshold)}`;

// TODO remove duplication from helpers/alerts
export const confirmAddWells = (props: {
	module: string;
	wellsCount: number;
	wellsPerformanceThreshold?: number;
	includeCollections: boolean;
}) => {
	const { module, wellsCount, wellsPerformanceThreshold, includeCollections } = props;

	return confirm({
		title: `You are adding ${pluralize(
			wellsCount,
			includeCollections ? 'filtered item' : 'well',
			includeCollections ? 'filtered items' : 'wells'
		)} to this ${module}`,
		children:
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			Number.isFinite(wellsPerformanceThreshold) && getPerformanceWarningText(module, wellsPerformanceThreshold!),
		confirmText: 'Add',
	});
};

export const confirmRemoveWells = (props: {
	module: string;
	existingWells?: number;
	/** Wells to remove */
	wellsCount: number;
	wellsPerformanceThreshold?: number;
	points?: { label: string; desc: string; key?: string }[];
}) => {
	const { module, wellsCount, wellsPerformanceThreshold, points, existingWells } = props;

	const showPerfWarning =
		existingWells && wellsPerformanceThreshold
			? existingWells - wellsCount > wellsPerformanceThreshold
			: wellsPerformanceThreshold;

	return confirm({
		title: `You are removing ${pluralize(wellsCount, 'well', 'wells')} from this ${module}`,
		children: (
			<>
				{points?.map((item) => (
					<div key={item?.key ?? item.desc ?? item.label}>
						<h5>{item.label}</h5>
						<ul>
							<li>{item.desc}</li>
						</ul>
					</div>
				))}
				{/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later */}
				{showPerfWarning && getPerformanceWarningText(module, wellsPerformanceThreshold!)}
			</>
		),
		confirmText: 'Remove',
		confirmColor: 'error',
	});
};
