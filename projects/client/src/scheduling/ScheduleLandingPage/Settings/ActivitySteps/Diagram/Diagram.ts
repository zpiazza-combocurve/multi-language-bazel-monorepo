import { ActivityStep } from '@/inpt-shared/scheduling/shared';

const WARNING_COLOR = '#f44336';

export class Diagram {
	steps: ActivityStep[];
	hasCycle: boolean;

	constructor(steps: ActivityStep[], hasCyclicSteps: boolean) {
		this.steps = steps;
		this.hasCycle = hasCyclicSteps;
	}

	public build(): string {
		const items: string[] = [];

		this.steps.forEach((step: ActivityStep) => {
			items.push(this.getNode(step));
			items.push(this.getStyles(step));
		});
		items.push(this.getProductionNode());
		items.push(this.getProductionStyle());

		return ['flowchart LR', ...items, ...this.buildGraph()].join('\n;');
	}

	private buildGraph(): string[] {
		const invalidValues = ['', undefined];
		const stepsStructure = {};

		this.steps.forEach((step) => {
			const previousStepIdx = step.previousStepIdx.toString().split(',');

			previousStepIdx.forEach((stepIdx) => {
				if (invalidValues.includes(stepIdx)) return;

				if (stepsStructure[stepIdx]) {
					stepsStructure[stepIdx].push(step.stepIdx);
				} else {
					stepsStructure[stepIdx] = [step.stepIdx];
				}
			});
		});

		const items: string[] = [];
		const containsNext: number[] = [];
		Object.keys(stepsStructure).forEach((stepFrom) => {
			stepsStructure[stepFrom].forEach((stepTo) => {
				const from = this.steps.find(
					(value: ActivityStep) => value.stepIdx.toString() === stepFrom
				) as ActivityStep;
				const to = this.steps.find((value: ActivityStep) => value.stepIdx === stepTo) as ActivityStep;

				containsNext.push(from.stepIdx);
				items.push(`${from.stepIdx}${this.getConnection()}${to.stepIdx}`);
			});
		});

		this.steps.forEach((step: ActivityStep) => {
			if (containsNext.includes(step.stepIdx)) return;
			items.push(`${step.stepIdx}${this.getConnection()}Prod`);
		});

		return items;
	}

	private getConnection(): string {
		return '-->';
	}

	private getProductionNode(): string {
		return 'Prod([Production])';
	}

	private getProductionStyle(): string {
		return this.hasCycle ? `style Prod fill:${WARNING_COLOR},stroke:${WARNING_COLOR},stroke-width:1px` : '';
	}

	private getNode(step: ActivityStep): string {
		const stepDuration = step.stepDuration.days;
		const stepDurationLabelSuffix =
			stepDuration > 0 ? (stepDuration === 1 ? ` (${stepDuration} day)` : ` (${stepDuration} days)`) : '';

		return `${step.stepIdx}(["${step.name}${stepDurationLabelSuffix}"])`;
	}

	private getStyles(step: ActivityStep): string {
		return `style ${step.stepIdx} fill:${step.color}90,stroke:${step.color},stroke-width:1px`;
	}
}
