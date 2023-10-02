import { dia, g, util } from 'jointjs/src/core.mjs';
import { LabelAlignments, labelTextWrap } from './attributes.mjs';

export const Pool = dia.Element.define('bpmn2.Pool', {
    size: {
        width: 600,
        height: 300
    },

    lanes: null,

    milestones: null,

    milestonesSize: 20,

    padding: 0,

    headerSize: 20,

    attrs: {
        body: {
            refWidth: '100%',
            refHeight: '100%',
            fill: 'transparent',
        },

        laneGroups: {
            laneContainerPosition: true
        },

        laneHeaders: {
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 2,
            headerSize: true,
            shapeRendering: 'optimizespeed'
        },

        laneLabels: {
            fontSize: 14,
            fill: '#333333',
            transform: 'rotate(-90)',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            labelAlignment: LabelAlignments.center,
            labelMargin: { vertical: 1, horizontal: 10 },
            fontFamily: 'sans-serif',
            labelPosition: true,
            laneLabel: {
                textWrap: true,
                ellipsis: true
            }
        },

        lanes: {
            stroke: '#333333',
            strokeWidth: 2,
            fill: '#ffffff',
            laneSize: true,
            shapeRendering: 'optimizespeed'
        },

        milestoneGroups: {
            milestoneContainerPosition: true,
        },

        milestoneHeaders: {
            fill: '#ffffff',
            stroke: '#333333',
            strokeWidth: 2,
            milestoneHeaderSize: true,
            shapeRendering: 'optimizespeed'
        },

        milestoneLabels: {
            fontSize: 14,
            fill: '#333333',
            textAnchor: 'end',
            textVerticalAnchor: 'middle',
            labelAlignment: LabelAlignments.rightMiddle,
            labelMargin: { vertical: 1, horizontal: 10 },
            fontFamily: 'sans-serif',
            milestoneLabelPosition: true,
            milestoneLabel: {
                textWrap: true,
                ellipsis: true
            }
        },

        milestoneLines: {
            stroke: '#333333',
            strokeWidth: 2,
            milestoneLinePosition: true,
            shapeRendering: 'optimizespeed'
        }
    }
}, {
    metrics: null,

    markup: [{
        tagName: 'rect',
        selector: 'body'
    }],

    markupAttributes: [
        'lanes',
        'padding',
        'milestones',
        'headerSize',
        'milestonesSize'
    ],

    initialize: function() {
        dia.Element.prototype.initialize.apply(this, arguments);
        this.on('change', this.onChange, this);
        this.buildMarkup();
    },

    anyHasChanged: function(attributes) {
        if (!Array.isArray(attributes)) return false;
        return attributes.some(function(attrName) {
            return this.hasChanged(attrName);
        }, this);
    },

    onChange: function(_, opt) {
        if (opt.pool !== this.id && this.hasChanged('markup')) error('Markup cannot be modified.');
        if (this.anyHasChanged(this.markupAttributes)) this.buildMarkup(opt);
    },

    buildMarkup: function(opt) {
        const markup = util.cloneDeep(this.markup);
        if (!Array.isArray(markup)) error('Expects Prototype JSON Markup.');

        const lanes = this.attributes.lanes || [{}];
        if (!Array.isArray(lanes)) error('Expects lanes to be an array.');

        const milestones = this.attributes.milestones || [];
        if (!Array.isArray(milestones)) error('Expects milestones to be an array.');

        const metrics = this.metrics = {};
        metrics.lanes = {};
        metrics.lanesNameCache = {};
        metrics.milestonesNameCache = {};
        metrics.milestones = {};
        metrics.totalTakenHeightSpace = 0;
        metrics.topLaneGroupsCount = lanes.length;
        metrics.padding = util.normalizeSides(this.attributes.padding);

        this.buildLanesMarkupRecursively(lanes, markup, null, 1, 0);
        this.buildMilestones(milestones, markup);

        const flags = util.assign({ pool: this.id, dry: true }, opt);
        this.set('markup', markup, flags);

        if (flags.autoResize !== false) {
            this.autoresize(flags);
        }
    },

    buildLanesMarkupRecursively: function(sublanes, parentMarkupChildrenArray, parentId, currentNestLevel, parentSublanesCount) {
        if (!Array.isArray(sublanes)) error('Expects lanes to be an array.');
        let takenUpSpaceByLaneAndSublanes = 0;

        sublanes.forEach((sublane, index) => {
            let spaceTakenByFixedSublanes = 0;
            const customId = (sublane.id !== undefined && sublane.id !== '') ? sublane.id : null;
            const uniqueId = parentId !== null ? `${parentId}_${index}` : `${index}`;

            const gContainerMarkup = this.getLaneGroupMarkup(uniqueId, customId);
            parentMarkupChildrenArray.push(gContainerMarkup);

            const laneSize = Number.isFinite(sublane.size) ? Math.max(sublane.size, 0) : undefined;
            const laneMarkup = this.getLaneMarkup(uniqueId, customId);
            gContainerMarkup.children.push(laneMarkup);

            const label = sublane.label;
            const hasLabel = typeof sublane.label === 'string';
            const headerSize = hasLabel ? (Number.isFinite(sublane.headerSize) ? Math.max(sublane.headerSize, 0) : this.attributes.headerSize) : 0;

            if (hasLabel) {
                const headerMarkup = this.getHeaderMarkup(uniqueId, customId);
                const labelMarkup = this.getLabelMarkup(uniqueId, customId);
                gContainerMarkup.children.push(headerMarkup);
                gContainerMarkup.children.push(labelMarkup);
            }

            // recursion start
            if (sublane.sublanes && !Array.isArray(sublane.sublanes)) {
                error('Expects sublanes to be an array.');
            }
            const childSublanes = sublane.sublanes || [];

            if (childSublanes.length) {
                const markupChildrenArray = gContainerMarkup.children;
                const childrenNestLevel = currentNestLevel + 1;

                spaceTakenByFixedSublanes = this.buildLanesMarkupRecursively(
                    childSublanes,
                    markupChildrenArray,
                    uniqueId,
                    childrenNestLevel,
                    childSublanes.length
                );
            }

            spaceTakenByFixedSublanes = (laneSize && laneSize > spaceTakenByFixedSublanes) ? laneSize : spaceTakenByFixedSublanes;
            takenUpSpaceByLaneAndSublanes += spaceTakenByFixedSublanes;

            const laneGroupMetrics = {
                nestLevel: currentNestLevel,
                laneIndexWithinGroup: index,
                parentId: parentId ? `lanes_${parentId}` : null,
                parentSublanesCount,
                headerSize,
                label,
                hasLabel,
                size: laneSize,
                takenUpSpaceByLaneAndSublanes: spaceTakenByFixedSublanes,
                sublanesCount: childSublanes.length,
                customId: customId
            }
            this.addLaneGroupMetrics(uniqueId, laneGroupMetrics);
        });

        return takenUpSpaceByLaneAndSublanes;
    },

    buildMilestones: function(milestones, markup) {
        const { metrics, attributes } = this;
        const padding = metrics.padding;
        metrics.milestonesCount = milestones.length;
        padding.top += milestones.length ? attributes.milestonesSize : 0;

        milestones.forEach((milestone, index) => {
            const customId = milestone.id;
            const milestoneGroupId = `milestone_${index}`;
            const otherCustomIdOverwritesThisId = metrics.milestonesNameCache[milestoneGroupId] !== undefined;

            if (customId) {
                const customIdOverwritesPreviousMilestoneId = (customId !== milestoneGroupId) && metrics.milestones[customId] !== undefined;
                const customIdAlreadyExists = metrics.milestonesNameCache[customId] !== undefined;

                if (customIdAlreadyExists || customIdOverwritesPreviousMilestoneId) {
                    error('Duplicated milestone group id: ' + customId);
                }
                metrics.milestonesNameCache[customId] = milestoneGroupId;
            }
            if (otherCustomIdOverwritesThisId) {
                error('Duplicated milestone group id: ' + milestoneGroupId);
            }

            const gContainerMarkup = this.getMilestoneGroupMarkup(index, customId);
            markup.push(gContainerMarkup);

            const header = this.getMilestoneHeaderMarkup(index, customId);
            const label = this.getMilestoneLabelMarkup(index, customId);
            const line = this.getMilestoneLineMarkup(index, customId);

            metrics.milestones[milestoneGroupId] = {
                label: typeof milestone.label === 'string' ? milestone.label : '',
                indexWithin: index,
                size: Number.isFinite(milestone.size) ? Math.max(milestone.size, 0) : undefined,
                customId: customId
            };

            gContainerMarkup.children.push(line);
            gContainerMarkup.children.push(header);
            gContainerMarkup.children.push(label);
        });
    },

    addLaneGroupMetrics: function(uniqueId, laneGroupMetrics) {
        const laneGroupId = `lanes_${uniqueId}`;
        const { laneSize, customId } = laneGroupMetrics;
        const { metrics } = this;
        const otherCustomIdOverwritesThisId = metrics.lanesNameCache[laneGroupId] !== undefined;

        if (otherCustomIdOverwritesThisId) {
            error('Duplicated lane group id: ' + laneGroupId);
        }

        if (customId !== null) {
            const customIdOverwritesPreviousLaneId = (customId !== laneGroupId) && metrics.lanes[customId] !== undefined;
            const customIdAlreadyExists = metrics.lanesNameCache[customId] !== undefined;

            if (customIdAlreadyExists || customIdOverwritesPreviousLaneId) {
                error('Duplicated lane group id: ' + customId);
            }
            metrics.lanesNameCache[customId] = laneGroupId;
        }

        metrics.lanes[laneGroupId] = laneGroupMetrics;

        if (Number.isFinite(laneSize)) {
            metrics.totalTakenHeightSpace += laneSize;
        }
    },

    autoresize: function(flags) {
        const minSize = this.getMinimalSize();
        const currentSize = this.attributes.size;
        this.resize(Math.max(minSize.width, currentSize.width), Math.max(minSize.height, currentSize.height), flags);
    },

    getMinimalSize: function() {
        const { metrics } = this;
        const padding = metrics.padding;
        let minWidth;
        let minHeight;
        let laneHeadersWidth = 0;
        let laneHeights = 0
        let milestonesWidth = 0;
        const milestonesHeight = this.attributes.milestonesSize;

        const lanes = metrics.lanes;
        const milestones = metrics.milestones;

        Object.keys(lanes).forEach(laneId => {
            const lane = lanes[laneId];
            let tempId = laneId;
            let tempHeadersWidth = 0;
            while (tempId) {
                const parentLane = metrics.lanes[tempId];
                tempHeadersWidth += parentLane.headerSize || 0;
                tempId = parentLane.parentId;
            }

            laneHeadersWidth = tempHeadersWidth > laneHeadersWidth ? tempHeadersWidth : laneHeadersWidth;

            if (lane.nestLevel === 1) {
                laneHeights += lane.takenUpSpaceByLaneAndSublanes || 0;
            }
        });

        Object.keys(milestones).forEach(key => {
            milestonesWidth += milestones[key].size || 0;
        });

        minWidth = laneHeadersWidth > milestonesWidth ? laneHeadersWidth : milestonesWidth;
        minHeight = (metrics.milestonesCount && milestonesHeight > laneHeights) ? 0 : laneHeights;

        return { height: minHeight + padding.top + padding.bottom, width: minWidth + padding.left + padding.right };

    },

    getLaneGroupMarkup: function(id, customId) {
        const groupSelectors = ['laneGroups'];
        if (customId) {
            groupSelectors.push(`lanes_${customId}`);
        }
        return {
            tagName: 'g',
            selector: `lanes_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                laneGroupId: `lanes_${id}`
            },
            children: []
        }
    },

    getMilestoneGroupMarkup: function(id, customId) {
        const groupSelectors = ['milestoneGroups'];
        if (customId) {
            groupSelectors.push(`milestone_${customId}`);
        }
        return {
            tagName: 'g',
            selector: `milestone_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                milestoneGroupId: `milestone_${id}`
            },
            children: []
        }
    },

    getLaneMarkup: function(id, customId) {
        const groupSelectors = ['lanes'];
        if (customId) {
            groupSelectors.push(`lane_${customId}`);
        }
        return {
            tagName: 'rect',
            selector: `lane_${id}`,
            groupSelector: groupSelectors,
            children: [],
            attributes: {
                laneGroupId: `lanes_${id}`
            }
        }
    },

    getHeaderMarkup: function(id, customId) {
        const groupSelectors = ['laneHeaders'];
        if (customId) {
            groupSelectors.push(`header_${customId}`);
        }
        return {
            tagName: 'rect',
            selector: `header_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                laneGroupId: `lanes_${id}`
            }
        }
    },

    getLabelMarkup: function(id, customId) {
        const groupSelectors = ['laneLabels'];
        if (customId) {
            groupSelectors.push(`label_${customId}`);
        }
        return {
            tagName: 'text',
            selector: `label_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                laneGroupId: `lanes_${id}`
            }
        }
    },

    getMilestoneHeaderMarkup: function(id, customId) {
        const groupSelectors = ['milestoneHeaders'];
        if (customId) {
            groupSelectors.push(`milestoneHeader_${customId}`);
        }
        return {
            tagName: 'rect',
            selector: `milestoneHeader_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                milestoneGroupId: `milestone_${id}`
            }
        }
    },

    getMilestoneLabelMarkup: function(id, customId) {
        const groupSelectors = ['milestoneLabels'];
        if (customId) {
            groupSelectors.push(`milestoneLabel_${customId}`);
        }
        return {
            tagName: 'text',
            selector: `milestoneLabel_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                milestoneGroupId: `milestone_${id}`
            }
        }
    },

    getMilestoneLineMarkup: function(id, customId) {
        const groupSelectors = ['milestoneLines'];
        if (customId) {
            groupSelectors.push(`milestoneLine_${customId}`);
        }
        return {
            tagName: 'line',
            selector: `milestoneLine_${id}`,
            groupSelector: groupSelectors,
            attributes: {
                milestoneGroupId: `milestone_${id}`
            }
        }
    },

    getParentIndexesArray: function(laneGroupId) {
        let indexesPath = [];
        let tempParentLaneGroupId = laneGroupId;

        while (tempParentLaneGroupId) {
            indexesPath.push(tempParentLaneGroupId);
            const parentCache = this.metrics.lanes[tempParentLaneGroupId];
            tempParentLaneGroupId = parentCache.parentId;
        }
        return indexesPath.reverse();
    },

    getFlexAndFixedLaneSizesWithinGroup: function(laneGroupId) {
        const { metrics } = this;
        const laneGroupCache = metrics.lanes[laneGroupId];

        let parentId = laneGroupCache.parentId;
        let totalFixedSize = 0;
        let flexLanesWithinGroupCount = 0;
        let tempLaneIndexWithin = laneGroupCache.parentSublanesCount - 1;

        if (!parentId) {
            parentId = 'lanes';
            tempLaneIndexWithin = metrics.topLaneGroupsCount - 1;
        }

        while (tempLaneIndexWithin >= 0) {
            const tempId = `${parentId}_${tempLaneIndexWithin}`;
            const tempLaneGroupCache = metrics.lanes[tempId];

            if (Number.isFinite(tempLaneGroupCache.size)) {
                totalFixedSize += Math.max(tempLaneGroupCache.size, tempLaneGroupCache.takenUpSpaceByLaneAndSublanes);
            } else {
                flexLanesWithinGroupCount++;
            }
            tempLaneIndexWithin--;
        }

        return { totalFixedSize, flexLanesWithinGroupCount };
    },

    getLaneWidth: function(laneGroupId) {
        const { metrics } = this;
        const padding = metrics.padding;
        const indexesPath = this.getParentIndexesArray(laneGroupId);
        const shapeCurrentWidth = this.attributes.size.width - padding.left - padding.right;
        let tempHeaderHeights = 0;

        indexesPath.forEach(parentId => {
            const parentCache = metrics.lanes[parentId];
            tempHeaderHeights += parentCache.headerSize;
        });
        return Math.max(shapeCurrentWidth - tempHeaderHeights, 0);
    },

    getLaneHeight: function(laneGroupId) {
        const { metrics } = this;
        const laneGroupCache = metrics.lanes[laneGroupId];
        const padding = metrics.padding;
        let parentIndexesPath = this.getParentIndexesArray(laneGroupId);
        const shapeCurrentHeight = this.attributes.size.height - padding.top - padding.bottom;
        const parentId = laneGroupCache.parentId;
        let leftFlexHeight = shapeCurrentHeight;

        // last lane in group - extend it to take the remaining space
        if (parentId) {
            const parentCache = metrics.lanes[parentId];
            const parentSublanesCount = parentCache.sublanesCount;
            const laneIndexWithin = laneGroupCache.laneIndexWithinGroup;
            const isBottomMostSublane = laneIndexWithin === parentSublanesCount - 1;

            if (isBottomMostSublane) {
                const { y } = this.getLaneContainerPosition(laneGroupId);
                const parentHeight = this.getLaneHeight(parentId);
                return Math.max(parentHeight - y, 0);
            }
        }

        // lane has fixed height
        if (Number.isFinite(laneGroupCache.size)) {
            // fixed lane is one of the top lanes
            if (!parentId && (laneGroupCache.laneIndexWithinGroup === metrics.topLaneGroupsCount - 1)) {
                const { y } = this.getLaneContainerPosition(laneGroupId);
                return Math.max(this.attributes.size.height - y - padding.bottom, 0);
            } else {
                const childrenFixedSize = laneGroupCache.takenUpSpaceByLaneAndSublanes;
                return Math.max(childrenFixedSize, laneGroupCache.size, 0);
            }
        }

        // check if some of the parents has fixed size
        const idOfParentWithFixedSize = parentIndexesPath.map(p => p).reverse().find(p => metrics.lanes[p].size);

        if (idOfParentWithFixedSize) {
            let parentIndexesPathClone = parentIndexesPath.map(p => p);
            const parentIndex = parentIndexesPathClone.indexOf(idOfParentWithFixedSize);
            parentIndexesPath = parentIndexesPathClone.slice(parentIndex + 1);
            leftFlexHeight = metrics.lanes[idOfParentWithFixedSize].size;
        }

        // lane doesn't have specified size - so calculate flex size for it
        // to do that, all fixed lanes and all lanes with fixed children need to be taken into account
        parentIndexesPath.forEach(pId => {
            const tempSizes = this.getFlexAndFixedLaneSizesWithinGroup(pId); // will return all lanes with height set
            const currentPathCache = metrics.lanes[pId];
            const cacheParentId = currentPathCache.parentId;
            const tempParentSublanesCount = metrics.lanes[pId].parentSublanesCount;
            const topLaneGroupsCount = metrics.topLaneGroupsCount;

            // if lane doesn't have parent then it's one of the top lanes
            let overflowingFixedLaneSizes = 0;
            let overflowingFixedLanesCount = 0;

            // calculate optimal flex size - it will be used to check if lane fits in this size
            let baseFlexSize = (leftFlexHeight - tempSizes.totalFixedSize) / ((tempSizes.flexLanesWithinGroupCount) || 1);

            let tempIndexWithin = cacheParentId ? tempParentSublanesCount - 1 : topLaneGroupsCount - 1;

            // now count all lanes that are actually overflowing
            while (tempIndexWithin >= 0) {
                const tempId = `${cacheParentId ? cacheParentId : 'lanes'}_${tempIndexWithin}`;

                // skip oneself
                if (tempId === laneGroupId) {
                    tempIndexWithin--;
                    continue;
                }

                const tempCacheOfLaneWithinThisGroup = metrics.lanes[tempId];
                const tempSublanesFixedSize = tempCacheOfLaneWithinThisGroup.takenUpSpaceByLaneAndSublanes;

                if (!tempCacheOfLaneWithinThisGroup.size && (tempSublanesFixedSize > baseFlexSize)) {
                    overflowingFixedLaneSizes += tempSublanesFixedSize;
                    overflowingFixedLanesCount++;
                }
                tempIndexWithin--;
            }

            leftFlexHeight -= (tempSizes.totalFixedSize + overflowingFixedLaneSizes);
            leftFlexHeight /= Math.max(tempSizes.flexLanesWithinGroupCount - overflowingFixedLanesCount, 1);
        });

        // if this lane is overflowing - fit it to its content
        const fixedSizeByLaneSublanes = laneGroupCache.takenUpSpaceByLaneAndSublanes;
        const result = fixedSizeByLaneSublanes > leftFlexHeight ? fixedSizeByLaneSublanes : leftFlexHeight;

        return Math.max(result, 0);
    },

    getMilestoneWidth: function(milestoneGroupId) {
        const { metrics } = this;
        const padding = metrics.padding;
        const shapeWidth = this.attributes.size.width - padding.left - padding.right;
        const milestoneCache = metrics.milestones[milestoneGroupId];
        const milestonesCount = metrics.milestonesCount;

        if (Number.isFinite(milestoneCache.size)) {
            return milestoneCache.size;
        }

        let tempMilestonesCountIndex = milestonesCount - 1;
        let takenFixedWidth = 0;
        let fixedMilestonesCount = 0;

        while (tempMilestonesCountIndex >= 0) {
            const tempMilestoneId = `milestone_${tempMilestonesCountIndex}`;
            const tempCache = metrics.milestones[tempMilestoneId];

            if (Number.isFinite(tempCache.size)) {
                takenFixedWidth += tempCache.size;
                fixedMilestonesCount++;
            }
            tempMilestonesCountIndex--;
        }

        const flexWidth = (shapeWidth - takenFixedWidth) / ((milestonesCount - fixedMilestonesCount) || 1);
        return Math.max(flexWidth, 0);
    },

    getLaneContainerPosition: function(laneGroupId) {
        const { metrics } = this;
        const padding = metrics.padding;
        const laneGroupCache = metrics.lanes[laneGroupId];
        const { laneIndexWithinGroup, nestLevel, parentId } = laneGroupCache;
        const parentLabelWidth = parentId ? metrics.lanes[parentId].headerSize : 0;

        let x = parentLabelWidth;
        let y = 0;

        if (nestLevel === 1) {
            x += padding.left;
            y += padding.top;
        }

        let laneUpHeights = 0;
        let tempIndex = laneIndexWithinGroup - 1;

        while (tempIndex >= 0) {
            const tempId = parentId ? `${parentId}_${tempIndex}` : `lanes_${tempIndex}`;
            laneUpHeights += this.getLaneHeight(tempId);
            tempIndex--;
        }

        return new g.Point(x, y + laneUpHeights);
    },

    getMilestoneContainerPosition: function(milestoneGroupId) {
        const { metrics } = this;
        const milestoneGroupCache = metrics.milestones[milestoneGroupId];
        const indexWithin = milestoneGroupCache.indexWithin;
        const padding = metrics.padding;

        let tempCacheIndex = indexWithin - 1;
        let takenWidth = 0;

        while (tempCacheIndex >= 0) {
            const tempId = `milestone_${tempCacheIndex}`;
            const tempWidth = this.getMilestoneWidth(tempId);
            takenWidth += tempWidth;
            tempCacheIndex--;
        }

        const milestoneHeight = this.attributes.milestonesSize;
        const x = takenWidth + padding.left;
        const y = padding.top - milestoneHeight;

        return new g.Point(x, y);
    },

    getLaneBBox: function(laneGroupId) {
        if (typeof laneGroupId !== 'string') {
            error('Expects id to be a string');
        }
        const { metrics } = this;
        const poolPosition = this.position();

        let laneCache = metrics.lanes[laneGroupId];

        if (!laneCache) {
            laneGroupId = metrics.lanesNameCache[laneGroupId];
            laneCache = metrics.lanes[laneGroupId];
        }

        if (!laneCache) {
            return null;
        }

        const parentId = laneCache.parentId;
        const headerSize = laneCache.headerSize;
        let parentLaneOriginPoint = { x: 0, y: 0 };

        if (parentId) {
            const parentBBox = this.getLaneBBox(parentId);
            parentLaneOriginPoint.x += parentBBox.x - poolPosition.x;
            parentLaneOriginPoint.y += parentBBox.y - poolPosition.y;
        }

        const { x, y } = this.getLaneContainerPosition(laneGroupId);
        const width = this.getLaneWidth(laneGroupId);
        const height = this.getLaneHeight(laneGroupId);

        return new g.Rect({
            x: x + parentLaneOriginPoint.x + poolPosition.x,
            y: y + parentLaneOriginPoint.y + poolPosition.y,
            width: width + headerSize,
            height
        });
    },

    getParentLaneId(laneId) {
        const { lanes, lanesNameCache: customIds } = this.metrics;

        const key = customIds.hasOwnProperty(laneId) ? customIds[laneId] : laneId;
        if (!(key in lanes)) {
            error(`Lane with ID ${laneId} wasn't found`);
        }

        const lane = lanes[key];

        if (lane.parentId === null) {
            return null;
        }
        const parentLane = lanes[lane.parentId];

        return (parentLane.customId !== null) ? parentLane.customId : lane.parentId;
    },

    getLanesIds: function() {
        const { lanes } = this.metrics;
        const defaultIds = Object.keys(lanes);
        return defaultIds.map((defaultId) => {
            const { customId: customId } = lanes[defaultId];
            return (customId !== null) ? customId : defaultId;
        });
    },

    getMilestoneBBox: function(milestoneGroupId) {
        if (typeof milestoneGroupId !== 'string') {
            error('Expects id to be a string');
        }
        const { metrics, attributes } = this;
        const padding = metrics.padding;
        const metricsMilestones = metrics.milestones;

        let milestoneCache = metricsMilestones[milestoneGroupId];

        if (!milestoneCache) {
            milestoneGroupId = metrics.milestonesNameCache[milestoneGroupId];
            milestoneCache = metricsMilestones[milestoneGroupId];
        }

        if (!milestoneCache) {
            return null;
        }

        const poolPosition = this.position();
        const width = this.getMilestoneWidth(milestoneGroupId);
        const milestoneHeight = attributes.milestonesSize;
        const height = attributes.size.height - padding.bottom - padding.top + milestoneHeight;
        const { x, y } = this.getMilestoneContainerPosition(milestoneGroupId);

        return new g.Rect(x + poolPosition.x, y + poolPosition.y, width, height);
    },

    getLanesFromPoint: function(point) {
        if (!point) {
            error('A point is required');
        }
        const bbox = this.getBBox();
        const center = bbox.center();
        const shapeAngle = this.angle();
        const pointUnrotated = new g.Point(point).rotate(center, shapeAngle);

        if (!bbox.containsPoint(pointUnrotated)) {
            return [];
        }

        const metrics = this.metrics;
        const metricsLanes = metrics.lanes;
        const result = [];

        const recursion = (parentId) => {
            let tempIndex = parentId ? metricsLanes[parentId].sublanesCount - 1 : metrics.topLaneGroupsCount - 1;

            while (tempIndex >= 0) {
                const laneId = parentId ? `${parentId}_${tempIndex}` : `lanes_${tempIndex}`;
                const bbox = this.getLaneBBox(laneId);

                if (bbox.containsPoint(pointUnrotated)) {
                    const customId = metricsLanes[laneId].customId;
                    result.push(customId ? customId : laneId);
                    recursion(laneId);
                    break;
                }
                tempIndex--;
            }
        }
        recursion();

        return result.reverse();
    },

    getMilestoneFromPoint: function(point) {
        if (!point) {
            error('A point is required');
        }
        const metrics = this.metrics;
        const bbox = this.getBBox();
        const shapeAngle = this.angle();
        const pointUnrotated = new g.Point(point).rotate(bbox.center(), shapeAngle);

        if (!bbox.containsPoint(pointUnrotated)) {
            return null;
        }

        let tempIndex = metrics.milestonesCount - 1;

        while (tempIndex >= 0) {
            const milestoneId = `milestone_${tempIndex}`;
            const milestoneBBox = this.getMilestoneBBox(milestoneId);

            if (milestoneBBox.containsPoint(pointUnrotated)) {
                const customId = metrics.milestones[milestoneId].customId;
                return (customId === undefined) ? milestoneId : customId;
            }
            tempIndex--;
        }
        return null;
    },

    getLanePath: function(laneId) {
        const metrics = this.metrics;
        const allLanesMetrics = metrics.lanes;
        let laneMetrics = allLanesMetrics[laneId];

        if (laneMetrics === undefined) {
            const name = metrics.lanesNameCache[laneId];
            laneMetrics = allLanesMetrics[name];
        }

        if (laneMetrics === undefined) {
            return [];
        }

        const path = [laneMetrics.laneIndexWithinGroup];
        let tempParentMetrics = laneMetrics;

        while (tempParentMetrics.parentId) {
            const parentIndex = allLanesMetrics[tempParentMetrics.parentId].laneIndexWithinGroup;
            path.unshift(parentIndex, 'sublanes');
            tempParentMetrics = allLanesMetrics[tempParentMetrics.parentId];
        }

        path.unshift('lanes');

        return path;
    },

    toJSON: function() {
        const json = dia.Element.prototype.toJSON.apply(this, arguments);
        delete json.markup;
        return json;
    }

}, {
    attributes: {
        laneContainerPosition: {
            position: function(_, refBBox, node) {
                const laneGroupId = node.getAttribute('laneGroupId');
                return this.model.getLaneContainerPosition(laneGroupId);
            }
        },

        laneSize: {
            set: function(_, refBBox, node) {
                const { model } = this;
                const laneGroupId = node.getAttribute('laneGroupId');
                const laneWidth = model.getLaneWidth(laneGroupId);
                const laneHeight = model.getLaneHeight(laneGroupId);
                const headerSize = model.metrics.lanes[laneGroupId].headerSize;

                return { width: laneWidth + headerSize, height: laneHeight };
            }
        },

        headerSize: {
            set: function(_, refBBox, node) {
                const laneGroupId = node.getAttribute('laneGroupId');
                const laneGroupCache = this.model.metrics.lanes[laneGroupId];

                const headerSize = laneGroupCache.headerSize;
                const height = Math.max(this.model.getLaneHeight(laneGroupId), 0);

                return { width: headerSize, height: height }
            }
        },

        labelPosition: {
            position: function(_, refBBox, node, attrs) {
                const { model } = this;
                const laneGroupId = node.getAttribute('laneGroupId');
                const laneGroupCache = model.metrics.lanes[laneGroupId];
                const width = laneGroupCache.headerSize;
                const height = model.getLaneHeight(laneGroupId);

                // rotate margins
                const { left: top, top: left, right: bottom, bottom: right } = util.normalizeSides(attrs.labelMargin);
                const halfHeight = height / 2;
                const halfWidth = width / 2;
                const alignment = attrs.labelAlignment;

                switch (alignment) {
                    case LabelAlignments.topMiddle:
                        return { x: left, y: halfHeight + top - bottom };

                    case LabelAlignments.topLeft:
                        return { x: left, y: height - bottom };

                    case LabelAlignments.topRight:
                        return { x: left, y: top };

                    case LabelAlignments.leftMiddle:
                        return { x: halfWidth + left - right, y: height - bottom };

                    case LabelAlignments.rightMiddle:
                        return { x: halfWidth + left - right, y: top };

                    case LabelAlignments.bottomLeft:
                        return { x: width - right, y: height - bottom };

                    case LabelAlignments.bottomMiddle:
                        return { x: width - right, y: halfHeight + top - bottom };

                    case LabelAlignments.bottomRight:
                        return { x: width - right, y: top };

                    case LabelAlignments.center:
                    default:
                        return { x: halfWidth + left - right, y: halfHeight + top - bottom }
                }
            }
        },

        laneLabel: {
            set: function(opt, refBBox, node, attrs) {
                if (!util.isPlainObject(opt)) {
                    return null;
                }
                const { model } = this;
                const laneGroupId = node.getAttribute('laneGroupId');
                const laneGroupCache = model.metrics.lanes[laneGroupId];
                const height = laneGroupCache.headerSize;
                const width = model.getLaneHeight(laneGroupId);
                const text = laneGroupCache.label;

                return labelTextWrap(this, opt, node, attrs, width, height, text);
            }
        },

        milestoneContainerPosition: {
            position: function(_, refBBox, node) {
                const milestoneGroupId = node.getAttribute('milestoneGroupId');
                return this.model.getMilestoneContainerPosition(milestoneGroupId);
            }
        },

        milestoneHeaderSize: {
            set: function(_, refBBox, node) {
                const { model } = this;
                const milestoneGroupId = node.getAttribute('milestoneGroupId');

                const width = model.getMilestoneWidth(milestoneGroupId);
                const height = model.attributes.milestonesSize;

                return { width: width, height: height };
            }
        },

        milestoneLabelPosition: {
            position: function(_, refBBox, node, attrs) {
                const { model } = this;
                const milestoneGroupId = node.getAttribute('milestoneGroupId');
                const width = model.getMilestoneWidth(milestoneGroupId);
                const height = model.attributes.milestonesSize;

                const { left, top, right, bottom } = util.normalizeSides(attrs.labelMargin);
                const halfHeight = height / 2;
                const halfWidth = width / 2;
                const alignment = attrs.labelAlignment;

                switch (alignment) {
                    case LabelAlignments.topMiddle:
                        return { x: halfWidth + left - right, y: top };

                    case LabelAlignments.topLeft:
                        return { x: left, y: top };

                    case LabelAlignments.topRight:
                        return { x: width - right, y: top };

                    case LabelAlignments.leftMiddle:
                        return { x: left, y: halfHeight + top - bottom };

                    case LabelAlignments.bottomLeft:
                        return { x: left, y: height - bottom };

                    case LabelAlignments.bottomMiddle:
                        return { x: halfWidth + left - right, y: height - bottom };

                    case LabelAlignments.bottomRight:
                        return { x: width - right, y: height - bottom };

                    case LabelAlignments.rightMiddle:
                        return { x: width - right, y: halfHeight + top - bottom };

                    case LabelAlignments.center:
                    default:
                        return { x: halfWidth + left - right, y: halfHeight + top - bottom };
                }
            }
        },

        milestoneLabel: {
            set: function(opt, _, node, attrs) {
                if (!util.isPlainObject(opt)) {
                    return null;
                }
                const { model } = this;
                const milestoneLabelId = node.getAttribute('milestoneGroupId');
                const milestoneLabelCache = model.metrics.milestones[milestoneLabelId];
                const width = model.getMilestoneWidth(milestoneLabelId);
                const height = model.attributes.milestonesSize;
                const text = milestoneLabelCache.label;

                return labelTextWrap(this, opt, node, attrs, width, height, text);
            }
        },

        milestoneLinePosition: {
            set: function(_, relativeShapeBBox, node) {
                const { model } = this;
                const shapePosition = model.position();
                const padding = model.metrics.padding;
                const milestoneHeaderHeight = model.attributes.milestonesSize;

                const milestoneLabelId = node.getAttribute('milestoneGroupId');
                const { x, width, height } = model.getMilestoneBBox(milestoneLabelId);

                let cssDisplay = 'block';
                const shapeBBoxRightX = relativeShapeBBox.width - padding.right;
                // round the getMilestoneBBox values because it can return non-integer values
                const milestoneRightX = Math.ceil(x) - shapePosition.x + Math.ceil(width);

                // if its a last line hide it
                if (milestoneRightX >= shapeBBoxRightX) {
                    cssDisplay = 'none';
                }

                return { x1: width, x2: width, y1: milestoneHeaderHeight, y2: height, display: cssDisplay };
            }
        },

        textVertical: {
            set: function() {
                return { transform: 'rotate(-90)' };
            }
        },

        textWrap: {
            set: function(opt, refBBox, node, attrs) {
                if (attrs.textVertical) {
                    const width = refBBox.width;
                    refBBox.width = refBBox.height;
                    refBBox.height = width;
                }
                dia.attributes.textWrap.set.call(this, opt, refBBox, node, attrs);
            }
        },

        labelMargin: {},

        labelAlignment: {},
    }
});


export const HeaderedPool = Pool.define('bpmn2.HeaderedPool', {
    padding: { top: 0, left: 30, right: 0, bottom: 0 },
    attrs: {
        header: {
            width: 30,
            refHeight: '100%',
            stroke: '#333333',
            strokeWidth: 2,
            fill: '#ffffff',
            shapeRendering: 'optimizespeed'
        },
        headerLabel: {
            textVertical: true,
            textWrap: {
                width: -10,
                ellipsis: true,
                maxLineCount: 1
            },
            refX: 15,
            refY: '50%',
            fontSize: 20,
            fill: '#333333',
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'rect',
        selector: 'header'
    }, {
        tagName: 'text',
        selector: 'headerLabel'
    }],
});


// Views

const PoolViewPresentationAttributes = Pool.prototype.markupAttributes.reduce(function(presentationAttributes, attribute) {
    presentationAttributes[attribute] = ['UPDATE', 'TOOLS'];
    return presentationAttributes;
}, {});

export const PoolView = dia.ElementView.extend({
    presentationAttributes: dia.ElementView.addPresentationAttributes(PoolViewPresentationAttributes)
});

export const HeaderedPoolView = PoolView;

function error(message) {
    throw new Error('shapes.bpmn2.Pool: ' + message);
}
