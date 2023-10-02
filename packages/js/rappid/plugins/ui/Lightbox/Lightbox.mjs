import $ from 'jquery';
import { util } from 'jointjs/src/core.mjs';
import { Dialog } from '../Dialog/Dialog.mjs';


export const Lightbox = Dialog.extend({

    className: Dialog.prototype.className + ' lightbox',

    options: util.merge({}, Dialog.prototype.options, {
        closeButton: true,
        modal: true,
        downloadable: false, // Add a default download button to buttons.
        downloadAction: 'download', // Action to trigger download ('action:download' by default).
        fileName: 'Image', // Default filename of downloaded files.
        closeAnimation: {
            delay: 2000,
            duration: 200,
            easing: 'swing',
            properties: {
                opacity: 0
            }
        },
        top: 100, // The distance from the image to the top of the screen.
        windowArea: .8, // The maxium percentage of the window that is covered by lightbox.
        openAnimation: false
    }),

    init: function() {

        util.bindAll(this, 'startCloseAnimation', 'positionAndScale');

        Dialog.prototype.init.apply(this, arguments);

        if (this.options.image) {
            this.$image = $('<img/>').on('load', this.positionAndScale);
            this.options.content = this.$image;
        }

        if (this.options.downloadable) {
            // default button, triggers download action as provided by user (default: 'download')
            var defaultDownloadButton = { action: this.options.downloadAction, content: 'Download', position: 'center' }

            this.buttons = Array.isArray(this.buttons) ? this.buttons.slice() : [];
            this.buttons.push(defaultDownloadButton);
        }

        // listen on self for download action
        this.on('action:' + this.options.downloadAction, this.download);

        $(window).on('resize', this.positionAndScale);
        this.on('close:animation:complete', () => {
            Dialog.prototype.close.apply(this, arguments);
        });
    },

    open: function() {

        Dialog.prototype.open.apply(this, arguments);

        // Load the image content when the dialog element is already in the DOM - IE is not able
        // to measure the element if it's not previously rendered.
        if (this.$image) {
            this.$image.attr('src', this.options.image);
        }

        this.positionAndScale();
        this.startOpenAnimation();
        return this;
    },

    positionAndScale: function() {
        // We do our best to show both the image and the titlebar text in the window
        // without any scrolling.

        var $fg = this.$('.fg');
        var $img = this.$('.body > img');
        var $titlebar = this.$('.titlebar');
        var $controls = this.$('.controls');

        var ratio = this.options.windowArea;

        var width = window.innerWidth * ratio;

        // Offset the whole lightbox by the `options.top` coordinate.
        this.$el.css('margin-top', this.options.top);

        // Get the height of the titlebar if it could wrap into maximum fg width.
        // This works as an approximation as long as the window is not too small.
        // Ideally, we would calculate titlebar height only after it is wrapped into image width.
        // Unfortunately, that calculation needs titlebar height.
        $titlebar.css('width', width);
        var titlebarHeight = $titlebar.height();

        // Get the height of lightbox buttons.
        var controlsHeight = $controls.height();

        // Calculate the height of the whole lightbox foreground, without titlebar and download button.
        var height = (window.innerHeight * ratio) - this.options.top - titlebarHeight - controlsHeight;

        // Set maximum area for the image and let the image scale via CSS (max-width/max-height).
        $fg.css({ width: width, height: height });

        // Now set the foreground bbox according to the image size.
        // Then, titlebar and controls can be positioned in CSS relative
        // to the foreground.
        var imageWidth = $img.width();
        var imageHeight = $img.height();

        $fg.css({ width: imageWidth, height: imageHeight });

        // make sure controls are positioned under titlebar after it wraps into imageWidth
        $titlebar.css('width', 'auto');
        if (!$titlebar.hasClass('empty')) $controls.css('top', $titlebar.outerHeight());

    },

    download: function() {

        util.imageToDataUri(this.options.image, (function(err, dataUri) {
            util.downloadDataUri(dataUri, this.options.fileName);
        }).bind(this));
    },

    close: function() {

        if (this.options.closeAnimation) {
            this.startCloseAnimation();
        } else {
            Dialog.prototype.close.apply(this, arguments);
        }

        return this;
    },

    onRemove: function() {

        Dialog.prototype.onRemove.apply(this, arguments);
        $(window).off('resize', this.positionAndScale);

        if (this.$image) {
            this.$image.off('load', this.positionAndScale);
        }
    },

    startCloseAnimation: function() {

        this.$el.animate(this.options.closeAnimation.properties, util.assign({

            complete: function() {

                this.trigger('close:animation:complete');

            }.bind(this)

        }, this.options.closeAnimation));
    },

    startOpenAnimation: function() {

        this.$el.animate(util.assign({}, this.options.openAnimation.properties, { height: this._foregroundHeight }), util.assign({

            complete: function() {

                this.trigger('open:animation:complete');

            }.bind(this)

        }, this.options.openAnimation));
    }
});
