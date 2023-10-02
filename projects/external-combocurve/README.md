### External ComboCurve

ComboCurve REST API for external access.

## Installation

```
npm install
```
## Enable external API for new environment
1. **external-combocurve** PR to add new env
2. **iac-combocurve** PR to add new env
3. Run TF apply on iac-combocurve PR
4. Add value for **apiTenantsReaderCS** secret
    * Copy it from any other environment and modify the database name to the current environment
    * In Atlas, grant access to the API tenants reader user to the shared database for the new environment
5. Create new branch for the env in external-combocurve-docs
6. Register a new custom subdomain for the project
    * Add it from App Engine > Settings
    * It will ask you to add the CNAME record for the subdomain in the DNS provider (GoDaddy)
7. Deploy the endpoints service locally for the first time: `API_TENANTS_READER_CS=abc123 sh ./apps/build.sh carbon && gcloud endpoints services deploy openapi-spec-"$ENV_PREFIX".yaml --project $PROJECT_ID`
8. Push carbon branch in external-combocurve, matching PR
9. Create PR in main-combocurve, to update the API_PROVISIONER_SERVICE_URL to the new deployed CR

## Protocol Buffers

The services in this repo use protocol buffers for the Data Access Layer (DAL). The workflow to set this up locally consist of 2 parts:

1. Download the latest proto. [Read more](./proto/README.md).
2. Generate code from the latest proto. [Read more](./src/gen/README.md).

## Development

### Running

To run this server, the configured address for the DAL server must be reachable. See [main-combocurve:apps/dal](https://github.com/insidepetroleum/main-combocurve/tree/master/apps/dal) for more instructions.

To start the development server:

```
npm run dev
```

### REPL

```
npm run repl
```

This command will start a node REPL with `context` preloaded as a global. The REPL supports loading TypeScript modules, and it runs in inspect mode so the VSCode debugger can be attached.

### Tests

Unit tests use [jest](https://jestjs.io/). To run:

```
npm run test
```

There's also watch mode: `npm run test:watch`

#### Integration tests

To trigger the integration tests in cloud build. Run:

```sh
bash ./scripts/trigger-integration-tests.sh <API_URL> <TENANT_NAME>

# For example for test
bash ./scripts/trigger-integration-tests.sh https://test-api.combocurve.com integration4test
```

## VSCode

### Useful extensions

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)


### Recommended user settings

```json
{
	"editor.rulers": [120],
	"[javascript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},
	"[json]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	},
	"editor.detectIndentation": false,
	"editor.insertSpaces": false,
	"[typescript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode",
		"editor.formatOnSave": true
	}
}
```
