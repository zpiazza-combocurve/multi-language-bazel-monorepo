export class NumberNode {
	constructor(public value: string) {
		this.value = value;
	}

	toString() {
		return `[${this.value}]`;
	}
}

export class AddNode {
	constructor(public nodeA: AnyNode, public nodeB: AnyNode) {
		this.nodeA = nodeA;
		this.nodeB = nodeB;
	}

	toString() {
		return `[${this.nodeA}+${this.nodeB}]`;
	}
}

export class SubtractNode {
	constructor(public nodeA: AnyNode, public nodeB: AnyNode) {
		this.nodeA = nodeA;
		this.nodeB = nodeB;
	}

	toString() {
		return `[${this.nodeA}-${this.nodeB}]`;
	}
}

export class MultiplyNode {
	constructor(public nodeA: AnyNode, public nodeB: AnyNode) {
		this.nodeA = nodeA;
		this.nodeB = nodeB;
	}

	toString() {
		return `[${this.nodeA}*${this.nodeB}]`;
	}
}

export class DivideNode {
	constructor(public nodeA: AnyNode, public nodeB: AnyNode) {
		this.nodeA = nodeA;
		this.nodeB = nodeB;
	}

	toString() {
		return `[${this.nodeA}/${this.nodeB}]`;
	}
}

export class PlusNode {
	constructor(public node: AnyNode) {
		this.node = node;
	}

	toString() {
		return `[+${this.node}]`;
	}
}

export class MinusNode {
	constructor(public node: AnyNode) {
		this.node = node;
	}

	toString() {
		return `[-${this.node}]`;
	}
}

export class StreamNode {
	constructor(public node: string) {
		this.node = node;
	}

	toString() {
		return `[${this.node}]`;
	}
}

export class FunctionCallNode {
	constructor(public function_handle: string, public functionInputNode: NumberNode) {
		this.function_handle = function_handle;
		this.functionInputNode = functionInputNode;
	}

	toString() {
		return `[${this.function_handle}(${this.functionInputNode})]`;
	}
}

export type AnyNode = NumberNode | AddNode | SubtractNode | MultiplyNode | DivideNode | FunctionCallNode | StreamNode;
