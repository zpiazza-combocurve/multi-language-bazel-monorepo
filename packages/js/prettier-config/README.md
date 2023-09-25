# @combocurve/prettier-config

Prettier preset for combocurve projects.

-   `@combocurve/prettier-config` - default config, only configures plugins, uses prettier default config for other options
-   `@combocurve/prettier-config/single-quotes` - same as default, but uses single quotes

## Usage

See https://prettier.io/docs/en/configuration.html#sharing-configurations

```json
// package.json
{
	"prettier": "@combocurve/prettier-config"
}
```

or

```js
// .prettierrc.js
module.exports = {
	...require('@combocurve/prettier-config'),
	// override any options here
};
```

## EditorConfig

Prettier supports [EditorConfig](https://editorconfig.org/). Example editorconfig files:

-   spaces:

```bash
cat <<EOF >.editorconfig
root = true

[*]
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
EOF
```

-   tabs:

```bash
cat <<EOF >.editorconfig
root = true

[*]
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = tab
indent_size = 2
EOF
```
