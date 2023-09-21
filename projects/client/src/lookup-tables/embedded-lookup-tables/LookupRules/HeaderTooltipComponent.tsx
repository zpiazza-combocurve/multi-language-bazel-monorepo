import { InfoTooltipWrapper } from '@/components/v2';

export const HeaderTooltipComponent = ({ displayName }) => (
	<InfoTooltipWrapper
		tooltipTitle={
			<div>
				{`Sorting Tip: Click on any item's text in the row below (Headers or Lookup Items) to sort by that
				column. Click once for A-Z, again for Z-A and a third time to clear sorting. "Reset Columns" in the menu
				button clears to default.`}
				<br />
				<br />
				Pro Tip: Hold down control to select hierarchical sorting.
			</div>
		}
		placeIconAfter
	>
		{displayName}
	</InfoTooltipWrapper>
);
