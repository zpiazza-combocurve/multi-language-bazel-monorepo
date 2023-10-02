import $ from 'jquery';
import { V, util, dia } from 'jointjs/src/core.mjs';

export const toSVG = function(paper, callback, opt) {

    opt = opt || {};

    if (paper === undefined) throw new Error('The the dia.Paper is a mandatory option.');

    paper.trigger('beforeexport', opt);

    const { svg } = paper;

    const shouldFillFormControls = (opt.fillFormControls !== false);
    if (shouldFillFormControls) {
        // We need to ensure that all form controls have an ID before cloning it.
        // See `fillFormControls()` below.
        Array.from(svg.getElementsByTagName('select')).forEach(select => V.ensureId(select));
    }

    // We'll be modifying `style` attribute of elements/nodes. Therefore,
    // we're making a deep clone of the whole SVG document.
    var exportSVG = V(svg).clone();
    var exportNode = exportSVG.node;
    var exportViewport = exportSVG.findOne('.' + util.addClassNamePrefix('layers'));
    var viewportBBox = opt.area || paper.getContentArea();
    // Make the SVG dimensions as small as the viewport.
    // Note that those are set in the `viewBox` attribute rather then in the
    // `width`/`height` attributes. This allows for fitting the svg element inside containers.
    var dimensions = opt.preserveDimensions;
    if (dimensions) {
        exportSVG.attr({
            width: dimensions.width || viewportBBox.width,
            height: dimensions.height || viewportBBox.height
        });
    }
    // We're removing css styles from the svg container. (i.e background-image)
    // Set SVG viewBox starting at top-leftmost element's position (viewportBbox.x|y).
    // We're doing this because we want to trim the `whitespace` areas of the SVG making its size
    // as small as necessary.
    exportSVG.removeAttr('style').attr('viewBox', [
        viewportBBox.x,
        viewportBBox.y,
        viewportBBox.width,
        viewportBBox.height
    ].join(' '));
    // Remove the viewport transformation.
    // We do not want the resulting SVG to be scaled or translated.
    exportViewport.removeAttr('transform');

    if (opt.useComputedStyles !== false) {
        // Default branch (for backwards compatibility)
        copyExternalStyles(paper.svg, exportNode);
    }

    var stylesheet = opt.stylesheet;
    if (util.isString(stylesheet)) {
        // e.g [
        //     '.connection { fill: none }',
        //     '.connection-wrap, .marker-vertices, .marker-arrowheads, .link-tools { display: none }'
        // ].join('');
        addExternalStyles(exportSVG.node, stylesheet);
    }

    paper.trigger('afterexport', opt);

    const callbackWrapper = function(error) {

        if (shouldFillFormControls !== false) {
            fillFormControls(exportNode, paper);
        }

        const beforeSerializeFn = opt.beforeSerialize;
        if (typeof beforeSerializeFn === 'function') {
            const result = beforeSerializeFn.call(paper, exportNode, paper);
            if (result instanceof SVGElement) exportNode = result;
        }

        callback(serialize(exportNode), error);
    };

    if (opt.convertImagesToDataUris) {

        convertImages(exportSVG.find('image,img')).then(() => callbackWrapper()).catch((error) => {
            callbackWrapper(error);
        });

    } else {

        // Now, when our `exportSVG` is ready, serialize it to a string and return it.
        callbackWrapper();
    }
};

const dataURIRegex = new RegExp(/^(data:)([\w\\+-]*)(;charset=[\w-]+|;base64){0,1},(.*)/gi);

function convertImages(images) {

    const imageMap = {};
    images.forEach((image) => {
        let url = getImageURL(image);
        if (!url) return; // `null` or an empty string
        url = url.trim();
        if (dataURIRegex.test(url)) {
            // URL is already a data-uri
            return;
        }
        if (url in imageMap) {
            imageMap[url].push(image);
        } else {
            imageMap[url] = [image];
        }
    });

    return $.when(...Object.keys(imageMap).map(url => convertImageURL(url, imageMap[url])));
}

function convertImageURL(url, images) {
    const deferred = $.Deferred();
    util.imageToDataUri(url, (err, dataUri) => {
        if (err || !dataUri) {
            deferred.reject(err);
            return;
        }
        images.forEach(image => setImageURL(image, dataUri));
        deferred.resolve();
    });
    return deferred.promise();
}

function getImageURL(image) {
    switch (image.tagName()) {
        case 'IMAGE': {
            // Firefox uses `href`, all the others 'xlink:href'
            return image.attr('xlink:href') || image.attr('href');
        }
        case 'IMG':
        default: {
            return image.attr('src');
        }
    }
}

function setImageURL(image, url) {
    switch (image.tagName()) {
        case 'IMAGE': {
            image.attr('xlink:href', url);
            if (image.attr('href')) {
                image.attr('href', null);
            }
            break;
        }
        case 'IMG':
        default: {
            image.attr('src', url);
            break;
        }
    }
}

function fillFormControls(doc, paper) {
    // <input> elements
    Array.from(doc.getElementsByTagName('input')).forEach((input) => {
        switch (input.type) {
            case 'checkbox':
            case 'radio':
                if (input.checked) {
                    input.setAttribute('checked', true);
                } else {
                    input.removeAttribute('checked');
                }
                break;
            default:
                input.setAttribute('value', input.value);
                break;
        }
    });
    // <textarea> elements
    Array.from(doc.getElementsByTagName('textarea')).forEach((textarea) => {
        textarea.textContent = textarea.value;
    });
    // <select> elements
    Array.from(doc.getElementsByTagName('select')).forEach((select) => {
        // The problem is that `selectEl.cloneNode(true)` does not preserve
        // the selection value. So we have to find it in the original.
        const selectId = select.id;
        if (!selectId) return;
        const sourceSelect = paper.svg.getElementById(selectId);
        if (!sourceSelect) return;
        Array.from(select.options).forEach((option, index) => {
            if (sourceSelect.options[index].selected) {
                option.setAttribute('selected', true);
            } else {
                option.removeAttribute('selected');
            }
        });
    });
}

function serialize(node) {
    // fix for invalid XML entities (no-break spaces) in Safari
    return (new XMLSerializer()).serializeToString(node).replace(/&nbsp;/g, '\u00A0');
}

function addExternalStyles(toNode, styles) {
    var doc = toNode.ownerDocument;
    var xml = doc.implementation.createDocument(null, 'xml', null);
    V(toNode).prepend(V('style', { type: 'text/css' }, [
        xml.createCDATASection(styles)
    ]));
}

function copyExternalStyles(fromNode, toNode) {

    var fromElements = Array.from(fromNode.querySelectorAll('*'));
    var toElements = Array.from(toNode.querySelectorAll('*'));

    // Now the fun part. The code below has one purpose and i.e. store all the CSS declarations
    // from external stylesheets to the `style` attribute of the SVG document nodes.
    // This is achieved in three steps.

    // 1. Disabling all the stylesheets in the page and therefore collecting only default style values.
    //    This, together with the step 2, makes it possible to discard default CSS property values
    //    and store only those that differ.
    // 2. Enabling back all the stylesheets in the page and collecting styles that differ from the default values.
    // 3. Applying the difference between default values and the ones set by custom stylesheets
    //    onto the `style` attribute of each of the nodes in SVG.

    // Note that all of this would be much more simplified if `window.getMatchedCSSRules()` worked
    // in all the supported browsers. Pity is that it doesn't even work in WebKit that
    // has it (https://bugzilla.mozilla.org/show_bug.cgi?id=438278).
    // Polyfill for Firefox can be https://gist.github.com/ydaniv/3033012;

    var doc = fromNode.ownerDocument;
    var styleSheetsCount = doc.styleSheets.length;
    var styleSheetsCopy = [];

    // 1.
    for (var i = styleSheetsCount - 1; i >= 0; i--) {

        // There is a bug (bugSS) in Chrome 14 and Safari. When you set stylesheet.disable = true it will
        // also remove it from document.styleSheets. So we need to store all stylesheets before
        // we disable them. Later on we put them back to document.styleSheets if needed.
        // See the bug `https://code.google.com/p/chromium/issues/detail?id=88310`.
        styleSheetsCopy[i] = doc.styleSheets[i];
        doc.styleSheets[i].disabled = true;
    }

    var defaultComputedStyles = {};

    fromElements.forEach(function(el, idx) {

        var computedStyle = window.getComputedStyle(el, null);
        // We're making a deep copy of the `computedStyle` so that it's not affected
        // by that next step when all the stylesheets are re-enabled again.
        var defaultComputedStyle = {};
        util.forIn(computedStyle, function(property) {
            defaultComputedStyle[property] = computedStyle.getPropertyValue(property);
        });

        defaultComputedStyles[idx] = defaultComputedStyle;
    });


    // bugSS: Check whether the stylesheets have been removed from document.styleSheets
    if (styleSheetsCount != doc.styleSheets.length) {
        // bugSS: Copy all stylesheets back
        styleSheetsCopy.forEach(function(copy, i) {
            doc.styleSheets[i] = copy;
        });
    }

    // 2.
    // bugSS: Note that if stylesheet bug happen the document.styleSheets.length is still 0.
    for (var j = 0; j < styleSheetsCount; j++) {
        doc.styleSheets[j].disabled = false;
    }
    // bugSS: Now is document.styleSheets.length = number of stylesheets again.

    var customStyles = {};

    fromElements.forEach(function(el, idx) {

        var computedStyle = window.getComputedStyle(el, null);
        var defaultComputedStyle = defaultComputedStyles[idx];
        var customStyle = {};

        util.forIn(computedStyle, function(property) {
            // Ignore string indexes e.g. "15"
            if (!isNaN(property)) return;
            // Store only those that differ from the default styles applied by the browser.
            // TODO: Problem will arise with browser specific properties (browser prefixed ones).
            if (computedStyle.getPropertyValue(property) !== defaultComputedStyle[property]) {
                customStyle[property] = computedStyle.getPropertyValue(property);
            }
        });

        customStyles[idx] = customStyle;
    });

    // 3.
    toElements.forEach(function(el, idx) {
        $(el).css(customStyles[idx]);
    });
}

// Just a little helper for quick-opening the paper as data-uri SVG in a new browser window.
export const openAsSVG = function(paper, opt) {

    var windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
    var windowName = util.uniqueId('svg_output');

    toSVG(paper, function(svg) {

        var imageWindow = window.open('', windowName, windowFeatures);
        var dataImageUri = 'data:image/svg+xml,' + encodeURIComponent(svg);
        imageWindow.document.write('<img src="' + dataImageUri + '" style="max-height:100%" />');

    }, util.assign({ convertImagesToDataUris: true }, opt));
};

dia.Paper.prototype.toSVG = function() {
    return toSVG.apply(this, [this, ...arguments]);
};

dia.Paper.prototype.openAsSVG = function() {
    return openAsSVG.apply(this, [this, ...arguments]);
};
