import { useEffect, useRef, useState } from 'react';

import { useCallbackRef } from '@/components/hooks';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { getHexColorForString } from '@/helpers/color';
import { isMac } from '@/helpers/utilities';

import { getFieldFromLookupByKey } from '../shared';

export const LookupRuleValueColumnHeaderComponent = (props) => {
	const { displayName, column } = props;
	const lookupByKey = column?.getColId();
	const [ascSort, setAscSort] = useState(false);
	const [descSort, setDescSort] = useState(false);
	const [noSort, setNoSort] = useState(false);
	const [isHovering, setIsHovering] = useState(false);
	const isMultiSorting = props.columnApi.getColumnState().filter((column) => !!column.sort).length > 1;

	const refButton = useRef(null);

	const onMenuClicked = () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		props.showColumnMenu(refButton.current!);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const onSortRequested = (event: any) => {
		const controlOrCommand = isMac ? event.metaKey : event.ctrlKey;
		props.progressSort(controlOrCommand);
		props.api.refreshHeader();
	};

	const onSortChanged = useCallbackRef(() => {
		setAscSort(!!props.column.isSortAscending());
		setDescSort(!!props.column.isSortDescending());
		setNoSort(!props.column.isSortAscending() && !props.column.isSortDescending());
	});

	useEffect(() => {
		props.column.addEventListener('sortChanged', onSortChanged);
		onSortChanged();
		return () => {
			props.column.removeEventListener('sortChanged', onSortChanged);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let menu: any = null;
	if (props.enableMenu && isHovering) {
		menu = (
			<div className='customHeaderMenuButton' onClick={() => onMenuClicked()}>
				<i className='ag-icon ag-icon-menu' />
			</div>
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let sort: any = null;
	if (props.enableSorting) {
		sort = (
			<div style={{ display: 'inline-block' }}>
				{ascSort && !noSort && (
					<div>
						<i className='ag-icon ag-icon-asc' />
					</div>
				)}
				{descSort && !noSort && (
					<div>
						<i className='ag-icon ag-icon-desc' />
					</div>
				)}
			</div>
		);
	}

	const field = lookupByKey ? getFieldFromLookupByKey(lookupByKey) : undefined;

	return (
		<span
			onMouseEnter={() => {
				setIsHovering(true);
			}}
			onMouseLeave={() => {
				setIsHovering(false);
			}}
			css={`
				align-items: center;
				display: flex;
				flex: 1;
				height: 100%;
				justify-content: space-between;
			`}
		>
			<div
				onClick={(e) => onSortRequested(e)}
				css={`
					align-items: center;
					display: flex;
					flex: 1;
					height: 100%;
				`}
			>
				{field && <ColoredCircle $color={getHexColorForString(field)} />}
				{displayName}
				{column?.sortIndex >= 0 && isMultiSorting && (
					<div
						css={`
							margin-left: 1rem;
						`}
					>
						{column?.sortIndex + 1}
					</div>
				)}
				{sort}
			</div>
			<div
				ref={refButton}
				css={`
					height: 1em;
					width: 1em;
				`}
			>
				{menu}
			</div>
		</span>
	);
};
