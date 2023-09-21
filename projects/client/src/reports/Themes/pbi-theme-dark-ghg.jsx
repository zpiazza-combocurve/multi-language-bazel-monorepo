export const themeDarkGhg = {
	name: 'CY21SU11',
	dataColors: [
		'#118DFF',
		'#12239E',
		'#E66C37',
		'#6B007B',
		'#E044A7',
		'#744EC2',
		'#D9B300',
		'#D64550',
		'#197278',
		'#1AAB40',
		'#15C6F4',
		'#4092FF',
		'#FFA058',
		'#BE5DC9',
		'#F472D0',
		'#B5A1FF',
		'#C4A200',
		'#FF8080',
		'#00DBBC',
		'#5BD667',
		'#0091D5',
		'#4668C5',
		'#FF6300',
		'#99008A',
		'#EC008C',
		'#533285',
		'#99700A',
		'#FF4141',
		'#1F9A85',
		'#25891C',
		'#0057A2',
		'#002050',
		'#C94F0F',
		'#450F54',
		'#B60064',
		'#34124F',
		'#6A5A29',
		'#1AAB40',
		'#BA141A',
		'#0C3D37',
		'#0B511F',
	],
	foreground: '#252423',
	foregroundNeutralSecondary: '#605E5C',
	foregroundNeutralTertiary: '#B3B0AD',
	background: '#FFFFFF',
	backgroundLight: '#F3F2F1',
	backgroundNeutral: '#C8C6C4',
	tableAccent: '#118DFF',
	good: '#1AAB40',
	neutral: '#D9B300',
	bad: '#D64554',
	maximum: '#118DFF',
	center: '#D9B300',
	minimum: '#DEEFFF',
	null: '#FF7F48',
	hyperlink: '#0078d4',
	visitedHyperlink: '#0078d4',
	textClasses: {
		callout: {
			fontSize: 45,
			fontFace: 'DIN',
			color: '#252423',
		},
		title: {
			fontSize: 12,
			fontFace: 'DIN',
			color: '#252423',
		},
		header: {
			fontSize: 12,
			fontFace: 'Segoe UI Semibold',
			color: '#252423',
		},
		label: { fontSize: 10, fontFace: 'Segoe UI', color: '#252423' },
	},
	visualStyles: {
		'*': {
			'*': {
				'*': [{ wordWrap: true }],
				line: [{ transparency: 0 }],
				outline: [{ transparency: 0 }],
				plotArea: [{ transparency: 0 }],
				categoryAxis: [{ showAxisTitle: true, gridlineStyle: 'dotted' }],
				valueAxis: [{ showAxisTitle: true, gridlineStyle: 'dotted' }],
				title: [{ titleWrap: true }],
				lineStyles: [{ strokeWidth: 3 }],
				wordWrap: [{ show: true }],
				background: [{ show: true, transparency: 0 }],
				outspace: [
					{
						color: {
							solid: {
								color: '#242427',
							},
						},
						transparency: 0,
					},
				],
				outspacePane: [
					{
						backgroundColor: { solid: { color: '#ffffff' } },
						foregroundColor: { solid: { color: '#252423' } },
						transparency: 0,
						border: true,
						borderColor: { solid: { color: '#B3B0AD' } },
					},
				],
				filterCard: [
					{
						$id: 'Applied',
						transparency: 0,
						foregroundColor: { solid: { color: '#252423' } },
						border: true,
					},
					{
						$id: 'Available',
						transparency: 0,
						foregroundColor: { solid: { color: '#252423' } },
						border: true,
					},
				],
			},
		},
		scatterChart: {
			'*': {
				bubbles: [{ bubbleSize: -10 }],
				general: [{ responsive: true }],
				fillPoint: [{ show: true }],
				legend: [{ showGradientLegend: true }],
			},
		},
		lineChart: {
			'*': {
				general: [{ responsive: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		map: { '*': { bubbles: [{ bubbleSize: -10 }] } },
		pieChart: {
			'*': {
				legend: [{ show: true, position: 'RightCenter' }],
				labels: [{ labelStyle: 'Data value, percent of total' }],
			},
		},
		donutChart: {
			'*': {
				legend: [{ show: true, position: 'RightCenter' }],
				labels: [{ labelStyle: 'Data value, percent of total' }],
			},
		},
		pivotTable: { '*': { '*': [{ showExpandCollapseButtons: true }] } },
		multiRowCard: {
			'*': { card: [{ outlineWeight: 2, barShow: true, barWeight: 2 }] },
		},
		kpi: { '*': { trendline: [{ transparency: 20 }] } },
		slicer: { '*': { general: [{ responsive: true }] } },
		waterfallChart: { '*': { general: [{ responsive: true }] } },
		columnChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		clusteredColumnChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		hundredPercentStackedColumnChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		barChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		clusteredBarChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		hundredPercentStackedBarChart: {
			'*': {
				general: [{ responsive: true }],
				legend: [{ showGradientLegend: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		areaChart: {
			'*': {
				general: [{ responsive: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		stackedAreaChart: {
			'*': {
				general: [{ responsive: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		lineClusteredColumnComboChart: {
			'*': {
				general: [{ responsive: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		lineStackedColumnComboChart: {
			'*': {
				general: [{ responsive: true }],
				smallMultiplesLayout: [{ backgroundTransparency: 0, gridLineType: 'inner' }],
			},
		},
		ribbonChart: { '*': { general: [{ responsive: true }] } },
		group: { '*': { background: [{ show: false }] } },
		basicShape: {
			'*': {
				background: [{ show: false }],
				general: [{ keepLayerOrder: true }],
				visualHeader: [{ show: false }],
			},
		},
		shape: {
			'*': {
				background: [{ show: false }],
				general: [{ keepLayerOrder: true }],
				visualHeader: [{ show: false }],
			},
		},
		image: {
			'*': {
				background: [{ show: false }],
				general: [{ keepLayerOrder: true }],
				visualHeader: [{ show: false }],
				lockAspect: [{ show: true }],
			},
		},
		actionButton: {
			'*': {
				background: [{ show: false }],
				visualHeader: [{ show: false }],
			},
		},
		pageNavigator: {
			'*': {
				background: [{ show: false }],
				visualHeader: [{ show: false }],
			},
		},
		bookmarkNavigator: {
			'*': {
				background: [{ show: false }],
				visualHeader: [{ show: false }],
			},
		},
		textbox: {
			'*': {
				general: [{ keepLayerOrder: true }],
				visualHeader: [{ show: false }],
			},
		},
		page: {
			'*': {
				background: [
					{
						color: {
							solid: {
								color: '#242427',
							},
						},
						transparency: 0,
					},
				],
				outspace: [
					{
						color: {
							solid: {
								color: '#242427',
							},
						},
						transparency: 0,
					},
				],
				outspacePane: [
					{
						backgroundColor: {
							solid: {
								color: '#ffffff',
							},
						},
						foregroundColor: {
							solid: {
								color: '#d0d0d2',
							},
						},
						borderColor: {
							solid: {
								color: '#d0d0d2',
							},
						},
						transparency: 0,
						titleSize: 18,
						headerSize: 8,
						fontFamily: 'Arial',
						border: true,
					},
				],
			},
		},
	},
};
