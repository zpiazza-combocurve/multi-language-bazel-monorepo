export const themeDark = {
	name: 'ComboCurve Theme - Dark',
	dataColors: [
		'#00bfa5',
		'#9966ff',
		'#ff9f40',
		'#840032',
		'#00b0ff',
		'#6386ff',
		'#ffce56',
		'#ff6384',
		'#607d8b',
		'#DFBFBF',
		'#4AC5BB',
		'#5F6B6D',
		'#FB8281',
		'#F4D25A',
		'#7F898A',
		'#A4DDEE',
		'#FDAB89',
		'#B687AC',
		'#28738A',
		'#A78F8F',
		'#168980',
		'#293537',
		'#BB4A4A',
		'#B59525',
		'#475052',
		'#6A9FB0',
		'#BD7150',
		'#7B4F71',
		'#1B4D5C',
		'#706060',
		'#0F5C55',
		'#1C2325',
	],
	good: '#00bfa5',
	neutral: '#607d8b',
	bad: '#840032',
	maximum: '#666666',
	center: '#9B9B9B',
	minimum: '#666666',
	null: '#ffce56',
	background: '#2c2c2e',
	backgroundLight: '#2c2c2e',
	backgroundNeutral: '#2c2c2e',
	foreground: '#444446',
	foregroundNeutralSecondary: '#444446',
	foregroundNeutralTertiary: '#444446',
	tableAccent: '#607d8b',
	textClasses: {
		callout: {
			fontSize: 28,
			fontFace: 'Arial',
			color: '#f0f0f2',
		},
		title: {
			fontSize: 14,
			fontFace: 'Arial',
			color: '#f0f0f2',
		},
		largeTitle: {
			fontSize: 14,
			fontFace: 'Arial',
			color: '#f0f0f2',
		},
		header: {
			fontSize: 12,
			fontFace: 'Arial',
			color: '#f0f0f2',
		},
		label: {
			fontSize: 10,
			fontFace: 'Arial',
			color: '#F0F0F2',
		},
		lightLabel: {
			color: '#d0d0d2',
		},
		largeLightLabel: {
			color: '#d0d0d2',
		},
		smallLightLabel: {
			color: '#d0d0d2',
		},
	},
	visualStyles: {
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
				filterCard: [
					{
						$id: 'Applied',
						backgroundColor: {
							solid: {
								color: '#f0f0f2',
							},
						},
						foregroundColor: {
							solid: {
								color: '#2c2c2e',
							},
						},
						borderColor: { solid: { color: '#f0f0f2' } },
						inputBoxColor: { solid: { color: '#2c2c2e' } },
						transparency: 0,
						textSize: 11,
						fontFamily: 'Arial',
						border: true,
					},
					{
						$id: 'Available',
						backgroundColor: { solid: { color: '#f0f0f2' } },
						foregroundColor: { solid: { color: '#d0d0d2' } },
						borderColor: { solid: { color: '#f0f0f2' } },
						inputBoxColor: { solid: { color: '#f0f0f2' } },
						transparency: 0,
						textSize: 10,
						fontFamily: 'Arial',
						border: true,
					},
				],
			},
		},
		'*': {
			'*': {
				'*': [
					{
						responsive: true,
						wordWrap: true,
						fontSize: 10,
						backColorPrimary: { solid: { color: '#2c2c2e' } },
						backColorSecondary: { solid: { color: '#ededed' } },
						fontFamily: 'Arial',
					},
				],
				title: [
					{
						show: true,
						fontColor: { solid: { color: '#f0f0f2' } },
						background: { solid: { color: '#2c2c2e' } },
						alignment: 'center',
						fontSize: 12,
						fontFamily: 'Arial',
					},
				],
				background: [
					{
						show: false,
						color: { solid: { color: '#2c2c2e' } },
						transparency: 0,
					},
				],
				lockAspect: [{ show: true }],
				border: [{ show: false, color: { solid: { color: '#2c2c2e' } } }],
				visualTooltip: [
					{
						type: 'Default',
						titleFontColor: { solid: { color: '#F0F0F2' } },
						valueFontColor: { solid: { color: '#FFFFFF' } },
						background: { solid: { color: '#555557' } },
					},
				],
				stylePreset: [{ name: 'None' }],
				datalabels: { color: { solid: { color: '#f0f0f2' } } },
				wordWrap: [{ show: true }],
				labels: [
					{
						show: true,
						labelOrientation: 'horizontal',
						color: { solid: { color: '#f0f0f2' } },
						fillcolor: { solid: {} },
						enableBackground: true,
					},
				],
				categoryLabels: [{ show: true, labelColor: { solid: {} } }],
				categoryAxis: [{ showAxisTitle: true, labelColor: { solid: {} } }],
				valueAxis: [{ showAxisTitle: true, labelColor: { solid: {} } }],
				visualHeader: [
					{
						background: { solid: { color: '#CBCBCD' } },
						foreground: { solid: { color: '#0C0C0E' } },
					},
				],
				outspacePane: [
					{
						backgroundColor: { solid: { color: '#FA0303' } },
						foregroundColor: { solid: { color: '#2C2C2E' } },
					},
				],
				filterCard: [
					{
						$id: 'Available',
						backgroundColor: { solid: { color: '#FA0303' } },
						foregroundColor: { solid: { color: '#2C2C2E' } },
						transparency: 0,
					},
					{
						$id: 'Applied',
						backgroundColor: { solid: { color: '#FA0303' } },
						foregroundColor: { solid: { color: '#A71B1B' } },
						transparency: 0,
					},
				],
			},
		},
		slicer: {
			'*': {
				background: [
					{
						show: false,
						color: { solid: { color: '#2c2c2e' } },
						transparency: 0,
					},
				],
				general: [
					{
						outlineColor: { solid: {} },
						outlineWeight: 1,
						orientation: 'vertical',
						responsive: true,
					},
				],
				data: [{ mode: 'Basic', relativeRange: '', relativePeriod: '' }],
				selection: [{ selectAllCheckboxEnabled: false, singleSelect: true }],
				header: [
					{
						show: true,
						fontColor: { solid: { color: '#f0f0f2' } },
						background: { solid: {} },
						outline: 'None',
						textSize: 10,
						fontFamily: 'Arial',
					},
				],
				items: [
					{
						fontColor: { solid: { color: '#f0f0f2' } },
						background: { solid: {} },
						outline: 'None',
					},
				],
			},
		},
		basicShape: {
			'*': {
				general: [
					{
						outlineColor: { solid: { color: '#2c2c2e' } },
						outlineWeight: 0,
						orientation: 'vertical',
						responsive: true,
						background: { solid: { color: '#2c2c2e' } },
					},
				],
				border: [{ show: false, color: { solid: { color: '#2c2c2e' } } }],
				line: [
					{
						lineColor: { solid: { color: '#f0f0f2' } },
						transparency: 0,
						weight: 3,
						roundEdge: 0,
					},
				],
				fill: [
					{
						show: true,
						fillColor: { solid: { color: '#f0f0f2' } },
						transparency: 0,
					},
				],
				rotation: [{ angle: 0 }],
				visualHeader: [{ show: false }],
			},
		},
		waterfallChart: {
			'*': {
				sentimentColors: [
					{
						increaseFill: { solid: { color: '#f0f0f2' } },
						decreaseFill: { solid: { color: '#efbfbf' } },
						totalFill: { solid: { color: '#535353' } },
						otherFill: { solid: { color: '#f0f0f2' } },
					},
				],
				breakdown: [{ maxBreakdowns: 8 }],
			},
		},
		textbox: {
			'*': {
				visualHeader: [{ show: false }],
				background: [
					{
						show: false,
						color: { solid: { color: '#ff0000' } },
						transparency: 0,
					},
				],
			},
		},
	},
};
