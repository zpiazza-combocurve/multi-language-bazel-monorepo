import { List } from '@/components/v2';

import NotificationListItem from './NotificationListItem';
import Notification, { NotificationType } from './notification';
import styles from './notifications.module.scss';

const NotificationsList = ({
	items,
	onToggleNotificationReadFlag,
	onHideDynamic,
	onDownloadOutput,
}: {
	items: Notification[];
	onToggleNotificationReadFlag: (id: string) => void;
	onHideDynamic?: (id: string, close: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDownloadOutput?: (type: NotificationType, extra: any) => any;
}) => {
	return (
		<List className={styles['notifications-list']}>
			{items.map((item) => {
				return (
					<NotificationListItem
						key={item.id}
						item={item}
						onToggleNotificationReadFlag={onToggleNotificationReadFlag}
						onHideDynamic={onHideDynamic}
						onDownloadOutput={onDownloadOutput}
					/>
				);
			})}
		</List>
	);
};

export default NotificationsList;
