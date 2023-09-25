# @combocurve/dotenv-secrets

This module is similar to dotenv, with one extra skill: It detect secret dependencies declared in .env.tpl and will load the from GCP Secret Manager

## Usage

Create a .env.tpl file with some content:

```
MONGO_DATABASE=secret:dbName
MONGO_HOST=secret:dbCluster
MONGO_PASSWORD=secret:dbPassword
MONGO_USER=secret:dbUsername
NODE_ENV=default:development
```

There are several ways to use the module:

### Directly using the cli

Prefix the command with `dotenv-secrets`, eg in the package.json:

```json
{
	"scripts": {
		"dev": "dotenv-secrets ts-node src/server.ts"
	}
}
```

### From javascript

Similar as dotenv, but call this module instead.

```javascript
const { config } = require('@combocurve/dotenv-secrets');

config()
	.then(() => require('./server'))
	.catch((error) => console.error(error));
```

### Using the --import flag

Alternatively on latest versions of node (v20.0.0) you can use the --import flag https://nodejs.org/api/cli.html#--importmodule

```shell
node --import=@combocurve/dotenv-secrets src/server
# should also work with ts-node and babel
```
