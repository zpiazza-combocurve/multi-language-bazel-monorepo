const teardown = async () => {
	await global.__MONGOD__.stop();
};

export default teardown;
