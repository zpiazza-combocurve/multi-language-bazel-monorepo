import { util, elementTools } from 'jointjs/src/core.mjs';

export const SwimlaneBoundary = elementTools.Boundary.extend({
    name: 'swimlane-boundary',
    tagName: 'rect',
    options: {
        padding: 10,
        laneId: ''
    },

    update: function() {
        const { vel, relatedView, options } = this;
        const model = relatedView.model;
        const shapeAngle = model.angle();
        const shapeBBoxCenter = model.getBBox().center();
        const bbox = this.getBoundaryBBox(model, options.laneId, options.padding);

        if (bbox === null) {
            vel.attr({ width: 0, height: 0 });
        } else {
            vel.attr(bbox.toJSON());
            vel.rotate(shapeAngle, shapeBBoxCenter.x, shapeBBoxCenter.y, { absolute: true });
        }
        return this;
    },

    getBoundaryBBox: function(model, laneId, padding) {
        const { left, top, right, bottom } = util.normalizeSides(padding);
        const laneBBox = model.getLaneBBox(laneId);

        if (laneBBox === null) {
            return null
        }

        laneBBox.moveAndExpand({
            x: -left,
            y: -top,
            width: left + right,
            height: top + bottom
        });

        if (laneBBox.width < 0) laneBBox.width = 0;
        if (laneBBox.height < 0) laneBBox.height = 0;

        return laneBBox;
    }
});
