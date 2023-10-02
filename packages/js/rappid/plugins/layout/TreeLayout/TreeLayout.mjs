// Tree Graph Layout.
// ==================
import Backbone from 'backbone';
import { g, util } from 'jointjs/src/core.mjs';

// Layout Siblings
// ===============
// a group of sibling layout areas

function LayoutSiblings(layoutAreas, parentArea, opt) {

    opt = util.defaults(opt || {}, { siblingGap: 0 });

    this.width = 0;
    this.height = 0;
    this.layoutAreas = this.sortLayoutAreas(layoutAreas);
    this.parentArea = parentArea;
    this.siblingGap = opt.siblingGap;
    if (this.exists()) {
        this.computeSize(opt);
    }
}

util.assign(LayoutSiblings.prototype, {

    sortLayoutAreas: function(layoutAreas) {

        var areas = util.sortBy(layoutAreas, 'siblingRank');

        // re-number the sibling ranks
        areas.forEach(function(area, index) {
            area.siblingRank = index;
        });

        return areas;
    },

    move: function(dx, dy) {
        for (var i = 0, n = this.layoutAreas.length; i < n; i++) {
            this.layoutAreas[i].dx += dx;
            this.layoutAreas[i].dy += dy;
        }
    },

    exists: function() {
        return this.layoutAreas.length > 0;
    },

    sumGaps: function(gap) {
        var gapCount = Math.max(this.layoutAreas.length - 1, 0);
        return gapCount * gap;
    },

    getSiblingRankByPoint: function(point) {

        if (!this.exists()) {
            // minimal extreme
            return -1;
        }

        var closestArea = this.findAreaByPoint(point);
        if (!closestArea) {
            // maximal extreme
            return this.layoutAreas.length - 1;
        }

        return closestArea.siblingRank - 1;
    },

    getFirstChildConnectionPoints: function() {

        return [];
    },

    getConnectionPoints: function(point, opt) {

        if (!this.exists()) {
            return this.getFirstChildConnectionPoints(point);
        }

        var deltaCoordinates = {
            dx: point.x - this.parentArea.rootCX,
            dy: point.y - this.parentArea.rootCY
        };

        return this.layoutAreas[0].getRootVertices(deltaCoordinates, opt);
    },

    getParentConnectionPoint: function() {

        var parentArea = this.parentArea;
        var offset = this.proxyLayoutArea('getConnectionPoint', parentArea.rootSize);
        var connectionPoint = g.point(parentArea.rootCX, parentArea.rootCY);

        return connectionPoint.offset(offset.x, offset.y);
    },

    getChildConnectionPoint: function(point, rootSize) {

        var offset = this.proxyLayoutArea('getConnectionPoint', rootSize);
        return g.point(point).difference(offset);
    },

    proxyLayoutArea: function(method) {

        var args = Array.prototype.slice.call(arguments, 1);
        return LayoutArea.fromDirection(this.direction).prototype[method].apply(this.parentArea, args);
    }
});

LayoutSiblings.extend = Backbone.Model.extend;

var VerticalLayoutSiblings = LayoutSiblings.extend({

    // Y coordinate of the most top sibling
    getTopDY: function() {
        return -this.height / 2;
    },

    findAreaByPoint: function(point) {

        return this.layoutAreas.find(function(area) {
            return area.rootCY > point.y;
        });
    },

    computeSize: function(opt) {

        // compute height of all the siblings
        this.height = this.sumGaps(opt.siblingGap);
        var layoutAreas = this.layoutAreas;

        if (opt.symmetrical) {

            const maxHeight = layoutAreas.reduce(function(res, area) {
                return Math.max(res, area.height + area.prevSiblingGap + area.nextSiblingGap);
            }, 0);

            this.height += maxHeight * layoutAreas.length;

            layoutAreas.reduce((y, area) => {
                // check if the current siblings width changed
                this.width = Math.max(this.width, area.getExtendedWidth());
                // set the shift of the area
                area.dy += y + maxHeight / 2;
                // return the y-coordinate of the next sibling
                return y + maxHeight + opt.siblingGap;
            }, this.getTopDY());

        } else {

            this.height += layoutAreas.reduce(function(res, area) {
                return res + area.height + area.prevSiblingGap + area.nextSiblingGap;
            }, 0);

            layoutAreas.reduce((y, area) => {
                // check if the current siblings width changed
                this.width = Math.max(this.width, area.getExtendedWidth());
                // set the shift of the area
                area.dy += y + area.getCY();
                // return the y-coordinate of the next sibling
                return y + area.prevSiblingGap + area.height + area.nextSiblingGap + opt.siblingGap;
            }, this.getTopDY());

        }
    },

    getYTowardsParent: function() {

        return this.parentArea.rootCY;
    },

    getXTowardsParent: function() {

        var parentArea = this.parentArea;
        return parentArea.rootCX + this.LRSign * (parentArea.rootSize.width / 2 + parentArea.gap);
    },

    getNeighborPointFromRank: function(rank) {

        var y;
        var siblingGap = this.siblingGap;

        if (!this.exists()) {

            y = this.getYTowardsParent();

        } else {

            var prevArea = this.layoutAreas[rank];
            var nextArea = this.layoutAreas[rank + 1];

            if (!prevArea) {
                y = nextArea.y - siblingGap / 2;
            } else if (!nextArea) {
                y = prevArea.y + prevArea.height + siblingGap / 2;
            } else {
                y = (prevArea.y + prevArea.height + nextArea.y) / 2;
            }
        }

        return {
            x: this.getXTowardsParent(),
            y: y
        };
    }

});

var LeftLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'L',
    LRSign: -1
});

var RightLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'R',
    LRSign: 1
});

// Vertical Tree Layout Siblings

var treeLayoutSiblings = {

    getXTowardsParent: function() {

        var parentArea = this.parentArea;
        return parentArea.rootCX + this.LRSign * parentArea.gap;
    },

    getYTowardsParent: function() {

        var parentArea = this.parentArea;
        var dy = parentArea.getLRHeight(parentArea.siblings) / 2;
        dy += Math.min(parentArea.firstChildGap, this.siblingGap / 2);

        return parentArea.rootCY + this.TBSign * dy;
    },

    getFirstChildConnectionPoints: function(point) {

        return [g.point(this.parentArea.rootCX, point.y)];
    },

    getChildConnectionPoint: function(point, rootSize) {

        return g.point(point).offset(-this.LRSign * rootSize.width / 2, 0);
    },

    getParentConnectionPoint: function() {

        var parentArea = this.parentArea;
        var connectionPoint = g.point(parentArea.rootCX, parentArea.rootCY);
        return connectionPoint.offset(0, this.TBSign * (parentArea.rootSize.height - parentArea.rootMargin) / 2);
    }
};

var bottomTreeLayoutSiblings = {

    getTopDY: function() {
        return 0;
    }
};

var topTreeLayoutSiblings = {

    getTopDY: function() {
        return -this.height;
    }
};

var BottomRightLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'BR',
    LRSign: 1,
    TBSign: 1
});
util.assign(BottomRightLayoutSiblings.prototype, treeLayoutSiblings, bottomTreeLayoutSiblings);

var BottomLeftLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'BL',
    LRSign: -1,
    TBSign: 1
});
util.assign(BottomLeftLayoutSiblings.prototype, treeLayoutSiblings, bottomTreeLayoutSiblings);

var TopRightLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'TR',
    LRSign: 1,
    TBSign: -1
});
util.assign(TopRightLayoutSiblings.prototype, treeLayoutSiblings, topTreeLayoutSiblings);

var TopLeftLayoutSiblings = VerticalLayoutSiblings.extend({

    direction: 'TL',
    LRSign: -1,
    TBSign: -1
});
util.assign(TopLeftLayoutSiblings.prototype, treeLayoutSiblings, topTreeLayoutSiblings);


// Horizontal Layout Siblings

var HorizontalLayoutSiblings = LayoutSiblings.extend({

    // X coordinate of the most left sibling
    getLeftDX: function() {
        return -this.width / 2;
    },

    findAreaByPoint: function(point) {

        return this.layoutAreas.find(function(area) {
            return area.rootCX > point.x;
        });
    },

    computeSize: function(opt) {

        this.width = this.sumGaps(opt.siblingGap);
        var layoutAreas = this.layoutAreas;

        if (opt.symmetrical) {

            const maxWidth = layoutAreas.reduce(function(res, area) {
                return Math.max(res, area.width + area.prevSiblingGap + area.nextSiblingGap);
            }, 0);

            this.width += maxWidth * layoutAreas.length;

            layoutAreas.reduce((x, area) => {
                // check if the current siblings height changed
                this.height = Math.max(this.height, area.getExtendedHeight());
                // set the shift of the area
                area.dx += x + maxWidth / 2;
                // return the x-coordinate of the next sibling
                return x + maxWidth + opt.siblingGap;
            }, this.getLeftDX());

        } else {

            this.width += layoutAreas.reduce(function(res, area) {
                return res + area.width + area.prevSiblingGap + area.nextSiblingGap;
            }, 0);

            layoutAreas.reduce((x, area) => {
                // check if the current siblings height changed
                this.height = Math.max(this.height, area.getExtendedHeight());
                // set the shift of the area
                area.dx += x + area.getCX();
                // return the x-coordinate of the next sibling
                return x + area.prevSiblingGap + area.width + area.nextSiblingGap + opt.siblingGap;
            }, this.getLeftDX());

        }
    },

    getNeighborPointFromRank: function(rank) {

        var x;

        if (!this.exists()) {

            x = this.parentArea.rootCX;

        } else {

            var prevArea = this.layoutAreas[rank];
            var nextArea = this.layoutAreas[rank + 1];

            if (!prevArea) {
                x = nextArea.x - this.siblingGap / 2;
            } else if (!nextArea) {
                x = prevArea.x + prevArea.width + this.siblingGap / 2;
            } else {
                x = (prevArea.x + prevArea.width + nextArea.x) / 2;
            }
        }

        return {
            x: x,
            y: this.getYTowardsParent()
        };
    }
});

var TopLayoutSiblings = HorizontalLayoutSiblings.extend({

    direction: 'T',

    getYTowardsParent: function() {

        var parentArea = this.parentArea;
        return parentArea.rootCY - parentArea.getLRHeight() / 2 - parentArea.gap;
    }
});

var BottomLayoutSiblings = HorizontalLayoutSiblings.extend({

    direction: 'B',

    getYTowardsParent: function() {

        var parentArea = this.parentArea;
        return parentArea.rootCY + parentArea.getLRHeight() / 2 + parentArea.gap;
    }
});

// Layout Area
// ===========

function LayoutArea(root, opt) {

    this.root = root;

    var options = util.assign({}, opt, this.getRootAttributes(root, opt.attributeNames));
    var globalGap = opt.gap || 0;

    util.defaults(options, {
        parentGap: globalGap,
        siblingGap: globalGap,
        firstChildGap: globalGap
    });

    this.siblingRank = options.siblingRank;
    this.rootOffset = options.rootOffset;
    this.rootMargin = options.rootMargin;
    // Gaps
    this.siblingGap = options.siblingGap;
    this.gap = this.parentGap = options.parentGap;
    this.nextSiblingGap = options.nextSiblingGap;
    this.prevSiblingGap = options.prevSiblingGap;
    this.firstChildGap = options.firstChildGap;
    // metrics
    this.dx = 0;
    this.dy = 0;
    this.width = 0;
    this.height = 0;
    // layout specifics
    this.symmetrical = options.symmetrical;
}

util.assign(LayoutArea, {

    create: function(direction, root, opt) {

        var constructor = LayoutArea.fromDirection(direction, opt);
        return new constructor(root, opt);
    },

    fromDirection: function(direction, opt) {

        var constructor;

        switch (direction) {
            case 'L':
                constructor = LeftLayoutArea;
                break;
            case 'T':
                constructor = TopLayoutArea;
                break;
            case 'R':
                constructor = RightLayoutArea;
                break;
            case 'B':
                constructor = BottomLayoutArea;
                break;
            case 'BR':
                constructor = BottomRightLayoutArea;
                break;
            case 'BL':
                constructor = BottomLeftLayoutArea;
                break;
            case 'TR':
                constructor = TopRightLayoutArea;
                break;
            case 'TL':
                constructor = TopLeftLayoutArea;
                break;
            default:
                constructor = LayoutArea;
        }

        return constructor;
    }

});

util.assign(LayoutArea.prototype, {

    direction: null,

    compute: function(childLayoutAreas) {
        this.childAreas = childLayoutAreas;
        this.computeRelativePosition(this.root, childLayoutAreas);
    },

    // Returns height of the layout area
    getHeight: function(siblings, rootSize) {

        return this.getTHeight(siblings) + this.getBHeight(siblings) + this.getLRHeight();
    },

    // Returns width of the layout area
    getWidth: function(siblings, rootSize) {

        var tbWidth = Math.max(siblings.T.width, siblings.B.width) / 2;

        var lWidth = Math.max(
            this.getLWidth(siblings, rootSize) + rootSize.width / 2,
            tbWidth
        );

        var rWidth = Math.max(
            this.getRWidth(siblings, rootSize) + rootSize.width / 2,
            tbWidth
        );

        return lWidth + rWidth;
    },

    // Returns height of layout area taken only L,R siblings into account
    getLRHeight: function() {

        return Math.max(this.rootSize.height, this.siblings.L.height, this.siblings.R.height);
    },

    // Returns height of the all top siblings (T,TR,TL)
    getTHeight: function(siblings) {

        return siblings.T.height + this.getTXHeight(siblings);
    },

    // Returns height of the all bottom siblings (B,BR,BL)
    getBHeight: function(siblings) {

        return siblings.B.height + this.getBXHeight(siblings);
    },

    // Returns width of layout area without T,B siblings
    getXLRWidth: function(siblings, rootSize) {

        return this.getLWidth(siblings, rootSize) + rootSize.width + this.getRWidth(siblings, rootSize);
    },

    // Returns width of both right tree siblings (TR,BR)
    getXRWidth: function(siblings, rootSize) {

        var xrWidth = Math.max(siblings.BR.width, siblings.TR.width);
        if (xrWidth > 0) {
            xrWidth -= rootSize.width / 2;
        }

        return xrWidth;
    },

    // Returns height of both top tree siblings (TR,TL)
    getTXHeight: function(siblings) {

        var txHeight = Math.max(siblings.TR.height, siblings.TL.height);
        if (txHeight > 0) {
            txHeight += this.firstChildGap;
        }

        return txHeight;
    },

    // Returns height of both bottom tree siblings (BR,BL)
    getBXHeight: function(siblings) {

        var bxHeight = Math.max(siblings.BR.height, siblings.BL.height);
        if (bxHeight > 0) {
            bxHeight += this.firstChildGap;
        }

        return bxHeight;
    },

    // Returns width of both right tree siblings (BL,TL)
    getXLWidth: function(siblings, rootSize) {

        var xlWidth = Math.max(siblings.BL.width, siblings.TL.width);
        if (xlWidth > 0) {
            xlWidth -= rootSize.width / 2;
        }

        return xlWidth;
    },

    // Returns width of all the right siblings (R, TR, BR)
    getRWidth: function(siblings, rootSize) {

        return Math.max(siblings.R.width, this.getXRWidth(siblings, rootSize));
    },

    // Returns width of all the left siblings (L, TL, BL)
    getLWidth: function(siblings, rootSize) {

        return Math.max(siblings.L.width, this.getXLWidth(siblings, rootSize));
    },

    // Returns T,B siblings width that overlaps root element.
    getTBOverlap: function(siblings, rootSize) {

        var tbOverlap = Math.max(siblings.T.width, siblings.B.width);
        if (tbOverlap > 0) {
            tbOverlap -= rootSize.width;
            tbOverlap /= 2;
        }

        return tbOverlap;
    },

    getRootDX: function(siblings, rootSize) {

        var tbOverlap = this.getTBOverlap(siblings, rootSize);

        var dx = Math.max(this.getLWidth(siblings, rootSize), tbOverlap);
        dx -= Math.max(this.getRWidth(siblings, rootSize), tbOverlap);

        return dx / 2;
    },

    // Returns the minimum amongst various gaps.
    getMinimalGap: function(siblings) {

        return Math.min(siblings.siblingGap, this.firstChildGap, this.parentGap);
    },

    getBBox: function(opt) {

        var bbox = g.rect(this);
        var pad = opt && opt.expandBy;

        if (pad) {

            bbox.moveAndExpand({
                x: -pad,
                y: -pad,
                width: pad * 2,
                height: pad * 2
            });
        }

        return bbox;
    },

    containsPoint: function(point, opt) {

        return this.getBBox(opt).containsPoint(point);
    },

    getLayoutSiblings: function(direction) {

        return this.siblings[direction];
    },

    getExtendedWidth: function() {

        return this.width + this.gap + this.rootOffset;
    },

    getExtendedHeight: function() {

        return this.height + this.gap + this.rootOffset;
    },

    findMinimalAreaByPoint: function(point, opt) {

        if (!this.containsPoint(point, opt)) {
            return null;
        }

        var minimalArea;

        this.childAreas.some(function(area) {
            minimalArea = area.findMinimalAreaByPoint(point, opt);
            return !!minimalArea;
        });

        return minimalArea || this;
    },

    getType: function() {

        return Object.keys(this.siblings).reduce((memo, direction) => {
            var siblingGroup = this.siblings[direction];
            return siblingGroup.exists() ? memo.concat(direction) : memo;
        }, []).sort().join('-');
    },

    getRootAttributes: function(root, attributeNames) {

        var attributes = {
            rootOffset: root.get(attributeNames.offset || 'offset') || 0,
            rootMargin: root.get(attributeNames.margin || 'margin') || 0,
            prevSiblingGap: root.get(attributeNames.prevSiblingGap || 'prevSiblingGap') || 0,
            nextSiblingGap: root.get(attributeNames.nextSiblingGap || 'nextSiblingGap') || 0
        };

        var siblingRank = root.get(attributeNames.siblingRank || 'siblingRank');
        if (util.isNumber(siblingRank)) {
            attributes.siblingRank = siblingRank;
        }

        var firstChildGap = root.get(attributeNames.firstChildGap || 'firstChildGap');
        if (util.isNumber(firstChildGap)) {
            attributes.firstChildGap = firstChildGap;
        }

        return attributes;
    },

    getRootSize: function(root, rootMargin) {

        var rootSize = root.size();

        rootSize[this.marginDimension] += rootMargin;

        return rootSize;
    },

    createSiblings: function(childAreas, opt) {

        var groupedAreas = util.groupBy(childAreas, 'direction');

        return {
            L: new LeftLayoutSiblings(groupedAreas.L, this, opt),
            T: new TopLayoutSiblings(groupedAreas.T, this, opt),
            R: new RightLayoutSiblings(groupedAreas.R, this, opt),
            B: new BottomLayoutSiblings(groupedAreas.B, this, opt),
            BR: new BottomRightLayoutSiblings(groupedAreas.BR, this, opt),
            BL: new BottomLeftLayoutSiblings(groupedAreas.BL, this, opt),
            TR: new TopRightLayoutSiblings(groupedAreas.TR, this, opt),
            TL: new TopLeftLayoutSiblings(groupedAreas.TL, this, opt)
        };
    },

    computeSize: function(siblings, rootSize) {

        return {
            width: this.getWidth(siblings, rootSize),
            height: this.getHeight(siblings, rootSize)
        };
    },

    computeOrigin: function() {

        var siblings = this.siblings;
        var rootSize = this.rootSize;
        var maxWidth = Math.max(
            this.getLWidth(siblings, rootSize) + rootSize.width / 2,
            this.getXLWidth(siblings, rootSize) + rootSize.width / 2,
            siblings.T.width / 2,
            siblings.B.width / 2
        );

        return {
            x: this.rootCX - maxWidth,
            y: this.rootCY - this.getTHeight(siblings) - this.getLRHeight() / 2
        };
    },

    moveSiblings: function(siblings, rootSize) {

        if (this.hasHorizontalSiblings(siblings)) {

            var dx = rootSize.width / 2;
            siblings.L.move(-dx, 0);
            siblings.R.move(dx, 0);
        }

        if (this.hasVerticalSiblings(siblings)) {

            var dy = this.getLRHeight() / 2;
            siblings.T.move(0, -dy);
            siblings.B.move(0, dy);
            siblings.BR.move(0, dy);
            siblings.BL.move(0, dy);
            siblings.B.move(0, this.getBXHeight(siblings));
            siblings.TR.move(0, -dy);
            siblings.TL.move(0, -dy);
            siblings.T.move(0, -this.getTXHeight(siblings));
        }
    },

    moveRootToConnectionPoint: function(rootSize) {

        var connectionPoint = this.getConnectionPoint(rootSize);

        this.dx += connectionPoint.x;
        this.dy += connectionPoint.y;
    },

    computeRelativePosition: function(root, childAreas) {

        var siblings = this.siblings = this.createSiblings(childAreas, { siblingGap: this.siblingGap, symmetrical: this.symmetrical });
        var rootSize = this.rootSize = this.getRootSize(root, this.rootMargin);

        util.assign(this, this.computeSize(siblings, rootSize));

        this.moveSiblings(siblings, rootSize);
        this.moveRootToConnectionPoint(rootSize);
        this.moveRootBehindSiblings(siblings, rootSize);
        this.moveRootFromParent();
    },

    computeAbsolutePosition: function() {

        if (this.parentArea) {
            this.rootCX = this.parentArea.rootCX + this.dx;
            this.rootCY = this.parentArea.rootCY + this.dy;
            this.level = this.parentArea.level + 1;
        } else {
            var rootCenter = this.root.getBBox().center();
            this.rootCX = rootCenter.x;
            this.rootCY = rootCenter.y;
            this.level = 0;
        }

        util.assign(this, this.computeOrigin());
    },

    hasVerticalSiblings: function(siblings) {

        return siblings.T.exists() || siblings.B.exists() || siblings.BR.exists() || siblings.BL.exists() || siblings.TR.exists() || siblings.TL.exists();
    },

    hasHorizontalSiblings: function(siblings) {

        return siblings.L.exists() || siblings.R.exists();
    },

    isSourceArea: function() {

        return !this.parentArea;
    },

    isSinkArea: function() {

        return this.childAreas.length === 0;
    },

    getRootPosition: function() {

        var rootSize = this.root.get('size');

        return {
            x: this.rootCX - rootSize.width / 2,
            y: this.rootCY - rootSize.height / 2
        };
    },

    getRootVertices: function(deltaCoordinates, opt) {

        opt = opt || {};
        deltaCoordinates = deltaCoordinates || this;

        if (deltaCoordinates[this.deltaCoordinate] === 0 || !this.parentArea) {
            // Pure horizontal/vertical link has no vertices.
            return [];
        }

        var parentInnerSize = this.parentArea.getInnerSize();
        var relativeVertices;

        if (!opt.ignoreSiblings && this.hasSiblingsBetweenParent()) {
            // vertices avoids the elements between the root and its parent.
            var oppositeSiblings = this.siblings[this.oppositeDirection];
            relativeVertices = this.getRelativeVerticesAvoidingSiblings(
                parentInnerSize,
                deltaCoordinates,
                oppositeSiblings
            );
        } else {
            relativeVertices = this.getRelativeVertices(parentInnerSize, deltaCoordinates);
        }

        return util.invoke(relativeVertices, 'offset', this.parentArea.rootCX, this.parentArea.rootCY);
    },

    getInnerSize: function() {

        return {
            width: this.rootSize.width,
            height: this.getLRHeight()
        };
    },

    getConnectionPoint: function() {

        // root area has no connection point
        return null;
    },

    getRelativeVertices: function() {

        // root area has no inbound link
        return null;
    },

    moveRootFromParent: function() {

        // root area has no parent
    },

    moveRootBehindSiblings: function() {

        // root area dx, dy are always 0,0
    },

    // Is there an element between the root of the area and the parent.
    hasSiblingsBetweenParent: function() {

        return !this.isSourceArea() && this.siblings[this.oppositeDirection].exists();
    },

    getCY: function() {
        return this.height / 2 + this.prevSiblingGap;
    },

    getCX: function() {
        return this.width / 2 + this.prevSiblingGap;
    }

});

LayoutArea.extend = Backbone.Model.extend;

var RightLayoutArea = LayoutArea.extend({

    direction: 'R',
    oppositeDirection: 'L',
    deltaCoordinate: 'dx',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(rootSize.width / 2, 0);
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx += Math.max(
            this.getLWidth(siblings, rootSize),
            this.getTBOverlap(siblings, rootSize)
        );

        this.dy += (this.getTHeight(siblings) - this.getBHeight(siblings)) / 2;
    },

    moveRootFromParent: function() {

        this.dx += this.parentGap + this.rootOffset;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var dx = this.parentGap / 2;
        return [
            connectionPoint.clone().offset(dx, 0),
            connectionPoint.clone().offset(dx, deltaCoordinates.dy)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, lSiblings) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var gap = lSiblings.siblingGap / 2;

        var signY = this.dx > 0 ? -1 : 1;
        var y1 = deltaCoordinates.dy + signY * (lSiblings.height + gap) / 2;
        var y2 = deltaCoordinates.dy + signY * this.rootSize.height / 4;
        var x1 = this.gap / 2;
        var x2 = 1.5 * x1 + Math.max(
            this.getLWidth(this.siblings, this.rootSize),
            this.getTBOverlap(this.siblings, this.rootSize)
        );

        return [
            connectionPoint.clone().offset(x1, 0),
            connectionPoint.clone().offset(x1, y1),
            connectionPoint.clone().offset(x2, y1),
            connectionPoint.clone().offset(x2, y2)
        ];
    }
});

var LeftLayoutArea = LayoutArea.extend({

    direction: 'L',
    oppositeDirection: 'R',
    deltaCoordinate: 'dx',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(-rootSize.width / 2, 0);
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx -= Math.max(
            this.getRWidth(siblings, rootSize),
            this.getTBOverlap(siblings, rootSize)
        );

        this.dy += (this.getTHeight(siblings) - this.getBHeight(siblings)) / 2;
    },

    moveRootFromParent: function() {

        this.dx -= this.parentGap + this.rootOffset;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var dx = -this.parentGap / 2;
        return [
            connectionPoint.clone().offset(dx, 0),
            connectionPoint.clone().offset(dx, deltaCoordinates.dy)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, rSiblings) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);

        var signY = this.dx > 0 ? -1 : 1;
        var y1 = deltaCoordinates.dy + signY * (rSiblings.height + rSiblings.siblingGap / 2) / 2;
        var y2 = deltaCoordinates.dy + signY * this.rootSize.height / 4;
        var x1 = this.gap / 2;
        var x2 = 1.5 * x1 + Math.max(
            this.getRWidth(this.siblings, this.rootSize),
            this.getTBOverlap(this.siblings, this.rootSize)
        );

        return [
            connectionPoint.clone().offset(-x1, 0),
            connectionPoint.clone().offset(-x1, y1),
            connectionPoint.clone().offset(-x2, y1),
            connectionPoint.clone().offset(-x2, y2)
        ];
    }
});

var TopLayoutArea = LayoutArea.extend({

    direction: 'T',
    oppositeDirection: 'B',
    deltaCoordinate: 'dy',
    marginDimension: 'width',

    getConnectionPoint: function(rootSize) {

        return g.point(0, -rootSize.height / 2);
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx += this.getRootDX(siblings, rootSize);

        if (this.hasHorizontalSiblings(siblings)) {
            this.dy -= (this.getLRHeight() - rootSize.height) / 2;
        }
        this.dy -= this.getBHeight(siblings);
    },

    moveRootFromParent: function() {

        this.dy -= this.parentGap + this.rootOffset;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {
        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var dy = -this.getTXHeight(this.parentArea.siblings) - this.parentGap / 2;
        return [
            connectionPoint.clone().offset(0, dy),
            connectionPoint.clone().offset(deltaCoordinates.dx, dy)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);

        var siblings = this.siblings;
        var bSiblings = siblings.B;

        // Jump the Top-Right and Top-Left siblings of the parent element
        var y1 = this.getTXHeight(this.parentArea.siblings) + this.parentGap / 2;
        var y2 = y1 + bSiblings.height;
        // Jump the Bottom-Right and Bottom-Left siblings of the child element
        y2 += this.getBXHeight(this.siblings) + this.parentGap / 4;

        // x1 lies far from the element center
        var signX = this.dy < 0 ? -1 : 1;
        var bxWidth = siblings[signX > 0 ? 'BR' : 'BL'].width;
        var x1 = deltaCoordinates.dx;
        x1 += signX * (Math.max(bxWidth, bSiblings.width / 2) + bSiblings.siblingGap / 4);
        // x2 lies closer to the element center
        var x2 = deltaCoordinates.dx + signX * this.rootSize.width / 4;

        return [
            connectionPoint.clone().offset(0, -y1),
            connectionPoint.clone().offset(x1, -y1),
            connectionPoint.clone().offset(x1, -y2),
            connectionPoint.clone().offset(x2, -y2)
        ];
    }
});

var BottomLayoutArea = LayoutArea.extend({

    direction: 'B',
    oppositeDirection: 'T',
    deltaCoordinate: 'dy',
    marginDimension: 'width',

    getConnectionPoint: function(rootSize) {

        return g.point(0, rootSize.height / 2);
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx += this.getRootDX(siblings, rootSize);

        this.dy += this.getTHeight(siblings);
        if (this.hasHorizontalSiblings(siblings)) {
            this.dy += (this.getLRHeight() - rootSize.height) / 2;
        }
    },

    moveRootFromParent: function() {

        this.dy += this.parentGap + this.rootOffset;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var dy = this.getBXHeight(this.parentArea.siblings) + this.parentGap / 2;
        return [
            connectionPoint.clone().offset(0, dy),
            connectionPoint.clone().offset(deltaCoordinates.dx, dy)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates) {

        var connectionPoint = this.getConnectionPoint(parentRootSize);
        var siblings = this.siblings;
        var tSiblings = siblings.T;

        // Jump the Bottom-Right and Bottom-Left siblings of the parent element
        var y1 = this.getBXHeight(this.parentArea.siblings) + this.parentGap / 2;
        var y2 = y1 + tSiblings.height;
        // Jump the Top-Right and Top-Left siblings of the child element
        y2 += this.getTXHeight(siblings) + this.parentGap / 4;

        // x1 lies far from the element center
        var signX = this.dy < 0 ? -1 : 1;
        var txWidth = siblings[signX > 0 ? 'TR' : 'TL'].width;
        var x1 = deltaCoordinates.dx;
        x1 += signX * (Math.max(txWidth, tSiblings.width / 2) + tSiblings.siblingGap / 4);
        // x2 lies close to the element center
        var x2 = deltaCoordinates.dx + signX * this.rootSize.width / 4;

        return [
            connectionPoint.clone().offset(0, y1),
            connectionPoint.clone().offset(x1, y1),
            connectionPoint.clone().offset(x1, y2),
            connectionPoint.clone().offset(x2, y2)
        ];
    }
});

var BottomRightLayoutArea = LayoutArea.extend({

    direction: 'BR',
    oppositeDirection: 'L',
    deltaCoordinate: 'dy',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(0, rootSize.height / 2);
    },

    getCY: function() {

        return this.prevSiblingGap;
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        var btWidth = Math.max(siblings.T.width, siblings.B.width);
        this.dx += Math.max(this.getLWidth(siblings, rootSize), (btWidth - rootSize.width) / 2);

        this.dy += this.getTHeight(siblings);
        if (this.hasHorizontalSiblings(siblings)) {
            this.dy += (this.getLRHeight() - rootSize.height) / 2;
        }
    },

    moveRootFromParent: function() {

        var parentArea = this.parentArea;
        if (parentArea) {
            this.dy += parentArea.firstChildGap;
        }
        this.dx += this.rootSize.width / 2 + this.rootOffset + this.parentGap;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        const connectionPoint = this.getConnectionPoint(parentRootSize);
        const { dx, dy } = deltaCoordinates;
        const { width, height } = parentRootSize;
        let x;
        if (dy - height / 2 < 0) {
            // Child is next to the parent because `firstChildGap` is negative
            x = (width / 2 + (dx - this.rootSize.width / 2)) / 2;
        } else {
            x = 0;
        }
        return [
            connectionPoint
                .clone()
                .offset(x, dy - height / 2)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, siblings) {

        var x = deltaCoordinates.dx - this.rootSize.width / 4;
        var y = deltaCoordinates.dy;
        y += Math.max(siblings.height, this.rootSize.height) / 2;
        y += this.getMinimalGap(siblings) / 2;

        return [
            g.point(0, y),
            g.point(x, y)
        ];
    }
});

var BottomLeftLayoutArea = LayoutArea.extend({

    direction: 'BL',
    oppositeDirection: 'R',
    deltaCoordinate: 'dy',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(0, rootSize.height / 2);
    },

    getCY: function() {

        return this.prevSiblingGap;
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        var btWidth = Math.max(siblings.T.width, siblings.B.width);
        this.dx -= Math.max(this.getRWidth(siblings, rootSize), (btWidth - rootSize.width) / 2);

        this.dy += this.getTHeight(siblings);
        if (this.hasHorizontalSiblings(siblings)) {
            this.dy += (this.getLRHeight() - rootSize.height) / 2;
        }
    },

    moveRootFromParent: function() {

        var parentArea = this.parentArea;
        if (parentArea) {
            this.dy += parentArea.firstChildGap;
        }
        this.dx -= this.rootSize.width / 2 + this.rootOffset + this.parentGap;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        const connectionPoint = this.getConnectionPoint(parentRootSize);
        const { dx, dy } = deltaCoordinates;
        const { width, height } = parentRootSize;
        let x;
        if (dy - height / 2 < 0) {
            // Child is next to the parent because `firstChildGap` is negative
            x = (-width / 2 + (dx + this.rootSize.width / 2)) / 2;
        } else {
            x = 0;
        }
        return [
            connectionPoint
                .clone()
                .offset(x, dy - height / 2)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, siblings) {

        var x = deltaCoordinates.dx + this.rootSize.width / 4;
        var y = deltaCoordinates.dy;
        y += Math.max(siblings.height, this.rootSize.height) / 2;
        y += this.getMinimalGap(siblings) / 2;

        return [
            g.point(0, y),
            g.point(x, y)
        ];
    }
});

var TopRightLayoutArea = LayoutArea.extend({

    direction: 'TR',
    oppositeDirection: 'L',
    deltaCoordinate: 'dy',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(0, rootSize.height / 2);
    },

    getCY: function() {

        return (this.height - this.rootSize.height) + this.prevSiblingGap;
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx += Math.max(
            this.getLWidth(siblings, rootSize),
            this.getTBOverlap(siblings, rootSize)
        );

        this.dy -= this.getBHeight(siblings);
        if (this.hasHorizontalSiblings(siblings)) {
            this.dy -= (this.getLRHeight() - rootSize.height) / 2;
        }
    },

    moveRootFromParent: function() {

        var parentArea = this.parentArea;
        if (parentArea) {
            this.dy -= parentArea.firstChildGap;
        }
        this.dx += this.rootSize.width / 2 + this.rootOffset + this.parentGap;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        const connectionPoint = this.getConnectionPoint(parentRootSize);
        const { dx, dy } = deltaCoordinates;
        const { width, height } = parentRootSize;
        let x;
        if (dy + height / 2 > 0) {
            // Child is next to the parent because `firstChildGap` is negative
            x = (width / 2 + (dx - this.rootSize.width / 2)) / 2;
        } else {
            x = 0;
        }
        return [
            connectionPoint
                .clone()
                .offset(x, dy - height / 2)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, siblings) {

        var x = deltaCoordinates.dx - this.rootSize.width / 4;
        var y = deltaCoordinates.dy;
        y -= Math.max(siblings.height, this.rootSize.height) / 2;
        y -= this.getMinimalGap(siblings) / 2;

        return [
            g.point(0, y),
            g.point(x, y)
        ];
    }
});

var TopLeftLayoutArea = LayoutArea.extend({

    direction: 'TL',
    oppositeDirection: 'R',
    deltaCoordinate: 'dy',
    marginDimension: 'height',

    getConnectionPoint: function(rootSize) {

        return g.point(0, rootSize.height / 2);
    },

    getCY: function() {

        return (this.height - this.rootSize.height) + this.prevSiblingGap;
    },

    moveRootBehindSiblings: function(siblings, rootSize) {

        this.dx -= Math.max(
            this.getRWidth(siblings, rootSize),
            this.getTBOverlap(siblings, rootSize)
        );

        this.dy -= this.getBHeight(siblings);
        if (this.hasHorizontalSiblings(siblings)) {
            this.dy -= (this.getLRHeight() - rootSize.height) / 2;
        }
    },

    moveRootFromParent: function() {

        var parentArea = this.parentArea;
        if (parentArea) {
            this.dy -= parentArea.firstChildGap;
        }
        this.dx -= this.rootSize.width / 2 + this.rootOffset + this.parentGap;
    },

    getRelativeVertices: function(parentRootSize, deltaCoordinates) {

        const connectionPoint = this.getConnectionPoint(parentRootSize);
        const { dx, dy } = deltaCoordinates;
        const { width, height } = parentRootSize;
        let x;
        if (dy + height / 2 > 0) {
            // Child is next to the parent because `firstChildGap` is negative
            x = (-width / 2 + (dx + this.rootSize.width / 2)) / 2;
        } else {
            x = 0;
        }
        return [
            connectionPoint
                .clone()
                .offset(x, dy - height / 2)
        ];
    },

    getRelativeVerticesAvoidingSiblings: function(parentRootSize, deltaCoordinates, siblings) {

        var x = deltaCoordinates.dx + this.rootSize.width / 4;
        var y = deltaCoordinates.dy;
        y -= Math.max(siblings.height, this.rootSize.height) / 2;
        y -= this.getMinimalGap(siblings) / 2;

        return [
            g.point(0, y),
            g.point(x, y)
        ];
    }
});

var directionRules = {

    rotate: function(rule) {
        var directions = 'LRBT';
        var directionChange = directions.indexOf(rule[0]) - directions.indexOf(rule[1]);
        return function(direction) {
            var directionIndex = directions.indexOf(direction);
            return (directionIndex >= 0)
                ? directions[(4 + directionIndex - directionChange) % 4]
                : direction;
        };
    },

    flip: function(rule) {
        var from = rule[0];
        var to = rule[1];
        return function(direction) {
            if (direction === from) return to;
            if (direction === to) return from;
            return direction;
        };
    },

    straighten: function(rule) {
        return function() {
            return rule[1];
        };
    }

};

export const TreeLayout = Backbone.Model.extend({

    defaults: {

        // A graph to perform the layout on.
        graph: undefined,

        // Global gap. Could be overridden via parentGap, siblingGap and childrenGap
        gap: 20,

        // Gap between a child and its parent.
        parentGap: 20,

        // Gap between two siblings.
        siblingGap: 20,

        // Gap between parent and its first children
        // Applicable for BR,BL,TR,TL
        firstChildGap: 20,

        // Default direction used when elements
        // doesn't explicitly specify their direction.
        direction: 'R',

        // A rule telling how to reorganize a branch after reconnect.
        // The root of the branch can change the `direction` so
        // it might be desirable to change also the directions of
        // its descendants.
        directionRule: directionRules.straighten,

        // Allows elements to be positioned in animated manner.
        //
        // element.transition('position', position, {
        //   delay: 300,
        //   valueFunction: util.interpolate.object,
        // });
        updatePosition: function(element, position, opt) {
            element.set('position', position, opt);
        },

        // Allows vertices to be positioned in animated manner.
        // Please see `updatePosition` option.
        updateVertices: function(link, vertices, opt) {
            link.set('vertices', vertices, opt);
        },

        // Allows setting arbitrary (usually layout-related) attributes
        // on the cells as part of the layout.
        //
        // function(layoutArea, root, rootLink, opt) {
        //   /* update root and rootLink cells. */
        // }
        updateAttributes: null,

        // Arbitrary subtree can be skipped in the layout computation.
        // e.g. a collapse branch is not visible in the paper but present
        // in the graph.
        //
        // function(children, parent, opt) {
        //   /* returns filtered children */
        // }
        filter: null,

        // The element attributes that control layout
        // can be customized here.
        // e.g { direction: 'rankDir' }
        attributeNames: {
            // siblingRank: 'siblingRank',
            // direction: 'direction',
            // margin: 'margin',
            // offset: 'offset'
            // prevSiblingGap: 'prevSiblingGap'
            // nextSiblingGap: 'prevSiblingGap',
            // firstChildGap: 'firstChildGap'
        }
    },

    initialize: function() {

        // Caching the graph and the other options for a quicker access.
        this._cacheOptions(this.attributes);

        // Layout areas cache.
        this.layoutAreas = {};
    },

    // Auto layout the entire graph
    // Each root is treated separately.
    layout: function(opt) {

        // delete the previous layout areas
        this.layoutAreas = {};

        var graphSources = this.getGraphSources(opt);
        for (var i = 0, n = graphSources.length; i < n; i++) {
            this.layoutTree(graphSources[i], opt);
        }

        // COMPAT: backwards compatibility
        this.trigger('layout:done', opt);

        return this;
    },

    // Auto layout a single tree.
    layoutTree: function(root, opt) {

        opt = opt || {};
        opt.treeLayout = true;

        // create layout areas and compute relative positions
        var rootArea = this._computeLayoutAreas(root, null, opt);

        this._computeAbsolutePositions(rootArea);
        this._updateCells(rootArea, opt);

        return this;
    },

    // Returns the bounding box of all laid out elements.
    getLayoutBBox: function() {
        return this.getRootLayoutAreas().reduce(function(bbox, area) {
            var areaBBox = area.getBBox();
            if (!bbox) return areaBBox;
            return bbox.union(areaBBox);
        }, null);
    },

    getLayoutArea: function(element) {

        return this.layoutAreas[element.id || element] || null;
    },

    getRootLayoutAreas: function() {

        return this.getGraphSources().map(this.getLayoutArea, this);
    },

    // Returns filtered source elements from the graph
    getGraphSources: function(opt) {

        var sources = this.graph.getSources();
        if (this.filter && sources.length > 0) {
            sources = this.filter(sources, null, opt) || sources;
        }

        return sources;
    },

    // Returns a layout area with minimal size containing the given point.
    getMinimalRootAreaByPoint: function(point) {

        var rootLayoutAreas = this.getRootLayoutAreas().filter(function(layoutArea) {
            return layoutArea.containsPoint(point);
        });

        if (util.isEmpty(rootLayoutAreas)) {
            return null;
        }

        return rootLayoutAreas.reduce(function(res, layoutArea) {
            if (layoutArea.width * layoutArea.height < res.min) {
                res.min = layoutArea.width * layoutArea.height;
                res.item = layoutArea;
            }
            return res;
        }, { min: Infinity, item: undefined }).item;
    },

    // Recursively (in top-down fashion) computes the layout areas
    // for every single element in the current tree.
    _computeLayoutAreas: function(element, prevLayoutArea, opt) {

        // PHASE 1: Going from the root down to the leaves.
        var prevDirection = (prevLayoutArea) ? prevLayoutArea.direction : this.get('direction');
        var direction = element.get(this.getAttributeName('direction')) || prevDirection;
        var layoutArea = LayoutArea.create(direction, element, this.attributes);
        // Link to parent layout area
        layoutArea.parentArea = prevLayoutArea;
        // Find the element inbound link.
        layoutArea.link = this.graph.getConnectedLinks(element, { inbound: true })[0];
        // Recursion start.
        var children = this._getChildren(element, opt);
        // Store the layout area on the tree layout instance.
        this.layoutAreas[element.id] = layoutArea;
        var childLayoutAreas = [];
        for (var i = 0, n = children.length; i < n; i++) {
            childLayoutAreas.push(this._computeLayoutAreas(children[i], layoutArea, opt));
        }

        // PHASE 2: Going from the leaves up to the root.
        layoutArea.compute(childLayoutAreas);

        return layoutArea;
    },

    // Cache options on the instance object for quicker access.
    _cacheOptions: function(options) {

        var functionNames = [
            'updateAttributes',
            'updateVertices',
            'updatePosition',
            'filter'
        ];

        // cache functions
        functionNames.forEach(function(name) {
            this[name] = util.isFunction(options[name]) ? options[name] : null;
        }, this);

        // cache graph
        this.graph = options.graph;
    },

    // Returns filtered children for the given parent.
    _getChildren: function(parent, opt) {

        if (this.layoutAreas[parent.id]) {
            // prevent infinite loop in case there are cycles in the graph
            return [];
        }

        var children = this.graph.getNeighbors(parent, { outbound: true });
        if (this.filter && children.length > 0) {
            children = this.filter(children, parent, opt) || children;
        }

        return children;
    },

    // Recursively computes the elements absolute positions based on
    // the relative position and absolute position of the parent element.
    _computeAbsolutePositions: function(layoutArea) {

        layoutArea.computeAbsolutePosition(layoutArea);
        for (var i = 0, n = layoutArea.childAreas.length; i < n; i++) {
            this._computeAbsolutePositions(layoutArea.childAreas[i]);
        }
    },

    // Applies computed values on the tree cells.
    _updateCells: function(layoutArea, opt) {

        var rootElement = layoutArea.root;
        var rootLink = layoutArea.link || null;

        if (rootLink) {

            // update the position of the current root.
            if (this.updatePosition) {
                this.updatePosition(rootElement, layoutArea.getRootPosition(), opt);
            }

            // update the vertices of the link connected to the current root.
            if (this.updateVertices) {
                this.updateVertices(rootLink, layoutArea.getRootVertices(), opt);
            }
        }

        this.changeSiblingRank(rootElement, layoutArea.siblingRank, opt);

        // update the attributes of the current root and the associated link
        if (this.updateAttributes) {
            this.updateAttributes(layoutArea, rootElement, rootLink, opt);
        }

        for (var i = 0, n = layoutArea.childAreas.length; i < n; i++) {
            this._updateCells(layoutArea.childAreas[i], opt);
        }
    },

    updateDirections: function(root, rule, opt) {

        opt = opt || {};

        var directionAttribute = this.getAttributeName('direction');
        var getDirection = this.get('directionRule')(rule);

        this.graph.search(root, (element, level) => {

            if (level === 0) return;
            var newDirection = getDirection(element.get(directionAttribute));
            this.changeDirection(element, newDirection, opt);

        }, { outbound: true });
    },

    reconnectElement: function(element, targetElement, opt) {

        opt = opt || {};

        var layoutArea = this.getLayoutArea(element);
        var link = layoutArea.link;

        if (link) {

            link.set('source', { id: targetElement.id || targetElement }, opt);

            var oldDirection = layoutArea.direction;
            var newDirection = opt.direction || oldDirection;
            var newSiblingRank = opt.siblingRank || undefined;

            this.changeSiblingRank(element, newSiblingRank, opt);
            this.changeDirection(element, newDirection, opt);

            if (oldDirection !== newDirection) {
                this.updateDirections(element, [oldDirection, opt.direction], opt);
            }

            return true;
        }

        return false;
    },

    // A convenient way how to get/set cells attributes
    // as the attribute names can vary based on the tree layout settings.

    changeSiblingRank: function(element, siblingRank, opt) {

        element.set(this.getAttributeName('siblingRank'), siblingRank, opt);
    },

    changeDirection: function(element, direction, opt) {

        element.set(this.getAttributeName('direction'), direction, opt);
    },

    getAttributeName: function(attribute) {

        return this.get('attributeNames')[attribute] || attribute;
    },

    getAttribute: function(element, attribute) {

        return element.get(this.getAttributeName(attribute));
    },

    // COMPAT: backwards compatibility

    prepare: function() {

        // This method built the adjacency table originally.
        // No need for this now as the graph build one internally.
        return this;
    },

    removeElement: function(element, opt = {}) {

        const [parent] = this.graph.getNeighbors(element, { inbound: true });

        // reconnect the children of the removed element to the parent if present
        if (parent) {
            const siblingRank = element.get('siblingRank');
            const connectedLinks = this.graph.getConnectedLinks(element, {
                outbound: true
            });
            connectedLinks.forEach((link) => {
                link.source(parent);
                const child = link.getTargetCell();
                // Scale the children ranks between 0 and 1
                const scaledChildRank = g.scale.linear(
                    [0, connectedLinks.length],
                    [0, 1],
                    child.get('siblingRank')
                );
                child.set('siblingRank', siblingRank + scaledChildRank, opt);
            });
        }
        element.remove(opt);

        if (opt.layout === false) return;

        this.layout(opt);
    }

}, {

    directionRules: directionRules

});

