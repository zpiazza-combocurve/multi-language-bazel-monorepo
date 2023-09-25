from combocurve.shared.progress_notifier import PusherChannel, ProgressNotifier


def batch_updates_with_progress(context,
                                batch_count,
                                data_iterator,
                                update_generator,
                                db_updater,
                                notification_id=None,
                                user_id=None):
    run_notification = notification_id and user_id
    try:
        updates = []
        progress_notifier = None
        if run_notification:
            progress_notifier = ProgressNotifier(context.pusher, notification_id, context.subdomain, user_id,
                                                 PusherChannel.USER)
        for i, data in enumerate(data_iterator):
            updates += update_generator(data)
            if len(updates) >= batch_count:
                db_updater(updates)
                updates = []

            if run_notification:
                progress = int(100 * (i + 1) / len(data_iterator))
                progress_notifier.notify(progress)

        db_updater(updates)
        notification_status = 'complete'
        notification_description = 'Completed'
    except Exception as e:
        notification_status = 'failed'
        notification_description = 'Failed'
        raise e
    finally:
        if run_notification:
            context.notification_service.update_notification_with_notifying_target(
                notification_id, {
                    'status': notification_status,
                    'description': notification_description
                })
