import styled from 'styled-components';

import DisplayHeader from '@/components/DisplayHeader';
import { RowContentLoader } from '@/components/RowLoader';
import { theme } from '@/helpers/styled';
import { AssumptionKey } from '@/inpt-shared/constants';
import { ownershipFormatter, reservesCategoryFormatter } from '@/inpt-shared/econ-models/formatters';
import { EMPTY, LOADING } from '@/tables/Table/useAsyncRows';

export const DEFAULT_COLUMN_OPTIONS = { resizable: true, minWidth: 150 };
export const ROW_HEIGHT = 40;
export const ROW_HEADER_HEIGHT = ROW_HEIGHT * 2;
export const CEll_INPUT_HEIGHT = ROW_HEIGHT - 5;

// header => 'N/A'; assumption => 'None'
export const EMPTY_VALUE_TEXT = 'None';
const EMPTY_VALUE_TEXT_HEADER = 'N/A';

export const CHOOSE_MODEL = 'Choose Model';
export const REMOVE_ASSIGNMENT = 'Remove Assignment';

export const NOT_MODELS = [CHOOSE_MODEL, REMOVE_ASSIGNMENT];

export const CellContent = styled.div`
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
	overflow: hidden;
	text-overflow: ellipsis;
	padding: 0 8px;
`;

const ownershipFormatterFixed = (value) => ownershipFormatter(value, 2);

export function getModelData({ assumption, assumptionKey }) {
	if (typeof assumption === 'string') {
		const empty = assumption === EMPTY;
		return [null, empty ? null : assumption];
	}
	const [modelId, modelName, unique, isLookup] = (() => {
		const { model, lookup, tcLookup } = assumption || {};
		const { name, unique: modelIsUnique, _id } = model || lookup || tcLookup || {};
		return [_id, name ?? model, modelIsUnique, !!(lookup || tcLookup)];
	})();

	const formattedModelName = {
		[AssumptionKey.reservesCategory]: reservesCategoryFormatter,
		[AssumptionKey.ownershipReversion]: ownershipFormatterFixed,
	}?.[assumptionKey]?.(assumption);

	return [modelId, formattedModelName || modelName, unique, isLookup];
}

export function getColor({ unique, modelName, isLookup }) {
	switch (true) {
		case unique:
			return theme.purpleColor;
		case !modelName:
			return theme.warningAlternativeColor;
		case isLookup:
			return theme.secondaryColor;
		default:
			return theme.primaryColor;
	}
}

const SIZE = '0.7rem';

export const ColoredCircle = styled.div<{ $color }>`
	flex: 0 0 auto;
	display: inline-block;
	margin-right: 0.5rem;
	height: ${SIZE};
	width: ${SIZE};
	background-color: ${({ $color }) => $color};
	border-radius: 50%;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function ValueFormatter({ type, id, value }: { type: 'header' | 'assumption'; id?: string; value: any }) {
	const loading = value === LOADING || value === undefined;
	const empty = value === EMPTY; // || value === '' || value === null || value === undefined;
	const emptyText = type === 'header' ? EMPTY_VALUE_TEXT_HEADER : EMPTY_VALUE_TEXT;

	const [name, indicator, title] = (() => {
		if (type === 'assumption') {
			const [, modelName, unique, isLookup] = getModelData({ assumption: value, assumptionKey: id });
			return [
				modelName,
				!loading && (
					<ColoredCircle
						$color={getColor({
							isLookup,
							modelName,
							unique,
						})}
					/>
				),
				modelName,
			];
		}
		return [<DisplayHeader key={id} header={id} value={value} />, null];
	})();

	const displayValue = (() => {
		if (loading) {
			return <RowContentLoader width={DEFAULT_COLUMN_OPTIONS.minWidth - 32} height={ROW_HEIGHT} />; // TODO: 32 equals cell padding
		}
		if (empty) {
			return emptyText;
		}

		return name || emptyText;
	})();

	return (
		<CellContent
			css={`
				display: flex;
				align-items: center;
			`}
			title={title}
		>
			{indicator}
			<div>{displayValue}</div>
		</CellContent>
	);
}
