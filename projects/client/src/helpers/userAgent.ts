import { UAParser } from 'ua-parser-js';

export const userAgentInfo = window?.navigator?.userAgent
	? new UAParser(window.navigator.userAgent).getResult()
	: undefined;
