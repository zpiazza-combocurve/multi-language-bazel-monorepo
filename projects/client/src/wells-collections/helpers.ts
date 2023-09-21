import { useMemo, useState } from 'react';

import { CreateGenericWellsHeaderModel, WellHeaderInfo } from '@/create-wells/models';
import { useAlfa } from '@/helpers/alfa';
import { useProjectHeadersQuery } from '@/helpers/project-custom-headers';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { HEADERS_WITH_TYPE_STRING, stringHeaderTypes } from '@/scenarios/Scenario/ScenarioPage/constants';

const EXCLUDE_HEADERS = ['well_name', 'inptID', 'chosenID'];

export const useHeaders = (initialValues, projectId, includePCHs, stringOnly = false) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [headers, setHeaders] = useState<Record<string, any>>(initialValues.headers);

	const projectCustomHeadersQuery = useProjectHeadersQuery(projectId);

	const { selectedHeaders, headersKeyValuePairs } = useMemo(() => {
		const selectedHeaders: string[] = [];
		const headersKeyValuePairs: CreateGenericWellsHeaderModel[] = [];

		Object.entries(headers).forEach(([key, value]) => {
			selectedHeaders.push(key);
			headersKeyValuePairs.push({ key, value });
		});

		return { selectedHeaders, headersKeyValuePairs };
	}, [headers]);

	const { wellHeaders } = useAlfa();

	const wellHeadersDict = useMemo(() => {
		const wellHeadersDict: Record<string, WellHeaderInfo> = {};

		Object.entries(wellHeaders).forEach(([key, label]) => {
			const stringOnlyConditional = stringOnly ? HEADERS_WITH_TYPE_STRING.includes(key) : true;
			if (!EXCLUDE_HEADERS.includes(key) && stringOnlyConditional) {
				wellHeadersDict[key] = {
					label,
					type: WELL_HEADER_TYPES[key].type,
					isPCH: false,
					options: WELL_HEADER_TYPES[key].options?.map((o) => ({ label: o.value, value: o.label })), // label and value are swapped
					min: WELL_HEADER_TYPES[key].min,
					max: WELL_HEADER_TYPES[key].max,
				};
			}
		});

		if (projectCustomHeadersQuery.data && includePCHs) {
			Object.entries(projectCustomHeadersQuery.data.projectHeaders).forEach(([key, label]) => {
				const type = projectCustomHeadersQuery.data.projectHeadersTypes[key].type;
				const stringOnlyConditional = stringOnly ? stringHeaderTypes.includes(type) : true;
				if (stringOnlyConditional) {
					wellHeadersDict[key] = {
						label,
						type,
						isPCH: true,
					};
				}
			});
		}

		return wellHeadersDict;
	}, [wellHeaders, projectCustomHeadersQuery.data, stringOnly, includePCHs]);

	return { wellHeadersDict, selectedHeaders, headersKeyValuePairs, setHeaders, headers };
};
