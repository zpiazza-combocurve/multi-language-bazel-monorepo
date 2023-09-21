import { Divider } from '@material-ui/core';
import _ from 'lodash-es';
import { useMemo } from 'react';

import ForecastFormControl, {
	FormControlRangeField,
	getFormControlRules,
} from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { labelWithUnit } from '@/helpers/text';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';
import { defaultUnitTemplate } from '@/type-curves/charts/C4Chart';

import { FieldSection } from '../shared/formLayout';
import { PhaseType } from '../types';

export const INC_ARPS_MARPS_KEY = 'segment_arps_4_wp_free_b1';

function ModelFields({
	basePath: basePathIn,
	basePhase,
	hasRepWells,
	phase,
	phaseType,
	tcModel,
}: {
	basePath?: string;
	basePhase?: Phase;
	hasRepWells: boolean;
	phase: Phase;
	phaseType: PhaseType;
	tcModel: string;
}) {
	const { params = {}, viewOrder = [] } = formTemplates[phaseType][tcModel] ?? {};
	const basePath = basePathIn ?? phase;
	const fieldColumnSpan = useMemo(() => (tcModel === INC_ARPS_MARPS_KEY ? 3 : 2), [tcModel]);

	return (
		<FieldSection columns={6}>
			{_.map(viewOrder, (param: string) => {
				const {
					dif,
					fieldDep,
					isInteger,
					label,
					labelTooltip,
					max,
					menuItems,
					min,
					type,
					units: paramUnits,
					requiresUnitTransform,
				} = params[param];

				const name = `${basePath}.${param}`;
				const units = requiresUnitTransform
					? defaultUnitTemplate[phaseType === 'rate' || basePath?.length ? phase : `${phase}/${basePhase}`]
					: paramUnits;
				const rules = getFormControlRules({ isInteger, min, max });

				if (type === 'div') return <Divider css='grid-column: 1/ -1' />;

				return type === 'range' ? (
					<FormControlRangeField
						key={name}
						fieldColumnSpan={fieldColumnSpan}
						dif={dif}
						fieldDep={fieldDep?.length && `${basePath}.${fieldDep}`}
						isInteger={isInteger}
						label={labelWithUnit(label, units)}
						max={max}
						min={min}
						name={name}
						required={hasRepWells}
						tooltip={labelTooltip}
						type='number'
					/>
				) : (
					<ForecastFormControl
						key={name}
						fieldColumnSpan={fieldColumnSpan}
						label={labelWithUnit(label, units)}
						menuItems={_.map(menuItems, (item) => ({ label: item, value: item }))}
						name={name}
						rules={rules}
						tooltip={labelTooltip}
						type={type}
					/>
				);
			})}

			{phaseType === 'rate' && (
				<ForecastFormControl
					fieldColumnSpan={fieldColumnSpan}
					label={labelWithUnit(
						'q Final',
						defaultUnitTemplate[phaseType === 'rate' ? phase : `${basePath}/${basePhase}`]
					)}
					name={`${basePath}.q_final`}
					rules={getFormControlRules({ min: 0, required: hasRepWells })}
					type='number'
				/>
			)}

			<ForecastFormControl
				fieldColumnSpan={fieldColumnSpan}
				label={labelWithUnit('Well Life', 'Years')}
				name={`${basePath}.well_life`}
				rules={getFormControlRules({ min: 0, required: hasRepWells })}
				type='number'
			/>
		</FieldSection>
	);
}

export default ModelFields;
