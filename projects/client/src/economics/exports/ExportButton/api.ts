import { cleanFileName, postApi } from '@/helpers/routing';

export async function loadMultipleExport(props) {
	return postApi('/economics/genEconCsvExport', {
		...props,
		fileName: cleanFileName(props.fileName),
		// eslint-disable-next-line new-cap
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}

export function buildEconCsvExport(props) {
	return postApi('/economics/genEconCsvExport', {
		...props,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}

export function buildGhgReport(props) {
	return postApi('/economics/buildGHGReport', {
		...props,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}

export function buildEconReport(props) {
	return postApi('/economics/genEconReport', {
		...props,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}

export async function buildByWellEconReport(props) {
	return postApi('/economics/genEconReportByWell', {
		...props,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}
