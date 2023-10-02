import Backbone from 'backbone';
import { StackLayout } from './StackLayout.mjs';

export class StackLayoutModel extends Backbone.Model {

    constructor(options) {
        super(options);
        this.update();
    }

    defaults() {
        return {
            stackGap: 10,
            stackElementGap: 10,
            direction: StackLayout.Directions.TopBottom,
            stackIndexAttributeName: 'stackIndex',
            stackElementIndexAttributeName: 'stackElementIndex'
        };
    }

    update() {
        const layoutResult = StackLayout.layout(this.elements, this.attributes);
        this.bbox = layoutResult.bbox;
        this.stacks = layoutResult.stacks;
        this.trigger('update');
    }

    getStackFromPoint(point) {
        for (let i = 0; i < this.stacks.length; i++) {
            const st = this.stacks[i];
            const { bbox } = st;
            if (this.direction === StackLayout.Directions.BottomTop || this.direction === StackLayout.Directions.TopBottom) {
                if (point.x >= bbox.x && point.x < bbox.x + bbox.width) {
                    return st;
                }
            }
            if (this.direction === StackLayout.Directions.RightLeft || this.direction === StackLayout.Directions.LeftRight) {
                if (point.y >= bbox.y && point.y < bbox.y + bbox.height) {
                    return st;
                }
            }
        }
        return null;
    }

    getInsertElementIndexFromPoint(stack, point) {
        const { elements: stackElements } = stack;
        const stackLength = stackElements.length;

        if (stackLength === 0)
            return 0;

        switch (this.direction) {
            case StackLayout.Directions.TopBottom: {
                for (let i = 0; i < stackLength; i++) {
                    const el = stackElements[i];
                    const elYCenter = el.position().y + el.size().height / 2;
                    if (point.y < elYCenter) {
                        return i;
                    }
                }
                return stackLength;
            }
            case StackLayout.Directions.BottomTop: {
                for (let i = 0; i < stackLength; i++) {
                    const el = stackElements[i];
                    const elYCenter = el.position().y + el.size().height / 2;
                    if (point.y > elYCenter) {
                        return i;
                    }
                }
                return stackLength;
            }
            case StackLayout.Directions.LeftRight:
                for (let i = 0; i < stackLength; i++) {
                    const el = stackElements[i];
                    const elXCenter = el.position().x + el.size().width / 2;
                    if (point.x < elXCenter) {
                        return i;
                    }
                }
                return stackLength;
            case StackLayout.Directions.RightLeft:
                for (let i = 0; i < stackLength; i++) {
                    const el = stackElements[i];
                    const elXCenter = el.position().x + el.size().width / 2;
                    if (point.x > elXCenter) {
                        return i;
                    }
                }
                return stackLength;
        }
    }

    getStackFromElement(element) {
        return this.stacks[element.get(this.stackIndexAttributeName)];
    }

    hasElement(element) {
        return element.has(this.stackIndexAttributeName);
    }

    insertElement(element, targetStackIndex, insertElementIndex, opt) {

        const graph = this.get('graph');
        graph.startBatch('stack-layout-insert');

        if (!graph.getCell(element)) {
            graph.addCell(element, opt);
        }

        const { stackIndexAttributeName,  stackElementIndexAttributeName } = this;
        const targetStack = this.stacks[targetStackIndex];

        let targetElementIndex;
        if (targetStack) {
            const { elements } = targetStack;
            const targetElement = elements[insertElementIndex];
            const { length: elementsCount } = elements;
            if (targetElement) {
                targetElementIndex = targetElement.get(stackElementIndexAttributeName);
                for (let i = insertElementIndex; i < elementsCount; i++) {
                    const el = elements[i];
                    const elIndex = el.get(stackElementIndexAttributeName) || 0;
                    el.set(stackElementIndexAttributeName, elIndex + 1, opt);
                }
            } else {
                if (elementsCount > 0) {
                    const lastElement = elements[elements.length - 1];
                    const lastElementIndex = lastElement.get(stackElementIndexAttributeName) || 0;
                    targetElementIndex = lastElementIndex + 1;
                } else {
                    targetElementIndex = 0;
                }
            }
        } else {
            targetElementIndex = 0;
        }

        element.set({
            [stackIndexAttributeName]: targetStackIndex,
            [stackElementIndexAttributeName]: targetElementIndex
        }, opt);

        this.update();
        graph.stopBatch('stack-layout-insert');
    }

    get elements() {
        const graph = this.get('graph');
        return graph.getElements().filter(el => el.has(this.stackIndexAttributeName));
    }

    get direction() {
        return this.get('direction');
    }

    get stackIndexAttributeName() {
        return this.get('stackIndexAttributeName');
    }

    get stackElementIndexAttributeName() {
        return this.get('stackElementIndexAttributeName');
    }
}
