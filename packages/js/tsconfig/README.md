# @combocurve/tsconfig

Shared TypeScript configuration for ComboCurve projects.

-   @combocurve/tsconfig - Shared config for TypeScript projects. Targets node 18.
-   @combocurve/tsconfig/package - Config for shared packages, will output .map and .d.ts files.

## Usage

Add it to your `devDependencies`:

```json
{
	"devDependencies": {
		"@combocurve/tsconfig": "workspace:*"
	}
}
```

Then extend it in your `tsconfig.json`:

```json
{
	"extends": "@combocurve/tsconfig"
}
```
