import {
	faGripHorizontal,
	faSortAlphaDown,
	faSortAlphaDownAlt,
	faSortAlphaUp,
	faTrashAlt,
} from '@fortawesome/pro-regular-svg-icons';
import { useCallback } from 'react';

import { ColoredCircle } from '@/components/misc';
import { IconButton } from '@/components/v2';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

const SelectedItem = (props) => {
	const {
		style,
		dropRef,
		item: { label, key, keyType, sortingOptions, withCircle, circleColor },
		dragRef,
		onSortPriorityChange,
		onDeleteItem,
		circleColor: _circleColor = projectCustomHeaderColor,
	} = props;

	const { priority, direction } = sortingOptions ?? {};

	const sortDirectionIcon = (direction) => {
		switch (direction) {
			case 'ASC':
				return faSortAlphaUp;
			case 'DESC':
				return faSortAlphaDownAlt;
			default:
				return faSortAlphaDown;
		}
	};

	const handleSortOrderChange = useCallback(() => {
		onSortPriorityChange(key);
	}, [onSortPriorityChange, key]);

	const handleDeleteItem = useCallback(() => {
		onDeleteItem(key, keyType);
	}, [onDeleteItem, key, keyType]);

	return (
		<div
			ref={dropRef}
			key={key}
			style={style}
			css={`
				display: flex;
				flex-direction: row;
				align-items: center;
				border-bottom: 1px solid #404040;
				padding: 0.5rem 0;
			`}
		>
			<div ref={dragRef}>
				<IconButton>{faGripHorizontal}</IconButton>
			</div>
			<div
				css={`
					margin-left: 0.5rem;
				`}
			>
				{withCircle && <ColoredCircle $color={circleColor ?? _circleColor} />}
				{label}
			</div>
			<div
				css={`
					margin-left: auto;
					display: flex;
					align-items: center;
				`}
			>
				<div
					css={`
						opacity: 0.7;
						background-color: ${priority != null ? '#404040' : 'transparent'};
						color: #fff;
						border-radius: 4px;
						display: flex;
						justify-content: center;
						align-items: center;
						width: 53px;
						height: 32px;
						padding-left: 10px;
						position: relative;

						> span {
							font-size: 1rem;
							font-weight: 700;
							margin-right: auto;
						}
					`}
				>
					<span>{priority != null ? priority + 1 : ''}</span>
					{onSortPriorityChange && (
						<IconButton
							onClick={handleSortOrderChange}
							css={`
								width: 48px;
								height: 48px;
								display: flex;
								justify-content: center;
								align-items: center;
								position: absolute;
								right: 0;
								transform: translateX(20%);

								:hover {
									background-color: transparent;
								}
							`}
						>
							{sortDirectionIcon(direction)}
						</IconButton>
					)}
				</div>
				<IconButton onClick={handleDeleteItem}>{faTrashAlt}</IconButton>
			</div>
		</div>
	);
};

export default SelectedItem;
