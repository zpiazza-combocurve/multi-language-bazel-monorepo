// Force Directed layout implementation.
// =====================================

// Resources:
//      Efficient and High Quality Force-Directed Graph Drawing, Yifan Hu
//      Simple Algorithms for Network Visualization: A Tutorial, Michael J. McGufﬁn
//      Graph Drawing by Force-directed Placement, Thomas M. J. Fruchterman and Edward M. Reingold
//      D3.js, http://d3js.org

import Backbone from 'backbone';
import { g } from 'jointjs/src/core.mjs';

export const ForceDirected = Backbone.Model.extend({

    defaults: {
        linkDistance: 10,
        linkStrength: 1,
        charge: 10,
        x: 0,
        y: 0
    },

    cacheAttribute: '_fcache',

    initialize: function() {

        var graph = this.get('graph');
        var links, elements;
        if (Array.isArray(graph)) {
            var cells = graph;
            links = [];
            elements = [];
            for (var i = 0, n = cells.length; i < n; i++) {
                var cell = cells[i];
                if (cell.isLink()) {
                    links.push(cell);
                } else {
                    elements.push(cell);
                }
            }
        } else {
            elements = graph.getElements();
            links = graph.getLinks();
        }

        this.links = links;
        this.elements = elements;
        this.x = this.get('x');
        this.y = this.get('y');
        this.width = this.get('width');
        this.height = this.get('height');
        this.gravityCenter = this.get('gravityCenter');

        this.t = 1;
        this.energy = Infinity;
        this.progress = 0;
    },

    start: function() {

        var w = this.width;
        var h = this.height;
        var x = this.x;
        var y = this.y;

        // Random layout.
        this.elements.forEach(function(el) {

            var elX = g.random(x, x + w);
            var elY = g.random(y, y + h);

            el.position(elX, elY, { forceDirected: true });

            var cache = el[this.cacheAttribute] = {};

            // Cache important values for much quick access.
            cache.charge = el.get('charge') || this.get('charge');
            cache.weight = el.get('weight') || 1;
            // Current + Previous position.
            cache.x = cache.px = elX;
            cache.y = cache.py = elY;
            cache.fx = 0;
            cache.fy = 0;

        }, this);

        this.links.forEach(function(link) {

            var cache = link[this.cacheAttribute] = {};

            // Cache important values for quick access.
            cache.source = link.getSourceElement();
            cache.target = link.getTargetElement();
            cache.strength = link.get('strength') || this.get('linkStrength');
            cache.distance = link.get('distance') || this.get('linkDistance');

        }, this);
    },

    step: function() {

        if ((this.t * .99) < 0.005) return this.notifyEnd();

        var cacheAttribute = this.cacheAttribute;
        var w = this.width;
        var h = this.height;
        var x = this.x;
        var y = this.y;

        var gravity = .1;
        var gravityCenter = this.gravityCenter;

        var energyBefore = this.energy;
        this.energy = 0;

        // Global positions update. Sum of all the position updates to elements.
        var xBefore = 0;
        var yBefore = 0;
        var xAfter = 0;
        var yAfter = 0;

        var i, j;
        var nElements = this.elements.length;
        var nLinks = this.links.length;

        var v, u, dx, dy, distanceSquared, distance, fr, fx, fy;

        // Calculate repulsive forces.
        for (i = 0; i < nElements - 1; i++) {

            v = this.elements[i][cacheAttribute];
            xBefore += v.x;
            yBefore += v.y;

            for (j = i + 1; j < nElements; j++) {

                u = this.elements[j][cacheAttribute];
                dx = u.x - v.x;
                dy = u.y - v.y;
                distanceSquared = dx * dx + dy * dy;
                distance = Math.sqrt(distanceSquared);

                fr = this.t * v.charge / distanceSquared;
                fx = fr * dx;
                fy = fr * dy;

                v.fx -= fx;
                v.fy -= fy;
                u.fx += fx;
                u.fy += fy;

                this.energy += fx * fx + fy * fy;
            }
        }

        // Add the last element positions as it couldn't be done in the loops above.
        var elBefore = this.elements[nElements - 1][cacheAttribute];
        xBefore += elBefore.x;
        yBefore += elBefore.y;

        var link, fa, k;

        // Calculate attractive forces.
        for (i = 0; i < nLinks; i++) {

            link = this.links[i][cacheAttribute];
            v = link.source[cacheAttribute];
            u = link.target[cacheAttribute];

            dx = u.x - v.x;
            dy = u.y - v.y;
            distanceSquared = dx * dx + dy * dy;
            distance = Math.sqrt(distanceSquared);

            fa = this.t * link.strength * (distance - link.distance) / distance;
            fx = fa * dx;
            fy = fa * dy;
            k = v.weight / (v.weight + u.weight);

            // Gauss-seidel. Changing positions directly so that other iterations work with the new positions.
            v.x += fx * (1 - k);
            v.y += fy * (1 - k);
            u.x -= fx * k;
            u.y -= fy * k;

            this.energy += fx * fx + fy * fy;
        }

        var model, el, pos;

        // Set positions on elements.
        for (i = 0; i < nElements; i++) {

            model = this.elements[i];
            el = model[cacheAttribute];
            pos = { x: el.x, y: el.y };

            // Gravity force.
            if (gravityCenter) {

                pos.x += (gravityCenter.x - pos.x) * this.t * gravity;
                pos.y += (gravityCenter.y - pos.y) * this.t * gravity;
            }

            pos.x += el.fx;
            pos.y += el.fy;

            // Make sure positions don't go out of the paper area.
            pos.x = Math.max(x, Math.min(x + w, pos.x));
            pos.y = Math.max(y, Math.min(x + h, pos.y));

            // Position Verlet integration.
            var friction = .9;
            pos.x += (el.px - pos.x) * friction;
            pos.y += (el.py - pos.y) * friction;

            el.px = pos.x;
            el.py = pos.y;

            el.fx = el.fy = 0;
            el.x = pos.x;
            el.y = pos.y;

            xAfter += el.x;
            yAfter += el.y;

            this.notify(model, i, pos);
        }

        this.t = this.cool(this.t, this.energy, energyBefore);

        // If the global distance hasn't change much, the layout converged and therefore trigger the `end` event.
        var gdx = xBefore - xAfter;
        var gdy = yBefore - yAfter;
        var gd = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gd < 1) {
            this.notifyEnd();
        }
    },

    cool: function(t, energy, energyBefore) {

        // Adaptive cooling scheme (as per Yifan Hu). The temperature can also increase depending on the progress made.
        if (energy < energyBefore) {

            this.progress += 1;
            if (this.progress >= 5) {

                this.progress = 0;
                return t / .99;// Warm up.
            }
        } else {

            this.progress = 0;
            return t * .99;// Cool down.
        }
        return t;// Keep the same temperature.
    },

    notify: function(el, i, pos) {

        el.set('position', pos, { forceDirected: true });
    },

    notifyEnd: function() {

        this.trigger('end');
    }
});
