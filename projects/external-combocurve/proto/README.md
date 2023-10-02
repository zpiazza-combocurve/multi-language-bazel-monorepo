# proto

This directory is reserved for downloading protocol buffers (`.proto`). Such files are not version controlled on this repo. Instead, they should be downloaded from the [Buf Schema Registry (BSR)](https://buf.build/combocurve).

## Requirements

1. Install dependencies in the root package of this repo:

    ```bash
    npm install
    ```

## Downloading

2. To download the latest proto published on `master`:

    ```bash
    npm run proto:stable
    ```

    It's also possible to download proto from a pull request:

    ```bash
    npm run proto -- buf.build/combocurve/dal:5298/merge
    ```

    Replace `5298` by the actual pull request number that contains the version of proto that you want to download.

## Troubleshooting

In the case you get blocked trying to download `.proto` files from the BSR, there is the workaround of copying the contents of the `proto` directory from [main-combocurve](https://github.com/insidepetroleum/main-combocurve/tree/master/proto).

## Resources

- [Speeding up development with BSR drafts](https://buf.build/blog/speeding-up-with-drafts)
