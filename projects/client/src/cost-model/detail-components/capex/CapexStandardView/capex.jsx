import produce from 'immer';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { useCustomWellHeaderNames } from '@/company/CustomColumnsRename/well-headers';
import { Placeholder } from '@/components';
import { InfoTooltip } from '@/components/tooltipped';
import EconModel from '@/cost-model/detail-components/EconModel';
import { addCustomHeadersData } from '@/cost-model/detail-components/capex/CapexAdvancedView/shared';
import { GenerateHeaderState, createEconFunction } from '@/cost-model/detail-components/gen-data';
import { customErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';
import { clone } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';

import { CompletionCost } from './completion_cost';
import { DrillingCost } from './drilling_cost';
import { OtherCapex } from './other_capex';

const TEMPLATE_QUERY_KEY = 'capex-display-template';
const TABLE_KEYS = ['capex_sheet', 'drilling_cost_sheet', 'completion_cost_sheet'];

const genCategory = (fields, category, value) =>
	produce(fields, (draft) => {
		draft.other_capex.row_view.columns.category.menuItems.find((m) => m.value === category).disabled = !value;
	});

export default function CapexStandardView(props) {
	const { project } = useAlfa();
	const queryClient = useQueryClient();

	const { columnNames } = useCustomWellHeaderNames();
	const dtQuery = useQuery([TEMPLATE_QUERY_KEY], () =>
		getApi(`/cost-model/getExtendedTemplate/${project?._id}/capex`)
	);

	const invalidateModelTemplateQuery = useCallback(() => {
		queryClient.invalidateQueries([TEMPLATE_QUERY_KEY]);
	}, [queryClient]);

	if (dtQuery.isLoading) {
		return <Placeholder loading text='Preparing capex module' />;
	}

	const {
		template: { fields: templateFields },
	} = dtQuery.data;

	const updatedTemplateFields = addCustomHeadersData(templateFields, columnNames);

	const description = (
		<>
			<div>
				Use for drilling/completion or and any other capitalized, depletable, expensed investment listed in the
				&quot;Category&quot; dropdown.
				<br />
				<br />
				Note that:
			</div>
			<ul>
				<li>Capitalized investments generally access *new* prod such as moving to different zones.</li>
				<li>Expensed investments facilitate, enhance or re-establish prod from previously completed zones.</li>
				<li>Depletable investments are usually initial purchase of asset.</li>
			</ul>
			<div>Tip: Use negative days to model investment spend prior to FPD.</div>
		</>
	);

	const CapexHeader = (
		<div css='display: flex'>
			<h2 className='md-text' css='margin-right: 15px'>
				CAPEX (Investments)
			</h2>
			<InfoTooltip labelTooltip={description} fontSize='18px' />
		</div>
	);

	return (
		<EconModel
			{...props}
			header={CapexHeader}
			initialOmitSection={{ drilling_cost: true, completion_cost: true }}
			className='capex'
			tablesContainerClassName='capex-layout'
			assumptionKey={AssumptionKey.capex}
			assumptionName='Capex'
			templateFields={updatedTemplateFields}
			tableKeys={TABLE_KEYS}
			invalidateModelTemplateQuery={invalidateModelTemplateQuery}
			fetchingModelTemplate={dtQuery.isFetching}
			prepareBody={({ body, fields, omitSection }) => {
				if (!omitSection.drilling_cost) {
					const drilling_rows = body.options.drilling_cost.empty_header.subItems.row_view.rows;
					let drilling_pct_sum = 0;
					drilling_rows.forEach((r) => {
						drilling_pct_sum += r.pct_of_total_cost;
					});
					if (drilling_pct_sum !== 100) {
						customErrorAlert('Check Cost Schedule!', 'Cost Schedule total does not equal 100%');
						return null;
					}
				}

				if (!omitSection.completion_cost) {
					const completion_rows = body.options.completion_cost.empty_header.subItems.row_view.rows;
					let completion_cost_sum = 0;
					completion_rows.forEach((r) => {
						completion_cost_sum += r.pct_of_total_cost;
					});
					if (completion_cost_sum !== 100) {
						customErrorAlert('Check Cost Schedule!', 'Cost Schedule total does not equal 100%');
						return null;
					}
				}

				const result = produce(body, (draft) => {
					draft.econ_function = createEconFunction(clone(draft.options), Object.keys(fields));

					Object.keys(omitSection).forEach((key) => {
						if (omitSection[key]) {
							draft.econ_function[key] = {};
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							draft.options[key] = { ...GenerateHeaderState(fields, key) };
						}
						draft.options[key].omitSection = !!omitSection[key];
					});
				});

				return result;
			}}
		>
			{({
				options: { other_capex, drilling_cost, completion_cost },
				fields,
				setFields,
				omitSection,
				toggleSection,
				handleOptionChange,
				selected,
				onSelect,
			}) => (
				<>
					{other_capex && (
						<OtherCapex
							onSelect={onSelect}
							selected={selected}
							other_capex={other_capex}
							fields={fields.other_capex}
							setOtherCapex={handleOptionChange}
							omitSection={omitSection}
						/>
					)}
					{drilling_cost && (
						<DrillingCost
							onSelect={onSelect}
							selected={selected}
							drilling_cost={drilling_cost}
							fields={fields.drilling_cost}
							setDrillingCost={handleOptionChange}
							omitSection={omitSection}
							AddDeleteDC={(value) => {
								setFields(genCategory(fields, 'drilling', value));
								toggleSection('drilling_cost', value);
							}}
						/>
					)}
					{completion_cost && (
						<CompletionCost
							onSelect={onSelect}
							selected={selected}
							completion_cost={completion_cost}
							fields={fields.completion_cost}
							omitSection={omitSection}
							setCompletionCost={handleOptionChange}
							AddDeleteCC={(value) => {
								setFields(genCategory(fields, 'completion', value));
								toggleSection('completion_cost', value);
							}}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
