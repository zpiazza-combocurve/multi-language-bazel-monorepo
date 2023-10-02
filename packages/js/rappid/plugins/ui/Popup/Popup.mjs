// ui.Popup is like ui.ContextToolbar except that it can contain any HTML.
// This is useful for displaying a contextual widget that contains forms or other
// HTML. Popups also have an arrow pointing up.

// @import ui.ContextToolbar
import { ContextToolbar } from '../ContextToolbar/ContextToolbar.mjs';
import { util } from 'jointjs/src/core.mjs';

export const Popup = ContextToolbar.extend({

    className: 'popup',

    eventNamespace: 'popup',

    events: {},

    beforeMount() {
        const { anchor, arrowPosition } = this.options;

        this.$el.removeClass('left right top bottom top-left top-right bottom-left bottom-right');
        if (arrowPosition) {
            this.$el.addClass(arrowPosition === 'none' ? '' : arrowPosition);
        } else {
            this.$el.addClass(anchor === 'center' ? '' : anchor);
        }
    },

    renderContent: function() {
        const { content: contentOption, arrowPosition, anchor } = this.options;

        const content = util.isFunction(contentOption) ? contentOption(this.el) : contentOption;
        if (content) {
            this.$el.html(content);
        }
        if (arrowPosition !== 'none' || anchor === 'center')  {
            const popupArrow = document.createElement('div');
            popupArrow.classList.add('popup-arrow');
            const popupArrowMask = document.createElement('div');
            popupArrowMask.classList.add('popup-arrow-mask');

            this.el.append(popupArrow, popupArrowMask);
        }
    }
});
