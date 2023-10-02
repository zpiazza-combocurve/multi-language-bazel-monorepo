import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../pagination';

import { ApiWellComment, READ_RECORD_LIMIT } from './fields';
import { getWellComments, getWellCommentsHead } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getWellCommentsArray = (n = 1) =>
	[...Array(n).keys()].map((i) => ({
		commentedAt: new Date(new Date('2000-01-01').setUTCDate(i + 1)),
		commentedBy: Types.ObjectId((i + '').padStart(24, '0')),
		forecast: Types.ObjectId((i + '').padStart(24, '0')),
		project: Types.ObjectId((i + '').padStart(24, '0')),
		text: (1 / i).toString(36).substring(7),
		well: Types.ObjectId((i + '').padStart(24, '0')),
	}));

describe('v1/well-comments/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getWellCommentsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'well-comments';

		res.locals = {
			service: {
				getWellCommentsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getWellCommentsHead, READ_RECORD_LIMIT);
	});
	test('getWellCommentsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'well-comments';

		let count = 0;

		const getWellCommentsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getWellCommentsCount,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getWellCommentsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="last"',
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getWellCommentsHead(req, res);
		expect(getWellCommentsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/well-comments?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getWellCommentsHead(req, res);
		expect(getWellCommentsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/well-comments?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getWellCommentsHead(req, res);
		expect(getWellCommentsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/well-comments?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', well: 'a' };
		count = 35;
		await getWellCommentsHead(req, res);
		expect(getWellCommentsCount).toHaveBeenLastCalledWith({ well: ['a'] });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/well-comments?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getWellCommentsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', well: 'a', a: 'b' };
		count = 35;
		await expect(getWellCommentsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getWellCommentsCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getWellComments throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'well-comments';

		res.locals = {
			service: {
				getWellComments: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getWellComments, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['date'] };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=date' };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>date' };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+date' };
		await expect(getWellComments(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getWellComments(req, res)).rejects.toThrow(ValidationError);
	});

	test('getWellComments runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'well-comments';

		let result: ApiWellComment[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceWellComment = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getWellComments: serviceWellComment,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getWellCommentsArray(3);
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellCommentsArray(3));

		result = getWellCommentsArray(25);
		hasNext = true;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellCommentsArray(25));

		req.query = { skip: '25' };
		result = getWellCommentsArray(25);
		hasNext = true;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getWellCommentsArray(25));

		req.query = { skip: '30', take: '10' };
		result = getWellCommentsArray(5);
		hasNext = false;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(30, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first"',
		});

		req.query = { skip: '30', take: '10', well: 'a' };
		result = getWellCommentsArray(5);
		hasNext = false;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { well: ['a'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first"',
		});

		const serviceCallTimes = serviceWellComment.mock.calls.length;
		req.query = { skip: '30', take: '10', well: 'a', a: 'b' };
		result = getWellCommentsArray(5);
		hasNext = false;
		await expect(getWellComments(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceWellComment.mock.calls.length).toBe(serviceCallTimes);

		expect(serviceWellComment).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { well: ['a'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first"',
		});

		req.query = { skip: '30', take: '10', well: 'a', sort: '-project' };
		result = getWellCommentsArray(5);
		hasNext = false;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(30, 10, { project: -1 }, { well: ['a'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/well-comments?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first"',
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/well-comments?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getWellCommentsArray(5);
		hasNext = true;
		cursor = Types.ObjectId();
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/well-comments?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/well-comments?take=10>;rel="first"`,
		});

		req.query = { take: '10', well: '123456789012345678901234', sort: '+well' };
		result = getWellCommentsArray(5);
		hasNext = true;
		cursor = null;
		await getWellComments(req, res);
		expect(serviceWellComment).toHaveBeenLastCalledWith(
			0,
			10,
			{ well: 1 },
			{ well: ['123456789012345678901234'] },
			undefined,
		);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/well-comments?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/well-comments?skip=0&take=10>;rel="first"`,
		});
	});
});
