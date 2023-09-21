export enum SchedulingStatus {
	not_started = 'not_started',
	permitted = 'permitted',
	pad_prepared = 'pad_prepared',
	spudded = 'spudded',
	drilled = 'drilled',
	completed = 'completed',
	producing = 'producing',
}

export const SCHEDULING_STATUS_LABELS: Record<SchedulingStatus, string> = {
	[SchedulingStatus.not_started]: 'Not Started',
	[SchedulingStatus.permitted]: 'Permitted',
	[SchedulingStatus.pad_prepared]: 'Pad Prepared',
	[SchedulingStatus.spudded]: 'Spudded',
	[SchedulingStatus.drilled]: 'Drilled',
	[SchedulingStatus.completed]: 'Completed',
	[SchedulingStatus.producing]: 'Producing',
};

export const SCHEDULING_STATUS_OPTIONS: SchedulingStatus[] = [
	SchedulingStatus.not_started,
	SchedulingStatus.permitted,
	SchedulingStatus.pad_prepared,
	SchedulingStatus.spudded,
	SchedulingStatus.drilled,
	SchedulingStatus.completed,
	SchedulingStatus.producing,
];
