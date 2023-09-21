import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from 'react-query';

import usePermissions from '@/access-policies/usePermissions';
import ColoredCircle from '@/components/misc/ColoredCircle';
import WellHeaderControl from '@/components/misc/WellHeaderControl';
import { Button, RHFForm, TextField } from '@/components/v2';
import { confirmationAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { NON_EDITABLE_HEADERS, useWellHeaders } from '@/helpers/headers';
import { updateProjectCustomHeadersData } from '@/helpers/project-custom-headers';
import { putApi } from '@/helpers/routing';
import { filterSearch } from '@/helpers/utilities';
import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { useSingleViewHeadersData } from './singleViewHooks';
import { invalidateQueries } from './utils';

const FIRST_HEADERS = ['well_name', 'well_number', 'api14', 'inptID'];

interface WellHeadersProps {
	onSubmitCallback?: () => void;
	wellId: string;
	isWellsCollection?: boolean;
}

export default function WellHeaders({ onSubmitCallback, wellId, isWellsCollection }: WellHeadersProps) {
	const { project } = useAlfa();
	const queryClient = useQueryClient();
	const { wellHeadersLabels, wellHeadersTypes, projectCustomHeadersKeys } = useWellHeaders({
		enableProjectCustomHeaders: true,
	});
	// defaultState is necessary to compare with defaultValues and reset RHF form after
	// first useForm call with an empty object.
	const [defaultState, setDefaultState] = useState({});

	const originalWellData = useSingleViewHeadersData(wellId, !!isWellsCollection);

	const [search, setSearch] = useState('');

	const defaultValues = useMemo(() => {
		const emptyWellHeaders = _.mapValues(wellHeadersLabels, () => undefined);
		return { ...emptyWellHeaders, ...originalWellData };
	}, [wellHeadersLabels, originalWellData]);

	const form = useForm({ defaultValues, mode: 'onChange' });
	const {
		reset,
		formState: { isSubmitting, isDirty, errors, dirtyFields },
	} = form;

	useLoadingBar(isSubmitting);

	useEffect(() => {
		// Compare to determine whether or not to reset an initially set empty object with new state.
		if (!_.isEqual(defaultValues, defaultState)) {
			reset(defaultValues);
			setDefaultState(defaultValues);
		}
	}, [defaultValues, reset, defaultState]);

	const projectWell = originalWellData?.project;

	const { canUpdate: canUpdateWell } = usePermissions(
		projectWell ? SUBJECTS.ProjectWells : SUBJECTS.CompanyWells,
		originalWellData?.project
	);

	const wellHeaderMap = useMemo(
		() =>
			filterSearch(
				// make some headers appear first on the list
				_.uniq([...FIRST_HEADERS, ...Object.keys(wellHeadersLabels)]),
				search,
				(k) => wellHeadersLabels[k]
			).map((key) => {
				const { type, options, kind } = wellHeadersTypes[key];
				const label = wellHeadersLabels[key];
				return (
					<WellHeaderControl
						key={key}
						name={key}
						label={
							<>
								{projectCustomHeadersKeys.includes(key) && (
									<ColoredCircle $color={projectCustomHeaderColor} />
								)}
								{label}
							</>
						}
						type={type}
						options={options}
						kind={kind}
						size='small'
						defaultValue=''
						readOnly={NON_EDITABLE_HEADERS.includes(key)}
					/>
				);
			}),
		[wellHeadersLabels, search, wellHeadersTypes, projectCustomHeadersKeys]
	);

	return (
		<RHFForm
			css={`
				height: 100%;
				width: 100%;
				padding: 1rem;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
			`}
			form={form}
			onSubmit={async (values) => {
				if (!originalWellData) {
					return;
				}

				const dto = { _id: values._id };
				// send only fields that have been updated
				Object.keys(dirtyFields).forEach((field) => {
					if (dirtyFields[field]) {
						dto[field] = values[field];
					}
				});

				if (project) {
					await putApi(`/well/${originalWellData._id}`, dto);

					const customHeaders = _.pick(dto, projectCustomHeadersKeys);

					if (!_.isEmpty(customHeaders)) {
						await updateProjectCustomHeadersData(project._id, [
							{ well: originalWellData._id, customHeaders },
						]);
					}
				} else {
					await putApi(`/well/${originalWellData._id}`, dto);
				}
				confirmationAlert('Headers successfully updated', 2000);
				invalidateQueries(queryClient);
				onSubmitCallback?.();
			}}
		>
			<div
				css={`
					display: flex;
					flex-direction: column;
					gap: 1rem;
				`}
			>
				<div
					css={`
						display: flex;
						gap: 1rem;
					`}
				>
					<Button
						color='primary'
						variant='contained'
						disabled={
							(!canUpdateWell && PERMISSIONS_TOOLTIP_MESSAGE) ||
							!_.isEmpty(errors) ||
							isSubmitting ||
							!isDirty
						}
						type='submit'
					>
						Save
					</Button>
					<Button
						variant='outlined'
						disabled={isSubmitting}
						onClick={() => {
							form.reset(defaultValues);
							setSearch('');
						}}
					>
						Reset
					</Button>
				</div>

				<TextField
					label='Search Header'
					value={search}
					onChange={(ev) => setSearch(ev.target.value)}
					variant='filled'
					size='small'
					debounce
					disabled={isSubmitting}
				/>
			</div>
			<div css='flex: 1; overflow-y: auto;'>{wellHeaderMap}</div>
		</RHFForm>
	);
}
