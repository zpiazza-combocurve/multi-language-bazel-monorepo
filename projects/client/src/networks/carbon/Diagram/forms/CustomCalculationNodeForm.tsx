import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import {
	Divider,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@material-ui/core';
import _ from 'lodash';
import { Dispatch, MouseEventHandler, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseFormGetValues, UseFormSetValue, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';

import {
	Button,
	IconButton,
	IconButtonProps,
	InfoTooltipWrapper,
	RHFCheckboxField,
	RHFSelectField,
	Stack,
} from '@/components/v2';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { useDebounce } from '@/helpers/debounce';
import { EMISSION_CATEGORY_LABEL } from '@/inpt-shared/econ-models/emissions';
import { DeviceImage } from '@/networks/carbon/Diagram/Diagram';
import FormulaInput from '@/networks/carbon/FormulaCompiler/FormulaInput';
import { EMISSION_TYPE_LABELS, STREAM_DISPLAY_UNITS } from '@/networks/carbon/shared';
import {
	CustomCalculationInput,
	CustomCalculationNode,
	CustomCalculationOutput,
	NonDisplayedStream,
} from '@/networks/carbon/types';

import { FluidModelAccordionItem } from '../EditNodeDialog';

interface SelectionPosition {
	start: number;
	end: number;
}
interface LastFocusedFormula {
	inputRef: React.MutableRefObject<HTMLInputElement | null>;
	index: number | null;
	setIndex: Dispatch<SetStateAction<number | null>>;
	selection: SelectionPosition;
	setSelection: Dispatch<SelectionPosition>;
	focus: () => void;
}
function useLastFocusedFormula(): LastFocusedFormula {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [index, setIndex] = useState<number | null>(null);
	const [selection, setSelection] = useState<SelectionPosition>({
		start: 0,
		end: 0,
	});

	const focus = useCallback(() => {
		if (inputRef.current && inputRef.current !== document.activeElement) {
			inputRef.current.focus();
		}
	}, [inputRef]);

	return {
		inputRef,
		index,
		setIndex,
		focus,
		selection,
		setSelection,
	};
}
function getDisplayLabel(name, stream) {
	return `${name} (${STREAM_DISPLAY_UNITS[stream]})`;
}

function getEmissionTypesFromOutput(output: CustomCalculationOutput): MenuItem[] {
	if (output.name === 'Gas') {
		return [
			{
				label: 'N/A',
				value: 'N/A',
			},
		];
	}
	return Object.keys(EMISSION_TYPE_LABELS).map((key) => ({
		label: EMISSION_TYPE_LABELS[key],
		value: key,
	}));
}

const StyledPaper = styled(Paper).attrs({
	elevation: 2,
})`
	background-color: ${({ theme }) => theme.palette.background.opaque};
`;

interface OperationButtonProps {
	icon: IconDefinition | string;
	handleClick: MouseEventHandler<HTMLButtonElement>;
	buttonProps?: IconButtonProps;
}
function OperationButton(props: OperationButtonProps) {
	const { handleClick, icon, buttonProps } = props;
	return typeof icon !== 'string' ? (
		<IconButton
			onClick={handleClick}
			color='primary'
			size='small'
			css={`
				background-color: ${({ theme }) => theme.palette.background.opaque};
			`}
			{...buttonProps}
		>
			{icon}
		</IconButton>
	) : (
		<Button
			size='small'
			variant='outlined'
			color='primary'
			onClick={handleClick}
			{...buttonProps}
			css={`
				font-size: 1.1rem;
				font-weight: bold;
				min-width: 2.5rem;
				min-height: 2.5rem;
			`}
		>
			{icon}
		</Button>
	);
}

function addStringAtPosition(currentValue: string, str: string, lastFocusedFormula: LastFocusedFormula) {
	const { selection, setSelection } = lastFocusedFormula;
	let newValue = currentValue;
	if (selection.start !== selection.end) {
		// Remove the selected text
		newValue = currentValue.slice(0, selection.start) + currentValue.slice(selection.end);
	}

	const newSelection = {
		start: selection.start + str.length,
		end: selection.start + str.length,
	};
	setSelection(newSelection);
	return newValue.slice(0, selection.start) + str + newValue.slice(selection.start);
}

function useCheckNoInputs() {
	const currentInputs: CustomCalculationInput[] = useWatch({ name: 'inputs' });
	return currentInputs?.every((input) => !input.assign);
}

const OPERATION_BUTTONS: (Pick<OperationButtonProps, 'icon'> & {
	key: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handleOperation: any;
	disabled?: string | boolean;
})[] = [
	{
		key: 'add',
		icon: '+',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '+', lastFocusedFormula),
	},
	{
		key: 'subtract',
		icon: '-',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '-', lastFocusedFormula),
	},
	{
		key: 'multiply',
		icon: '*',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '*', lastFocusedFormula),
	},
	{
		key: 'divide',
		icon: '/',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '/', lastFocusedFormula),
	},
	{
		key: 'left-bracket',
		icon: '(',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '(', lastFocusedFormula),
	},
	{
		key: 'right-bracket',
		icon: ')',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, ')', lastFocusedFormula),
	},
	{
		key: 'at',
		icon: '@FPD',
		handleOperation: (currentValue, lastFocusedFormula) =>
			addStringAtPosition(currentValue, '@FPD', lastFocusedFormula),
	},
];

const FUNCTION_HANDLE_KEYS = ['at'];

function shouldDisable(output: CustomCalculationOutput, outputs: CustomCalculationOutput[], formHasNoInputs: boolean) {
	if (output.by === 'gas') {
		return formHasNoInputs;
	}

	const mutuallyExclusiveWithCO2e = [NonDisplayedStream.CO2, NonDisplayedStream.N2O, NonDisplayedStream.CH4];

	if (output.name === NonDisplayedStream.CO2e) {
		return outputs.some(
			(output) => mutuallyExclusiveWithCO2e.includes(output.name as NonDisplayedStream) && output.assign
		);
	} else if (mutuallyExclusiveWithCO2e.includes(output.name as NonDisplayedStream)) {
		return outputs.some((output) => output.name === NonDisplayedStream.CO2e && output.assign);
	}
}

function syncOutputAssignAndOutputFormula(
	checked: boolean,
	getValues: UseFormGetValues<CustomCalculationNode['params']>,
	setValue: UseFormSetValue<CustomCalculationNode['params']>,
	output: CustomCalculationOutput
) {
	const currentValues = getValues('formula.simple');
	const updatedValues = checked
		? currentValues.concat({
				output: output.name,
				formula: '',
		  })
		: currentValues.filter((value) => value.output !== output.name);

	setValue('formula.simple', updatedValues);
}

interface FormulaTableProps {
	lastFocusedFormula: LastFocusedFormula;
}

function FormulaTable(props: FormulaTableProps) {
	const { lastFocusedFormula } = props;
	const watchedSimpleFormulas = useWatch({ name: 'formula.simple' });
	const watchedInputs = useWatch({ name: 'inputs' });
	const {
		setValue,
		getValues,
		trigger,
		clearErrors,
		formState: { errors },
	} = useFormContext<CustomCalculationNode['params']>();
	const outputDict = _.keyBy(getValues('outputs'), 'name');
	const formHasNoInputs = useCheckNoInputs();
	const operationButtons = useMemo(
		// Add disabled prop to function fandle buttons if there is no inputs
		() =>
			OPERATION_BUTTONS.map((button) => {
				if (lastFocusedFormula.index === null) {
					return {
						...button,
						disabled: 'Select a formula field to activate operations',
					};
				}

				if (formHasNoInputs && FUNCTION_HANDLE_KEYS.includes(button.key)) {
					return {
						...button,
						disabled: 'Add an input to use this function',
					};
				}
				return button;
			}),
		[formHasNoInputs, lastFocusedFormula.index]
	);

	const triggerErrorWithDelay = useDebounce((index) => trigger(`formula.simple.${index}.formula`), 3000);

	useEffect(() => {
		return triggerErrorWithDelay.cancel();
	}, [triggerErrorWithDelay]);

	return (
		<Stack spacing={2}>
			<Grid container justifyContent='center' spacing={2}>
				{operationButtons.map((button) => {
					const { key, handleOperation, disabled, ...rest } = button;
					return (
						<Grid item key={key}>
							<OperationButton
								handleClick={(e) => {
									e.preventDefault();
									if (lastFocusedFormula.index !== null) {
										const currentValue = getValues(
											`formula.simple.${lastFocusedFormula.index}.formula`
										);
										const updatedValue = handleOperation(currentValue ?? '', lastFocusedFormula);
										setValue(`formula.simple.${lastFocusedFormula.index}.formula`, updatedValue);
										lastFocusedFormula.inputRef.current?.focus();
									}
								}}
								buttonProps={{
									disabled,
								}}
								{...rest}
							/>
						</Grid>
					);
				})}
			</Grid>
			<TableContainer component={StyledPaper}>
				<Table aria-label='simple table' size='small'>
					<TableHead>
						<TableRow>
							<TableCell>Output</TableCell>
							<TableCell>Formula</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{watchedSimpleFormulas.map((formula, index) => (
							<TableRow key={formula.output}>
								<TableCell>{getDisplayLabel(formula.output, outputDict[formula.output].by)}</TableCell>
								<TableCell>
									<FormulaInput
										name={`formula.simple.${index}.formula`}
										inputProps={{
											onInput: () => {
												clearErrors(`formula.simple.${index}.formula`);
												triggerErrorWithDelay(index);
											},
											onFocus: () => {
												lastFocusedFormula.setIndex(index);
											},
											onBlurCapture: ({ target: { selectionStart, selectionEnd } }) => {
												lastFocusedFormula.setSelection({
													start: selectionStart ?? 0,
													end: selectionEnd ?? 0,
												});
											},
										}}
										inputRef={
											lastFocusedFormula.index === index ? lastFocusedFormula.inputRef : null
										}
										value={getValues(`formula.simple.${index}.formula`)}
										inputs={watchedInputs}
										hasError={!!errors?.formula?.simple?.[index]?.formula}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
}

interface InputTableProps {
	lastFocusedFormula: LastFocusedFormula;
}

function InputTable(props: InputTableProps) {
	const { lastFocusedFormula } = props;
	const { setValue, getValues } = useFormContext<CustomCalculationNode['params']>();
	const watchedInputs = useWatch({ name: 'inputs' });
	return (
		<TableContainer component={StyledPaper}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Assign</TableCell>
						<TableCell>Input</TableCell>
						<TableCell align='center'>Use</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{watchedInputs?.map((input, index) => (
						<TableRow key={input.by}>
							<TableCell>
								<RHFCheckboxField
									name={`inputs.${index}.assign`}
									label=''
									css={`
										width: 100%;
									`}
									size='small'
								/>
							</TableCell>
							<TableCell>{getDisplayLabel(input.name, input.by)}</TableCell>
							<TableCell align='center'>
								<Button
									color='primary'
									size='small'
									disabled={lastFocusedFormula === null || !input.assign}
									tooltipTitle={
										(lastFocusedFormula === null || !input.assign) &&
										'Assign this input and select a formula field to use it'
									}
									onClick={() => {
										if (lastFocusedFormula.index !== null) {
											const currentValue = getValues(
												`formula.simple.${lastFocusedFormula.index}.formula`
											);
											const updatedValue = addStringAtPosition(
												currentValue,
												input.name,
												lastFocusedFormula
											);
											setValue(
												`formula.simple.${lastFocusedFormula.index}.formula`,
												updatedValue
											);
											lastFocusedFormula.focus();
										}
									}}
								>
									Use
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

interface OutputTableProps {
	outputs: CustomCalculationOutput[];
}
function OutputTable(props: OutputTableProps) {
	const { outputs } = props;
	const { control, getValues, setValue } = useFormContext<CustomCalculationNode['params']>();
	const formHasNoInputs = useCheckNoInputs();
	useEffect(() => {
		if (formHasNoInputs) {
			const currentOutputs = getValues('outputs');
			currentOutputs.forEach((output, index) => {
				if (output.by === 'gas') {
					const checked = false;
					setValue(`outputs.${index}.assign`, checked);
					syncOutputAssignAndOutputFormula(checked, getValues, setValue, output);
				}
			});
		}
	}, [formHasNoInputs, setValue, getValues]);

	return (
		<TableContainer component={StyledPaper}>
			<Table aria-label='simple table' size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Assign</TableCell>
						<TableCell>Output</TableCell>
						<TableCell width='40%'>Emission Type</TableCell>
						<TableCell align='center' width='40%'>
							Category
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{outputs.map((output, index) => (
						<TableRow
							key={output.by}
							// @ts-expect-error TODO: Fix this type error.
							css={
								output.name !== 'Gas'
									? undefined
									: ({ theme }) =>
											`border-bottom: ${theme.spacing(1)}px solid ${
												theme.palette.background.default
											}`
							}
						>
							<TableCell>
								<InfoTooltipWrapper
									tooltipTitle={
										output.by === 'gas'
											? 'Gas output will be disabled when no input is selected'
											: 'CO2e and (CO2, CH4, N2O) can not be used together'
									}
								>
									<RHFCheckboxField
										name={`outputs.${index}.assign`}
										label=''
										size='small'
										onChangeCapture={(e) => {
											const { checked } = e.target as HTMLInputElement;
											syncOutputAssignAndOutputFormula(checked, getValues, setValue, output);
										}}
										disabled={shouldDisable(output, getValues('outputs'), formHasNoInputs)}
									/>
								</InfoTooltipWrapper>
							</TableCell>
							<TableCell>{getDisplayLabel(output.name, output.by)}</TableCell>
							<TableCell
								css={`
									.MuiFormControl-root.MuiTextField-root {
										width: 100%;
									}
								`}
							>
								<RHFSelectField
									SelectProps={{
										autoWidth: true,
									}}
									variant='outlined'
									size='small'
									name={`outputs.${index}.emission_type`}
									menuItems={getEmissionTypesFromOutput(output)}
									disabled={output.name === 'Gas'}
									control={control}
									placeholder='Select Category'
								/>
							</TableCell>
							<TableCell
								align='center'
								width='40%'
								css={`
									.MuiFormControl-root.MuiTextField-root {
										width: 100%;
									}
								`}
							>
								<RHFSelectField
									SelectProps={{
										autoWidth: true,
									}}
									variant='outlined'
									size='small'
									name={`outputs.${index}.category`}
									menuItems={[
										...Object.keys(EMISSION_CATEGORY_LABEL).map((key) => ({
											label: (
												<div
													css={`
														display: flex;
														align-items: center;
													`}
												>
													<div
														css={{
															marginRight: '8px',
														}}
													>
														<DeviceImage type={key} width='24px' height='24px' />
													</div>
													{EMISSION_CATEGORY_LABEL[key]}
												</div>
											),
											value: key,
										})),
									]}
									control={control}
									placeholder='Select Category'
								/>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

interface CustomCalculationNodeFormProps {
	node: CustomCalculationNode;
}
function CustomCalculationNodeForm(props: CustomCalculationNodeFormProps) {
	const { node } = props;
	const { inputs, outputs } = node.params;
	const currentAssignedOutputs = useWatch({ name: 'outputs' });
	const lastFocusedFormula = useLastFocusedFormula();

	return (
		<Stack
			spacing={2}
			css={`
				/* Makes the rows more compact */
				.MuiOutlinedInput-inputMarginDense {
					padding-top: 0.3em;
					padding-bottom: 0.3em;
				}
			`}
		>
			<Grid container spacing={2}>
				<Grid item xs={6}>
					{!!inputs.length && <InputTable lastFocusedFormula={lastFocusedFormula} />}
				</Grid>
				<Grid item xs={6}>
					{!!outputs.length && <OutputTable outputs={outputs as CustomCalculationOutput[]} />}
				</Grid>
			</Grid>
			{!!currentAssignedOutputs?.filter((output) => output.assign).length && (
				<Grid container spacing={2} justifyContent='center'>
					<Grid item xs={8}>
						<FormulaTable lastFocusedFormula={lastFocusedFormula} />
					</Grid>
				</Grid>
			)}
			<Divider />
			<FluidModelAccordionItem name='fluid_model' />
		</Stack>
	);
}

export default CustomCalculationNodeForm;
