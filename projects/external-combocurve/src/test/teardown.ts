import { log } from 'console';

const teardown = async (): Promise<void> => {
	log('Teardown JEST');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const aux = global as any;

	const mongo = aux.__MONGOD__;
	await mongo.stop();
};

export default teardown;
