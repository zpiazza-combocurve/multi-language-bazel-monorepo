import { V, util, dia, env } from 'jointjs/src/core.mjs';
import { TextBlockView, TextBlock } from 'jointjs/src/shapes/basic.mjs';

export const icons = {

    none: '',

    message: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDUxMiA1MTIiIGhlaWdodD0iNTEycHgiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEycHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik00NzkuOTk4LDY0SDMyQzE0LjMyOSw2NCwwLDc4LjMxMiwwLDk2djMyMGMwLDE3LjY4OCwxNC4zMjksMzIsMzIsMzJoNDQ3Ljk5OEM0OTcuNjcxLDQ0OCw1MTIsNDMzLjY4OCw1MTIsNDE2Vjk2ICBDNTEyLDc4LjMxMiw0OTcuNjcxLDY0LDQ3OS45OTgsNjR6IE00MTYsMTI4TDI1NiwyNTZMOTYsMTI4SDQxNnogTTQ0OCwzODRINjRWMTYwbDE5MiwxNjBsMTkyLTE2MFYzODR6Ii8+PC9zdmc+',

    plus: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI0IDI0IiBoZWlnaHQ9IjI0cHgiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0cHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIyLjUsMTRIMTR2OC41YzAsMC4yNzYtMC4yMjQsMC41LTAuNSwwLjVoLTRDOS4yMjQsMjMsOSwyMi43NzYsOSwyMi41VjE0SDAuNSAgQzAuMjI0LDE0LDAsMTMuNzc2LDAsMTMuNXYtNEMwLDkuMjI0LDAuMjI0LDksMC41LDlIOVYwLjVDOSwwLjIyNCw5LjIyNCwwLDkuNSwwaDRDMTMuNzc2LDAsMTQsMC4yMjQsMTQsMC41VjloOC41ICBDMjIuNzc2LDksMjMsOS4yMjQsMjMsOS41djRDMjMsMTMuNzc2LDIyLjc3NiwxNCwyMi41LDE0eiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+',

    cross: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI0IDI0IiBoZWlnaHQ9IjI0cHgiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0cHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik0yMi4yNDUsNC4wMTVjMC4zMTMsMC4zMTMsMC4zMTMsMC44MjYsMCwxLjEzOWwtNi4yNzYsNi4yN2MtMC4zMTMsMC4zMTItMC4zMTMsMC44MjYsMCwxLjE0bDYuMjczLDYuMjcyICBjMC4zMTMsMC4zMTMsMC4zMTMsMC44MjYsMCwxLjE0bC0yLjI4NSwyLjI3N2MtMC4zMTQsMC4zMTItMC44MjgsMC4zMTItMS4xNDIsMGwtNi4yNzEtNi4yNzFjLTAuMzEzLTAuMzEzLTAuODI4LTAuMzEzLTEuMTQxLDAgIGwtNi4yNzYsNi4yNjdjLTAuMzEzLDAuMzEzLTAuODI4LDAuMzEzLTEuMTQxLDBsLTIuMjgyLTIuMjhjLTAuMzEzLTAuMzEzLTAuMzEzLTAuODI2LDAtMS4xNGw2LjI3OC02LjI2OSAgYzAuMzEzLTAuMzEyLDAuMzEzLTAuODI2LDAtMS4xNEwxLjcwOSw1LjE0N2MtMC4zMTQtMC4zMTMtMC4zMTQtMC44MjcsMC0xLjE0bDIuMjg0LTIuMjc4QzQuMzA4LDEuNDE3LDQuODIxLDEuNDE3LDUuMTM1LDEuNzMgIEwxMS40MDUsOGMwLjMxNCwwLjMxNCwwLjgyOCwwLjMxNCwxLjE0MSwwLjAwMWw2LjI3Ni02LjI2N2MwLjMxMi0wLjMxMiwwLjgyNi0wLjMxMiwxLjE0MSwwTDIyLjI0NSw0LjAxNXoiLz48L3N2Zz4=',

    user: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDI0IDI0IiBoZWlnaHQ9IjI0cHgiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0cHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIyLDIwLjk5OGgtMWMwLDAtMSwwLTEtMVYxNy41YzAtMC4yNzctMC4yMjQtMC41LTAuNS0wLjVTMTksMTcuMjIzLDE5LDE3LjUgIGwtMC4wMDgsNC4yOTVjMCwwLjYwOS0yLjAxLDIuMjA1LTYuNDkyLDIuMjA1cy02LjQ5Mi0xLjU5Ni02LjQ5Mi0yLjIwNUw2LDE3LjVDNiwxNy4yMjMsNS43NzYsMTcsNS41LDE3UzUsMTcuMjIzLDUsMTcuNXYyLjQ5OCAgYzAsMS0xLDEtMSwxSDNjMCwwLTEsMC0xLTFWMTUuNzVjMC0yLjkyMiwyLjg5Mi01LjQwMSw2LjkzLTYuMzQxYzAsMCwxLjIzNCwxLjEwNywzLjU3LDEuMTA3czMuNTctMS4xMDcsMy41Ny0xLjEwNyAgYzQuMDM4LDAuOTQsNi45MywzLjQxOSw2LjkzLDYuMzQxdjQuMjQ4QzIzLDIwLjk5OCwyMiwyMC45OTgsMjIsMjAuOTk4eiBNMTIuNDc3LDljLTIuNDg1LDAtNC41LTIuMDE1LTQuNS00LjVTOS45OTEsMCwxMi40NzcsMCAgczQuNSwyLjAxNSw0LjUsNC41UzE0Ljk2Miw5LDEyLjQ3Nyw5eiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+',

    circle: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gULEBE3DEP64QAAAwlJREFUaN7dmktrU0EUx38ZmmBbfEIL2hSjkYKC1EW6EDFudC+404/gE6WKSvGxERQfIH4AX1T9EOKrCrYurVrbgsZWoaBVixDbpC6ci+Fyz9ybZG478cBs7syc+Z+5c86c+c8ksCPrgW1ADtgEbARafG1+AW+AYWAIGADGWUTZAJwHxoD5GssocA7ILiTwLcADoFQHcH8pAfeB7jiBtwO3gLJF4P5S1mO02wa/C5iMEbi/TAI7bYE/Y3m5VLOs+sLAJULqrgKHIxhZBp4DT4FX2jkLGoinq1M7fg7YDmwFVATd14CjFboiy5UIs/QBOAmka/izaeCU1hE2zuVqlZ8IUfgVOAA0WViiTcBBrdM0Zm9UhTuAOYOiRzXOeJh0Ak8M484B+TAlK4BPBiU3gWSMoTqpw6g0fgFYblJww9D5dojT25IEcMeA47rUsdsQLp9FmPmURSNSOqpJS2lzUKd+ocN3IBNx5mz+oXXADwHTXX/jjMFxjy1iwtgrYJoF1lY27BMafozZaaMspYKA7XRlw7f1xt4Y5biA7bXXIGv4TW0OGNCmsQRhzCidlwTJADDlgAFTwAuhLq+AHqHyMe6IhKVHAV1C5ZBDBkhYupThPPreIQNGJTJBGXKLLw4Z8NmQu/Fb8PCkQwakBIxFRWPLvAJmhMpWh4AuFb7PKGBaqFzjkAGrhe/TSjNrQZJ1yAAJy5gCRoTKnEMGSFhGFDBoOBu7IhKWQe8wLRFLHQ6A7zCcFNNK59vvAjoqYK8DBuwTCLBhTUD8Hweahj9S2jjU297VqzrU26BVmi2yEjXRKg1PbHnpqYla7AeWxAi+GbhHHdSit2mYyN2XQQ5kQTJ6Y6qL3PUkCr2+H7v0+jcs0eueRLngGNeKa9mxY73g8JzpEtHusorAQ/7e+e7WUWIl//jSVTrK7QEu6KgW9d7tYr3B44iBWPJfkZZ8pZ4r2VngkC0HywMTLNwN5YSBcKtZWoGzernEBbyox2iJc6Np2KcGfnHisYet1CDouc2yCjbhp07MrD+3+QNxi4JkAscRswAAAABJRU5ErkJggg==',

    service: 'data:image/png;base64,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'
};

// Icon Interface

export const IconInterface = {

    initialize: function() {

        // In order to be able to use multiple interfaces for one Backbone.model, we need to keep
        // reference to the actual parent class prototype.
        this._parent = (this._parent || this).constructor.__super__;

        this._parent.initialize.apply(this, arguments);

        this.listenTo(this, 'change:icon', this._onIconChange);

        this._onIconChange(this, this.get('icon') || 'none');
    },

    _onIconChange: function(cell, icon) {

        if (util.has(icons, icon)) {

            cell.attr({
                image: {
                    'xlink:href': icons[icon],
                    'dataIconType': icon
                }
            });

        } else {

            throw 'BPMN: Unknown icon: ' + icon;
        }
    }
};

// SubProcess Interface

export const SubProcessInterface = {

    initialize: function() {

        // See IconInterface.initialize()
        this._parent = (this._parent || this).constructor.__super__;

        this._parent.initialize.apply(this, arguments);

        this.listenTo(this, 'change:subProcess', this._onSubProcessChange);

        this._onSubProcessChange(this, this.get('subProcess') || null);
    },

    _onSubProcessChange: function(cell, subProcess) {

        cell.attr({
            '.sub-process': {
                visibility: subProcess ? 'visible' : 'hidden',
                'data-sub-process': subProcess || ''
            }
        });
    }
};


// Task

export const ActivityView = TextBlockView;
export const Activity = TextBlock.extend({

    markup: [
        '<g class="rotatable">',
        '<g class="scalable"><rect class="body outer"/><rect class="body inner"/></g>',
        env.test('svgforeignobject') ? '<foreignObject class="fobj"><body xmlns="http://www.w3.org/1999/xhtml"><div class="content"/></body></foreignObject>' : '<text class="content"/>',
        '<path class="sub-process"/><image class="icon"/></g>'
    ].join(''),

    defaults: util.deepSupplement({

        size: { width: 100, height: 100 },
        type: 'bpmn.Activity',
        attrs: {
            rect: {
                rx: 8,
                ry: 8,
                width: 100,
                height: 100
            },
            '.body': {
                fill: '#ffffff',
                stroke: '#000000'
            },
            '.inner': {
                transform: 'scale(0.9,0.9) translate(5,5)'
            },
            path: {
                d: 'M 0 0 L 30 0 30 30 0 30 z M 15 4 L 15 26 M 4 15 L 26 15',
                ref: '.inner',
                'ref-x': 0.5,
                'ref-dy': -30,
                'x-alignment': 'middle',
                stroke: '#000000',
                fill: 'transparent'
            },
            image: {
                ref: '.inner',
                'ref-x': 5,
                width: 20,
                height: 20
            }
        },
        activityType: 'task',
        subProcess: null

    }, TextBlock.prototype.defaults),

    initialize: function() {

        TextBlock.prototype.initialize.apply(this, arguments);

        this.listenTo(this, 'change:activityType', this.onActivityTypeChange);
        this.listenTo(this, 'change:subProcess', this.onSubProcessChange);

        this.onSubProcessChange(this, this.get('subProcess'));
        this.onActivityTypeChange(this, this.get('activityType'));
    },

    onActivityTypeChange: function(cell, type) {

        switch (type) {

            case 'task':

                cell.attr({
                    '.inner': {
                        visibility: 'hidden'
                    },
                    '.outer': {
                        'stroke-width': 1,
                        'stroke-dasharray': 'none'
                    },
                    path: {
                        ref: '.outer'
                    },
                    image: {
                        ref: '.outer'
                    }
                });

                break;

            case 'transaction':

                cell.attr({
                    '.inner': {
                        visibility: 'visible'
                    },
                    '.outer': {
                        'stroke-width': 1,
                        'stroke-dasharray': 'none'
                    },
                    path: {
                        ref: '.inner'
                    },
                    image: {
                        ref: '.inner'
                    }
                });

                break;

            case 'event-sub-process':

                cell.attr({
                    '.inner': {
                        visibility: 'hidden'
                    },
                    '.outer': {
                        'stroke-width': 1,
                        'stroke-dasharray': '1,2'
                    },
                    path: {
                        ref: '.outer'
                    },
                    image: {
                        ref: '.outer'
                    }
                });

                break;

            case 'call-activity':

                cell.attr({
                    '.inner': {
                        visibility: 'hidden'
                    },
                    '.outer': {
                        'stroke-width': 5,
                        'stroke-dasharray': 'none'
                    },
                    path: {
                        ref: '.outer'
                    },
                    image: {
                        ref: '.outer'
                    }
                });

                break;

            default:

                throw 'BPMN: Unknown Activity Type: ' + type;
        }
    },

    onSubProcessChange: function(cell, subProcess) {

        // Although that displaying sub-process icon is implemented in the interface
        // we want also to reposition text and image when sub-process is shown.

        if (subProcess) {

            cell.attr({
                '.fobj div': {
                    style: {
                        verticalAlign: 'baseline',
                        paddingTop: 10
                    }
                },
                image: {
                    'ref-dy': -25,
                    'ref-y': ''
                },
                '.content': { // IE fallback only
                    'ref-y': 10,
                    'y-alignment': null
                }
            });

        } else {

            cell.attr({
                '.fobj div': {
                    style: {
                        verticalAlign: 'middle',
                        paddingTop: 0
                    }
                },
                image: {
                    'ref-dy': '',
                    'ref-y': 5
                },
                '.content': { // IE fallback only
                    'ref-y': .5,
                    'y-alignment': 'middle'
                }
            });
        }
    }

}).extend(IconInterface).extend(SubProcessInterface);

// Annotation

export const AnnotationView = TextBlockView;
export const Annotation = TextBlock.extend({

    markup: [
        '<g class="rotatable">',
        '<g class="scalable"><rect class="body"/></g>',
        env.test('svgforeignobject') ? '<foreignObject class="fobj"><body xmlns="http://www.w3.org/1999/xhtml"><div class="content"/></body></foreignObject>' : '<text class="content"/>',
        '<path class="stroke"/></g>'
    ].join(''),

    defaults: util.deepSupplement({

        size: { width: 100, height: 100 },
        type: 'bpmn.Annotation',
        attrs: {
            rect: {
                width: 100,
                height: 100
            },
            '.body': {
                'fill-opacity': 0.1,
                fill: '#ffffff',
                stroke: 'none'
            },
            '.fobj div': {
                style: {
                    textAlign: 'left',
                    paddingLeft: 10
                }
            },
            '.stroke': {
                stroke: '#000000',
                fill: 'none',
                'stroke-width': 3
            }

        },
        wingLength: 20

    }, TextBlock.prototype.defaults),

    initialize: function() {

        TextBlock.prototype.initialize.apply(this, arguments);

        this.listenTo(this, 'change:size', this.onSizeChange);

        // calculate dasharray for first time
        this.onSizeChange(this, this.get('size'));
    },

    onSizeChange: function(cell, size) {

        cell.attr('.stroke', {
            'd': cell.getStrokePathData(size.width, size.height, cell.get('wingLength'))
        });
    },

    getStrokePathData: function(width, height, wingLength) {

        // wing length can't be greater than the element width
        wingLength = Math.min(wingLength, width);

        return ['M', wingLength, '0 L 0 0 0', height, wingLength, height].join(' ');
    }

});

// Gateway

export const Gateway = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><polygon class="body"/><image/></g></g><text class="label"/>',

    defaults: util.deepSupplement({

        type: 'bpmn.Gateway',
        size: { width: 80, height: 80 },
        attrs: {
            '.body': {
                points: '40,0 80,40 40,80 0,40',
                fill: '#ffffff',
                stroke: '#000000'
            },
            '.label': {
                text: '',
                ref: '.body',
                'ref-x': .5,
                'ref-dy': 20,
                'y-alignment': 'middle',
                'x-alignment': 'middle',
                'font-size': 14,
                'font-family': 'Arial, helvetica, sans-serif',
                fill: '#000000'
            },
            image: {
                width:  40, height: 40, 'xlink:href': '', transform: 'translate(20,20)'
            }
        }

    }, dia.Element.prototype.defaults)

}).extend(IconInterface);

// Events

export const Event = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><circle class="body outer"/><circle class="body inner"/><image/></g><text class="label"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Event',
        size: { width: 60, height: 60 },
        attrs: {
            '.body': {
                fill: '#ffffff',
                stroke: '#000000'
            },
            '.outer': {
                'stroke-width': 1, r:30,
                transform: 'translate(30,30)'
            },
            '.inner': {
                'stroke-width': 1, r: 26,
                transform: 'translate(30,30)'
            },
            image: {
                width:  40, height: 40, 'xlink:href': '', transform: 'translate(10,10)'
            },
            '.label': {
                text: '',
                fill: '#000000',
                'font-family': 'Arial', 'font-size': 14,
                ref: '.outer', 'ref-x': .5, 'ref-dy': 20,
                'x-alignment': 'middle', 'y-alignment': 'middle'
            }
        },
        eventType: 'start'

    }, dia.Element.prototype.defaults),

    initialize: function() {

        dia.Element.prototype.initialize.apply(this, arguments);

        this.listenTo(this, 'change:eventType', this.onEventTypeChange);

        this.onEventTypeChange(this, this.get('eventType'));
    },

    onEventTypeChange: function(cell, type) {

        switch (type) {

            case 'start':

                cell.attr({
                    '.inner': {
                        visibility: 'hidden'
                    },
                    '.outer': {
                        'stroke-width': 1
                    }
                });

                break;

            case 'end':

                cell.attr({
                    '.inner': {
                        visibility: 'hidden'
                    },
                    '.outer': {
                        'stroke-width': 5
                    }
                });

                break;

            case 'intermediate':

                cell.attr({
                    '.inner': {
                        visibility: 'visible'
                    },
                    '.outer': {
                        'stroke-width': 1
                    }
                });

                break;

            default:

                throw 'BPMN: Unknown Event Type: ' + type;
        }
    }

}).extend(IconInterface);

// Pool & Lanes

export const Pool = dia.Element.extend({

    markup: ['<g class="rotatable">',
        '<g class="scalable"><rect class="body"/></g>',
        '<svg overflow="hidden" class="blackbox-wrap"><text class="blackbox-label"/></svg>',
        '<rect class="header"/><text class="label"/>',
        '<g class="lanes"/>',
        '</g>'].join(''),

    laneMarkup: '<g class="lane"><rect class="lane-body"/><rect class="lane-header"/><text class="lane-label"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Pool',
        size: {
            width: 600,
            height: 300
        },
        attrs: {
            '.body': {
                fill: '#ffffff',
                stroke: '#000000',
                width: 500,
                height: 200,
                'pointer-events': 'stroke'
            },
            '.header': {
                fill:'#ffffff',
                stroke: '#000000',
                width: 20,
                ref: '.body',
                'ref-height': 1,
                'pointer-events': 'visiblePainted'
            },
            '.label': {
                fill: '#000000',
                transform: 'rotate(-90)',
                ref: '.header',
                'ref-x': 10,
                'ref-y': .5,
                'font-family': 'Arial',
                'font-size': 14,
                'x-alignment': 'middle',
                'text-anchor': 'middle'
            },
            '.lane-body': {
                fill:'#ffffff',
                stroke: '#000000',
                'pointer-events': 'stroke'
            },
            '.lane-header': {
                fill:'#ffffff',
                stroke: '#000000',
                'pointer-events': 'visiblePainted'
            },
            '.lane-label': {
                fill: '#000000',
                transform: 'rotate(-90)',
                'text-anchor': 'middle',
                'font-family': 'Arial',
                'font-size': 13
            },
            '.blackbox-wrap': {
                ref: '.body',
                'ref-width': 1,
                'ref-height': 1
            },
            '.blackbox-label': {
                text: 'Black Box',
                'text-anchor': 'middle',
                transform: 'translate(0,-7)'
            },
            '.blackbox-label > tspan': {
                dx: '50%',
                dy: '50%'
            }
        }

    }, dia.Element.prototype.defaults)
});

export const PoolView = dia.ElementView.extend({

    options: {
        headerWidth: 20
    },

    presentationAttributes: dia.ElementView.addPresentationAttributes({
        lanes: ['LANES']
    }),

    confirmUpdate: function() {
        var flag = dia.ElementView.prototype.confirmUpdate.apply(this, arguments);
        if (this.hasFlag(flag, 'LANES')) {
            this.renderLanes(this.model.get('lanes'));
            flag = this.removeFlag(flag, ['LANES']);
        }
        return flag;
    },


    update: function() {

        if (this.lanesAttrs === undefined) {
            // This is the first time update. We render the lanes.
            return this.renderLanes(this.model.get('lanes'));
        }

        return dia.ElementView.prototype.update.call(this, this.model,
            // always update everything including the lanes attributes
            util.merge({}, this.model.get('attrs'), this.lanesAttrs || {})
        );
    },

    renderMarkup: function() {

        dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        // a holder for all the lanes
        this.$lanes = this.$('.lanes');

        // An SVG element for the lane
        this.laneMarkup =  V(this.model.laneMarkup);
    },

    renderLanes: function(lanes) {

        lanes = lanes || {};

        // index keeps track on how many lanes we created
        this.index = 0;

        var headerWidth = lanes.headerWidth === undefined ? this.options.headerWidth : lanes.headerWidth;
        this.lanesAttrs = {
            '.header': { width : headerWidth },
            '.label': { text: lanes.label || '' }
        };

        this.$lanes.empty();

        if (lanes.sublanes) {

            // recursion start
            this.renderSublanes(lanes.sublanes, headerWidth, 0, 1, 'lanes');
        }

        // We don't want the lanes attributes to be stored on model.
        // That's why we are using renderingOnlyAttrs parameter in ElementView.update
        this.update(this.model, util.merge({}, this.model.get('attrs'), this.lanesAttrs));
    },

    calculateRatios: function(lanes, ratio) {

        var definedRatio = 0;
        var calculated = [];
        var ratios = [];

        for (var i = 0, n = lanes.length; i < n; i++) {
            var lane = lanes[i];
            var laneRatio = lane.ratio;
            if (Number.isFinite(laneRatio)) {
                definedRatio += laneRatio / 10;
                ratios[i] = laneRatio / 10 / ratio;
            } else {
                calculated.push(i);
            }
        }

        var calculatedRatio = Math.max(1 - definedRatio, 0) * ratio / calculated.length;
        for (var j = 0, m = calculated.length; j < m; j++) {
            ratios[calculated[j]] = calculatedRatio;
        }

        return ratios;
    },

    renderSublanes: function(lanes, prevX, prevY, prevRatio, prevPath) {

        var defaultHeaderWidth = this.options.headerWidth;
        var path = prevPath + '/sublanes/';
        var ratios = this.calculateRatios(lanes, prevRatio);

        util.toArray(lanes).reduce(function(ratioSum, lane, index) {

            var className = 'lane' + this.index;
            var bodySelector = '.' + className + ' .lane-body';
            var headerSelector = '.' + className + ' .lane-header';
            var labelSelector = '.' + className + ' .lane-label';

            if (lane.name) {
                // add custom css class if specified
                className += ' ' + lane.name;
            }

            // append a new lane to the pool
            var lanePath = path + index;
            var svgLane = this.laneMarkup.clone()
                .addClass(className)
                .attr({
                    'data-lane-path': lanePath,
                    'data-lane-index': this.index
                });

            this.$lanes.append(svgLane.node);

            var ratio = ratios[index];
            var headerWidth = lane.headerWidth === undefined ? defaultHeaderWidth : lane.headerWidth;
            var y = prevY + ratioSum;

            this.lanesAttrs[bodySelector] = {
                ref: '.body',
                'ref-height': ratio,
                'ref-width': -prevX,
                'ref-x': prevX,
                'ref-y': y
            };

            this.lanesAttrs[headerSelector] = {
                width: headerWidth,
                ref: '.body',
                'ref-height': ratio,
                'ref-x': prevX,
                'ref-y': y
            };

            this.lanesAttrs[labelSelector] = {
                text: lane.label,
                ref: headerSelector,
                'ref-x': 10,
                'ref-y': .5,
                'x-alignment': 'middle'
            };

            this.index++;

            if (lane.sublanes) {

                // recursively render any child lanes
                this.renderSublanes(lane.sublanes, prevX + headerWidth, y, ratio, lanePath);
            }

            return ratioSum + ratio;

        }.bind(this), 0);
    }
});

// Group

export const Group = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><rect class="label-rect"/><g class="label-group"><svg overflow="hidden" class="label-wrap"><text class="label"/></svg></g></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Group',
        size: {
            width: 200,
            height: 200
        },
        attrs: {
            '.body': {
                width: 200,
                height: 200,
                stroke: '#000000',
                'stroke-dasharray': '6,6',
                'stroke-width': 2,
                fill: 'transparent',
                rx: 15,
                ry: 15,
                'pointer-events': 'stroke'
            },
            '.label-rect': {
                ref: '.body',
                'ref-width': 0.6,
                'ref-x': 0.4,
                'ref-y': -30,
                height: 25,
                fill: '#ffffff',
                stroke: '#000000'
            },
            '.label-group': {
                ref: '.label-rect',
                'ref-x': 0,
                'ref-y': 0
            },
            '.label-wrap': {
                ref: '.label-rect',
                'ref-width': 1,
                'ref-height': 1
            },
            '.label': {
                text: '',
                x: '50%',
                y: '1.3em',
                'text-anchor': 'middle',
                'font-family': 'Arial',
                'font-size': 14,
                fill: '#000000'
            }
        }

    }, dia.Element.prototype.defaults)
});

// Data Object

export const DataObject = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><polygon class="body"/></g><text class="label"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.DataObject',
        size: {
            width: 60,
            height: 80
        },
        attrs: {
            '.body': {
                points: '20,0 60,0 60,80 0,80 0,20 20,0 20,20 0,20',
                stroke: '#000000',
                fill: '#ffffff'
            },
            '.label': {
                ref: '.body',
                'ref-x': .5,
                'ref-dy': 5,
                text: '',
                'text-anchor': 'middle'
            }
        }

    }, dia.Element.prototype.defaults)
});

export const Conversation = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><polygon class="body"/></g><text class="label"/><path class="sub-process"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Conversation',
        size: {
            width: 100,
            height: 100
        },
        attrs: {
            '.body': {
                points: '25,0 75,0 100,50 75,100 25,100 0,50',
                stroke: '#000000',
                fill: '#ffffff'
            },
            '.label': {
                text: '',
                ref: '.body',
                'ref-x': .5,
                'ref-dy': 5,
                'text-anchor': 'middle'
            },
            path: {
                d: 'M 0 0 L 30 0 30 30 0 30 z M 15 4 L 15 26 M 4 15 L 26 15',
                ref: '.body',
                'ref-x': 0.5,
                'ref-dy': -30,
                'x-alignment': 'middle',
                fill: '#ffffff',
                stroke: '#000000',
                'fill-opacity': 0
            }
        },

        conversationType: 'conversation'

    }, dia.Element.prototype.defaults),

    initialize: function() {

        dia.Element.prototype.initialize.apply(this, arguments);

        this.listenTo(this, 'change:conversationType', this.onConversationTypeChange);

        this.onConversationTypeChange(this, this.get('conversationType'));
    },

    onConversationTypeChange: function(cell, type) {

        switch (type) {

            case 'conversation':

                cell.attr('polygon/stroke-width', 1);

                break;

            case 'call-conversation':

                cell.attr('polygon/stroke-width', 4);

                break;

            default:

                throw 'BPMN: Unknown Conversation Type: ' + type;
        }
    }

}).extend(SubProcessInterface);

// Choreograpy

export const Choreography = TextBlock.extend({
    /*
        markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><g class="participants"/><text class="label"/><path class="sub-process"/></g>',
*/
    markup: [
        '<g class="rotatable">',
        '<g class="scalable"><rect class="body"/></g>',
        env.test('svgforeignobject') ? '<foreignObject class="fobj"><body xmlns="http://www.w3.org/1999/xhtml"><div class="content"/></body></foreignObject>' : '<text class="content"/>',
        '<text class="label"/><path class="sub-process"/><g class="participants"/>',
        '</g>'
    ].join(''),

    participantMarkup: '<g class="participant"><rect class="participant-rect"/><text class="participant-label"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Choreography',
        size: {
            width: 60,
            height: 80
        },
        attrs: {
            // HACK (TODO!): as we don't have indexes on attributes yet (to determine the order
            // of applying attributes) we have to reintroduce the rect attribute again
            // so it changes the "order" how the attributes are processed.
            // It's necessary to apply all `rect` attributes before we apply '.body' attributes,
            // otherwise our stroke and fill will be overwritten.
            rect: {},
            '.body': {
                width: 60,
                height: 80,
                stroke: '#000000',
                fill: '#ffffff'
            },
            '.label': {
                ref: '.body',
                'ref-x': .5,
                'ref-dy': 5,
                text: '',
                'text-anchor': 'middle'
            },
            '.participant-rect': {
                stroke: '#000000',
                fill: '#aaaaaa',
                ref: '.body',
                'ref-width': 1
            },
            '.participant-label': {
                'text-anchor': 'middle',
                ref: '.participant_0 .participant-rect',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle'
            },
            '.sub-process': {
                d: 'M 0 0 L 30 0 30 30 0 30 z M 15 4 L 15 26 M 4 15 L 26 15',
                ref: '.body',
                'ref-x': 0.5,
                'ref-dy': -30,
                'x-alignment': 'middle',
                fill: 'transparent',
                stroke: '#000000'
            }
        },

        participants: [],
        initiatingParticipant: 0 // index (number) or participant name (string)

    }, TextBlock.prototype.defaults)

}).extend(SubProcessInterface);

export const ChoreographyView = TextBlockView.extend({

    options: {
        participantHeight: 20
    },

    presentationAttributes: TextBlockView.addPresentationAttributes({
        participants: 'PARTICIPANTS',
        initiatingParticipant: 'INIT_PARTICIPANT',
    }),

    initFlag: ['PARTICIPANTS'].concat(TextBlockView.prototype.initFlag),

    confirmUpdate: function() {
        var flag = TextBlockView.prototype.confirmUpdate.apply(this, arguments);
        if (this.hasFlag(flag, 'PARTICIPANTS')) {
            this.renderParticipants(this.model.get('participants'));
            flag = this.removeFlag(flag, ['PARTICIPANTS', 'INIT_PARTICIPANT']);
            return flag;
        }
        if (this.hasFlag(flag, 'INIT_PARTICIPANT')) {
            this.layoutAndUpdate();
            flag = this.removeFlag(flag, 'INIT_PARTICIPANT');
        }
        return flag;
    },

    update: function() {

        if (this.participantsAttrs === undefined) {
            // This is the first time update. We render the participants.
            return this.renderParticipants(this.model.get('participants'));
        }

        this.layoutAndUpdate();

        return this;
    },

    render: function() {
        // Reset participants cache when `dirty: true` flag used in `attrs()`.
        this.participantsAttrs = undefined;
        dia.ElementView.prototype.render.apply(this, arguments);
    },

    renderMarkup: function() {

        dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        // a holder for all the lanes
        this.$participants = this.$('.participants');

        // An SVG element for the lane
        this.participantMarkup =  V(this.model.participantMarkup);
    },


    renderParticipants: function(participants) {

        const { $participants } = this;
        const vPrevParticipants = V($participants[0]).children();

        $participants.empty();
        this.participantsAttrs = {};

        util.toArray(participants).forEach((participant, index) => {

            const className = `participant_${index}`;
            const selector = `.${className}`;

            this.participantsAttrs[selector + ' .participant-rect'] = {
                height: this.options.participantHeight
            };

            this.participantsAttrs[selector + ' .participant-label'] = {
                text: participant
            };

            const vParticipant = (index < vPrevParticipants.length)
                ? vPrevParticipants[index]
                : this.participantMarkup.clone();

            this.$participants.append(vParticipant.addClass(className).node);

        });

        this.layoutAndUpdate();
    },

    layoutAndUpdate: function() {

        var participants = this.model.get('participants') || [];

        var count = participants.length;

        var pHeight = this.options.participantHeight;
        var eHeight = this.model.get('size').height;
        var bHeight = Math.max(0, eHeight - (pHeight * count));

        var offsetY = 0;

        var initiator = this.model.get('initiatingParticipant');

        // initiator index
        var i = Math.max(util.isNumber(initiator) ? Math.abs(initiator) : participants.indexOf(initiator), 0);

        // body position index
        var b = Math.min(i, count - 2);

        util.toArray(participants).forEach(function(participant, index) {

            var selector = '.participant_' + index;

            this.participantsAttrs[selector] = {
                transform: 'translate(0,' + offsetY + ')'
            };

            this.participantsAttrs[selector + ' .participant-rect'].fill = (i == index)
                ? this.model.attr('.body/fill')
                : this.model.attr('.participant-rect/fill');

            this.participantsAttrs[selector + ' .participant-rect'].stroke = (i == index)
                ? this.model.attr('.body/stroke')
                : this.model.attr('.participant-rect/stroke');

            offsetY += pHeight + (b == index ? bHeight : 0);

        }, this);

        // set sub-process icon position
        var sp = count < 2 ? 0 : b - count + 1;

        this.participantsAttrs['.sub-process'] = {
            'ref-dy': Math.max(-eHeight, sp * pHeight - 30)
        };

        // Change text content position in the middle of the participant body
        var c = count < 2 ? 0 : b + 1;

        this.participantsAttrs['.fobj div'] = {
            style: {
                height: bHeight,
                paddingTop: pHeight * c
            }
        };
        // Same as above just IE fallback
        this.participantsAttrs['.content'] = {
            'ref-y': pHeight * c + bHeight / 2
        };

        // We don't want the participants attributes to be stored on model.
        // That's why we are using renderingOnlyAttrs parameter in ElementView.update
        var attrs = util.merge({}, this.model.get('attrs'), this.participantsAttrs || {});

        // Backwards compatibility
        // The text is set by `.content/html` now (leaving this in the attrs would result
        // in not being able to change content).
        util.unsetByPath(attrs, 'div/html');

        TextBlockView.prototype.update.call(this, this.model, attrs);
    }

});

// Message

export const Message = dia.Element.extend({

    markup: '<g class="rotatable"><g class="scalable"><polygon class="body"/></g><text class="label"/></g>',

    defaults: util.deepSupplement({

        type: 'bpmn.Message',
        size: {
            width: 60,
            height: 40
        },
        attrs: {
            '.body': {
                points: '0,0 60,0 60,40 0,40 0,0 60,0 30,20 0,0',
                stroke: '#000000',
                fill: '#ffffff'
            },
            '.label': {
                ref: '.body',
                'ref-x': .5,
                'ref-dy': 5,
                text: '',
                'text-anchor': 'middle'
            }
        }

    }, dia.Element.prototype.defaults)
});

// Sequence Flows

export const Flow = dia.Link.extend({

    defaults: {

        type: 'bpmn.Flow',

        attrs: {

            '.marker-source': {
                d: 'M 0 0'
            },
            '.marker-target': {
                d: 'M 10 0 L 0 5 L 10 10 z',
                fill: '#000000'
            },
            '.connection': {
                'stroke-dasharray': ' ',
                'stroke-width': 1
            },
            '.connection-wrap': {
                style: '',
                onMouseOver: '',
                onMouseOut: ''
            }
        },

        flowType: 'normal'
    },

    initialize: function() {

        dia.Link.prototype.initialize.apply(this, arguments);

        this.listenTo(this, 'change:flowType', this.onFlowTypeChange);

        this.onFlowTypeChange(this, this.get('flowType'));
    },

    onFlowTypeChange: function(cell, type) {

        var attrs;

        switch (type) {

            case 'default':

                attrs = {
                    '.marker-source': {
                        d: 'M 0 5 L 20 5 M 20 0 L 10 10',
                        fill: 'none'
                    }
                };

                break;

            case 'conditional':

                attrs = {
                    '.marker-source': {
                        d: 'M 20 8 L 10 0 L 0 8 L 10 16 z',
                        fill: '#FFF'
                    }
                };

                break;

            case 'normal':

                attrs = {};

                break;

            case 'message':

                attrs = {
                    '.marker-target': {
                        fill: '#FFF'
                    },
                    '.connection': {
                        'stroke-dasharray': '4,4'
                    }
                };

                break;

            case 'association':

                attrs = {
                    '.marker-target': {
                        d: 'M 0 0'
                    },
                    '.connection': {
                        'stroke-dasharray': '4,4'
                    }
                };

                break;

            case 'conversation':

                // The only way how to achieved 'spaghetti insulation effect' on links is to
                // have the .connection-wrap covering the inner part of the .connection.
                // The outer part of the .connection then looks like two parallel lines.
                attrs = {
                    '.marker-target': {
                        d: 'M 0 0'
                    },
                    '.connection': {
                        'stroke-width': '7px'
                    },
                    '.connection-wrap': {
                        // As the css takes priority over the svg attributes, that's only way
                        // how to overwrite default jointjs styling.
                        style: 'stroke: #fff; stroke-width: 5px; opacity: 1;',
                        onMouseOver: 'var s=this.style;s.stroke=\'#000\';s.strokeWidth=15;s.opacity=.4',
                        onMouseOut: 'var s=this.style;s.stroke=\'#fff\';s.strokeWidth=5;s.opacity=1'
                    }
                };

                break;

            default:

                throw 'BPMN: Unknown Flow Type: ' + type;
        }

        attrs.root = { dataFlowType: type };

        cell.attr(util.merge({}, this.defaults.attrs, attrs));
    }
});
