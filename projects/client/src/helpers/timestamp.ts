import { format } from 'date-fns';

import { slugify } from './slugify';

export function timestamp(date: Date | number) {
	return format(date, "yyyyMMdd't'HHmmss");
}

export function fileNameTime(date: Date) {
	return format(date, 'MM/dd/yyyy_HH:mm:ss');
}

export function addDateTime(fileName: string) {
	return slugify(`${fileName}-${fileNameTime(new Date())}`);
}
