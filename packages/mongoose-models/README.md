# @combocurve/mongoose-models

Shared mongoose schemas/models

## Usage

Use `@combocurve/mongoose-models`

```typescript
import { registerModels } from '@combocurve/mongoose-models';
import mongoose from 'mongoose';

const db = mongoose.createConnection(/*...*/);

const { ProjectModel } = registerModels(db);
```
