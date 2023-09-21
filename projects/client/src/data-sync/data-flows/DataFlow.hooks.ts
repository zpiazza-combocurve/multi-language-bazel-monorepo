import { faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { isAfter, parseISO, subHours } from 'date-fns';

export const calculateCondition = ({ data }) => {
	const warnPayload = { title: 'Unprocessed data flow', color: 'orange', icon: faExclamationTriangle };
	const nextStartsAt = data?.dataFlowSchedule?.nextRunStartsAt
		? parseISO(data?.dataFlowSchedule?.nextRunStartsAt)
		: undefined;
	const currentStartsAt = data?.dataFlowSchedule?.currentRunStartedAt
		? parseISO(data?.dataFlowSchedule?.currentRunStartedAt)
		: undefined;
	const now = new Date();
	const errorCondtion =
		(!!data.dataFlowSchedule && !nextStartsAt) ||
		(nextStartsAt && isAfter(nextStartsAt, now) && currentStartsAt && isAfter(currentStartsAt, subHours(now, 24)));
	const warnCondition = isAfter(nextStartsAt as Date, now) && !currentStartsAt;
	if (errorCondtion) {
		const errorPayload = { title: 'Invalid schedule configuration', color: 'red', icon: faExclamationTriangle };
		return errorPayload;
	} else if (warnCondition) {
		return warnPayload;
	} else {
		return null;
	}
};
