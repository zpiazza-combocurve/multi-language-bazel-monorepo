import express from 'express';

import { apiUserResolver } from '@src/middleware/api-user-resolver';
import { contextResolver } from '@src/middleware/context-resolver';

import { ApiContextV1 } from './context';
import customColumns from './custom-columns/routes';
import dailyProductions from './daily-productions/routes';
import directionalSurveys from './directional-surveys/routes';
import econRuns from './econ-runs/routes';
import monthlyProductions from './monthly-productions/routes';
import ownershipQualifiers from './ownership-qualifiers/routes';
import projects from './projects/routes';
import tags from './tags/routes';
import wellComments from './well-comments/routes';
import wellMappings from './well-mappings/routes';
import wells from './wells/routes';
import wellsIdentifier from './wells/identifier/routes';

const v1 = express();

v1.use(contextResolver(ApiContextV1));
v1.use(apiUserResolver());

v1.use('/wells', wells);
v1.use('/wells-identifiers', wellsIdentifier);
v1.use('/monthly-productions', monthlyProductions);
v1.use('/daily-productions', dailyProductions);
v1.use('/projects', projects);
v1.use('/ownership-qualifiers', ownershipQualifiers);
v1.use('/well-comments', wellComments);
v1.use('/tags', tags);
v1.use('/well-mappings', wellMappings);
v1.use('/econ-runs', econRuns);
v1.use('/directional-surveys', directionalSurveys);
v1.use('/custom-columns', customColumns);

export default v1;
