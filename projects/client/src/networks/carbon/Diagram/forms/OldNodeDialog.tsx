// TODO improve type safety in the forms
import { faChevronDown, faQuestion } from '@fortawesome/pro-regular-svg-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Typography,
} from '@material-ui/core';
import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm, useFormContext } from 'react-hook-form';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { AnyObjectSchema } from 'yup';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Icon, IconButton, RHFForm, Stack } from '@/components/v2';
import FluidModelTable from '@/cost-model/detail-components/fluid_models/FluidModelTable';
import GridItemDialog from '@/cost-model/models/GridItemDialog';
import { confirmationAlert, createConfirmAddWells, createConfirmRemoveWells } from '@/helpers/alerts';
import { useAlfaStore } from '@/helpers/alfa';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { redirectToZoho } from '@/helpers/routing';
import { labelWithUnit } from '@/helpers/text';
import { showUnsavedWorkDialog } from '@/helpers/unsaved-work';
import { assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { showWellFilter } from '@/well-filter/well-filter';

import { nodeModelQuery, useFluidModelQuery } from '../../api';
import {
	AssociatedGasSchema,
	AtmosphereSchema,
	CaptureSchema,
	CentrifugalCompressorSchema,
	CombustionSchema,
	CompletionSchema,
	CustomCalculationSchema,
	DrillingSchema,
	EconOutputSchema,
	FlareSchema,
	FlowbackSchema,
	LiquidsUnloadingSchema,
	OilTankSchema,
	PneumaticDeviceSchema,
	PneumaticPumpSchema,
	ReciprocatingCompressorSchema,
	WellGroupSchema,
} from '../../schemas';
import { ATMOSPHERE_EMISSION_OPTIONS, CAPTURE_EMISSION_OPTIONS, NODES_PRESETS } from '../../shared';
import { AnyNode, NetworkModel, NodeType, WellGroupNode } from '../../types';
import { useTimeSeriesInputStore } from '../helpers';
import CentrifugalCompressorForm from './CentrifugalCompressorForm';
import CombustionForm from './CombustionForm';
import CompletionForm from './CompletionForm';
import CustomCalculationNodeForm from './CustomCalculationNodeForm';
import DrillingForm from './DrillingForm';
import FlowbackForm from './FlowbackForm';
import PneumaticDeviceForm from './PneumaticDeviceForm';
import PneumaticPumpForm from './PneumaticPumpForm';
import ReciprocatingCompressorForm from './ReciprocatingCompressorForm';
import { FormNumberField, FormSelectField, FormTextField } from './shared-components';

const NODES_ZOHO: Record<NodeType, string> = {
	well_group: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Well_Group',
	atmosphere: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Atmosphere',
	econ_output:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Econ_Output',
	oil_tank: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Oil_Tank',
	flare: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Flare',
	liquids_unloading:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Liquids_Unloading',
	associated_gas:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Associated_Gas',
	facility:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Facility_Node',
	combustion: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Combustion',
	pneumatic_device:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Pneumatic_Devices',
	pneumatic_pump:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Pneumatic_Pumps',
	centrifugal_compressor:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Centrifugal_Compressors',
	reciprocating_compressor:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Reciprocating_Compressors',
	drilling: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Drilling',
	completion: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Completion',
	flowback: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Flowback',
	capture: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Capture',
	custom_calculation:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Custom_Calculation',
};

interface AccordionItemProps {
	className?: string;
	summary: React.ReactNode;
	children?: React.ReactNode;
}

const StyledAccordion = styled(Accordion)`
	box-shadow: none;
	border: 0;
	margin: 0;
	:before {
		display: none;
	}
	&.Mui-expanded {
		min-height: 0;
		margin: 0;
	}
	.MuiAccordionSummary-root {
		background: ${({ theme }) => theme.palette.background.opaque};
		border-radius: ${({ theme }) => theme.shape.borderRadius}px;
		.MuiAccordionSummary-content {
			margin: 0;
		}
	}
	.MuiAccordionDetails-root {
		flex-direction: column;
		padding: 0;
		gap: ${({ theme }) => theme.spacing(1)}px;
		margin-top: ${({ theme }) => theme.spacing(1)}px;
	}
	.MuiIconButton-edgeEnd {
		margin-left: -12px;
		margin-right: 0;
	}
`;

/**
 * Small wrapper over Accordion components from mui
 *
 * @example
 * 	<AccordionItem summary='Summary'>Content</AccordionItem>;
 */
function AccordionItem(props: AccordionItemProps) {
	const { children, className, summary } = props;
	return (
		<StyledAccordion className={className}>
			<AccordionSummary
				expandIcon={<Icon>{faChevronDown}</Icon>}
				css={`
					.MuiIconButton-edgeEnd {
						margin-right: -12px;
						margin-left: 0;
					}
				`}
			>
				{summary}
			</AccordionSummary>
			<AccordionDetails
				css={`
					width: 100%;
				`}
			>
				{children}
			</AccordionDetails>
		</StyledAccordion>
	);
}

// taken from scenario page
function GridItemTransition({
	onHide,
	invalidateModel,
	...props
}: DialogProps<null> &
	Omit<React.ComponentPropsWithoutRef<typeof GridItemDialog>, 'hideDialog'> & {
		invalidateModel: () => Promise<void>;
	}) {
	return (
		<GridItemDialog
			hideDialog={() => {
				onHide();
				invalidateModel();
			}}
			useModelTaggingProp={getTaggingProp('carbonNetwork', 'useFluidModel')}
			{...props}
		/>
	);
}

export function FluidModelAccordionItem({ name }: { name: string }) {
	const { watch, setValue } = useFormContext();

	const selectedFluidModelId = watch(name) as string | null;

	const [gridItemDialog, promptGridItemDialog] = useDialog(GridItemTransition);

	const selectedFluidModelQuery = useFluidModelQuery(selectedFluidModelId);
	const selectedFluidModelExists = useMemo(
		() => selectedFluidModelQuery.isSuccess && selectedFluidModelQuery.data,
		[selectedFluidModelQuery]
	);

	const handleChangeFluidModel = async () => {
		await promptGridItemDialog({
			data: {
				chooseModel: async ({ model }) => {
					await selectedFluidModelQuery.invalidate();
					setValue(name, model._id);
					confirmationAlert(localize.operations.networkModel.assignFluidModel.complete({ name: model.name }));
				},
				key: AssumptionKey.fluidModel,
				selectedModels: { fluid_model: selectedFluidModelExists ? selectedFluidModelId : null },
			},
			invalidateModel: () => selectedFluidModelQuery.invalidate(),
			tabs: [{ key: AssumptionKey.fluidModel, canUse: true }],
		});
	};

	const handleUnassignFluidModel = () => setValue(name, null);
	return (
		<AccordionItem
			summary={
				<Stack spacing={2} direction='row' alignItems='center'>
					<Typography>Fluid Model</Typography>
					<Divider orientation='vertical' />
					<Typography
						variant='body2'
						css={`
							color: ${({ theme }) => theme.palette.secondary.light} !important;
							font-weight: bolder;
						`}
					>
						{selectedFluidModelExists ? selectedFluidModelQuery.data?.name : 'None'}
					</Typography>
				</Stack>
			}
		>
			<Grid container alignItems='center' justifyContent='flex-end'>
				<Grid item xs={4}>
					<Stack direction='row' spacing={2} justifyContent='flex-end'>
						<Button color='secondary' onClick={handleChangeFluidModel}>
							Change
						</Button>
						{selectedFluidModelExists && (
							<Button color='error' onClick={handleUnassignFluidModel}>
								Unassign
							</Button>
						)}
					</Stack>
				</Grid>
			</Grid>
			{gridItemDialog}
			{!!selectedFluidModelExists && (
				<FluidModelTable
					css={`
						width: 100%;
					`}
					state={selectedFluidModelQuery.data?.econ_function}
					domLayout='autoHeight'
				/>
			)}
		</AccordionItem>
	);
}

const NODE_TYPES_SCHEMAS: Partial<Record<NodeType, AnyObjectSchema>> = {
	flare: FlareSchema,
	well_group: WellGroupSchema,
	oil_tank: OilTankSchema,
	atmosphere: AtmosphereSchema,
	combustion: CombustionSchema,
	pneumatic_device: PneumaticDeviceSchema,
	pneumatic_pump: PneumaticPumpSchema,
	centrifugal_compressor: CentrifugalCompressorSchema,
	reciprocating_compressor: ReciprocatingCompressorSchema,
	drilling: DrillingSchema,
	completion: CompletionSchema,
	associated_gas: AssociatedGasSchema,
	liquids_unloading: LiquidsUnloadingSchema,
	econ_output: EconOutputSchema,
	capture: CaptureSchema,
	flowback: FlowbackSchema,
	custom_calculation: CustomCalculationSchema,
};

const OilTankForm = () => {
	return (
		<>
			<FormNumberField name='oil_to_gas_ratio' label='Flash Gas Ratio (MCF/BBL)' />
			<FluidModelAccordionItem name='output_gas_fluid_model' />
		</>
	);
};

const FlareForm = () => {
	return (
		<Stack spacing={2}>
			<FormNumberField name='pct_flare_efficiency' label='Flare Efficiency (%)' />
			<FormNumberField name='pct_flare_unlit' label='Flare Unlit (%)' />
			<FormNumberField name='fuel_hhv.value' label={labelWithUnit('Fuel HHV', 'MMBtu/scf')} />
		</Stack>
	);
};

const AtmosphereForm = () => {
	return (
		<Stack spacing={2}>
			<FormSelectField name='emission_type' label='Emission Type' menuItems={ATMOSPHERE_EMISSION_OPTIONS} />
		</Stack>
	);
};

const CaptureForm = () => {
	return (
		<Stack spacing={2}>
			<FormSelectField name='emission_type' label='Emission Type' menuItems={CAPTURE_EMISSION_OPTIONS} />
		</Stack>
	);
};

const WellGroupForm = (_props: { network: NetworkModel; node: WellGroupNode }) => {
	const { control, getValues } = useFormContext();

	const handleModifyWells = useCallback(
		async (operation, onChange) => {
			const currentlySelectedWells = getValues('wells');
			const project = useAlfaStore.getState().project;
			assert(project, 'expected project to be in context');
			const availableWellsToAdd = _.difference(project.wells, currentlySelectedWells);
			const wells = await showWellFilter({
				type: operation === 'add' ? 'add' : 'remove',
				wells: operation === 'add' ? availableWellsToAdd : currentlySelectedWells,
				existingWells: operation === 'add' ? currentlySelectedWells : undefined,
				confirm: operation === 'add' ? createConfirmAddWells('network') : createConfirmRemoveWells('network'),
			});
			if (!wells) return;
			onChange(
				operation === 'add'
					? [...currentlySelectedWells, ...wells]
					: _.difference(currentlySelectedWells, wells)
			);
		},
		[getValues]
	);

	return (
		<Stack spacing={2}>
			<Controller
				control={control}
				name='wells'
				render={({ field: { onChange, value } }) => (
					<Stack direction='row' alignItems='center' justifyContent='space-between'>
						<span>Wells {value.length}</span>
						<Stack direction='row' spacing={1} justifyContent='end'>
							<Button
								variant='outlined'
								color='secondary'
								onClick={() => handleModifyWells('add', onChange)}
							>
								Add Wells
							</Button>
							<Button
								variant='outlined'
								color='error'
								onClick={() => handleModifyWells('view', onChange)}
							>
								View/Remove Wells
							</Button>
						</Stack>
					</Stack>
				)}
			/>
			<Stack spacing={2}>
				<FluidModelAccordionItem name={AssumptionKey.fluidModel} />
			</Stack>
		</Stack>
	);
};

const AssociatedGasForm = () => null;

const EconOutputForm = () => null;

const LiquidsUnloadingForm = () => null;

const generateNodeForm = ({ node, network }: { node: AnyNode; network?: NetworkModel }) => {
	const { type } = node;
	switch (type) {
		case 'flare':
			return <FlareForm />;
		case 'well_group':
			assert(network, 'expected network');
			return <WellGroupForm node={node} network={network} />;
		case 'oil_tank':
			return <OilTankForm />;
		case 'atmosphere':
			return <AtmosphereForm />;
		case 'combustion':
			return <CombustionForm />;
		case 'pneumatic_device':
			return <PneumaticDeviceForm />;
		case 'pneumatic_pump':
			return <PneumaticPumpForm />;
		case 'centrifugal_compressor':
			return <CentrifugalCompressorForm />;
		case 'reciprocating_compressor':
			return <ReciprocatingCompressorForm />;
		case 'drilling':
			return <DrillingForm />;
		case 'completion':
			return <CompletionForm />;
		case 'associated_gas':
			return <AssociatedGasForm />;
		case 'econ_output':
			return <EconOutputForm />;
		case 'liquids_unloading':
			return <LiquidsUnloadingForm />;
		case 'capture':
			return <CaptureForm />;
		case 'flowback':
			return <FlowbackForm />;
		case 'custom_calculation':
			return <CustomCalculationNodeForm node={node} />;
		default:
			throw new Error(`Unhandled node type: ${type}`);
	}
};

type EditNodeDialogReturn = Pick<AnyNode, 'params' | 'name' | 'description'>;

type EditNodeDialogProps = DialogProps<EditNodeDialogReturn> & {
	node: AnyNode;
	network?: NetworkModel;
};

function OldNodeDialog({ visible, onHide, resolve, node, network }: EditNodeDialogProps) {
	const nodeModelQueryResult = useQuery({
		...nodeModelQuery(node.nodeModel as string),
		suspense: true,
		enabled: !!node.nodeModel,
	});

	const form = useForm({
		defaultValues: {
			...node.params,
			...nodeModelQueryResult.data?.params,
			description: node.description,
			name: node.name,
		},
		resolver: yupResolver(NODE_TYPES_SCHEMAS[node.type]),
	});
	const {
		handleSubmit: formSubmit,
		formState: { isDirty, errors },
	} = form;
	const [setErrors] = useTimeSeriesInputStore((state) => [state.setErrors]);

	const handleSubmit = (values) => {
		resolve({
			...values,
			nodeModel: null, // always clear out carbon model field on old node version
		});
	};

	const handleHide = async () => {
		if (isDirty && !(await showUnsavedWorkDialog())) return;
		onHide();
	};

	const handleZohoRedirect = () => {
		redirectToZoho(NODES_ZOHO[node.type]);
	};

	useEffect(() => {
		setErrors(errors);
	}, [errors, setErrors]);

	return (
		<Dialog open={visible} onClose={handleHide} maxWidth='xl' fullWidth>
			<DialogTitle
				disableTypography
				css={`
					display: flex;
					align-items: center;
				`}
			>
				<Typography variant='h6' component='div'>
					Edit {node.type === 'facility' ? 'Facility' : NODES_PRESETS[node.type].name} Node
				</Typography>

				<div css={{ flex: 1 }} />
				<IconButton onClick={handleZohoRedirect}>{faQuestion}</IconButton>
			</DialogTitle>
			<DialogContent>
				<RHFForm form={form} onSubmit={handleSubmit}>
					<Stack spacing={2}>
						<Grid container spacing={2}>
							<Grid item xs={6}>
								<FormTextField name='name' label='Name' />
							</Grid>
							<Grid item xs={6}>
								<FormTextField name='description' label='Description' />
							</Grid>
						</Grid>
						<Divider />
						{generateNodeForm({ node, network })}
					</Stack>
				</RHFForm>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleHide} color='secondary' variant='contained'>
					Cancel
				</Button>
				<Button
					color='secondary'
					variant='contained'
					onClick={formSubmit(handleSubmit)}
					{...getTaggingProp('carbonNetwork', 'applyWellNode')}
				>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default OldNodeDialog;
