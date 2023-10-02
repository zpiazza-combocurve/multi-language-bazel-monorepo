import { V, util } from 'jointjs/src/core.mjs';
const { mergeAttrs } = V;
const { isEqual, isEmpty, flattenObject, setByPath } = util;

export function getCombinedAnnotationAttrsAtIndex(annotations, index, options = {}) {
    const {
        merge = mergeAttrs
    } = options;
    const attrs = {};
    annotations.forEach((annotation) => {
        const { start, end, attrs: currentAttrs } = annotation;
        if (
            // The annotation does not have `start` and `end`. Assume it spans
            // the whole text. This allows us to pass default annotations
            // for text that is not spanned by any regular annotation.
            start === undefined && end === undefined ||
            index >= start && index < end
        ) {
            merge(attrs, currentAttrs);
        }
    });
    return attrs;
}

export function getCombinedAnnotationAttrsBetweenIndexes(annotations, start, end, options = {}) {
    const {
        delim = '/',
        merge = mergeAttrs
    } = options;
    // Simplify the annotations by removing annotations that are not within the range.
    const annotationsBetweenIndexes = V.findAnnotationsBetweenIndexes(annotations, start, end);
    if (start === end) {
        return getCombinedAnnotationAttrsAtIndex(annotationsBetweenIndexes, start, options);
    }
    let commonAttrs;
    for (let i = start; i < end; i++) {
        var attrs = getCombinedAnnotationAttrsAtIndex(annotationsBetweenIndexes, i, options);
        if (commonAttrs && !isEqual(commonAttrs, attrs)) {
            // Attributes differ. Remove those that differ from commonAttrs.
            commonAttrs = flattenObject(merge({}, commonAttrs), delim);
            attrs = flattenObject(merge({}, attrs), delim);
            const result = {};
            for(let key in attrs) {
                if (commonAttrs[key] === attrs[key]) {
                    setByPath(result, key, attrs[key], delim);
                }
            }
            commonAttrs = result;
        } else {
            commonAttrs = attrs;
        }
    }
    return commonAttrs;
}

export function normalizeAnnotations(annotations, options = {}) {
    const {
        compare = isEqual
    } = options;
    const normalizedAnnotations = [];
    const maxEnd = annotations.reduce((maxEnd, annotation) => {
        const { end } = annotation;
        return (end === undefined) ? maxEnd : Math.max(maxEnd, end);
    }, 0);
    for (let i = -1, n = maxEnd; i < n; i++) {
        let currentAttrs = null;
        for (let j = i + 1; j <= n; j++) {
            const rangeAttrs = getCombinedAnnotationAttrsBetweenIndexes(annotations, j - 1, j, options);
            if (!currentAttrs) {
                currentAttrs = rangeAttrs;
                continue;
            }
            if (compare(rangeAttrs, currentAttrs)) continue;
            j--;
            if (!isEmpty(currentAttrs)) {
                normalizedAnnotations.push({ start: i, end: j, attrs: currentAttrs });
            }
            currentAttrs = null;
            i = j;
        }
        if (!currentAttrs) continue;
        if (i < n && !isEmpty(currentAttrs)) {
            normalizedAnnotations.push({ start: i, end: n, attrs: currentAttrs });
        }
        break;
    }
    return normalizedAnnotations;
}

