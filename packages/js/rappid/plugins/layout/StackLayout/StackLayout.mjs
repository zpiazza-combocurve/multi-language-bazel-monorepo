import { dia, g, util } from 'jointjs/src/core.mjs';

const Directions = {
    TopBottom: 'TB',
    BottomTop: 'BT',
    LeftRight: 'LR',
    RightLeft: 'RL'
};

const Alignments = {
    Start: 'start',
    Middle: 'middle',
    End: 'end'
};

const setAttributesDefault = (element, attributes, opt) => {
    const { size, position } = attributes;
    if (size) {
        const { width, height } = size;
        element.resize(width, height, opt);
    }
    if (position) {
        const { x, y } = position;
        element.position(x, y, opt);
    }
};

export const StackLayout = {

    Directions,

    Alignments,

    layout: function(model, options = {}) {

        const {
            direction = Directions.TopBottom,
            topLeft,
            bottomLeft,
            topRight,
            bottomRight,
            stackGap = 10,
            stackElementGap = 10,
            stackSize = 100,
            stackCount,
            setAttributes = setAttributesDefault,
            alignment = Alignments.Middle,
            stackIndexAttributeName = 'stackIndex',
            stackElementIndexAttributeName = 'stackElementIndex'
        } = options;

        let stackedElements;

        let elements;
        let graph;
        if (model instanceof dia.Graph) {
            elements = model.getElements();
            graph = model;
        } else {
            elements = model;
            if (elements[0]) {
                graph = elements[0].graph;
            }
        }

        if (stackCount) {
            stackedElements = Array(stackCount).fill(null).map(() => Array());
        } else {
            stackedElements = [];
        }

        elements.forEach(el => {
            const stIndex = el.get(stackIndexAttributeName) || 0;
            if (!stackedElements[stIndex])
                stackedElements[stIndex] = [];
            stackedElements[stIndex].push(el);
        });

        const isVertical = (direction === Directions.TopBottom || direction === Directions.BottomTop);
        const isHorizontal = (direction === Directions.LeftRight || direction === Directions.RightLeft);
        const stackNumber = stackedElements.length;
        let height;
        let width;
        if (isVertical) {
            height = stackedElements.reduce((value, st) => Math.max(value, st.reduce((h, el) => h + el.size().height, 0) + (st.length - 1) * stackElementGap), 0);
            width = stackNumber * stackSize + (stackNumber - 1) * stackGap;
        }
        if (isHorizontal) {
            width = stackedElements.reduce((value, st) => Math.max(value, st.reduce((h, el) => h + el.size().width, 0) + (st.length - 1) * stackElementGap), 0);
            height = stackNumber * stackSize + (stackNumber - 1) * stackGap;
        }

        const getBBox = () => {
            if (topLeft) {
                return new g.Rect(topLeft.x, topLeft.y, width, height);
            }
            if (topRight) {
                return new g.Rect(topRight.x - width, topRight.y, width, height);
            }
            if (bottomLeft) {
                return new g.Rect(bottomLeft.x, bottomLeft.y - height, width, height);
            }
            if (bottomRight) {
                return new g.Rect(bottomRight.x - width, bottomRight.y - height, width, height);
            }
            return new g.Rect(0, 0, width, height);
        };

        const bbox = getBBox();
        const stackPosition = bbox.topLeft();
        const stacks = [];
        for (let i = 0; i < stackedElements.length; i++) {
            stackedElements[i] = util.sortBy(stackedElements[i], el => el.get(stackElementIndexAttributeName) || 0);
            if (isVertical) {
                stacks.push({
                    bbox: new g.Rect(stackPosition.x, stackPosition.y, stackSize, height),
                    elements: stackedElements[i],
                    index: i
                });
                stackPosition.x += stackSize + stackGap;
            }
            if (isHorizontal) {
                stacks.push({
                    bbox: new g.Rect(stackPosition.x, stackPosition.y, width, stackSize),
                    elements: stackedElements[i],
                    index: i
                });
                stackPosition.y += stackSize + stackGap;
            }
        }

        if (graph)
            graph.startBatch('layout');
        for (let i = 0; i < stacks.length; i++) {
            const stack = stacks[i];
            if (stack.elements.length) {
                const elementPosition = stack.bbox.topLeft();
                if (direction === Directions.BottomTop)
                    elementPosition.y += stack.bbox.height;
                if (direction === Directions.RightLeft)
                    elementPosition.x += stack.bbox.width;
                stack.elements.forEach(el => {
                    const size = el.size();
                    if (direction === Directions.BottomTop)
                        elementPosition.y -= size.height;
                    if (direction === Directions.RightLeft)
                        elementPosition.x -= size.width;
                    // the element alignment within the stack
                    const position = elementPosition.toJSON();
                    switch (alignment) {
                        case Alignments.Middle: {
                            if (isVertical) {
                                position.x += (stackSize - size.width) / 2
                            } else {
                                position.y += (stackSize - size.height) / 2
                            }
                            break;
                        }
                        case Alignments.End: {
                            if (isVertical) {
                                position.x += stackSize - size.width;
                            } else {
                                position.y += stackSize - size.height;
                            }
                            break;
                        }
                    }
                    setAttributes(el, { position }, options);
                    // next element position
                    if (direction === Directions.BottomTop)
                        elementPosition.y -= stackElementGap;
                    if (direction === Directions.TopBottom)
                        elementPosition.y += size.height + stackElementGap;
                    if (direction === Directions.RightLeft)
                        elementPosition.x -= stackElementGap;
                    if (direction === Directions.LeftRight)
                        elementPosition.x += size.width + stackElementGap;
                });
            }
        }

        if (graph)
            graph.stopBatch('layout');

        return {
            bbox,
            stacks
        };
    }

}
