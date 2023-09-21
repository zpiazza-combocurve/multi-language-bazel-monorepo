import { FormikContext, useFormik, useFormikContext } from 'formik';
import { cloneDeep } from 'lodash-es';
import styled from 'styled-components';

import { FormikSelectField, Toolbar } from '@/components';
import { Form } from '@/components/FormHelper';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { getDefaultUnit, getWellLifeFields, wellLifeMethodOptions } from '@/forecasts/forecast-form/PhaseForm';
import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { capitalize } from '@/helpers/text';
import { convertDateToIdx, phases } from '@/helpers/zing';
import { SectionAIO } from '@/layouts/Section';

import { getInitialValues } from '../forecast-form/shared';

const BORDER_COLOR = {
	oil: theme.oilColor,
	gas: theme.gasColor,
	water: theme.waterColor,
};

export const honoringOptions = [
	{ label: 'Oil', value: 'oil' },
	{ label: 'Gas', value: 'gas' },
	{ label: 'Water', value: 'water' },
	{ label: 'Primary Product Phase', value: 'primary_product' },
	{ label: 'Each Phase Independent', value: 'independent' },
];
const PhaseContainer = styled.div`
	display: flex;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

const Container = styled.div`
	width: 100%;
	border-radius: 5px;
	border: 1px solid;
	margin: 0.375rem 0;
	padding: 0.5rem;
	${({ $phase }) => `border-color: ${BORDER_COLOR[$phase] ?? theme.textColor};`}
`;

const rateUnit = '$PHASE';

const HeaderContainer = styled.h3`
	font-size: 1.25rem;
	margin: 0;
`;

const DialogContentWithMinHeight = styled(DialogContent)`
	min-height: 25rem;
`;

const FixedWidthSelectButton = styled(FormikSelectField).attrs({
	listClassName: 'mass-adjust-well-life-dropdown-list',
	toggleClassName: 'mass-adjust-well-life-dropdown-toggle',
})`
	.mass-adjust-well-life-dropdown-list,
	.mass-adjust-well-life-dropdown-toggle {
		width: 15rem;
	}
`;

function MassModifyWellLifePhaseForm({ phase }) {
	const { values } = useFormikContext();
	const { [phase]: phaseValues = {}, same_well_life } = values;
	const { well_life_dict } = phaseValues ?? {};

	const phaseUnit = getDefaultUnit(rateUnit, { values, phase });
	const disabled = VALID_PHASES.includes(same_well_life) && same_well_life !== phase;
	return (
		<Container $phase={phase}>
			<Toolbar center={<HeaderContainer>{capitalize(phase)}</HeaderContainer>} />
			<Form
				namePrefix={`${phase}.`}
				compact
				fields={[
					// well life
					...getWellLifeFields({
						well_life_dict,
						passedWellLifeMethodOptions: [
							...wellLifeMethodOptions,
							{
								label: 'Forecast Start Date',
								value: 'forecast_start_date',
							},
						],
						wellLifeMin: 0,
					}).map((x) => ({ ...x, disabled })),
					{
						name: 'q_final',
						label: `q Final (${phaseUnit}):`,
						labelTooltip: 'Not used when the forecast is ratio',
						type: 'number',
						disabled,
						min: 0,
						required: true,
						compact: false,
					},
				]}
			/>
		</Container>
	);
}

const getInitValuesForMassWellLife = () => {
	const forecastInit = getInitialValues({ applyAll: false });
	return VALID_PHASES.reduce(
		(acc, phase) => {
			acc[phase] = {
				well_life_dict: forecastInit[phase].well_life_dict,
				q_final: forecastInit[phase].q_final,
			};
			return acc;
		},
		{ same_well_life: 'independent' }
	);
};

export function MassModifiyWellLifeDialog({ forecastId, wells, resolve, onHide, visible }) {
	const handleModifyWellLife = async (body) => {
		const deepCopyBody = cloneDeep(body);
		VALID_PHASES.forEach((p) => {
			if (deepCopyBody[p].well_life_dict.well_life_method === 'fixed_date') {
				deepCopyBody[p].well_life_dict.fixed_date = convertDateToIdx(deepCopyBody[p].well_life_dict.fixed_date);
			}
		});
		const requestBody = {
			forecastId,
			wells,
			oil: deepCopyBody.applyAll ? deepCopyBody.shared : deepCopyBody.oil,
			gas: deepCopyBody.applyAll ? deepCopyBody.shared : deepCopyBody.gas,
			water: deepCopyBody.applyAll ? deepCopyBody.shared : deepCopyBody.water,
			same_well_life: deepCopyBody.same_well_life,
		};
		// if a task is created/dialog should close so user can see notification alerts
		try {
			const { message, taskCreated } = await withLoadingBar(
				putApi(`/forecast/${forecastId}/mass-modify-well-life`, requestBody)
			);
			if (!taskCreated) {
				confirmationAlert(message);
			}
			resolve(!taskCreated);
		} catch (error) {
			resolve(false);
		}
	};

	const initialValues = getInitValuesForMassWellLife({ applyAll: false });
	const formikBundle = useFormik({ initialValues, onSubmit: handleModifyWellLife });

	const { values, isSubmitting, submitForm } = formikBundle;

	return (
		<FormikContext.Provider value={formikBundle}>
			<Dialog onClose={onHide} open={visible} fullWidth maxWidth={values.applyAll ? 'sm' : 'xl'}>
				<DialogTitle>Mass Modify Well Life</DialogTitle>
				<DialogContentWithMinHeight>
					<SectionAIO
						header={
							<div
								css={`
									display: flex;
									flex-direction: column;
								`}
							>
								<div
									css={`
										display: flex;
									`}
								>
									<FixedWidthSelectButton
										name='same_well_life'
										label='Use same well life as:'
										menuItems={honoringOptions}
										inlineLabel
										inlineTooltip='Make sure all the phases are honoring the well life of one phase'
									/>
								</div>
							</div>
						}
					>
						<PhaseContainer>
							{phases.map(({ value }) => (
								<MassModifyWellLifePhaseForm key={value} phase={value} />
							))}
						</PhaseContainer>
					</SectionAIO>
				</DialogContentWithMinHeight>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button
						disabled={wells.length < 1 || isSubmitting /* || errSet.size > 0 */}
						onClick={submitForm}
						color='primary'
					>
						{`Run (${wells.length})`}
					</Button>
				</DialogActions>
			</Dialog>
		</FormikContext.Provider>
	);
}
