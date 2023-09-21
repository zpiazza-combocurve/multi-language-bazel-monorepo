import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { Collapse, Typography, createTheme } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { getTaggingProp } from '@/analytics/tagging';
import { Doggo } from '@/components';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, RHFForm } from '@/components/v2';
import { FieldHeader } from '@/components/v2/misc';
import { withExtendedThemeProvider } from '@/helpers/theme';

import {
	EpsgField,
	MenuItem,
	SelectField,
	StyledInputFieldContainer,
	ValidationDataType,
	WarningPanel,
	ZoneTypeField,
} from './components';
import { crsOptions } from './crsOptions';

const CustomTheme = withExtendedThemeProvider((p) =>
	createTheme({
		...p,
		props: {
			MuiIconButton: { size: 'small' },
		},
		overrides: {
			MuiButton: {
				label: { fontSize: '13px' },
			},
			MuiOutlinedInput: {
				input: { fontSize: '14px !important' },
			},
			MuiMenuItem: {
				root: {
					fontSize: '14px !important',
				},
			},
			MuiFormControlLabel: {
				label: { fontSize: '14px !important' },
			},
		},
	})
);

const distanceTypeItems: MenuItem[] = [
	{ label: 'Mid-point to mid-point', value: 'mid' },
	{ label: 'Mid-point to closest', value: 'mid-normal' },
	{ label: 'SHL to SHL', value: 'shl' },
];

const CRS_DEFAULT_OPTION = 'default';
const CRS_OTHER_OPTION = 'other';
const crsItems: MenuItem[] = [
	{ label: 'Default', value: CRS_DEFAULT_OPTION },
	...crsOptions,
	{ label: 'Other', value: CRS_OTHER_OPTION },
];

const initialValues = {
	distanceType: 'mid',
	zoneType: 'any',
	advanced: {
		crs: CRS_DEFAULT_OPTION,
		epsg: undefined,
	},
	confirmation: false,
};

const getEpsgNumber = (advancedOptions: { crs: string; epsg?: number }) => {
	const isDefaultValue = advancedOptions.crs === CRS_DEFAULT_OPTION;
	const isOtherValue = advancedOptions.crs === CRS_OTHER_OPTION;

	if (isDefaultValue) return 0;
	else if (isOtherValue) return advancedOptions.epsg;
	return Number(advancedOptions.crs);
};

interface WellSpacingDialogProps {
	onHide: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onSubmit: (any) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onValidate: (any) => any;
	resolve: () => void;
	visible: boolean;
}

const defaultValidationData: ValidationDataType = {
	isValid: true,
	totalAmount: -1,
	candidateWellsAmount: -1,
	details: [],
};

export const WellSpacingDialog = ({ onHide, onSubmit, onValidate, visible, resolve }: WellSpacingDialogProps) => {
	const form = useForm({ defaultValues: initialValues, mode: 'all' });
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isAdvancedOptionsOpened, setIsAdvancedOptionsOpened] = useState<boolean>(false);
	const [validationData, setValidationData] = useState<ValidationDataType>(defaultValidationData);

	const [distanceTypeValue, zoneTypeValue, crsValue] = form.watch(['distanceType', 'zoneType', 'advanced.crs']);
	const {
		formState: { isValid },
	} = form;

	const shouldGetEpsgNumber = isAdvancedOptionsOpened && crsValue === CRS_OTHER_OPTION;

	const validate = async ({ distanceType, zoneType }): Promise<ValidationDataType> => {
		setIsLoading(true);
		const validationData = await onValidate({ distanceType, zoneType });
		setIsLoading(false);

		return validationData;
	};

	const run = ({ distanceType, zoneType, advanced }): void => {
		onSubmit({
			distanceType,
			zoneType,
			epsgNumber: getEpsgNumber(advanced),
		});
		resolve();
	};

	useEffect(() => {
		setValidationData(defaultValidationData);
		form.trigger();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [distanceTypeValue, zoneTypeValue]);

	return (
		<CustomTheme>
			<Dialog open={visible} onClose={onHide} fullWidth maxWidth='xs'>
				<DialogTitle
					disableTypography
					style={{ padding: '24px', display: 'flex', justifyContent: 'space-between' }}
				>
					<Typography
						data-testid='well_spacing_dialog_title'
						variant='inherit'
						style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}
					>
						Well Spacing Calculation{' '}
						<Box
							fontSize='.75rem'
							css={`
								padding: 2px 5px;
								border-radius: 0.5rem;
								background-color: orange;
								color: black;
								display: inline-block;
								margin-right: 0;
								margin-left: 0.25rem;
								font-weight: bold;
							`}
						>
							BETA
						</Box>
					</Typography>
					<IconButton size='small' onClick={onHide}>
						{faTimes}
					</IconButton>
				</DialogTitle>
				<DialogContent style={{ padding: '0px 24px' }}>
					{isLoading && <Doggo overlay small underDog='Validating data...' />}
					<RHFForm form={form}>
						<ZoneTypeField />
						<SelectField
							label='Choose the type of distance to calculate'
							tooltipTitle='If no directional survey data is available, only "SHL to SHL"
							distance calculation is available. "Mid-point to mid-point" and "Mid-point
							to closest" calculations only available for horizontal wells.'
							name='distanceType'
							menuItems={distanceTypeItems}
						/>
						<StyledInputFieldContainer>
							<FieldHeader
								label='Advanced options'
								open={isAdvancedOptionsOpened}
								toggleOpen={() => {
									setIsAdvancedOptionsOpened(!isAdvancedOptionsOpened);
								}}
							/>
						</StyledInputFieldContainer>
						<Collapse timeout={0} in={isAdvancedOptionsOpened}>
							<SelectField
								label='Select the CRS'
								tooltipTitle='CRS (Coordinate Reference System) can be found in the directional survey report from survey providers.'
								name='advanced.crs'
								menuItems={crsItems}
								validate={(value: string) => {
									if (!isAdvancedOptionsOpened) return true;
									return value !== undefined || 'CRS is required';
								}}
							/>
							{shouldGetEpsgNumber && <EpsgField />}
						</Collapse>
						<WarningPanel validationData={validationData} />
					</RHFForm>
				</DialogContent>
				<DialogActions style={{ padding: '24px' }}>
					<Button color='secondary' onClick={onHide}>
						Cancel
					</Button>
					<Button
						color='secondary'
						variant='contained'
						disabled={!isValid || !validationData.candidateWellsAmount}
						onClick={form.handleSubmit(async (values) => {
							const { distanceType, zoneType, advanced, confirmation } = values;

							if (confirmation) {
								run({
									distanceType,
									zoneType,
									advanced,
								});
								return;
							}

							const validationData = await validate({ distanceType, zoneType });
							const { isValid } = validationData;
							if (isValid) {
								run({
									distanceType,
									zoneType,
									advanced,
								});
							} else {
								setValidationData(validationData);
								form.trigger('confirmation');
							}
						})}
						{...getTaggingProp('wellSpacing', 'run')}
					>
						Calc
					</Button>
				</DialogActions>
			</Dialog>
		</CustomTheme>
	);
};
