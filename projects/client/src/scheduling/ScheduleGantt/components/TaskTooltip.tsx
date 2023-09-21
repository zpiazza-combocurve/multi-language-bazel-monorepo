// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
// @ts-nocheck
import { DateHelper, StringHelper } from '@bryntum/gantt';

export class TaskTooltip {
	public template(data) {
		const { taskRecord } = data;
		const displayDuration = this.client.formatDuration(data.taskRecord.duration);
		const durationText = `${displayDuration}
      ${DateHelper.getLocalizedNameOfUnit(taskRecord.durationUnit, taskRecord.duration !== 1)}`;

		return `
      ${taskRecord.name ? `<div class="b-gantt-task-title">${StringHelper.encodeHtml(taskRecord.name)}</div>` : ''}
      <table>

      <tr><td>${
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.L('L{Start}')
		}:</td><td>${data.startClockHtml}</td></tr>
      ${
			taskRecord.milestone
				? ''
				: `
          <tr><td>${
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.L('L{End}')
			}:</td><td>${data.endClockHtml}</td></tr>
          <tr><td>${
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.L('L{Duration}')
			}:</td><td class="b-right">${durationText}</td></tr>
      `
		}
      </table>
      `;
	}
}
