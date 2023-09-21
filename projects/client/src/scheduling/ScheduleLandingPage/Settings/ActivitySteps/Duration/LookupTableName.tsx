import { CellContent, ColoredCircle, getColor } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/shared';

export const LookupTableName = ({ name }: { name: string }) => {
	return (
		<CellContent
			css={`
				display: flex;
				align-items: center;
			`}
			title={name}
		>
			<ColoredCircle
				$color={getColor({
					isLookup: true,
					modelName: true,
					unique: false,
				})}
			/>
			<div>{name}</div>
		</CellContent>
	);
};
