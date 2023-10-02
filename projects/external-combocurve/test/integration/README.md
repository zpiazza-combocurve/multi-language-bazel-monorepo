To run integration tests locally:
	- Update LOCAL_ENV variable in project root .env file to point to integration4test tenant
	- Execute `npm run dev` from project root
	- Add API_TESTS_WRITER_CS environment variable in test/integration/.env.development with a mongo connection string 
		***make sure connection string is pointing to integration4test database***
	- Add API_TESTS_KEY environment variable in test/integration/.env.development with an api key for the external-api
	- Execute `npm install` in the test/integration directory
	- Execute `npm run test:local:dev` in the test/integration directory to execute tests
