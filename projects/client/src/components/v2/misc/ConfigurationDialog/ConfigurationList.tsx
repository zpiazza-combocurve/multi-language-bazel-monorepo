import { faStar, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { faStar as faStarFilled } from '@fortawesome/pro-solid-svg-icons';

// dependency cycle on List?
import { IconButton, ListItem, ListItemSecondaryAction, ListItemText } from '@/components/v2';

import { ConfigurationListProps } from './types';

/**
 * @example
 * 	import { ConfigurationList } from '@/components/v2/misc/ConfigurationDialog/ConfigurationList';
 *
 * 	<ConfigurationList
 * 		configurations={configurations}
 * 		deleteConfiguration={deleteConfiguration}
 * 		getConfigurationKey={getConfigurationName}
 * 		getConfigurationName={getConfigurationName}
 * 		isDefaultConfiguration={isDefaultConfiguration}
 * 		isDeleteDisabled={(c) => !canDeleteConfiguration(c)}
 * 		isLoading={isLoading}
 * 		isSelected={(c, index) => selectedIndex === index}
 * 		isSetDefaultDisabled={(c) => !canSetDefaultConfiguration(c)}
 * 		onSelect={onSelect}
 * 		setDefaultConfiguration={setDefaultConfiguration}
 * 	/>;
 */

export function ConfigurationList<T extends object>(props: ConfigurationListProps<T>) {
	const {
		configurations,
		deleteConfiguration,
		getConfigurationName,
		isDefaultConfiguration,
		isDeleteDisabled,
		isLoading,
		isSelected,
		isSetDefaultDisabled,
		onSelect,
		setDefaultConfiguration,
	} = props;
	const getConfigurationKey = props.getConfigurationKey ?? getConfigurationName;
	return (
		<ul
			css={`
				padding: 0;
				list-style-type: none;
				.MuiListItem-secondaryAction {
					padding-right: 6.5rem;
				}
				.MuiListItemText-root > .MuiTypography-displayBlock {
					text-overflow: ellipsis;
					overflow: hidden;
				}
			`}
		>
			{!isLoading &&
				configurations?.map((configuration, index) => (
					<ListItem
						id={getConfigurationKey(configuration, index)}
						key={getConfigurationKey(configuration, index)}
						button
						selected={isSelected(configuration, index)}
						onClick={() => onSelect(configuration, index)}
					>
						<ListItemText primary={getConfigurationName(configuration, index)} />
						<ListItemSecondaryAction>
							<IconButton
								onClick={(event) => {
									event.preventDefault();
									setDefaultConfiguration(
										isDefaultConfiguration(configuration) ? null : configuration
									);
								}}
								disabled={isSetDefaultDisabled?.(configuration, index)}
								tooltipTitle='Set Default'
							>
								{isDefaultConfiguration(configuration) ? faStarFilled : faStar}
							</IconButton>
							<IconButton
								color='error'
								disabled={
									(isDefaultConfiguration(configuration) && 'Cannot Delete Default Configuration') ||
									isDeleteDisabled?.(configuration, index)
								}
								onClick={(event) => {
									event.preventDefault();
									deleteConfiguration(configuration);
								}}
								tooltipTitle='Remove'
							>
								{faTrash}
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
				))}
		</ul>
	);
}

export default ConfigurationList;
