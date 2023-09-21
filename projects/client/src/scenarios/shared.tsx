import { faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from '@material-ui/core/styles';
import _ from 'lodash';
import { groupBy } from 'lodash-es';

import { MuiTooltipContainer } from '@/components/tooltipped';
import { TooltipProps, TooltipWrapper } from '@/components/v2/helpers';
import { getWellHeaders } from '@/helpers/headers';
import { localize } from '@/helpers/i18n';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { fields as WELL_HEADERS } from '@/inpt-shared/display-templates/wells/well_headers.json';

export const ASSUMPTION_NAMES_BY_KEY = ASSUMPTION_LABELS;
export const ASSUMPTION_KEYS = Object.keys(ASSUMPTION_NAMES_BY_KEY) as AssumptionKey[];
export const NON_SCENARIO_ASSUMPTION_KEYS = [
	AssumptionKey.depreciation,
	AssumptionKey.escalation,
	AssumptionKey.fluidModel,
];

export const NON_ECON_MODEL = {
	[AssumptionKey.forecast]: 'Forecast',
	[AssumptionKey.schedule]: 'Schedule',
	[AssumptionKey.forecastPSeries]: 'P-Series',
	[AssumptionKey.carbonNetwork]: localize.network.label(),
};
export const NON_ECON_MODEL_KEYS = Object.keys(NON_ECON_MODEL);
export const SPECIAL_KEYS = [AssumptionKey.reservesCategory, AssumptionKey.ownershipReversion];

export const CARBON_RELATED_ASSUMPTION_KEYS = [
	AssumptionKey.carbonNetwork,
	AssumptionKey.emission,
	AssumptionKey.fluidModel,
];

export const allHeaderKeys = Object.keys(WELL_HEADERS);

const incColumnWidth = 65;
export const INCREMENTAL_COLUMN = {
	key: 'incremental',
	name: 'Inc',
	minWidth: incColumnWidth,
	width: incColumnWidth,
	maxWidth: incColumnWidth,
	frozen: true,
	freezable: false,
	resizable: false,
};

const allAssumptionValues = {
	...ASSUMPTION_NAMES_BY_KEY,
	...NON_ECON_MODEL,
};

const EXCLUDED_ASSUMPTION_KEYS = [AssumptionKey.generalOptions, AssumptionKey.depreciation, AssumptionKey.escalation];

const normalAssumptionKeys = ASSUMPTION_KEYS.filter(
	(assKey) => !EXCLUDED_ASSUMPTION_KEYS.includes(assKey) && !SPECIAL_KEYS.includes(assKey)
);
export const allAssumptionKeys = _.without(
	[...SPECIAL_KEYS, ...NON_ECON_MODEL_KEYS, ...normalAssumptionKeys],
	AssumptionKey.fluidModel
);

export const ALWAYS_VISIBLE_HEADERS = ['well_name'];
export const INITIAL_HEADERS = ['well_name', 'well_number', 'county', 'api14'];
export const INITIAL_ASSUMPTIONS = allAssumptionKeys;
export const INITIAL_SORT = [{ field: 'well_name', direction: 1, group: false }];

export function getWellsAssignmentMap(assignments) {
	const wellIdToAssignments = groupBy(assignments, ({ well }) => well);
	return {
		wellIds: Object.keys(wellIdToAssignments),
		getAssignments: (wellId: Inpt.ObjectId) => wellIdToAssignments[wellId],
	};
}

export function getAssignmentsFromWellIds(assignments, wellIds: Inpt.ObjectId[]) {
	const { getAssignments } = getWellsAssignmentMap(assignments);

	return wellIds.map((wellId) => getAssignments(wellId) ?? []).flat();
}

export function getHeaderLabel(header) {
	return {
		[INCREMENTAL_COLUMN.key]: INCREMENTAL_COLUMN.name,
		...getWellHeaders(),
	}[header];
}

export function getAssumptionLabel(assumption) {
	return allAssumptionValues[assumption];
}

const MISSING_TOOLTIP = 'Some wells are missing assignments';

export const WarningIcon = ({ tooltipTitle = MISSING_TOOLTIP, ...rest }: TooltipProps) => {
	const {
		palette: {
			warning: { main: warningColor },
		},
	} = useTheme();
	return (
		<TooltipWrapper tooltipTitle={tooltipTitle} tooltipEnterDelay={500} {...rest}>
			<span
				css={`
					${MuiTooltipContainer} {
						display: inline-block;
					}
					margin-right: 0.5rem;
					color: ${warningColor};
				`}
			>
				<FontAwesomeIcon icon={faExclamationTriangle} />
			</span>
		</TooltipWrapper>
	);
};

export const orderColumnKeys = (array: string[], orderedList: { [key: string]: number }): string[] => {
	const modifiedArray = array.filter((key) => orderedList[key] === undefined);
	Object.keys(orderedList).forEach((key) => {
		if (array.includes(key)) {
			modifiedArray.splice(orderedList[key], 0, key);
		}
	});
	return modifiedArray;
};

export const ORDERED_HEADERS_AND_ASSUMPTIONS_STORAGE_KEY = `INPT_CURRENT_SCENARIO_ORDERED_HEADERS_AND_ASSUMPTIONS_V1`;
export const SCENARIO_GRID_GROUPS_STORAGE_KEY = 'SCENARIO_GRID_GROUPS';

export const SCENARIO_FILTERS_STORAGE_KEY = 'SCENARIO_FILTERS_STORAGE_KEY';

export interface updateAssignmentsProps {
	column: string;
	scenarioId: Inpt.ObjectId<'scenario'>;
	type: 'model' | 'lookup' | 'tcLookup';
	value: Inpt.ObjectId<'assumption'> | string; // string for pseries
	assignmentIds: Inpt.ObjectId<'scenario-well-assignment'>[];
	isGroupCase: boolean;
}
