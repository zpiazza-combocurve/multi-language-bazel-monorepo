import { useMutation, useQuery } from 'react-query';

import { getApi, postApi } from '@/helpers/routing';
import {
	EmissionCategory,
	EmissionTableData,
	ImportEmissionDialogOption,
	ImportEmissionDialogValues,
} from '@/inpt-shared/econ-models/emissions';

const EPA_QUERY_KEY = ['epa'];
const EPA_YEARS_QUERY_KEY = [...EPA_QUERY_KEY, 'years'];
const EPA_COMPANIES_QUERY_KEY = [...EPA_QUERY_KEY, 'companies'];
const EPA_BASINS_QUERY_KEY = [...EPA_QUERY_KEY, 'basins'];
const EPA_ALL_DISTINCT_OPTIONS = [...EPA_QUERY_KEY, 'all-distinct'];

function getImportEmissionDialogOptions(column: ImportEmissionDialogOption) {
	return getApi<string[]>('/epa/import-emissions', { column });
}

function getAllDistinctOptionsForImportFields() {
	return getApi<
		{
			company: string;
			year: string;
			basin: string;
			category: EmissionCategory;
		}[]
	>('/epa/distinct-options');
}

function importEmission(values: ImportEmissionDialogValues) {
	return postApi<EmissionTableData>('/epa/emissions', values);
}

export function useEPAYearsQuery() {
	return useQuery(EPA_YEARS_QUERY_KEY, () => getImportEmissionDialogOptions(ImportEmissionDialogOption.year));
}

export function useEPACompaniesQuery() {
	return useQuery(EPA_COMPANIES_QUERY_KEY, () => getImportEmissionDialogOptions(ImportEmissionDialogOption.company));
}

export function useEPABasinsQuery() {
	return useQuery(EPA_BASINS_QUERY_KEY, () => getImportEmissionDialogOptions(ImportEmissionDialogOption.basin));
}

export function useAllDisctintOptionsQuery() {
	return useQuery(EPA_ALL_DISTINCT_OPTIONS, () => getAllDistinctOptionsForImportFields());
}

export function useImportEmissionMutation() {
	return useMutation((params: ImportEmissionDialogValues) => importEmission(params));
}
