# @combocurve/types

Shared type definitions for db schemas

## Usage

Use `@combocurve/types/<client|server>`

```typescript
import { Project, Well } from '@combocurve/types/client';

// import { Project, Well } from '@combocurve/types/server';

const project: Project = {};
```

## Contributing

Naming convention: same name as the mongoose collection name but PascalCase and singular.

Eg. `forecasts` -> `Forecast`, `forecast-buckets` -> `ForecastBucket`
