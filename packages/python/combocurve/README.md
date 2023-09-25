# combocurve/gen

This directory is reserved for generated code from protocol buffers only. All generated code should be ignored from version control.

## Requirements

Before generating code, make sure the latest proto files have been downloaded. For instructions on how to download the latest proto see the [README in `/proto`](../../proto/README.md).

Also make sure that you have installed the dependencies in the root package of this repo:

```bash
poetry install
```

## Generating

For generating code from the downloaded proto:

```bash
poetry run poe gen-common
poetry run poe gen-dal
```

## Caveats

### Imports in generated code resulting in "ImportError: No module named ..."

**Problem**:

For details on this issue, see [python: use relative imports in generated modules #1491](https://github.com/protocolbuffers/protobuf/issues/1491)

**Workaround**:

Basically, had to create a symlink so the generated modules can be correctly imported from other packages.

```
cd combocurve/dal
ln -s ../gen/combocurve/dal/v1 v1
```
```
cd combocurve/common                       
ln -s ../gen/combocurve/common/v1 v1
```

And added the created symlink to version control. After that, the python package structure matches the proto package structure, that was initially under nested under `combocurve/gen`.

## Resources

- This repo uses the following protobuf plugin for code generation: [nipunn1313/mypy-protobuf](https://github.com/nipunn1313/mypy-protobuf)
