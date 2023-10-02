import { Request, Response } from 'express';

import { FORECAST_RESOLUTION, ForecastResolutions } from '@src/models/forecast-volume';
import { TypeError, ValueError } from '@src/helpers/validation';

// adapter for forecast volume controller methods
const testForecastVolumeSkipAndTakeErrors = async (
	req: Request,
	res: Response,
	method: (req: Request, res: Response, resolution: ForecastResolutions) => Promise<void>,
	recordLimit: number,
): Promise<void> => {
	await testSkipAndTakeErrors(
		req,
		res,
		(req: Request, res: Response) => method(req, res, FORECAST_RESOLUTION[0]),
		recordLimit,
	);
};

const testSkipAndTakeErrors = async (
	req: Request,
	res: Response,
	method: (req: Request, res: Response) => Promise<void>,
	recordLimit: number,
): Promise<void> => {
	req.query = { skip: 'a' };
	await expect(method(req, res)).rejects.toThrow(TypeError);

	req.query = { skip: ['25'] };
	await expect(method(req, res)).rejects.toThrow(TypeError);

	req.query = { skip: '-10' };
	await expect(method(req, res)).rejects.toThrow(ValueError);

	req.query = { take: 'a' };
	await expect(method(req, res)).rejects.toThrow(TypeError);

	req.query = { take: ['25'] };
	await expect(method(req, res)).rejects.toThrow(TypeError);

	req.query = { take: '-10' };
	await expect(method(req, res)).rejects.toThrow(ValueError);

	req.query = { take: '0' };
	await expect(method(req, res)).rejects.toThrow(ValueError);

	req.query = { take: `${recordLimit + 1}` };
	await expect(method(req, res)).rejects.toThrow(ValueError);

	req.query = { skip: '10', take: 'a' };
	await expect(method(req, res)).rejects.toThrow(TypeError);

	req.query = { skip: 'a', take: '10' };
	await expect(method(req, res)).rejects.toThrow(TypeError);
};

export { testForecastVolumeSkipAndTakeErrors, testSkipAndTakeErrors };
