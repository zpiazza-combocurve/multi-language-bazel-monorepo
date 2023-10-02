# Performance Tests
Using [Artillery](https://artillery.io/)

## Usage
Run a test scenario:
```bash
npm run performance -- v1/wells/load.yaml -e dev # dev, test, stage
```

Generate HTML report:
```bash
npm run performance:report
```
Will generate `report.html`

## Setting credentials
Credentials for local testing can be set as environment variables in `.env`, which is ignored from version control:
```bash
API_TESTS_TOKEN=abcdefghijklmnopqrstuvwxyz
API_TESTS_KEY=0123456789
```

## Adding scenarios
New scenarios can be added under `scenarios`. Use the existing ones as reference.

## Resources
- [Artillery Documentation](https://artillery.io/docs/guides/overview/welcome.html#Stay-in-touch)
- [Artillery Blog Post](https://artillery.io/blog/end-to-end-performance-testing-microservices)
