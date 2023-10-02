import { Request } from 'express';
import url from 'url';

export interface IUrlData {
	protocol: string;
	host?: string;
	pathname?: string;
	query: Record<string, string | string[] | undefined>;
}

const getProtocol = (req: Request): string => req.header('x-forwarded-proto') ?? req.protocol;

export const getUrlData = (req: Request): IUrlData => {
	const parsedRelativeUrl = url.parse(req.originalUrl, true);
	return {
		protocol: getProtocol(req),
		host: req.get('host'),
		pathname: parsedRelativeUrl.pathname ?? undefined,
		query: parsedRelativeUrl.query,
	};
};
