# DAL - TypeScript Client

Proof of concept of gRPC client written in TypeScript.

## Dependencies

```bash
yarn
```

## Generating code from .proto files

```bash
yarn build:proto
```

# Running the client

```bash
yarn test
```

## Reference

### Protocol Buffers

-   [ts-proto](https://github.com/stephenh/ts-proto)

### gRPC

-   [gRPC Languages - Node](https://grpc.io/docs/languages/node/)
-   [nice-grpc](https://github.com/deeplay-io/nice-grpc)

### Known Issues

-   [Response message parsing error: util.Long is not a constructor](https://github.com/protobufjs/protobuf.js/issues/1745#issuecomment-1517058873)
