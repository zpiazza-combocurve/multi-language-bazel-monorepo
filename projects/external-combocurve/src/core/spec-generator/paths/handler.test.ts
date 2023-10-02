import { TestController } from '@src/core/test.exports';

import { PathsGenHandler } from './handler';

describe('spec handler', () => {
	it('mapRequestObjects', () => {
		const handler = new PathsGenHandler<TestController>('test_route', new TestController());

		const paths = handler.getPathSpec();

		expect(paths).toMatchSnapshot();
	});
});
