import { faStar } from '@fortawesome/pro-solid-svg-icons';

import { Icon } from '@/components/v2';
import CCLogo from '@/economics/exports/CSVExportDialog/Sidebar/ConfigurationNameWithLogo/CCLogo';
import { isSuggestedTemplate as isSuggestedCSVTemplate } from '@/economics/exports/CSVExportDialog/Sidebar/helpers';
import { isSuggestedTemplate as isSuggestedPDFTemplate } from '@/economics/exports/PDFExportDialog/shared/helpers';

export { CCLogo };

export const REQUIRE_ECON_RUN_TOOLTIP = 'Run Economics to enable this button';
export const REQUIRE_FULL_ECON_RUN_TOOLTIP = 'Run Economics in "Full" mode to enable this button';
export const REQUIRE_GHG_RUN_TOOLTIP = 'Run GHG to enable this button';

export const findDefault = (defaultConfig, templates) => templates?.find((c) => c._id === defaultConfig?._id);

export const typeToLabel = (type) =>
	({
		oneLiner: 'Well Oneline',
		'cashflow-csv': 'Well Cashflow',
		'cashflow-agg-csv': 'Aggregate Cashflow',
		'cashflow-pdf': 'Well Cashflow',
		'cashflow-agg-pdf': 'Aggregate Cashflow',
	}[type]);

export function isSuggestedTemplate(template) {
	return isSuggestedCSVTemplate(template) || isSuggestedPDFTemplate(template);
}

export function defaultTemplateFormatter(menuItem) {
	return {
		...menuItem,
		label: (
			<span
				css={`
					display: inline-flex;
					align-items: center;
				`}
			>
				{menuItem.label}
				<Icon
					fontSize='small'
					css={`
						margin-left: 0.5rem;
					`}
				>
					{faStar}
				</Icon>
			</span>
		),
	};
}
