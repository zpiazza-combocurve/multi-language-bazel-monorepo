import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { generateObjectId, generateString } from '@src/helpers/test/data-generation';
import { ITag } from '@src/models/tags';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CursorType } from '../pagination';

import { ApiTag, READ_RECORD_LIMIT } from './fields/root-tags';
import { getTags, getTagsHead } from './controllers';

import { mockExpress } from '@test/express-mocks';

const getTagsArray = (n = 1) =>
	[...Array(n).keys()].map(
		(i) =>
			({
				id: generateObjectId(i),
				name: generateString(i),
				description: generateString(i),
			}) as ITag,
	);

describe('v1/tags/controllers', () => {
	// eslint-disable-next-line jest/expect-expect
	test('getTagsHead throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'tags';

		res.locals = {
			service: {
				getTagsCount: () => 0,
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getTagsHead, READ_RECORD_LIMIT);
	});
	test('getTagsHead runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'tags';

		let count = 0;

		const getTagsCount = jest.fn(() => count);

		res.locals = {
			service: {
				getTagsCount,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getTagsHead(req, res);

		expect(res.set).toHaveBeenCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="last"',
			'X-Query-Count': '0',
		});
		expect(res.json).not.toHaveBeenCalled();

		count = 51;
		await getTagsHead(req, res);
		expect(getTagsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/tags?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '25' };
		count = 51;
		await getTagsHead(req, res);
		expect(getTagsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="first",' +
				'<http://www.localhost.com/tags?skip=50&take=25>;rel="last"',
			'X-Query-Count': '51',
		});

		req.query = { skip: '30', take: '10' };
		count = 35;
		await getTagsHead(req, res);
		expect(getTagsCount).toHaveBeenLastCalledWith({});
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/tags?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		req.query = { skip: '30', take: '10', name: 'First' };
		count = 35;
		await getTagsHead(req, res);
		expect(getTagsCount).toHaveBeenLastCalledWith({ name: ['First'] });
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=10>;rel="first",' +
				'<http://www.localhost.com/tags?skip=30&take=10>;rel="last"',
			'X-Query-Count': '35',
		});

		const serviceCallTimes = getTagsCount.mock.calls.length;
		req.query = { skip: '30', take: '10', name: 'First', a: 'b' };
		count = 35;
		await expect(getTagsHead(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(getTagsCount.mock.calls.length).toBe(serviceCallTimes);
	});
	test('getTags throws validation error', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'tags';

		res.locals = {
			service: {
				getTags: () => ({ result: [], hasNext: false }),
			},
		};
		res.set = jest.fn(() => res);

		await testSkipAndTakeErrors(req, res, getTags, READ_RECORD_LIMIT);

		req.query = { sort: ['a'] };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: ['date'] };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '35' };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: 'a' };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '=date' };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '>date' };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { sort: '-+date' };
		await expect(getTags(req, res)).rejects.toThrow(TypeError);

		req.query = { skip: '10', cursor: '123456789012345678901234' };
		await expect(getTags(req, res)).rejects.toThrow(ValidationError);
	});

	test('getTags runs correctly', async () => {
		const { req, res } = mockExpress();

		req.originalUrl = 'tags';

		let result: ApiTag[] = [];
		let hasNext = false;
		let cursor: CursorType | null = null;
		const cursorB64 = () => cursor && Buffer.from(cursor.toString()).toString('base64');
		const serviceTag = jest.fn(() => ({ result, hasNext, cursor }));

		res.locals = {
			service: {
				getTags: serviceTag,
			},
		};
		res.set = jest.fn(() => res);
		res.json = jest.fn();

		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/tags?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith([]);

		result = getTagsArray(3);
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link: '<http://www.localhost.com/tags?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getTagsArray(3));

		result = getTagsArray(25);
		hasNext = true;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=25&take=25>;rel="next",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getTagsArray(25));

		req.query = { skip: '25' };
		result = getTagsArray(25);
		hasNext = true;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(25, 25, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=50&take=25>;rel="next",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=25>;rel="first"',
		});
		expect(res.json).toHaveBeenLastCalledWith(getTagsArray(25));

		req.query = { skip: '30', take: '10', sort: 'name' };
		result = getTagsArray(5);
		hasNext = false;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(30, 10, { name: 1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=10>;rel="first"',
		});

		req.query = { skip: '30', take: '10', name: 'First' };
		result = getTagsArray(5);
		hasNext = false;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(30, 10, { id: -1 }, { name: ['First'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=10>;rel="first"',
		});

		const serviceCallTimes = serviceTag.mock.calls.length;
		req.query = { skip: '20', take: '10', name: 'First', a: 'b' };
		result = getTagsArray(5);
		hasNext = false;
		await expect(getTags(req, res)).rejects.toThrow(FieldNameFilterError);
		// Service must not be called
		expect(serviceTag.mock.calls.length).toBe(serviceCallTimes);

		req.query = { skip: '30', take: '10', name: 'First', sort: '-name' };
		result = getTagsArray(5);
		hasNext = false;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(30, 10, { name: -1 }, { name: ['First'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				'<http://www.localhost.com/tags?skip=20&take=10>;rel="prev",' +
				'<http://www.localhost.com/tags?skip=0&take=10>;rel="first"',
		});

		req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };
		result = [];
		hasNext = false;
		cursor = Types.ObjectId();
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, '123456789012345678901234');
		expect(res.set).toHaveBeenLastCalledWith({
			Link: `<http://www.localhost.com/tags?take=10>;rel="first"`,
		});

		req.query = { take: '10' };
		result = getTagsArray(15);
		hasNext = true;
		cursor = Types.ObjectId();
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 10, { id: -1 }, {}, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/tags?cursor=${cursorB64()}&take=10>;rel="next",` +
				`<http://www.localhost.com/tags?take=10>;rel="first"`,
		});

		req.query = { take: '10', name: 'default1', sort: '+name' };
		result = getTagsArray(15);
		hasNext = true;
		cursor = null;
		await getTags(req, res);
		expect(serviceTag).toHaveBeenLastCalledWith(0, 10, { name: 1 }, { name: ['default1'] }, undefined);
		expect(res.set).toHaveBeenLastCalledWith({
			Link:
				`<http://www.localhost.com/tags?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/tags?skip=0&take=10>;rel="first"`,
		});
	});
});
