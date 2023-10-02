# src/gen

This directory is reserved for generated code from protocol buffers only. All generated code should be ignored from version control.

## Requirements

1. Install dependencies in the root package of this repo:

    ```bash
    npm install
    ```

2. Before generating code, make sure the latest proto files have been downloaded. For instructions on how to download the latest proto see the [README in `/proto`](../../proto/README.md).


## Generating

3. For generating code from the downloaded proto:

    ```bash
    npm run gen
    ```

The configuration for code generation can be found in [buf.gen.yaml](../../buf.gen.yaml).

## Resources

- This repo uses the following for code generation:
    - Protobuf plugin [stephenh/ts-proto](https://github.com/stephenh/ts-proto)
    - Buf plugin [community/stephenh-ts-proto](https://buf.build/community/stephenh-ts-proto)
