import {
	BorderStyle,
	Document,
	HeadingLevel,
	HeightRule,
	ImageRun,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	VerticalAlign,
	WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// SPACING MUST REQUIRE BEFORE, AFTER, AND LINE VALUES IN ORDER TO WORK WELL WITH libreoffice (slack document preview).

const COLOR_BLACK = '000000';
const DEFAULT_FONT = 'Roboto';

const createText = (data, bold = false) => {
	return new TextRun({
		text: data,
		size: 14,
		color: COLOR_BLACK,
		font: DEFAULT_FONT,
		bold,
	});
};

const createHeading1 = (text: string, thematicBreak: boolean) => {
	return new Paragraph({
		heading: HeadingLevel.HEADING_1,
		thematicBreak,
		children: [new TextRun({ text, bold: true, size: 30, font: DEFAULT_FONT, color: COLOR_BLACK })],
	});
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const createHeading2 = (text: string, thematicBreak: boolean, border?: any) => {
	return new Paragraph({
		border,
		heading: HeadingLevel.HEADING_2,
		thematicBreak,
		children: [new TextRun({ text, bold: true, size: 20, font: DEFAULT_FONT, color: COLOR_BLACK })],
	});
};

const noBorders = {
	top: {
		style: BorderStyle.SINGLE,
		color: COLOR_BLACK,
		size: 2,
	},
	bottom: {
		style: BorderStyle.NONE,
		color: COLOR_BLACK,
		size: 1,
	},
	right: {
		style: BorderStyle.NONE,
		color: COLOR_BLACK,
		size: 1,
	},
	left: {
		style: BorderStyle.NONE,
		color: COLOR_BLACK,
		size: 1,
	},
	insideVertical: {
		style: BorderStyle.NONE,
		color: COLOR_BLACK,
		size: 2,
	},
	insideHorizontal: {
		style: BorderStyle.SINGLE,
		color: COLOR_BLACK,
		size: 2,
	},
};

const createTwoColumnTable = (tableData, borders = noBorders) => {
	const tableValue = new Table({
		borders,
		columnWidths: [4505, 4505],
		rows: tableData.map((row) => {
			return new TableRow({
				height: { rule: HeightRule.ATLEAST, value: 300 },
				children: [
					new TableCell({
						width: {
							size: 100,
							type: WidthType.PERCENTAGE,
						},
						verticalAlign: VerticalAlign.CENTER,
						children: [new Paragraph({ children: [createText(row?.header, true)] })],
					}),
					new TableCell({
						width: {
							size: 100,
							type: WidthType.PERCENTAGE,
						},
						verticalAlign: VerticalAlign.CENTER,
						children: [
							new Paragraph({
								children: [createText(row?.value)],
							}),
						],
					}),
				],
			});
		}),
	});

	return [tableValue];
};

const createSpacing = (spacing = 150) => {
	const spacingParagraph = new Paragraph({ spacing: { before: spacing, after: spacing, line: spacing } });
	return [spacingParagraph];
};

const createImg = (data) => {
	return [
		new Paragraph({
			children: [
				new ImageRun({
					data,
					transformation: {
						width: 600,
						height: 200,
					},
				}),
			],
		}),
	];
};

export const generateDocument = (sections) => {
	const document = new Document({
		background: {
			color: '#FFFFFF',
		},
		sections,
	});

	return document;
};

const generateSection = (dataArray) => {
	const merged = [].concat(...(dataArray as []));

	return {
		children: merged,
	};
};

export const saveDocument = async (inputData, chartRef, fileName = 'summary.docx') => {
	const canvas = await html2canvas(chartRef.current, { scale: 2 });
	// eslint-disable-next-line no-promise-executor-return -- TODO eslint fix later
	const canvasBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

	const sections = [
		generateSection([
			createHeading1('Report for AFE Memo', false),
			createSpacing(),

			createTwoColumnTable(inputData.reportDetails),
			createSpacing(),

			createHeading2('Project Inputs', false),
			createSpacing(50),
			createTwoColumnTable(inputData.projectInputs),
			createSpacing(),

			createHeading2('Economics', false),
			createSpacing(50),
			createTwoColumnTable(inputData.economics),
			createSpacing(),

			createHeading2('Description', false, {
				bottom: {
					color: 'auto',
					space: 1,
					size: 1,
					value: 'single',
				},
			}),
			createSpacing(50),
			createImg(canvasBlob),
			createSpacing(),
		]),

		generateSection(
			inputData.econGroups
				.map(({ category, data }) => {
					return [
						createHeading2(category, false),

						createSpacing(50),
						createTwoColumnTable(data),
						createSpacing(),
					];
				})
				.flat()
		),
	];

	const wordDocument = generateDocument(sections);

	const blob = await Packer.toBlob(wordDocument);

	saveAs(blob, fileName);
};
