import { forwardRef, useMemo } from 'react';

import ListSubMenu from '@/components/ListSubMenu';
import { Box, Divider, MenuButton, MenuIconButton } from '@/components/v2';
import { capitalize } from '@/helpers/text';

const ActionMenuButton = (props, ref) => {
	const {
		curSelection,
		description,
		disableLabel,
		exclusive = true,
		faIcon,
		items,
		label,
		leftMenuDirection,
		onClick,

		// TODO: map old props, adjust later
		small,
		purple,
		...rest
	} = props;

	const menuButtonProps = {
		placement: leftMenuDirection && 'left',
		size: small && 'small',
		color: purple ? 'purple' : undefined,
		...rest,
	};

	const itemsList = useMemo(
		() => (
			<>
				<ListSubMenu
					curSelection={curSelection}
					description={description}
					exclusive={exclusive}
					items={items}
					onClick={onClick}
				/>
				{!!description?.length && (
					<>
						<Divider />
						<Box
							marginTop='0.75rem'
							marginBottom='0.5rem'
							paddingX='0.75rem'
							minWidth='10rem'
							color='secondary'
						>
							{description}
						</Box>
					</>
				)}
			</>
		),
		[curSelection, description, exclusive, items, onClick]
	);

	return (
		<div ref={ref}>
			{disableLabel ? (
				<MenuIconButton {...menuButtonProps} icon={faIcon}>
					{itemsList}
				</MenuIconButton>
			) : (
				<MenuButton
					{...menuButtonProps}
					startIcon={faIcon}
					label={label || capitalize(curSelection.toString())}
				>
					{itemsList}
				</MenuButton>
			)}
		</div>
	);
};

export default forwardRef(ActionMenuButton);
