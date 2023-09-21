/*
 * Code extracted from bryntum\lib\Engine\quark\model\scheduler_pro\SchedulerProResourceMixin.ts
 */
import {
	AssignmentAllocationInterval,
	ResourceAllocationInfo as BryntumResourceAllocationInfo,
	ResourceAllocationEventRangeCalendar,
	ResourceAllocationInterval,
} from '@bryntum/gantt';

export class ResourceAllocationInfo extends BryntumResourceAllocationInfo {
	*calculateAllocation() {
		const total = [];
		const ticksCalendar = yield this.ticks;
		const resource = yield this.$.resource;
		const assignments = yield resource.$.assigned;
		const calendar = yield resource.$.effectiveCalendar;
		const assignmentsByCalendar = new Map();
		const eventRanges = [];
		const assignmentTicksData = new Map();

		let hasIgnoreResourceCalendarEvent = false;

		// collect the resource assignments into assignmentsByCalendar map
		for (const assignment of assignments) {
			// skip missing or unscheduled event assignments
			if (!(yield* this.shouldIncludeAssignmentInAllocation(assignment))) continue;
			// we're going to need up-to-date assignment "units" below in this method ..so we yield it here
			yield assignment.$.units;

			const event = yield assignment.$.event;
			const ignoreResourceCalendar = yield event.$.ignoreResourceCalendar;
			const startDate = yield event.$.startDate;
			const endDate = yield event.$.endDate;
			const segments = yield event.$.segments;
			const eventCalendar = yield event.$.effectiveCalendar;

			// Decreasing one hour for cases when the timezone changes and the start date is 1:00 instead of 00:00
			if (startDate.getHours() === 1) {
				startDate.setHours(startDate.getHours() - 1);
			}
			// Decreasing two hours for cases when the timezone changes and the end date is 1:00 instead of 23:00
			if (endDate.getHours() === 1) {
				endDate.setHours(endDate.getHours() - 2);
			}

			hasIgnoreResourceCalendarEvent = hasIgnoreResourceCalendarEvent || ignoreResourceCalendar;
			// if the event is segmented collect segment ranges
			if (segments) {
				for (const segment of segments) {
					const startDate = yield segment.$.startDate;
					const endDate = yield segment.$.endDate;
					eventRanges.push({ startDate, endDate, assignment });
				}
			} else {
				eventRanges.push({ startDate, endDate, assignment });
			}

			let assignments = assignmentsByCalendar.get(eventCalendar);

			if (!assignments) {
				assignments = [];
				assignmentsByCalendar.set(eventCalendar, assignments);
			}

			assignmentTicksData.set(assignment, new Map());
			assignments.push(assignment);
		}

		const eventRangesCalendar = new ResourceAllocationEventRangeCalendar({
			intervals: eventRanges,
		});

		// Provide extra calendars:
		// 1) a calendar containing list of ticks to group the resource allocation by
		// 2) a calendar containing list of assigned event start/end ranges
		// 3) assigned task calendars
		const calendars = [ticksCalendar, eventRangesCalendar, ...assignmentsByCalendar.keys()];
		const ticksData = new Map();

		// Initialize the resulting array with empty items
		// Beginning of refactored section from Bryntum
		ticksCalendar.intervalStore.forEach((tick) => {
			const tickData = ResourceAllocationInterval.new({ tick, resource });

			ticksData.set(tick, tickData);
			total.push(tickData);
		});

		assignmentTicksData.forEach((_ticksData, assignment) => {
			const event = assignment?.event;
			const eventStartDate = event.startDate;
			const evenEndDate = event.endDate;

			const overlap = (tick) =>
				eventStartDate.getTime() <= tick.endDate.getTime() && tick.startDate.getTime() <= evenEndDate.getTime();

			const filteredTicks = ticksCalendar.intervalStore.storage._values.filter(overlap);
			filteredTicks.forEach((tick) => {
				const assignmentTickData = AssignmentAllocationInterval.new({
					tick,
					assignment,
				});
				_ticksData.set(tick, assignmentTickData);
			});
		});
		// End of refactored section from Bryntum

		let weightedUnitsSum, weightsSum;

		const startDate = total[0].tick.startDate,
			endDate = total[total.length - 1].tick.endDate,
			iterationOptions = {
				startDate,
				endDate,
				calendars,
				includeNonWorkingIntervals: hasIgnoreResourceCalendarEvent,
			},
			ticksTotalDuration = endDate.getTime() - startDate.getTime();

		// provide extended maxRange if total ticks duration is greater than it
		if (ticksTotalDuration > resource.getProject().maxCalendarRange) {
			iterationOptions.maxRange = ticksTotalDuration;
		}

		yield* resource.forEachAvailabilityInterval(
			iterationOptions,
			(intervalStartDate, intervalEndDate, intervalData) => {
				const isWorkingCalendar = intervalData.getCalendarsWorkStatus();
				// We are inside a tick interval and it's a working time according
				// to a resource calendar
				if (isWorkingCalendar.get(ticksCalendar)) {
					const tick = intervalData.intervalsByCalendar.get(ticksCalendar)[0],
						intervalDuration = intervalEndDate.getTime() - intervalStartDate.getTime(),
						tickData = ticksData.get(tick),
						tickAssignments = tickData.assignments || new Set(),
						tickAssignmentIntervals = tickData.assignmentIntervals || new Map();

					if (!tickData.assignments) {
						weightedUnitsSum = 0;
						weightsSum = 0;
					}
					let units = 0,
						intervalHasAssignments = false,
						duration;

					// for each event intersecting the interval
					intervalData.intervalsByCalendar.get(eventRangesCalendar).forEach((interval) => {
						const assignment = interval.assignment;
						// TODO:
						// We don't do yield "assignment.event.*" expressions since we did it previously
						// while looping the assignments because we cannot yield from the iterator callback
						const event = assignment === null || assignment === void 0 ? void 0 : assignment.event;
						// if event is performing in the interval
						if (
							event &&
							isWorkingCalendar.get(event.effectiveCalendar) &&
							(!hasIgnoreResourceCalendarEvent ||
								event.ignoreResourceCalendar ||
								isWorkingCalendar.get(calendar))
						) {
							// constrain the event start/end with the tick borders
							const workingStartDate = Math.max(
								intervalStartDate.getTime(),
								assignment.event.startDate.getTime()
							);
							const workingEndDate = Math.min(
								intervalEndDate.getTime(),
								assignment.event.endDate.getTime()
							);
							intervalHasAssignments = true;
							duration = workingEndDate - workingStartDate;

							const assignmentInterval = assignmentTicksData.get(assignment).get(tick);
							const assignmentEffort = (duration * assignment.units) / 100;
							assignmentInterval.effort += assignmentEffort;
							assignmentInterval.units = assignment.units;
							tickData.effort += assignmentEffort;

							// collect total resource usage percent in the current interval
							units += assignment.units;
							tickAssignments.add(assignment);
							tickAssignmentIntervals.set(assignment, assignmentInterval);
						}
					});
					// maxEffort represents the resource calendar intervals
					if (isWorkingCalendar.get(calendar)) {
						tickData.maxEffort += intervalDuration;
					}

					// rounding to avoid scenarios like 100.00000001
					units = Math.round(units);
					tickData.effort = Math.round(tickData.effort);

					// if we have assignments running in the interval - calculate average allocation %
					if (units) {
						if (duration) {
							// keep weightedUnitsSum & weightsSum since there might be another intervals in the tick
							weightedUnitsSum += duration * units;
							weightsSum += duration;
							// "units" weighted arithmetic mean w/ duration values as weights
							tickData.units = weightedUnitsSum / weightsSum;
						} else if (!weightedUnitsSum) {
							tickData.units = units;
						}
					}
					if (intervalHasAssignments) {
						tickData.assignments = tickAssignments;
						tickData.assignmentIntervals = tickAssignmentIntervals;
						tickData.isOverallocated =
							tickData.isOverallocated || tickData.effort > tickData.maxEffort || tickData.units > 100;
						tickData.isUnderallocated = tickData.effort < tickData.maxEffort || tickData.units < 100;
					}
				}
			}
		);

		return {
			total,
		};
	}
}
