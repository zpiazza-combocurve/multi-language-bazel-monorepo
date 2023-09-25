/*global ZC,zingchart,document*/
/*jshint globalstrict: true*/
/*jshint sub: true*/
/*jshint evil: true*/
/*jshint forin: false*/
/*jshint laxbreak: true*/

"use strict";

/* FASTLINE */

zingchart.setModule('fastline');
zingchart.setModule('fastvline');

zingchart.plugins.fastline = zingchart.plugins.fastline || {};

(function() {

/** @type {(value: number, base: number) => number} */
var _log_ = function(fValue, fBase) {
	fBase = fBase || Math.E;
	if (isFinite(Math.log(fValue)/Math.log(fBase))) {
		return Math.log(fValue)/Math.log(fBase);
	} else {
		return 0;
	}
};

/**
 * The dataparse event fires immediately as the JSON data "gets" to the library. Usually it is used to catch 
 * custom JSON format/charts and transform the JSON into something the standard library can "read"
 */
zingchart.bind(null, 'dataparse', /** @type {(info: any, data: any) => void} */function(oInfo, oData) {
	
	/* ========== */
	for (var c=0,cLen=oData['graphset'].length;c<cLen;c++) {
		if (
			oData['graphset'][c]['type']
			&&
			(
				oData['graphset'][c]['type'] === 'fastline' || oData['graphset'][c]['type'] === 'fastvline'
			)
		) {
			/* we change the type, so save it */
			/** @type {string} */
			var sGraphType = oData['graphset'][c]['type'];
			oData['graphset'][c]['plugin-type'] = sGraphType;

			/** @type {import("../../../../types/common").GraphData} */
			var oGraphData = oData['graphset'][c];

			/* normalize - we convert all attributes to dashed syntax */
			if (zingchart.SYNTAX !== 'dashed') {
				zingchart.normalize(oGraphData);
			}

			/* force type to line/vline */
			oGraphData['type'] = (sGraphType==='fastline')?'line':'vline';

			/* force flat so only one canvas is being used for all plots */
			oGraphData['flat'] = true;

			/* if we find async, we need to remove and save its value */
			var bAsync = ZC._b_(oGraphData['async']) || false;
			oGraphData['async'] = null;

			/* inject log/lin context menus */
			oGraphData['gui'] = oGraphData['gui'] || {};
			oGraphData['gui']['behaviors'] = oGraphData['gui']['behaviors'] || [];
			oGraphData['gui']['behaviors'].push({
				id : 'Progression',
				enabled : 'all'
			},{
				id : 'LinScale',
				enabled : 'all'
			},{
				id : 'LogScale',
				enabled : 'all'
			});

			/* parse series */
			/** @type {any[]} */
			var aSeries = [].concat(oGraphData['series'] || []);

			/* since we actually need to remove the series from the original JSON, we save the data */
			zingchart.plugins.fastline[oInfo.id] = {
				painted : false,
				plot : oGraphData['plot'] || {},
				series : oGraphData['series'] || [],
				points : [],
				tooltip : oGraphData['tooltip'] || {},
				plotindex : -1,
				selection : [],
				hidden : [],
				xData : [],
				inverted : !(sGraphType==='fastline'),
				async : bAsync
			};

			/** @type {any} */
			var oMinData = {};
			/** @type {any} */
			var oMaxData = {};
			/** @type {any} */
			var key;
			/** @type {any} */
			var val;
			/** @type {number} */
			var p;

			for (p = 0; p < aSeries.length; p++) {
				/** @type {any[]} */
				var aValues = aSeries[p]['values'] || [];
				for (var n = 0; n < aValues.length; n++) {
					if (aValues[n] === null) {
						continue;
					}
					if (aValues[n].length) {
						key = aValues[n][0];
						val = aValues[n][1];
					} else {
						key = n;
						val = aValues[n];
					}
					if (ZC._n_(oMinData[key]) === null) {
						oMinData[key] = val;
					} else {
						if (val < oMinData[key]) {
							oMinData[key] = val;
						}
						/* oMinData[key] = Math.min(oMinData[key], val); */
					}
					if (ZC._n_(oMaxData[key]) === null) {
						oMaxData[key] = val;
					} else {
						if (val > oMaxData[key]) {
							oMaxData[key] = val;
						}
						/* oMaxData[key] = Math.max(oMaxData[key], val); */
					}
				}
				for (var sAttr in aSeries[p]) {
					if (sAttr.indexOf('data-') === 0) {
						if (zingchart.plugins.fastline[oInfo.id].xData.indexOf(sAttr) === -1) {
							zingchart.plugins.fastline[oInfo.id].xData.push(sAttr);
						}
					}
				}
			}

			/* using only one fake plot, also sorting is not required */
			/** @type {any[]} */
			var aMinMaxData = [];
			for (key in oMinData) {
				aMinMaxData.push([parseFloat(key), oMinData[key]]);
			}
			for (key in oMaxData) {
				aMinMaxData.push([parseFloat(key), oMaxData[key]]);
			}
			oGraphData['series'] = [
				{
					values : aMinMaxData,
					alpha : 0,
					'max-nodes' : 0,
					'max-trackers' : 0,
					marker : {
						type : 'none'
					},
					'legend-item' : {
						visible : false
					},
					'legend-marker' : {
						visible : false
					},
					'guide-label' : {
						visible : false
					},
					'skip-paint' : true
				}
			];
			var pp = 1;
			for (p = 0; p < aSeries.length; p++) {
				/* check for showInLegend attribute */
				if (aSeries[p]['show-in-legend'] && ZC._b_(aSeries[p]['show-in-legend'])) {
					/** @type {any} */
					var oSeriesData = {};
					ZC._cp_(aSeries[p], oSeriesData);
					oSeriesData['values'] = null;
					oSeriesData['data-plotindex'] = p;
					zingchart.plugins.fastline[oInfo.id]['series'][p]['data-plotindex'] = pp;
					oGraphData['series'].push(oSeriesData);
					pp++;
				}
			}
		}
	}

	/* this dataparse event HAS to return the transformed JSON */
	return oData;
});

/**
 * We cannot use the built-in API's since we don't actually create plots and nodes (we just direct paint on a canvas)
 * So specific API's have to be coded.
 * This is just an example of such an API, which changes the value of a node
 * 
 * Example usage (after the chart rendered):
 * 
 * zingchart.plugins.fastline.setValue({
 * 		id : 'myChart',
 * 		plotindex : 4,
 * 		nodeindex : 28,
 * 		value : 200
 * })
 * 
 */
zingchart.plugins.fastline.setValue = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		/** @type {number} */
		var iPlotIndex = parseInt(oParams['plotindex'] || '0', 10);
		/** @type {number} */
		var iNodeIndex = parseInt(oParams['nodeindex'] || '0', 10);
		if (oParams['value'] !== null) {
			/** @type {any[]} */
			var aSeries = zingchart.plugins.fastline[sId]['series'] || [];
			if (aSeries[iPlotIndex] && aSeries[iPlotIndex]['values'] && aSeries[iPlotIndex]['values'][iNodeIndex]) {
				aSeries[iPlotIndex]['values'][iNodeIndex] = parseFloat(oParams['value']);
				zingchart.plugins.fastline.paint({
					id : sId
				});
			}
		}
	}
};

/**
 * We cannot use the built-in API's since we don't actually create plots and nodes (we just direct paint on a canvas)
 * So specific API's have to be coded.
 * This is just an example of such an API, which changes the value of a whole series
 * 
 * Example usage (after the chart rendered):
 * 
 * zingchart.plugins.fastline.setPlotValues({
 * 		id : 'myChart',
 * 		plotindex : 4,
 * 		values : [
 *				[
 *						268117200000,
 *						187.99178644763862
 *				],
 *				[
 *						270795600000,
 *						112.91991786447639
 *				],
 *				[
 *						276066000000,
 *						106.57905544147845
 *				]
 *		]
 * })
 * 
 */
zingchart.plugins.fastline.setPlotValues = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		/** @type {number} */
		var iPlotIndex = parseInt(oParams['plotindex'] || '0', 10);
		if (oParams['values'] !== null) {
			/** @type {any[]} */
			var aSeries = zingchart.plugins.fastline[sId]['series'] || [];
			if (aSeries[iPlotIndex] && aSeries[iPlotIndex]['values']) {
				aSeries[iPlotIndex]['values'] = oParams['values'];
				zingchart.plugins.fastline.paint({
					id : sId
				});
			}
		}
	}
};

zingchart.plugins.fastline.togglePlotSelection = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (!zingchart.plugins.fastline[sId]) {
		return;
	}
	/** @type {import("../../../../types/plugins/clients/insidepetroleum/zingchart-fastline").FastLine} */
	var oFLInfo = zingchart.plugins.fastline[sId];
	/** @type {number} */
	var i;
	/** @type {any[]} */
	var aSeries = oFLInfo['series'];
	if (ZC._n_(oParams['plotindex']) === null) {
		if (ZC._n_(oParams['plotid']) === null) {
			return;
		} else {
			for (i=0;i<aSeries.length;i++) {
				if (aSeries[i]['id'] === oParams['plotid']) {
					oParams['plotindex'] = i;
					break;
				}
			}
		}
	}
	/** @type {number} */
	var iPlotIndex = parseInt(oParams['plotindex'] || '0', 10);
	/** @type {any[]} */
	var aSelection = zingchart.plugins.fastline[sId]['selection'];
	/** @type {number} */
	var iPos = -1;
	if ((iPos = aSelection.indexOf(iPlotIndex)) !== -1) {
		aSelection = aSelection.splice(iPos, 1);
	} else {
		aSelection.push(iPlotIndex);
	}
	zingchart.plugins.fastline.paint({
		id : sId
	});
};

zingchart.plugins.fastline.clearSelection = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		/* reset selected state */
		zingchart.plugins.fastline[sId]['selection'] = [];
		zingchart.plugins.fastline.paint({
			id : sId
		});
	}
};

zingchart.plugins.fastline.getSelection = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		return zingchart.plugins.fastline[sId]['selection'] || [];
	}
	return [];
};

zingchart.plugins.fastline.setSelection = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		zingchart.plugins.fastline[sId]['selection'] = oParams['plotindexes'] || [];
		zingchart.plugins.fastline.paint({
			id : sId
		});
	}
};

zingchart.plugins.fastline.selectInPoly = function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	/** @type {number} */
	var i;
	/** @type {number} */
	var n;
	if (zingchart.plugins.fastline[sId]) {
		zingchart.plugins.fastline[sId]['selection'] = [];

		/* calculate poly bounds */
		/** @type {number} */
		var xmin = Number.MAX_VALUE;
		/** @type {number} */
		var ymin = Number.MAX_VALUE;
		/** @type {number} */
		var xmax = -Number.MAX_VALUE;
		/** @type {number} */
		var ymax = -Number.MAX_VALUE;
		for (i=0;i<oParams.poly.length;i++) {
			xmin = Math.min(xmin, oParams.poly[i][0]);
			xmax = Math.max(xmax, oParams.poly[i][0]);
			ymin = Math.min(ymin, oParams.poly[i][1]);
			ymax = Math.max(ymax, oParams.poly[i][1]);
		}

		for (i=0;i<zingchart.plugins.fastline[sId].points.length;i++) {
			var bAllowSelection = true;
			if (zingchart.plugins.fastline[sId].series[i] && zingchart.plugins.fastline[sId].series[i]['data-ignore-selection']) {
				bAllowSelection = false;
			}
			if (!bAllowSelection) {
				continue;
			}
			/** @type {boolean} */
			var bFound = false;
			/** @type {import("../../../../types/common").PointArray} */
			var aPoints = zingchart.plugins.fastline[sId].points[i];
			for (n=0;n<aPoints.length;n++) {
				if (
					zingchart.plugins.selectionTool.isInsidePolygon(oParams.poly, aPoints[n][0], aPoints[n][1])
				) {
					if (zingchart.plugins.fastline[sId]['hidden'].indexOf(i) === -1) {
						zingchart.plugins.fastline[sId]['selection'].push(i);
					}
					bFound = true;
					break;
				}
			}
			if (!bFound) {
				/* calculate intermediate points */
				for (n=0;n<aPoints.length-1;n++) {
					/** @type {number} */
					var p1 = aPoints[n];
					/** @type {number} */
					var p2 = aPoints[n+1];
					/** @type {number} */
					var x;
					/** @type {number} */
					var c;
					
					if (
						(p1[0] < xmin && p2[0] < xmin)
						||
						(p1[0] > xmax && p2[0] > xmax)
						||
						(p1[1] < ymin && p2[1] < ymin)
						||
						(p1[1] > ymax && p2[1] > ymax)
					) {
						/* do nothing */
					} else {
						/** @type {number} */
						var fDist = Math.sqrt( (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]) );
						if (fDist > 2) {
							/** @type {number} */
							var dx = (p2[0]-p1[0]) / fDist;
							/** @type {number} */
							var dy = (p2[1]-p1[1]) / fDist;
							for (x=p1[0],c=0;x<p2[0];x+=dx) {
								c++;
								if (
									zingchart.plugins.selectionTool.isInsidePolygon(oParams.poly, p1[0]+c*dx, p1[1]+c*dy)
								) {
									if (zingchart.plugins.fastline[sId]['hidden'].indexOf(i) === -1) {
										zingchart.plugins.fastline[sId]['selection'].push(i);
									}
									bFound = true;
									break;
								}
							}
							
						}
						if (bFound) {
							break;
						}
					}
				}
			}
		}

		/** @type {any} */
		var hoverCanvas = document.getElementById(oParams.id + '-graph-id0-hover-c');
		if (hoverCanvas) {
			/** @type {CanvasRenderingContext2D} */
			var hoverCtx = hoverCanvas.getContext('2d');
			hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
		}

		/** @type {import("../../../../types/ZCLoader").ZCLoader} */
		var oLoader = zingchart.getLoader(sId);
		/** @type {any} */
		var oInfo = ZC.Loader_Api_Loader_Info(oLoader);
		oInfo['selection'] = zingchart.plugins.fastline[sId]['selection'];
		zingchart.fireEvent('zingchart.plugins.fastline.selection', oLoader, oInfo);

		zingchart.plugins.fastline.paint(oParams);
	}
};

zingchart.plugins.fastline.legendClick = function(oInfo) {
	if (oInfo['toggleaction'] !== 'none') {
		if (oInfo.visible) {
			zingchart.plugins.fastline[oInfo.id]['hidden'].push(oInfo.xdata.plotindex);
		} else {
			zingchart.plugins.fastline[oInfo.id]['hidden'].splice(zingchart.plugins.fastline[oInfo.id]['hidden'].indexOf(oInfo.xdata.plotindex), 1);
		}
	}
};

zingchart.bind(null, 'legend_item_click', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		zingchart.plugins.fastline.legendClick(oInfo);
	}
});

zingchart.bind(null, 'legend_marker_click', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		zingchart.plugins.fastline.legendClick(oInfo);
	}
});

zingchart.bind(null, 'legend_mouseover', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		oInfo['trigger'] = 'legend';
		oInfo['plotindex'] = oInfo['plotindex'] - 1;
		if (ZC._n_(zingchart.plugins.fastline[oInfo.id].invmap[oInfo['plotindex']]) !== null) {
			oInfo['plotindex'] = zingchart.plugins.fastline[oInfo.id].invmap[oInfo['plotindex']];
		}
		if (zingchart.plugins.fastline[oInfo.id]['hidden'].indexOf(oInfo['plotindex']) === -1) {
			zingchart.plugins.fastline.showPlotHover(oInfo);
		}
	}
});

zingchart.bind(null, 'legend_mouseout', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		oInfo['trigger'] = 'legend';
		zingchart.plugins.fastline.clearHover(oInfo);
	}
});

zingchart.plugins.fastline.togglePlot = /** @type {(info: any) => void} */function(oParams) {
	var sId = oParams['id'] || 'zc';
	
	var aPlotIndexes = [];
	var aPlotIds = [];

	if (ZC._n_(oParams['plotindex']) !== null) {
		if (typeof(oParams['plotindex']) === 'object' && oParams['plotindex'].length) {
			aPlotIndexes = [].concat(oParams['plotindex']);
		} else {
			aPlotIndexes.push(oParams['plotindex']);
		}
	}
	if (ZC._n_(oParams['plotid']) !== null) {
		if (typeof(oParams['plotid']) === 'object' && oParams['plotid'].length) {
			aPlotIds = [].concat(oParams['plotid']);
		} else {
			aPlotIds.push(oParams['plotid']);
		}
	}

	if (aPlotIds.length > 0) {
		for (var p = 0; p < zingchart.plugins.fastline[sId]['series'].length; p++) {
			if (aPlotIds.indexOf(zingchart.plugins.fastline[sId]['series'][p]['id']) !== -1) {
				aPlotIndexes.push(p);
			}
		}
	}

	if (aPlotIndexes.length === 0) {
		aPlotIndexes.push(0);
	}
	
	if (zingchart.plugins.fastline[sId]) {
		var bPaint = false, sAction = '', aLegendPlotIndexes = [];
		for (var i = 0; i < aPlotIndexes.length; i++) {
			var iPlotIndex = aPlotIndexes[i];
			var iLegendPlotIndex = -1;
			if (!zingchart.plugins.fastline[sId]['series'][iPlotIndex]) {
				return;
			}
			if (ZC._n_(zingchart.plugins.fastline[sId]['series'][iPlotIndex]['data-plotindex']) !== null) {
				iLegendPlotIndex = zingchart.plugins.fastline[sId]['series'][iPlotIndex]['data-plotindex'];
			}
			if (zingchart.plugins.fastline[sId]['hidden'].indexOf(iPlotIndex) !== -1) {
				zingchart.plugins.fastline[sId]['hidden'].splice(zingchart.plugins.fastline[sId]['hidden'].indexOf(iPlotIndex), 1);
				if (iLegendPlotIndex !== -1) {
					sAction = 'showplot';
					aLegendPlotIndexes.push(iLegendPlotIndex);
				} else {
					bPaint = true;
				}
			} else {
				zingchart.plugins.fastline[sId]['hidden'].push(iPlotIndex);
				if (iLegendPlotIndex !== -1) {
					sAction = 'hideplot';
					aLegendPlotIndexes.push(iLegendPlotIndex);
				} else {
					bPaint = true;
				}
			}
		}
		if (sAction !== '') {
			zingchart.exec(sId, sAction, {
				plotindex : aLegendPlotIndexes
			});
		} else if (bPaint) {
			zingchart.plugins.fastline.paint({
				id : sId
			});
		}
	}
};

zingchart.plugins.fastline.paint = /** @type {(info: any) => void} */function(oInfo) {
	if (!zingchart.plugins.fastline[oInfo.id]['painted']) {
		if (zingchart.plugins.selectionTool) {
			zingchart.bind(oInfo.id, 'zingchart.plugins.selection-tool.mouseup', /** @type {(STInfo: any) => void} */function(oSTInfo) {
				zingchart.plugins.fastline.selectInPoly(oSTInfo);
			});
		}
		zingchart.plugins.fastline[oInfo.id]['painted'] = true;
	}

	/** @type {number} */
	var xVal = null;
	/** @type {number} */
	var yVal = null;
	/** @type {number} */
	var xCoord = null;
	/** @type {number} */
	var yCoord = null;
	/** @type {any[]} */
	var aSeries = zingchart.plugins.fastline[oInfo.id]['series'] || [];
	/** @type {any} */
	var oPlot = zingchart.plugins.fastline[oInfo.id]['plot'] || {};
	/** @type {any[]} */
	var aSelection = zingchart.plugins.fastline[oInfo.id]['selection'] || [];

	/* since we set "flat" to the chart, we will use the canvas which is supposed to paint the plots */
	/** @type {any} */
	var plotsCanvas = document.getElementById(oInfo.id + '-graph-id0-plots-bl-c');
	if (!plotsCanvas) {
		return;
	}
	/** @type {CanvasRenderingContext2D} */
	var plotsCtx = plotsCanvas.getContext('2d');
	plotsCtx.clearRect(0, 0, plotsCanvas.width, plotsCanvas.height);

	/** 
	 * We create an additional canvas (hidden) used for pixmapping. The concept for the detection uses a classic trick: on the pixmap canvas, each plot line will be painted with an unique color.
	 * So, on mousemove, when we query the color under the mouse, we will always know over which plot we actually are.
	*/
	/** @type {any} */
	var pixmapCanvas = document.getElementById(oInfo.id + '-graph-id0-plots-pm-c');
	if (!pixmapCanvas) {
		pixmapCanvas = document.createElement('canvas');
		pixmapCanvas.width = plotsCanvas.width;
		pixmapCanvas.height = plotsCanvas.height;
		pixmapCanvas.id = oInfo.id + '-graph-id0-plots-pm-c';
		pixmapCanvas.className = 'zc-abs zc-layer zc-bl zc-no-print';
		pixmapCanvas.style.display = 'none';
		plotsCanvas.parentElement.appendChild(pixmapCanvas);
	}
	/** @type {CanvasRenderingContext2D} */
	var pixmapCtx = pixmapCanvas.getContext('2d');
	pixmapCtx.clearRect(0, 0, pixmapCanvas.width, pixmapCanvas.height);
	pixmapCtx.fillStyle = '#ffffff';
	pixmapCtx.fillRect(0, 0, pixmapCanvas.width, pixmapCanvas.height);

	/** @type {number} */
	var color = 0;
	zingchart.plugins.fastline[oInfo.id].color2series = {};

	/* faster way, we assume scale is linear, skip API's and use scale information */
	/** @type {any} */
	var oPlotArea = zingchart.exec(oInfo.id, 'getobjectinfo', {
		object : 'plotarea'
	});
	/** @type {any} */
	var oScaleX = zingchart.exec(oInfo.id, 'getobjectinfo', {
		object : 'scale',
		name : 'scale-x'
	});
	/** @type {any} */
	var oScaleY = zingchart.exec(oInfo.id, 'getobjectinfo', {
		object : 'scale',
		name : 'scale-y'
	});
	if (!oScaleX || !oScaleY) {
		return;
	}

	/* ============================== */
	/* create fastlinedata for export */
	if (true) { /* this adds a lot of perf weight on a chart, maybe make the export optional? */
		/** @type {any[]} */
		var aFakePlots = [];
		for (var p = 0; p < aSeries.length; p++) {
			/** @type {any} */
			var oFakePlot = {
				sText : aSeries[p]['text'] || '',
				oData : {
					export : true
				},
				aPlotNodes : []
			};
			/** @type {any[]} */
			var aValues = aSeries[p]['values'] || [];
			for (var n = 0; n < aValues.length; n++) {
				/** @type {any} */
				var oFakeNode = {
					fKeyValue : aValues[n][0],
					fValue : aValues[n][1]
				};
				oFakePlot.aPlotNodes.push(oFakeNode);
			}
			aFakePlots.push(oFakePlot);
		}

		/** @type {import("../../../../types/ZCLoader").ZCLoader} */
		var oLoader = zingchart.getLoader(oInfo.id);
		oLoader.setAttribute('fastlinedata', aFakePlots);

		/** @type {JSON} */
		var oJSON = oLoader.getAttribute('json');
		if (typeof(oJSON) === 'string') {
			oJSON = JSON.parse(oJSON);
		}
		/* oJSON['graphset'][0]['series'] = JSON.parse(JSON.stringify(aSeries)); */
		oJSON['graphset'][0]['series'] = aSeries;

		var pp = 0;
		zingchart.plugins.fastline[oInfo.id].map = {}, zingchart.plugins.fastline[oInfo.id].invmap = {};
		for (var p = 0; p < oJSON['graphset'][0]['series'].length; p++) {
			oJSON['graphset'][0]['series'][p]['line-color'] = aSeries[p]['line-color'] || oPlot['line-color'] || '#000099';
			oJSON['graphset'][0]['series'][p]['line-width'] = parseInt(aSeries[p]['line-width'] || oPlot['line-width'] || '1', 10);
			oJSON['graphset'][0]['series'][p]['marker'] = {
				type : 'none'
			};
			if (ZC._n_(oJSON['graphset'][0]['series'][p]['show-in-legend']) === null || !oJSON['graphset'][0]['series'][p]['show-in-legend']) {
				oJSON['graphset'][0]['series'][p]['legend-item'] = {
					visible : false
				};
				oJSON['graphset'][0]['series'][p]['legend-marker'] = {
					visible : false
				};
				oJSON['graphset'][0]['series'][p]['show-in-legend'] = false;
			} else {
				zingchart.plugins.fastline[oInfo.id].map[p] = pp;
				zingchart.plugins.fastline[oInfo.id].invmap[pp] = p;
				pp++;
			}
		}
		oJSON['graphset'][0]['plot'] = {};
		ZC._cp_(zingchart.plugins.fastline[oInfo.id]['plot'], oJSON['graphset'][0]['plot']);
		oLoader.setAttribute('json', JSON.stringify(oJSON));
	}

	/* ============================== */
	
	var oLoader = zingchart.getLoader(oInfo.id);

	var batchSize = aSeries.length;
	/* if async, set the batch size so that we'll have roughly 10 cycles, otherwise it will take actually too much time to matter */
	if (zingchart.plugins.fastline[oInfo.id]['async']) {
		batchSize = Math.max(1, Math.ceil(aSeries.length / 10));
	}
	var _batch_ = function(s, e) {

		for (var p = s; p < e; p++) {

			if (zingchart.plugins.fastline[oInfo.id]['hidden'].indexOf(p) !== -1) {
				continue;
			}

			zingchart.plugins.fastline[oInfo.id]['points'][p] = [];
			/** @type {any[]} */
			var aValues = aSeries[p]['values'] || [];
			/** @type {[number, number][]} */
			var xyCoords = [];
			/** @type {number} */
			var i;
			for (var n = 0; n < aValues.length; n++) {
				if (aValues[n] === null) {
					xyCoords.push(null);
					continue;
				}
				if (aValues[n].length) {
					xVal = aValues[n][0];
					yVal = aValues[n][1];
				} else {
					xVal = n;
					yVal = aValues[n];
				}
				if (yVal === null) {
					xyCoords.push(null);
					continue;
				}
				/* added special API for faster xy queries */
				var xyCoord = zingchart.exec(oInfo.id, 'fastlinexycoords', {
					key : xVal,
					val : yVal
				});
				xyCoords.push(xyCoord);
				zingchart.plugins.fastline[oInfo.id]['points'][p].push(xyCoord);
			}

			/** @type {any} */
			var oData = {};
			ZC._cp_(oPlot, oData);
			ZC._cp_(aSeries[p], oData);
	
			/* paint the lines on the plots canvas */
			plotsCtx.globalAlpha = 1;
			plotsCtx.lineCap = 'round';
			plotsCtx.lineJoin = 'round';
			plotsCtx.beginPath();

			if (aSelection.indexOf(p) !== -1) {
				ZC._cp_({
					'line-color' : '#990000'
				}, oData);
				ZC._cp_(oPlot['selected-state'], oData);
				ZC._cp_(aSeries[p]['selected-state'], oData);
			}

			plotsCtx.strokeStyle = oData['line-color'] || '#000099';
			plotsCtx.lineWidth = parseInt(oData['line-width'] || '1', 10);

			/** @type {number} */
			var iLineWidth = plotsCtx.lineWidth;
			/** @type {number[]} */
			var aLineDash = [];
			/** @type {string} */
			var sLineStyle = oData['line-style'] || 'solid';
			switch (sLineStyle) {
				case 'dotted':
					aLineDash = [ Math.max(1, iLineWidth * 0.5), iLineWidth * 1.75 ];
					break;
				case 'dashed':
					aLineDash = [ 6 * iLineWidth, 3 * iLineWidth ];
					break;
				case 'dashdot':
					aLineDash = [ 6 * iLineWidth, 2 * iLineWidth ];
					break;
			}
			plotsCtx.setLineDash(aLineDash);

			/** @type {boolean} */
			var bMove = true;
			for (i = 0; i < xyCoords.length; i++) {
				if (i === 0) {
					if (xyCoords[i] === null) {
						bMove = true;
					} else {
						plotsCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
						bMove = false;
					}
				} else {
					if (xyCoords[i] === null) {
						bMove = true;
					} else {
						if (bMove) {
							plotsCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
							if (i+1 < xyCoords.length-1 && xyCoords[i+1] === null) {
								plotsCtx.lineTo(xyCoords[i][0] + 1 / plotsCtx.lineWidth, xyCoords[i][1] + 1 / plotsCtx.lineWidth);
							}
							bMove = false;
						} else {
							plotsCtx.lineTo(xyCoords[i][0], xyCoords[i][1]);
						}
					}
				}
			}

			plotsCtx.stroke();
			plotsCtx.closePath();
			
			/* Create an unique color. Since antialiasing is used on lines, keep a safe "distance" between the subsequent colors to prevent confusions */
			/** @type {string} */
			var hexColor = color.toString(16);
			for (var c = 0, cLen = 6 - hexColor.length; c < cLen; c++) {
				hexColor = '0' + hexColor;
			}
			/* Store a hash of color->plotindex */
			zingchart.plugins.fastline[oInfo.id].color2series[hexColor] = p;
			color += 51;

			/* Paint the line again on the pixmap canvas. Draw thicker lines to make detection less annoying. For thin lines its hard to actually pinpoint the pixels. */
			pixmapCtx.globalAlpha = 1;
			pixmapCtx.lineCap = 'round';
			pixmapCtx.lineJoin = 'round';
			pixmapCtx.beginPath();
			pixmapCtx.strokeStyle = '#' + hexColor;
			pixmapCtx.lineWidth = parseInt(aSeries[p]['line-width'] || oPlot['line-width'] || '1', 10) + 3;
			
			bMove = true;
			for (i = 0; i < xyCoords.length; i++) {
				if (i === 0) {
					if (xyCoords[i] === null) {
						bMove = true;
					} else {
						pixmapCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
						bMove = false;
					}
				} else {
					if (xyCoords[i] === null) {
						bMove = true;
					} else {
						if (bMove) {
							pixmapCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
							if (i+1 < xyCoords.length-1 && xyCoords[i+1] === null) {
								pixmapCtx.lineTo(xyCoords[i][0] + 1 / pixmapCtx.lineWidth, xyCoords[i][1] + 1 / pixmapCtx.lineWidth);
							}
							bMove = false;
						} else {
							pixmapCtx.lineTo(xyCoords[i][0], xyCoords[i][1]);
						}
					}
				}
			}
			
			pixmapCtx.stroke();
			pixmapCtx.closePath();
		}

		if (e < aSeries.length) {
			window.setTimeout(function() {
				_batch_(e, Math.min(e + batchSize, aSeries.length));
			}, 10);
		}

	};

	_batch_(0, Math.min(batchSize, aSeries.length));
};

/**
 * Catch various standard ZingChart events and call the fastline.paint()
 * Paint needs to be triggered once the "complete" event fires (chart is being painted or modified)
 */
zingchart.bind(null, 'complete', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		/** @type {import("../../../../types/ZCLoader").ZCLoader} */
		var oLoader = zingchart.getLoader(oInfo.id);
		/* this is 'behavioral' plugin - not bound to a chart type we can detect so we need to look in the loader's modules */
			/** @type {string[]} */
		var aModules = zingchart.getModules(oLoader);
		if (aModules.indexOf('fastline') !== -1) {
			zingchart.plugins.fastline.paint(oInfo);
		}
	}
});

/**
 * Catch various standard ZingChart events and call the fastline.paint()
 * Paint needs to be triggered once the "postzoom" event fires (chart is being zoomed) so that the canvas will be repainted within the new zoom levels
 */
zingchart.bind(null, 'postzoom', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		zingchart.plugins.fastline.paint(oInfo);
	}
});

/**
 * Catching standard "click" event
 */
zingchart.bind(null, 'mousedown', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id] && zingchart.plugins.fastline[oInfo.id]['plotindex'] !== -1) {
		/* don't select on rclick */
		if (oInfo.ev.button > 0) {
			return;
		}
		if (oInfo.ev.target.tagName.toUpperCase() === 'AREA' || oInfo.ev.target.tagName.toUpperCase() === 'DIV') {
			/* don't interfere with the active areas from the normal chart elements (esp labels) */
			return;
		}
		/** @type {import("../../../../types/ZCLoader").ZCLoader} */
		var oLoader = zingchart.getLoader(oInfo.id);
		if (!oLoader) { return; }
		oInfo['plotindex'] = zingchart.plugins.fastline[oInfo.id]['plotindex'];
		oInfo['plottext'] = zingchart.plugins.fastline[oInfo.id]['plottext'];
		oInfo['nodeindex'] = zingchart.plugins.fastline[oInfo.id]['nodeindex'];
		oInfo['nodevalue'] = zingchart.plugins.fastline[oInfo.id]['nodevalue'];
		oInfo['target'] = 'node';

		var bAllowSelection = true;
		if (zingchart.plugins.fastline[oInfo.id].series[oInfo['plotindex']] && zingchart.plugins.fastline[oInfo.id].series[oInfo['plotindex']]['data-ignore-selection']) {
			bAllowSelection = false;
		}

		if (
			zingchart.plugins.fastline[oInfo.id]['plot']['selected-state'] 
			||
			zingchart.plugins.fastline[oInfo.id]['series'][oInfo['plotindex']]['selected-state']
		) {
			/** @type {any[]} */
			var aSelection = zingchart.plugins.fastline[oInfo.id]['selection'];
			/** @type {number} */
			var iPos = -1;
			if (bAllowSelection) {
				if ((iPos = aSelection.indexOf(oInfo['plotindex'])) !== -1) {
					aSelection = aSelection.splice(iPos, 1);
				} else {
					aSelection.push(oInfo['plotindex']);
				}
			}
			/** @type {any} */
			var hoverCanvas = document.getElementById(oInfo.id + '-graph-id0-hover-c');
			if (hoverCanvas) {
				/** @type {CanvasRenderingContext2D} */
				var hoverCtx = hoverCanvas.getContext('2d');
				hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
			}
			zingchart.plugins.fastline.paint(oInfo);
		}
		oInfo['selection'] = zingchart.plugins.fastline[oInfo.id]['selection'];
		zingchart.plugins.CLICK_TARGET = 'node';
		zingchart.fireEvent('zingchart.plugins.fastline.click', oLoader, oInfo);
	}
});

/**
 * Catching standard "destroy" event and doing some cleanup. The new canvas objects are removed automatically, we just need to remove the stored data.
 */
zingchart.bind(null, 'destroy', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		delete zingchart.plugins.fastline[oInfo.id];
	}
});

zingchart.plugins.fastline.clearHover = /** @type {(params: any) => void} */function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (zingchart.plugins.fastline[sId]) {
		if (ZC.move) {
			return;
		}
		/** @type {any} */
		var hoverCanvas = document.getElementById(sId + '-graph-id0-hover-c');
		if (hoverCanvas) {
			/** @type {CanvasRenderingContext2D} */
			var hoverCtx = hoverCanvas.getContext('2d');
			hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
		}
		/** @type {import("../../../../types/plugins/clients/insidepetroleum/zingchart-fastline").FastLine} */
		var oFLInfo = zingchart.plugins.fastline[sId];
		oFLInfo['plotindex'] = -1;
		oFLInfo['plottext'] = -1;
		oFLInfo['nodeindex'] = -1;
		oFLInfo['nodevalue'] = null;

		if (ZC._n_(oParams['trigger']) === null || oParams['trigger'] !== 'legend') {
			if (zingchart.getLoader(sId).aGraphs[0].oLegend) {
				/*
				if (zingchart.getLoader(sId).aGraphs[0].oLegend.oScroll) {
					zingchart.getLoader(sId).aGraphs[0].oLegend.oScroll.unbind();
				}
				*/
				ZC.move = true;
				zingchart.getLoader(sId).aGraphs[0].oLegend.highlightItem(-1);
				ZC.move = false;
			}
		}

		zingchart.exec(sId, 'hidetooltip', {});
	}
};

zingchart.plugins.fastline.showPlotHover = /** @type {(params: any) => void} */function(oParams) {
	/** @type {string} */
	var sId = oParams['id'] || 'zc';
	if (!zingchart.plugins.fastline[sId]) {
		return;
	}
	if (ZC.move) {
		return;
	}
	/** @type {import("../../../../types/plugins/clients/insidepetroleum/zingchart-fastline").FastLine} */
	var oFLInfo = zingchart.plugins.fastline[sId];
	/** @type {number} */
	var i;
	/** @type {any} */
	var oPlot = oFLInfo['plot'];
	/** @type {any[]} */
	var aSeries = oFLInfo['series'];

	if (ZC._n_(oParams['plotindex']) === null) {
		if (ZC._n_(oParams['plotid']) === null) {
			return;
		} else {
			for (i=0;i<aSeries.length;i++) {
				if (aSeries[i]['id'] === oParams['plotid']) {
					oParams['plotindex'] = i;
					break;
				}
			}
		}
	}
	/** @type {number} */
	var iPlotIndex = ZC._i_(oParams['plotindex']);

	oFLInfo['plotindex'] = iPlotIndex;
	/** @type {any[]} */
	var aValues = aSeries[iPlotIndex]['values'] || [];
	oFLInfo['plottext'] = aSeries[iPlotIndex]['text'] || ('Series ' + iPlotIndex);

	/* Show hover line. Draw it again using a different color to make it more visible. */
	/** @type {any} */
	var hoverCanvas = document.getElementById(sId + '-graph-id0-hover-c');
	if (hoverCanvas) {
		/** @type {CanvasRenderingContext2D} */
		var hoverCtx = hoverCanvas.getContext('2d');
		hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

		/** @type {number} */
		var xVal = null;
		/** @type {number} */
		var yVal = null;
		/** @type {number} */
		var xCoord = null;
		/** @type {number} */
		var yCoord = null;
		/** @type {[number, number][]} */
		var xyCoords = [];
		for (var n = 0; n < aValues.length; n++) {
			if (aValues[n] === null) {
				xyCoords.push(null);
				continue;
			}
			if (aValues[n].length) {
				xVal = aValues[n][0];
				yVal = aValues[n][1];
			} else {
				xVal = n;
				yVal = aValues[n];
			}
			if (yVal === null) {
				xyCoords.push(null);
				continue;
			}
			xyCoords.push(zingchart.exec(sId, 'fastlinexycoords', {
				key : xVal,
				val : yVal
			}));
		}

		hoverCtx.globalAlpha = 1;
		hoverCtx.lineCap = 'round';
		hoverCtx.lineJoin = 'round';
		hoverCtx.beginPath();

		/** @type {any} */
		var oHoverData = {};
		ZC._cp_(oPlot, oHoverData);
		ZC._cp_(aSeries[iPlotIndex], oHoverData);
		ZC._cp_(oPlot['hover-state'], oHoverData);
		ZC._cp_(aSeries[iPlotIndex]['hover-state'], oHoverData);

		if (ZC._n_(oHoverData['visible']) !== null && !oHoverData['visible']) {
			return;
		}

		if (ZC._n_(oParams['trigger']) === null || oParams['trigger'] !== 'legend') {
			if (zingchart.getLoader(sId).aGraphs[0].oLegend) {
				/*
				if (zingchart.getLoader(sId).aGraphs[0].oLegend.oScroll) {
					zingchart.getLoader(sId).aGraphs[0].oLegend.oScroll.unbind();
				}
				*/
				if (ZC._n_(zingchart.plugins.fastline[sId].map[iPlotIndex]) !== null) {
					iPlotIndex = zingchart.plugins.fastline[sId].map[iPlotIndex];
					ZC.move = true;
					zingchart.getLoader(sId).aGraphs[0].oLegend.highlightItem(iPlotIndex);
					ZC.move = false;
				}

			}
		}

		hoverCtx.strokeStyle = oHoverData['line-color'] || '#ff0000';
		hoverCtx.lineWidth = parseInt(oHoverData['line-width'] || '1', 10);

		/** @type {number} */
		var iLineWidth = hoverCtx.lineWidth;
		/** @type {number[]} */
		var aLineDash = [];
		/** @type {string} */
		var sLineStyle = oHoverData['line-style'] || 'solid';
		switch (sLineStyle) {
			case 'dotted':
				aLineDash = [ Math.max(1, iLineWidth * 0.5), iLineWidth * 1.75 ];
				break;
			case 'dashed':
				aLineDash = [ 6 * iLineWidth, 3 * iLineWidth ];
				break;
			case 'dashdot':
				aLineDash = [ 6 * iLineWidth, 2 * iLineWidth ];
				break;
		}
		hoverCtx.setLineDash(aLineDash);

		/** @type {boolean} */
		var bMove = true;
		for (i = 0; i < xyCoords.length; i++) {
			if (i === 0) {
				if (xyCoords[i] === null) {
					bMove = true;
				} else {
					hoverCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
					bMove = false;
				}
			} else {
				if (xyCoords[i] === null) {
					bMove = true;
				} else {
					if (bMove) {
						hoverCtx.moveTo(xyCoords[i][0], xyCoords[i][1]);
						if (i+1 < xyCoords.length-1 && xyCoords[i+1] === null) {
							hoverCtx.lineTo(xyCoords[i][0] + 1 / hoverCtx.lineWidth, xyCoords[i][1] + 1 / hoverCtx.lineWidth);
						}
						bMove = false;
					} else {
						hoverCtx.lineTo(xyCoords[i][0], xyCoords[i][1]);
					}
				}
			}
		}
		hoverCtx.stroke();
		hoverCtx.closePath();
	}
};

/**
 * Catching standard "mousemove" event and running the detection code
 */
zingchart.bind(null, 'mousemove', /** @type {(info: any) => void} */function(oInfo) {
	if (zingchart.plugins.fastline[oInfo.id]) {
		/** @type {import("../../../../types/ZCLoader").ZCLoader} */
		var oLoader = zingchart.getLoader(oInfo.id);
		if (!oLoader) { return; }
	
		/** @type {import("../../../../types/plugins/clients/insidepetroleum/zingchart-fastline").FastLine} */
		var oFLInfo = zingchart.plugins.fastline[oInfo.id];
		/** @type {any} */
		var pixmapCanvas = document.getElementById(oInfo.id + '-graph-id0-plots-pm-c');
		if (!pixmapCanvas) {
			return;
		}
		/** @type {number} */
		var i;
		/** @type {number} */
		var iLen;
		/** @type {CanvasRenderingContext2D} */
		var pixmapCtx = pixmapCanvas.getContext('2d');
		/** @type {Uint8ClampedArray} */
		var pixmapData = pixmapCtx.getImageData(0, 0, pixmapCanvas.width, pixmapCanvas.height).data;
		if (oInfo.ev.target.tagName.toUpperCase() === 'AREA' || oInfo.ev.target.tagName.toUpperCase() === 'DIV') {
			/* don't interfere with the active areas from the normal chart elements (esp labels) */
			return;
		}

		/* Locate the exact pixel under the mouse and read it's color */
		/** @type {any} */
		var offset = (Math.round(oInfo.x) + Math.round(oInfo.y) * pixmapCanvas.width) * 4;
		/** @type {number} */
		var color = pixmapData[offset] * 256 * 256 + pixmapData[offset+1] * 256 + pixmapData[offset+2];
		/** @type {string} */
		var hexColor = color.toString(16);
		for (var c = 0, cLen = 6 - hexColor.length; c < cLen; c++) {
			hexColor = '0' + hexColor;
		}
		/* locate the plotindex on the hash, based on the pixel color */
		if (hexColor !== 'ffffff' && ZC._n_(oFLInfo.color2series[hexColor]) !== null ) {

			/** @type {any} */
			var oPlot = oFLInfo['plot'];
			/** @type {any[]} */
			var aSeries = oFLInfo['series'];
			/** @type {number} */
			var iPlotIndex = oFLInfo.color2series[hexColor];
			/** @type {boolean} */
			var bFireMouseOver = false;
			if (oFLInfo['plotindex'] !== iPlotIndex) {
				bFireMouseOver = true;
			}
			oFLInfo['plotindex'] = iPlotIndex;
			/** @type {any[]} */
			var aValues = aSeries[iPlotIndex]['values'] || [];
			oFLInfo['plottext'] = aSeries[iPlotIndex]['text'] || ('Series ' + iPlotIndex);

			oInfo['plotindex'] = iPlotIndex;
			zingchart.plugins.fastline.showPlotHover(oInfo);

			/* locate nodeindex/value, create tooltip configuration */
			/** @type {any} */
			var oTooltipData = {
				anchor : 'c',
				text : '%plot-text : %node-value',
				'background-color' : '#333333',
				color : '#ffffff',
				'font-size' : 11,
				padding : 5
			};
			ZC._cp_(oFLInfo['tooltip'], oTooltipData);
			ZC._cp_(oPlot['tooltip'], oTooltipData);
			ZC._cp_(aSeries[iPlotIndex]['tooltip'], oTooltipData);

			/** @type {any} */
			var xKey = zingchart.exec(oInfo.id, 'getscaleinfo', {
				graphid : 0,
				name : 'scale-x',
				coord : oInfo.x
			});
			/** @type {number} */
			var fMinDiff = Number.MAX_VALUE;
			/** @type {number} */
			var fLocalDiff;
			/** @type {number} */
			var iNodeX = 0;
			/** @type {number} */
			var iNodeY = 0;
			/** @type {number} */
			var _iNodeX_ = 0;
			/** @type {number} */
			var _iNodeY_ = 0;
			/** @type {number} */
			var _nodeindex_ = null;
			/** @type {number} */
			var _nodevalue_ = null;
			/* quick check for data format, [v] or [k, v] */
			if (aValues[0].length) {
				for (i = 0, iLen = aValues.length; i < iLen; i++) {
					if (aValues[i] === null) {
						continue;
					}
					if (aValues[i][0] === xKey) {
						oFLInfo['nodeindex'] = xKey;
						oFLInfo['nodevalue'] = aValues[i][1];
						_nodeindex_ = -1;
						break;
					} else {
						/*
						iNodeX = zingchart.exec(oInfo.id, 'getscaleinfo', {graphid : 0, name : 'scale-x', value : aValues[i][0]});
						iNodeY = zingchart.exec(oInfo.id, 'getscaleinfo', {graphid : 0, name : 'scale-y', value : aValues[i][1]});
						*/
						var xyCoords = zingchart.exec(oInfo.id, 'fastlinexycoords', {
							key : aValues[i][0],
							val : aValues[i][1]
						});
						iNodeX = xyCoords[0];
						iNodeY = xyCoords[1];

						fLocalDiff = Math.sqrt((iNodeX - oInfo.x)*(iNodeX - oInfo.x) + (iNodeY - oInfo.y)*(iNodeY - oInfo.y));
						if (fLocalDiff < fMinDiff) {
							fMinDiff = fLocalDiff;
							_nodeindex_ = xKey;
							_nodevalue_ = aValues[i][1];
							_iNodeX_ = iNodeX;
							_iNodeY_ = iNodeY;
						}
					}
				}
				if (_nodeindex_ !== -1) {
					oFLInfo['nodeindex'] = _nodeindex_;
					oFLInfo['nodevalue'] = _nodevalue_;
				}
			} else {
				if (aValues[xKey]) {
					oFLInfo['nodeindex'] = xKey;
					oFLInfo['nodevalue'] = aValues[xKey];
				} else {
					for (i = 0, iLen = aValues.length; i < iLen; i++) {
						/*
						iNodeX = zingchart.exec(oInfo.id, 'getscaleinfo', {graphid : 0, name : 'scale-x', value : i});
						iNodeY = zingchart.exec(oInfo.id, 'getscaleinfo', {graphid : 0, name : 'scale-y', value : aValues[i]});
						*/
						var xyCoords = zingchart.exec(oInfo.id, 'fastlinexycoords', {
							key : i,
							val : aValues[i]
						});
						iNodeX = xyCoords[0];
						iNodeY = xyCoords[1];

						fLocalDiff = Math.sqrt((iNodeX - oInfo.x)*(iNodeX - oInfo.x) + (iNodeY - oInfo.y)*(iNodeY - oInfo.y));
						if (fLocalDiff < fMinDiff) {
							fMinDiff = fLocalDiff;
							_nodeindex_ = i;
							_nodevalue_ = aValues[i];
							_iNodeX_ = iNodeX;
							_iNodeY_ = iNodeY;
						}
					}
					if (_nodeindex_ !== -1) {
						oFLInfo['nodeindex'] = _nodeindex_;
						oFLInfo['nodevalue'] = _nodevalue_;
					}
				}
			}

			/** @type {any} */
			var oFormat = ZC.Utils_SetupFormat(oTooltipData);
			oFLInfo['nodevalue'] = ZC.Utils_Format(oFLInfo['nodevalue'], oFormat, null, false);

			oTooltipData['text'] = oTooltipData['text']
				.replace(/%plot-text/g, oFLInfo['plottext'])
				.replace(/%plot-index/g, oFLInfo['plotindex'])
				.replace(/%node-index/g, oFLInfo['nodeindex'])
				.replace(/%node-value/g, oFLInfo['nodevalue']);

			/** @type {any[]} */
			var xData = zingchart.plugins.fastline[oInfo.id].xData;
			for (i = 0; i < xData.length; i++) {
				if (oTooltipData['text'].indexOf('%' + xData[i]) !== -1) {
					/** @type {any[]} */
					var xDataArr = zingchart.plugins.fastline[oInfo.id].series[oFLInfo['plotindex']][xData[i]] || [];
					if (typeof(xDataArr) !== 'object') {
						xDataArr = [xDataArr];
					}
					/** @type {number} */
					var xDataVal = xDataArr[oFLInfo['nodeindex']] || xDataArr[0] || '';
					oTooltipData['text'] = oTooltipData['text'].replace(new RegExp('%' + xData[i], 'g'), xDataVal);
				}
			}

			/* parsing rules */
			if (oTooltipData['rules']) {
				/** @type {any[]} */
				var aTTRules = oTooltipData['rules'];
				for (var i = 0; i < aTTRules.length; i++) {
					/** @type {any} */
					var oTTRule = aTTRules[i];
					if (oTTRule['rule']) {
						/** @type {string} */
						var sRule = oTTRule['rule'] + '';
						sRule = sRule
							.replace(/%node-value/gi, oFLInfo['nodevalue'])
							.replace(/%node-index/gi, oFLInfo['nodeindex'])
							.replace(/%plot-index/gi, oFLInfo['plotindex'])
							.replace(/%node-x/gi, _iNodeX_)
							.replace(/%node-y/gi, _iNodeY_);
						try {
							if (eval(sRule)) {
								ZC._cp_(oTTRule, oTooltipData);
							}
						} catch (e) {}
					}
				}
			}

			if (ZC._n_(oTooltipData['x']) === null) {
				oTooltipData['x'] = oInfo.x;
			} else {
				/** @type {number} */
				var fX = ZC._dimension_(oTooltipData['x'], false);
				if (fX <= 1) {
					fX *= pixmapCanvas.width;
				}
				oTooltipData['x'] = fX;
			}
			if (ZC._n_(oTooltipData['y']) === null) {
				oTooltipData['y'] = oInfo.y;
			} else {
				/** @type {number} */
				var fY = ZC._dimension_(oTooltipData['y'], false);
				if (fY <= 1) {
					fY *= pixmapCanvas.height;
				}
				oTooltipData['y'] = fY;
			}
			oTooltipData['placement'] = 'xy';
			oTooltipData['fixed'] = true;
			oTooltipData['anchor'] = '';

			zingchart.exec(oInfo.id, 'showtooltip', {
				xy : true,
				x : oTooltipData['x'],
				y : oTooltipData['y'],
				data : oTooltipData
			});

			if (bFireMouseOver) {
				oInfo['plotindex'] = oFLInfo['plotindex'];
				oInfo['plottext'] = oFLInfo['plottext'];
				oInfo['nodeindex'] = oFLInfo['nodeindex'];
				oInfo['nodevalue'] = oFLInfo['nodevalue'];
				oInfo['selection'] = oFLInfo['selection'];
				zingchart.fireEvent('zingchart.plugins.fastline.mouseover', oLoader, oInfo);
			}

		} else {
			/* clear hover */
			if (oFLInfo['plotindex'] !== -1) {

				zingchart.plugins.fastline.clearHover(oInfo);

				oInfo['plotindex'] = oFLInfo['plotindex'];
				oInfo['plottext'] = oFLInfo['plottext'];
				oInfo['nodeindex'] = oFLInfo['nodeindex'];
				oInfo['nodevalue'] = oFLInfo['nodevalue'];
				oInfo['selection'] = oFLInfo['selection'];
				zingchart.fireEvent('zingchart.plugins.fastline.mouseout', oLoader, oInfo);
			}
		}
	}
});

})();

/* 
2019-07-25

1. Added ability to use log progression on Y scales. The API support for getting scaleY logBase was added
	in 2.8.7 so, if using the plugin with older versions, the logBase used will have to be 10.

2. Added various options to customize aspect:

	- Added support for "hoverState" object (can be set under the "plot" object or in every "series" item). 
		This will set the styling for the hover line.

	- Added support for "selectedState" object (can be set under the "plot" object or in every "series" item). 
		This will set the styling for the selected lines (ones that will be clicked).

	- Added support for styling the tooltips (styling can be set inside the main "tooltip" object, under the 
		"plot" object or in every "series" item). In addition of styling, the tooltip text can be customized
		via the "text" attribute, which allows for the following tokens:

		%plot-text, %plot-index, %node-index, %node-value

3. Improved events:

	- Added zingchart.plugins.fastline.mouseover and zingchart.plugins.fastline.mouseout events
	- The existing zingchart.plugins.fastline.click event and the new events will provide extra information
		about the plots/nodes being targeted by the mouse action.

4. Added zingchart.plugins.fastline.togglePlot API. Accepts "id" (chart id) and "plotindex" as parameters. Used
	to programatically select/deselect a plot.

	So, for example, in a scenario in which there are 4 similar charts, clicking on the first graph will select
	the respective plots on the other three:

	zingchart.bind('zc1', 'zingchart.plugins.fastline.click', function(p) {
		
		zingchart.plugins.fastline.togglePlot({
			id : 'zc2',
			plotindex : p.plotindex
		});
		zingchart.plugins.fastline.togglePlot({
			id : 'zc3',
			plotindex : p.plotindex
		});
		zingchart.plugins.fastline.togglePlot({
			id : 'zc4',
			plotindex : p.plotindex
		});

	});

5. Added by default Lin/Log related context menu items.

*/
