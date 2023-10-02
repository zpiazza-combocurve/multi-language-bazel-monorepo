import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

type IValidation<T> = (input: T) => void;

class ChainNode<T> {
	public next: ChainNode<T> | null = null;
	public value: T;

	constructor(value: T) {
		this.value = value;
	}
}

export class ValidationChain<T> {
	private Head: ChainNode<IValidation<T>>;
	private Tail: ChainNode<IValidation<T>>;

	constructor(validation: IValidation<T>) {
		this.Head = new ChainNode<IValidation<T>>(validation);
		this.Tail = this.Head;
	}

	validate(input: T, chosenID: string | undefined = undefined, keepWhenFail = false): ValidationErrorAggregator {
		let current: ChainNode<IValidation<T>> | null = this.Head;

		const output = new ValidationErrorAggregator();
		output.setChosenId(chosenID);

		while (current !== null) {
			output.catch(() => current!.value(input));
			current = current.next;

			if (keepWhenFail) {
				continue;
			}

			if (output.hasErrors()) {
				break;
			}
		}

		return output;
	}

	setNext(validation: IValidation<T>): void {
		const node = new ChainNode<IValidation<T>>(validation);
		this.Tail.next = node;
		this.Tail = node;
	}
}
