/* eslint-disable react/no-unescaped-entities */
import { Step, buttons, highlightOn, waitForClickOn } from '@/components/shepherd';
import { ID } from '@/economics/Economics/shared/constants';

const { done, start, next } = buttons;

export const csvExportTour: Step[] = [
	{
		title: 'Create Custom CSV Exports!',
		text: (
			<div>
				<p>Easily create and save customized CSV reports, utilize hybrid reporting structures, and more!</p>
				<b>Let's walk through the basic steps.</b>
			</div>
		),
		buttons: [start],
	},
	{
		title: 'Report Type',
		text: (
			<div>
				<p>Choose your desired report type.</p>
				Please <b>select Well Cash Flow</b> for this example.
			</div>
		),
		...waitForClickOn({ id: ID.reportType, event: 'mousedown' }),
	},
	{
		title: 'Report Type',
		text: (
			<div>
				<p>Choose your desired report type.</p>
				Please <b>select Well Cash Flow</b> for this example.
			</div>
		),
		...waitForClickOn({ id: ID.cashflow, minDuration: 120 }),
	},
	{
		title: 'Templates Section',
		text: (
			<div>
				Saved templates can be viewed and managed here. Please <b>select By Well to continue.</b>
			</div>
		),
		...waitForClickOn({ id: ID.byWelltemplate }),
	},
	{
		title: 'Cash Flow Reporting',
		text: (
			<div>
				<p>Choose the reporting frequency and if you would like to aggregate after a period of time.</p>
			</div>
		),
		...highlightOn({ id: ID.cashflowReportFormGroup, on: 'bottom' }),
		buttons: [next],
	},
	{
		title: 'Hybrid Reports',
		text: (
			<div>
				If using the new hybrid reporting feature, determine number of months to report before switching to
				yearly here.
			</div>
		),
		...highlightOn({ id: ID.cashflowReportHybidFormGroup, on: 'bottom' }),
		buttons: [next],
	},
	{
		title: 'Headers and Output Columns',
		text: (
			<div>
				<p>Make edits to what fields you wish to populate in your report.</p>
				<p>Drag and drop columns on the lefthand side to reorder.</p>
			</div>
		),
		...highlightOn({ id: ID.headersAndOutputColumnsGroup }),
		buttons: [next],
	},
	{
		title: 'Save and Export',
		text: (
			<div>
				<p>Now your report is ready to be exported.</p>
				<p>Don't forget to save your customized report as a template for future use!</p>
			</div>
		),
		...highlightOn({ id: ID.templateName, on: 'bottom' }),
		buttons: [next],
	},
	{
		title: 'Save and Export',
		text: (
			<div>
				<p>Now your report is ready to be exported.</p>
				<p>Don't forget to save your customized report as a template for future use!</p>
			</div>
		),
		...highlightOn({ id: ID.export, on: 'top' }),
		buttons: [done],
	},
];
