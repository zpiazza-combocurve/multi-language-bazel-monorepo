import { Typography } from '@material-ui/core';
import _ from 'lodash';
import { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { unstable_useBlocker as useBlocker, useLocation } from 'react-router-dom';

import { useLocalStorageState } from '@/components/hooks';
import { CheckboxField } from '@/components/v2';
import { withDialog } from '@/helpers/dialog';
import { getCurrentTheme } from '@/helpers/theme';
import { ActivityStep, Resource } from '@/inpt-shared/scheduling/shared';

import { PromptGenericDialog } from './ScheduleLandingPage/components/GenericDialog/GenericDialog';

const genericDialog = withDialog(PromptGenericDialog);

const SHOW_LEAVING_MESSAGE_KEY = 'SCHEDULE_CACHE_SHOW_LEAVING_MESSAGE';

type Cache = {
	resources?: Resource[];
	activitySteps?: ActivityStep[];
};

type CacheContextType = {
	cache: {
		resources?: Resource[];
		activitySteps?: ActivityStep[];
	};
	clearCache: () => void;
	setCacheEntry: (key: 'resources' | 'activitySteps', value: Resource[] | ActivityStep[]) => void;
	setPersistedData: (data: Cache) => void;
	hasUnsavedWork: boolean;
};

const CacheContext = createContext<CacheContextType>({} as CacheContextType);

const LeaveSchedulingModal = forwardRef(({ initialValue }: { initialValue: boolean }, ref) => {
	const [doNotShowLeaveModal, setDoNotShowLeaveModal] = useState(initialValue);

	const handleContinue = (setShowLeavingMessage) => {
		setShowLeavingMessage(!doNotShowLeaveModal);
	};

	useImperativeHandle(ref, () => ({
		handleContinue,
	}));

	return (
		<>
			<Typography>Are you sure you want to leave Scheduling module?</Typography>
			<CheckboxField
				checked={doNotShowLeaveModal}
				onChange={(ev) => setDoNotShowLeaveModal(ev.target.checked)}
				css={`
					margin-top: 16px;
				`}
				label="Don't show this message again"
			/>
		</>
	);
});

export function CacheProvider({ children }) {
	const theme = getCurrentTheme();
	const [showLeavingMessage, setShowLeavingMessage] = useLocalStorageState<boolean>(SHOW_LEAVING_MESSAGE_KEY, true);

	const [persistedData, setPersistedData] = useState<Cache>({});
	const [cache, setCache] = useState<Cache>({});

	const hasUnsavedWork = useMemo(() => {
		const activitySteps = cache?.activitySteps
			? !_.isEqual(persistedData?.activitySteps, cache.activitySteps)
			: false;
		const resources = cache?.resources ? !_.isEqual(persistedData?.resources, cache.resources) : false;

		return activitySteps || resources;
	}, [cache, persistedData]);

	const blocker = useBlocker(hasUnsavedWork);
	const location = useLocation();

	const clearCache = useCallback(() => setCache({}), [setCache]);

	const setCacheEntry = useCallback(
		(key, value) => {
			setCache((prevCache: Cache) => ({ ...prevCache, [key]: value }));
		},
		[setCache]
	);

	const handleLeaveScheduling = useCallback(async () => {
		return genericDialog({
			title: 'Leave Scheduling Module',
			disableMinHeight: true,
			children: <LeaveSchedulingModal initialValue={!showLeavingMessage} />,
			actions: [
				{
					key: 'cancel',
					children: 'Cancel',
					variant: 'text',
					color: 'secondary',
					value: false,
				},
				{
					key: 'continue',
					children: 'Continue',
					variant: 'contained',
					color: 'secondary',
					value: true,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					getOnClickFunction: (ref: any) => {
						ref.current?.handleContinue(setShowLeavingMessage);
					},
					shouldResolve: true,
					style: { color: theme.background },
				},
			],
		});
	}, [showLeavingMessage, theme.background, setShowLeavingMessage]);

	useEffect(() => {
		const pathFrom = location.pathname;
		const pathTo = blocker.location ? blocker.location.pathname : '';
		const isInsideScheduling = pathFrom.includes('schedules') && pathTo.includes('schedules');

		if (isInsideScheduling || !showLeavingMessage) {
			blocker.proceed?.();
		} else if (!isInsideScheduling && hasUnsavedWork && blocker.state === 'blocked') {
			handleLeaveScheduling().then((success) => {
				if (success) {
					blocker.proceed?.();
				} else {
					blocker.reset?.();
				}
			});
		}
	}, [hasUnsavedWork, blocker, location.pathname, handleLeaveScheduling, showLeavingMessage]);

	return (
		<CacheContext.Provider
			value={useMemo(
				() => ({
					cache,
					clearCache,
					setCacheEntry,
					setPersistedData,
					hasUnsavedWork,
				}),
				[cache, clearCache, setCacheEntry, hasUnsavedWork, setPersistedData]
			)}
		>
			{children}
		</CacheContext.Provider>
	);
}

export default CacheContext;
