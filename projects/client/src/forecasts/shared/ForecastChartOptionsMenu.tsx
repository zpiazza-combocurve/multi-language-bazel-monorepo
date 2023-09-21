import { faCog } from '@fortawesome/pro-regular-svg-icons';

import { MenuButton, MenuIconButton } from '@/components/v2';

export default function ForecastChartOptionsMenu(props) {
	const {
		btnIcon = faCog,
		children,
		disableLabel,
		label,
		labelTooltip = 'Options',
		leftMenuDirection,
		placement = 'left',
		primary,
		small,
		...rest
	} = props;

	const menuButtonProps = {
		color: primary ? 'primary' : 'secondary',
		placement: leftMenuDirection ? 'left-start' : 'bottom-start',
		size: small && 'small',
		tooltipPlacement: placement,
		tooltipTitle: labelTooltip,
		...rest,
	};

	return (
		<div>
			{disableLabel ? (
				<MenuIconButton {...menuButtonProps} icon={btnIcon}>
					{children}
				</MenuIconButton>
			) : (
				<MenuButton {...menuButtonProps} label={label}>
					{children}
				</MenuButton>
			)}
		</div>
	);
}
