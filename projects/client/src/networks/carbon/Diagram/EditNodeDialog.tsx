// TODO improve type safety in the forms

import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { Accordion, AccordionDetails, AccordionSummary, Divider, Grid, Typography } from '@material-ui/core';
import { Stack } from '@mui/material';
import _, { mapValues } from 'lodash';
import { Suspense, useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import { AnyObjectSchema } from 'yup';

import { getTaggingProp } from '@/analytics/tagging';
import { Button, Icon } from '@/components/v2';
import FluidModelTable from '@/cost-model/detail-components/fluid_models/FluidModelTable';
import GridItemDialog from '@/cost-model/models/GridItemDialog';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, createConfirmAddWells, createConfirmRemoveWells } from '@/helpers/alerts';
import { useAlfaStore } from '@/helpers/alfa';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { labelWithUnit } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import yup from '@/helpers/yup-helpers';
import { AssumptionKey } from '@/inpt-shared/constants';
import NodeDialog from '@/networks/carbon/NodeDialog/NodeDialog';
import { NodeDialogMode } from '@/networks/carbon/NodeDialog/NodeDialog.types';
import { showWellFilter } from '@/well-filter/well-filter';

import { useFluidModelQuery } from '../api';
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
} from '../schemas';
import { ATMOSPHERE_EMISSION_OPTIONS, CAPTURE_EMISSION_OPTIONS } from '../shared';
import { AnyNode, CustomCalculationNode, NetworkModel, NodeType } from '../types';
import CentrifugalCompressorForm from './forms/CentrifugalCompressorForm';
import CombustionForm from './forms/CombustionForm';
import CompletionForm from './forms/CompletionForm';
import CustomCalculationNodeForm from './forms/CustomCalculationNodeForm';
import DrillingForm from './forms/DrillingForm';
import FlowbackForm from './forms/FlowbackForm';
import OldNodeDialog from './forms/OldNodeDialog';
import PneumaticDeviceForm from './forms/PneumaticDeviceForm';
import PneumaticPumpForm from './forms/PneumaticPumpForm';
import ReciprocatingCompressorForm from './forms/ReciprocatingCompressorForm';
import { FormNumberField, FormSelectField } from './forms/shared-components';

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
					setValue(name, model._id, {
						shouldDirty: true,
					});
					confirmationAlert(localize.operations.networkModel.assignFluidModel.complete({ name: model.name }));
				},
				key: AssumptionKey.fluidModel,
				selectedModels: { fluid_model: selectedFluidModelExists ? selectedFluidModelId : null },
			},
			invalidateModel: () => selectedFluidModelQuery.invalidate(),
			tabs: [{ key: AssumptionKey.fluidModel, canUse: true }],
		});
	};

	const handleUnassignFluidModel = () =>
		setValue(name, null, {
			shouldDirty: true,
		});
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

const SHARED_SCHEMA = yup.object({
	name: yup.string().required().hasNonWhitespace(),
	description: yup.string(),
});

export const NODE_TYPES_SCHEMAS: Partial<Record<NodeType, AnyObjectSchema>> = mapValues(
	{
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
	},
	// @ts-expect-error TODO investigate why ts complains
	(schema) => schema.concat(SHARED_SCHEMA)
);

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

const WellGroupForm = () => {
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

export const generateNodeForm = ({ type, node }: { type: NodeType; node?: AnyNode }) => {
	switch (type) {
		case 'flare':
			return <FlareForm />;
		case 'well_group':
			return <WellGroupForm />;
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
			return <CustomCalculationNodeForm node={node as CustomCalculationNode} />;
		default:
			throw new Error(`Unhandled node type: ${type}`);
	}
};

type EditNodeDialogReturn = Pick<AnyNode, 'params' | 'name' | 'description'> & {
	nodeModel: string | null;
};

type EditNodeDialogProps = DialogProps<EditNodeDialogReturn> & {
	node: AnyNode;
	network?: NetworkModel;
};

function EditNodeDialog({ visible, onHide, resolve, node, network }: EditNodeDialogProps) {
	const { isNodeModelsEnabled } = useLDFeatureFlags();
	const DialogComponent = useMemo(() => (isNodeModelsEnabled ? NodeDialog : OldNodeDialog), [isNodeModelsEnabled]);

	return (
		<Suspense fallback={null}>
			<DialogComponent
				visible={visible}
				onHide={onHide}
				resolve={resolve as DialogProps['resolve'] /* TODO: Remove this casting along with the old dialog */}
				mode={NodeDialogMode.node}
				node={node}
				{...(!isNodeModelsEnabled && {
					network,
				})}
			/>
		</Suspense>
	);
}

export default EditNodeDialog;
