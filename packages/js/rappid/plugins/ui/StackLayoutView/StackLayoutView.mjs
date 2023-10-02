import { dia, mvc, g, V } from 'jointjs/src/core.mjs';
import { StackLayout } from '../../layout/StackLayout/StackLayout.mjs';
import { StackLayoutModel } from '../../layout/StackLayout/StackLayoutModel.mjs';

const previewDefault = (options, view) => {
    const { direction } = view.model;
    const { targetStack, invalid } = options;
    const preview = V('path', {
        'stroke': (invalid) ? '#ccc' : '#333',
        'stroke-width': 2,
    });
    switch (direction) {
        case StackLayout.Directions.RightLeft:
        case StackLayout.Directions.LeftRight: {
            const { height } = targetStack.bbox;
            preview.attr('d', `M 0 ${-height / 2} v ${height}`);
            break;
        }
        case StackLayout.Directions.TopBottom:
        case StackLayout.Directions.BottomTop:
        default: {
            const { width } = targetStack.bbox;
            preview.attr('d',`M ${-width / 2} 0 h ${width}`);
            break;
        }
    }
    return preview.node;
};

const validateMovingCallbackDefault = (options, view) => {
    return true;
};

const modifyInsertElementIndexCallbackDefault = (options, point, view) => {
    return options.insertElementIndex;
};

const canInteractCallbackDefault = (elementView, stackLayoutView) => {
    return stackLayoutView.model.hasElement(elementView.model);
};

export class StackLayoutView extends mvc.View {

    constructor(options) {
        super(options);
        this.currentEventData = {};
        this.paper = options.paper;

        if (!this.model) {
            this.model = new StackLayoutModel(Object.assign({}, options.layoutOptions, {
                graph: this.paper.model
            }));
        }

        this.previewFunction = options.preview || previewDefault;
        this.validateMoving = options.validateMoving || validateMovingCallbackDefault;
        this.canInteract = options.canInteract || canInteractCallbackDefault;
        this.modifyInsertElementIndex = options.modifyInsertElementIndex || modifyInsertElementIndexCallbackDefault;

        this.startListening();
    }

    preinitialize() {
        this.svgElement = true,
        this.tagName = 'g';
    }

    startListening() {
        const { paper } = this;

        this.listenTo(paper, 'element:pointerdown', this.onPaperPointerdown);
        this.listenTo(paper, 'element:pointermove', this.onPaperPointermove);
        this.listenTo(paper, 'element:pointerup', this.onPaperPointerup);
    }

    getPreviewPosition(targetStack, targetElementIndex) {
        const previewGap = this.model.get('stackElementGap') / 2;
        const { direction } = this.model;
        const { bbox: stackBBox, elements: stackElements } = targetStack;
        const stackLength = stackElements.length;
        const targetElement = stackElements[targetElementIndex];
        const previewPosition = {
            x: 0,
            y: 0
        };
        switch (direction) {
            case StackLayout.Directions.TopBottom: {
                previewPosition.x = stackBBox.x + stackBBox.width / 2;
                if (targetElement) {
                    previewPosition.y = targetElement.position().y - previewGap;
                } else {
                    const lastElement = stackElements[stackLength - 1];
                    if (lastElement) {
                        previewPosition.y = lastElement.position().y + lastElement.size().height + previewGap;
                    } else {
                        previewPosition.y = stackBBox.y - previewGap;
                    }
                }
                break;
            }
            case StackLayout.Directions.BottomTop: {
                previewPosition.x = stackBBox.x + stackBBox.width / 2;
                if (targetElement) {
                    previewPosition.y = targetElement.position().y + targetElement.size().height + previewGap;
                } else {
                    const lastElement = stackElements[stackLength - 1];
                    if (lastElement) {
                        previewPosition.y = lastElement.position().y - previewGap;
                    } else {
                        previewPosition.y = stackBBox.y + stackBBox.height + previewGap;
                    }
                }
                break;
            }
            case StackLayout.Directions.LeftRight:
                previewPosition.y = stackBBox.y + stackBBox.height / 2;
                if (targetElement) {
                    previewPosition.x = targetElement.position().x - previewGap;
                } else {
                    const lastElement = stackElements[stackLength - 1];
                    if (lastElement) {
                        previewPosition.x = lastElement.position().x + lastElement.size().width + previewGap;
                    } else {
                        previewPosition.x = stackBBox.x - previewGap;
                    }
                }
                break;
            case StackLayout.Directions.RightLeft:
                previewPosition.y = stackBBox.y + stackBBox.height / 2;
                if (targetElement) {
                    previewPosition.x = targetElement.position().x + targetElement.size().width + previewGap;
                } else {
                    const lastElement = stackElements[stackLength - 1];
                    if (lastElement) {
                        previewPosition.x = lastElement.position().x - previewGap;
                    } else {
                        previewPosition.x = stackBBox.x + stackBBox.width + previewGap;
                    }
                }
                break;
        }
        return previewPosition;
    }

    createGhost(elementView) {
        const { vel } = elementView;
        const ghost = vel.clone();
        ghost.attr('opacity', 0.4);
        ghost.node.style.transform = '';
        ghost.addClass('stack-layout-ghost');
        return ghost;
    }

    dragstart(element, x, y) {
        const sourceStack = this.model.getStackFromElement(element);
        if (!this.currentEventData) {
            this.currentEventData = {};
        }
        Object.assign(this.currentEventData, {
            sourceStack
        });
    }

    drag(element, x, y) {
        if (!this.currentEventData)
            return;
        const targetPoint = { x, y };
        const { sourceStack } = this.currentEventData;
        let { preview } = this.currentEventData;
        const targetStack = this.model.getStackFromPoint(targetPoint);
        if (targetStack) {
            let sourceElementIndex;
            if (sourceStack) {
                sourceElementIndex = sourceStack.elements.findIndex(el => el.id === element.id);
            }
            let insertElementIndex = this.model.getInsertElementIndexFromPoint(targetStack, targetPoint);
            insertElementIndex = this.modifyInsertElementIndex({
                sourceStack,
                sourceElement: element,
                targetStack,
                insertElementIndex,
            }, new g.Point(targetPoint), this);

            if ((targetStack !== sourceStack) ||
                    (insertElementIndex !== sourceElementIndex && insertElementIndex !== sourceElementIndex + 1)) {
                if (targetStack !== this.currentEventData.targetStack || insertElementIndex !== this.currentEventData.insertElementIndex) {
                    const invalid = !this.validateMoving({
                        sourceStack,
                        sourceElement: element,
                        targetStack,
                        insertElementIndex,
                    }, this);
                    if (preview)
                        preview.remove();
                    preview = V(this.previewFunction({
                        sourceStack,
                        sourceElement: element,
                        targetStack,
                        insertElementIndex,
                        invalid
                    }, this));
                    preview.addClass('stack-layout-preview');
                    if (invalid)
                        preview.addClass('stack-layout-preview-invalid');
                    preview.appendTo(this.paper.getLayerNode(dia.Paper.Layers.FRONT));
                    const previewPosition = this.getPreviewPosition(targetStack, insertElementIndex);
                    V(preview).attr('transform', `translate(${previewPosition.x},${previewPosition.y})`);
                    Object.assign(this.currentEventData, {
                        invalid,
                        preview,
                        targetStack,
                        insertElementIndex
                    });
                }
                return;
            }
        }
        if (preview)
            preview.remove();
        delete this.currentEventData.invalid;
        delete this.currentEventData.preview;
        delete this.currentEventData.targetStack;
        delete this.currentEventData.insertElementIndex;
    }

    dragend(element, x, y) {
        if (!this.currentEventData)
            return;
        const { preview, targetStack, insertElementIndex, invalid } = this.currentEventData;
        if (preview) {
            preview.remove();
        }
        if (!targetStack || invalid)
            return;
        this.model.insertElement(element, targetStack.index, insertElementIndex, { stackLayoutView: this.cid });
        delete this.currentEventData;
    }

    cancelDrag() {
        if (!this.currentEventData)
            return;
        const { preview } = this.currentEventData;
        if (preview) {
            preview.remove();
        }
        delete this.currentEventData;
    }

    canDrop() {
        if (!this.currentEventData)
            return false;
        const { targetStack, invalid } = this.currentEventData;
        return targetStack && !invalid;
    }

    onPaperPointerdown(view, evt, pointerX, pointerY) {
        if (!this.canInteract(view, this)) {
            delete this.currentEventData;
            return;
        }
        if (view.can('elementMove')) {
            throw new Error('ui.StackLayoutView: requires the "elementMove" interactivity set to false. e.g. paper.setInteractivity(false)');
        }
        const { model: element } = view;
        this.dragstart(element, pointerX, pointerY);
        const position = element.position();
        Object.assign(this.currentEventData, {
            ghost: this.createGhost(view),
            dx: pointerX - position.x,
            dy: pointerY - position.y
        });
    }

    onPaperPointermove(view, evt, pointerX, pointerY) {
        const { currentEventData } = this;
        if (!currentEventData) return;
        const { model: element } = view;
        this.drag(element, pointerX, pointerY);
        const { ghost, dx, dy, invalid } = currentEventData;
        if (ghost) {
            ghost.attr('transform', `translate(${pointerX - dx},${pointerY - dy})`);
            if (!ghost.parent()) {
                ghost.appendTo(this.paper.getLayerNode(dia.Paper.Layers.FRONT));
            }
            ghost.toggleClass('stack-layout-ghost-invalid', Boolean(invalid));
        }
    }

    onPaperPointerup(view, evt, pointerX, pointerY) {
        const { currentEventData } = this;
        if (!currentEventData) return;
        const { ghost } = currentEventData;
        if (ghost) {
            ghost.remove();
        }
        const { model: element } = view;
        this.dragend(element, pointerX, pointerY);
    }
}
