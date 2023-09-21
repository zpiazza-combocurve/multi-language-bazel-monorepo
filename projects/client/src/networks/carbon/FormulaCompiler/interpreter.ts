import { MathError } from './helpers';
import { AddNode, AnyNode, DivideNode, MinusNode, MultiplyNode, NumberNode, PlusNode, SubtractNode } from './nodes';

export class Interpreter {
	visit(node: AnyNode) {
		const fnName = `visit${node.constructor.name}`;
		const fn = this[fnName];
		if (fn) {
			return fn.call(this, node);
		}
		throw new Error(`No ${fnName} method defined`);
	}

	visitNumberNode(node: NumberNode) {
		return node.value;
	}

	visitAddNode(node: AddNode) {
		return this.visit(node.nodeA) + this.visit(node.nodeB);
	}

	visitSubtractNode(node: SubtractNode) {
		return this.visit(node.nodeA) - this.visit(node.nodeB);
	}

	visitMultiplyNode(node: MultiplyNode) {
		return this.visit(node.nodeA) * this.visit(node.nodeB);
	}

	visitDivideNode(node: DivideNode) {
		try {
			return this.visit(node.nodeA) / this.visit(node.nodeB);
		} catch (e) {
			throw new MathError(e);
		}
	}

	visitPlusNode(node: PlusNode) {
		return this.visit(node.node);
	}

	visitMinusNode(node: MinusNode) {
		return -this.visit(node.node);
	}
}
